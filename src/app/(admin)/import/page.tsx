import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { desc } from "drizzle-orm";
import ImportForm from "./ImportForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const sponsorList = await db
    .select({ id: sponsors.id, name: sponsors.name, isIndividual: sponsors.isIndividual })
    .from(sponsors)
    .orderBy(desc(sponsors.createdAt));

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/people" className="text-sm text-[var(--ink-mute)] hover:text-[var(--ink)] inline-flex items-center gap-1">
        <ArrowLeft size={14}/> Back to People
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Import guests from CSV</h1>
        <p className="text-sm text-[var(--ink-mute)] mt-0.5">
          Upload your existing guest spreadsheet. Each row becomes a guest under the sponsor you choose.
        </p>
      </div>

      <div className="card flex items-start gap-3 justify-between flex-wrap">
        <div>
          <div className="text-sm font-semibold">Have a messy spreadsheet with multiple sponsors mixed together?</div>
          <div className="text-xs text-[var(--ink-mute)] mt-0.5">
            Use Smart Paste — it detects sponsor groups, normalizes phones, and previews before saving.
          </div>
        </div>
        <Link href="/import/grouped" className="btn btn-outline btn-sm">Open Smart Paste →</Link>
      </div>

      <div className="card">
        <div className="text-sm font-semibold mb-2">Expected CSV columns</div>
        <div className="text-sm text-[var(--ink-mute)] mb-3">
          The header row must include at least <code className="bg-[var(--bg)] px-1 rounded text-[var(--ink)]">name</code>.
          Optional: <code className="bg-[var(--bg)] px-1 rounded text-[var(--ink)]">phone</code>,{" "}
          <code className="bg-[var(--bg)] px-1 rounded text-[var(--ink)]">email</code>,{" "}
          <code className="bg-[var(--bg)] px-1 rounded text-[var(--ink)]">scheduled</code>,{" "}
          <code className="bg-[var(--bg)] px-1 rounded text-[var(--ink)]">paid</code>,{" "}
          <code className="bg-[var(--bg)] px-1 rounded text-[var(--ink)]">notes</code>.
          Column names are case-insensitive.
        </div>
        <pre className="text-xs bg-[var(--bg)] border border-[var(--line)] rounded p-3 overflow-auto">
{`name,phone,scheduled,paid
Almaz Tesfaye,+251911223344,Yes,Yes
Bereket Alemu,+251922334455,Yes,No`}
        </pre>
      </div>

      <ImportForm sponsors={sponsorList}/>
    </div>
  );
}
