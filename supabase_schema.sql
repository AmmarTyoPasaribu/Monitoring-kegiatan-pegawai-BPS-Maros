-- =====================================================================
-- Sistem Monitoring Kegiatan Pegawai BPS Kabupaten Maros
-- Jalankan seluruh script ini di Supabase SQL Editor (satu kali, di awal)
-- =====================================================================

-- Ekstensi yang dibutuhkan:
-- pgcrypto -> untuk gen_random_uuid() dan crypt()/gen_salt() (bcrypt-compatible)
create extension if not exists pgcrypto;

-- =====================================================================
-- 1. TABEL USERS (admin & pegawai)
-- =====================================================================
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  email         text not null unique,
  password_hash text not null,
  full_name     text not null,
  role          text not null check (role in ('admin', 'pegawai')),
  division      text,
  photo_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.users is 'Akun login (admin & pegawai). Auth custom via JWT, bukan Supabase Auth.';
comment on column public.users.password_hash is 'Bcrypt hash (dibuat via crypt() pgcrypto atau bcrypt di Node.js)';

-- =====================================================================
-- 2. TABEL DAILY_REPORTS (laporan harian pegawai)
-- =====================================================================
create table if not exists public.daily_reports (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  report_date      date not null,
  rencana_kinerja  text,
  kegiatan         text,
  target           text,
  realisasi        text,
  progress         smallint check (progress between 0 and 100),
  kendala          text,
  solusi           text,
  keterangan       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint daily_reports_user_date_unique unique (user_id, report_date)
);

comment on table public.daily_reports is 'Satu baris = satu laporan kinerja harian milik satu pegawai pada satu tanggal.';

create index if not exists idx_daily_reports_user_date
  on public.daily_reports (user_id, report_date desc);

-- =====================================================================
-- 3. TRIGGER: auto-update kolom updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_daily_reports_updated_at on public.daily_reports;
create trigger trg_daily_reports_updated_at
  before update on public.daily_reports
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. ROW LEVEL SECURITY
-- Semua akses aplikasi dilakukan lewat backend Next.js memakai
-- SUPABASE_SERVICE_ROLE_KEY (otomatis bypass RLS). RLS diaktifkan di sini
-- hanya sebagai proteksi tambahan agar anon/authenticated key TIDAK bisa
-- membaca/menulis apa pun langsung ke tabel ini.
-- =====================================================================
alter table public.users enable row level security;
alter table public.daily_reports enable row level security;
-- Tidak ada policy dibuat -> default deny all untuk role anon/authenticated.

-- =====================================================================
-- 5. STORAGE BUCKET untuk foto profil pegawai
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Bucket bersifat public agar foto bisa ditampilkan langsung via URL,
-- tapi upload/update/delete file tetap hanya lewat backend (service role
-- key otomatis bypass RLS storage). Policy berikut hanya mengizinkan
-- READ publik; tidak ada policy insert/update/delete untuk anon/authenticated.
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- =====================================================================
-- 6. SEED AKUN ADMIN DEFAULT
-- Password di-hash dengan bcrypt (via pgcrypto crypt + gen_salt('bf')),
-- hash ini kompatibel dan bisa diverifikasi dengan bcrypt/bcryptjs di Node.js.
-- =====================================================================
insert into public.users (username, email, password_hash, full_name, role, division)
values (
  'maradmin',
  'maradmin@gmail.com',
  crypt('maradmin123', gen_salt('bf')),
  'Admin BPS Kabupaten Maros',
  'admin',
  null
)
on conflict (username) do nothing;

-- =====================================================================
-- SELESAI. Verifikasi cepat:
-- select id, username, email, role, full_name from public.users;
-- =====================================================================
