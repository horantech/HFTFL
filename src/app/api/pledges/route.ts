import { NextResponse } from "next/server";
import { db } from "@/db";
import { pledges } from "@/db/schema";
import { z } from "zod";
import { sql, desc, count } from "drizzle-orm";
import { normalizePhone } from "@/lib/utils";

const Body = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional().nullable(),
  amount: z.number().int().positive().max(100_000_000),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid name and amount." }, { status: 400 });
    }
    const v = parsed.data;
    const [row] = await db
      .insert(pledges)
      .values({
        name: v.name.trim(),
        phone: normalizePhone(v.phone) || null,
        amount: v.amount,
      })
      .returning({ id: pledges.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [agg] = await db
      .select({
        // sum(integer) → bigint, returned by Neon as string. Number() it back.
        total: sql<string>`coalesce(sum(${pledges.amount}), 0)`,
        count: count(),
      })
      .from(pledges);

    const recent = await db
      .select({
        id: pledges.id,
        name: pledges.name,
        amount: pledges.amount,
        createdAt: pledges.createdAt,
      })
      .from(pledges)
      .orderBy(desc(pledges.createdAt))
      .limit(20);

    return NextResponse.json({
      ok: true,
      total: Number(agg.total),
      count: agg.count,
      recent,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
