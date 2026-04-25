import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { EVENT } from "@/lib/event";
import TicketActions from "./TicketActions";

export const dynamic = "force-dynamic";

async function getTicket(code: string) {
  const [row] = await db
    .select({
      guestId: guests.id,
      guestName: guests.name,
      ticketCode: guests.ticketCode,
      checkedInAt: guests.checkedInAt,
      sponsorName: sponsors.name,
    })
    .from(guests)
    .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
    .where(eq(guests.ticketCode, code))
    .limit(1);
  return row;
}

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(code)) notFound();
  const t = await getTicket(code);
  if (!t) notFound();

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const url = `${(base || "").replace(/\/$/, "")}/t/${t.ticketCode}`;
  const qrDataUrl = await QRCode.toDataURL(t.ticketCode, {
    margin: 1,
    width: 480,
    color: { dark: "#1f1d1a", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--brand-cream-soft)]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[var(--brand-line)] overflow-hidden shadow-[0_10px_40px_-15px_rgba(75,93,79,0.25)]">
          <div className="bg-[var(--brand-green)] text-[var(--brand-cream-soft)] px-6 py-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15"
              style={{ background: "radial-gradient(400px 200px at 100% 0%, var(--brand-tan), transparent)" }} />
            <div className="relative">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--brand-tan)]">Hope for the Fatherless</div>
              <div className="font-display text-2xl mt-1 leading-tight">Donation Dinner</div>
              <div className="text-sm opacity-90 mt-1">{EVENT.date} · {EVENT.time}</div>
            </div>
          </div>

          <div className="px-6 pt-6 text-center">
            <div className="text-xs uppercase tracking-[0.25em] text-[var(--brand-tan-dark)]">Admit one</div>
            <div className="font-display text-2xl mt-1">{t.guestName}</div>
            <div className="text-sm text-[var(--ink-soft)]">{t.sponsorName}</div>
          </div>

          <div className="px-6 py-5 flex justify-center">
            <div className="bg-white border-2 border-[var(--brand-line)] rounded-lg p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="ticket-qr" src={qrDataUrl} width={260} height={260} alt="Ticket QR" />
            </div>
          </div>

          {t.checkedInAt && (
            <div className="mx-6 mb-4 text-center text-sm bg-amber-50 text-amber-900 border border-amber-200 rounded-md p-2">
              Already checked in at {new Date(t.checkedInAt).toLocaleString()}
            </div>
          )}

          <div className="px-6 pb-5 space-y-2 text-sm">
            <div className="flex justify-between border-t border-dashed border-[var(--brand-line)] pt-3">
              <span className="text-[var(--ink-soft)]">Venue</span>
              <span className="font-medium">{EVENT.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-soft)]">Date</span>
              <span className="font-medium">{EVENT.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-soft)]">Doors</span>
              <span className="font-medium">{EVENT.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--ink-soft)]">Code</span>
              <span className="font-mono text-xs">{t.ticketCode.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <TicketActions filename={`HFTF-${t.guestName.replace(/\s+/g, "_")}.png`} url={url}/>
        </div>

        <p className="text-xs text-center text-[var(--ink-soft)] mt-3">
          Show this QR at the door. One scan only — please don&apos;t share.
        </p>
      </div>
    </div>
  );
}
