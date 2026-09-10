import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { employeeCreateSchema } from "@/lib/validation";
import { uploadAvatar } from "@/lib/avatar";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// GET /api/admin/employees -> daftar semua pegawai
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, email, full_name, division, photo_url, created_at")
    .eq("role", "pegawai")
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
  return NextResponse.json({ employees: data });
}

// POST /api/admin/employees -> tambah pegawai baru (multipart/form-data)
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const raw = {
    full_name: String(form.get("full_name") || ""),
    username: String(form.get("username") || "").trim().toLowerCase(),
    email: String(form.get("email") || "").trim().toLowerCase(),
    password: String(form.get("password") || ""),
    division: String(form.get("division") || ""),
  };

  const parsed = employeeCreateSchema.safeParse(raw);
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
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "Username atau email sudah digunakan" },
      { status: 409 }
    );
  }

  let photo_url: string | null = null;
  const photoFile = form.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photo_url = await uploadAvatar(photoFile);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Gagal mengunggah foto" },
        { status: 400 }
      );
    }
  }

  const password_hash = await hashPassword(parsed.data.password);

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      full_name: parsed.data.full_name,
      username: parsed.data.username,
      email: parsed.data.email,
      password_hash,
      division: parsed.data.division || null,
      photo_url,
      role: "pegawai",
    })
    .select("id, username, email, full_name, division, photo_url")
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal menambah pegawai" }, { status: 500 });
  }

  return NextResponse.json({ employee: data }, { status: 201 });
}
