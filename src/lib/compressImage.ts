/**
 * Kompres & resize gambar di sisi browser sebelum diupload, supaya foto dari
 * HP modern (sering 5-10MB+) tidak langsung ditolak batas ukuran server.
 * Best-effort: kalau browser tidak mendukung Canvas/createImageBitmap,
 * atau gagal karena alasan apa pun, file asli dikembalikan apa adanya.
 */
export async function compressImage(
  file: File,
  { maxSize = 1024, quality = 0.82 }: { maxSize?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    // Kalau hasil kompresi ternyata lebih besar dari aslinya (jarang, biasanya
    // untuk file yang sudah kecil/terkompresi baik), pakai file asli saja.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
