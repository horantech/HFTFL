"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";

export default function TableNumberInline({ sponsorId, value }: { sponsorId: string; value: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const next = v.trim() || null;
    const res = await fetch(`/api/sponsors/${sponsorId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tableNumber: next }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(j.error || "Failed to save table", "error");
    } else {
      setEditing(false);
      router.refresh();
    }
    setBusy(false);
  }

  function cancel() {
    setV(value ?? "");
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          className="input !py-0.5 !px-1.5 !text-xs w-[90px]"
          value={v}
          onChange={e => setV(e.target.value)}
          placeholder="e.g. 12"
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); save(); }
            if (e.key === "Escape") cancel();
          }}
        />
        <button onClick={save} disabled={busy} className="btn btn-primary btn-sm" aria-label="Save">
          <Check size={12}/>
        </button>
        <button onClick={cancel} disabled={busy} className="btn btn-ghost btn-sm" aria-label="Cancel">
          <X size={12}/>
        </button>
      </span>
    );
  }

  if (value) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="badge badge-success cursor-pointer hover:opacity-80"
        title="Click to edit table number"
      >
        Table {value} <Pencil size={10} className="opacity-60"/>
      </button>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="badge cursor-pointer hover:bg-[var(--bg)]"
      title="Set table number"
    >
      <Pencil size={10}/> Set table
    </button>
  );
}
