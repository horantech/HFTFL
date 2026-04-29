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

    const list = await db
      .select()
      .from(guests)
      .where(eq(guests.sponsorId, id));

    // A guest is eligible if either the sponsor is paid OR they're individually paid.
    const eligible = list.filter(g => sponsor.paid || g.paid);
    if (eligible.length === 0) {
      return NextResponse.json({ error: "Nobody is marked paid yet (mark the sponsor or individual guests as paid first)" }, { status: 400 });
    }

    let sent = 0, failed = 0, skipped = 0;
    const sentIds: string[] = [];

    for (const g of eligible) {
      if (!g.phone) { skipped++; continue; }
      if (onlyPending && g.smsSentAt) { skipped++; continue; }
      const res = await sendSms(g.phone, buildGuestMessage({ name: g.name, code: g.ticketCode, tableNumber: sponsor.tableNumber }));
      if (res.ok) { sent++; sentIds.push(g.id); }
      else { failed++; }
    }

    for (const gid of sentIds) {
      await db.update(guests).set({ smsSentAt: new Date() }).where(eq(guests.id, gid));
    }

    return NextResponse.json({ ok: true, sent, failed, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
