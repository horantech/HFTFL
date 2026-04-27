"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { ToastKind } from "@/lib/toast";

type ToastItem = { id: number; message: string; kind: ToastKind };

const DURATION_MS = 4000;

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, kind } = (e as CustomEvent).detail as { message: string; kind: ToastKind };
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, kind }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, DURATION_MS);
    };
    window.addEventListener("hftf:toast", handler);
    return () => window.removeEventListener("hftf:toast", handler);
  }, []);

  return (
    <div className="fixed top-3 right-3 left-3 sm:left-auto sm:top-4 sm:right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Item
          key={t.id}
          item={t}
          onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}
    </div>
  );
}

function Item({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = item.kind === "success" ? CheckCircle2 : item.kind === "error" ? AlertCircle : Info;
  const tone =
    item.kind === "success" ? "bg-white text-[var(--ink)] border-green-200 [&_svg]:text-green-700" :
    item.kind === "error" ? "bg-white text-[var(--ink)] border-red-200 [&_svg]:text-red-700" :
    "bg-white text-[var(--ink)] border-[var(--line)] [&_svg]:text-[var(--ink-mute)]";
  return (
    <div className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border ${tone} px-3.5 py-2.5 shadow-lg w-full sm:min-w-[280px] sm:max-w-[420px]`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0"/>
      <div className="text-sm flex-1 leading-snug">{item.message}</div>
      <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        <X size={14}/>
      </button>
    </div>
  );
}
