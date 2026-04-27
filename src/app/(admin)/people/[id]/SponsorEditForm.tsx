"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
type EditableSponsor = {
  id: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  bank: string | null;
  assignedTo: string | null;
  rsvp: string | null;
};

export default function SponsorEditForm({ sponsor }: { sponsor: EditableSponsor }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sponsor.name);
  const [phone, setPhone] = useState(sponsor.contactPhone ?? "+251 ");
  const [email, setEmail] = useState(sponsor.contactEmail ?? "");
  const [notes, setNotes] = useState(sponsor.notes ?? "");
  const [bank, setBank] = useState(sponsor.bank ?? "");
  const [assignedTo, setAssignedTo] = useState(sponsor.assignedTo ?? "");
  const [rsvp, setRsvp] = useState(sponsor.rsvp ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    const res = await fetch(`/api/sponsors/${sponsor.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        contactPhone: phone.trim() || null,
        contactEmail: email.trim() || null,
        notes: notes.trim() || null,
        bank: bank.trim() || null,
        assignedTo: assignedTo.trim() || null,
        rsvp: rsvp || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed to save");
    } else {
      setEditing(false);
      router.refresh();
    }
    setBusy(false);
  }

  function cancel() {
    setName(sponsor.name);
    setPhone(sponsor.contactPhone ?? "+251 ");
    setEmail(sponsor.contactEmail ?? "");
    setNotes(sponsor.notes ?? "");
    setBank(sponsor.bank ?? "");
    setAssignedTo(sponsor.assignedTo ?? "");
    setRsvp(sponsor.rsvp ?? "");
    setEditing(false);
    setError(null);
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm">
        <Pencil size={14}/> Edit details
      </button>
    );
  }

  return (
    <div className="card w-full space-y-3">
      <div className="text-sm font-semibold">Edit sponsor details</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Name"/>
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9..."/>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}/>
        </div>
        <div>
          <label className="label">Bank</label>
          <input className="input" value={bank} onChange={e => setBank(e.target.value)} placeholder="e.g. CBE, Awash"/>
        </div>
        <div>
          <label className="label">Assigned to</label>
          <input className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Staff member"/>
        </div>
        <div>
          <label className="label">RSVP</label>
          <select className="input" value={rsvp} onChange={e => setRsvp(e.target.value)}>
            <option value="">—</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Table, preferences…"/>
        </div>
      </div>
      {error && <div className="text-sm text-red-700">{error}</div>}
      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
        <button onClick={cancel} className="btn btn-ghost btn-sm w-full sm:w-auto"><X size={14}/> Cancel</button>
        <button onClick={save} disabled={busy || !name.trim()} className="btn btn-primary btn-sm w-full sm:w-auto">
          <Check size={14}/> {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
