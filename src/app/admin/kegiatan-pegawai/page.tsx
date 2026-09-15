import { supabaseAdmin } from "@/lib/supabase";
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

  return <KegiatanPegawaiClient employees={employees || []} initialEmployeeId={params.pegawai} />;
}
