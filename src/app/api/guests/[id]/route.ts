import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(guests).where(eq(guests.id, id));
  return NextResponse.json({ ok: true });
}
