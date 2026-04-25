"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewSponsorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isIndividual, setIsIndividual] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, contactPhone: phone, contactEmail: email, isIndividual, notes }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Failed");
        return;
      }
      router.push(`/sponsors/${j.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label">Company / CEO / Person name</label>
        <input className="input" required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Acme Inc. or Mr. Abebe Kebede"/>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Contact phone</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+251 9..."/>
        </div>
        <div>
          <label className="label">Contact email (optional)</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
      </div>
      <label className="flex items-center gap-2 select-none">
        <input type="checkbox" checked={isIndividual} onChange={e=>setIsIndividual(e.target.checked)}/>
        <span className="text-sm">This is an <strong>individual</strong> guest buying for themselves</span>
      </label>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea className="input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Table number, dietary preferences, etc."/>
      </div>
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={()=>history.back()}>Cancel</button>
        <button className="btn btn-primary" disabled={saving || !name.trim()}>{saving ? "Saving…" : "Create sponsor"}</button>
      </div>
    </form>
  );
}
