import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq, isNull, and, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !/^[0-9a-f-]{36}$/i.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Atomic: only update if not yet checked in. If 0 rows updated, the guest was either
  // not found or already checked in. We then look up the existing record to tell which.
  const updated = await db
    .update(guests)
    .set({ checkedInAt: sql`now()` })
    .where(and(eq(guests.ticketCode, code), isNull(guests.checkedInAt)))
    .returning({ id: guests.id });

  const [row] = await db
    .select({
      id: guests.id,
      name: guests.name,
      checkedInAt: guests.checkedInAt,
      sponsorName: sponsors.name,
    })
    .from(guests)
    .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
    .where(eq(guests.ticketCode, code))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const alreadyCheckedIn = updated.length === 0;
  return NextResponse.json({
    ok: true,
    alreadyCheckedIn,
    guest: {
      name: row.name,
      sponsorName: row.sponsorName,
      checkedInAt: row.checkedInAt,
    },
  });
}
