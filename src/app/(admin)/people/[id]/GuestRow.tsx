"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Send, Check, Copy, Undo2, Trash2, Pencil, X } from "lucide-react";
import type { Guest } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { confirmDialog } from "@/lib/confirm";
import TicketModal, { type TicketModalData } from "@/components/TicketModal";

export default function GuestRow({ guest, smsReady, sponsorName }: { guest: Guest; smsReady: boolean; sponsorName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(guest.name);
  const [editPhone, setEditPhone] = useState(guest.phone ?? "");
  const [editEmail, setEditEmail] = useState(guest.email ?? "");
  const [ticketModal, setTicketModal] = useState<TicketModalData | null>(null);
  const ticketUrl = typeof window !== "undefined"
    ? `${window.location.origin}/t/${guest.ticketCode}`
    : `/t/${guest.ticketCode}`;

  async function checkin() {
    setBusy("checkin");
    await fetch(`/api/guests/${guest.id}/checkin`, { method: "POST" });
    router.refresh();
    setBusy(null);
  }
  async function uncheck() {
    setBusy("uncheck");
    await fetch(`/api/guests/${guest.id}/checkin`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }
  async function sendSms() {
    const alreadySent = guest.smsSentAt;
    const ok = await confirmDialog({
      title: alreadySent ? "SMS already sent" : "Send ticket SMS?",
      message: alreadySent
        ? `Ticket SMS was already sent on ${formatDateTime(alreadySent)}. Send again?`
        : `Send ticket link to ${guest.name} at ${guest.phone}?`,
      confirmLabel: alreadySent ? "Send again" : "Send",
    });
    if (!ok) return;
    setBusy("sms");
    const res = await fetch(`/api/guests/${guest.id}/sms`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) toast(j.error || "Failed to send SMS", "error");
    else toast(`Ticket SMS sent to ${guest.name}`, "success");
    router.refresh();
    setBusy(null);
  }
  async function remove() {
    const ok = await confirmDialog({
      title: `Remove ${guest.name}?`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setBusy("delete");
    await fetch(`/api/guests/${guest.id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }
  async function saveEdit() {
    if (!editName.trim()) return;
    setBusy("edit");
    await fetch(`/api/guests/${guest.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() || null, email: editEmail.trim() || null }),
    });
    setEditing(false);
    router.refresh();
    setBusy(null);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(ticketUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (editing) {
    return (
      <tr>
        <td><input className="input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name"/></td>
        <td><input className="input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+251 9..."/></td>
        <td><input className="input" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email"/></td>
        <td colSpan={2}>
          <div className="flex gap-1">
            <button onClick={saveEdit} disabled={busy !== null || !editName.trim()} className="btn btn-primary btn-sm"><Check size={14}/> Save</button>
            <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm"><X size={14}/> Cancel</button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="font-medium">{guest.name}</td>
      <td className="text-[var(--ink-soft)]">{guest.phone || "—"}</td>
      <td>
        {guest.checkedInAt ? (
          <span className="badge badge-success">In · {formatDateTime(guest.checkedInAt)}</span>
        ) : guest.smsSentAt ? (
          <span className="badge">SMS sent</span>
        ) : (
          <span className="badge badge-muted">Pending</span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-1">
          <button onClick={() => setTicketModal({ ticketCode: guest.ticketCode, guestName: guest.name, sponsorName })} className="btn btn-ghost text-sm">View</button>
          <button onClick={copyLink} className="btn btn-ghost text-sm" title="Copy ticket link">
            <Copy size={14}/> {copied ? "Copied" : "Link"}
          </button>
        </div>
      </td>
      <td className="text-right">
        <div className="inline-flex items-center gap-1 flex-wrap justify-end">
          {smsReady && guest.phone && (
            <button onClick={sendSms} disabled={busy !== null} className={`btn btn-sm ${guest.smsSentAt ? "btn-ghost" : "btn-outline"}`} title="Send ticket SMS">
              <Send size={14}/> {busy === "sms" ? "Sending…" : guest.smsSentAt ? "Resend" : "SMS"}
            </button>
          )}
          {guest.checkedInAt ? (
            <button onClick={uncheck} disabled={busy !== null} className="btn btn-ghost text-sm text-red-700">
              <Undo2 size={14}/> Undo
            </button>
          ) : (
            <button onClick={checkin} disabled={busy !== null} className="btn btn-primary text-sm">
              <Check size={14}/> Check in
            </button>
          )}
          <button onClick={() => setEditing(true)} disabled={busy !== null} className="btn btn-ghost text-sm" title="Edit">
            <Pencil size={14}/>
          </button>
          <button onClick={remove} disabled={busy !== null} className="btn btn-ghost text-sm text-red-700" title="Remove">
            <Trash2 size={14}/>
          </button>
        </div>
      </td>
      {typeof window !== "undefined" && createPortal(
        <TicketModal data={ticketModal} onClose={() => setTicketModal(null)}/>,
        document.body,
      )}
    </tr>
  );
}
