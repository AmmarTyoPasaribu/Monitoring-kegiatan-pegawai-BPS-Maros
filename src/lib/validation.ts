import { z } from "zod";

export const dailyReportActivitySchema = z.object({
  jam: z.string().optional().default(""),
  uraian_tugas: z.string().optional().default(""),
  output_target: z.string().optional().default(""),
  status: z.string().optional().default(""),
  link_dokumentasi: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), {
      message: "Link dokumentasi harus berupa URL yang valid (diawali http:// atau https://)",
    }),
});

export const dailyReportSchema = z
  .object({
    report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid"),
    capaian_kuantitas: z.string().optional().default(""),
    capaian_kualitas: z.string().optional().default(""),
    capaian_waktu: z.string().optional().default(""),
    kendala: z.string().optional().default(""),
    solusi: z.string().optional().default(""),
    rencana_besok: z.array(z.string()).optional().default([]),
    keterangan: z.string().optional().default(""),
    activities: z.array(dailyReportActivitySchema).optional().default([]),
  })
  .refine((data) => data.activities.some((a) => a.uraian_tugas.trim().length > 0), {
    message: "Minimal satu baris Uraian Tugas pada Uraian Kegiatan Hari Ini wajib diisi",
    path: ["activities"],
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
