"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/dashboard/beranda", label: "Beranda", icon: Home },
  { href: "/dashboard/riwayat", label: "Riwayat", icon: CalendarCheck },
];

export function PegawaiBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-slate-200 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-brand-blue" : "text-slate-400"
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-blue" />
              )}
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
