import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq, isNull, and, or, sql } from "drizzle-orm";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const SHORT_RE = /^[A-Za-z0-9]{4,8}$/;

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || (!UUID_RE.test(code) && !SHORT_RE.test(code))) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Accept either UUID (legacy QRs) or short_code (current). Only build the
  // UUID branch when the input parses as one — Postgres rejects malformed
  // UUIDs at the type cast even inside an OR.
  const matchCode = UUID_RE.test(code)
    ? or(eq(guests.ticketCode, code), eq(guests.shortCode, code))
    : eq(guests.shortCode, code);

  // Atomic: only update if not yet checked in. If 0 rows updated, the guest was either
  // not found or already checked in. We then look up the existing record to tell which.
  const updated = await db
    .update(guests)
    .set({ checkedInAt: sql`now()` })
    .where(and(matchCode, isNull(guests.checkedInAt)))
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
    .where(matchCode)
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
