import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";
import { generateShortCode } from "@/lib/shortCode";

const Body = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [sponsor] = await db
      .select({ id: sponsors.id })
      .from(sponsors)
      .where(eq(sponsors.id, id))
      .limit(1);
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = Body.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const v = parsed.data;

    // Retry on the rare unique-violation if the short code collides with an
    // existing one. 50^4 keyspace makes this exceptionally unlikely (saw 0
    // collisions backfilling 314 guests) but we guard anyway.
    let row: { id: string; ticketCode: string; shortCode: string | null } | undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        [row] = await db
          .insert(guests)
          .values({
            sponsorId: id,
            name: v.name.trim(),
            phone: normalizePhone(v.phone),
            email: v.email?.trim() || null,
            shortCode: generateShortCode(),
          })
          .returning({ id: guests.id, ticketCode: guests.ticketCode, shortCode: guests.shortCode });
        break;
      } catch (err) {
        if (String(err).includes("short_code") && String(err).includes("unique")) continue;
        throw err;
      }
    }
    if (!row) return NextResponse.json({ error: "Could not allocate ticket code" }, { status: 500 });

    return NextResponse.json({ ok: true, id: row.id, ticketCode: row.ticketCode, shortCode: row.shortCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
