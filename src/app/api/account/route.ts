import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { selfAccountUpdateSchema } from "@/lib/validation";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar";

// PUT /api/account -> pengguna (pegawai/admin) mengubah data akun sendiri:
// username, email, password (opsional). Admin juga boleh kirim full_name & photo.
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const raw = {
    username: String(form.get("username") || ""),
    email: String(form.get("email") || ""),
    password: String(form.get("password") || ""),
    full_name: form.get("full_name") ? String(form.get("full_name")) : undefined,
  };

  const parsed = selfAccountUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data tidak valid" },
      { status: 400 }
    );
  }

  const username = parsed.data.username.trim().toLowerCase();
  const email = parsed.data.email.trim().toLowerCase();

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .or(`username.eq.${username},email.eq.${email}`)
    .neq("id", session.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Username atau email sudah digunakan pengguna lain" },
      { status: 409 }
    );
  }

  const updates: Record<string, unknown> = { username, email };
  if (parsed.data.password) {
    updates.password_hash = await hashPassword(parsed.data.password);
  }
  if (parsed.data.full_name) {
    updates.full_name = parsed.data.full_name;
  }

  let oldPhotoUrl: string | null = null;
  const photoFile = form.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("photo_url")
      .eq("id", session.id)
      .maybeSingle();
    oldPhotoUrl = currentUser?.photo_url ?? null;

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
    .eq("id", session.id)
    .select("id, username, email, full_name, division, photo_url")
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }

  if (oldPhotoUrl) await deleteAvatar(oldPhotoUrl);

  return NextResponse.json({ user: data });
}
