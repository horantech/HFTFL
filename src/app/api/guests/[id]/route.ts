import { NextResponse } from "next/server";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils";

const PatchBody = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(40).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { phone, ...rest } = parsed.data;
  const update = { ...rest, ...(phone !== undefined ? { phone: normalizePhone(phone) } : {}) };
  await db.update(guests).set(update).where(eq(guests.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(guests).where(eq(guests.id, id));
  return NextResponse.json({ ok: true });
}
