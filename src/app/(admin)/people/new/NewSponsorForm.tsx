"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type GuestDraft = { id: string; name: string; phone: string; email: string };

function newGuest(): GuestDraft {
  return { id: crypto.randomUUID(), name: "", phone: "", email: "" };
}

export default function NewSponsorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isIndividual, setIsIndividual] = useState(false);
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [guestList, setGuestList] = useState<GuestDraft[]>([newGuest()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateGuest(id: string, patch: Partial<GuestDraft>) {
    setGuestList(list => list.map(g => g.id === id ? { ...g, ...patch } : g));
  }
  function addGuest() {
    setGuestList(list => [...list, newGuest()]);
  }
  function removeGuest(id: string) {
    setGuestList(list => list.filter(g => g.id !== id));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedGuests = isIndividual
      ? [{ name, phone, email }]
      : guestList.map(g => ({ name: g.name.trim(), phone: g.phone.trim(), email: g.email.trim() })).filter(g => g.name.length > 0);

    if (!name.trim()) { setError("Sponsor name is required"); return; }
    if (cleanedGuests.length === 0 && !isIndividual) {
      if (!confirm("No guests added yet. Save sponsor anyway? You can add guests later.")) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactPhone: phone.trim() || null,
          contactEmail: email.trim() || null,
          isIndividual,
          paid,
          notes: notes.trim() || null,
          guests: cleanedGuests,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Failed"); return; }
      router.push(`/people/${j.id}`);
      router.refresh();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="card space-y-4">
        <div className="text-sm font-semibold">Sponsor info</div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input className="checkbox" type="checkbox" checked={isIndividual} onChange={e => setIsIndividual(e.target.checked)}/>
            Individual buyer (one person buying for themselves)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input className="checkbox" type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)}/>
            Payment received
          </label>
        </div>

        <div>
          <label className="label">{isIndividual ? "Full name" : "Company / CEO / Buyer name"}</label>
          <input className="input" required value={name} onChange={e=>setName(e.target.value)} placeholder={isIndividual ? "e.g. Mr. Abebe Kebede" : "e.g. Acme Inc."}/>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+251 9..."/>
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Table number, preferences, etc."/>
        </div>
      </div>

      {!isIndividual && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Guests</div>
              <div className="text-xs text-[var(--ink-mute)]">Add the people who will attend under this sponsor.</div>
            </div>
            <button type="button" onClick={addGuest} className="btn btn-outline btn-sm"><Plus size={14}/> Add guest</button>
          </div>

          {guestList.length === 0 ? (
            <div className="text-sm text-[var(--ink-mute)] py-2">No guests yet. Click <strong>Add guest</strong>.</div>
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1.2fr_auto] gap-2 px-1 text-xs uppercase tracking-wider text-[var(--ink-mute)]">
                <div>Name</div><div>Phone</div><div>Email (optional)</div><div></div>
              </div>
              {guestList.map((g, i) => (
                <div key={g.id} className="grid sm:grid-cols-[1.4fr_1fr_1.2fr_auto] gap-2">
                  <input className="input" placeholder={`Guest ${i + 1} name`} value={g.name} onChange={e=>updateGuest(g.id, { name: e.target.value })}/>
                  <input className="input" placeholder="+251 9..." value={g.phone} onChange={e=>updateGuest(g.id, { phone: e.target.value })}/>
                  <input className="input" type="email" placeholder="email@example.com" value={g.email} onChange={e=>updateGuest(g.id, { email: e.target.value })}/>
                  <button type="button" onClick={() => removeGuest(g.id)} className="btn btn-ghost btn-icon text-red-700" aria-label="Remove">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">{error}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={()=>history.back()}>Cancel</button>
        <button className="btn btn-primary" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save sponsor"}
        </button>
      </div>
    </form>
  );
}
