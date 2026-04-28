"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, Undo2, Send, Copy, Trash2, Plus, ExternalLink, Users, Search } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { confirmDialog } from "@/lib/confirm";
import TicketModal, { type TicketModalData } from "@/components/TicketModal";

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
  sponsors,
  guests,
}: {
  filter: Filter;
  sponsors: SponsorRow[];
  guests: GuestRow[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [ticketModal, setTicketModal] = useState<TicketModalData | null>(null);
  const [q, setQ] = useState("");

  const guestsBySponsor = useMemo(() => {
    const m = new Map<string, GuestRow[]>();
    for (const g of guests) {
      if (!m.has(g.sponsorId)) m.set(g.sponsorId, []);
      m.get(g.sponsorId)!.push(g);
    }
    return m;
  }, [guests]);

  const term = q.trim().toLowerCase();
  function matchesSponsor(s: SponsorRow): boolean {
    if (!term) return true;
    return (
      s.name.toLowerCase().includes(term) ||
      (s.contactPhone?.toLowerCase().includes(term) ?? false) ||
      (s.contactEmail?.toLowerCase().includes(term) ?? false)
    );
  }
  function matchesGuest(g: GuestRow): boolean {
    if (!term) return true;
    return (
      g.name.toLowerCase().includes(term) ||
      (g.phone?.toLowerCase().includes(term) ?? false) ||
      (g.email?.toLowerCase().includes(term) ?? false) ||
      g.sponsorName.toLowerCase().includes(term)
    );
  }

  const filteredSponsors = useMemo(() => {
    if (filter === "guests" || filter === "checkedin" || filter === "pending") return [];
    let s = sponsors;
    if (filter === "unpaid") s = s.filter(x => !x.paid);
    if (filter === "sponsors") s = s.filter(x => !x.isIndividual);
    if (term) {
      // Keep sponsors that match OR have any guest that matches
      s = s.filter(x => matchesSponsor(x) || (guestsBySponsor.get(x.id) ?? []).some(matchesGuest));
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sponsors, term, guestsBySponsor]);

  const filteredGuests = useMemo(() => {
    if (filter === "sponsors") return [];
    let g = guests;
    if (filter === "checkedin") g = g.filter(x => x.checkedInAt);
    else if (filter === "pending") g = g.filter(x => !x.checkedInAt);
    if (term) g = g.filter(matchesGuest);
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, guests, term]);

  const showFlatGuests = filter === "guests" || filter === "checkedin" || filter === "pending";

  // Auto-expand sponsors whose match comes only from a guest match (so the user sees what matched)
  useEffect(() => {
    if (!term) return;
    const toOpen = new Set<string>();
    for (const s of filteredSponsors) {
      const matchedSponsor = matchesSponsor(s);
      const matchedGuestUnder = (guestsBySponsor.get(s.id) ?? []).some(matchesGuest);
      if (!matchedSponsor && matchedGuestUnder) toOpen.add(s.id);
    }
    if (toOpen.size > 0) setExpanded(prev => new Set([...prev, ...toOpen]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, filteredSponsors]);

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
    const ok = await confirmDialog({
      title: "Send ticket SMS?",
      message: "This sends a ticket SMS to every guest under this sponsor.",
      confirmLabel: "Send",
    });
    if (!ok) return;
    setBusy("s-" + id);
    const r = await fetch(`/api/sponsors/${id}/sms`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) toast(j.error || "Failed to send SMS", "error");
    else toast(`Sent ${j.sent}${j.failed ? ` · ${j.failed} failed` : ""}`, "success");
    router.refresh();
    setBusy(null);
  }
  async function smsGuest(id: string) {
    setBusy("g-" + id);
    const r = await fetch(`/api/guests/${id}/sms`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) toast(j.error || "Failed to send SMS", "error");
    else toast("Ticket SMS sent", "success");
    router.refresh();
    setBusy(null);
  }
  async function copyLink(code: string) {
    const url = `${window.location.origin}/t/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Ticket link copied", "success");
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  }
  async function deleteSponsor(id: string, name: string) {
    const ok = await confirmDialog({
      title: `Delete ${name}?`,
      message: "All their guests will also be removed. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(id);
    await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }
  async function deleteGuest(id: string, name: string) {
    const ok = await confirmDialog({
      title: `Remove ${name}?`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
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
      toast(j.error || "Failed to add guest", "error");
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

  const modal = <TicketModal data={ticketModal} onClose={() => setTicketModal(null)}/>;

  const searchHeader = (
    <div className="border-b border-[var(--line)]">
      <div className="px-3 py-2 flex items-center gap-2">
        <Search size={16} className="text-[var(--ink-mute)] flex-shrink-0"/>
        <input
          autoFocus={false}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search guest, sponsor, phone…"
          className="input border-0 px-0 flex-1 min-w-0"
          style={{ boxShadow: "none" }}
        />
        {q && (
          <button onClick={() => setQ("")} className="btn btn-ghost btn-sm flex-shrink-0" aria-label="Clear search">Clear</button>
        )}
      </div>
      <div className="px-3 pb-2">
        <FilterChipsInline current={filter}/>
      </div>
    </div>
  );

  if (totalRows === 0) {
    return (
      <>
        {searchHeader}
        <div className="p-8 text-center text-[var(--ink-mute)] text-sm">
          {q ? <>No results for &ldquo;{q}&rdquo;.</> : <>No people yet. <Link href="/people/new" className="text-[var(--ink)] underline">Add the first sponsor</Link>.</>}
        </div>
        {modal}
      </>
    );
  }

  // Flat guests view (filter = guests / checkedin / pending)
  if (showFlatGuests) {
    return (
      <>
      {searchHeader}
      <div className="md:hidden p-3 space-y-2">
        {filteredGuests.map(g => (
          <div key={g.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-[var(--ink-soft)]">
                  {g.sponsorName}{g.sponsorIsIndividual ? " · individual" : ""}
                </div>
              </div>
              <span className="badge badge-ink">Guest</span>
            </div>
            <div className="text-xs text-[var(--ink-mute)]">{g.phone || "—"}</div>
            <div>
              {g.checkedInAt
                ? <span className="badge badge-success">Checked in · {formatTime(g.checkedInAt)}</span>
                : <span className="badge">Pending</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTicketModal({ ticketCode: g.ticketCode, guestName: g.name, sponsorName: g.sponsorName })} className="btn btn-ghost btn-sm" title="View ticket"><ExternalLink size={14}/> View</button>
              <button onClick={() => copyLink(g.ticketCode)} className="btn btn-ghost btn-sm" title="Copy link"><Copy size={14}/> Link</button>
              {g.checkedInAt
                ? <button onClick={() => uncheck(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700"><Undo2 size={14}/> Undo</button>
                : <button onClick={() => checkin(g.id)} disabled={busy !== null} className="btn btn-primary btn-sm"><Check size={14}/> Check in</button>}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block scroll-x">
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
                    <button onClick={() => setTicketModal({ ticketCode: g.ticketCode, guestName: g.name, sponsorName: g.sponsorName })} className="btn btn-ghost btn-sm" title="View ticket"><ExternalLink size={14}/></button>
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
      {modal}
      </>
    );
  }

  // Tree view: sponsors with expandable guests + inline add
  return (
    <>
    {searchHeader}
    <div className="md:hidden p-3 space-y-2">
      {filteredSponsors.map(s => {
        const isOpen = expanded.has(s.id);
        const sGuests = guestsBySponsor.get(s.id) || [];
        return (
          <div key={s.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-[var(--ink-mute)]">{s.contactPhone || "—"}</div>
              </div>
              <span className={`badge ${s.isIndividual ? "" : "badge-ink"}`}>
                {s.isIndividual ? "Individual" : "Sponsor"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-soft)]">
              <span className={s.checkedIn === s.total && s.total > 0 ? "badge badge-success" : "badge"}>
                <Users size={11}/> {s.checkedIn} / {s.total}
              </span>
              <button
                onClick={() => setPaid(s.id, !s.paid)}
                disabled={busy === "p-" + s.id}
                className={s.paid ? "badge badge-success cursor-pointer" : "badge cursor-pointer hover:bg-[var(--bg)]"}
              >
                {s.paid ? "Paid" : "Unpaid"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link href={`/people/${s.id}`} className="btn btn-ghost btn-sm">Open</Link>
              {s.paid && (
                <button onClick={() => smsSponsor(s.id)} disabled={busy !== null} className="btn btn-ghost btn-sm" title="Send tickets via SMS"><Send size={14}/> SMS</button>
              )}
              <button onClick={() => deleteSponsor(s.id, s.name)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700" title="Delete"><Trash2 size={14}/> Delete</button>
              {!s.isIndividual && (
                <button onClick={() => toggle(s.id)} className="btn btn-outline btn-sm">
                  {isOpen ? "Hide guests" : `Show guests (${sGuests.length})`}
                </button>
              )}
            </div>
            {isOpen && !s.isIndividual && (
              <div className="space-y-2 border-t border-[var(--line)] pt-2">
                {sGuests.length === 0 && (
                  <div className="text-xs text-[var(--ink-mute)] italic">No guests yet under this sponsor.</div>
                )}
                {sGuests.map(g => (
                  <div key={g.id} className="rounded-md border border-[var(--line)] p-2 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{g.name}</div>
                      {g.checkedInAt
                        ? <span className="badge badge-success">In</span>
                        : <span className="badge">Pending</span>}
                    </div>
                    <div className="text-xs text-[var(--ink-mute)]">{g.phone || "—"}</div>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => setTicketModal({ ticketCode: g.ticketCode, guestName: g.name, sponsorName: s.name })} className="btn btn-ghost btn-sm"><ExternalLink size={14}/> View</button>
                      <button onClick={() => copyLink(g.ticketCode)} className="btn btn-ghost btn-sm"><Copy size={14}/> Link</button>
                      {s.paid && (
                        <button onClick={() => smsGuest(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm"><Send size={14}/> SMS</button>
                      )}
                      {g.checkedInAt
                        ? <button onClick={() => uncheck(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700"><Undo2 size={14}/> Undo</button>
                        : <button onClick={() => checkin(g.id)} disabled={busy !== null} className="btn btn-primary btn-sm"><Check size={14}/> In</button>}
                      <button onClick={() => deleteGuest(g.id, g.name)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700"><Trash2 size={14}/> Remove</button>
                    </div>
                  </div>
                ))}
                {addingFor === s.id ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      className="input"
                      placeholder="Guest name"
                      value={addName}
                      onChange={e => setAddName(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Phone (optional)"
                      value={addPhone}
                      onChange={e => setAddPhone(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => submitAdd(s.id, false)} disabled={!addName.trim() || busy === "add-" + s.id} className="btn btn-outline btn-sm">Save</button>
                      <button onClick={() => submitAdd(s.id, true)} disabled={!addName.trim() || busy === "add-" + s.id} className="btn btn-primary btn-sm"><Check size={14}/> Save & check in</button>
                      <button onClick={() => setAddingFor(null)} className="btn btn-ghost btn-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startAdd(s.id)} className="btn btn-outline btn-sm w-full">
                    <Plus size={14}/> Add a guest
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
    <div className="hidden md:block overflow-x-auto">
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
                      {s.paid && (
                        <button onClick={() => smsSponsor(s.id)} disabled={busy !== null} className="btn btn-ghost btn-sm" title="Send tickets via SMS"><Send size={14}/></button>
                      )}
                      <button onClick={() => deleteSponsor(s.id, s.name)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700" title="Delete"><Trash2 size={14}/></button>
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
                            <button onClick={() => setTicketModal({ ticketCode: g.ticketCode, guestName: g.name, sponsorName: s.name })} className="btn btn-ghost btn-sm" title="View ticket"><ExternalLink size={14}/></button>
                            <button onClick={() => copyLink(g.ticketCode)} className="btn btn-ghost btn-sm" title="Copy link"><Copy size={14}/></button>
                            {s.paid && (
                              <button onClick={() => smsGuest(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm" title="SMS"><Send size={14}/></button>
                            )}
                            {g.checkedInAt
                              ? <button onClick={() => uncheck(g.id)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700"><Undo2 size={14}/></button>
                              : <button onClick={() => checkin(g.id)} disabled={busy !== null} className="btn btn-primary btn-sm"><Check size={14}/> In</button>}
                            <button onClick={() => deleteGuest(g.id, g.name)} disabled={busy !== null} className="btn btn-ghost btn-sm text-red-700" title="Remove"><Trash2 size={14}/></button>
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
    {modal}
    </>
  );
}

function FilterChipsInline({ current }: { current: Filter }) {
  const items: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "sponsors", label: "Sponsors" },
    { key: "guests", label: "Guests" },
    { key: "unpaid", label: "Unpaid" },
    { key: "checkedin", label: "Checked in" },
    { key: "pending", label: "Pending" },
  ];
  return (
    <div className="flex items-center gap-1 scroll-x -mx-1 px-1 pb-0.5">
      {items.map(it => {
        const href = it.key === "all" ? "/people" : `/people?filter=${it.key}`;
        const active = current === it.key;
        return (
          <Link
            key={it.key}
            href={href}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${
              active
                ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                : "bg-white text-[var(--ink-soft)] border-[var(--line)] hover:bg-[var(--bg)]"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
