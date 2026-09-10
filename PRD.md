# PRD — Sistem Monitoring Kegiatan Pegawai BPS Kabupaten Maros

**Versi:** 1.0
**Tanggal:** 9 September 2026
**Status:** Draft untuk disepakati sebelum development dimulai

---

## 1. Ringkasan

Aplikasi web internal untuk BPS Kabupaten Maros yang digunakan untuk memonitor kegiatan harian pegawai. Setiap pegawai mengisi laporan kinerja harian (rencana, kegiatan, target, realisasi, progress, kendala, solusi, keterangan). Kepala BPS (admin) dapat memantau seluruh pegawai, mengelola data pegawai, melihat riwayat kegiatan tiap pegawai per tanggal, dan mengekspor rekap bulanan ke Excel.

Referensi visual/UX diambil dari aplikasi `monev.maganghub.kemnaker.go.id` (screenshot pada folder `img/`), disesuaikan dengan kebutuhan field dan alur BPS Maros — **bukan direplikasi 1:1** (tidak ada fitur approval/lokasi GPS di versi ini, lihat bagian Out of Scope).

---

## 2. Peran Pengguna

| Role | Dipegang oleh | Akses |
|---|---|---|
| `pegawai` | Semua pegawai BPS Maros | Dashboard pegawai: isi & lihat laporan harian miliknya sendiri |
| `admin` | Kepala BPS Maros (1 akun) | Dashboard admin: kelola pegawai, pantau seluruh laporan, export Excel |

Tidak ada halaman sign up. Akun hanya dibuat oleh admin (untuk pegawai) atau di-seed langsung ke database (untuk admin pertama).

---

## 3. Arsitektur Teknis

| Layer | Pilihan |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js Route Handlers (`/app/api/**`), serverless, jadi satu deployment dengan frontend di Vercel |
| Database | Supabase Postgres |
| Storage foto | Supabase Storage (bucket `avatars`) |
| Auth | Custom JWT (bukan Supabase Auth) — cek username/email + password ke tabel `users` sendiri |
| Hashing password | bcrypt |
| Toast | `sonner` (atau setara) |
| Export Excel | `exceljs` (dijalankan di API route, generate `.xlsx` sesuai format existing) |
| Timezone | WITA (UTC+8) — disimpan UTC di DB, dikonversi ke WITA di semua tampilan & logika "hari ini" |

**Prinsip keamanan penting:** Semua akses ke Supabase (baca/tulis) dilakukan **hanya dari server** (Route Handlers) memakai **service role key**, bukan dari client. Client tidak pernah bicara langsung ke Supabase. JWT disimpan sebagai **httpOnly secure cookie**, diverifikasi di setiap request API lewat middleware. Ini menghindari kebutuhan RLS berbasis `auth.uid()` Supabase (yang tidak relevan karena kita tidak pakai Supabase Auth) — otorisasi sepenuhnya dikontrol di layer API Next.js.

---

## 4. Skema Database (Supabase Postgres)

