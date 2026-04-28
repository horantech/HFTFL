"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";

export default function AddGuestForm({ sponsorId, existingCount }: { sponsorId: string; existingCount: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+251 ");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoName = `Guest ${existingCount + 1}`;

  async function submit(alsoCheckIn = false) {
    setBusy(true); setError(null);
    const finalName = name.trim() || autoName;
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/guests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: finalName, phone: phone.trim() || null, email: email.trim() || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error || `Failed (HTTP ${res.status})`); return; }
      if (alsoCheckIn && j.id) {
        await fetch(`/api/guests/${j.id}/checkin`, { method: "POST" });
      }
      setName(""); setPhone("+251 "); setEmail("");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Network error"); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="card">
      <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
        <div className="text-sm font-semibold">Add a guest</div>
        <div className="text-xs text-[var(--ink-mute)]">Leave the name blank to add a placeholder slot ({autoName}).</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1.3fr_1.3fr] gap-2 sm:gap-3">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder={autoName}/>
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9..."/>
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 mt-3">
        <button type="submit" className="btn btn-outline" disabled={busy}>
          <Plus size={14}/> {busy ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => submit(true)} className="btn btn-primary" disabled={busy}>
          <Check size={14}/> Add & check in
        </button>
      </div>
      {error && <div className="text-sm text-red-700 mt-2">{error}</div>}
    </form>
  );
}
