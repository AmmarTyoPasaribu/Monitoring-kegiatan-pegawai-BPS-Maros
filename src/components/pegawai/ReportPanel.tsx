"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ListChecks, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { ContohPengisianModal } from "@/components/pegawai/ContohPengisianModal";
import { TimeRangeInput } from "@/components/pegawai/TimeRangeInput";
import { formatIndonesianDate } from "@/lib/time";
import type { DailyReport, DailyReportActivity, DailyReportInput } from "@/types";

const EMPTY_ACTIVITY: DailyReportActivity = {
  jam: "",
  uraian_tugas: "",
  output_target: "",
  status: "",
  link_dokumentasi: "",
};

// `id` di sini murni untuk key React (baris baru belum punya id dari DB) supaya
// TimeRangeInput tidak salah state saat baris lain ditambah/dihapus. Server tidak
// pernah membaca field ini saat insert.
function newActivity(): DailyReportActivity {
  return { ...EMPTY_ACTIVITY, id: crypto.randomUUID() };
}

const EMPTY_FORM: DailyReportInput = {
  capaian_kuantitas: "",
  capaian_kualitas: "",
  capaian_waktu: "",
  kendala: "",
  solusi: "",
  rencana_besok: [""],
  keterangan: "",
  activities: [{ ...EMPTY_ACTIVITY, id: "new-0" }],
};

function reportToForm(r: DailyReport): DailyReportInput {
  return {
    capaian_kuantitas: r.capaian_kuantitas || "",
    capaian_kualitas: r.capaian_kualitas || "",
    capaian_waktu: r.capaian_waktu || "",
    kendala: r.kendala || "",
    solusi: r.solusi || "",
    rencana_besok: r.rencana_besok?.length ? r.rencana_besok : [""],
    keterangan: r.keterangan || "",
    activities: r.activities?.length
      ? r.activities.map((a) => ({ ...a }))
      : [{ ...EMPTY_ACTIVITY, id: "new-0" }],
  };
}

function isValidLink(v: string) {
  return v.trim() === "" || /^https?:\/\/\S+$/i.test(v.trim());
}

