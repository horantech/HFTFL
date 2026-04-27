"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";

export default function AddGuestForm({ sponsorId }: { sponsorId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(alsoCheckIn = false) {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/guests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Failed"); return; }
      if (alsoCheckIn) {
        await fetch(`/api/guests/${j.id}/checkin`, { method: "POST" });
      }
      setName(""); setPhone(""); setEmail("");
      router.refresh();
    } catch { setError("Network error"); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="card">
      <div className="text-sm font-semibold mb-3">Add a guest</div>
      <div className="grid sm:grid-cols-[2fr_1.3fr_1.3fr] gap-2">
        <div>
          <label className="label">Full name</label>
          <input className="input" required value={name} onChange={e=>setName(e.target.value)} placeholder="Guest name"/>
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+251 9..."/>
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
        <button type="submit" className="btn btn-outline btn-sm w-full sm:w-auto" disabled={busy || !name.trim()}>
          <Plus size={14}/> Add
        </button>
        <button type="button" onClick={() => submit(true)} className="btn btn-primary btn-sm w-full sm:w-auto" disabled={busy || !name.trim()}>
          <Check size={14}/> Add & check in
        </button>
      </div>
      {error && <div className="text-sm text-red-700 mt-2">{error}</div>}
    </form>
  );
}
