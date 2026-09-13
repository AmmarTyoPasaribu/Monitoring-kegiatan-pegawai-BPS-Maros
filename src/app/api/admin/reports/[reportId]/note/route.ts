import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { adminNoteSchema } from "@/lib/validation";

// PUT /api/admin/reports/:reportId/note -> admin menulis/mengubah catatan pada satu laporan pegawai
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { reportId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = adminNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data tidak valid" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .update({ admin_note: parsed.data.note || null })
    .eq("id", reportId)
    .select()
    .single();

  if (error) {
    // Kolom admin_note belum dibuat -> arahkan admin untuk menjalankan migrasi SQL.
    // PGRST204 = PostgREST tidak menemukan kolom di schema cache-nya.
    if (error.code === "42703" || error.code === "PGRST204") {
      return NextResponse.json(
        {
          error:
            "Fitur catatan belum aktif: kolom 'admin_note' belum ada di database. Jalankan bagian terbaru supabase_schema.sql (bagian 8) di Supabase SQL Editor, lalu coba lagi.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan catatan" }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
