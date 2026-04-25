import Link from "next/link";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { sql, desc, eq, ilike, or } from "drizzle-orm";
import { UserPlus, Search } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSponsors(q?: string) {
  const filter = q && q.trim().length > 0
    ? or(ilike(sponsors.name, `%${q.trim()}%`), ilike(sponsors.contactPhone, `%${q.trim()}%`))
    : undefined;
  return db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      contactPhone: sponsors.contactPhone,
      isIndividual: sponsors.isIndividual,
      createdAt: sponsors.createdAt,
      total: sql<number>`count(${guests.id})::int`,
      checkedIn: sql<number>`count(${guests.checkedInAt})::int`,
    })
    .from(sponsors)
    .leftJoin(guests, eq(guests.sponsorId, sponsors.id))
    .where(filter)
    .groupBy(sponsors.id)
    .orderBy(desc(sponsors.createdAt));
}

export default async function SponsorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const list = await getSponsors(q);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Companies & individuals</div>
          <h1 className="font-display text-3xl">Sponsors</h1>
        </div>
        <Link href="/sponsors/new" className="btn btn-primary"><UserPlus size={16}/> New sponsor</Link>
      </div>

      <form action="/sponsors" className="card flex items-center gap-2">
        <Search size={18} className="text-[var(--ink-soft)]" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by company / CEO name or phone…"
          className="input border-0 focus:shadow-none focus:ring-0 px-0"
          style={{ boxShadow: "none" }}
        />
        {q && <Link href="/sponsors" className="btn btn-ghost text-sm">Clear</Link>}
      </form>

      <div className="card card-pad-0 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-[var(--ink-soft)]">
            <div className="font-display text-lg mb-1">No sponsors yet</div>
            <div className="text-sm mb-4">Add a company, CEO, or individual buyer to get started.</div>
            <Link href="/sponsors/new" className="btn btn-primary"><UserPlus size={16}/> New sponsor</Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sponsor</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Guests</th>
                <th>Checked in</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td className="text-[var(--ink-soft)]">{s.contactPhone || "—"}</td>
                  <td>
                    {s.isIndividual ? <span className="badge">Individual</span> : <span className="badge badge-muted">Company / Group</span>}
                  </td>
                  <td>{s.total}</td>
                  <td>
                    {s.total === 0 ? "—" : (
                      <span className={s.checkedIn === s.total ? "badge badge-success" : "badge"}>
                        {s.checkedIn} / {s.total}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <Link href={`/sponsors/${s.id}`} className="btn btn-ghost text-sm">Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
