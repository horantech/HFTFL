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

    // Dedup by phone number — many guests share a single contact phone (e.g.,
    // groups under one buyer). Send one reminder per unique phone, keyed on the
    // first guest we see for that number.
    const byPhone = new Map<string, typeof list[number]>();
    let noPhone = 0;
    for (const g of list) {
      if (!g.phone) { noPhone++; continue; }
      if (!byPhone.has(g.phone)) byPhone.set(g.phone, g);
    }

    let sent = 0, failed = 0;
    for (const g of byPhone.values()) {
      if (!g.phone) continue;
      const r = await sendSms(g.phone, buildReminderMessage({ name: g.name, code: g.ticketCode, tableNumber: g.tableNumber }));
      if (r.ok) sent++; else failed++;
    }

    const dedupSkipped = list.length - byPhone.size - noPhone;
    return NextResponse.json({
      ok: true,
      sent,
      failed,
      skipped: noPhone + dedupSkipped,
      // Diagnostics so staff can see the dedup math:
      uniquePhones: byPhone.size,
      noPhone,
      dedupSkipped,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
