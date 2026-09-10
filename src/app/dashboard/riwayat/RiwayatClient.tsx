"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { MonthCalendar, type DateStatus } from "@/components/pegawai/MonthCalendar";
import { ReportPanel } from "@/components/pegawai/ReportPanel";
import { getWitaNowParts, monthNameId, todayWitaDateString } from "@/lib/time";
import type { DailyReport } from "@/types";

export function RiwayatClient({ initialDate }: { initialDate?: string }) {
  const now = getWitaNowParts();
  const initial = initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : null;

  const [year, setYear] = useState(initial ? Number(initial.slice(0, 4)) : now.year);
  const [month, setMonth] = useState(initial ? Number(initial.slice(5, 7)) : now.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(initial ?? todayWitaDateString());
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/reports/export?year=${year}&month=${month}`);
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
      setExporting(false);
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

      <ConfirmModal
        open={exportOpen}
        title="Export Laporan ke Excel"
        description={`Export laporan kegiatan Anda periode ${monthNameId(month)} ${year}?`}
        confirmLabel="Export"
        variant="success"
        loading={exporting}
        onConfirm={handleExport}
        onCancel={() => setExportOpen(false)}
      />
    </div>
  );
}
