import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { dailyReportSchema } from "@/lib/validation";
import { isFutureWitaDate, todayWitaDateString } from "@/lib/time";

const REPORT_SELECT = "*, activities:daily_report_activities(*)";

// GET /api/reports?year=YYYY&month=MM -> daftar laporan milik pegawai yang login, bulan tsb
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "pegawai") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  if (!year || !month) {
    return NextResponse.json({ error: "year & month wajib diisi" }, { status: 400 });
  }

  const start = `${year}-${month.padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const end = `${year}-${month.padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select(REPORT_SELECT)
    .eq("user_id", session.id)
    .gte("report_date", start)
    .lte("report_date", end)
    .order("report_date", { ascending: true })
    .order("urutan", { referencedTable: "daily_report_activities", ascending: true });

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

// POST /api/reports -> upsert laporan milik pegawai yang login untuk report_date tertentu,
// beserta baris-baris tabel "Uraian Kegiatan Hari Ini" (ganti-semua/replace-all per simpan).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "pegawai") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = dailyReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data tidak valid" },
      { status: 400 }
    );
  }

  const { report_date, activities, rencana_besok, ...rest } = parsed.data;

  if (isFutureWitaDate(report_date)) {
    return NextResponse.json(
      { error: "Tidak bisa mengisi laporan untuk tanggal yang belum terjadi" },
      { status: 400 }
    );
  }
  if (report_date > todayWitaDateString()) {
    return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
  }

  const cleanedRencanaBesok = rencana_besok.map((r) => r.trim()).filter(Boolean);

  const { data: report, error } = await supabaseAdmin
    .from("daily_reports")
    .upsert(
      {
        ...rest,
        rencana_besok: cleanedRencanaBesok,
        report_date,
        user_id: session.id,
      },
      { onConflict: "user_id,report_date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan laporan" }, { status: 500 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("daily_report_activities")
    .delete()
    .eq("report_id", report.id);

  if (deleteError) {
    return NextResponse.json({ error: "Gagal menyimpan uraian kegiatan" }, { status: 500 });
  }

  const cleanedActivities = activities.filter((a) => a.uraian_tugas.trim().length > 0);

  if (cleanedActivities.length > 0) {
    const { error: insertError } = await supabaseAdmin.from("daily_report_activities").insert(
      cleanedActivities.map((a, idx) => ({
        report_id: report.id,
        urutan: idx,
        jam: a.jam,
        uraian_tugas: a.uraian_tugas,
        output_target: a.output_target,
        status: a.status,
        link_dokumentasi: a.link_dokumentasi,
      }))
    );

    if (insertError) {
      return NextResponse.json({ error: "Gagal menyimpan uraian kegiatan" }, { status: 500 });
    }
  }

  const { data: fullReport, error: refetchError } = await supabaseAdmin
    .from("daily_reports")
    .select(REPORT_SELECT)
    .eq("id", report.id)
    .order("urutan", { referencedTable: "daily_report_activities", ascending: true })
    .single();

  if (refetchError) {
    return NextResponse.json({ error: "Gagal mengambil laporan tersimpan" }, { status: 500 });
  }

  return NextResponse.json({ report: fullReport });
}
