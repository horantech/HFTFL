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
        shortCode: guests.shortCode,
        tableNumber: sponsors.tableNumber,
      })
      .from(guests)
      .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
      .where(and(
        isNull(guests.checkedInAt),
        or(eq(sponsors.paid, true), eq(guests.paid, true)),
      ));

    // No phone dedup — each guest with a phone gets their own reminder, even
    // if multiple guests share the same number. The personalized greeting and
    // QR code link justify a duplicate text to the shared phone.
    let sent = 0, failed = 0, noPhone = 0;
    for (const g of list) {
      if (!g.phone) { noPhone++; continue; }
      const r = await sendSms(g.phone, buildReminderMessage({ name: g.name, code: g.shortCode ?? g.ticketCode, tableNumber: g.tableNumber }));
      if (r.ok) {
        sent++;
        await db.update(guests).set({ smsSentAt: new Date(), smsLastStatus: "sent", smsLastError: null }).where(eq(guests.id, g.id));
      } else {
        failed++;
        await db.update(guests).set({ smsLastStatus: "failed", smsLastError: r.error.slice(0, 500) }).where(eq(guests.id, g.id));
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      skipped: noPhone,
      noPhone,
      eligibleCount: list.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
