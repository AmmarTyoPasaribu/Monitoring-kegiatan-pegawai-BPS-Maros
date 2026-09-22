"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Check, ClipboardList, Filter, Users, X } from "lucide-react";
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

type SortMode = "name" | "filled_first" | "unfilled_first";
const ALL_DIVISIONS = "__all__";

export function DaftarPegawaiClient({ employees }: { employees: EmployeeWithStatus[] }) {
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [divisionFilter, setDivisionFilter] = useState<string>(ALL_DIVISIONS);

  const divisions = useMemo(() => {
    const set = new Set(employees.map((e) => e.division).filter((d): d is string => Boolean(d)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredAndSorted = useMemo(() => {
    const filtered =
      divisionFilter === ALL_DIVISIONS
        ? employees
        : employees.filter((e) => e.division === divisionFilter);

    const list = [...filtered];
    if (sortMode === "name") {
      list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortMode === "filled_first") {
      list.sort((a, b) => {
        if (a.filledToday !== b.filledToday) return a.filledToday ? -1 : 1;
        return a.full_name.localeCompare(b.full_name);
      });
    } else {
      list.sort((a, b) => {
        if (a.filledToday !== b.filledToday) return a.filledToday ? 1 : -1;
        return a.full_name.localeCompare(b.full_name);
      });
    }
    return list;
  }, [employees, sortMode, divisionFilter]);

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <Filter className="size-4 shrink-0 text-slate-400" />
          <Select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="w-auto min-w-[200px] py-2"
          >
            <option value={ALL_DIVISIONS}>Semua Bagian</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-4 shrink-0 text-slate-400" />
          <Select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-auto min-w-[220px] py-2"
          >
            <option value="name">Urutkan: Nama (A-Z)</option>
            <option value="unfilled_first">Urutkan: Belum Isi Dulu</option>
            <option value="filled_first">Urutkan: Sudah Isi Dulu</option>
          </Select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-surface py-16 text-center">
          <Filter className="size-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            Tidak ada pegawai di bagian &quot;{divisionFilter}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSorted.map((emp) => (
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
      )}
    </div>
  );
}
