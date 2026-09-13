import "server-only";
import { AVATAR_BUCKET, supabaseAdmin } from "@/lib/supabase";

export interface TableSize {
  table_name: string;
  size_bytes: number;
  row_count: number;
}

export interface StorageStats {
  totalBytes: number;
  fileCount: number;
}

/** Total ukuran & jumlah file di bucket foto profil (avatars). */
export async function getAvatarStorageStats(): Promise<StorageStats> {
  let totalBytes = 0;
  let fileCount = 0;
  const limit = 100;
  let offset = 0;

  // Loop paginasi -- Storage API membatasi 100 item per panggilan.
  // Dibatasi 50 halaman (5000 file) sebagai jaring pengaman.
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });

    if (error || !data || data.length === 0) break;

    for (const file of data) {
      const size = (file.metadata as { size?: number } | null)?.size;
      if (typeof size === "number") {
        totalBytes += size;
        fileCount++;
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return { totalBytes, fileCount };
}

/** Ukuran database (bytes). Null jika fungsi SQL belum dibuat di Supabase. */
export async function getDatabaseSizeBytes(): Promise<number | null> {
  const { data, error } = await supabaseAdmin.rpc("get_database_size");
  if (error) return null;
  return typeof data === "number" ? data : Number(data) || null;
}

/** Ukuran per tabel. Null jika fungsi SQL belum dibuat di Supabase. */
export async function getTableSizes(): Promise<TableSize[] | null> {
  const { data, error } = await supabaseAdmin.rpc("get_table_sizes");
  if (error || !data) return null;
  // Fallback ke kolom lama `row_estimate` kalau fungsi SQL di project belum
  // di-update ke versi terbaru (COUNT(*) asli) -- supaya tidak error/kosong.
  return (data as Record<string, unknown>[]).map((r) => ({
    table_name: String(r.table_name),
    size_bytes: Number(r.size_bytes) || 0,
    row_count: Number(r.row_count ?? r.row_estimate ?? 0),
  }));
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(2) : value < 100 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
