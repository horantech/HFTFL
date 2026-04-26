"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaidToggle({ id, paid }: { id: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(paid);

  async function toggle() {
    setBusy(true);
    const next = !value;
    setValue(next);
    try {
      const r = await fetch(`/api/sponsors/${id}/paid`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paid: next }),
      });
      if (!r.ok) { setValue(!next); }
      router.refresh();
    } catch {
      setValue(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={toggle} disabled={busy} className={value ? "badge badge-success cursor-pointer" : "badge cursor-pointer hover:bg-[var(--bg)]"}>
      {value ? "Paid" : "Unpaid"} <span className="text-[10px] opacity-60">click to toggle</span>
    </button>
  );
}
