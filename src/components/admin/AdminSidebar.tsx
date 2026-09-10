"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserCog, ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/admin/pegawai", label: "Daftar Pegawai", icon: Users },
  { href: "/admin/kelola-pegawai", label: "Kelola Pegawai", icon: UserCog },
  { href: "/admin/kegiatan-pegawai", label: "Kegiatan Pegawai", icon: ClipboardList },
];

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/50">Menu</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-brand-blue-dark shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("size-4.5", active ? "text-brand-blue" : "text-white/70")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-white/40">
        BPS Kabupaten Maros
      </div>
    </>
  );
}

export function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="brand-panel hidden w-64 shrink-0 flex-col lg:sticky lg:top-0 lg:flex lg:h-screen">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
          <aside className="brand-panel relative flex h-full w-64 flex-col shadow-xl">
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
