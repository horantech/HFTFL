import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSms, buildGuestMessage, isSmsConfigured } from "@/lib/sms";

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
    // Require either the sponsor or the guest themselves to be marked paid.
    if (!sponsor?.paid && !g.paid) {
      return NextResponse.json({ error: "Neither the sponsor nor the guest is marked paid" }, { status: 400 });
    }

    const res = await sendSms(g.phone, buildGuestMessage({ name: g.name, code: g.ticketCode, tableNumber: sponsor.tableNumber }));
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });
    await db.update(guests).set({ smsSentAt: new Date() }).where(eq(guests.id, id));
    return NextResponse.json({ ok: true, sid: res.sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
