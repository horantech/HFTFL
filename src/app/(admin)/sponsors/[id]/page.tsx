import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { sponsors, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import SponsorActions from "./SponsorActions";
import GuestRow from "./GuestRow";
import AddGuestForm from "./AddGuestForm";
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
    <div className="space-y-6">
      <div>
        <Link href="/sponsors" className="text-sm text-[var(--ink-soft)] inline-flex items-center gap-1 hover:underline">
          <ArrowLeft size={14}/> All sponsors
        </Link>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">
            {sponsor.isIndividual ? "Individual buyer" : "Company / Group"}
          </div>
          <h1 className="font-display text-3xl">{sponsor.name}</h1>
          <div className="text-sm text-[var(--ink-soft)] mt-1 space-x-3">
            {sponsor.contactPhone && <span>📞 {sponsor.contactPhone}</span>}
            {sponsor.contactEmail && <span>✉ {sponsor.contactEmail}</span>}
          </div>
          {sponsor.notes && <div className="text-sm mt-2 max-w-xl text-[var(--ink-soft)]">{sponsor.notes}</div>}
        </div>
        <SponsorActions sponsorId={sponsor.id} smsReady={smsReady} guestCount={list.length}/>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card"><div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">Guests</div><div className="font-display text-3xl">{list.length}</div></div>
        <div className="card"><div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">Checked in</div><div className="font-display text-3xl">{checkedIn}</div></div>
        <div className="card"><div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">Pending</div><div className="font-display text-3xl">{list.length - checkedIn}</div></div>
      </div>

      <AddGuestForm sponsorId={sponsor.id}/>

      <div className="card card-pad-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--brand-line)]">
          <div className="font-display text-lg">Guests under {sponsor.name}</div>
        </div>
        {list.length === 0 ? (
          <div className="p-8 text-center text-[var(--ink-soft)] text-sm">
            No guests yet. Use the form above to add the first one.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Ticket</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(g => <GuestRow key={g.id} guest={g} smsReady={smsReady}/>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
