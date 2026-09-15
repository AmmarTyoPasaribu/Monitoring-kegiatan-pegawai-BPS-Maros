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

export interface DailyReportActivity {
  id?: string;
  jam: string;
  uraian_tugas: string;
  output_target: string;
  status: string;
  link_dokumentasi: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string; // YYYY-MM-DD
  capaian_kuantitas: string | null;
  capaian_kualitas: string | null;
  capaian_waktu: string | null;
  kendala: string | null;
  solusi: string | null;
  rencana_besok: string[] | null;
  keterangan: string | null;
  admin_note: string | null;
  activities: DailyReportActivity[];
  created_at: string;
  updated_at: string;
}

export interface DailyReportInput {
  capaian_kuantitas: string;
  capaian_kualitas: string;
  capaian_waktu: string;
  kendala: string;
  solusi: string;
  rencana_besok: string[];
  keterangan: string;
  activities: DailyReportActivity[];
}

export interface SessionPayload {
  id: string;
  role: Role;
  full_name: string;
  username: string;
}
