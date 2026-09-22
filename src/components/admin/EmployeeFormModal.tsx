"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { compressImage } from "@/lib/compressImage";

export interface Employee {
  id: string;
  full_name: string;
  username: string;
  email: string;
  division: string | null;
  photo_url: string | null;
}

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null; // null = mode tambah
  divisions: string[];
  onSaved: (employee: Employee) => void;
}

const EMPTY = { full_name: "", username: "", email: "", password: "", division: "" };

// Parent harus memberi `key` yang berubah tiap kali modal dibuka (mis. employee?.id ?? "create"
// digabung counter) supaya komponen ini remount dan form ter-reset otomatis, tanpa perlu effect.
export function EmployeeFormModal({ open, onClose, employee, divisions, onSaved }: EmployeeFormModalProps) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState(() =>
    employee
      ? {
          full_name: employee.full_name,
          username: employee.username,
          email: employee.email,
          password: "",
          division: employee.division || "",
        }
      : EMPTY
  );
  // Selalu sertakan divisi pegawai yang sedang diedit, walau namanya tidak persis
  // sama dengan divisi lain yang ada saat ini -> supaya data lama tidak hilang
  // diam-diam hanya karena membuka modal edit.
  const divisionOptions = employee?.division && !divisions.includes(employee.division)
    ? [employee.division, ...divisions]
    : divisions;

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(employee?.photo_url || null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya bisa pilih file yang sama lagi kalau perlu
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 15MB");
      return;
    }
    const compressed = await compressImage(file);
    if (compressed.size > 2 * 1024 * 1024) {
      toast.error("Foto masih terlalu besar setelah dikompres, coba foto lain");
      return;
    }
    setPhotoFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  }

  const isValid =
    form.full_name.trim() &&
    form.username.trim().length >= 3 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    (isEdit || form.password.length >= 6) &&
    (form.password === "" || form.password.length >= 6);

  async function handleConfirmSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("full_name", form.full_name.trim());
      fd.set("username", form.username.trim());
      fd.set("email", form.email.trim());
      fd.set("division", form.division.trim());
      if (form.password) fd.set("password", form.password);
      if (photoFile) fd.set("photo", photoFile);

      const res = await fetch(
        isEdit ? `/api/admin/employees/${employee!.id}` : "/api/admin/employees",
        { method: isEdit ? "PUT" : "POST", body: fd }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menyimpan data pegawai");
        return;
      }
      toast.success(isEdit ? "Data pegawai berhasil diperbarui" : "Pegawai baru berhasil ditambahkan");
      onSaved(data.employee);
      setConfirmOpen(false);
      onClose();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? "Edit Pegawai" : "Tambah Pegawai"}>
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative"
            >
              <Avatar src={preview} name={form.full_name || "?"} className="size-20 text-lg" />
              <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-brand-blue text-white shadow ring-2 ring-white group-hover:bg-brand-blue-dark">
                <Camera className="size-3.5" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <Label required>Nama Lengkap</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label required>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div>
              <Label required>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label required={!isEdit}>
              Password {isEdit && <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>}
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? "••••••" : "minimal 6 karakter"}
            />
          </div>

          <div>
            <Label>Divisi</Label>
            <Select
              value={form.division}
              onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
            >
              <option value="">Tanpa Divisi</option>
              {divisionOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button disabled={!isValid} onClick={() => setConfirmOpen(true)}>
              {isEdit ? "Simpan Perubahan" : "Tambah Pegawai"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title={isEdit ? "Simpan Perubahan Pegawai" : "Tambah Pegawai Baru"}
        description={
          isEdit
            ? `Simpan perubahan data untuk ${employee?.full_name}?`
            : `Tambahkan ${form.full_name || "pegawai ini"} sebagai pegawai baru?`
        }
        confirmLabel={isEdit ? "Simpan" : "Tambah"}
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
