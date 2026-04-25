import Link from "next/link";
import { db } from "@/db";
import { guests, sponsors } from "@/db/schema";
import { sql, isNotNull, desc, eq } from "drizzle-orm";
import { EVENT } from "@/lib/event";
import { ScanLine, UserPlus, Upload, Send } from "lucide-react";
import { formatTime } from "@/lib/utils";
import ReminderButton from "./ReminderButton";
import { isSmsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";

async function getStats() {
  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      checkedIn: sql<number>`count(${guests.checkedInAt})::int`,
    })
    .from(guests);
  const [sponsorAgg] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sponsors);
  const recent = await db
    .select({
      id: guests.id,
      name: guests.name,
      checkedInAt: guests.checkedInAt,
      sponsorName: sponsors.name,
    })
    .from(guests)
    .innerJoin(sponsors, eq(guests.sponsorId, sponsors.id))
    .where(isNotNull(guests.checkedInAt))
    .orderBy(desc(guests.checkedInAt))
    .limit(8);
  return { ...agg, sponsors: sponsorAgg.total, recent };
}

export default async function DashboardPage() {
  const stats = await getStats();
  const remaining = stats.total - stats.checkedIn;
  const pct = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;
  const smsReady = isSmsConfigured();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Live overview</div>
          <h1 className="font-display text-3xl">Dashboard</h1>
          <div className="text-sm text-[var(--ink-soft)] mt-1">
            {EVENT.name} · {EVENT.date} · {EVENT.venue}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/sponsors/new" className="btn btn-primary"><UserPlus size={16}/> New sponsor</Link>
          <Link href="/scan" className="btn btn-brand"><ScanLine size={16}/> Open scanner</Link>
          <Link href="/import" className="btn btn-outline"><Upload size={16}/> Import CSV</Link>
          {smsReady && <ReminderButton/>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Sponsors / buyers" value={stats.sponsors} />
        <Stat label="Guests registered" value={stats.total} />
        <Stat label="Checked in" value={stats.checkedIn} accent="green" />
        <Stat label="Remaining" value={remaining} accent="tan" />
      </div>

      <div className="card">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-[var(--ink-soft)]">Attendance</div>
            <div className="font-display text-2xl">{pct}% in the room</div>
          </div>
          <div className="text-sm text-[var(--ink-soft)]">{stats.checkedIn} / {stats.total}</div>
        </div>
        <div className="h-3 rounded-full bg-[var(--brand-cream)] overflow-hidden">
          <div className="h-full bg-[var(--brand-green)]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card card-pad-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--brand-line)] flex items-center justify-between">
            <div>
              <div className="text-xs tracking-[0.2em] uppercase text-[var(--ink-soft)]">Recent</div>
              <div className="font-display text-lg">Latest check-ins</div>
            </div>
          </div>
          {stats.recent.length === 0 ? (
            <div className="p-6 text-sm text-[var(--ink-soft)]">No check-ins yet.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Guest</th><th>Sponsor</th><th>Time</th></tr></thead>
              <tbody>
                {stats.recent.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td className="text-[var(--ink-soft)]">{r.sponsorName}</td>
                    <td className="text-[var(--ink-soft)]">{formatTime(r.checkedInAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="text-xs tracking-[0.2em] uppercase text-[var(--ink-soft)]">Quick actions</div>
          <div className="font-display text-lg mb-3">Run the event</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <QuickAction href="/scan" icon={<ScanLine size={18}/>} title="Scan tickets" sub="Camera-based check-in" />
            <QuickAction href="/guests" icon={<UserPlus size={18}/>} title="Manual check-in" sub="Search by name or sponsor" />
            <QuickAction href="/sponsors" icon={<Send size={18}/>} title="Send tickets" sub="SMS sponsor + their guests" />
            <QuickAction href="/import" icon={<Upload size={18}/>} title="Bulk import" sub="From spreadsheet CSV" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "green" | "tan" }) {
  const ringColor = accent === "green" ? "var(--brand-green)" : accent === "tan" ? "var(--brand-tan)" : "var(--brand-line)";
  return (
    <div className="card relative overflow-hidden">
      <div className="text-xs tracking-[0.2em] uppercase text-[var(--ink-soft)]">{label}</div>
      <div className="font-display text-4xl mt-2">{value}</div>
      <div className="absolute -right-3 -bottom-3 h-16 w-16 rounded-full opacity-20" style={{ background: ringColor }} />
    </div>
  );
}

function QuickAction({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 p-3 rounded-lg border border-[var(--brand-line)] hover:bg-[var(--brand-cream-soft)] transition-colors">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--brand-cream)] text-[var(--brand-green)] group-hover:bg-[var(--brand-green)] group-hover:text-white transition-colors">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-[var(--ink-soft)]">{sub}</span>
      </span>
    </Link>
  );
}
