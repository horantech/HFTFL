import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { and, isNull, eq, or } from "drizzle-orm";
import { isSmsConfigured } from "@/lib/sms";

// Pre-flight for the bulk reminder send. Returns the recipient count plus a
// list of sponsors that will receive ≥1 reminder but have no table number on
// file — so staff can fill those in before firing. One SMS per eligible guest
// (no phone dedup); duplicates to a shared phone are intentional.
export async function GET() {
  try {
    if (!isSmsConfigured()) return NextResponse.json({ error: "SMS not configured" }, { status: 400 });

    const list = await db
      .select({
        guestId: guests.id,
        guestName: guests.name,
        phone: guests.phone,
        sponsorId: sponsors.id,
        sponsorName: sponsors.name,
        tableNumber: sponsors.tableNumber,
      })
      .from(guests)
      .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
      .where(and(
        isNull(guests.checkedInAt),
        or(eq(sponsors.paid, true), eq(guests.paid, true)),
      ));

    let noPhone = 0;
    const recipients = list.filter(g => {
      if (!g.phone) { noPhone++; return false; }
      return true;
    });

    // Sponsors that would receive ≥1 reminder but currently have no table number.
    type Missing = { sponsorId: string; sponsorName: string; recipientCount: number };
    const missing = new Map<string, Missing>();
    for (const r of recipients) {
      const t = (r.tableNumber ?? "").trim();
      if (t) continue;
      const cur = missing.get(r.sponsorId);
      if (cur) cur.recipientCount++;
      else missing.set(r.sponsorId, { sponsorId: r.sponsorId, sponsorName: r.sponsorName, recipientCount: 1 });
    }

    return NextResponse.json({
      ok: true,
      recipients: recipients.length,
      noPhone,
      totalRows: list.length,
      sponsorsMissingTable: Array.from(missing.values()).sort((a, b) => a.sponsorName.localeCompare(b.sponsorName)),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
