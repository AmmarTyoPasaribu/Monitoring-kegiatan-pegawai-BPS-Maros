import { supabaseAdmin } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { KegiatanPegawaiClient } from "./KegiatanPegawaiClient";

export default async function KegiatanPegawaiPage({
  searchParams,
}: {
  searchParams: Promise<{ pegawai?: string }>;
}) {
  const params = await searchParams;
  const { data: employees } = await supabaseAdmin
    .from("users")
    .select("id, full_name, division, photo_url")
    .eq("role", "pegawai")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Pemantauan"
        title="Kegiatan Pegawai"
        description="Pantau laporan kegiatan harian tiap pegawai per tanggal, dan ekspor rekap bulanan."
      />
      <KegiatanPegawaiClient employees={employees || []} initialEmployeeId={params.pegawai} />
    </div>
  );
}
