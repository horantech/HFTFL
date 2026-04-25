"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, AlertTriangle, X, Camera, RotateCw } from "lucide-react";

type Result =
  | { kind: "ok"; guestName: string; sponsorName: string; at: string }
  | { kind: "already"; guestName: string; sponsorName: string; at: string }
  | { kind: "invalid"; message: string };

const COOLDOWN_MS = 2200;

export default function Scanner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!containerRef.current) return;
      const id = "qr-region";
      containerRef.current.innerHTML = `<div id="${id}" class="rounded-lg overflow-hidden"></div>`;
      const scanner = new Html5Qrcode(id, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        async (decoded) => {
          await onDetected(decoded);
        },
        () => { /* per-frame errors ignored */ },
      );
      setRunning(true);
    } catch (e) {
      setError((e as Error).message || "Camera failed to start");
    }
  }

  async function stop() {
    try {
      const s = scannerRef.current;
      if (s) {
        if (s.isScanning) await s.stop();
        await s.clear().catch(() => {});
      }
    } catch { /* ignore */ }
    scannerRef.current = null;
    setRunning(false);
  }

  useEffect(() => {
    start();
    return () => { stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDetected(decoded: string) {
    const now = Date.now();
    const last = lastCodeRef.current;
    if (last && last.code === decoded && now - last.at < COOLDOWN_MS) return;
    lastCodeRef.current = { code: decoded, at: now };

    let code = decoded.trim();
    const match = code.match(/\/t\/([0-9a-f-]{36})/i);
    if (match) code = match[1];

    if (!/^[0-9a-f-]{36}$/i.test(code)) {
      setResult({ kind: "invalid", message: "Not a valid ticket QR" });
      beep("warn");
      return;
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await res.json();
      if (!res.ok) {
        setResult({ kind: "invalid", message: j.error || "Unknown ticket" });
        beep("warn");
        return;
      }
      if (j.alreadyCheckedIn) {
        setResult({ kind: "already", guestName: j.guest.name, sponsorName: j.guest.sponsorName, at: j.guest.checkedInAt });
        beep("warn");
      } else {
        setResult({ kind: "ok", guestName: j.guest.name, sponsorName: j.guest.sponsorName, at: j.guest.checkedInAt });
        beep("ok");
      }
    } catch {
      setResult({ kind: "invalid", message: "Network error" });
      beep("warn");
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <div className="card card-pad-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--brand-line)] flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2"><Camera size={16}/> Camera</div>
          <div className="flex items-center gap-2">
            {running ? (
              <button onClick={stop} className="btn btn-ghost text-sm"><X size={14}/> Stop</button>
            ) : (
              <button onClick={start} className="btn btn-primary text-sm"><RotateCw size={14}/> Start</button>
            )}
          </div>
        </div>
        <div className="p-3">
          <div ref={containerRef} className="bg-black rounded-lg overflow-hidden min-h-[280px]" />
          {error && <div className="text-sm text-red-700 mt-2">{error}</div>}
          {!running && !error && (
            <div className="text-sm text-[var(--ink-soft)] mt-2">
              Camera will start automatically. If it doesn&apos;t, tap <strong>Start</strong>.
              Make sure the page is served over HTTPS so the browser allows camera access.
            </div>
          )}
        </div>
      </div>

      <div>
        <ResultPanel result={result} />
        <div className="card mt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-1">Guest without QR?</div>
          <div className="text-sm text-[var(--ink-soft)]">
            Use the <Link className="underline" href="/guests">Guests page</Link> to search by name or by company / CEO who brought them. You can also <Link className="underline" href="/sponsors/new">add a walk-in</Link> on the spot.
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: Result | null }) {
  if (!result) {
    return (
      <div className="card text-center text-[var(--ink-soft)]">
        <div className="font-display text-lg">Ready to scan</div>
        <div className="text-sm">Hold the QR code 10–20cm from the camera.</div>
      </div>
    );
  }
  if (result.kind === "ok") {
    return (
      <div className="card border-green-300 bg-green-50">
        <div className="flex items-center gap-2 text-green-800"><Check size={18}/><span className="font-medium">Checked in</span></div>
        <div className="font-display text-2xl mt-1">{result.guestName}</div>
        <div className="text-sm text-green-900/70">{result.sponsorName}</div>
        <div className="text-xs text-green-900/60 mt-1">{new Date(result.at).toLocaleTimeString()}</div>
      </div>
    );
  }
  if (result.kind === "already") {
    return (
      <div className="card border-amber-300 bg-amber-50">
        <div className="flex items-center gap-2 text-amber-800"><AlertTriangle size={18}/><span className="font-medium">Already checked in</span></div>
        <div className="font-display text-2xl mt-1">{result.guestName}</div>
        <div className="text-sm text-amber-900/70">{result.sponsorName}</div>
        <div className="text-xs text-amber-900/60 mt-1">at {new Date(result.at).toLocaleTimeString()}</div>
      </div>
    );
  }
  return (
    <div className="card border-red-300 bg-red-50">
      <div className="flex items-center gap-2 text-red-800"><X size={18}/><span className="font-medium">Invalid</span></div>
      <div className="text-sm mt-1">{result.message}</div>
    </div>
  );
}

function beep(kind: "ok" | "warn") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = kind === "ok" ? 880 : 280;
    g.gain.value = 0.05;
    o.start(); o.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch { /* ignore */ }
}
