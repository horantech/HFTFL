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
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm">
          <div className="bg-[var(--ink)] text-white px-6 py-5">
            <div className="text-[10px] tracking-[0.25em] uppercase text-white/60">Hope for the Fatherless</div>
            <div className="text-xl font-semibold mt-1">Donation Dinner</div>
            <div className="text-sm text-white/70 mt-1">{EVENT.date} · {EVENT.time}</div>
          </div>

          <div className="px-6 pt-6 text-center">
            <div className="text-xs uppercase tracking-wider text-[var(--ink-mute)]">Admit one</div>
            <div className="text-xl font-semibold mt-1">{t.guestName}</div>
            <div className="text-sm text-[var(--ink-mute)]">{t.sponsorName}</div>
          </div>

          <div className="px-6 py-5 flex justify-center">
            <div className="bg-white border border-[var(--line)] rounded-lg p-3">
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
            <Row label="Venue" value={EVENT.venue}/>
            <Row label="Date" value={EVENT.date}/>
            <Row label="Doors" value={EVENT.time}/>
            <Row label="Code" value={t.ticketCode.slice(0, 8).toUpperCase()} mono/>
          </div>

          <TicketActions filename={`HFTF-${t.guestName.replace(/\s+/g, "_")}.png`} url={url}/>
        </div>

        <p className="text-xs text-center text-[var(--ink-mute)] mt-3">
          Show this QR at the door. One scan only — please don&apos;t share.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-t border-dashed border-[var(--line)] pt-2 first:border-t-0 first:pt-0">
      <span className="text-[var(--ink-mute)]">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
    </div>
  );
}
