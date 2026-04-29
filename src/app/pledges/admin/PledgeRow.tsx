"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { confirmDialog } from "@/lib/confirm";
import { toast } from "@/lib/toast";

export default function PledgeDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const ok = await confirmDialog({
      title: `Delete pledge from ${name}?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/pledges/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast(j.error || "Failed to delete", "error");
        return;
      }
      router.refresh();
    } catch {
      toast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="btn btn-ghost btn-sm text-red-700"
      title="Delete pledge"
    >
      <Trash2 size={14}/>
    </button>
  );
}
