import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import SponsorActions from "./SponsorActions";
import SponsorEditForm from "./SponsorEditForm";
import GuestRow from "./GuestRow";
import AddGuestForm from "./AddGuestForm";
import PaidToggle from "./PaidToggle";
import { isSmsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";

export default async function SponsorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sponsor] = await db
    .select({
      id: sponsors.id,
      name: sponsors.name,
      contactPhone: sponsors.contactPhone,
      contactEmail: sponsors.contactEmail,
      isIndividual: sponsors.isIndividual,
      paid: sponsors.paid,
      notes: sponsors.notes,
      assignedTo: sponsors.assignedTo,
      bank: sponsors.bank,
      rsvp: sponsors.rsvp,
      createdAt: sponsors.createdAt,
    })
    .from(sponsors)
    .where(eq(sponsors.id, id))
    .limit(1);
  if (!sponsor) notFound();
  const list = await db
    .select()
    .from(guests)
    .where(eq(guests.sponsorId, id))
    .orderBy(guests.createdAt);

  const checkedIn = list.filter(g => g.checkedInAt).length;
  const smsReady = isSmsConfigured();
  const sponsorHasTicket = sponsor.isIndividual ||
    list.some(g => g.name.trim().toLowerCase() === sponsor.name.trim().toLowerCase());

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
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-[var(--ink-mute)]">
            {sponsor.bank && <span>Bank: {sponsor.bank}</span>}
            {sponsor.assignedTo && <span>Assigned: {sponsor.assignedTo}</span>}
            {sponsor.rsvp && <span>RSVP: {sponsor.rsvp}</span>}
          </div>
          {sponsor.notes && <div className="text-sm text-[var(--ink-mute)] max-w-xl">{sponsor.notes}</div>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SponsorEditForm sponsor={sponsor}/>
          <SponsorActions
            sponsorId={sponsor.id}
            smsReady={smsReady}
            guestCount={list.length}
            sponsorName={sponsor.name}
            sponsorPhone={sponsor.contactPhone}
            sponsorHasTicket={sponsorHasTicket}
            isIndividual={sponsor.isIndividual}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Guests" value={list.length}/>
        <Stat label="Checked in" value={checkedIn}/>
        <Stat label="Pending" value={list.length - checkedIn}/>
      </div>

      <AddGuestForm sponsorId={sponsor.id}/>

      <div className="card card-pad-0 overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-[var(--line)] text-sm font-semibold">Guests under {sponsor.name}</div>
        {list.length === 0 ? (
          <div className="p-6 text-center text-[var(--ink-mute)] text-sm">No guests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[720px]">
              <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Ticket</th><th></th></tr></thead>
              <tbody>{list.map(g => <GuestRow key={g.id} guest={g} smsReady={smsReady} sponsorName={sponsor.name}/>)}</tbody>
            </table>
          </div>
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
