import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSms, buildGuestMessage, buildSponsorMessage, isSmsConfigured } from "./sms";

export type SendResult = { sent: number; failed: number; skipped: number };

export async function sendTicketsForSponsor(sponsorId: string): Promise<SendResult> {
  if (!isSmsConfigured()) return { sent: 0, failed: 0, skipped: 0 };
  const [sponsor] = await db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      contactPhone: sponsors.contactPhone,
      isIndividual: sponsors.isIndividual,
      paid: sponsors.paid,
    })
    .from(sponsors)
    .where(eq(sponsors.id, sponsorId))
    .limit(1);
  if (!sponsor || !sponsor.paid) return { sent: 0, failed: 0, skipped: 0 };

  const list = await db.select().from(guests).where(eq(guests.sponsorId, sponsorId));
  let sent = 0, failed = 0, skipped = 0;

  for (const g of list) {
    if (!g.phone || g.smsSentAt) { skipped++; continue; }
    const r = await sendSms(g.phone, buildGuestMessage({ name: g.name, code: g.ticketCode }));
    if (r.ok) {
      sent++;
      await db.update(guests).set({ smsSentAt: new Date() }).where(eq(guests.id, g.id));
    } else failed++;
  }

  if (sponsor.contactPhone && !sponsor.isIndividual) {
    const r = await sendSms(
      sponsor.contactPhone,
      buildSponsorMessage({ name: sponsor.name, guestCount: list.length, firstCode: list[0]?.ticketCode }),
    );
    if (r.ok) {
      sent++;
      await db.update(sponsors).set({ smsSentAt: new Date() }).where(eq(sponsors.id, sponsorId));
    } else failed++;
  }

  return { sent, failed, skipped };
}

export async function sendTicketToGuest(guestId: string): Promise<SendResult> {
  if (!isSmsConfigured()) return { sent: 0, failed: 0, skipped: 0 };
  const g = await db.query.guests.findFirst({ where: eq(guests.id, guestId) });
  if (!g) return { sent: 0, failed: 0, skipped: 1 };
  if (!g.phone || g.smsSentAt) return { sent: 0, failed: 0, skipped: 1 };
  const [sponsor] = await db
    .select({ id: sponsors.id, paid: sponsors.paid })
    .from(sponsors)
    .where(eq(sponsors.id, g.sponsorId))
    .limit(1);
  if (!sponsor?.paid) return { sent: 0, failed: 0, skipped: 1 };
  const r = await sendSms(g.phone, buildGuestMessage({ name: g.name, code: g.ticketCode }));
  if (!r.ok) return { sent: 0, failed: 1, skipped: 0 };
  await db.update(guests).set({ smsSentAt: new Date() }).where(eq(guests.id, guestId));
  return { sent: 1, failed: 0, skipped: 0 };
}
