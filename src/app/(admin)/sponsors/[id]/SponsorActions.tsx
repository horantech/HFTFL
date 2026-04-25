"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2 } from "lucide-react";

export default function SponsorActions({ sponsorId, smsReady, guestCount }: { sponsorId: string; smsReady: boolean; guestCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function smsAll() {
    if (!confirm(`Send ticket SMS to the sponsor and all ${guestCount} guests?`)) return;
    setBusy("sms");
    const res = await fetch(`/api/sponsors/${sponsorId}/sms`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) alert(j.error || "Failed");
    else alert(`Sent ${j.sent} message${j.sent === 1 ? "" : "s"}.${j.failed ? ` ${j.failed} failed.` : ""}`);
    router.refresh();
    setBusy(null);
  }

  async function remove() {
    if (!confirm("Delete this sponsor and all their guests? This cannot be undone.")) return;
    setBusy("del");
    const res = await fetch(`/api/sponsors/${sponsorId}`, { method: "DELETE" });
    if (res.ok) router.push("/sponsors");
    else alert("Failed to delete");
    setBusy(null);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {smsReady && guestCount > 0 && (
        <button onClick={smsAll} disabled={busy !== null} className="btn btn-brand">
          <Send size={16}/> {busy === "sms" ? "Sending…" : "Send SMS to all"}
        </button>
      )}
      <button onClick={remove} disabled={busy !== null} className="btn btn-outline text-red-700 border-red-200">
        <Trash2 size={16}/> Delete
      </button>
    </div>
  );
}
