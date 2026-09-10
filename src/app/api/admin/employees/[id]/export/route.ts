import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { EmployeeNotFoundError, generateMonthlyReportExcel } from "@/lib/exportReport";

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
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 1-12
  if (!year || !month) {
    return NextResponse.json({ error: "year & month wajib diisi" }, { status: 400 });
  }

  try {
    const { buffer, fileName } = await generateMonthlyReportExcel(id, year, month);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    if (e instanceof EmployeeNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengekspor laporan" }, { status: 500 });
  }
}
