import { CalendarHeart, CheckCircle2, PartyPopper, TrendingUp, Users } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { EmployeeStatusList } from "@/components/admin/EmployeeStatusList";
import {
  formatIndonesianDate,
  getWitaNowParts,
  monthNameId,
  todayWitaDateString,
  toDateString,
} from "@/lib/time";

export default async function AdminRingkasanPage() {
  const today = todayWitaDateString();
  const { year, month, weekday } = getWitaNowParts();
  const monthStart = toDateString(year, month, 1);
  // weekday: 0 = Minggu ... 6 = Sabtu (lihat lib/time.ts)
  const isWeekend = weekday === 0 || weekday === 6;

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
  const filledToday = list.filter((e) => filledTodayIds.has(e.id));
  const notFilledToday = list.filter((e) => !filledTodayIds.has(e.id));
  const percentToday = list.length ? Math.round((filledToday.length / list.length) * 100) : 0;

  const { data: monthReports } = await supabaseAdmin
    .from("daily_reports")
    .select("id, activities:daily_report_activities(count)")
    .gte("report_date", monthStart)
    .lte("report_date", today);

  const totalActivities = (monthReports || []).reduce(
    (sum, r) => sum + Number(r.activities?.[0]?.count ?? 0),
    0
  );
  const avgActivitiesPerDay = monthReports?.length
    ? Math.round((totalActivities / monthReports.length) * 10) / 10
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
          label={isWeekend ? "Mengisi Hari Ini (Opsional)" : "Sudah Isi Hari Ini"}
          value={`${filledToday.length}/${list.length}`}
          sub={`${percentToday}%`}
        />
        <StatCard
          icon={TrendingUp}
          tone="orange"
          label={`Rata-rata Kegiatan/Hari ${monthNameId(month)}`}
          value={`${avgActivitiesPerDay}`}
        />
      </div>

      <div className="card-surface p-5">
        {isWeekend ? (
          <>
            <div className="mb-4 flex items-start gap-2.5">
              <CalendarHeart className="mt-0.5 size-5 shrink-0 text-brand-blue" />
              <div>
                <p className="font-heading font-bold text-slate-900">Akhir Pekan — Laporan Opsional</p>
                <p className="text-sm text-slate-500">
                  Hari ini {formatIndonesianDate(today).split(",")[0]}, pengisian laporan tidak
                  wajib. Beberapa pegawai tetap mengisi laporan jika bertugas hari ini —
                  {" "}
                  {filledToday.length} orang sejauh ini.
                </p>
              </div>
            </div>

            {filledToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarHeart className="size-9 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Belum ada yang mengisi laporan hari ini — wajar, ini akhir pekan.
                </p>
              </div>
            ) : (
              <EmployeeStatusList employees={filledToday} badgeLabel="Sudah isi" badgeTone="green" />
            )}
          </>
        ) : (
          <>
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
              <EmployeeStatusList employees={notFilledToday} badgeLabel="Belum isi" badgeTone="red" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
