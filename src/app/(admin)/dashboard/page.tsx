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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-0.5">Overview of registrations and check-ins.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:w-auto">
          <Link href="/people/new-individual" className="btn btn-outline"><User size={16}/> Add individual</Link>
          <Link href="/people/new" className="btn btn-primary"><UserPlus size={16}/> New sponsor</Link>
          <Link href="/scan" className="btn btn-outline"><ScanLine size={16}/> Scanner</Link>
          {smsReady && <ReminderButton/>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
    <div className="card !p-3 sm:!p-4">
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-mute)]">{label}</div>
      <div className="text-2xl sm:text-3xl font-semibold mt-1 leading-none">{value}</div>
      {sub && <div className="text-[10px] sm:text-xs text-[var(--ink-mute)] mt-1">{sub}</div>}
    </div>
  );
}
