"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { ConfirmOptions } from "@/lib/confirm";

type Pending = {
  options: ConfirmOptions;
  resolve: (v: boolean) => void;
};

export default function ConfirmDialog() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Pending;
      setPending(detail);
    };
    window.addEventListener("hftf:confirm", handler);
    return () => window.removeEventListener("hftf:confirm", handler);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
      if (e.key === "Enter") finish(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function finish(v: boolean) {
    if (!pending) return;
    pending.resolve(v);
    setPending(null);
  }

  if (!pending) return null;

  const o = pending.options;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div onClick={() => finish(false)} className="absolute inset-0 bg-black/40 animate-in fade-in"/>
      <div className="relative bg-white rounded-xl border border-[var(--line)] shadow-xl w-full max-w-md p-4 sm:p-5 animate-in zoom-in-95">
        <div className="flex items-start gap-3">
          {o.danger && (
            <div className="flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-red-50">
              <AlertTriangle size={18} className="text-red-600"/>
            </div>
          )}
          <div className="flex-1">
            <div className="text-base font-semibold">{o.title}</div>
            {o.message && <div className="text-sm text-[var(--ink-mute)] mt-1.5">{o.message}</div>}
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-5">
          <button onClick={() => finish(false)} className="btn btn-ghost w-full sm:w-auto">
            {o.cancelLabel || "Cancel"}
          </button>
          <button
            onClick={() => finish(true)}
            autoFocus
            className={`${o.danger ? "btn btn-danger" : "btn btn-primary"} w-full sm:w-auto`}
          >
            {o.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
