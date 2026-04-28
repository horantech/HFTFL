"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type GuestDraft = { id: string; name: string; phone: string; whatsappPhone: string; email: string };

function newGuest(): GuestDraft {
  return { id: crypto.randomUUID(), name: "", phone: "+251 ", whatsappPhone: "+251 ", email: "" };
}

export default function NewSponsorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sponsorType, setSponsorType] = useState<"representative" | "company">("representative");
  const [phone, setPhone] = useState("+251 ");
  const [email, setEmail] = useState("");
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [bank, setBank] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [seats, setSeats] = useState(1);
  const [guestList, setGuestList] = useState<GuestDraft[]>([newGuest()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateSeats(next: number) {
    const n = Math.max(1, Math.min(500, Math.floor(Number.isFinite(next) ? next : 1)));
    setSeats(n);
    setGuestList(list => {
      if (n === list.length) return list;
      if (n > list.length) {
        const extra = Array.from({ length: n - list.length }, () => newGuest());
        return [...list, ...extra];
      }
      return list.slice(0, n);
    });
  }

  function updateGuest(id: string, patch: Partial<GuestDraft>) {
    setGuestList(list => list.map(g => g.id === id ? { ...g, ...patch } : g));
  }

  function removeGuest(id: string) {
    setGuestList(list => {
      const next = list.filter(g => g.id !== id);
      setSeats(Math.max(1, next.length));
      return next.length === 0 ? [newGuest()] : next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Sponsor name is required"); return; }

    const cleanedGuests = guestList.map((g, i) => {
      // For representative type, the first guest defaults to the sponsor name + contact info
      const isLeadSlot = sponsorType === "representative" && i === 0;
      return {
        name: g.name.trim() || (isLeadSlot ? name.trim() : `Guest ${i + 1}`),
        phone: g.phone.trim() || (isLeadSlot ? phone.trim() : ""),
        whatsappPhone: g.whatsappPhone.trim(),
        email: g.email.trim() || (isLeadSlot ? email.trim() : ""),
      };
    });

    setSaving(true);
    try {
      const res = await fetch("/api/sponsors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactPhone: phone.trim() || null,
          contactEmail: email.trim() || null,
          isIndividual: false,
          sponsorType,
          paid,
          notes: notes.trim() || null,
          bank: bank.trim() || null,
          assignedTo: assignedTo.trim() || null,
          rsvp: rsvp || null,
          tableNumber: tableNumber.trim() || null,
          guests: cleanedGuests,
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
        <div className="text-sm font-semibold">Sponsor info</div>

        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
          <div>
            <label className="label">Sponsor type</label>
            <select className="input" value={sponsorType} onChange={e => setSponsorType(e.target.value as "representative" | "company")}>
              <option value="representative">Representative (person)</option>
              <option value="company">Company / Organization</option>
            </select>
          </div>
          <div>
            <label className="label">{sponsorType === "company" ? "Company name" : "Buyer / Representative name"}</label>
            <input className="input" required value={name} onChange={e=>setName(e.target.value)} placeholder={sponsorType === "company" ? "e.g. Acme Inc." : "e.g. Maranta Teka"}/>
            <div className="text-xs text-[var(--ink-mute)] mt-1">
              {sponsorType === "representative"
                ? "This person will attend as Guest 1 and get their own ticket SMS."
                : "Just the company — add the actual attendees as guests below."}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Contact phone</label>
            <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9..."/>
          </div>
          <div>
            <label className="label">Email (optional)</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Bank (optional)</label>
            <input className="input" value={bank} onChange={e=>setBank(e.target.value)} placeholder="e.g. CBE, Awash"/>
          </div>
          <div>
            <label className="label">Assigned to (optional)</label>
            <input className="input" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} placeholder="Staff member"/>
          </div>
          <div>
            <label className="label">RSVP</label>
            <select className="input" value={rsvp} onChange={e=>setRsvp(e.target.value)}>
              <option value="">—</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[160px_160px_1fr] gap-4 sm:items-end">
          <div>
            <label className="label">Number of seats</label>
            <input
              className="input"
              type="number"
              min={1}
              max={500}
              value={seats}
              onChange={e => updateSeats(parseInt(e.target.value, 10))}
            />
          </div>
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
          <textarea className="input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Preferences, dietary, etc."/>
        </div>
      </div>

      <div className="card space-y-3">
        <div>
          <div className="text-sm font-semibold">Guests</div>
          <div className="text-xs text-[var(--ink-mute)]">Empty name rows save as <em>Guest 1</em>, <em>Guest 2</em>, … — rename later from the detail page.</div>
        </div>

        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] gap-2 px-1 text-xs uppercase tracking-wider text-[var(--ink-mute)]">
            <div>Name</div><div>Phone</div><div>WhatsApp</div><div>Email (optional)</div><div></div>
          </div>
          {guestList.map((g, i) => {
            const isLeadSlot = sponsorType === "representative" && i === 0;
            const namePh = isLeadSlot ? (name.trim() || "Guest 1 (sponsor)") : `Guest ${i + 1}`;
            const phonePh = isLeadSlot ? (phone.trim() || "Phone (9...)") : "Phone (9...)";
            return (
              <div key={g.id} className="rounded-md border border-[var(--line)] sm:border-0 p-2 sm:p-0 grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] gap-2">
                <div className="sm:hidden text-xs font-medium text-[var(--ink-mute)]">
                  Guest {i + 1}{isLeadSlot ? " · auto-filled with sponsor info" : ""}
                </div>
                <input className="input" placeholder={namePh} value={g.name} onChange={e=>updateGuest(g.id, { name: e.target.value })}/>
                <input className="input" placeholder={phonePh} value={g.phone} onChange={e=>updateGuest(g.id, { phone: e.target.value })}/>
                <input className="input" placeholder="WhatsApp (9...)" value={g.whatsappPhone} onChange={e=>updateGuest(g.id, { whatsappPhone: e.target.value })}/>
                <input className="input" type="email" placeholder="email@example.com" value={g.email} onChange={e=>updateGuest(g.id, { email: e.target.value })}/>
                <button type="button" onClick={() => removeGuest(g.id)} className="btn btn-ghost btn-sm text-red-700 sm:btn-icon" aria-label="Remove" disabled={guestList.length === 1}>
                  <Trash2 size={14}/> <span className="sm:hidden">Remove this guest</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">{error}</div>}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={()=>history.back()}>Cancel</button>
        <button className="btn btn-primary btn-lg w-full sm:w-auto" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save sponsor"}
        </button>
      </div>
    </form>
  );
}
