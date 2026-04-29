"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export default function GuestPaidToggle({ id, paid }: { id: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(paid);

  async function toggle() {
    setBusy(true);
    const next = !value;
    setValue(next);
    try {
      const r = await fetch(`/api/guests/${id}/paid`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paid: next }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast(j.error || "Failed to update paid status", "error");
        setValue(!next);
        return;
      }
      router.refresh();
    } catch {
      toast("Network error", "error");
      setValue(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={value ? "badge badge-success cursor-pointer" : "badge cursor-pointer hover:bg-[var(--bg)]"}
      title="Click to toggle paid status"
    >
      {value ? "Paid" : "Unpaid"}
    </button>
  );
}
