import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · Hope for the Fatherless" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg)]">
      {/* Left: branded panel — just the ticket image, no overlays */}
      <div className="relative hidden lg:block bg-[#1f3a1c] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ticket-template.png"
          alt="Hope for the Fatherless · A Night of Hope · April 30, 2026"
          className="absolute inset-0 w-full h-full object-cover object-left"
        />
      </div>

      {/* Right: sign-in form */}
      <div className="flex items-center justify-center px-4 py-8 sm:p-10 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Hope for the Fatherless" className="h-14 w-auto mb-3"/>
            <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--ink-mute)]">Donation Dinner · April 30, 2026</div>
            <div className="text-lg font-semibold mt-1">A Night of Hope</div>
          </div>
          <div className="mb-5 sm:mb-6 text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-[var(--ink-mute)] mt-1">Sign in to manage tonight&apos;s guests.</p>
          </div>
          <div className="card">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
          <p className="text-xs text-[var(--ink-mute)] text-center mt-4">
            Hope for the Fatherless · Staff access only
          </p>
        </div>
      </div>
    </div>
  );
}
