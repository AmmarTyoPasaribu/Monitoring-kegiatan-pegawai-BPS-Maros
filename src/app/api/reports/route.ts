import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { dailyReportSchema } from "@/lib/validation";
import { isFutureWitaDate, todayWitaDateString } from "@/lib/time";

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
    .select("*")
    .eq("user_id", session.id)
    .gte("report_date", start)
    .lte("report_date", end)
    .order("report_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

// POST /api/reports -> upsert laporan milik pegawai yang login untuk report_date tertentu
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

  const { report_date } = parsed.data;

  if (isFutureWitaDate(report_date)) {
    return NextResponse.json(
      { error: "Tidak bisa mengisi laporan untuk tanggal yang belum terjadi" },
      { status: 400 }
    );
  }
  if (report_date > todayWitaDateString()) {
    return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .upsert(
      { ...parsed.data, user_id: session.id },
      { onConflict: "user_id,report_date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal menyimpan laporan" }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
