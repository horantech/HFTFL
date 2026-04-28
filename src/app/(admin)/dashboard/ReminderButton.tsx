"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "@/lib/toast";
import { confirmDialog } from "@/lib/confirm";

export default function ReminderButton() {
  const [busy, setBusy] = useState(false);
  async function send() {
    const ok = await confirmDialog({
      title: "Send reminder SMS?",
      message: "This sends a reminder to every paid guest who has not checked in yet.",
      confirmLabel: "Send reminder",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await fetch("/api/sms/reminder-all", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { toast(j.error || "Failed to send reminders", "error"); return; }
      toast(`Sent ${j.sent} · failed ${j.failed} · skipped ${j.skipped}`, "success");
    } finally { setBusy(false); }
  }
  return (
    <button onClick={send} disabled={busy} className="btn btn-outline">
      <Send size={16}/> {busy ? "Sending…" : "Send reminder"}
    </button>
  );
}
