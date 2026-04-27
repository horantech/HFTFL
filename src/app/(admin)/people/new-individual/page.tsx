import NewIndividualForm from "./NewIndividualForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New individual · HFTF" };

export default function NewIndividualPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/people" className="text-sm text-[var(--ink-mute)] hover:text-[var(--ink)] inline-flex items-center gap-1">
        <ArrowLeft size={14}/> Back to People
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">New individual</h1>
        <p className="text-sm text-[var(--ink-mute)] mt-0.5">
          Register one person who is buying a single seat for themselves.
        </p>
      </div>
      <NewIndividualForm/>
    </div>
  );
}
