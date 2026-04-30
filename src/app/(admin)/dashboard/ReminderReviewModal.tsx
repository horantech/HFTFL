"use client";

import { useEffect, useState } from "react";
import { X, Bell, AlertTriangle } from "lucide-react";
import { toast } from "@/lib/toast";

type Missing = { sponsorId: string; sponsorName: string; recipientCount: number };
type Preview = {
  ok: true;
  uniquePhones: number;
  noPhone: number;
  totalRows: number;
  dedupSkipped: number;
  sponsorsMissingTable: Missing[];
};

export default function ReminderReviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [savingTables, setSavingTables] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !sending) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, sending]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setPreview(null);
    setTables({});
    fetch("/api/sms/reminder-preview")
      .then(r => r.json())
      .then((j: Preview | { error: string }) => {
        if (cancelled) return;
        if ("error" in j) { toast(j.error, "error"); onClose(); return; }
        setPreview(j);
      })
      .catch(() => { if (!cancelled) toast("Failed to load preview", "error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function refresh() {
    setLoading(true);
    const r = await fetch("/api/sms/reminder-preview");
    const j = await r.json();
    setPreview(j);
    setLoading(false);
  }

  async function saveTables() {
    if (!preview) return;
    const entries = Object.entries(tables).filter(([, v]) => v.trim());
    if (entries.length === 0) return;
    setSavingTables(true);
    try {
      for (const [sponsorId, value] of entries) {
        const res = await fetch(`/api/sponsors/${sponsorId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tableNumber: value.trim() }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast(j.error || `Failed to save ${sponsorId}`, "error");
        }
      }
      toast(`Saved ${entries.length} table number${entries.length === 1 ? "" : "s"}`, "success");
      setTables({});
      await refresh();
    } finally {
      setSavingTables(false);
    }
  }

  async function send() {
    setSending(true);
    try {
      const r = await fetch("/api/sms/reminder-all", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { toast(j.error || "Failed to send reminders", "error"); return; }
      toast(`Sent ${j.sent} · failed ${j.failed} · skipped ${j.skipped}`, "success");
      onClose();
    } finally {
      setSending(false);
    }
  }

  const pendingTableEdits = Object.values(tables).filter(v => v.trim()).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
      <div onClick={() => !sending && onClose()} className="absolute inset-0 bg-black/60"/>
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[var(--line)] px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              <Bell size={16}/> Send reminder SMS
            </div>
            <div className="text-xs text-[var(--ink-mute)] mt-0.5">Review the roster before firing.</div>
          </div>
          <button onClick={() => !sending && onClose()} disabled={sending} className="btn btn-ghost btn-sm" aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading && <div className="text-sm text-[var(--ink-mute)]">Loading recipient list…</div>}

          {preview && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Will send" value={preview.uniquePhones}/>
                <Stat label="No phone" value={preview.noPhone}/>
                <Stat label="Dedup skipped" value={preview.dedupSkipped}/>
              </div>

              {preview.sponsorsMissingTable.length > 0 ? (
                <div className="card !p-3 border-amber-300 bg-amber-50/40 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0"/>
                    <div>
                      <div className="text-sm font-semibold">
                        {preview.sponsorsMissingTable.length} sponsor{preview.sponsorsMissingTable.length === 1 ? "" : "s"} missing a table number
                      </div>
                      <div className="text-xs text-[var(--ink-mute)] mt-0.5">
                        Their guests will get the reminder without a table line. Fill in below to include it.
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {preview.sponsorsMissingTable.map(s => (
                      <div key={s.sponsorId} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{s.sponsorName}</div>
                          <div className="text-[11px] text-[var(--ink-mute)]">{s.recipientCount} recipient{s.recipientCount === 1 ? "" : "s"}</div>
                        </div>
                        <input
                          className="input w-24 text-sm"
                          placeholder="Table #"
                          value={tables[s.sponsorId] ?? ""}
                          onChange={e => setTables(t => ({ ...t, [s.sponsorId]: e.target.value }))}
                          disabled={savingTables || sending}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveTables}
                      disabled={pendingTableEdits === 0 || savingTables || sending}
                      className="btn btn-outline btn-sm"
                    >
                      {savingTables ? "Saving…" : `Save ${pendingTableEdits || ""} table${pendingTableEdits === 1 ? "" : "s"}`.trim()}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[var(--ink-mute)]">All sponsors have a table number on file.</div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button onClick={onClose} disabled={sending} className="btn btn-ghost btn-sm">Cancel</button>
                <button
                  onClick={send}
                  disabled={sending || preview.uniquePhones === 0}
                  className="btn btn-primary btn-sm"
                >
                  <Bell size={14}/> {sending ? "Sending…" : `Send to ${preview.uniquePhones}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card !p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">{label}</div>
      <div className="text-xl font-semibold mt-0.5 leading-none">{value}</div>
    </div>
  );
}
