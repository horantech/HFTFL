import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { EVENT } from "@/lib/event";

export const metadata = { title: "Sign in · HFTF" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--brand-green)] text-[var(--brand-cream-soft)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(800px 400px at 80% 0%, var(--brand-tan), transparent), radial-gradient(600px 400px at 0% 100%, var(--brand-gold), transparent)" }} />
        <div className="relative">
          <div className="text-sm tracking-[0.25em] uppercase text-[var(--brand-tan)]">Hope for the Fatherless</div>
          <div className="mt-2 font-display text-3xl">Donation Dinner · 2026</div>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-3xl leading-tight">
            We believe children belong in loving families.
          </p>
          <div className="mt-8 text-sm space-y-1 opacity-90">
            <div>{EVENT.date} · {EVENT.time}</div>
            <div>{EVENT.venue}</div>
          </div>
        </div>
        <div className="relative text-xs opacity-70">Staff sign-in · {EVENT.name}</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <div className="text-xs tracking-[0.25em] uppercase text-[var(--brand-tan-dark)]">Hope for the Fatherless</div>
            <div className="font-display text-2xl mt-1">Staff sign-in</div>
          </div>
          <h1 className="font-display text-2xl mb-1">Welcome</h1>
          <p className="text-sm text-[var(--ink-soft)] mb-6">
            Enter the staff password to access the registration & check-in portal.
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
