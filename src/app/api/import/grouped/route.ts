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
  fullName: string;
  companyName: string;
  assignedPerson: string;
  phone: string;
  email: string;
  whatsapp: string;
  tableNumber: string;
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
  sponsorType: "representative" | "company";
  isIndividual: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  paid: boolean;
  assignedTo: string | null;
  bank: string | null;
  tableNumber: string | null;
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

// Fixed positional column layout. Paste from Excel must follow this column order
// (matching the master spreadsheet template). A header row, if present, is auto-skipped.
//
//   0: Full Name      | 1: Company Name | 2: Assigned Person | 3: Phone No
//   4: Email          | 5: WhatsApp     | 6: Table No.       | 7: RSVP Status
//   8: Guest Count    | 9: Payment Status | 10: BANK

function parseTsv(text: string): { rows: string[][]; autoShifted: boolean } {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return { rows: [], autoShifted: false };

  // Auto-skip a header row if the first line's first cell looks like a header label.
  const firstCell = (lines[0].split("\t")[0] || "").trim().toLowerCase();
  const isHeader = /^(full\s*name|name|guest(\s*name)?|n0|no\.?|#)$/.test(firstCell);
  const dataLines = isHeader ? lines.slice(1) : lines;

  let rows = dataLines.map(line => line.split("\t"));

  // Detect a row-number column at position 0: if most rows have an empty or short-numeric
  // first cell AND a non-empty second cell, drop column 0. This handles pastes that
  // accidentally include the spreadsheet's row-number column.
  let autoShifted = false;
  if (rows.length >= 2) {
    const matches = rows.filter(r => {
      const c0 = (r[0] ?? "").trim();
      const c1 = (r[1] ?? "").trim();
      return (c0 === "" || /^\d{1,4}$/.test(c0)) && c1.length > 0;
    }).length;
    if (matches / rows.length >= 0.6) {
      rows = rows.map(r => r.slice(1));
      autoShifted = true;
    }
  }

  return { rows, autoShifted };
}

function buildRows(data: string[][]): Row[] {
  return data.map((cells, i) => ({
    rowIndex: i + 1,
    fullName: (cells[0] ?? "").trim(),
    companyName: (cells[1] ?? "").trim(),
    assignedPerson: (cells[2] ?? "").trim(),
    phone: (cells[3] ?? "").trim(),
    email: (cells[4] ?? "").trim(),
    whatsapp: (cells[5] ?? "").trim(),
    tableNumber: (cells[6] ?? "").trim(),
    rsvpStatus: (cells[7] ?? "").trim(),
    guestCount: (cells[8] ?? "").trim(),
    paymentStatus: (cells[9] ?? "").trim(),
    bank: (cells[10] ?? "").trim(),
  }));
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

    const hasName = !!row.fullName.trim();
    const hasCompany = !!row.companyName.trim();
    const hasContact = !!row.phone.trim() || !!row.email.trim();
    const hasMeta = !!row.rsvpStatus.trim() || !!row.paymentStatus.trim() || !!row.bank.trim();
    const hasAnyData = hasName || hasCompany || hasContact || hasMeta;

    if (!hasAnyData) continue;

    // Blank-name rows: treat as placeholder seat slots under the previous sponsor.
    // This mirrors the "number of seats" behavior in NewSponsorForm — the seat is reserved
    // even before the guest name is known.
    if (!hasName) {
      const last = list[list.length - 1];
      if (!last || inIndividualSection) continue; // nothing to attach to
      const wa = extractWhatsapp(row.whatsapp);
      if (isPaid(row.paymentStatus)) last.paid = true;
      if (!last.bank && row.bank.trim()) last.bank = row.bank.trim();
      if (wa.givenTickets && !last.notes?.includes("Given tickets")) {
        last.notes = [last.notes, "Given tickets"].filter(Boolean).join(" · ");
      }
      const r = bumpRsvp(row.rsvpStatus);
      last.rsvpYes += r.yes; last.rsvpNo += r.no; last.rsvpPending += r.pending;

      last.guests.push({
        name: `Guest ${last.guests.length + 1}`,
        phone: null,
        whatsappPhone: null,
        email: null,
        scheduled: row.rsvpStatus.trim() || null,
      });
      if (!last.hasExplicitCount) last.ticketsBought += 1;
      continue;
    }

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
          sponsorType: "representative",
          isIndividual: true,
          contactPhone: normalizePhone(row.phone) || null,
          contactEmail: row.email.trim() || null,
          paid: isPaid(row.paymentStatus),
          assignedTo: row.assignedPerson.trim() || null,
          bank: row.bank.trim() || null,
          tableNumber: row.tableNumber.trim() || null,
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
        // Filler row — repeated lead name. Treat as placeholder seats so the guest count
        // reflects the row count, matching the registration form's "N seats = N guests".
        for (let i = 0; i < additions; i++) {
          last.guests.push({
            name: `Guest ${last.guests.length + 1}`,
            phone: null,
            whatsappPhone: null,
            email: null,
            scheduled: row.rsvpStatus.trim() || null,
          });
        }
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
    // Type rule: Company only when Full Name == Company Name (case-insensitive, trimmed).
    // Anything else is a Representative — the named person attends as Guest 1.
    const namesMatch = isRealCompany &&
      row.companyName.trim().toLowerCase() === leadName.toLowerCase();
    const resolvedType: "representative" | "company" = namesMatch ? "company" : "representative";
    // Representative → sponsor record is named after the person (the rep), not the org.
    //   The company name (if any) is preserved in notes so it stays visible.
    // Company → sponsor record is named after the company.
    const sponsorName = resolvedType === "company" ? row.companyName.trim() : leadName;
    const repsFor = (resolvedType === "representative" && isRealCompany)
      ? `Represents ${row.companyName.trim()}`
      : null;
    const names = expandQuantity(leadName);
    const ticketCount = hasExplicitCount ? explicitCount : (qtyFromCompany ?? names.length);
    const r = bumpRsvp(row.rsvpStatus);
    // Representative → lead person attends as Guest 1 (with their contact info).
    // Company → no auto-attendance; only continuation rows fill the seats.
    const initialGuests = resolvedType === "representative" ? names.map(baseGuest) : [];
    const notes = [repsFor, wa.givenTickets ? "Given tickets" : null].filter(Boolean).join(" · ") || null;
    list.push({
      name: sponsorName,
      leadName,
      sponsorType: resolvedType,
      isIndividual: false,
      contactPhone: normalizePhone(row.phone) || null,
      contactEmail: row.email.trim() || null,
      paid: isPaid(row.paymentStatus),
      assignedTo: row.assignedPerson.trim() || null,
      bank: row.bank.trim() || null,
      tableNumber: row.tableNumber.trim() || null,
      notes,
      ticketsBought: ticketCount,
      hasExplicitCount,
      rsvpYes: r.yes, rsvpNo: r.no, rsvpPending: r.pending,
      guests: initialGuests,
    });
  }

  // Cross-check resolved guest count vs explicit Guest Count
  for (const s of list) {
    if (s.hasExplicitCount && s.ticketsBought !== s.guests.length) {
      warnings.push(
        `${s.name}: Guest Count says ${s.ticketsBought} but ${s.guests.length} row${s.guests.length === 1 ? "" : "s"} resolved. Review before importing.`,
      );
    }
  }

  return { sponsors: list, warnings };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { tsv, commit } = parsed.data;
  const { rows: data, autoShifted } = parseTsv(tsv);
  if (data.length === 0) return NextResponse.json({ error: "No rows to parse" }, { status: 400 });

  const rows = buildRows(data);
  const plan = buildPlan(rows);
  if (autoShifted) {
    plan.warnings.unshift("Detected a row-number column in your paste — auto-shifted to align with the template.");
  }

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
      sponsorType: s.sponsorType,
      paid: s.paid,
      assignedTo: s.assignedTo,
      bank: s.bank,
      tableNumber: s.tableNumber,
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
