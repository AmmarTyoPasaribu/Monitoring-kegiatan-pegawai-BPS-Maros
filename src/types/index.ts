export type Role = "admin" | "pegawai";

export interface AppUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  division: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string; // YYYY-MM-DD
  rencana_kinerja: string | null;
  kegiatan: string | null;
  target: string | null;
  realisasi: string | null;
  progress: number | null;
  kendala: string | null;
  solusi: string | null;
  keterangan: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyReportInput {
  rencana_kinerja: string;
  kegiatan: string;
  target: string;
  realisasi: string;
  progress: number;
  kendala: string;
  solusi: string;
  keterangan: string;
}

export interface SessionPayload {
  id: string;
  role: Role;
  full_name: string;
  username: string;
}
