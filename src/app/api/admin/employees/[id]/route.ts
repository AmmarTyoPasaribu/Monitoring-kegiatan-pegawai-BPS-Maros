import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { employeeUpdateSchema } from "@/lib/validation";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/employees/:id -> edit pegawai (multipart/form-data)
export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const form = await req.formData();
  const raw = {
    full_name: String(form.get("full_name") || ""),
    username: String(form.get("username") || "").trim().toLowerCase(),
    email: String(form.get("email") || "").trim().toLowerCase(),
    password: String(form.get("password") || ""),
    division: String(form.get("division") || ""),
  };

  const parsed = employeeUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data tidak valid" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .or(`username.eq.${parsed.data.username},email.eq.${parsed.data.email}`)
    .neq("id", id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "Username atau email sudah digunakan pegawai lain" },
      { status: 409 }
    );
  }

  const updates: Record<string, unknown> = {
    full_name: parsed.data.full_name,
    username: parsed.data.username,
    email: parsed.data.email,
    division: parsed.data.division || null,
  };

  if (parsed.data.password) {
    updates.password_hash = await hashPassword(parsed.data.password);
  }

  let oldPhotoUrl: string | null = null;
  const photoFile = form.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    const { data: currentEmployee } = await supabaseAdmin
      .from("users")
      .select("photo_url")
      .eq("id", id)
      .maybeSingle();
    oldPhotoUrl = currentEmployee?.photo_url ?? null;

    try {
      updates.photo_url = await uploadAvatar(photoFile);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Gagal mengunggah foto" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", id)
    .eq("role", "pegawai")
    .select("id, username, email, full_name, division, photo_url")
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal memperbarui pegawai" }, { status: 500 });
  }

  // Foto lama sudah tidak dipakai lagi -> hapus dari storage (best-effort).
  if (oldPhotoUrl) await deleteAvatar(oldPhotoUrl);

  return NextResponse.json({ employee: data });
}

// DELETE /api/admin/employees/:id -> hapus pegawai (cascade hapus laporan)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: employee } = await supabaseAdmin
    .from("users")
    .select("photo_url")
    .eq("id", id)
    .eq("role", "pegawai")
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", id)
    .eq("role", "pegawai");

  if (error) {
    return NextResponse.json({ error: "Gagal menghapus pegawai" }, { status: 500 });
  }

  // Pegawai sudah terhapus -> ikut hapus foto profilnya dari storage (best-effort).
  if (employee?.photo_url) await deleteAvatar(employee.photo_url);

  return NextResponse.json({ ok: true });
}
