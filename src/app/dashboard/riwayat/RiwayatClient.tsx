"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, ListChecks, Loader2, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MonthCalendar, type DateStatus } from "@/components/pegawai/MonthCalendar";
import { ReportPanel } from "@/components/pegawai/ReportPanel";
import { getWitaNowParts, monthNameId, todayWitaDateString } from "@/lib/time";
import type { DailyReport } from "@/types";

type ExportMode = "per-date" | "per-activity";

export function RiwayatClient({ initialDate }: { initialDate?: string }) {
  const now = getWitaNowParts();
  const initial = initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : null;

  const [year, setYear] = useState(initial ? Number(initial.slice(0, 4)) : now.year);
  const [month, setMonth] = useState(initial ? Number(initial.slice(5, 7)) : now.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(initial ?? todayWitaDateString());
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportingMode, setExportingMode] = useState<ExportMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?year=${year}&month=${month}`);
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
  }, [year, month]);

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

  function handleSaved(report: DailyReport) {
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.report_date === report.report_date);
      if (idx === -1) return [...prev, report];
      const next = [...prev];
      next[idx] = report;
      return next;
    });
  }

  async function handleExport(mode: ExportMode) {
    setExportingMode(mode);
    try {
      const res = await fetch(`/api/reports/export?year=${year}&month=${month}&mode=${mode}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Gagal mengekspor laporan");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_${monthNameId(month)}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Laporan berhasil diekspor");
      setExportOpen(false);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setExportingMode(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="success" onClick={() => setExportOpen(true)}>
          <Download className="size-4" /> Export to Excel
        </Button>
      </div>

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
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        selectedDate && (
          <ReportPanel
            key={selectedDate}
            date={selectedDate}
            existing={selectedReport}
            onSaved={handleSaved}
          />
        )
      )}

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Laporan ke Excel"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-slate-600">
          Export laporan kegiatan Anda periode {monthNameId(month)} {year}. Pilih format baris
          kegiatannya:
        </p>
        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            disabled={exportingMode !== null}
            onClick={() => handleExport("per-date")}
            className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition-colors hover:border-brand-blue hover:bg-brand-blue/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              {exportingMode === "per-date" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Rows3 className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">Ringkas — 1 baris per tanggal</p>
              <p className="mt-1 text-xs text-slate-500">
                Semua kegiatan dalam satu tanggal digabung jadi satu baris.
              </p>
            </div>
          </button>
          <button
            type="button"
            disabled={exportingMode !== null}
            onClick={() => handleExport("per-activity")}
            className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition-colors hover:border-brand-green hover:bg-brand-green/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
              {exportingMode === "per-activity" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ListChecks className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">Detail — 1 baris per kegiatan</p>
              <p className="mt-1 text-xs text-slate-500">
                Tiap kegiatan punya baris sendiri; kolom lain (tanggal, capaian, kendala, dst)
                otomatis digabung (merge) mengikuti jumlah baris kegiatan.
              </p>
            </div>
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setExportOpen(false)}
            disabled={exportingMode !== null}
          >
            Batal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
