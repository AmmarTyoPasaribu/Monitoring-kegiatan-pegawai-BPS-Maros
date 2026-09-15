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
-- 7. FUNGSI MONITORING PENYIMPANAN (dipakai halaman Admin > Penyimpanan)
-- Postgres tidak mengekspos ukuran database lewat REST API biasa, jadi
-- disediakan lewat fungsi SQL yang dipanggil via supabase.rpc(...).
-- =====================================================================
create or replace function public.get_database_size()
returns bigint
language sql
security definer
set search_path = public
as $$
  select pg_database_size(current_database());
$$;

-- v2: hitungan baris asli (COUNT(*)) per tabel, bukan lagi estimasi
-- reltuples (yang bisa basi/menunjukkan 0 kalau tabel belum sempat
-- di-ANALYZE otomatis oleh Postgres meski datanya ada). Tabel di aplikasi
-- ini kecil, jadi COUNT(*) asli tidak masalah dari sisi performa.
-- DROP dulu karena tipe kolom hasil (row_count vs row_estimate) berubah --
-- CREATE OR REPLACE tidak bisa mengubah signature return sebuah fungsi.
drop function if exists public.get_table_sizes();

create or replace function public.get_table_sizes()
returns table(table_name text, size_bytes bigint, row_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  cnt bigint;
begin
  for r in
    select c.relname::text as tname, pg_total_relation_size(c.oid) as sz
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by pg_total_relation_size(c.oid) desc
  loop
    execute format('select count(*) from public.%I', r.tname) into cnt;
    table_name := r.tname;
    size_bytes := r.sz;
    row_count := cnt;
    return next;
  end loop;
end;
$$;

-- =====================================================================
-- 8. KOLOM CATATAN ADMIN di laporan harian (feedback admin ke pegawai)
-- =====================================================================
alter table public.daily_reports
  add column if not exists admin_note text;

-- =====================================================================
-- 9. ROMBAK FORM LAPORAN HARIAN (sesuai format baru dari Kepala BPS)
-- Kolom lama (rencana_kinerja, kegiatan, target, realisasi, progress)
-- diganti struktur baru: capaian kinerja (kuantitas/kualitas/waktu),
-- rencana besok (daftar poin), dan tabel uraian kegiatan terpisah
-- (satu laporan harian bisa punya banyak baris kegiatan).
-- Catatan: jalankan bagian ini HANYA setelah data daily_reports lama
-- sudah dikosongkan, karena kolom lama langsung di-drop (data hilang).
-- =====================================================================
alter table public.daily_reports
  drop column if exists rencana_kinerja,
  drop column if exists kegiatan,
  drop column if exists target,
  drop column if exists realisasi,
  drop column if exists progress,
  add column if not exists capaian_kuantitas text not null default '',
  add column if not exists capaian_kualitas text not null default '',
  add column if not exists capaian_waktu text not null default '',
  add column if not exists rencana_besok text[] not null default '{}';

create table if not exists public.daily_report_activities (
  id               uuid primary key default gen_random_uuid(),
  report_id        uuid not null references public.daily_reports(id) on delete cascade,
  urutan           integer not null default 0,
  jam              text not null default '',
  uraian_tugas     text not null default '',
  output_target    text not null default '',
  status           text not null default '',
  link_dokumentasi text not null default '',
  created_at       timestamptz not null default now()
);

comment on table public.daily_report_activities is 'Baris-baris tabel "Uraian Kegiatan Hari Ini" milik satu daily_reports. link_dokumentasi diisi manual oleh pegawai (link Google Drive miliknya sendiri, di-share sebagai "Anyone with the link").';

create index if not exists idx_daily_report_activities_report_id
  on public.daily_report_activities (report_id);

alter table public.daily_report_activities enable row level security;
-- Tidak ada policy dibuat -> default deny all untuk role anon/authenticated,
-- sama seperti tabel lain. Akses hanya lewat backend (service role key).

-- =====================================================================
-- SELESAI. Verifikasi cepat:
-- select id, username, email, role, full_name from public.users;
-- select public.get_database_size();
-- select * from public.get_table_sizes();
-- =====================================================================
