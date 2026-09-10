"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

function StatMotif() {
  return (
    <svg
      viewBox="0 0 400 160"
      fill="none"
      className="absolute inset-x-0 bottom-0 h-40 w-full text-white/10"
      preserveAspectRatio="none"
    >
      <rect x="24" y="90" width="26" height="50" rx="3" fill="currentColor" />
      <rect x="66" y="60" width="26" height="80" rx="3" fill="currentColor" />
      <rect x="108" y="105" width="26" height="35" rx="3" fill="currentColor" />
      <rect x="150" y="40" width="26" height="100" rx="3" fill="currentColor" />
      <rect x="192" y="75" width="26" height="65" rx="3" fill="currentColor" />
      <path
        d="M20 100 L70 65 L112 95 L154 30 L196 70 L240 15"
        stroke="var(--color-brand-orange)"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal masuk");
        return;
      }
      toast.success("Berhasil masuk");
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-surface">
      {/* Panel brand */}
      <div className="brand-panel relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden px-12 py-12 lg:flex">
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/95 p-2 shadow-lg shadow-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo statis dari public/ */}
            <img src="/logo.webp" alt="Logo BPS" className="size-full object-contain" />
          </div>
          <div className="leading-tight text-white">
            <p className="font-heading text-sm font-bold">Badan Pusat Statistik</p>
            <p className="text-xs text-white/70">Kabupaten Maros</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-white">
            Monitoring Kegiatan Pegawai
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Pantau rencana kerja, realisasi, dan progres kegiatan harian
            seluruh pegawai BPS Kabupaten Maros secara terpusat.
          </p>
        </div>

        <div className="relative h-40">
          <StatMotif />
        </div>
      </div>

      {/* Panel form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 flex size-14 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo statis dari public/ */}
              <img src="/logo.webp" alt="Logo BPS" className="size-full object-contain" />
            </div>
            <h2 className="font-heading text-xl font-extrabold text-slate-900">
              Masuk ke Akun Anda
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              BPS Kabupaten Maros &mdash; Sistem Monitoring Kegiatan Pegawai
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label required>Username atau Email</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10"
                  placeholder="masukkan username atau email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <Label required>Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10 pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Masuk
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 lg:text-left">
            &copy; {new Date().getFullYear()} BPS Kabupaten Maros
          </p>
        </div>
      </div>
    </div>
  );
}
