// WITA = UTC+8, tanpa DST (berlaku sepanjang tahun di Indonesia).
// Trik: geser epoch ms sebesar offset, lalu baca komponen tanggal via getUTC*
// supaya tidak terpengaruh timezone server tempat kode dijalankan.

const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function shiftedNow(): Date {
  return new Date(Date.now() + WITA_OFFSET_MS);
}

/** Komponen tanggal WITA saat ini: {year, month(1-12), day, hour, minute, second} */
export function getWitaNowParts() {
  const d = shiftedNow();
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(), // 0 = Minggu
  };
}

/** Tanggal hari ini di WITA, format YYYY-MM-DD */
export function todayWitaDateString(): string {
  const { year, month, day } = getWitaNowParts();
  return `${year}-${pad(month)}-${pad(day)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** true jika dateStr (YYYY-MM-DD) > hari ini WITA (masa depan) */
export function isFutureWitaDate(dateStr: string): boolean {
  return dateStr > todayWitaDateString();
}

/** Format "Selasa, 8 September 2026" dari string YYYY-MM-DD */
export function formatIndonesianDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Gunakan UTC agar tidak bergeser oleh timezone browser/server.
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  const dayName = DAY_NAMES[utcDate.getUTCDay()];
  return `${dayName}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export function monthNameId(month: number): string {
  return MONTH_NAMES[month - 1];
}

/** Jumlah hari dalam bulan tertentu (month: 1-12) */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** getUTCDay() untuk tanggal 1 di bulan tsb: 0=Minggu..6=Sabtu */
export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}
