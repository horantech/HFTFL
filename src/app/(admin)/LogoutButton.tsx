"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn btn-ghost text-sm" aria-label="Sign out">
      <LogOut size={16} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
