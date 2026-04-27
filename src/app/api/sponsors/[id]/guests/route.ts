import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";
import { sendTicketToGuest } from "@/lib/notify";

const Body = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sponsor] = await db
    .select({ id: sponsors.id, paid: sponsors.paid })
    .from(sponsors)
    .where(eq(sponsors.id, id))
    .limit(1);
  if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const v = parsed.data;

  const [row] = await db
    .insert(guests)
    .values({
      sponsorId: id,
      name: v.name.trim(),
      phone: normalizePhone(v.phone),
      email: v.email?.trim() || null,
    })
    .returning({ id: guests.id, ticketCode: guests.ticketCode });

  if (sponsor.paid) {
    await sendTicketToGuest(row.id);
  }

  return NextResponse.json({ ok: true, id: row.id, ticketCode: row.ticketCode });
}
