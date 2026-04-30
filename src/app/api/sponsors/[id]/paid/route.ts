import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const Body = z.object({ paid: z.boolean() });

// Toggling a sponsor's paid status cascades to all guests under it. Staff
// expect this — sponsors pay for their whole table, not per-guest, so flipping
// the sponsor flag should bring the guests along instead of forcing a
// per-guest toggle for every name.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.update(sponsors).set({ paid: parsed.data.paid }).where(eq(sponsors.id, id));
  await db.update(guests).set({ paid: parsed.data.paid }).where(eq(guests.sponsorId, id));
  return NextResponse.json({ ok: true });
}
