import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [g] = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  if (!g) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  if (g.checkedInAt) {
    return NextResponse.json({ ok: true, alreadyCheckedIn: true, checkedInAt: g.checkedInAt });
  }
  const now = new Date();
  await db.update(guests).set({ checkedInAt: now }).where(eq(guests.id, id));
  return NextResponse.json({ ok: true, checkedInAt: now.toISOString() });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(guests).set({ checkedInAt: null }).where(eq(guests.id, id));
  return NextResponse.json({ ok: true });
}
