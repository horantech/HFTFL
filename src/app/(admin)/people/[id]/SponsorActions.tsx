"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, Ticket } from "lucide-react";
import { toast } from "@/lib/toast";
import { confirmDialog } from "@/lib/confirm";

type Props = {
  sponsorId: string;
  smsReady: boolean;
  guestCount: number;
  sponsorName: string;
  sponsorPhone: string | null;
  sponsorHasTicket: boolean;
  isIndividual: boolean;
};

export default function SponsorActions({
  sponsorId, smsReady, guestCount,
  sponsorName, sponsorPhone, sponsorHasTicket, isIndividual,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function smsAll() {
    const ok = await confirmDialog({
      title: "Send ticket SMS?",
      message: `This sends ticket SMS to the sponsor and all ${guestCount} guest${guestCount === 1 ? "" : "s"}.`,
      confirmLabel: "Send",
    });
    if (!ok) return;
    setBusy("sms");
    const res = await fetch(`/api/sponsors/${sponsorId}/sms`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) toast(j.error || "Failed to send", "error");
    else toast(`Sent ${j.sent} message${j.sent === 1 ? "" : "s"}${j.failed ? ` · ${j.failed} failed` : ""}`, "success");
    router.refresh();
    setBusy(null);
  }

  async function addSponsorAsGuest() {
    const ok = await confirmDialog({
      title: `Generate ticket for ${sponsorName}?`,
      message: "This adds the sponsor as an attendee with their own QR ticket.",
      confirmLabel: "Generate ticket",
    });
    if (!ok) return;
    setBusy("ticket");
    const res = await fetch(`/api/sponsors/${sponsorId}/guests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: sponsorName, phone: sponsorPhone }),
    });
    const j = await res.json();
    if (!res.ok) toast(j.error || "Failed to create ticket", "error");
    else toast(`Ticket generated for ${sponsorName}`, "success");
    router.refresh();
    setBusy(null);
  }

  async function remove() {
    const ok = await confirmDialog({
      title: "Delete this sponsor?",
      message: "All their guests will also be removed. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy("del");
    const res = await fetch(`/api/sponsors/${sponsorId}`, { method: "DELETE" });
    if (res.ok) router.push("/people");
    else toast("Failed to delete sponsor", "error");
    setBusy(null);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!sponsorHasTicket && !isIndividual && (
        <button onClick={addSponsorAsGuest} disabled={busy !== null} className="btn btn-outline">
          <Ticket size={16}/> {busy === "ticket" ? "Generating…" : `Ticket for ${sponsorName}`}
        </button>
      )}
      {smsReady && guestCount > 0 && (
        <button onClick={smsAll} disabled={busy !== null} className="btn btn-primary">
          <Send size={16}/> {busy === "sms" ? "Sending…" : "Send SMS to all"}
        </button>
      )}
      <button onClick={remove} disabled={busy !== null} className="btn btn-outline text-red-700">
        <Trash2 size={16}/> Delete
      </button>
    </div>
  );
}
