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
    <nav className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-surface/90 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_20px_-8px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-bold transition-colors",
                active ? "text-brand-blue" : "text-slate-400 hover:text-slate-500"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-brand-blue/10"
                )}
              >
                <Icon className="size-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
