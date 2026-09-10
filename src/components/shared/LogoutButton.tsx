"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Berhasil keluar");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar, coba lagi");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-red-600/25 transition-colors hover:bg-red-700",
          className
        )}
        aria-label="Logout"
      >
        <LogOut className="size-4" />
        Logout
      </button>
      <ConfirmModal
        open={open}
        title="Keluar Akun"
        description="Yakin ingin keluar dari akun Anda?"
        confirmLabel="Ya, Keluar"
        variant="danger"
        loading={loading}
        onConfirm={handleLogout}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
