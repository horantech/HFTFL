"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, Undo2, Send, Copy, Trash2, Plus, ExternalLink, Users } from "lucide-react";
import { formatTime } from "@/lib/utils";

type SponsorRow = {
  id: string;
  name: string;
  contactPhone: string | null;
  contactEmail: string | null;
  isIndividual: boolean;
  paid: boolean;
  notes: string | null;
  createdAt: Date;
  total: number;
  checkedIn: number;
};

type GuestRow = {
  id: string;
  sponsorId: string;
  name: string;
  phone: string | null;
  email: string | null;
  ticketCode: string;
  checkedInAt: Date | null;
  smsSentAt: Date | null;
  sponsorName: string;
  sponsorIsIndividual: boolean;
  createdAt: Date;
};

type Filter = "all" | "sponsors" | "guests" | "unpaid" | "checkedin" | "pending";

export default function PeopleTable({
  filter,
  q,
  sponsors,
  guests,
}: {
  filter: Filter;
  q: string;
  sponsors: SponsorRow[];
  guests: GuestRow[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");

  const guestsBySponsor = useMemo(() => {
    const m = new Map<string, GuestRow[]>();
    for (const g of guests) {
      if (!m.has(g.sponsorId)) m.set(g.sponsorId, []);
      m.get(g.sponsorId)!.push(g);
    }
    return m;
  }, [guests]);

  const filteredSponsors = useMemo(() => {
    if (filter === "guests" || filter === "checkedin" || filter === "pending") return [];
    let s = sponsors;
    if (filter === "unpaid") s = s.filter(x => !x.paid);
    if (filter === "sponsors") s = s.filter(x => !x.isIndividual);
    return s;
  }, [filter, sponsors]);

  const filteredGuests = useMemo(() => {
    if (filter === "sponsors") return [];
    let g = guests;
    if (filter === "checkedin") g = g.filter(x => x.checkedInAt);
    else if (filter === "pending") g = g.filter(x => !x.checkedInAt);
    return g;
  }, [filter, guests]);

  const showFlatGuests = filter === "guests" || filter === "checkedin" || filter === "pending";

  function toggle(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function stop<E extends React.SyntheticEvent>(fn: (e: E) => void) {
    return (e: E) => { e.stopPropagation(); fn(e); };
  }

  async function checkin(id: string) {
    setBusy(id);
    await fetch(`/api/guests/${id}/checkin`, { method: "POST" });
    router.refresh();
    setBusy(null);
  }
  async function uncheck(id: string) {
    setBusy(id);
    await fetch(`/api/guests/${id}/checkin`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }
  async function setPaid(id: string, paid: boolean) {
    setBusy("p-" + id);
    await fetch(`/api/sponsors/${id}/paid`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paid }),
    });
    router.refresh();
    setBusy(null);
  }
  async function smsSponsor(id: string) {
    if (!confirm("Send ticket SMS to this sponsor and all their guests?")) return;
    setBusy("s-" + id);
    const r = await fetch(`/api/sponsors/${id}/sms`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) alert(j.error || "Failed");
    else alert(`Sent ${j.sent}, failed ${j.failed}.`);
    router.refresh();
    setBusy(null);
  }
  async function smsGuest(id: string) {
    setBusy("g-" + id);
    const r = await fetch(`/api/guests/${id}/sms`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) alert(j.error || "Failed");
    router.refresh();
    setBusy(null);
  }
  async function copyLink(code: string) {
    const url = `${window.location.origin}/t/${code}`;
    try { await navigator.clipboard.writeText(url); } catch {}
  }
  async function deleteSponsor(id: string) {
    if (!confirm("Delete this sponsor and all their guests?")) return;
    setBusy(id);
    await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }
  async function deleteGuest(id: string) {
    if (!confirm("Remove this guest?")) return;
    setBusy(id);
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }

  function startAdd(sponsorId: string) {
    setAddingFor(sponsorId);
    setAddName("");
    setAddPhone("");
  }
  async function submitAdd(sponsorId: string, alsoCheckIn = false) {
    if (!addName.trim()) return;
    setBusy("add-" + sponsorId);
    const res = await fetch(`/api/sponsors/${sponsorId}/guests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: addName.trim(), phone: addPhone.trim() || null }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed to add");
      setBusy(null);
      return;
    }
    if (alsoCheckIn) {
      const j = await res.json();
      await fetch(`/api/guests/${j.id}/checkin`, { method: "POST" });
    }
    setAddName(""); setAddPhone("");
    router.refresh();
    setBusy(null);
  }

  const totalRows = showFlatGuests ? filteredGuests.length : filteredSponsors.length;

  if (totalRows === 0) {
    return (
      <div className="p-8 text-center text-[var(--ink-mute)] text-sm">
        {q ? <>No results for &ldquo;{q}&rdquo;.</> : <>No people yet. <Link href="/people/new" className="text-[var(--ink)] underline">Add the first sponsor</Link>.</>}
      </div>
    );
  }

  // Flat guests view (filter = guests / checkedin / pending)
  if (showFlatGuests) {
    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Sponsor</th>
              <th>Phone</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map(g => (
              <tr key={g.id}>
                <td><span className="badge badge-ink">Guest</span></td>
                <td className="font-medium">{g.name}</td>
                <td>
                  <span className="text-[var(--ink-soft)]">
                    {g.sponsorName}{g.sponsorIsIndividual ? " · individual" : ""}
                  </span>
                </td>
                <td className="text-[var(--ink-mute)]">{g.phone || "—"}</td>
                <td>
                  {g.checkedInAt
                    ? <span className="badge badge-success">Checked in · {formatTime(g.checkedInAt)}</span>
                    : <span className="badge">Pending</span>}
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <Link href={`/t/${g.ticketCode}`} target="_blank" className="btn btn-ghost btn-sm" title="View ticket"><ExternalLink size={14}/></Link>
                    <button onClick={() => copyLink(g.ticketCode)} className="btn btn-ghost btn-sm" title="Copy link"><Copy size={14}/></button>
                    {g.checkedInAt
                      ? <button onClick={() => uncheck(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700"><Undo2 size={14}/></button>
                      : <button onClick={() => checkin(g.id)} disabled={busy !== null} className="btn btn-primary btn-sm"><Check size={14}/> Check in</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Tree view: sponsors with expandable guests + inline add
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th className="w-8"></th>
            <th>Type</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Guests</th>
            <th>Paid</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredSponsors.map(s => {
            const isOpen = expanded.has(s.id);
            const sGuests = guestsBySponsor.get(s.id) || [];
            const hasChildren = !s.isIndividual && sGuests.length >= 0;

            return (
              <Fragment key={s.id}>
                <tr
                  onClick={() => hasChildren && toggle(s.id)}
                  className={hasChildren ? "cursor-pointer" : ""}
                >
                  <td className="w-8">
                    {hasChildren && (
                      <ChevronRight
                        size={14}
                        className={`transition-transform text-[var(--ink-mute)] ${isOpen ? "rotate-90" : ""}`}
                      />
                    )}
                  </td>
                  <td>
                    <span className={`badge ${s.isIndividual ? "" : "badge-ink"}`}>
                      {s.isIndividual ? "Individual" : "Sponsor"}
                    </span>
                  </td>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-[var(--ink-mute)]">{s.contactPhone || "—"}</td>
                  <td>
                    {s.total === 0 ? <span className="text-[var(--ink-mute)]">0</span> : (
                      <span className={s.checkedIn === s.total && s.total > 0 ? "badge badge-success" : "badge"}>
                        <Users size={11}/> {s.checkedIn} / {s.total}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={stop(() => setPaid(s.id, !s.paid))}
                      disabled={busy === "p-" + s.id}
                      className={s.paid ? "badge badge-success cursor-pointer" : "badge cursor-pointer hover:bg-[var(--bg)]"}
                    >
                      {s.paid ? "Paid" : "Unpaid"}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/people/${s.id}`} className="btn btn-ghost btn-sm" title="Open detail">Open</Link>
                      <button onClick={() => smsSponsor(s.id)} disabled={busy !== null} className="btn btn-ghost btn-sm" title="Send tickets via SMS"><Send size={14}/></button>
                      <button onClick={() => deleteSponsor(s.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700" title="Delete"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>

                {isOpen && (
                  <>
                    {sGuests.length === 0 && (
                      <tr className="bg-[var(--bg)]">
                        <td></td>
                        <td colSpan={6} className="text-sm text-[var(--ink-mute)] italic">
                          No guests yet under this sponsor. Add one below.
                        </td>
                      </tr>
                    )}
                    {sGuests.map(g => (
                      <tr key={g.id} className="bg-[var(--bg)]">
                        <td></td>
                        <td><span className="badge">Guest</span></td>
                        <td className="pl-2">
                          <span className="text-[var(--ink-mute)] mr-2">↳</span>
                          <span className="font-medium">{g.name}</span>
                        </td>
                        <td className="text-[var(--ink-mute)]">{g.phone || "—"}</td>
                        <td colSpan={2}>
                          {g.checkedInAt
                            ? <span className="badge badge-success">Checked in · {formatTime(g.checkedInAt)}</span>
                            : <span className="badge">Pending</span>}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex gap-1">
                            <Link href={`/t/${g.ticketCode}`} target="_blank" className="btn btn-ghost btn-sm" title="View ticket"><ExternalLink size={14}/></Link>
                            <button onClick={() => copyLink(g.ticketCode)} className="btn btn-ghost btn-sm" title="Copy link"><Copy size={14}/></button>
                            <button onClick={() => smsGuest(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm" title="SMS"><Send size={14}/></button>
                            {g.checkedInAt
                              ? <button onClick={() => uncheck(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700"><Undo2 size={14}/></button>
                              : <button onClick={() => checkin(g.id)} disabled={busy !== null} className="btn btn-primary btn-sm"><Check size={14}/> In</button>}
                            <button onClick={() => deleteGuest(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700" title="Remove"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Inline add-guest row */}
                    <tr className="bg-[var(--bg)]">
                      <td></td>
                      <td colSpan={6}>
                        {addingFor === s.id ? (
                          <div className="flex gap-2 items-center flex-wrap">
                            <input
                              autoFocus
                              className="input flex-1 min-w-[160px]"
                              placeholder="Guest name"
                              value={addName}
                              onChange={e => setAddName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); submitAdd(s.id); }
                                if (e.key === "Escape") { setAddingFor(null); }
                              }}
                            />
                            <input
                              className="input flex-1 min-w-[140px]"
                              placeholder="Phone (optional)"
                              value={addPhone}
                              onChange={e => setAddPhone(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(s.id); } }}
                            />
                            <button onClick={() => submitAdd(s.id, false)} disabled={!addName.trim() || busy === "add-" + s.id} className="btn btn-outline btn-sm">
                              Save
                            </button>
                            <button onClick={() => submitAdd(s.id, true)} disabled={!addName.trim() || busy === "add-" + s.id} className="btn btn-primary btn-sm">
                              <Check size={14}/> Save & check in
                            </button>
                            <button onClick={() => setAddingFor(null)} className="btn btn-ghost btn-sm">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startAdd(s.id)} className="btn btn-outline btn-sm">
                            <Plus size={14}/> Add a guest under {s.name}
                          </button>
                        )}
                      </td>
                    </tr>
                  </>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
