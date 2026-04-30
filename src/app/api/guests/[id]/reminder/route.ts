import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSms, buildReminderMessage, isSmsConfigured } from "@/lib/sms";

// Send a reminder SMS to a single guest. Useful when the bulk send missed
// someone or for an ad-hoc nudge. The guest must be paid (or under a paid
// sponsor) and must have a phone number.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });

    const [g] = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
    if (!g) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    if (!g.phone) return NextResponse.json({ error: "Guest has no phone number" }, { status: 400 });

    const [sponsor] = await db
      .select({ paid: sponsors.paid, tableNumber: sponsors.tableNumber })
      .from(sponsors)
      .where(eq(sponsors.id, g.sponsorId))
      .limit(1);
    if (!sponsor?.paid && !g.paid) {
      return NextResponse.json({ error: "Neither the sponsor nor the guest is marked paid" }, { status: 400 });
    }

    const res = await sendSms(
      g.phone,
      buildReminderMessage({ name: g.name, code: g.shortCode ?? g.ticketCode, tableNumber: sponsor?.tableNumber }),
    );
    if (!res.ok) {
      await db.update(guests).set({ smsLastStatus: "failed", smsLastError: res.error.slice(0, 500) }).where(eq(guests.id, g.id));
      return NextResponse.json({ error: res.error }, { status: 502 });
    }
    await db.update(guests).set({ smsSentAt: new Date(), smsLastStatus: "sent", smsLastError: null }).where(eq(guests.id, g.id));
    return NextResponse.json({ ok: true, sid: res.sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
