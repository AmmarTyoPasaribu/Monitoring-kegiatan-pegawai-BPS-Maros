import Link from "next/link";
import { CheckCircle2, PartyPopper, TrendingUp, Users } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  formatIndonesianDate,
  getWitaNowParts,
  monthNameId,
  todayWitaDateString,
  toDateString,
} from "@/lib/time";

export default async function AdminRingkasanPage() {
  const today = todayWitaDateString();
  const { year, month } = getWitaNowParts();
  const monthStart = toDateString(year, month, 1);

  const { data: employees } = await supabaseAdmin
    .from("users")
    .select("id, full_name, division, photo_url")
    .eq("role", "pegawai")
    .order("full_name", { ascending: true });

  const list = employees || [];

  const { data: todaysReports } = await supabaseAdmin
    .from("daily_reports")
    .select("user_id")
    .eq("report_date", today);

  const filledTodayIds = new Set((todaysReports || []).map((r) => r.user_id));
  const filledCount = list.filter((e) => filledTodayIds.has(e.id)).length;
  const notFilledToday = list.filter((e) => !filledTodayIds.has(e.id));
  const percentToday = list.length ? Math.round((filledCount / list.length) * 100) : 0;

  const { data: monthReports } = await supabaseAdmin
    .from("daily_reports")
    .select("progress")
    .gte("report_date", monthStart)
    .lte("report_date", today);

  const progressValues = (monthReports || []).map((r) => r.progress ?? 0);
  const avgProgress = progressValues.length
    ? Math.round(progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length)
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard"
        description={`Ringkasan aktivitas pegawai BPS Kabupaten Maros — ${formatIndonesianDate(today)}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} tone="blue" label="Total Pegawai" value={String(list.length)} />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          label="Sudah Isi Hari Ini"
          value={`${filledCount}/${list.length}`}
          sub={`${percentToday}%`}
        />
        <StatCard
          icon={TrendingUp}
          tone="orange"
          label={`Rata-rata Progress ${monthNameId(month)}`}
          value={`${avgProgress}%`}
        />
      </div>

      <div className="card-surface p-5">
        <div className="mb-4">
          <p className="font-heading font-bold text-slate-900">Belum Mengisi Hari Ini</p>
          <p className="text-sm text-slate-500">
            {notFilledToday.length === 0
              ? "Semua pegawai sudah melapor hari ini."
              : `${notFilledToday.length} pegawai belum mengisi laporan kegiatan hari ini.`}
          </p>
        </div>

        {notFilledToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <PartyPopper className="size-9 text-brand-green" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Semua pegawai sudah lapor hari ini! 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notFilledToday.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 py-3">
                <Avatar src={emp.photo_url} name={emp.full_name} className="size-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{emp.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{emp.division || "-"}</p>
                </div>
                <Badge tone="red" className="shrink-0">
                  Belum isi
                </Badge>
                <Link
                  href={`/admin/kegiatan-pegawai?pegawai=${emp.id}`}
                  className="shrink-0 text-xs font-semibold text-brand-blue hover:text-brand-blue-dark"
                >
                  Lihat
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
