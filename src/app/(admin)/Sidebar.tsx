"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, ScanLine, Upload, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/people", label: "People", icon: Users },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/import", label: "Import", icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-12 px-3 flex items-center justify-between bg-white border-b border-[var(--line)]">
        <button onClick={() => setOpen(true)} className="btn btn-ghost btn-icon" aria-label="Open menu">
          <Menu size={18}/>
        </button>
        <span className="font-semibold">HFTF Portal</span>
        <button onClick={logout} className="btn btn-ghost btn-icon" aria-label="Sign out">
          <LogOut size={16}/>
        </button>
      </div>
      {/* Spacer to push content below the mobile bar */}
      <div className="lg:hidden h-12" />

      {/* Backdrop */}
      {open && (
        <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-black/30 z-40" />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-60 bg-white border-r border-[var(--line)] flex flex-col transition-transform",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--line)]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--ink)] text-white font-semibold text-sm">H</span>
            <span className="font-semibold text-[var(--ink)]">HFTF Portal</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden btn btn-ghost btn-icon" aria-label="Close menu">
            <X size={18}/>
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--bg)] text-[var(--ink)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                )}
              >
                <Icon size={16} className={active ? "" : "opacity-70"}/>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--line)]">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors">
            <LogOut size={16} className="opacity-70"/> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
