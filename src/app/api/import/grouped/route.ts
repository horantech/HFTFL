import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

const Body = z.object({
  tsv: z.string().min(1),
  commit: z.boolean().optional().default(false),
});

type Row = {
  rowIndex: number;
  n0: string;
  fullName: string;
  companyName: string;
  assignedPerson: string;
  phone: string;
  email: string;
  whatsapp: string;
  rsvpStatus: string;
  guestCount: string;
  paymentStatus: string;
  bank: string;
};

type PlannedGuest = {
  name: string;
  phone: string | null;
  whatsappPhone: string | null;
  email: string | null;
  scheduled: string | null;
};

type PlannedSponsor = {
  name: string;
  leadName: string;
  isIndividual: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  paid: boolean;
  assignedTo: string | null;
  bank: string | null;
  notes: string | null;
  ticketsBought: number;
  hasExplicitCount: boolean;
  rsvpYes: number;
  rsvpNo: number;
  rsvpPending: number;
  guests: PlannedGuest[];
};

type Plan = {
  sponsors: PlannedSponsor[];
  warnings: string[];
};

const HEADER_ALIASES: Record<string, keyof Row> = {
  "n0": "n0", "no": "n0", "no.": "n0", "#": "n0",
  "full name": "fullName", "name": "fullName", "guest": "fullName", "guest name": "fullName",
  "company name": "companyName", "company": "companyName",
  "assigned person": "assignedPerson", "assigned": "assignedPerson", "assignee": "assignedPerson",
  "phone no": "phone", "phone": "phone", "phone number": "phone", "mobile": "phone",
  "email": "email", "e-mail": "email",
  "whatsapp": "whatsapp",
  "ticket no.": "rsvpStatus" as keyof Row, // unused, but parsed
  "rsvp status": "rsvpStatus", "rsvp": "rsvpStatus", "scheduled": "rsvpStatus",
  "guest count": "guestCount",
  "payment status": "paymentStatus", "payment": "paymentStatus", "paid": "paymentStatus",
  "bank": "bank",
};

function parseTsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  // Find header line: the first line containing "name" or "full name"
  let headerIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (/full\s*name/.test(lower) || /\bname\b/.test(lower)) { headerIdx = i; break; }
  }
  const split = (line: string) => line.split("\t");
  const headers = split(lines[headerIdx]).map(h => h.trim().toLowerCase());
  const rows = lines.slice(headerIdx + 1).map(split);
  return { headers, rows };
}

function buildRows(headers: string[], data: string[][]): Row[] {
  const empty: Row = {
    rowIndex: 0, n0: "", fullName: "", companyName: "", assignedPerson: "",
    phone: "", email: "", whatsapp: "", rsvpStatus: "",
    guestCount: "", paymentStatus: "", bank: "",
  };
  const fieldMap = headers.map(h => HEADER_ALIASES[h] || null);
  return data.map((cells, i) => {
    const r: Row = { ...empty, rowIndex: i + 1 };
    for (let c = 0; c < headers.length; c++) {
      const v = (cells[c] ?? "").trim();
      const k = fieldMap[c];
      if (k && k !== "rowIndex") {
        (r as Record<keyof Row, string | number>)[k] = v;
      }
    }
    return r;
  });
}

function isPaid(s: string): boolean {
  if (!s) return false;
  if (/unpaid/i.test(s)) return false;
  return /paid/i.test(s);
}

function expandQuantity(name: string): string[] {
  const m = name.match(/^(.+?)\s+[xX×](\d+)\s*$/);
  if (m) {
    const base = m[1].trim();
    const n = parseInt(m[2], 10);
    if (n > 0 && n < 50) return Array(n).fill(base);
  }
  return [name];
}

function quantityFromCompany(companyName: string): number | null {
  const m = companyName.trim().match(/^[xX×](\d+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n > 0 && n < 50) return n;
  }
  return null;
}

function bumpRsvp(s: string): { yes: number; no: number; pending: number } {
  const t = s.trim().toLowerCase();
  if (t === "yes") return { yes: 1, no: 0, pending: 0 };
  if (t === "no") return { yes: 0, no: 1, pending: 0 };
  if (t === "pending") return { yes: 0, no: 0, pending: 1 };
  return { yes: 0, no: 0, pending: 0 };
}

function normalizeNameKey(name: string): string {
  return name.toLowerCase().replace(/[\s\/.,]+/g, "").replace(/[^\w]/g, "");
}

function looksLikePhoneInN0(s: string): boolean {
  if (!s) return false;
  const digits = s.replace(/\D/g, "");
  return digits.length >= 8;
}

function extractWhatsapp(s: string): { whatsapp: string | null; givenTickets: boolean } {
  if (!s) return { whatsapp: null, givenTickets: false };
  if (/given\s*tickets?/i.test(s)) return { whatsapp: null, givenTickets: true };
  return { whatsapp: normalizePhone(s), givenTickets: false };
}

