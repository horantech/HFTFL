import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSms, buildGuestMessage, isSmsConfigured } from "@/lib/sms";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });
    const url = new URL(req.url);
    const onlyPending = url.searchParams.get("onlyPending") === "1";

    const [sponsor] = await db
      .select({
        paid: sponsors.paid,
        tableNumber: sponsors.tableNumber,
      })
      .from(sponsors)
      .where(eq(sponsors.id, id))
      .limit(1);
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    if (!sponsor.paid) return NextResponse.json({ error: "Sponsor is not paid" }, { status: 400 });

    const list = await db
      .select()
      .from(guests)
      .where(eq(guests.sponsorId, id));

    let sent = 0, failed = 0;
    const sentIds: string[] = [];

    for (const g of list) {
      if (!g.phone) continue;
      if (onlyPending && g.smsSentAt) continue;
      const res = await sendSms(g.phone, buildGuestMessage({ name: g.name, code: g.ticketCode, tableNumber: sponsor.tableNumber }));
      if (res.ok) { sent++; sentIds.push(g.id); }
      else { failed++; }
    }

    for (const gid of sentIds) {
      await db.update(guests).set({ smsSentAt: new Date() }).where(eq(guests.id, gid));
    }

    return NextResponse.json({ ok: true, sent, failed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
