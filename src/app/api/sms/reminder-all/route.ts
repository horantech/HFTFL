import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { sendSms, buildReminderMessage, isSmsConfigured } from "@/lib/sms";

export async function POST() {
  if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });
  const list = await db.select().from(guests).where(isNull(guests.checkedInAt));
  let sent = 0, failed = 0, skipped = 0;
  for (const g of list) {
    if (!g.phone) { skipped++; continue; }
    const r = await sendSms(g.phone, buildReminderMessage({ name: g.name, code: g.ticketCode }));
    if (r.ok) sent++; else failed++;
  }
  return NextResponse.json({ ok: true, sent, failed, skipped });
}
