import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const PatchBody = z.object({
  name: z.string().min(1).max(200).optional(),
  contactPhone: z.string().max(40).nullable().optional(),
  contactEmail: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  bank: z.string().max(200).nullable().optional(),
  assignedTo: z.string().max(200).nullable().optional(),
  rsvp: z.string().max(20).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.update(sponsors).set(parsed.data).where(eq(sponsors.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(sponsors).where(eq(sponsors.id, id));
  return NextResponse.json({ ok: true });
}
