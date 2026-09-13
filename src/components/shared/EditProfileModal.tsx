"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { compressImage } from "@/lib/compressImage";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentUsername: string;
  currentEmail: string;
  /** Saat true, tampilkan juga field Nama Lengkap & foto profil (dipakai admin). */
  showProfileFields?: boolean;
  currentFullName?: string;
  currentPhotoUrl?: string | null;
  onSaved: (data: {
    username: string;
    email: string;
    full_name?: string;
    photo_url?: string | null;
  }) => void;
}

export function EditProfileModal({
  open,
  onClose,
  currentUsername,
  currentEmail,
  showProfileFields = false,
  currentFullName = "",
  currentPhotoUrl = null,
  onSaved,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(currentFullName);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid =
    username.trim().length >= 3 &&
    /\S+@\S+\.\S+/.test(email) &&
    (password === "" || password.length >= 6) &&
    (!showProfileFields || fullName.trim().length >= 1);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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

  async function handleConfirmSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("username", username);
      fd.set("email", email);
      if (password) fd.set("password", password);
      if (showProfileFields) {
        fd.set("full_name", fullName);
        if (photoFile) fd.set("photo", photoFile);
      }

      const res = await fetch("/api/account", { method: "PUT", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui akun");
        return;
      }
      toast.success("Akun berhasil diperbarui");
      onSaved({
        username: data.user.username,
        email: data.user.email,
        full_name: data.user.full_name,
        photo_url: data.user.photo_url,
      });
      setConfirmOpen(false);
      setPassword("");
      setPhotoFile(null);
      onClose();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Ubah Akun Saya" maxWidth="max-w-sm">
        <div className="space-y-4">
          {showProfileFields && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative"
              >
                <Avatar src={preview} name={fullName || "?"} className="size-20 text-lg" />
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
          )}

          {showProfileFields && (
            <div>
              <Label required>Nama Lengkap</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}

          <div>
            <Label required>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label required>Email (Gmail)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>
              Password Baru{" "}
              <span className="font-normal text-slate-400">(kosongkan jika tidak diubah)</span>
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimal 6 karakter"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button disabled={!isValid} onClick={() => setConfirmOpen(true)}>
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Simpan Perubahan Akun"
        description="Yakin ingin menyimpan perubahan data akun Anda?"
        confirmLabel="Simpan"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
