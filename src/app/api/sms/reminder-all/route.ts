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
        sponsorName: sponsors.name,
      })
      .from(guests)
      .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
      .where(and(
        isNull(guests.checkedInAt),
        or(eq(sponsors.paid, true), eq(guests.paid, true)),
      ));

    // One SMS per phone number. Tie-breaker when multiple eligible guests
    // share a phone: prefer the guest whose name matches their sponsor's
    // name — that's the "sponsor person" (lead rep, individual, or anyone
    // entered as the sponsor's own ticket). Falling back to first-seen.
    function isSponsorPerson(g: typeof list[number]): boolean {
      return g.name.trim().toLowerCase() === g.sponsorName.trim().toLowerCase();
    }
    const byPhone = new Map<string, typeof list[number]>();
    let noPhone = 0;
    for (const g of list) {
      if (!g.phone) { noPhone++; continue; }
      const cur = byPhone.get(g.phone);
      if (!cur) { byPhone.set(g.phone, g); continue; }
      if (isSponsorPerson(g) && !isSponsorPerson(cur)) byPhone.set(g.phone, g);
    }
    const recipients = Array.from(byPhone.values());

    let sent = 0, failed = 0;
    for (const g of recipients) {
      const r = await sendSms(g.phone!, buildReminderMessage({ name: g.name, code: g.shortCode ?? g.ticketCode, tableNumber: g.tableNumber }));
      if (r.ok) {
        sent++;
        await db.update(guests).set({ smsSentAt: new Date(), smsLastStatus: "sent", smsLastError: null }).where(eq(guests.id, g.id));
      } else {
        failed++;
        await db.update(guests).set({ smsLastStatus: "failed", smsLastError: r.error.slice(0, 500) }).where(eq(guests.id, g.id));
      }
    }

    const dedupSkipped = list.length - noPhone - recipients.length;
    return NextResponse.json({
      ok: true,
      sent,
      failed,
      skipped: noPhone + dedupSkipped,
      noPhone,
      dedupSkipped,
      uniquePhones: recipients.length,
      eligibleCount: list.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
