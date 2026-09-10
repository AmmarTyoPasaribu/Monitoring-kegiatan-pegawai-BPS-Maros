"use client";

import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { AdminProfileButton } from "@/components/admin/AdminProfileButton";

interface AdminUser {
  full_name: string;
  username: string;
  email: string;
  photo_url: string | null;
}

export function AdminTopbar({
  onOpenMenu,
  adminUser,
}: {
  onOpenMenu: () => void;
  adminUser: AdminUser;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo statis dari public/ */}
          <img src="/logo.webp" alt="Logo BPS" className="size-full object-contain" />
        </div>
        <p className="truncate font-heading text-sm font-bold text-slate-900 sm:text-base">
          <span className="hidden sm:inline">Monitoring Kegiatan Pegawai BPS Maros</span>
          <span className="sm:hidden">BPS Maros</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AdminProfileButton user={adminUser} />
        <LogoutButton />
      </div>
    </header>
  );
}