function buildPlan(rows: Row[]): Plan {
  const warnings: string[] = [];
  const list: PlannedSponsor[] = [];
  let inIndividualSection = false;

  for (const row of rows) {
    // Section header
    if (/^individual\s+ticket/i.test(row.fullName.trim())) {
      inIndividualSection = true;
      continue;
    }

    // Detect misplaced phone in N0 column
    if (looksLikePhoneInN0(row.n0)) {
      warnings.push(`Row ${row.rowIndex}: phone-like value "${row.n0}" in N0 column — skipped`);
      continue;
    }

    const hasName = !!row.fullName.trim();
    const hasCompany = !!row.companyName.trim();
    const hasAnyData = hasName || hasCompany || !!row.phone.trim() || !!row.email.trim();

    if (!hasAnyData) continue;
    if (!hasName) continue; // can't make a guest without a name

    const wa = extractWhatsapp(row.whatsapp);
    const baseGuest = (name: string): PlannedGuest => ({
      name,
      phone: normalizePhone(row.phone) || null,
      whatsappPhone: wa.whatsapp,
      email: row.email.trim() || null,
      scheduled: row.rsvpStatus.trim() || null,
    });

    if (inIndividualSection) {
      const names = expandQuantity(row.fullName.trim());
      for (const name of names) {
        const r = bumpRsvp(row.rsvpStatus);
        list.push({
          name,
          leadName: name,
          isIndividual: true,
          contactPhone: normalizePhone(row.phone) || null,
          contactEmail: row.email.trim() || null,
          paid: isPaid(row.paymentStatus),
          assignedTo: row.assignedPerson.trim() || null,
          bank: row.bank.trim() || null,
          notes: wa.givenTickets ? "Given tickets" : null,
          ticketsBought: 1,
          hasExplicitCount: false,
          rsvpYes: r.yes, rsvpNo: r.no, rsvpPending: r.pending,
          guests: [baseGuest(name)],
        });
      }
      continue;
    }

    // Detect "new sponsor group" signals
    const qtyFromCompany = quantityFromCompany(row.companyName);
    const isRealCompany = hasCompany && qtyFromCompany === null;
    const hasAssigned = !!row.assignedPerson.trim();
    const explicitCount = parseInt(row.guestCount.trim() || "0", 10);
    const hasExplicitCount = explicitCount > 0;
    const startsNewGroup = isRealCompany || hasAssigned || hasExplicitCount;

    const last = list[list.length - 1];

    if (last && !startsNewGroup) {
      // Continuation row — could be a placeholder OR a named guest under the previous sponsor
      const isPlaceholder = normalizeNameKey(row.fullName) === normalizeNameKey(last.leadName);
      const additions = qtyFromCompany ?? 1;

      if (isPaid(row.paymentStatus)) last.paid = true;
      if (!last.bank && row.bank.trim()) last.bank = row.bank.trim();
      if (wa.givenTickets && !last.notes?.includes("Given tickets")) {
        last.notes = [last.notes, "Given tickets"].filter(Boolean).join(" · ");
      }
      const r = bumpRsvp(row.rsvpStatus);
      last.rsvpYes += r.yes; last.rsvpNo += r.no; last.rsvpPending += r.pending;

      if (isPlaceholder) {
        // Filler row — increase ticket count, don't add duplicate guest
        if (!last.hasExplicitCount) last.ticketsBought += additions;
      } else {
        // Named guest under current sponsor
        const names = expandQuantity(row.fullName.trim());
        for (const name of names) last.guests.push(baseGuest(name));
        if (!last.hasExplicitCount) last.ticketsBought += names.length;
      }
      continue;
    }

    // Brand new sponsor group
    const leadName = row.fullName.trim();
    const sponsorName = isRealCompany ? row.companyName.trim() : leadName;
    const names = expandQuantity(leadName);
    const ticketCount = hasExplicitCount ? explicitCount : (qtyFromCompany ?? names.length);
    const r = bumpRsvp(row.rsvpStatus);
    // When sponsor name equals the lead person's name (no separate company), the lead is the
    // buyer themselves — don't duplicate them as a guest. When there's a real company name, the
    // lead is a person attending under that company, so they ARE a guest.
    const initialGuests = isRealCompany ? names.map(baseGuest) : [];
    list.push({
      name: sponsorName,
      leadName,
      isIndividual: false,
      contactPhone: normalizePhone(row.phone) || null,
      contactEmail: row.email.trim() || null,
      paid: isPaid(row.paymentStatus),
      assignedTo: row.assignedPerson.trim() || null,
      bank: row.bank.trim() || null,
      notes: wa.givenTickets ? "Given tickets" : null,
      ticketsBought: ticketCount,
      hasExplicitCount,
      rsvpYes: r.yes, rsvpNo: r.no, rsvpPending: r.pending,
      guests: initialGuests,
    });
  }

  return { sponsors: list, warnings };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { tsv, commit } = parsed.data;
  const { headers, rows: data } = parseTsv(tsv);
  if (headers.length === 0) return NextResponse.json({ error: "Could not find header row" }, { status: 400 });

  const rows = buildRows(headers, data);
  const plan = buildPlan(rows);

  if (!commit) {
    return NextResponse.json({ ok: true, plan });
  }

  let createdSponsors = 0;
  let createdGuests = 0;
  for (const s of plan.sponsors) {
    const slotsNote = s.ticketsBought > s.guests.length
      ? `Tickets bought: ${s.ticketsBought}`
      : null;
    const finalNotes = [s.notes, slotsNote].filter(Boolean).join(" · ") || null;

    const [row] = await db.insert(sponsors).values({
      name: s.name,
      contactPhone: s.contactPhone,
      contactEmail: s.contactEmail,
      isIndividual: s.isIndividual,
      paid: s.paid,
      assignedTo: s.assignedTo,
      bank: s.bank,
      notes: finalNotes,
    }).returning({ id: sponsors.id });
    createdSponsors++;

    if (s.guests.length > 0) {
      await db.insert(guests).values(
        s.guests.map(g => ({
          sponsorId: row.id,
          name: g.name,
          phone: g.phone,
          whatsappPhone: g.whatsappPhone,
          email: g.email,
          scheduled: g.scheduled,
        })),
      );
      createdGuests += s.guests.length;
    }
  }

  return NextResponse.json({
    ok: true,
    createdSponsors,
    createdGuests,
    warnings: plan.warnings,
  });
}
