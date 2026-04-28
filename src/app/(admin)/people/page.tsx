import Link from "next/link";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { UserPlus, User } from "lucide-react";
import PeopleTable from "./PeopleTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "People · HFTF" };

type Filter = "all" | "sponsors" | "guests" | "unpaid" | "checkedin" | "pending";

async function loadData() {
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
      total: count(guests.id),
      checkedIn: count(guests.checkedInAt),
    })
    .from(sponsors)
    .leftJoin(guests, eq(guests.sponsorId, sponsors.id))
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
    .orderBy(guests.name);

  return { sponsorRows, guestRows };
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: Filter }>;
}) {
  const sp = await searchParams;
  const filter: Filter = (sp.filter as Filter) ?? "all";
  const { sponsorRows, guestRows } = await loadData();

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">People</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-0.5">Sponsors and the guests they brought, in one place.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link href="/people/new-individual" className="btn btn-outline"><User size={16}/> Add individual</Link>
          <Link href="/people/new" className="btn btn-primary"><UserPlus size={16}/> New sponsor</Link>
        </div>
      </div>

      <div className="card card-pad-0 overflow-hidden">
        <PeopleTable filter={filter} sponsors={sponsorRows} guests={guestRows}/>
      </div>
    </div>
  );
}
