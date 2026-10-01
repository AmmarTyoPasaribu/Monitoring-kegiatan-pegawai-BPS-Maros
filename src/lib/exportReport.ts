import "server-only";
import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/supabase";
import { daysInMonth, monthNameId } from "@/lib/time";
import type { DailyReport } from "@/types";

export type ExportMode = "per-date" | "per-activity";

const COLUMNS_PER_DATE = [
  { label: "Tanggal", width: 14 },
  { label: "A. Uraian Kegiatan Hari Ini", width: 45 },
  { label: "B.1 Kuantitas", width: 22 },
  { label: "B.2 Kualitas", width: 22 },
  { label: "B.3 Waktu", width: 22 },
  { label: "C. Kendala", width: 22 },
  { label: "C. Solusi", width: 22 },
  { label: "D. Rencana Besok", width: 28 },
  { label: "E. Keterangan", width: 22 },
];

const COLUMNS_PER_ACTIVITY = [
  { label: "Tanggal", width: 14 },
  { label: "Jam", width: 14 },
  { label: "Uraian Tugas", width: 32 },
  { label: "Output/Target", width: 26 },
  { label: "Status", width: 18 },
  { label: "Link Dokumentasi", width: 28 },
  { label: "B.1 Kuantitas", width: 22 },
  { label: "B.2 Kualitas", width: 22 },
  { label: "B.3 Waktu", width: 22 },
  { label: "C. Kendala", width: 22 },
  { label: "C. Solusi", width: 22 },
  { label: "D. Rencana Besok", width: 28 },
  { label: "E. Keterangan", width: 22 },
];

// Kolom-kolom ini (indeks 1-based) diisi sekali per tanggal lalu di-merge vertikal
// mengikuti jumlah baris kegiatan pada tanggal itu, di mode "per-activity".
const MERGE_COLUMNS_PER_ACTIVITY = [1, 7, 8, 9, 10, 11, 12, 13];

export class EmployeeNotFoundError extends Error {}

