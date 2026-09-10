import Link from "next/link";
import { ClipboardCheck, ClipboardEdit, CalendarDays, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { ProfileAvatarButton } from "@/components/pegawai/ProfileAvatarButton";
import { formatIndonesianDate, todayWitaDateString } from "@/lib/time";

export default async function BerandaPage() {
  const session = await getSession();
  const today = todayWitaDateString();

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("full_name, division, photo_url, username, email")
    .eq("id", session!.id)
    .maybeSingle();

  const { data: report } = await supabaseAdmin
    .from("daily_reports")
    .select("id")
    .eq("user_id", session!.id)
    .eq("report_date", today)
    .maybeSingle();

  const filled = Boolean(report);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProfileAvatarButton
            photoUrl={user?.photo_url}
            fullName={user?.full_name || session!.full_name}
            username={user?.username || session!.username}
            email={user?.email || ""}
          />
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold text-slate-900">
              Halo, {user?.full_name?.split(" ")[0] || session!.full_name} 👋
            </p>
            <p className="truncate text-sm text-slate-500">
              {user?.division ? `${user.division} · ` : ""}BPS Kabupaten Maros
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="card-surface relative overflow-hidden p-5">
        <div
          className={`absolute inset-x-0 top-0 h-1 ${filled ? "bg-brand-green" : "bg-brand-blue"}`}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-slate-900">Hari Ini</p>
              <p className="text-sm text-slate-500">{formatIndonesianDate(today)}</p>
            </div>
          </div>
          <Badge tone="orange">Aktif</Badge>
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <div
            className={
              filled
                ? "mb-4 flex size-20 items-center justify-center rounded-full bg-brand-green/10 text-brand-green"
                : "mb-4 flex size-20 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"
            }
          >
            {filled ? (
              <ClipboardCheck className="size-9" />
            ) : (
              <ClipboardEdit className="size-9" />
            )}
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            {filled ? "Laporan hari ini sudah diisi" : "Laporan hari ini belum diisi"}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            {filled
              ? "Kegiatan Anda hari ini sudah tercatat."
              : "Silakan isi laporan kegiatan harian Anda hari ini."}
          </p>

          <Link
            href={`/dashboard/riwayat?date=${today}`}
            className={
              filled
                ? "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white shadow-sm shadow-brand-green/30 transition-colors hover:bg-brand-green/90"
                : "mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-sm shadow-brand-blue/30 transition-colors hover:bg-brand-blue-dark"
            }
          >
            {filled ? "Lihat Laporan Hari Ini" : "Isi Laporan Hari Ini"}
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