// Parent harus memberi `key={date}` supaya komponen ini remount tiap ganti tanggal,
// otomatis mereset form/mode edit tanpa perlu effect.
export function ReportPanel({
  date,
  existing,
  onSaved,
}: {
  date: string;
  existing: DailyReport | null;
  onSaved: (report: DailyReport) => void;
}) {
  const [editing, setEditing] = useState(!existing);
  const [form, setForm] = useState<DailyReportInput>(
    existing ? reportToForm(existing) : EMPTY_FORM
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof DailyReportInput>(key: K, value: DailyReportInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateActivity<K extends keyof DailyReportActivity>(
    idx: number,
    key: K,
    value: DailyReportActivity[K]
  ) {
    setForm((f) => ({
      ...f,
      activities: f.activities.map((a, i) => (i === idx ? { ...a, [key]: value } : a)),
    }));
  }

  function addActivity() {
    setForm((f) => ({ ...f, activities: [...f.activities, newActivity()] }));
  }

  function removeActivity(idx: number) {
    setForm((f) => ({ ...f, activities: f.activities.filter((_, i) => i !== idx) }));
  }

  function updateRencana(idx: number, value: string) {
    setForm((f) => ({
      ...f,
      rencana_besok: f.rencana_besok.map((r, i) => (i === idx ? value : r)),
    }));
  }

  function addRencana() {
    setForm((f) => ({ ...f, rencana_besok: [...f.rencana_besok, ""] }));
  }

  function removeRencana(idx: number) {
    setForm((f) => ({ ...f, rencana_besok: f.rencana_besok.filter((_, i) => i !== idx) }));
  }

  async function handleConfirmSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_date: date, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan laporan");
        return;
      }
      toast.success(existing ? "Laporan berhasil diperbarui" : "Laporan berhasil disimpan");
      onSaved(data.report);
      setEditing(false);
      setConfirmOpen(false);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmitClick() {
    if (!form.activities.some((a) => a.uraian_tugas.trim())) {
      toast.error("Minimal satu baris Uraian Tugas pada bagian A belum diisi");
      return;
    }
    const invalidIdx = form.activities.findIndex((a) => !isValidLink(a.link_dokumentasi));
    if (invalidIdx !== -1) {
      toast.error(
        `Link dokumentasi baris ke-${invalidIdx + 1} tidak valid (harus diawali http:// atau https://)`
      );
      return;
    }
    setConfirmOpen(true);
  }

  const filledActivities = existing?.activities?.length ? existing.activities : [];
  const filledRencana = existing?.rencana_besok?.filter((r) => r.trim()) || [];

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
            Laporan Harian
          </p>
          <p className="truncate font-heading text-base font-bold text-slate-900">
            {formatIndonesianDate(date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ContohPengisianModal />
          {existing && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {!editing && existing ? (
        <div className="space-y-5">
          {existing.admin_note && (
            <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-brand-blue-dark">
                <MessageSquare className="size-3.5" />
                <p className="text-xs font-bold">Catatan dari Kepala BPS</p>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {existing.admin_note}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              A. Uraian Kegiatan Hari Ini
            </p>
            {filledActivities.length === 0 ? (
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
                        {filledActivities.map((a, i) => (
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
                  {filledActivities.map((a, i) => (
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
                  {existing.capaian_kuantitas || "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Kualitas: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {existing.capaian_kualitas || "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Waktu: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {existing.capaian_waktu || "-"}
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
                  {existing.kendala || "-"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Solusi: </span>
                <span className="whitespace-pre-wrap break-words text-slate-700">
                  {existing.solusi || "-"}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              D. Rencana Kegiatan Besok
            </p>
            {filledRencana.length === 0 ? (
              <p className="text-sm text-slate-400">-</p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {filledRencana.map((r, i) => (
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
              {existing.keterangan || "-"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
                <ListChecks className="size-3.5" /> A. Uraian Kegiatan Hari Ini
              </p>
              <Button type="button" size="sm" variant="primary" onClick={addActivity}>
                <Plus className="size-3.5" /> Tambah Baris
              </Button>
            </div>
            <div className="space-y-3">
              {form.activities.map((a, idx) => (
                <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue-dark">
                      Kegiatan {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeActivity(idx)}
                      className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                      aria-label={`Hapus baris ${idx + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div>
                    <Label>Jam</Label>
                    <TimeRangeInput
                      value={a.jam}
                      onChange={(v) => updateActivity(idx, "jam", v)}
                    />
                  </div>
                  <div className="mt-3">
                    <Label>Uraian Tugas</Label>
                    <Textarea
                      value={a.uraian_tugas}
                      onChange={(e) => updateActivity(idx, "uraian_tugas", e.target.value)}
                    />
                  </div>
                  <div className="mt-3">
                    <Label>Output/Target Harian</Label>
                    <Textarea
                      value={a.output_target}
                      onChange={(e) => updateActivity(idx, "output_target", e.target.value)}
                    />
                  </div>
                  <div className="mt-3">
                    <Label>Status</Label>
                    <Input
                      placeholder="Selesai / 80%"
                      value={a.status}
                      onChange={(e) => updateActivity(idx, "status", e.target.value)}
                    />
                  </div>
                  <div className="mt-3">
                    <Label>Link Dokumentasi (Google Drive)</Label>
                    <Input
                      placeholder="https://drive.google.com/... (opsional)"
                      value={a.link_dokumentasi}
                      onChange={(e) => updateActivity(idx, "link_dokumentasi", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              {form.activities.length === 0 && (
                <p className="text-sm text-slate-400">
                  Belum ada baris kegiatan, tekan &quot;Tambah Baris&quot;.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              B. Capaian Kinerja Harian
            </p>
            <div className="space-y-3">
              <div>
                <Label>Kuantitas</Label>
                <Textarea
                  value={form.capaian_kuantitas}
                  onChange={(e) => updateField("capaian_kuantitas", e.target.value)}
                />
              </div>
              <div>
                <Label>Kualitas</Label>
                <Textarea
                  value={form.capaian_kualitas}
                  onChange={(e) => updateField("capaian_kualitas", e.target.value)}
                />
              </div>
              <div>
                <Label>Waktu</Label>
                <Textarea
                  value={form.capaian_waktu}
                  onChange={(e) => updateField("capaian_waktu", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              C. Kendala & Tindak Lanjut
            </p>
            <div className="space-y-3">
              <div>
                <Label>Kendala</Label>
                <Textarea
                  value={form.kendala}
                  onChange={(e) => updateField("kendala", e.target.value)}
                />
              </div>
              <div>
                <Label>Solusi</Label>
                <Textarea
                  value={form.solusi}
                  onChange={(e) => updateField("solusi", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
                D. Rencana Kegiatan Besok
              </p>
              <Button type="button" size="sm" variant="primary" onClick={addRencana}>
                <Plus className="size-3.5" /> Tambah Poin
              </Button>
            </div>
            <div className="space-y-2">
              {form.rencana_besok.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-sm font-semibold text-slate-400">
                    {idx + 1}.
                  </span>
                  <Input
                    className="flex-1 bg-white"
                    value={r}
                    onChange={(e) => updateRencana(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRencana(idx)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                    aria-label={`Hapus poin ${idx + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <Label>E. Keterangan</Label>
            <Textarea
              value={form.keterangan}
              onChange={(e) => updateField("keterangan", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {existing && (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(reportToForm(existing));
                  setEditing(false);
                }}
              >
                Batal
              </Button>
            )}
            <Button onClick={handleSubmitClick}>
              {existing ? "Simpan Perubahan" : "Kirim Laporan"}
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={existing ? "Simpan Perubahan Laporan" : "Kirim Laporan Harian"}
        description={
          existing
            ? "Pastikan data yang Anda ubah sudah benar. Lanjutkan menyimpan perubahan?"
            : "Pastikan data laporan yang Anda isi sudah benar sebelum dikirim."
        }
        confirmLabel={existing ? "Simpan" : "Kirim"}
        variant="primary"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
