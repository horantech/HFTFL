import Link from "next/link";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { sql, desc, eq, count } from "drizzle-orm";
import { ScanLine, UserPlus, User } from "lucide-react";
import ReminderButton from "./ReminderButton";
import { isSmsConfigured } from "@/lib/sms";
import PeopleTable from "../people/PeopleTable";

export const dynamic = "force-dynamic";

async function getStats() {
  const [agg] = await db
    .select({
      total: count(),
      checkedIn: count(guests.checkedInAt),
    })
    .from(guests);
  const [sponsorAgg] = await db
    .select({
      total: count(),
      paid: sql<number>`count(*) filter (where ${sponsors.paid} = true)`,
    })
    .from(sponsors);
  return { ...agg, sponsors: sponsorAgg.total, sponsorsPaid: sponsorAgg.paid };
}

async function loadPeople() {
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

export default async function DashboardPage() {
  const stats = await getStats();
  const remaining = stats.total - stats.checkedIn;
  const smsReady = isSmsConfigured();
  const { sponsorRows, guestRows } = await loadPeople();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-0.5">Overview of registrations and check-ins.</p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <Link href="/people/new-individual" className="btn btn-outline btn-lg"><User size={18}/> Add individual</Link>
          <Link href="/people/new" className="btn btn-primary btn-lg"><UserPlus size={18}/> New sponsor</Link>
          <Link href="/scan" className="btn btn-outline btn-lg"><ScanLine size={18}/> Open scanner</Link>
          {smsReady && <ReminderButton/>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sponsors" value={stats.sponsors} sub={`${stats.sponsorsPaid} paid`}/>
        <Stat label="Guests" value={stats.total} />
        <Stat label="Checked in" value={stats.checkedIn} />
        <Stat label="Remaining" value={remaining} />
      </div>

      <div className="card card-pad-0 overflow-hidden">
        <PeopleTable filter="all" sponsors={sponsorRows} guests={guestRows}/>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[var(--ink-mute)]">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-[var(--ink-mute)] mt-1">{sub}</div>}
    </div>
  );
}