function formatActivities(report: DailyReport | undefined): string {
  if (!report?.activities?.length) return "";
  return report.activities
    .map((a) => {
      const parts = [a.jam, a.uraian_tugas].filter(Boolean).join(" - ");
      const extras = [
        a.output_target ? `Target: ${a.output_target}` : "",
        a.status ? `Status: ${a.status}` : "",
        a.link_dokumentasi ? `Dok: ${a.link_dokumentasi}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      return extras ? `${parts} (${extras})` : parts;
    })
    .join("\n");
}

function formatRencanaBesok(report: DailyReport | undefined): string {
  if (!report?.rencana_besok?.length) return "";
  return report.rencana_besok.map((r, i) => `${i + 1}. ${r}`).join("\n");
}

function makeUniqueSheetName(employeeName: string, usedSheetNames: Set<string>): string {
  let sheetName = employeeName.replace(/[[\]*/\\?:]/g, "").slice(0, 28) || "Laporan";
  let suffix = 2;
  while (usedSheetNames.has(sheetName)) {
    const base = employeeName.replace(/[[\]*/\\?:]/g, "").slice(0, 24) || "Laporan";
    sheetName = `${base} (${suffix})`;
    suffix++;
  }
  usedSheetNames.add(sheetName);
  return sheetName;
}

function addSheetHeader(
  sheet: ExcelJS.Worksheet,
  columns: { label: string; width: number }[],
  employeeName: string,
  year: number,
  month: number,
  totalDays: number
) {
  sheet.columns = columns.map((c) => ({ width: c.width }));

  const titleRow = sheet.addRow([
    "MONITORING TARGET DAN REALISASI KINERJA PEGAWAI BPS KABUPATEN MAROS",
  ]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, columns.length);
  titleRow.getCell(1).font = { bold: true };
  titleRow.getCell(1).alignment = { horizontal: "center" };
  titleRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFA9D08E" },
  };

  const infoRows: [string, string][] = [
    ["Nama Pegawai", employeeName],
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

  const headerRow = sheet.addRow(columns.map((c) => c.label));
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
}

/** Mode ringkas: satu baris per tanggal, kegiatan digabung jadi satu sel multi-baris. */
function addMonthlyReportSheetPerDate(
  workbook: ExcelJS.Workbook,
  employeeName: string,
  reports: DailyReport[],
  year: number,
  month: number,
  usedSheetNames: Set<string>
) {
  const totalDays = daysInMonth(year, month);
  const reportByDate = new Map<string, DailyReport>();
  for (const r of reports) reportByDate.set(r.report_date, r);

  const sheet = workbook.addWorksheet(makeUniqueSheetName(employeeName, usedSheetNames));
  addSheetHeader(sheet, COLUMNS_PER_DATE, employeeName, year, month, totalDays);

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const r = reportByDate.get(dateStr);
    const displayDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const row = sheet.addRow([
      displayDate,
      formatActivities(r),
      r?.capaian_kuantitas || "",
      r?.capaian_kualitas || "",
      r?.capaian_waktu || "",
      r?.kendala || "",
      r?.solusi || "",
      formatRencanaBesok(r),
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
}

/** Mode detail: satu baris per kegiatan; kolom tanggal & bagian B-E di-merge vertikal
 * mengikuti jumlah baris kegiatan pada tanggal tersebut. */
function addMonthlyReportSheetPerActivity(
  workbook: ExcelJS.Workbook,
  employeeName: string,
  reports: DailyReport[],
  year: number,
  month: number,
  usedSheetNames: Set<string>
) {
  const totalDays = daysInMonth(year, month);
  const reportByDate = new Map<string, DailyReport>();
  for (const r of reports) reportByDate.set(r.report_date, r);

  const sheet = workbook.addWorksheet(makeUniqueSheetName(employeeName, usedSheetNames));
  addSheetHeader(sheet, COLUMNS_PER_ACTIVITY, employeeName, year, month, totalDays);

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const r = reportByDate.get(dateStr);
    const displayDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    const activities = r?.activities?.length ? r.activities : [null];
    const rencanaBesok = formatRencanaBesok(r);

    const startRow = sheet.rowCount + 1;
    for (const a of activities) {
      sheet.addRow([
        displayDate,
        a?.jam || "",
        a?.uraian_tugas || "",
        a?.output_target || "",
        a?.status || "",
        a?.link_dokumentasi || "",
        r?.capaian_kuantitas || "",
        r?.capaian_kualitas || "",
        r?.capaian_waktu || "",
        r?.kendala || "",
        r?.solusi || "",
        rencanaBesok,
        r?.keterangan || "",
      ]);
    }
    const endRow = sheet.rowCount;

    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      sheet.getRow(rowNum).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment =
          colNumber === 1
            ? { vertical: "middle", horizontal: "center", wrapText: true }
            : { vertical: "top", wrapText: true };
      });
    }

    if (endRow > startRow) {
      for (const col of MERGE_COLUMNS_PER_ACTIVITY) {
        sheet.mergeCells(startRow, col, endRow, col);
      }
    }
  }
}

/** Generate buffer Excel rekap laporan bulanan seorang pegawai. */
export async function generateMonthlyReportExcel(
  userId: string,
  year: number,
  month: number,
  mode: ExportMode = "per-date"
) {
  const { data: employee, error: empError } = await supabaseAdmin
    .from("users")
    .select("full_name")
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
    .select("*, activities:daily_report_activities(*)")
    .eq("user_id", userId)
    .gte("report_date", start)
    .lte("report_date", end)
    .order("urutan", { referencedTable: "daily_report_activities", ascending: true });

  if (repError) {
    throw new Error("Gagal mengambil laporan");
  }

  const workbook = new ExcelJS.Workbook();
  const addSheet = mode === "per-activity" ? addMonthlyReportSheetPerActivity : addMonthlyReportSheetPerDate;
  addSheet(workbook, employee.full_name, reports || [], year, month, new Set());

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Laporan_${employee.full_name.replace(/[^a-z0-9]+/gi, "_")}_${monthNameId(
    month
  )}_${year}.xlsx`;

  return { buffer, fileName };
}

/** Generate satu workbook berisi rekap bulanan SEMUA pegawai (satu sheet per pegawai). */
export async function generateAllEmployeesMonthlyReportExcel(
  year: number,
  month: number,
  mode: ExportMode = "per-date"
) {
  const { data: employees, error: empError } = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .eq("role", "pegawai")
    .order("full_name", { ascending: true });

  if (empError) throw new Error("Gagal mengambil data pegawai");
  if (!employees || employees.length === 0) {
    throw new EmployeeNotFoundError("Belum ada data pegawai");
  }

  const totalDays = daysInMonth(year, month);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;

  // Satu query untuk semua laporan bulan ini, lalu dikelompokkan per pegawai di JS
  // (jauh lebih efisien daripada satu query per pegawai).
  const { data: allReports, error: repError } = await supabaseAdmin
    .from("daily_reports")
    .select("*, activities:daily_report_activities(*)")
    .gte("report_date", start)
    .lte("report_date", end)
    .order("urutan", { referencedTable: "daily_report_activities", ascending: true });

  if (repError) throw new Error("Gagal mengambil laporan");

  const reportsByUser = new Map<string, DailyReport[]>();
  for (const r of allReports || []) {
    const list = reportsByUser.get(r.user_id) || [];
    list.push(r);
    reportsByUser.set(r.user_id, list);
  }

  const workbook = new ExcelJS.Workbook();
  const addSheet = mode === "per-activity" ? addMonthlyReportSheetPerActivity : addMonthlyReportSheetPerDate;
  const usedSheetNames = new Set<string>();
  for (const emp of employees) {
    addSheet(workbook, emp.full_name, reportsByUser.get(emp.id) || [], year, month, usedSheetNames);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Rekap_Semua_Pegawai_${monthNameId(month)}_${year}.xlsx`;

  return { buffer, fileName };
}
