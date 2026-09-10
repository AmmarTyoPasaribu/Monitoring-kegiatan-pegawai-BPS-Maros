import { supabaseAdmin } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { todayWitaDateString } from "@/lib/time";
import { DaftarPegawaiClient } from "./DaftarPegawaiClient";

export default async function DaftarPegawaiPage() {
  const { data: employees } = await supabaseAdmin
    .from("users")
    .select("id, full_name, division, photo_url")
    .eq("role", "pegawai")
    .order("full_name", { ascending: true });

  const today = todayWitaDateString();
  const { data: todaysReports } = await supabaseAdmin
    .from("daily_reports")
    .select("user_id")
    .eq("report_date", today);

  const filledIds = new Set((todaysReports || []).map((r) => r.user_id));
  const employeesWithStatus = (employees || []).map((emp) => ({
    ...emp,
    filledToday: filledIds.has(emp.id),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Direktori"
        title="Daftar Pegawai"
        description="Seluruh pegawai BPS Kabupaten Maros yang terdaftar di sistem."
      />
      <DaftarPegawaiClient employees={employeesWithStatus} />
    </div>
  );
}
