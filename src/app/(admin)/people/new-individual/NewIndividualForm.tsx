"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewIndividualForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251 ");
  const [email, setEmail] = useState("");
  const [paid, setPaid] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Name is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactPhone: phone.trim() || null,
          contactEmail: email.trim() || null,
          isIndividual: true,
          sponsorType: "representative",
          paid,
          tableNumber: tableNumber.trim() || null,
          notes: notes.trim() || null,
          guests: [{ name: name.trim(), phone: phone.trim(), email: email.trim() }],
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || "Failed"); return; }
      router.push(`/people/${j.id}`);
      router.refresh();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="card space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mr. Abebe Kebede"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9..."/>
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4 sm:items-end">
          <div>
            <label className="label">Table number</label>
            <input className="input" value={tableNumber} onChange={e=>setTableNumber(e.target.value)} placeholder="e.g. 12 or VIP-3"/>
          </div>
          <label className="flex items-center gap-2 text-sm pb-2">
            <input className="checkbox" type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)}/>
            Payment received
          </label>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Table number, preferences, etc."/>
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">{error}</div>}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={()=>history.back()}>Cancel</button>
        <button className="btn btn-primary btn-lg w-full sm:w-auto" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save individual"}
        </button>
      </div>
    </form>
  );
}
