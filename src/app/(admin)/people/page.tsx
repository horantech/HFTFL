import Link from "next/link";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { sql, desc, eq, ilike, or } from "drizzle-orm";
import { UserPlus, Search } from "lucide-react";
import PeopleTable from "./PeopleTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "People · HFTF" };

type Filter = "all" | "sponsors" | "guests" | "unpaid" | "checkedin" | "pending";

async function loadData(q: string) {
  const term = q.trim().length > 0 ? `%${q.trim()}%` : null;

  const sponsorRows = await db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      contactPhone: sponsors.contactPhone,
      contactEmail: sponsors.contactEmail,
      isIndividual: sponsors.isIndividual,
      paid: sponsors.paid,
      notes: sponsors.notes,
      createdAt: sponsors.createdAt,
      total: sql<number>`count(${guests.id})::int`,
      checkedIn: sql<number>`count(${guests.checkedInAt})::int`,
    })
    .from(sponsors)
    .leftJoin(guests, eq(guests.sponsorId, sponsors.id))
    .where(term ? or(ilike(sponsors.name, term), ilike(sponsors.contactPhone, term), ilike(sponsors.contactEmail, term)) : undefined)
    .groupBy(sponsors.id)
    .orderBy(desc(sponsors.createdAt));

  const guestRows = await db
    .select({
      id: guests.id,
      sponsorId: guests.sponsorId,
      name: guests.name,
      phone: guests.phone,
      email: guests.email,
      ticketCode: guests.ticketCode,
      checkedInAt: guests.checkedInAt,
      smsSentAt: guests.smsSentAt,
      sponsorName: sponsors.name,
      sponsorIsIndividual: sponsors.isIndividual,
      createdAt: guests.createdAt,
    })
    .from(guests)
    .innerJoin(sponsors, eq(sponsors.id, guests.sponsorId))
    .where(term ? or(ilike(guests.name, term), ilike(guests.phone, term), ilike(guests.email, term), ilike(sponsors.name, term)) : undefined)
    .orderBy(guests.name);

  return { sponsorRows, guestRows };
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: Filter }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const filter: Filter = (sp.filter as Filter) ?? "all";
  const { sponsorRows, guestRows } = await loadData(q);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">People</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-0.5">Sponsors and the guests they brought, in one place.</p>
        </div>
        <Link href="/people/new" className="btn btn-primary"><UserPlus size={16}/> New sponsor</Link>
      </div>

      <div className="card card-pad-0 overflow-hidden">
        <div className="p-3 border-b border-[var(--line)] flex flex-col sm:flex-row gap-2 sm:items-center">
          <form action="/people" className="flex items-center gap-2 flex-1">
            <Search size={16} className="text-[var(--ink-mute)] ml-1"/>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search guest, sponsor, phone, email…"
              className="input border-0 px-0"
              style={{ boxShadow: "none" }}
            />
            {filter !== "all" && <input type="hidden" name="filter" value={filter}/>}
          </form>
          <FilterChips current={filter} q={q}/>
        </div>
        <PeopleTable filter={filter} q={q} sponsors={sponsorRows} guests={guestRows}/>
      </div>
    </div>
  );
}

function FilterChips({ current, q }: { current: Filter; q: string }) {
  const items: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "sponsors", label: "Sponsors" },
    { key: "guests", label: "Guests" },
    { key: "unpaid", label: "Unpaid" },
    { key: "checkedin", label: "Checked in" },
    { key: "pending", label: "Pending" },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {items.map(it => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (it.key !== "all") params.set("filter", it.key);
        const href = `/people${params.toString() ? "?" + params.toString() : ""}`;
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
