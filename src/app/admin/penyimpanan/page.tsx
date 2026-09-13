import { AlertTriangle, Database, HardDrive, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import {
  formatBytes,
  getAvatarStorageStats,
  getDatabaseSizeBytes,
  getTableSizes,
} from "@/lib/storageStats";

// Asumsi Supabase Free Plan -- tidak bisa diambil otomatis lewat API project
// (anon/service role key tidak punya akses ke data billing/kuota akun).
const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const DB_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

const SQL_SNIPPET = `create or replace function public.get_database_size()
returns bigint language sql security definer set search_path = public as $$
  select pg_database_size(current_database());
$$;

drop function if exists public.get_table_sizes();
create or replace function public.get_table_sizes()
returns table(table_name text, size_bytes bigint, row_count bigint)
language plpgsql security definer set search_path = public as $$
declare
  r record; cnt bigint;
begin
  for r in
    select c.relname::text as tname, pg_total_relation_size(c.oid) as sz
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by pg_total_relation_size(c.oid) desc
  loop
    execute format('select count(*) from public.%I', r.tname) into cnt;
    table_name := r.tname; size_bytes := r.sz; row_count := cnt;
    return next;
  end loop;
end;
$$;`;

function UsageBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const tone = clamped >= 90 ? "bg-red-500" : clamped >= 70 ? "bg-brand-orange" : "bg-brand-green";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default async function PenyimpananPage() {
  const [storageStats, dbSizeBytes, tableSizes] = await Promise.all([
    getAvatarStorageStats(),
    getDatabaseSizeBytes(),
    getTableSizes(),
  ]);

  const storagePercent = (storageStats.totalBytes / STORAGE_LIMIT_BYTES) * 100;
  const dbPercent = dbSizeBytes !== null ? (dbSizeBytes / DB_LIMIT_BYTES) * 100 : 0;
  const sqlNotReady = dbSizeBytes === null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sistem"
        title="Penyimpanan"
        description="Pantau penggunaan storage foto dan database Supabase."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Storage foto */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-slate-900">Storage Foto</p>
              <p className="text-xs text-slate-500">Bucket &quot;avatars&quot; — foto profil pegawai</p>
            </div>
          </div>
          <UsageBar percent={storagePercent} />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              {formatBytes(storageStats.totalBytes)} terpakai
            </span>
            <span className="text-xs text-slate-400">dari ~1 GB</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">{storageStats.fileCount} file foto tersimpan</p>
        </div>

        {/* Database */}
        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
              <Database className="size-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-slate-900">Database</p>
              <p className="text-xs text-slate-500">Seluruh tabel di skema &quot;public&quot;</p>
            </div>
          </div>
          {sqlNotReady ? (
            <p className="text-sm text-slate-400">Belum tersedia — lihat catatan di bawah.</p>
          ) : (
            <>
              <UsageBar percent={dbPercent} />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  {formatBytes(dbSizeBytes)} terpakai
                </span>
                <span className="text-xs text-slate-400">dari ~500 MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rincian per tabel */}
      {tableSizes && tableSizes.length > 0 && (
        <div className="card-surface overflow-hidden">
          <p className="p-5 pb-0 font-heading font-bold text-slate-900">Rincian per Tabel</p>
          <div className="overflow-x-auto p-5">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 pr-4 font-semibold">Tabel</th>
                  <th className="pb-2 pr-4 font-semibold">Jumlah Baris</th>
                  <th className="pb-2 font-semibold">Ukuran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableSizes.map((t) => (
                  <tr key={t.table_name}>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">{t.table_name}</td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {Number(t.row_count).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 text-slate-600">{formatBytes(Number(t.size_bytes))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sqlNotReady && (
        <div className="card-surface border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-slate-900">
                Ukuran database belum bisa ditampilkan
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Jalankan SQL berikut sekali di Supabase SQL Editor (juga sudah ditambahkan di
                bagian akhir <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">supabase_schema.sql</code>),
                lalu muat ulang halaman ini:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                <code>{SQL_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-surface px-4 py-3 text-xs text-slate-500">
        <HardDrive className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <p>
          Batas di atas (~500 MB Database, ~1 GB Storage) adalah asumsi <strong>Supabase Free Plan</strong>.
          API project (service role key) tidak memiliki akses ke data billing/kuota akun yang
          sebenarnya. Jika project Anda memakai plan berbeda, cek limit aktualnya langsung di
          Supabase Dashboard → Settings → Billing.
        </p>
      </div>
    </div>
  );
}
