"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";

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
    <div className="px-4 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 no-print">
      <button onClick={download} className="btn btn-outline" disabled={downloading}>
        <Download size={16}/> {downloading ? "Preparing..." : "Download full ticket"}
      </button>
      <button onClick={share} className="btn btn-primary">
        <Share2 size={16}/> {copied ? "Link copied" : "Share"}
      </button>
    </div>
  );
}

async function renderTicketCanvas({
  qrSrc,
  guestName,
  sponsorName,
}: {
  qrSrc: string;
  guestName: string;
  sponsorName: string;
}) {
  const W = 1600;
  const H = 900;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  const bg = await loadImage("/ticket-template.png");
  const qr = await loadImage(qrSrc);

  ctx.drawImage(bg, 0, 0, W, H);

  const rightX = W * 0.5;
  const rightW = W * 0.5;
  const bottomPad = H * 0.06;
  const qrSize = W * 0.275;
  const qrPad = W * 0.008;
  const textBlock = H * 0.12;
  const qrX = rightX + (rightW - qrSize) / 2;
  const qrY = H - bottomPad - textBlock - qrSize;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2);
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  const centerX = rightX + rightW / 2;
  const labelY = qrY + qrSize + H * 0.03;
  ctx.textAlign = "center";

  ctx.fillStyle = "rgba(58,57,55,0.62)";
  ctx.font = "500 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText("ADMIT ONE", centerX, labelY);

  ctx.fillStyle = "#3a3937";
  ctx.font = "600 36px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillText(guestName, centerX, labelY + 40);

  if (sponsorName && sponsorName !== guestName) {
    ctx.fillStyle = "rgba(58,57,55,0.62)";
    ctx.font = "500 20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(sponsorName, centerX, labelY + 70);
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
