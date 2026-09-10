"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Check, ClipboardList, Users, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

interface EmployeeWithStatus {
  id: string;
  full_name: string;
  division: string | null;
  photo_url: string | null;
  filledToday: boolean;
}

type SortMode = "name" | "status";

export function DaftarPegawaiClient({ employees }: { employees: EmployeeWithStatus[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("name");

  const sorted = useMemo(() => {
    const list = [...employees];
    if (sortMode === "name") {
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else {
      list.sort((a, b) => {
        if (a.filledToday !== b.filledToday) return a.filledToday ? 1 : -1;
        return a.full_name.localeCompare(b.full_name);
      });
    }
    return list;
  }, [employees, sortMode]);

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-surface py-16 text-center">
        <Users className="size-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-500">Belum ada data pegawai</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <ArrowUpDown className="size-4 text-slate-400" />
        <Select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="w-auto min-w-[220px] py-2"
        >
          <option value="name">Urutkan: Nama (A-Z)</option>
          <option value="status">Urutkan: Belum Isi Kegiatan Dulu</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((emp) => (
          <div
            key={emp.id}
            className="card-surface group overflow-hidden text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="brand-panel relative h-16">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
            </div>
            <div className="px-5 pb-5">
              <div className="relative z-10 -mt-8 mx-auto size-16">
                <Avatar
                  src={emp.photo_url}
                  name={emp.full_name}
                  className="size-16 text-base ring-4 ring-surface"
                />
                <span
                  title={emp.filledToday ? "Sudah isi kegiatan hari ini" : "Belum isi kegiatan hari ini"}
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-surface",
                    emp.filledToday ? "bg-brand-green" : "bg-red-500"
                  )}
                >
                  {emp.filledToday ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : (
                    <X className="size-3" strokeWidth={3} />
                  )}
                </span>
              </div>

              <p className="mt-3 font-heading font-bold text-slate-900">{emp.full_name}</p>
              <p className="text-sm text-slate-500">{emp.division || "-"}</p>

              <div className="mt-2 flex justify-center">
                <Badge tone={emp.filledToday ? "green" : "red"}>
                  {emp.filledToday ? "Sudah isi hari ini" : "Belum isi hari ini"}
                </Badge>
              </div>

              <Link
                href={`/admin/kegiatan-pegawai?pegawai=${emp.id}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-blue/10 px-3 py-2 text-xs font-semibold text-brand-blue-dark transition-colors hover:bg-brand-blue hover:text-white"
              >
                <ClipboardList className="size-3.5" />
                Lihat Kegiatan
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
