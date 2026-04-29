import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { and, isNull, eq, or } from "drizzle-orm";
import { sendSms, buildReminderMessage, isSmsConfigured } from "@/lib/sms";

export async function POST() {
  try {
    if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });
    const list = await db
      .select({
        id: guests.id,
        name: guests.name,
        phone: guests.phone,
        ticketCode: guests.ticketCode,
        tableNumber: sponsors.tableNumber,
      })
      .from(guests)
      .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
      .where(and(
        isNull(guests.checkedInAt),
        or(eq(sponsors.paid, true), eq(guests.paid, true)),
      ));
    let sent = 0, failed = 0, skipped = 0;
    for (const g of list) {
      if (!g.phone) { skipped++; continue; }
      const r = await sendSms(g.phone, buildReminderMessage({ name: g.name, code: g.ticketCode, tableNumber: g.tableNumber }));
      if (r.ok) sent++; else failed++;
    }
    return NextResponse.json({ ok: true, sent, failed, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
