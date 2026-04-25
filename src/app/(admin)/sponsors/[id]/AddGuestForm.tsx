"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function AddGuestForm({ sponsorId }: { sponsorId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/guests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Failed"); return; }
      setName(""); setPhone(""); setEmail("");
      router.refresh();
    } catch { setError("Network error"); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-1">Add a guest</div>
      <div className="grid sm:grid-cols-[2fr_1.5fr_1.5fr_auto] gap-3 items-end">
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
        <button className="btn btn-primary h-[42px]" disabled={busy || !name.trim()}>
          <Plus size={16}/> Add
        </button>
      </div>
      {error && <div className="text-sm text-red-700 mt-2">{error}</div>}
    </form>
  );
}
