import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ACCOUNTS } from "@/lib/accounts";
import AccountsTable from "./AccountsTable";
import PledgeForm from "./PledgeForm";

export const metadata = { title: "Make a pledge · Hope for the Fatherless" };

export default function PledgesFormPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
        <Link
          href="/pledges"
          className="text-sm text-[var(--ink-mute)] hover:text-[var(--ink)] inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to live board
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Make a pledge</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-1">
            Hope for the Fatherless · Donation Dinner · April 30, 2026
          </p>
          <p className="text-sm text-[var(--ink-soft)] mt-3">
            Choose any of the bank accounts below to deposit your contribution, then record your pledge so it shows on the live board.
          </p>
        </div>

        <AccountsTable accounts={ACCOUNTS} />

        <PledgeForm />

        <p className="text-xs text-[var(--ink-mute)] text-center pt-2">
          Thank you for supporting our cause.
        </p>
      </div>
    </div>
  );
}
