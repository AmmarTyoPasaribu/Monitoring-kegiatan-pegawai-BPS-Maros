import { z } from "zod";

export const dailyReportSchema = z.object({
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
  rencana_kinerja: z.string().min(1, "Rencana Kinerja wajib diisi"),
  kegiatan: z.string().min(1, "Kegiatan wajib diisi"),
  target: z.string().optional().default(""),
  realisasi: z.string().optional().default(""),
  progress: z.coerce.number().int().min(0).max(100).optional().default(0),
  kendala: z.string().optional().default(""),
  solusi: z.string().optional().default(""),
  keterangan: z.string().optional().default(""),
});

export const employeeCreateSchema = z.object({
  full_name: z.string().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, garis"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  division: z.string().optional(),
});

export const employeeUpdateSchema = z.object({
  full_name: z.string().min(1, "Nama wajib diisi"),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, garis"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6).optional().or(z.literal("")),
  division: z.string().optional(),
});

export const adminNoteSchema = z.object({
  note: z.string().max(2000, "Catatan maksimal 2000 karakter").optional().default(""),
});

export const selfAccountUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, garis"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6).optional().or(z.literal("")),
  full_name: z.string().min(1).optional(),
});
