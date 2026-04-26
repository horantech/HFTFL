import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import SponsorActions from "./SponsorActions";
import GuestRow from "./GuestRow";
import AddGuestForm from "./AddGuestForm";
import PaidToggle from "./PaidToggle";
import { isSmsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";

export default async function SponsorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sponsor = await db.query.sponsors.findFirst({ where: eq(sponsors.id, id) });
  if (!sponsor) notFound();
  const list = await db
    .select()
    .from(guests)
    .where(eq(guests.sponsorId, id))
    .orderBy(guests.createdAt);

  const checkedIn = list.filter(g => g.checkedInAt).length;
  const smsReady = isSmsConfigured();

  return (
    <div className="space-y-5">
      <Link href="/people" className="text-sm text-[var(--ink-mute)] hover:text-[var(--ink)] inline-flex items-center gap-1">
        <ArrowLeft size={14}/> Back to People
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`badge ${sponsor.isIndividual ? "" : "badge-ink"}`}>
              {sponsor.isIndividual ? "Individual" : "Sponsor"}
            </span>
            <PaidToggle id={sponsor.id} paid={sponsor.paid}/>
          </div>
          <h1 className="text-2xl font-semibold">{sponsor.name}</h1>
          <div className="text-sm text-[var(--ink-mute)] flex items-center gap-3">
            {sponsor.contactPhone && <span>{sponsor.contactPhone}</span>}
            {sponsor.contactEmail && <span>{sponsor.contactEmail}</span>}
          </div>
          {sponsor.notes && <div className="text-sm text-[var(--ink-mute)] max-w-xl">{sponsor.notes}</div>}
        </div>
        <SponsorActions sponsorId={sponsor.id} smsReady={smsReady} guestCount={list.length}/>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Guests" value={list.length}/>
        <Stat label="Checked in" value={checkedIn}/>
        <Stat label="Pending" value={list.length - checkedIn}/>
      </div>

      <AddGuestForm sponsorId={sponsor.id}/>

      <div className="card card-pad-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--line)] text-sm font-semibold">Guests under {sponsor.name}</div>
        {list.length === 0 ? (
          <div className="p-6 text-center text-[var(--ink-mute)] text-sm">No guests yet.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Ticket</th><th></th></tr></thead>
            <tbody>{list.map(g => <GuestRow key={g.id} guest={g} smsReady={smsReady}/>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[var(--ink-mute)]">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
