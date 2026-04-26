import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · HFTF" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--ink)] text-white font-semibold mb-3">H</div>
          <h1 className="text-xl font-semibold">HFTF Portal</h1>
          <p className="text-sm text-[var(--ink-mute)] mt-1">Staff sign-in</p>
        </div>
        <div className="card">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
