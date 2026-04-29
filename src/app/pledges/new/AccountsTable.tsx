"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { BankAccount } from "@/lib/accounts";

export default function AccountsTable({ accounts }: { accounts: BankAccount[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(c => (c === value ? null : c)), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card card-pad-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--line)] text-sm font-semibold">
        Bank accounts
      </div>
      <ul className="divide-y divide-[var(--line)]">
        {accounts.map(a => (
          <li key={a.bank} className="p-3 sm:p-4">
            <div className="text-sm font-semibold">{a.bank}</div>
            <div className="text-xs text-[var(--ink-mute)] mt-0.5">{a.accountName}</div>
            <button
              onClick={() => copy(a.accountNumber)}
              className="mt-2 w-full flex items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm font-mono hover:bg-white transition-colors"
            >
              <span className="truncate">{a.accountNumber}</span>
              <span className="flex items-center gap-1 text-xs text-[var(--ink-mute)] flex-shrink-0">
                {copied === a.accountNumber ? (
                  <>
                    <Check size={14} className="text-green-700" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
