"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";
import { renderTicketCanvas } from "@/lib/ticket";

export default function TicketActions({
  filename,
  url,
  guestName,
  sponsorName,
}: {
  filename: string;
  url: string;
  guestName: string;
  sponsorName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    const qrImg = document.getElementById("ticket-qr") as HTMLImageElement | null;
    if (!qrImg?.src) return;
    setDownloading(true);
    try {
      const canvas = await renderTicketCanvas({
        qrSrc: qrImg.src,
        guestName,
        sponsorName,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename.replace(/\.png$/i, "-ticket.png");
      a.click();
    } finally {
      setDownloading(false);
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "HFTF Ticket", url });
        return;
      }
    } catch { /* fall through */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <div className="px-2 sm:px-6 pb-4 sm:pb-6 grid grid-cols-2 gap-2 no-print">
      <button onClick={download} className="btn btn-outline" disabled={downloading}>
        <Download size={16}/> <span className="hidden sm:inline">{downloading ? "Preparing..." : "Download full ticket"}</span><span className="sm:hidden">{downloading ? "Preparing…" : "Download"}</span>
      </button>
      <button onClick={share} className="btn btn-primary">
        <Share2 size={16}/> {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}

