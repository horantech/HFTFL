import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · Hope for the Fatherless" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg)]">
      {/* Left: branded panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-[#1f3a1c] text-white overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ticket-template.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a1c]/40 via-[#1f3a1c]/10 to-transparent"/>

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Hope for the Fatherless" className="h-14 w-auto bg-white/95 rounded-lg p-2 shadow-md"/>
        </div>

        <div className="relative space-y-2">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/70">Donation Dinner · April 30, 2026</div>
          <div className="text-3xl font-semibold leading-tight">A Night of Hope</div>
          <div className="text-sm text-white/80 max-w-sm">
            Staff portal for guest registration, ticket sending, and door check-in.
          </div>
        </div>
      </div>

      {/* Right: sign-in form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Hope for the Fatherless" className="h-16 w-auto mb-2"/>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Welcome back</h1>
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
