"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Check, Copy, Undo2, Trash2 } from "lucide-react";
import type { Guest } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

export default function GuestRow({ guest, smsReady }: { guest: Guest; smsReady: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    setBusy("sms");
    const res = await fetch(`/api/guests/${guest.id}/sms`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) alert(j.error || "Failed to send");
    router.refresh();
    setBusy(null);
  }
  async function remove() {
    if (!confirm(`Remove ${guest.name}?`)) return;
    setBusy("delete");
    await fetch(`/api/guests/${guest.id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }
  async function copyLink() {
    await navigator.clipboard.writeText(ticketUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          <Link href={`/t/${guest.ticketCode}`} target="_blank" className="btn btn-ghost text-sm">View</Link>
          <button onClick={copyLink} className="btn btn-ghost text-sm" title="Copy ticket link">
            <Copy size={14}/> {copied ? "Copied" : "Link"}
          </button>
        </div>
      </td>
      <td className="text-right">
        <div className="inline-flex items-center gap-1 flex-wrap justify-end">
          {smsReady && guest.phone && (
            <button onClick={sendSms} disabled={busy !== null} className="btn btn-outline text-sm" title="Send ticket SMS">
              <Send size={14}/> SMS
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
          <button onClick={remove} disabled={busy !== null} className="btn btn-ghost text-sm text-red-700" title="Remove">
            <Trash2 size={14}/>
          </button>
        </div>
      </td>
    </tr>
  );
}
