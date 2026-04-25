import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1).max(200),
  contactPhone: z.string().max(40).optional().nullable(),
  contactEmail: z.string().max(200).optional().nullable(),
  isIndividual: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const v = parsed.data;
  const [row] = await db
    .insert(sponsors)
    .values({
      name: v.name.trim(),
      contactPhone: v.contactPhone || null,
      contactEmail: v.contactEmail || null,
      isIndividual: v.isIndividual ?? false,
      notes: v.notes || null,
    })
    .returning({ id: sponsors.id });
  return NextResponse.json({ ok: true, id: row.id });
}
