"use client";

import { useRef, useState } from "react";

function parseJamRange(value: string) {
  const m = value.match(/^(\d{2})\.(\d{2})-(\d{2})\.(\d{2})$/);
  if (!m) return { startH: "", startM: "", endH: "", endM: "" };
  return { startH: m[1], startM: m[2], endH: m[3], endM: m[4] };
}

function clampDigits(digits: string, max: number) {
  if (digits.length === 2 && Number(digits) > max) return String(max).padStart(2, "0");
  return digits;
}

const boxClass =
  "w-10 rounded-lg border border-slate-300 bg-white px-1 py-1.5 text-center text-sm font-semibold text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20";

// Hanya menerima angka per kotak (jam/menit), otomatis pindah ke kotak berikutnya
// setelah 2 digit, dan menyusun jadi format "HH.MM-HH.MM" yang seragam untuk semua
// pegawai. Nilai lama yang tidak sesuai format ini (bebas ketik) akan tampil kosong
// saat diedit ulang, tapi tetap tersimpan apa adanya di tampilan baca.
export function TimeRangeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const initial = parseJamRange(value);
  const [startH, setStartH] = useState(initial.startH);
  const [startM, setStartM] = useState(initial.startM);
  const [endH, setEndH] = useState(initial.endH);
  const [endM, setEndM] = useState(initial.endM);

  const startMRef = useRef<HTMLInputElement>(null);
  const endHRef = useRef<HTMLInputElement>(null);
  const endMRef = useRef<HTMLInputElement>(null);

  function emit(sh: string, sm: string, eh: string, em: string) {
    if (sh.length === 2 && sm.length === 2 && eh.length === 2 && em.length === 2) {
      onChange(`${sh}.${sm}-${eh}.${em}`);
    } else {
      onChange("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-slate-500">Mulai</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          aria-label="Jam mulai"
          className={boxClass}
          value={startH}
          onChange={(e) => {
            const digits = clampDigits(e.target.value.replace(/\D/g, "").slice(0, 2), 23);
            setStartH(digits);
            emit(digits, startM, endH, endM);
            if (digits.length === 2) startMRef.current?.focus();
          }}
        />
        <span className="text-slate-400">:</span>
        <input
          ref={startMRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          aria-label="Menit mulai"
          className={boxClass}
          value={startM}
          onChange={(e) => {
            const digits = clampDigits(e.target.value.replace(/\D/g, "").slice(0, 2), 59);
            setStartM(digits);
            emit(startH, digits, endH, endM);
            if (digits.length === 2) endHRef.current?.focus();
          }}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-slate-500">Selesai</span>
        <input
          ref={endHRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          aria-label="Jam selesai"
          className={boxClass}
          value={endH}
          onChange={(e) => {
            const digits = clampDigits(e.target.value.replace(/\D/g, "").slice(0, 2), 23);
            setEndH(digits);
            emit(startH, startM, digits, endM);
            if (digits.length === 2) endMRef.current?.focus();
          }}
        />
        <span className="text-slate-400">:</span>
        <input
          ref={endMRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          aria-label="Menit selesai"
          className={boxClass}
          value={endM}
          onChange={(e) => {
            const digits = clampDigits(e.target.value.replace(/\D/g, "").slice(0, 2), 59);
            setEndM(digits);
            emit(startH, startM, endH, digits);
          }}
        />
      </div>
    </div>
  );
}
