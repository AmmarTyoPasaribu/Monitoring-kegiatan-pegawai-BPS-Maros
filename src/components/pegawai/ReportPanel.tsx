"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Pencil } from "lucide-react";
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

const FIELD_LABELS: { key: keyof DailyReportInput; label: string; required?: boolean }[] = [
  { key: "rencana_kinerja", label: "Rencana Kinerja", required: true },
  { key: "kegiatan", label: "Kegiatan", required: true },
  { key: "target", label: "Target" },
  { key: "realisasi", label: "Realisasi" },
  { key: "kendala", label: "Kendala" },
  { key: "solusi", label: "Solusi" },
  { key: "keterangan", label: "Keterangan" },
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

  function handleSubmitClick() {
    if (!form.rencana_kinerja.trim() || !form.kegiatan.trim()) {
      toast.error("Rencana Kinerja atau Kegiatan belum terisi");
      return;
    }
    setConfirmOpen(true);
  }

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
          {existing.admin_note && (
            <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-brand-blue-dark">
                <MessageSquare className="size-3.5" />
                <p className="text-xs font-bold">Catatan dari Admin</p>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                {existing.admin_note}
              </p>
            </div>
          )}
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
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-blue"
                  style={{ width: `${existing.progress ?? 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {existing.progress ?? 0}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {FIELD_LABELS.slice(0, 4).map(({ key, label, required }) => (
            <div key={key}>
              <Label required={required}>{label}</Label>
              <Textarea
                value={form[key]}
                onChange={(e) => updateField(key, e.target.value)}
              />
            </div>
          ))}

          <div>
            <Label>
              Progress (%){" "}
              <span className="font-normal text-slate-400">(0-100)</span>
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
              value={form.progress === 0 ? "" : form.progress}
              onChange={(e) =>
                updateField("progress", e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
          </div>

          {FIELD_LABELS.slice(4).map(({ key, label, required }) => (
            <div key={key}>
              <Label required={required}>{label}</Label>
              <Textarea
                value={form[key]}
                onChange={(e) => updateField(key, e.target.value)}
              />
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
