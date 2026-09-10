import { supabaseAdmin } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { KelolaPegawaiClient } from "./KelolaPegawaiClient";

export default async function KelolaPegawaiPage() {
  const { data: employees } = await supabaseAdmin
    .from("users")
    .select("id, full_name, username, email, division, photo_url")
    .eq("role", "pegawai")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Manajemen"
        title="Kelola Pegawai"
        description="Tambah, ubah, atau hapus akun pegawai BPS Kabupaten Maros."
      />
      <KelolaPegawaiClient initialEmployees={employees || []} />
    </div>
  );
}
