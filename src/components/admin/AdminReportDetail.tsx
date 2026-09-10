import { FileQuestion } from "lucide-react";
import { formatIndonesianDate } from "@/lib/time";
import type { DailyReport } from "@/types";

const FIELDS: { key: keyof DailyReport; label: string }[] = [
  { key: "rencana_kinerja", label: "Rencana Kinerja" },
  { key: "kegiatan", label: "Kegiatan" },
  { key: "target", label: "Target" },
  { key: "realisasi", label: "Realisasi" },
  { key: "kendala", label: "Kendala" },
  { key: "solusi", label: "Solusi" },
  { key: "keterangan", label: "Keterangan" },
];

export function AdminReportDetail({
  date,
  report,
}: {
  date: string;
  report: DailyReport | null;
}) {
  return (
    <div className="card-surface p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Laporan Harian</p>
      <p className="mb-4 font-heading text-base font-bold text-slate-900">{formatIndonesianDate(date)}</p>

      {!report ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileQuestion className="size-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            Belum ada laporan untuk tanggal ini
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs font-bold text-brand-blue-dark">{label}</p>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {(report[key] as string) || "-"}
              </p>
            </div>
          ))}
          <div>
            <p className="text-xs font-bold text-brand-blue-dark">Progress</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-blue"
                  style={{ width: `${report.progress ?? 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {report.progress ?? 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
