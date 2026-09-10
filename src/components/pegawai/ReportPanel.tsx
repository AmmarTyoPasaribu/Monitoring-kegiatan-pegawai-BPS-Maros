"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { formatIndonesianDate } from "@/lib/time";
import type { DailyReport, DailyReportInput } from "@/types";

const EMPTY_FORM: DailyReportInput = {
  rencana_kinerja: "",
  kegiatan: "",
  target: "",
  realisasi: "",
  progress: 0,
  kendala: "",
  solusi: "",
  keterangan: "",
};

function reportToForm(r: DailyReport): DailyReportInput {
  return {
    rencana_kinerja: r.rencana_kinerja || "",
    kegiatan: r.kegiatan || "",
    target: r.target || "",
    realisasi: r.realisasi || "",
    progress: r.progress ?? 0,
    kendala: r.kendala || "",
    solusi: r.solusi || "",
    keterangan: r.keterangan || "",
  };
}

const FIELD_LABELS: { key: keyof DailyReportInput; label: string; area: boolean }[] = [
  { key: "rencana_kinerja", label: "Rencana Kinerja", area: true },
  { key: "kegiatan", label: "Kegiatan", area: true },
  { key: "target", label: "Target", area: false },
  { key: "realisasi", label: "Realisasi", area: false },
  { key: "kendala", label: "Kendala", area: true },
  { key: "solusi", label: "Solusi", area: true },
  { key: "keterangan", label: "Keterangan", area: true },
];

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

  const isValid =
    form.rencana_kinerja.trim() &&
    form.kegiatan.trim() &&
    form.progress >= 0 &&
    form.progress <= 100;

  return (
    <div className="card-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
            {editing ? "Laporan Harian" : "Laporan Harian"}
          </p>
          <p className="font-heading text-base font-bold text-slate-900">
            {formatIndonesianDate(date)}
          </p>
        </div>
        {existing && !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        )}
      </div>

      {!editing && existing ? (
        <div className="space-y-4">
          {FIELD_LABELS.map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs font-bold text-brand-blue-dark">{label}</p>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {(existing[key] as string) || "-"}
              </p>
            </div>
          ))}
          <div>
            <p className="text-xs font-bold text-brand-blue-dark">Progress</p>
            <p className="text-sm text-slate-700">{existing.progress ?? 0}%</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {FIELD_LABELS.slice(0, 2).map(({ key, label, area }) => (
            <div key={key}>
              <Label required>{label}</Label>
              {area ? (
                <Textarea
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              ) : (
                <Input
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target</Label>
              <Input
                value={form.target}
                onChange={(e) => updateField("target", e.target.value)}
              />
            </div>
            <div>
              <Label>Realisasi</Label>
              <Input
                value={form.realisasi}
                onChange={(e) => updateField("realisasi", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Progress (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => updateField("progress", Number(e.target.value))}
            />
          </div>

          {FIELD_LABELS.slice(4).map(({ key, label, area }) => (
            <div key={key}>
              <Label>{label}</Label>
              {area ? (
                <Textarea
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              ) : (
                <Input
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              )}
            </div>
          ))}

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
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!isValid}
            >
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
