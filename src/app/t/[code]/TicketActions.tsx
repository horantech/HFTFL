"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";

export default function TicketActions({ filename, url }: { filename: string; url: string }) {
  const [copied, setCopied] = useState(false);

  function download() {
    const img = document.getElementById("ticket-qr") as HTMLImageElement | null;
    if (!img) return;
    const a = document.createElement("a");
    a.href = img.src;
    a.download = filename;
    a.click();
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
    <div className="px-6 pb-6 grid grid-cols-2 gap-2 no-print">
      <button onClick={download} className="btn btn-outline">
        <Download size={16}/> Download
      </button>
      <button onClick={share} className="btn btn-primary">
        <Share2 size={16}/> {copied ? "Link copied" : "Share"}
      </button>
    </div>
  );
}
