import "server-only";
import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/supabase";
import { daysInMonth, monthNameId } from "@/lib/time";
import type { DailyReport } from "@/types";

const COLUMNS = [
  { label: "Tanggal", width: 14 },
  { label: "Rencana Kinerja", width: 26 },
  { label: "Kegiatan", width: 26 },
  { label: "Target", width: 18 },
  { label: "Realisasi", width: 18 },
  { label: "Progress ( %)", width: 14 },
  { label: "Kendala", width: 22 },
  { label: "Solusi", width: 22 },
  { label: "Keterangan", width: 22 },
];

export class EmployeeNotFoundError extends Error {}

/** Generate buffer Excel rekap laporan bulanan seorang pegawai. */
export async function generateMonthlyReportExcel(userId: string, year: number, month: number) {
  const { data: employee, error: empError } = await supabaseAdmin
    .from("users")
    .select("full_name, division")
    .eq("id", userId)
    .eq("role", "pegawai")
    .maybeSingle();

  if (empError || !employee) {
    throw new EmployeeNotFoundError("Pegawai tidak ditemukan");
  }

  const totalDays = daysInMonth(year, month);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;

  const { data: reports, error: repError } = await supabaseAdmin
    .from("daily_reports")
    .select("*")
    .eq("user_id", userId)
    .gte("report_date", start)
    .lte("report_date", end);

  if (repError) {
    throw new Error("Gagal mengambil laporan");
  }

  const reportByDate = new Map<string, DailyReport>();
  for (const r of reports || []) reportByDate.set(r.report_date, r);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(employee.full_name.slice(0, 28) || "Laporan");
  sheet.columns = COLUMNS.map((c) => ({ width: c.width }));

  const titleRow = sheet.addRow([
    "MONITORING TARGET DAN REALISASI KINERJA PEGAWAI BPS KABUPATEN MAROS",
  ]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, COLUMNS.length);
  titleRow.getCell(1).font = { bold: true };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFA9D08E" },
  };

  const infoRows: [string, string][] = [
    ["Nama Pegawai", employee.full_name],
    ["Tahun", String(year)],
    ["Periode", `1 - ${totalDays} ${monthNameId(month)} ${year}`],
    ["Wilayah", "Maros"],
    ["Unit Kerja", "BPS Kabupaten/Kota"],
  ];
  for (const [label, value] of infoRows) {
    const row = sheet.addRow([label, `: ${value}`]);
    row.getCell(1).font = { bold: true };
  }

  sheet.addRow([]);

  const headerRow = sheet.addRow(COLUMNS.map((c) => c.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2EFDA" },
    };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const r = reportByDate.get(dateStr);
    const displayDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const row = sheet.addRow([
      displayDate,
      r?.rencana_kinerja || "",
      r?.kegiatan || "",
      r?.target || "",
      r?.realisasi || "",
      r?.progress ?? "",
      r?.kendala || "",
      r?.solusi || "",
      r?.keterangan || "",
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "top", wrapText: true };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Laporan_${employee.full_name.replace(/[^a-z0-9]+/gi, "_")}_${monthNameId(
    month
  )}_${year}.xlsx`;

  return { buffer, fileName };
}
