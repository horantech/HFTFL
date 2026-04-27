import { NextResponse } from "next/server";
import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendTicketsForSponsor } from "@/lib/notify";

const Body = z.object({ paid: z.boolean() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.update(sponsors).set({ paid: parsed.data.paid }).where(eq(sponsors.id, id));
  if (parsed.data.paid) {
    await sendTicketsForSponsor(id);
  }
  return NextResponse.json({ ok: true });
}
