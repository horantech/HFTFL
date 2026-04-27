"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Upload, AlertTriangle } from "lucide-react";
import { confirmDialog } from "@/lib/confirm";

type PlannedGuest = {
  name: string;
  phone: string | null;
  whatsappPhone: string | null;
  email: string | null;
  scheduled: string | null;
};

type PlannedSponsor = {
  name: string;
  isIndividual: boolean;
  contactPhone: string | null;
  contactEmail: string | null;
  paid: boolean;
  assignedTo: string | null;
  bank: string | null;
  notes: string | null;
  ticketsBought: number;
  rsvpYes: number;
  rsvpNo: number;
  rsvpPending: number;
  guests: PlannedGuest[];
};

type Plan = { sponsors: PlannedSponsor[]; warnings: string[] };

export default function GroupedImportForm() {
  const router = useRouter();
  const [tsv, setTsv] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function preview() {
    setBusy("preview"); setError(null); setResult(null);
    try {
      const res = await fetch("/api/import/grouped", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tsv, commit: false }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Failed"); setPlan(null); return; }
      setPlan(j.plan);
    } catch { setError("Network error"); }
    finally { setBusy(null); }
  }

  async function commit() {
    if (!plan) return;
    const ok = await confirmDialog({
      title: "Import this batch?",
      message: `${plan.sponsors.length} sponsors and ${totalGuests(plan)} guests will be created.`,
      confirmLabel: "Import",
    });
    if (!ok) return;
    setBusy("commit"); setError(null);
    try {
      const res = await fetch("/api/import/grouped", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tsv, commit: true }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Failed"); return; }
      setResult(`Imported ${j.createdSponsors} sponsors and ${j.createdGuests} guests.`);
      setPlan(null);
      setTsv("");
      router.refresh();
    } catch { setError("Network error"); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <label className="label">Paste tab-separated rows (copy from Excel)</label>
        <textarea
          className="input font-mono text-xs"
          rows={12}
          value={tsv}
          onChange={e => setTsv(e.target.value)}
          placeholder={"N0\tFull Name\tCompany Name\tAssigned Person\tPhone No\tEmail\tWhatsApp\tTicket No.\tRSVP Status\tGuest Count\tPayment Status\tBANK\n1\tBelay T. Gebru\t\tBelay\t911941261\tbelay@example.com\t\t\tYes\t10\tPaid\t"}
        />
        <div className="flex gap-2 justify-end">
          <button onClick={preview} disabled={!tsv.trim() || busy !== null} className="btn btn-outline w-full sm:w-auto">
            <Eye size={16}/> {busy === "preview" ? "Parsing…" : "Preview"}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>}
      {result && <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{result}</div>}

      {plan && (
        <>
          <div className="card space-y-3">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div>
                <div className="text-sm font-semibold">Preview</div>
                <div className="text-xs text-[var(--ink-mute)]">
                  {plan.sponsors.length} sponsors · {totalGuests(plan)} guests · {totalTickets(plan)} tickets
                </div>
              </div>
              <button onClick={commit} disabled={busy !== null || plan.sponsors.length === 0} className="btn btn-primary w-full sm:w-auto">
                <Upload size={16}/> {busy === "commit" ? "Importing…" : `Import ${plan.sponsors.length} sponsors`}
              </button>
            </div>

            {plan.warnings.length > 0 && (
              <div className="text-sm bg-amber-50 border border-amber-200 rounded-md p-2.5 space-y-1">
                <div className="flex items-center gap-2 font-medium text-amber-900"><AlertTriangle size={14}/> Warnings</div>
                <ul className="text-amber-900/80 text-xs list-disc pl-5">
                  {plan.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="card card-pad-0 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="table min-w-[840px]">
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Paid</th>
                  <th>RSVP</th>
                  <th>Assigned</th>
                  <th>Bank</th>
                  <th>Tickets</th>
                  <th>Guests</th>
                </tr>
              </thead>
              <tbody>
                {plan.sponsors.map((s, i) => (
                  <tr key={i}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.isIndividual ? <span className="badge">Individual</span> : <span className="badge badge-ink">Sponsor</span>}</td>
                    <td className="text-[var(--ink-mute)] text-xs">{s.contactPhone || "—"}</td>
                    <td>{s.paid ? <span className="badge badge-success">Paid</span> : <span className="badge">Unpaid</span>}</td>
                    <td className="text-xs">{rsvpLabel(s)}</td>
                    <td className="text-[var(--ink-mute)] text-xs">{s.assignedTo || "—"}</td>
                    <td className="text-[var(--ink-mute)] text-xs">{s.bank || "—"}</td>
                    <td className="text-[var(--ink-mute)] text-xs">{s.ticketsBought}</td>
                    <td className="text-xs">
                      {s.guests.map(g => g.name).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function totalGuests(p: Plan) { return p.sponsors.reduce((a, s) => a + s.guests.length, 0); }
function totalTickets(p: Plan) { return p.sponsors.reduce((a, s) => a + s.ticketsBought, 0); }
function rsvpLabel(s: PlannedSponsor) {
  const parts: string[] = [];
  if (s.rsvpYes) parts.push(`${s.rsvpYes} yes`);
  if (s.rsvpNo) parts.push(`${s.rsvpNo} no`);
  if (s.rsvpPending) parts.push(`${s.rsvpPending} pending`);
  return parts.length ? parts.join(" · ") : "—";
}
