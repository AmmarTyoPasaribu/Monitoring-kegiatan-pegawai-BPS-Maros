"use client";

import { useEffect, useState } from "react";
import {
  Bold,
  Camera,
  ChevronRight,
  Clock,
  Megaphone,
  MousePointerClick,
  Palette,
  Save,
  Sparkles,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

type ItemTone = "blue" | "green" | "orange";

interface AnnouncementItem {
  icon: LucideIcon;
  tone: ItemTone;
  tag: string;
  title: string;
  description: string;
}

interface Announcement {
  id: string;
  version: string;
  date: string;
  author: string;
  items: AnnouncementItem[];
}

const TONE_CLASSES: Record<ItemTone, string> = {
  blue: "bg-brand-blue/10 text-brand-blue",
  green: "bg-brand-green/10 text-brand-green",
  orange: "bg-brand-orange/10 text-brand-orange",
};

const TAG_CLASSES: Record<ItemTone, string> = {
  blue: "text-brand-blue",
  green: "text-brand-green",
  orange: "text-brand-orange",
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "v2.0",
    version: "2.0",
    date: "1 Oktober 2026",
    author: "Admin Ammar",
    items: [
      {
        icon: Sparkles,
        tone: "blue",
        tag: "Fitur Baru",
        title: "Export Excel Lebih Fleksibel",
        description:
          "Sekarang ada 2 pilihan format: Ringkas (1 baris per tanggal) atau Detail (1 baris per kegiatan).",
      },
      {
        icon: Camera,
        tone: "blue",
        tag: "Fitur Baru",
        title: "Ganti & Potong Foto Profil",
        description:
          "Pegawai sekarang bisa mengganti foto profil sendiri, lengkap dengan fitur potong & zoom sebelum disimpan.",
      },
      {
        icon: Clock,
        tone: "orange",
        tag: "Perbaikan",
        title: "Jam Kegiatan Kosong",
        description:
          "Jika jam kegiatan tidak diisi saat mengirim laporan, otomatis tersimpan sebagai 00.00 agar tetap rapi saat diedit kembali.",
      },
      {
        icon: MousePointerClick,
        tone: "green",
        tag: "Peningkatan",
        title: 'Tombol "Tambah Kegiatan"',
        description: 'Tombol "Tambah Baris" di form kegiatan diganti jadi "Tambah Kegiatan" agar lebih jelas.',
      },
      {
        icon: Bold,
        tone: "green",
        tag: "Peningkatan",
        title: "Judul Kolom Lebih Jelas",
        description:
          "Judul tiap kolom form kegiatan (Kuantitas, Kualitas, Uraian Tugas, dst.) dibuat lebih tebal dan sedikit lebih besar.",
      },
      {
        icon: Save,
        tone: "blue",
        tag: "Fitur Baru",
        title: "Draf Laporan Otomatis Tersimpan",
        description:
          "Ketikan yang belum dikirim otomatis tersimpan di perangkat Anda, jadi tidak hilang walau halaman di-refresh atau pindah aplikasi dulu.",
      },
      {
        icon: Palette,
        tone: "green",
        tag: "Peningkatan",
        title: "Tampilan Dashboard Lebih Menarik",
        description:
          "Beranda, Riwayat, kalender, dan navigasi bawah diberi sentuhan warna, ikon, dan animasi baru biar lebih enak dilihat.",
      },
      {
        icon: UserCog,
        tone: "green",
        tag: "Peningkatan",
        title: "Form Ubah Profil Lebih Rapi",
        description:
          "Tampilan ubah akun sekarang punya banner foto profil dan ikon di tiap kolom, lebih mudah dibaca.",
      },
    ],
  },
];

const SEEN_KEY = "seenAnnouncementId";

export function AnnouncementBanner() {
  const [open, setOpen] = useState(false);
  const [seenId, setSeenId] = useState<string | null>(null);

  // Dibaca setelah mount (bukan saat render awal) supaya tidak mismatch dengan
  // hasil render server, yang tidak punya akses localStorage.
  useEffect(() => {
    try {
      // Sinkronisasi dari localStorage (API eksternal), bukan state turunan.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeenId(localStorage.getItem(SEEN_KEY));
    } catch {
      // localStorage tidak tersedia (mis. mode privat) -> anggap belum pernah dilihat
    }
  }, []);

  const latest = ANNOUNCEMENTS[0];
  const isNew = seenId !== latest.id;

  function handleOpen() {
    setOpen(true);
    setSeenId(latest.id);
    try {
      localStorage.setItem(SEEN_KEY, latest.id);
    } catch {
      // best-effort, tidak kritikal kalau gagal tersimpan
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="group flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 px-4 py-3.5 text-left shadow-sm shadow-orange-900/5 transition-all hover:border-orange-300 hover:shadow-md hover:shadow-orange-900/10"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-orange-600 text-white shadow-sm shadow-orange-500/30">
            <Megaphone className="size-4.5" />
            {isNew && (
              <span className="absolute -right-0.5 -top-0.5 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500 ring-2 ring-white" />
              </span>
            )}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {ANNOUNCEMENTS.length} pengumuman
              {isNew && <span className="ml-1.5 text-brand-orange">· Baru!</span>}
            </p>
            <p className="text-xs text-slate-500">Lihat pembaruan terbaru aplikasi</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-brand-orange shadow-sm ring-1 ring-orange-200 transition-colors group-hover:bg-brand-orange group-hover:text-white">
          Lihat
          <ChevronRight className="size-3.5" />
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pengumuman" maxWidth="max-w-md">
        <div className="space-y-5">
          {ANNOUNCEMENTS.map((a) => (
            <div key={a.id}>
              <div className="brand-panel relative overflow-hidden rounded-2xl px-4 py-4 text-white">
                <div className="relative flex items-center gap-2">
                  <Sparkles className="size-5" />
                  <p className="font-heading text-lg font-extrabold">Versi {a.version}</p>
                </div>
                <p className="relative mt-1 text-xs text-white/75">
                  Update Web Monitoring &middot; {a.date}
                </p>
                <p className="relative text-xs text-white/60">oleh {a.author}</p>
              </div>

              <div className="mt-4 space-y-2.5">
                {a.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-surface p-3"
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        TONE_CLASSES[item.tone]
                      )}
                    >
                      <item.icon className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-[10px] font-bold uppercase tracking-wide", TAG_CLASSES[item.tone])}>
                        {item.tag}
                      </p>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
