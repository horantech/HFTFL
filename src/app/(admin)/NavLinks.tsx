"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ScanLine, Upload, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sponsors", label: "Sponsors", icon: Users },
  { href: "/guests", label: "Guests", icon: UserPlus },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/import", label: "Import", icon: Upload },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto -mx-2 px-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-[var(--brand-green)] text-[var(--brand-cream-soft)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--brand-cream)]"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
