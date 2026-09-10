import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const { data: adminUser } = await supabaseAdmin
    .from("users")
    .select("full_name, username, email, photo_url")
    .eq("id", session.id)
    .maybeSingle();

  return (
    <AdminShell
      adminUser={
        adminUser || {
          full_name: session.full_name,
          username: session.username,
          email: "",
          photo_url: null,
        }
      }
    >
      {children}
    </AdminShell>
  );
}
