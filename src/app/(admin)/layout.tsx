import Link from "next/link";
import { EVENT } from "@/lib/event";
import NavLinks from "./NavLinks";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--brand-line)] bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--brand-green)] text-[var(--brand-cream-soft)] font-display text-lg">H</span>
            <div className="leading-tight">
              <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Hope for the Fatherless</div>
              <div className="font-display text-base">Donation Dinner · 2026</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <span className="badge badge-muted">{EVENT.date}</span>
            <span className="badge badge-muted">{EVENT.venue}</span>
          </div>
          <LogoutButton />
        </div>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-2">
          <NavLinks />
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-[var(--brand-line)] py-4 text-xs text-[var(--ink-soft)] text-center">
        Hope for the Fatherless · Staff Portal
      </footer>
    </div>
  );
}
