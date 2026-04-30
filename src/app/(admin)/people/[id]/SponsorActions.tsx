"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Ticket, Bell } from "lucide-react";
import { toast } from "@/lib/toast";
import { confirmDialog } from "@/lib/confirm";

type Props = {
  sponsorId: string;
  sponsorName: string;
  sponsorPhone: string | null;
  sponsorHasTicket: boolean;
  isIndividual: boolean;
  canRemind?: boolean;
};

export default function SponsorActions({
  sponsorId, sponsorName, sponsorPhone, sponsorHasTicket, isIndividual, canRemind = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

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
    const j = await res.json().catch(() => ({}));
    if (!res.ok) toast(j.error || "Failed to create ticket", "error");
    else toast(`Ticket generated for ${sponsorName}`, "success");
    router.refresh();
    setBusy(null);
  }

  async function remindAll() {
    const ok = await confirmDialog({
      title: `Send reminder to all guests of ${sponsorName}?`,
      message: "Eligible: paid, has phone, not yet checked in. One SMS per guest, even if they share a phone.",
      confirmLabel: "Send reminders",
    });
    if (!ok) return;
    setBusy("remind");
    const res = await fetch(`/api/sponsors/${sponsorId}/reminder`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) toast(j.error || "Failed to send reminders", "error");
    else toast(`Sent ${j.sent} · failed ${j.failed}`, "success");
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
    <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 sm:flex-wrap w-full sm:w-auto">
      {!sponsorHasTicket && !isIndividual && (
        <button onClick={addSponsorAsGuest} disabled={busy !== null} className="btn btn-outline">
          <Ticket size={16}/> {busy === "ticket" ? "Generating…" : `Ticket for ${sponsorName}`}
        </button>
      )}
      {canRemind && (
        <button onClick={remindAll} disabled={busy !== null} className="btn btn-outline">
          <Bell size={16}/> {busy === "remind" ? "Sending…" : "Send reminders"}
        </button>
      )}
      <button onClick={remove} disabled={busy !== null} className="btn btn-outline text-red-700">
        <Trash2 size={16}/> Delete
      </button>
    </div>
  );
}
