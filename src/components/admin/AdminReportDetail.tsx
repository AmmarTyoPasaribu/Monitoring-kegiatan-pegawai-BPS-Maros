import { ExternalLink, FileQuestion } from "lucide-react";
import { formatIndonesianDate } from "@/lib/time";
import type { DailyReport } from "@/types";

export function AdminReportDetail({
  date,
  report,
}: {
  date: string;
  report: DailyReport | null;
}) {
  const activities = report?.activities?.length ? report.activities : [];
  const rencana = report?.rencana_besok?.filter((r) => r.trim()) || [];

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
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              A. Uraian Kegiatan Hari Ini
            </p>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada baris kegiatan</p>
            ) : (
              <>
                {/* Tabel — desktop/tablet */}
                <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Jam</th>
                          <th className="px-3 py-2 font-semibold">Uraian Tugas</th>
                          <th className="px-3 py-2 font-semibold">Output/Target</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Dok.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activities.map((a, i) => (
                          <tr key={a.id || i}>
                            <td className="whitespace-pre-wrap break-words px-3 py-2 align-top text-slate-600">
                              {a.jam || "-"}
                            </td>
                            <td className="whitespace-pre-wrap break-words px-3 py-2 align-top text-slate-700">
                              {a.uraian_tugas || "-"}
                            </td>
                            <td className="whitespace-pre-wrap break-words px-3 py-2 align-top text-slate-600">
                              {a.output_target || "-"}
                            </td>
                            <td className="whitespace-pre-wrap break-words px-3 py-2 align-top text-slate-600">
                              {a.status || "-"}
                            </td>
                            <td className="px-3 py-2 align-top">
                              {a.link_dokumentasi ? (
                                <a
                                  href={a.link_dokumentasi}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-brand-blue hover:underline"
                                >
                                  <ExternalLink className="size-3.5" /> Lihat
                                </a>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Kartu — mobile */}
                <div className="space-y-2.5 sm:hidden">
                  {activities.map((a, i) => (
                    <div key={a.id || i} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <p className="text-xs font-semibold text-brand-blue-dark">{a.jam || "-"}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words font-medium text-slate-800">
                        {a.uraian_tugas || "-"}
                      </p>
                      {a.output_target && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-500">
                          Target: {a.output_target}
                        </p>
                      )}
                      {a.status && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-500">
                          Status: {a.status}
                        </p>
                      )}
                      {a.link_dokumentasi && (
                        <a
                          href={a.link_dokumentasi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
                        >
                          <ExternalLink className="size-3.5" /> Lihat dokumentasi
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              B. Capaian Kinerja Harian
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-slate-700">Kuantitas: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {report.capaian_kuantitas || "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Kualitas: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {report.capaian_kualitas || "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Waktu: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {report.capaian_waktu || "-"}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              C. Kendala & Tindak Lanjut
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-slate-700">Kendala: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {report.kendala || "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Solusi: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {report.solusi || "-"}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              D. Rencana Kegiatan Besok
            </p>
            {rencana.length === 0 ? (
              <p className="text-sm text-slate-400">-</p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {rencana.map((r, i) => (
                  <li key={i} className="whitespace-pre-wrap break-words">
                    {r}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              E. Keterangan
            </p>
            <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
              {report.keterangan || "-"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
