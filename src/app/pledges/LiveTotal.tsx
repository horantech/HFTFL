"use client";

import { useEffect, useRef, useState } from "react";
import { PLEDGE_GOAL } from "@/lib/event";

type Pledge = { id: string; name: string; amount: number; createdAt: string };
type Data = { ok: boolean; total: number; count: number; recent: Pledge[] };

const POLL_MS = 2000;

export default function LiveTotal() {
  const [data, setData] = useState<Data | null>(null);
  const lastTotalRef = useRef(0);
  const [bumped, setBumped] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const r = await fetch("/api/pledges", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as Data;
        if (!active) return;
        if (j.total > lastTotalRef.current && lastTotalRef.current > 0) {
          setBumped(true);
          setTimeout(() => active && setBumped(false), 800);
        }
        lastTotalRef.current = j.total;
        setData(j);
      } catch {
        /* swallow network blips, next tick will retry */
      } finally {
        if (active) timer = setTimeout(tick, POLL_MS);
      }
    }

    tick();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!data) {
    return <div className="text-center text-white/60 text-2xl">Loading pledges…</div>;
  }

  const pct = Math.min(100, Math.round((data.total / PLEDGE_GOAL) * 1000) / 10); // 0–100, 1 decimal
  const reached = data.total >= PLEDGE_GOAL;

  return (
    <div className="text-center w-full">
      <div className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/60">Total pledged</div>
      <div
        className={`mt-2 font-bold text-white tabular-nums leading-none transition-transform duration-500 ${bumped ? "scale-110" : "scale-100"}`}
        style={{ fontSize: "clamp(46px, 12vw, 200px)" }}
      >
        {formatBirr(data.total)}
      </div>

      {/* Goal progress */}
      <div className="mt-6 sm:mt-8 max-w-2xl mx-auto px-2">
        <div className="flex items-baseline justify-between text-white/70 text-xs sm:text-sm">
          <span>
            <span className="text-white font-semibold tabular-nums">{pct}%</span>{" "}
            of <span className="text-white/90 font-medium">{formatBirrShort(PLEDGE_GOAL)}</span> goal
          </span>
          <span className="tabular-nums">
            {reached ? (
              <span className="text-white font-semibold">Goal reached 🎉</span>
            ) : (
              <>{formatBirrShort(PLEDGE_GOAL - data.total)} to go</>
            )}
          </span>
        </div>
        <div className="mt-2 h-3 sm:h-4 rounded-full bg-white/10 overflow-hidden border border-white/15">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${reached ? "bg-amber-300" : "bg-white"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 sm:mt-6 text-white/70 text-base sm:text-lg">
        from <span className="font-semibold text-white">{data.count}</span> pledge{data.count === 1 ? "" : "s"}
      </div>

    
    </div>
  );
}

function formatBirr(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} ETB`;
}

// Compact form: "7.5M ETB", "250K ETB", "5,000 ETB"
function formatBirrShort(amount: number) {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M ETB`;
  }
  if (amount >= 10_000) {
    const k = amount / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K ETB`;
  }
  return `${new Intl.NumberFormat("en-US").format(amount)} ETB`;
}
