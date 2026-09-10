# Monitoring-kegiatan-pegawai-BPS-Maros

Aplikasi web untuk memonitor kegiatan harian pegawai BPS Kabupaten Maros.
Dibangun dengan **Next.js 16 (App Router)**, **Supabase** (Postgres + Storage),
dan autentikasi JWT custom. Siap di-deploy ke **Vercel**.

## Fitur

- **Login** dengan username atau email + password (tanpa Supabase Auth, JWT httpOnly cookie).
- **Role Pegawai**: isi laporan kegiatan harian, lihat riwayat per bulan (kalender),
  ubah akun sendiri (username/email/password), dan export laporan bulanannya ke Excel.
- **Role Admin (Kepala BPS)**: sidebar dengan Daftar Pegawai (indikator status isi kegiatan
  hari ini + sort), Kelola Pegawai (CRUD + upload foto), Kegiatan Pegawai (pantau per tanggal
  + export Excel per bulan), dan ubah profil sendiri (nama/username/email/password/foto).
- Semua tombol penting pakai modal konfirmasi + toast. Zona waktu **WITA (UTC+8)**.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Environment Variables

Buat file `.env.local` (lihat contoh di `env.vercel`):

| Variable | Keterangan |
|---|---|
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **hanya dipakai di server** |
| `JWT_SECRET` | Secret acak untuk sign/verify JWT sesi login |

## Setup Database

Jalankan seluruh isi `supabase_schema.sql` di Supabase SQL Editor (sekali di awal).
Script ini membuat tabel `users` & `daily_reports`, trigger, RLS, bucket storage `avatars`,
dan akun admin default.

## Deploy ke Vercel

1. Import repo ini di Vercel (framework otomatis terdeteksi: Next.js).
2. Di **Settings → Environment Variables**, import file `env.vercel` (atau isi manual
   ketiga variable di atas).
3. Deploy.
