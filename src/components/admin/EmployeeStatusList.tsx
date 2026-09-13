"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface EmployeeRow {
  id: string;
  full_name: string;
  division: string | null;
  photo_url: string | null;
}

const MOBILE_CAP = 8;

function Row({
  emp,
  badgeLabel,
  badgeTone,
}: {
  emp: EmployeeRow;
  badgeLabel: string;
  badgeTone: "red" | "green";
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar src={emp.photo_url} name={emp.full_name} className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{emp.full_name}</p>
        <p className="truncate text-xs text-slate-500">{emp.division || "-"}</p>
      </div>
      <Badge tone={badgeTone} className="shrink-0">
        {badgeLabel}
      </Badge>
      <Link
        href={`/admin/kegiatan-pegawai?pegawai=${emp.id}`}
        className="shrink-0 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark"
      >
        Lihat
      </Link>
    </div>
  );
}

/**
 * Daftar pegawai (belum isi / sudah isi). Di layar mobile dibatasi 8 baris
 * dulu + tombol "Lihat semua", di layar web ditampilkan semua langsung --
 * dua versi dirender sekaligus lalu ditoggle lewat CSS responsive supaya
 * tidak butuh deteksi lebar layar di JS (aman dari mismatch SSR/CSR).
 */
export function EmployeeStatusList({
  employees,
  badgeLabel,
  badgeTone,
}: {
  employees: EmployeeRow[];
  badgeLabel: string;
  badgeTone: "red" | "green";
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = employees.length > MOBILE_CAP;
  const mobileList = expanded ? employees : employees.slice(0, MOBILE_CAP);

  return (
    <>
      {/* Mobile: dibatasi + tombol lihat semua */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {mobileList.map((emp) => (
          <Row key={emp.id} emp={emp} badgeLabel={badgeLabel} badgeTone={badgeTone} />
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-semibold text-brand-blue hover:text-brand-blue-dark"
          >
            Lihat semua ({employees.length})
            <ChevronDown className="size-4" />
          </button>
        )}
      </div>

      {/* Desktop/web: langsung semua */}
      <div className="hidden divide-y divide-slate-100 sm:block">
        {employees.map((emp) => (
          <Row key={emp.id} emp={emp} badgeLabel={badgeLabel} badgeTone={badgeTone} />
        ))}
      </div>
    </>
  );
}
