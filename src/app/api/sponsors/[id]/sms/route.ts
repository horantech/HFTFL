import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSms, buildGuestMessage, buildSponsorMessage, isSmsConfigured } from "@/lib/sms";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });
  const url = new URL(req.url);
  const onlyPending = url.searchParams.get("onlyPending") === "1";

  const sponsor = await db.query.sponsors.findFirst({ where: eq(sponsors.id, id) });
  if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });

  const list = await db
    .select()
    .from(guests)
    .where(onlyPending
      ? // pending = no SMS sent yet
        // (we still want guests with phones)
        (eq(guests.sponsorId, id))
      : eq(guests.sponsorId, id));

  let sent = 0, failed = 0;
  const sentIds: string[] = [];

  for (const g of list) {
    if (!g.phone) continue;
    if (onlyPending && g.smsSentAt) continue;
    const res = await sendSms(g.phone, buildGuestMessage({ name: g.name, code: g.ticketCode }));
    if (res.ok) { sent++; sentIds.push(g.id); }
    else { failed++; }
  }

  if (sponsor.contactPhone && !sponsor.isIndividual) {
    const res = await sendSms(
      sponsor.contactPhone,
      buildSponsorMessage({ name: sponsor.name, guestCount: list.length, firstCode: list[0]?.ticketCode }),
    );
    if (res.ok) sent++;
    else failed++;
  }

  if (sentIds.length > 0) {
    for (const gid of sentIds) {
      await db.update(guests).set({ smsSentAt: new Date() }).where(eq(guests.id, gid));
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
