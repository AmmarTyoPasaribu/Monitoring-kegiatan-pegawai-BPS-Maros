import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSessionToken,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username atau email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid" },
      { status: 400 }
    );
  }

  const { identifier, password } = parsed.data;
  const normalized = identifier.trim().toLowerCase();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, username, email, password_hash, full_name, role")
    .or(`username.eq.${normalized},email.eq.${normalized}`)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json(
      { error: "Username/email atau password salah" },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Username/email atau password salah" },
      { status: 401 }
    );
  }

  const token = await signSessionToken({
    id: user.id,
    role: user.role,
    full_name: user.full_name,
    username: user.username,
  });

  const res = NextResponse.json({
    role: user.role,
    redirectTo: user.role === "admin" ? "/admin/ringkasan" : "/dashboard/beranda",
  });

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return res;
}
