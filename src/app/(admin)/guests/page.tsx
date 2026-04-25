import Link from "next/link";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { Search, UserPlus } from "lucide-react";
import GuestSearchRow from "./GuestSearchRow";

export const dynamic = "force-dynamic";

async function search(q: string) {
  if (!q || q.trim().length === 0) {
    return db
      .select({
        id: guests.id, name: guests.name, phone: guests.phone, ticketCode: guests.ticketCode,
        checkedInAt: guests.checkedInAt, sponsorId: guests.sponsorId, sponsorName: sponsors.name,
      })
      .from(guests)
      .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
      .orderBy(desc(guests.createdAt))
      .limit(50);
  }
  const term = `%${q.trim()}%`;
  return db
    .select({
      id: guests.id, name: guests.name, phone: guests.phone, ticketCode: guests.ticketCode,
      checkedInAt: guests.checkedInAt, sponsorId: guests.sponsorId, sponsorName: sponsors.name,
    })
    .from(guests)
    .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
    .where(or(
      ilike(guests.name, term),
      ilike(guests.phone, term),
      ilike(guests.email, term),
      ilike(sponsors.name, term),
    ))
    .orderBy(sql`(${guests.checkedInAt} IS NOT NULL)`, sponsors.name, guests.name)
    .limit(200);
}

export default async function GuestsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const list = await search(q);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Front desk</div>
          <h1 className="font-display text-3xl">Guests</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Search by guest name, phone, email, or by company / CEO who brought them.
          </p>
        </div>
        <Link href="/sponsors/new" className="btn btn-primary"><UserPlus size={16}/> Add new (walk-in)</Link>
      </div>

      <form action="/guests" className="card flex items-center gap-2">
        <Search size={18} className="text-[var(--ink-soft)]"/>
        <input
          name="q"
          autoFocus
          defaultValue={q}
          placeholder="Type a name, phone, or company / CEO..."
          className="input border-0 px-0"
          style={{ boxShadow: "none" }}
        />
        {q && <Link href="/guests" className="btn btn-ghost text-sm">Clear</Link>}
      </form>

      <div className="card card-pad-0 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-[var(--ink-soft)] text-sm">
            No guests match. {q && <>Try a different search, or <Link href="/sponsors/new" className="underline">add a new walk-in</Link>.</>}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Sponsor</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(g => <GuestSearchRow key={g.id} g={g}/>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
