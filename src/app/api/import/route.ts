import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

const Body = z.object({
  mode: z.enum(["existing", "new", "individuals"]),
  sponsorId: z.string().uuid().optional(),
  newSponsorName: z.string().optional(),
  rows: z.array(z.record(z.string(), z.string().nullable().optional())).max(5000),
});

function pick(row: Record<string, string | null | undefined>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const v = parsed.data;
  let sponsorCreated: string | null = null;

  // Mode 1: existing sponsor
  if (v.mode === "existing") {
    if (!v.sponsorId) return NextResponse.json({ error: "sponsorId required" }, { status: 400 });
    const [sponsor] = await db
      .select({ id: sponsors.id })
      .from(sponsors)
      .where(eq(sponsors.id, v.sponsorId))
      .limit(1);
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });

    const created = await insertGuests(v.sponsorId, v.rows);
    return NextResponse.json({ ok: true, created });
  }

  // Mode 2: new sponsor
  if (v.mode === "new") {
    const name = v.newSponsorName?.trim();
    if (!name) return NextResponse.json({ error: "newSponsorName required" }, { status: 400 });
    const [sp] = await db.insert(sponsors).values({ name }).returning({ id: sponsors.id });
    sponsorCreated = name;
    const created = await insertGuests(sp.id, v.rows);
    return NextResponse.json({ ok: true, created, sponsorCreated });
  }

  // Mode 3: each row is its own individual
  let created = 0;
  for (const row of v.rows) {
    const name = pick(row, "name", "full name", "guest", "guest name");
    if (!name) continue;
    const phone = normalizePhone(pick(row, "phone", "phone number", "mobile", "tel"));
    const email = pick(row, "email", "e-mail");
    const scheduled = pick(row, "scheduled");
    const paid = pick(row, "paid");
    const notes = pick(row, "notes", "note");
    const [sp] = await db
      .insert(sponsors)
      .values({ name, isIndividual: true, contactPhone: phone })
      .returning({ id: sponsors.id });
    await db.insert(guests).values({
      sponsorId: sp.id, name, phone, email, scheduled, paid, notes,
    });
    created++;
  }
  return NextResponse.json({ ok: true, created });
}

async function insertGuests(sponsorId: string, rows: Array<Record<string, string | null | undefined>>) {
  let created = 0;
  for (const row of rows) {
    const name = pick(row, "name", "full name", "guest", "guest name");
    if (!name) continue;
    await db.insert(guests).values({
      sponsorId,
      name,
      phone: normalizePhone(pick(row, "phone", "phone number", "mobile", "tel")),
      email: pick(row, "email", "e-mail"),
      scheduled: pick(row, "scheduled"),
      paid: pick(row, "paid"),
      notes: pick(row, "notes", "note"),
    });
    created++;
  }
  return created;
}
