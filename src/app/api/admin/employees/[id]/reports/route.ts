import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/admin/employees/:id/reports?year=YYYY&month=MM
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

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
    .select("*, activities:daily_report_activities(*)")
    .eq("user_id", id)
    .gte("report_date", start)
    .lte("report_date", end)
    .order("report_date", { ascending: true })
    .order("urutan", { referencedTable: "daily_report_activities", ascending: true });

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}
