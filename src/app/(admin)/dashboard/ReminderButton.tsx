"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function ReminderButton() {
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!confirm("Send a reminder SMS to every guest who has NOT checked in yet?")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/sms/reminder-all", { method: "POST" });
      const j = await r.json();
      if (!r.ok) { alert(j.error || "Failed"); return; }
      alert(`Sent ${j.sent}, failed ${j.failed}, skipped (no phone) ${j.skipped}.`);
    } finally { setBusy(false); }
  }
  return (
    <button onClick={send} disabled={busy} className="btn btn-outline">
      <Send size={16}/> {busy ? "Sending…" : "Send reminder to all pending"}
    </button>
  );
}
