import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { desc } from "drizzle-orm";
import ImportForm from "./ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const sponsorList = await db
    .select({ id: sponsors.id, name: sponsors.name, isIndividual: sponsors.isIndividual })
    .from(sponsors)
    .orderBy(desc(sponsors.createdAt));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Bulk import</div>
        <h1 className="font-display text-3xl">Import guests from CSV</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Upload your existing guest spreadsheet. Each row becomes a guest under the sponsor you choose.
        </p>
      </div>

      <div className="card">
        <div className="font-display text-lg mb-2">Expected CSV columns</div>
        <div className="text-sm text-[var(--ink-soft)] mb-3">
          The header row must include at least <code className="bg-[var(--brand-cream)] px-1 rounded">name</code>.
          Optional columns: <code className="bg-[var(--brand-cream)] px-1 rounded">phone</code>,{" "}
          <code className="bg-[var(--brand-cream)] px-1 rounded">email</code>,{" "}
          <code className="bg-[var(--brand-cream)] px-1 rounded">scheduled</code>,{" "}
          <code className="bg-[var(--brand-cream)] px-1 rounded">paid</code>,{" "}
          <code className="bg-[var(--brand-cream)] px-1 rounded">notes</code>.
          Column names are case-insensitive.
        </div>
        <pre className="text-xs bg-[var(--brand-cream-soft)] border border-[var(--brand-line)] rounded p-3 overflow-auto">
{`name,phone,scheduled,paid
Almaz Tesfaye,+251911223344,Yes,Yes
Bereket Alemu,+251922334455,Yes,No`}
        </pre>
      </div>

      <ImportForm sponsors={sponsorList}/>
    </div>
  );
}
