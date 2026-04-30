"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import Link from "next/link";
import { Check, AlertTriangle, X, ScanLine, RotateCw } from "lucide-react";

type Result =
  | { kind: "ok"; guestName: string; sponsorName: string; tableNumber: string | null; at: string }
  | { kind: "already"; guestName: string; sponsorName: string; tableNumber: string | null; at: string }
  | { kind: "invalid"; message: string };

const COOLDOWN_MS = 2200;

export default function Scanner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const blockedRef = useRef(false);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDetected(decoded: string) {
    if (blockedRef.current) return;
    const now = Date.now();
    const last = lastCodeRef.current;
    if (last && last.code === decoded && now - last.at < COOLDOWN_MS) return;
    lastCodeRef.current = { code: decoded, at: now };

    let code = decoded.trim();
    // QR may contain either the bare code or a full /t/<code> URL. Accept
    // both the historic 36-char UUID and the 4-8 char short code.
    const urlMatch = code.match(/\/t\/([A-Za-z0-9-]+)/i);
    if (urlMatch) code = urlMatch[1];

    const isUuid = /^[0-9a-f-]{36}$/i.test(code);
    const isShort = /^[A-Za-z0-9]{4,8}$/.test(code);
    if (!isUuid && !isShort) {
      blockedRef.current = true;
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
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        blockedRef.current = true;
        setResult({ kind: "invalid", message: j.error || "Unknown ticket" });
        beep("warn");
        return;
      }
      blockedRef.current = true;
      if (j.alreadyCheckedIn) {
        setResult({ kind: "already", guestName: j.guest.name, sponsorName: j.guest.sponsorName, tableNumber: j.guest.tableNumber ?? null, at: j.guest.checkedInAt });
        beep("warn");
      } else {
        setResult({ kind: "ok", guestName: j.guest.name, sponsorName: j.guest.sponsorName, tableNumber: j.guest.tableNumber ?? null, at: j.guest.checkedInAt });
        beep("ok");
      }
    } catch {
      blockedRef.current = true;
      setResult({ kind: "invalid", message: "Network error" });
      beep("warn");
    }
  }

  function dismiss() {
    blockedRef.current = false;
    lastCodeRef.current = null;
    setResult(null);
  }

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
        async (decoded) => { await onDetected(decoded); },
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
        try { s.clear(); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    scannerRef.current = null;
    setRunning(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5 max-w-lg mx-auto mt-15">
      <div className="card card-pad-0 overflow-hidden">
        <div className="px-3 sm:px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2"><ScanLine size={16}/> Scan tickets</div>
          {running ? (
            <button onClick={stop} className="btn btn-ghost btn-sm"><X size={14}/> Stop</button>
          ) : (
            <button onClick={start} className="btn btn-primary btn-sm"><RotateCw size={14}/> Start</button>
          )}
        </div>
        <div className="p-2 sm:p-3">
          <div ref={containerRef} className="bg-black rounded-lg overflow-hidden aspect-square" />
          {error && <div className="text-sm text-red-700 mt-2 px-1">{error}</div>}
        </div>
      </div>

      <div className="text-center text-sm text-[var(--ink-soft)]">
        No QR? <Link href="/people?filter=guests" className="underline text-[var(--ink)]">search in People page</Link>
      </div>

      <ResultModal result={result} onClose={dismiss}/>
    </div>
  );
}

function ResultModal({ result, onClose }: { result: Result | null; onClose: () => void }) {
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, onClose]);

  if (!result) return null;

  const styles =
    result.kind === "ok"
      ? { ring: "border-green-300", tint: "bg-green-50", chipBg: "bg-green-100", chipInk: "text-green-800", icon: <Check size={28} className="text-green-700"/>, label: "Checked in" }
      : result.kind === "already"
        ? { ring: "border-amber-300", tint: "bg-amber-50", chipBg: "bg-amber-100", chipInk: "text-amber-800", icon: <AlertTriangle size={28} className="text-amber-700"/>, label: "Already checked in" }
        : { ring: "border-red-300", tint: "bg-red-50", chipBg: "bg-red-100", chipInk: "text-red-800", icon: <X size={28} className="text-red-700"/>, label: "Invalid ticket" };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50"/>
      <div className={`relative w-full max-w-sm rounded-xl border-2 ${styles.ring} bg-white shadow-2xl overflow-hidden`}>
        <div className={`${styles.tint} px-5 py-6 text-center`}>
          <div className={`mx-auto inline-flex items-center justify-center h-14 w-14 rounded-full ${styles.chipBg}`}>
            {styles.icon}
          </div>
          <div className={`mt-2 text-sm font-medium ${styles.chipInk}`}>{styles.label}</div>
          {result.kind === "invalid" ? (
            <div className="mt-2 text-base text-[var(--ink)]">{result.message}</div>
          ) : (
            <>
              <div className="mt-2 text-xl sm:text-2xl font-semibold leading-tight break-words">{result.guestName}</div>
              {result.sponsorName && result.sponsorName !== result.guestName && (
                <div className="text-sm text-[var(--ink-mute)] mt-0.5 break-words">{result.sponsorName}</div>
              )}
              {result.tableNumber ? (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/70 border border-[var(--line)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">Table</span>
                  <span className="text-lg font-semibold leading-none">{result.tableNumber}</span>
                </div>
              ) : (
                <div className="mt-2 text-xs text-[var(--ink-mute)] italic">No table assigned</div>
              )}
              <div className="text-xs text-[var(--ink-mute)] mt-1.5">{new Date(result.at).toLocaleTimeString()}</div>
            </>
          )}
        </div>
        <div className="p-3">
          <button onClick={onClose} autoFocus className="btn btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function beep(kind: "ok" | "warn") {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = kind === "ok" ? 880 : 280;
    g.gain.value = 0.05;
    o.start(); o.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch { /* ignore */ }
}
