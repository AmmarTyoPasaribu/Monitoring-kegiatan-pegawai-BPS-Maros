"use client";

import { useState } from "react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminUser {
  full_name: string;
  username: string;
  email: string;
  photo_url: string | null;
}

export function AdminShell({
  children,
  adminUser,
}: {
  children: React.ReactNode;
  adminUser: AdminUser;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMenu={() => setOpen(true)} adminUser={adminUser} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
