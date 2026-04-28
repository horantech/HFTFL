import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GroupedImportForm from "./GroupedImportForm";

export const metadata = { title: "Smart paste · HFTF" };

export default function GroupedImportPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link href="/import" className="text-sm text-[var(--ink-mute)] hover:text-[var(--ink)] inline-flex items-center gap-1">
        <ArrowLeft size={14}/> Back to Import
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Smart paste from spreadsheet</h1>
        <p className="text-sm text-[var(--ink-mute)] mt-0.5">
          Paste tab-separated rows from your Excel sheet. The importer detects sponsor groups, normalizes phones, and previews everything before saving.
        </p>
      </div>

      <div className="card text-sm space-y-2">
        <div className="font-semibold">How grouping works</div>
        <ul className="text-[var(--ink-soft)] list-disc pl-5 space-y-1">
          <li>Columns are read by <strong>position</strong>, not header — paste data as-is from the master spreadsheet template.</li>
          <li>A row with a <strong>Company Name</strong>, <strong>Assigned Person</strong>, or <strong>Guest Count</strong> starts a new sponsor.</li>
          <li>Following rows with no name (just RSVP / Paid / Bank) become placeholder seats <code>Guest 1</code>, <code>Guest 2</code>, …</li>
          <li>Following rows with a different name are added as named guests under the current sponsor.</li>
          <li>Names like <code>Ruth x3</code> expand to 3 guest rows.</li>
          <li>Phones get normalized: ET numbers prepended with <code>+251</code>, non-ET kept as-is with a leading <code>+</code>.</li>
          <li>Rows under <strong>&ldquo;Individual tickets&rdquo;</strong> become their own individual sponsors, one per row.</li>
        </ul>
      </div>

      <GroupedImportForm/>
    </div>
  );
}
