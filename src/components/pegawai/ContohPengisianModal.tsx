"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

interface ExampleActivity {
  jam: string;
  uraian_tugas: string;
  output_target: string;
  status: string;
}

interface Example {
  label: string;
  activities: ExampleActivity[];
  kuantitas: string;
  kualitas: string;
  waktu: string;
  kendala: string;
  solusi: string;
  rencanaBesok: string[];
  keterangan: string;
}

// Contoh 1: laporan nyata milik pegawai (Ammar Tyo Pasaribu, 22 September 2026) yang
// sudah terisi lengkap dan rapi, dipakai sebagai acuan.
const EXAMPLES: Example[] = [
  {
    label: "Contoh 1",
    activities: [
      {
        jam: "07.30-08.00",
        uraian_tugas: "Briefing pagi",
        output_target: "Monitoring Target Pegawai untuk hari ini",
        status: "100",
      },
      {
        jam: "08.00-12.10",
        uraian_tugas:
          "Melakukan koordinasi dengan ketua pemandu wisata alam Bantimurung terintegrasi supervisi pelaksanaan revisit SE 2026 dan memonitoring realisasi capaian target revisit ke pegawai",
        output_target:
          "Daftar nama-nama pemandu wisata alam Bantimurung untuk ditindaklanjuti di kegiatan revisit SE2026",
        status: "100",
      },
      {
        jam: "13.00-17.12",
        uraian_tugas:
          "Memonitoring capaian target pengolahan entri dokumen Susenas, kegiatan humas, revisit SE 2026 serta membuat laporan perjadin, terintegrasi dengan administrasi dan keuangan",
        output_target:
          "Capaian realisasi target kegiatan revisit SE 2026 yang dilaksanakan oleh organik dan P3K serta realisasi pengolahan entri dokumen Susenas/Seruti hari ini terintegrasi serta capaian realisasi administrasi keuangan/pembayaran petugas SE2026 Termin II",
        status: "100",
      },
    ],
    kuantitas:
      "Target revisit 30 realisasi 40. Pengolahan entri data Susenas/Seruti target 30 dokumen M dan KP realisasi 35",
    kualitas:
      "Hasil entri harus divalidasi lalu lanjut entri Seruti, hasil revisit harus diprobim untuk tagging lokasi untuk penambahan BKu",
    waktu: "Melebihi jam kerja normal (16.00) tetapi output/realisasi di atas target/ekspektasi",
    kendala:
      "Petugas revisit jika ada tambahan usaha atau keluarga harus menghubungi admin fasih kabupaten untuk direjek, masih ada rincian di dokumen Susenas yang perlu probim ke PML dan menjadi kendala petugas entri untuk menyelesaikan entri RT tersebut",
    solusi:
      "Admin fasih kabupaten harus standby dan langsung merijek usaha/keluarga yang ditemukan petugas revisit. Mengembalikan dokumen ke PML bersangkutan",
    rencanaBesok: [
      "Briefing pagi, monitoring target dan realisasi kegiatan teknis dan umum untuk hari Rabu 23 September 2026",
    ],
    keterangan: "Kegiatan bisa berubah jika tiba-tiba ada instruksi dari pimpinan atau undangan dari pemda",
  },
  {
    label: "Contoh 2",
    activities: [
      {
        jam: "08.00-08.15",
        uraian_tugas: "Apel pagi + Briefing",
        output_target: "Menerima arahan target",
        status: "Selesai",
      },
      {
        jam: "08.15-12.00",
        uraian_tugas: "Entri data Susenas KP Maret 2026 Batch 5",
        output_target: "Target: 50 dokumen",
        status: "60 dokumen - 120%",
      },
      {
        jam: "13.00-14.30",
        uraian_tugas: "Validasi & cleaning data hasil entri",
        output_target: "Error rate <2%",
        status: "Error 1.2% - Valid",
      },
      {
        jam: "14.30-15.30",
        uraian_tugas: "Update dashboard publikasi kemiskinan di website BPS",
        output_target: "1 dashboard update",
        status: "Selesai 80%",
      },
      {
        jam: "15.30-16.00",
        uraian_tugas: "Koordinasi dengan pembimbing & isi logbook",
        output_target: "Logbook terisi",
        status: "Selesai",
      },
    ],
    kuantitas: "Melebihi target entri data sebanyak 10 dokumen",
    kualitas: "Data lolos validasi, tidak ada outlier",
    waktu: "Semua tugas selesai sesuai jam kerja",
    kendala: "Server BPS pusat maintenance jam 10.00-11.00 sehingga upload data tertunda",
    solusi: "Pekerjaan dialihkan ke desain infografis dulu, upload dilanjut jam 13.00",
    rencanaBesok: [
      "Melanjutkan update dashboard kemiskinan 100%",
      "Entri data Susenas Batch 6 target 50 dokumen",
      "Rapat internal persiapan Rilis Berita Resmi 15 September",
    ],
    keterangan: "",
  },
];

export function ContohPengisianModal() {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const example = EXAMPLES[activeIdx];

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <HelpCircle className="size-3.5" /> Contoh Pengisian
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Contoh Pengisian Laporan" maxWidth="max-w-2xl">
        <div className="space-y-5 text-sm">
          <p className="text-slate-500">
            Berikut contoh laporan harian yang terisi dengan baik dan lengkap, sebagai acuan
            format tiap bagian.
          </p>

          <div className="flex gap-2 border-b border-slate-100 pb-3">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  i === activeIdx
                    ? "bg-brand-blue text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {ex.label}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              A. Uraian Kegiatan Hari Ini
            </p>
            <div className="space-y-2.5">
              {example.activities.map((a, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-brand-blue-dark">{a.jam}</p>
                  <p className="mt-1 font-medium text-slate-800">{a.uraian_tugas}</p>
                  <p className="mt-1 text-xs text-slate-500">Target: {a.output_target}</p>
                  <p className="mt-1 text-xs text-slate-500">Status: {a.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              B. Capaian Kinerja Harian
            </p>
            <div className="space-y-1.5 text-slate-700">
              <p>
                <span className="font-semibold">Kuantitas: </span>
                {example.kuantitas}
              </p>
              <p>
                <span className="font-semibold">Kualitas: </span>
                {example.kualitas}
              </p>
              <p>
                <span className="font-semibold">Waktu: </span>
                {example.waktu}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              C. Kendala & Tindak Lanjut
            </p>
            <div className="space-y-1.5 text-slate-700">
              <p>
                <span className="font-semibold">Kendala: </span>
                {example.kendala}
              </p>
              <p>
                <span className="font-semibold">Solusi: </span>
                {example.solusi}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              D. Rencana Kegiatan Besok
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-slate-700">
              {example.rencanaBesok.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-blue-dark">
              E. Keterangan
            </p>
            <p className="text-slate-500">
              {example.keterangan || "Opsional — isi jika ada informasi tambahan, atau kosongkan jika tidak ada."}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
