import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";
import { sendTicketsForSponsor } from "@/lib/notify";

const Body = z.object({
  name: z.string().min(1).max(200),
  contactPhone: z.string().max(40).optional().nullable(),
  contactEmail: z.string().max(200).optional().nullable(),
  isIndividual: z.boolean().optional().default(false),
  paid: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
  bank: z.string().max(200).optional().nullable(),
  assignedTo: z.string().max(200).optional().nullable(),
  rsvp: z.string().max(20).optional().nullable(),
  guests: z.array(z.object({
    name: z.string().min(1).max(200),
    phone: z.string().max(40).optional().nullable(),
    whatsappPhone: z.string().max(40).optional().nullable(),
    email: z.string().max(200).optional().nullable(),
  })).optional().default([]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const v = parsed.data;
  const [row] = await db
    .insert(sponsors)
    .values({
      name: v.name.trim(),
      contactPhone: normalizePhone(v.contactPhone),
      contactEmail: v.contactEmail?.trim() || null,
      isIndividual: v.isIndividual ?? false,
      paid: v.paid ?? false,
      notes: v.notes?.trim() || null,
      bank: v.bank?.trim() || null,
      assignedTo: v.assignedTo?.trim() || null,
      rsvp: v.rsvp || null,
    })
    .returning({ id: sponsors.id });

  if (v.guests.length > 0) {
    await db.insert(guests).values(
      v.guests
        .filter(g => g.name && g.name.trim().length > 0)
        .map(g => ({
          sponsorId: row.id,
          name: g.name.trim(),
          phone: normalizePhone(g.phone),
          whatsappPhone: normalizePhone(g.whatsappPhone),
          email: g.email?.trim() || null,
        })),
    );
  }

  if (v.paid) {
    await sendTicketsForSponsor(row.id);
  }

  return NextResponse.json({ ok: true, id: row.id });
}
