import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
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
    width: 600,
    color: { dark: "#1f3a1c", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div id="ticket-capture" className="relative aspect-[5/4] sm:aspect-[16/9] bg-white shadow-xl rounded-xl overflow-hidden">
          {/* Static design (kid photo, date, venue, "a Night of HOPE" lockup) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ticket-template.png" alt="" className="absolute inset-0 w-full h-full object-cover"/>

          {/* Per-guest overlay on the right white half */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-[45%] sm:w-1/2"/>
            <div className="w-[55%] sm:w-1/2 flex flex-col items-center justify-end pb-[6%] px-[5%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="ticket-qr"
                src={qrDataUrl}
                alt="Ticket QR"
                className="w-[72%] sm:w-[55%] max-w-[280px] aspect-square bg-white p-1.5 rounded-md shadow-sm"
              />
              <div className="mt-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#3a3937]/60">Admit one</div>
                <div className="text-sm sm:text-base font-semibold mt-0.5 text-[#3a3937]">{t.guestName}</div>
                {t.sponsorName && t.sponsorName !== t.guestName && (
                  <div className="text-[10px] sm:text-xs text-[#3a3937]/60">{t.sponsorName}</div>
                )}
              </div>
            </div>
          </div>

          {t.checkedInAt && (
            <div className="absolute top-3 right-3 text-xs bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-2.5 py-1 shadow-sm">
              Already checked in · {new Date(t.checkedInAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="mt-3 max-w-md mx-auto">
          <TicketActions
            filename={`HFTF-${t.guestName.replace(/\s+/g, "_")}.png`}
            url={url}
            guestName={t.guestName}
            sponsorName={t.sponsorName}
          />
        </div>

        <p className="text-xs text-center text-[var(--ink-mute)] mt-3">
          Show this QR at the door. One scan only — please don&apos;t share.
        </p>
      </div>
    </div>
  );
}
