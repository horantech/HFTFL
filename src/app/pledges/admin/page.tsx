import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { pledges } from "@/db/schema";
import { sql, desc, count } from "drizzle-orm";
import { formatDateTime } from "@/lib/utils";
import { PLEDGE_GOAL } from "@/lib/event";
import PledgeDeleteButton from "./PledgeRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "All pledges · HFTF" };

async function loadPledges() {
  const [agg] = await db
    .select({
      total: sql<string>`coalesce(sum(${pledges.amount}), 0)`,
      count: count(),
    })
    .from(pledges);

  const list = await db
    .select()
    .from(pledges)
    .orderBy(desc(pledges.createdAt));

  return { total: Number(agg.total), count: agg.count, list };
}

export default async function PledgesAdminPage() {
  const { total, count: cnt, list } = await loadPledges();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--ink-mute)] hover:text-[var(--ink)] inline-flex items-center gap-1"
          >
            <ArrowLeft size={14}/> Back to dashboard
          </Link>
          <Link
            href="/pledges"
            target="_blank"
            className="btn btn-outline btn-sm"
          >
            <ExternalLink size={14}/> Open live board
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-semibold">Pledges</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-0.5">All pledges submitted via the public form.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <div className="card !p-3 sm:!p-4">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-mute)]">Total pledged</div>
            <div className="text-2xl sm:text-3xl font-semibold mt-1 leading-none">{formatBirr(total)}</div>
          </div>
          <div className="card !p-3 sm:!p-4">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-mute)]">Pledges</div>
            <div className="text-2xl sm:text-3xl font-semibold mt-1 leading-none">{cnt}</div>
          </div>
          <div className="card !p-3 sm:!p-4 col-span-2 lg:col-span-1">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-mute)]">Goal · {formatBirr(PLEDGE_GOAL)}</div>
            <div className="text-2xl sm:text-3xl font-semibold mt-1 leading-none tabular-nums">
              {Math.min(100, Math.round((total / PLEDGE_GOAL) * 1000) / 10)}%
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--bg)] border border-[var(--line)] overflow-hidden">
              <div
                className="h-full bg-[var(--ink)] transition-all duration-500"
                style={{ width: `${Math.min(100, (total / PLEDGE_GOAL) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card card-pad-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--line)] text-sm font-semibold">All pledges</div>
          {list.length === 0 ? (
            <div className="p-6 text-center text-[var(--ink-mute)] text-sm">No pledges yet.</div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-[var(--line)]">
                {list.map(p => (
                  <div key={p.id} className="p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-[var(--ink-mute)] truncate">
                        {p.phone || "—"} · {formatDateTime(p.createdAt)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold tabular-nums">{formatBirr(p.amount)}</div>
                      <div className="mt-1">
                        <PledgeDeleteButton id={p.id} name={p.name}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block scroll-x">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>When</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(p => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.name}</td>
                        <td className="text-[var(--ink-mute)]">{p.phone || "—"}</td>
                        <td className="font-semibold tabular-nums">{formatBirr(p.amount)}</td>
                        <td className="text-[var(--ink-mute)] text-xs">{formatDateTime(p.createdAt)}</td>
                        <td className="text-right">
                          <PledgeDeleteButton id={p.id} name={p.name}/>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBirr(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} ETB`;
}
