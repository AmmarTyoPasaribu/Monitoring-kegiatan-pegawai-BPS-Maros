"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { compressImage } from "@/lib/compressImage";

const VIEWPORT_SIZE = 240; // px, area lingkaran crop yang terlihat di layar
const OUTPUT_SIZE = 512; // px, ukuran foto persegi yang dihasilkan sebelum dikompres
const MIN_SCALE = 1;
const MAX_SCALE = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Parent harus memberi `key` yang berubah tiap kali file baru dipilih supaya
// komponen ini remount dan posisi/zoom selalu mulai dari nol, tanpa perlu effect.
export function AvatarCropper({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );

  // Buat & cabut object URL dalam effect yang sama (bukan di useState initializer)
  // supaya aman dari React Strict Mode di dev, yang menjalankan mount->cleanup->mount
  // sekali di awal -> kalau revoke terpisah dari pembuatan URL, URL yang sudah dipakai
  // <img> keburu dicabut duluan sebelum sempat tampil (gambar jadi "broken").
  useEffect(() => {
    const url = URL.createObjectURL(file);
    // Sinkronisasi ke Blob URL registry browser (API eksternal), bukan state turunan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale =
    natural.width && natural.height
      ? Math.max(VIEWPORT_SIZE / natural.width, VIEWPORT_SIZE / natural.height)
      : 1;
  const effectiveScale = baseScale * scale;
  const displayWidth = natural.width * effectiveScale;
  const displayHeight = natural.height * effectiveScale;

  function clampOffset(x: number, y: number, dispW: number, dispH: number) {
    const maxX = Math.max(0, (dispW - VIEWPORT_SIZE) / 2);
    const maxY = Math.max(0, (dispH - VIEWPORT_SIZE) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }

  function handleScaleChange(next: number) {
    const clamped = clamp(next, MIN_SCALE, MAX_SCALE);
    setScale(clamped);
    const nextEffective = baseScale * clamped;
    setOffset((prev) =>
      clampOffset(prev.x, prev.y, natural.width * nextEffective, natural.height * nextEffective)
    );
  }

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(
      clampOffset(dragRef.current.originX + dx, dragRef.current.originY + dy, displayWidth, displayHeight)
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    handleScaleChange(scale + (e.deltaY > 0 ? -0.08 : 0.08));
  }

  async function handleConfirm() {
    if (!imgRef.current || !natural.width) return;
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const srcSize = VIEWPORT_SIZE / effectiveScale;
      const centerXNatural = (displayWidth / 2 - offset.x) / effectiveScale;
      const centerYNatural = (displayHeight / 2 - offset.y) / effectiveScale;
      const srcX = clamp(centerXNatural - srcSize / 2, 0, natural.width - srcSize);
      const srcY = clamp(centerYNatural - srcSize / 2, 0, natural.height - srcSize);

      ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) {
        toast.error("Gagal memproses foto");
        return;
      }
      const cropped = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const compressed = await compressImage(cropped);
      onCropped(compressed);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal open onClose={onCancel} title="Atur Foto Profil" maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative size-60 touch-none select-none overflow-hidden rounded-full border-4 border-slate-100 bg-slate-900"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- object URL lokal, bukan aset Next
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Pratinjau foto"
              draggable={false}
              onLoad={(e) =>
                setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })
              }
              className="absolute left-1/2 top-1/2 max-w-none cursor-grab active:cursor-grabbing"
              style={{
                width: displayWidth || undefined,
                height: displayHeight || undefined,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
        </div>

        <div className="flex w-full items-center gap-3">
          <ZoomOut className="size-4 shrink-0 text-slate-400" />
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.01}
            value={scale}
            onChange={(e) => handleScaleChange(Number(e.target.value))}
            className="w-full accent-brand-blue"
          />
          <ZoomIn className="size-4 shrink-0 text-slate-400" />
        </div>
        <p className="-mt-2 text-center text-xs text-slate-400">
          Geser foto untuk memindahkan posisi, gunakan slider untuk zoom.
        </p>

        <div className="flex w-full justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Batal
          </Button>
          <Button onClick={handleConfirm} loading={processing}>
            Pakai Foto Ini
          </Button>
        </div>
      </div>
    </Modal>
  );
}
