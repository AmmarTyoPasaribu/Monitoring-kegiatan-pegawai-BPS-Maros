"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, UserRound, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Combobox } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { MonthCalendar, type DateStatus } from "@/components/pegawai/MonthCalendar";
import { AdminReportDetail } from "@/components/admin/AdminReportDetail";
import { getWitaNowParts, monthNameId, todayWitaDateString } from "@/lib/time";
import type { DailyReport } from "@/types";

interface EmployeeOption {
  id: string;
  full_name: string;
  division: string | null;
  photo_url: string | null;
}

export function KegiatanPegawaiClient({
  employees,
  initialEmployeeId,
}: {
  employees: EmployeeOption[];
  initialEmployeeId?: string;
}) {
  const now = getWitaNowParts();
  const validInitialId =
    initialEmployeeId && employees.some((e) => e.id === initialEmployeeId)
      ? initialEmployeeId
      : undefined;
  const [employeeId, setEmployeeId] = useState<string>(
    validInitialId ?? employees[0]?.id ?? ""
  );
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayWitaDateString());
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportAllOpen, setExportAllOpen] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  const selectedEmployee = employees.find((e) => e.id === employeeId) || null;

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.full_name,
        sublabel: e.division,
      })),
    [employees]
  );

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/employees/${employeeId}/reports?year=${year}&month=${month}`
        );
        const data = await res.json();
        if (!cancelled) setReports(data.reports || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId, year, month]);

  const statusByDate = useMemo(() => {
    const map: Record<string, DateStatus> = {};
    for (const r of reports) map[r.report_date] = "filled";
    return map;
  }, [reports]);

  const selectedReport = useMemo(
    () => reports.find((r) => r.report_date === selectedDate) ?? null,
    [reports, selectedDate]
  );

  const canGoNext = !(year === now.year && month === now.month);

  function goPrevMonth() {
    setSelectedDate(null);
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    if (!canGoNext) return;
    setSelectedDate(null);
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }

  async function downloadFile(url: string, fileName: string) {
    const res = await fetch(url);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Gagal mengekspor data");
      return false;
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return true;
  }

  async function handleExport() {
    if (!employeeId) return;
    setExporting(true);
    try {
      const ok = await downloadFile(
        `/api/admin/employees/${employeeId}/export?year=${year}&month=${month}`,
        `Laporan_${selectedEmployee?.full_name || "Pegawai"}_${monthNameId(month)}_${year}.xlsx`
      );
      if (ok) {
        toast.success("Rekap berhasil diekspor");
        setExportOpen(false);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportAll() {
    setExportingAll(true);
    try {
      const ok = await downloadFile(
        `/api/admin/export-all?year=${year}&month=${month}`,
        `Rekap_Semua_Pegawai_${monthNameId(month)}_${year}.xlsx`
      );
      if (ok) {
        toast.success("Rekap semua pegawai berhasil diekspor");
        setExportAllOpen(false);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setExportingAll(false);
    }
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-surface py-16 text-center">
        <UserRound className="size-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-500">Belum ada data pegawai</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {selectedEmployee && (
            <Avatar src={selectedEmployee.photo_url} name={selectedEmployee.full_name} className="size-11 shrink-0" />
          )}
          <Combobox
            className="min-w-[240px]"
            options={employeeOptions}
            value={employeeId}
            searchPlaceholder="Ketik nama pegawai..."
            onChange={(id) => {
              setEmployeeId(id);
              setSelectedDate(todayWitaDateString());
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setExportAllOpen(true)} variant="outline">
            <Users className="size-4" /> Export Semua Pegawai
          </Button>
          <Button onClick={() => setExportOpen(true)} variant="success">
            <Download className="size-4" /> Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthCalendar
          year={year}
          month={month}
          statusByDate={statusByDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          canGoNext={canGoNext}
        />

        {loading ? (
          <div className="card-surface flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          selectedDate && <AdminReportDetail date={selectedDate} report={selectedReport} />
        )}
      </div>

      <ConfirmModal
        open={exportOpen}
        title="Export Laporan ke Excel"
        description={`Export rekap laporan ${selectedEmployee?.full_name} periode ${monthNameId(month)} ${year}?`}
        confirmLabel="Export"
        variant="success"
        loading={exporting}
        onConfirm={handleExport}
        onCancel={() => setExportOpen(false)}
      />

      <ConfirmModal
        open={exportAllOpen}
        title="Export Semua Pegawai"
        description={`Export rekap laporan SELURUH pegawai (${employees.length} orang) periode ${monthNameId(month)} ${year} dalam satu file Excel (satu sheet per pegawai)?`}
        confirmLabel="Export Semua"
        variant="success"
        loading={exportingAll}
        onConfirm={handleExportAll}
        onCancel={() => setExportAllOpen(false)}
      />
    </div>
  );
}
