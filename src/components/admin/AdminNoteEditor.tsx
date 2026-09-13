"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Textarea } from "@/components/ui/Field";

// Parent harus memberi `key={reportId}` supaya komponen ini remount tiap ganti
// laporan yang dipilih, otomatis mereset isi catatan tanpa perlu effect.
export function AdminNoteEditor({
  reportId,
  initialNote,
  onSaved,
}: {
  reportId: string;
  initialNote: string | null;
  onSaved: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote || "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const changed = note !== (initialNote || "");

  async function handleConfirmSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/note`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan catatan");
        return;
      }
      toast.success("Catatan berhasil disimpan");
      onSaved(note);
      setConfirmOpen(false);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-surface p-5">
      <div className="mb-3 flex items-center gap-2 text-brand-blue-dark">
        <MessageSquare className="size-4" />
        <p className="text-sm font-bold">Catatan Admin untuk Pegawai</p>
      </div>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Tulis catatan atau masukan untuk laporan ini (opsional)... akan terlihat oleh pegawai yang bersangkutan."
        maxLength={2000}
      />
      <div className="mt-3 flex justify-end">
        <Button size="sm" disabled={!changed} onClick={() => setConfirmOpen(true)}>
          Simpan Catatan
        </Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Simpan Catatan"
        description="Catatan ini akan bisa dilihat oleh pegawai yang bersangkutan pada laporan tersebut. Simpan perubahan?"
        confirmLabel="Simpan"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