### Tabel `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid, PK | default `gen_random_uuid()` |
| `username` | text, unique, not null | login |
| `email` | text, unique, not null | login |
| `password_hash` | text, not null | bcrypt hash |
| `full_name` | text, not null | nama pegawai |
| `role` | text, not null | `'admin'` \| `'pegawai'` |
| `division` | text, nullable | diisi bebas oleh admin (khusus role pegawai) |
| `photo_url` | text, nullable | URL publik dari Supabase Storage |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()` |

### Tabel `daily_reports`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid, PK | default `gen_random_uuid()` |
| `user_id` | uuid, FK → `users.id` (cascade delete) | pemilik laporan |
| `report_date` | date, not null | tanggal laporan (berdasarkan kalender WITA) |
| `rencana_kinerja` | text | |
| `kegiatan` | text | |
| `target` | text | |
| `realisasi` | text | |
| `progress` | smallint, 0–100 | |
| `kendala` | text | |
| `solusi` | text | |
| `keterangan` | text | |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | update setiap edit |

**Constraint:** `UNIQUE (user_id, report_date)` — satu pegawai hanya punya satu laporan per tanggal (isi pertama = create, isi ulang = update/edit).

---

## 5. Autentikasi

- **Login:** input `identifier` (username atau email) + `password`.
  API mencocokkan ke `users.username` atau `users.email`, lalu `bcrypt.compare` ke `password_hash`.
- Jika cocok → generate JWT (payload: `id`, `role`, `full_name`) → set sebagai httpOnly cookie → redirect:
  - `role = pegawai` → `/dashboard/beranda`
  - `role = admin` → `/admin/pegawai`
- Jika tidak cocok → toast error "Username/email atau password salah", tanpa modal konfirmasi (bukan aksi destruktif).
- **Logout:** tombol di header, dengan **modal konfirmasi** ("Yakin ingin keluar?") → hapus cookie → toast → redirect ke `/login`.
- Middleware Next.js melindungi semua route `/dashboard/**` (khusus pegawai) dan `/admin/**` (khusus admin); role salah → redirect ke halaman masing-masing atau 403.

---

## 6. Halaman Pegawai

Dua halaman utama, dengan bottom navigation mobile-friendly (2 item: Beranda, Riwayat) + tombol logout di header.

### 6.1 Beranda (`/dashboard/beranda`)

Meniru struktur `image.png` / `image copy 4.png`, disederhanakan:

- Header: "Halo, {nama pegawai} 👋", `{Divisi} · BPS Kabupaten Maros`, foto profil bulat kanan atas.
- Card "Hari Ini": tanggal hari ini (format Indonesia, WITA), badge "Aktif".
- Status pengisian laporan hari ini:
  - **Belum diisi** → ikon clipboard biru, teks "Laporan hari ini belum diisi", tombol biru **"Isi Laporan Hari Ini"**.
  - **Sudah diisi** → ikon clipboard hijau (centang), teks "Laporan hari ini sudah diisi", tombol hijau **"Lihat Laporan Hari Ini"**.
- Tombol tersebut menavigasikan ke halaman **Riwayat**, dengan tanggal hari ini otomatis terpilih dan detail/form-nya langsung terbuka di bawah kalender.
- Jam berjalan kecil di bawah (opsional, live clock WITA) — nice-to-have, bukan wajib.

### 6.2 Riwayat Kegiatan (`/dashboard/riwayat`)

Meniru struktur `image copy.png`:

- Navigasi periode: **periode = satu bulan kalender** (tanggal 1 s.d. akhir bulan), dengan tombol `<` `>` untuk pindah bulan. Pegawai boleh melihat bulan-bulan sebelumnya (read-only untuk bulan lalu — lihat aturan klik di bawah), tapi tidak bisa maju ke bulan yang seluruhnya di masa depan.
- Grid kalender (Sen–Min) menampilkan tiap tanggal dalam bulan tsb dengan indikator kecil di bawah angka:
  - ✅ centang hijau = laporan sudah diisi
  - ▢ kotak outline kosong = tanggal sudah lewat tapi belum diisi
  - Tanggal di masa depan (setelah hari ini WITA): tampil pudar/disabled, **tidak bisa diklik**.
- Klik tanggal (hari ini atau tanggal lampau) → di bawah kalender muncul panel:
  - Jika **belum ada laporan** → form kosong untuk diisi.
  - Jika **sudah ada laporan** → tampilkan datanya (read-only view) + tombol **"Edit"** yang membuka form terisi untuk diubah (sesuai keputusan: laporan boleh diedit kapan saja, tidak dikunci).
- **Form Laporan Harian** — field persis sesuai format Excel (`image copy 3.png`):

  | Field | Tipe input |
  |---|---|
  | Rencana Kinerja | textarea |
  | Kegiatan | textarea |
  | Target | text |
  | Realisasi | text |
  | Progress (%) | number, 0–100 |
  | Kendala | textarea |
  | Solusi | textarea |
  | Keterangan | textarea |

- Submit (isi baru) atau Simpan Perubahan (edit) → **modal konfirmasi** → toast sukses → panel berubah ke tampilan read-only terbaru, ikon kalender tanggal tsb berubah jadi ✅.

---

## 7. Halaman Admin

Layout dengan **sidebar kiri** (menu: Daftar Pegawai, Kelola Pegawai, Kegiatan Pegawai, Logout), responsive (sidebar collapse jadi drawer/hamburger di mobile).

### 7.1 Daftar Pegawai (`/admin/pegawai`)

- Grid card, tiap card: foto profil, nama pegawai, divisi. Read-only, bisa untuk searching/filter cepat.

### 7.2 Kelola Pegawai (`/admin/kelola-pegawai`)

- Tabel: Nama, Username, Email, Divisi, kolom Aksi (Edit, Hapus) di tiap baris.
- Tombol **"+ Tambah Pegawai"** di atas tabel → modal form: Nama, Username, Email, Password, Divisi (input teks bebas), Upload Foto (preview sebelum simpan) → validasi (email format, username/email unik, password min. 6 karakter, foto max 2MB jpg/png) → **modal konfirmasi tidak diperlukan untuk tambah** (submit form = aksi utama, cukup toast sukses), namun tetap tampilkan toast error jika gagal (misal username sudah dipakai).
- Tombol **Edit** → modal form sama (password kosong = tidak diubah) → toast sukses.
- Tombol **Hapus** → **modal konfirmasi** ("Yakin hapus {nama}? Seluruh riwayat laporannya juga akan terhapus.") → toast sukses. Menghapus user akan cascade delete `daily_reports` miliknya.

### 7.3 Kegiatan Pegawai (`/admin/kegiatan-pegawai`)

- Dropdown untuk memilih pegawai dari daftar di database.
- Setelah dipilih → tampil kalender bulanan (sama seperti punya pegawai, dengan navigasi bulan `<` `>`) menampilkan status per tanggal (✅/▢), read-only.
- Klik tanggal manapun (termasuk yang sudah lewat) → tampil detail isian laporan pegawai tsb di bawah kalender (read-only, admin tidak mengedit).
- Tombol **"Export to Excel"**: memilih bulan (default = bulan kalender yang sedang ditampilkan) → generate file `.xlsx` untuk pegawai terpilih, periode 1 s.d. akhir bulan tsb, dengan format **identik dengan Google Sheet existing** (`image copy 3.png`):

  ```
  MONITORING TARGET DAN REALISASI KINERJA PEGAWAI BPS KABUPATEN MAROS
  Nama Pegawai : {full_name}
  Tahun        : {tahun}
  Periode      : {1 - akhir_bulan} {nama_bulan} {tahun}
  Wilayah      : Maros
  Unit Kerja   : BPS Kabupaten/Kota

  | Tanggal | Rencana Kinerja | Kegiatan | Target | Realisasi | Progress (%) | Kendala | Solusi | Keterangan |
  ```

  Baris tanggal yang tidak ada laporannya tetap ditampilkan (kosong), sesuai template asli. File diunduh langsung ke browser admin.

---

## 8. Komponen UI Global (berlaku di semua halaman)

- **Modal konfirmasi** wajib untuk aksi penting berikut: Logout, Hapus Pegawai, Submit Laporan Harian (baru), Simpan Perubahan Laporan (edit). Pola: modal muncul → tombol "Batal" (abu) dan tombol aksi (warna sesuai konteks: merah untuk hapus, biru/hijau untuk simpan).
- **Toast** muncul setelah setiap aksi penting selesai (berhasil = hijau, gagal = merah): login gagal, submit laporan, edit laporan, tambah pegawai, edit pegawai, hapus pegawai, export excel.
- Desain UI: mengikuti gaya referensi (card putih bersih, aksen biru/hijau, badge status, ikon outline) tapi dirapikan dengan skill UI/UX yang tersedia — dibangun mobile-first, tetap nyaman di desktop (khususnya dashboard admin dengan sidebar).

---

## 9. Akun Default (Seed)

Dibuat lewat seed script saat setup database:

| Field | Nilai |
|---|---|
| Role | admin |
| Nama | Admin BPS Maros *(bisa disesuaikan)* |
| Username | `maradmin` |
| Email | `maradmin@gmail.com` |
| Password | `maradmin123` (di-hash bcrypt sebelum disimpan) |

---

## 10. Environment Variables

| Variable | Keterangan |
|---|---|
| `SUPABASE_URL` | `https://ydstfvxxejiixyomxpbh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | dipakai **hanya di server** (Route Handlers), tidak pernah dikirim ke client |
| `JWT_SECRET` | secret untuk sign/verify JWT, digenerate acak saat setup |

> Catatan: `anon key` yang diberikan tidak digunakan karena semua akses Supabase dilakukan dari server dengan service role key.

---

## 11. Out of Scope (versi ini)

- Tidak ada approval/reject laporan oleh admin (admin hanya memantau & export).
- Tidak ada absensi berbasis lokasi/GPS.
- Tidak ada sign up mandiri / lupa password self-service (reset password hanya lewat admin via modal edit).
- Tidak ada multi-admin / manajemen role admin lain.
- Tidak ada notifikasi email/push.
- Tidak ada master data "Divisi" terpisah — divisi adalah teks bebas per pegawai.

---

## 12. Asumsi yang Diambil (mohon dikoreksi jika salah)

1. "Isi absen" = mengisi form laporan harian itu sendiri (tidak ada status kehadiran terpisah seperti Hadir/Izin/Sakit).
2. Satu bulan kalender = satu "periode", sama untuk tampilan pegawai maupun export admin (bukan periode magang custom seperti di aplikasi referensi).
3. Field Target & Realisasi disimpan sebagai teks bebas (bukan angka), mengikuti kolom kosong di template Excel asli.
4. Tanggal "hari ini" ditentukan berdasarkan zona waktu WITA (UTC+8) di server, bukan waktu lokal browser pengguna.
5. Foto profil disimpan di bucket publik Supabase Storage (URL bisa diakses langsung untuk ditampilkan sebagai `<img>`), upload/hapus file tetap dikontrol lewat API server.

---

## 13. Rencana Pengerjaan Bertahap

1. Setup project Next.js + Tailwind + koneksi Supabase (service role) + seed database (tabel `users`, `daily_reports`, akun admin default).
2. Auth: login page, JWT issuing, middleware proteksi route, logout.
3. Dashboard Pegawai: Beranda + Riwayat (kalender, form isi/edit laporan, modal & toast).
4. Dashboard Admin: layout sidebar, Daftar Pegawai, Kelola Pegawai (CRUD + upload foto).
5. Admin: Kegiatan Pegawai (kalender per pegawai + detail) + Export Excel.
6. Polish responsive/mobile, review UI akhir, testing menyeluruh alur end-to-end.
7. Deploy ke Vercel (set environment variables di project settings Vercel).
