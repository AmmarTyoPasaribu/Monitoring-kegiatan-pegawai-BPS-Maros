import { PageHeader } from "@/components/ui/PageHeader";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { RiwayatClient } from "./RiwayatClient";

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Riwayat"
        title="Riwayat Kegiatan"
        description="Lihat & isi laporan kegiatan harian Anda."
        action={<LogoutButton />}
      />
      <RiwayatClient initialDate={params.date} />
    </div>
  );
}
