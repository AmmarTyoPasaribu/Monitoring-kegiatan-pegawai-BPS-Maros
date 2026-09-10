import "server-only";
import { randomUUID } from "crypto";
import { AVATAR_BUCKET, supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function uploadAvatar(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format foto harus JPG, PNG, atau WEBP");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Ukuran foto maksimal 2MB");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error("Gagal mengunggah foto: " + error.message);
  }

  const { data } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function extractAvatarPath(publicUrl: string): string | null {
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

/**
 * Hapus foto lama dari Supabase Storage (best-effort). Dipanggil setelah foto
 * pengganti berhasil disimpan, atau setelah data pegawai dihapus, supaya file
 * lama tidak menumpuk jadi sampah di storage.
 */
export async function deleteAvatar(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl) return;
  const path = extractAvatarPath(publicUrl);
  if (!path) return;
  try {
    await supabaseAdmin.storage.from(AVATAR_BUCKET).remove([path]);
  } catch {
    // Best-effort cleanup — jangan sampai kegagalan hapus foto lama
    // menggagalkan operasi utama (update/hapus pegawai).
  }
}
