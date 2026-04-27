"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { X, Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";

export type TicketModalData = {
  ticketCode: string;
  guestName: string;
  sponsorName: string;
};

export default function TicketModal({
  data,
  onClose,
}: {
  data: TicketModalData | null;
  onClose: () => void;
}) {
  const [qr, setQr] = useState<string>("");
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!data) return;
    QRCode.toDataURL(data.ticketCode, {
      margin: 1,
      width: 600,
      color: { dark: "#1f3a1c", light: "#ffffff" },
    }).then(setQr).catch(() => setQr(""));
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  if (!data) return null;

  const ticketUrl = typeof window !== "undefined"
    ? `${window.location.origin}/t/${data.ticketCode}`
    : `/t/${data.ticketCode}`;

  function download() {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `HFTF-${data!.guestName.replace(/\s+/g, "_")}.png`;
    a.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      toast("Ticket link copied", "success");
    } catch {
      toast("Could not copy", "error");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60"/>
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white shadow-md hover:bg-[var(--bg)] transition-colors"
          aria-label="Close"
        >
          <X size={18}/>
        </button>

        <div className="relative aspect-[5/4] sm:aspect-[16/9] bg-white shadow-2xl rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ticket-template.png" alt="" className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-[45%] sm:w-1/2"/>
            <div className="w-[55%] sm:w-1/2 flex flex-col items-center justify-end pb-[6%] px-[5%]">
              {qr && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  ref={imgRef}
                  src={qr}
                  alt="Ticket QR"
                  className="w-[72%] sm:w-[55%] max-w-[280px] aspect-square bg-white p-1.5 rounded-md shadow-sm"
                />
              )}
              <div className="mt-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#3a3937]/60">Admit one</div>
                <div className="text-sm sm:text-base font-semibold mt-0.5 text-[#3a3937]">{data.guestName}</div>
                {data.sponsorName && data.sponsorName !== data.guestName && (
                  <div className="text-[10px] sm:text-xs text-[#3a3937]/60">{data.sponsorName}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2 justify-center flex-wrap">
          <button onClick={download} disabled={!qr} className="btn btn-outline btn-sm">
            <Download size={14}/> Download QR
          </button>
          <button onClick={copyLink} className="btn btn-outline btn-sm">
            <Copy size={14}/> Copy link
          </button>
          <a href={ticketUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            <ExternalLink size={14}/> Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
