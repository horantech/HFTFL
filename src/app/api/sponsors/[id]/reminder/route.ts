import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { and, isNull, eq } from "drizzle-orm";
import { sendSms, buildReminderMessage, isSmsConfigured } from "@/lib/sms";

// Send reminder SMS to every paid + not-yet-checked-in guest under one sponsor.
// One SMS per guest with a phone — duplicates to the same number are intentional
// since each guest's QR code is unique.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });

    const [sponsor] = await db
      .select({ id: sponsors.id, paid: sponsors.paid, tableNumber: sponsors.tableNumber })
      .from(sponsors)
      .where(eq(sponsors.id, id))
      .limit(1);
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });

    const list = await db
      .select()
      .from(guests)
      .where(and(eq(guests.sponsorId, id), isNull(guests.checkedInAt)));

    // Eligible: sponsor.paid OR guest.paid, with a phone.
    const eligible = list.filter(g => (sponsor.paid || g.paid) && g.phone);
    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "Nobody under this sponsor is eligible (need paid + phone + not checked in)" },
        { status: 400 },
      );
    }

    let sent = 0, failed = 0;
    for (const g of eligible) {
      const r = await sendSms(
        g.phone!,
        buildReminderMessage({ name: g.name, code: g.shortCode ?? g.ticketCode, tableNumber: sponsor.tableNumber }),
      );
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
      eligibleCount: eligible.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
