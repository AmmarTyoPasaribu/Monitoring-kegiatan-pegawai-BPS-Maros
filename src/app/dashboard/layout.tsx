import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PegawaiBottomNav } from "@/components/pegawai/PegawaiNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "pegawai") redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <main className="flex-1 px-4 py-5 sm:px-6">{children}</main>
      <PegawaiBottomNav />
    </div>
  );
}
