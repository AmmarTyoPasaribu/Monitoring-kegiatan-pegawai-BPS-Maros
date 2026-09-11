import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "blue" | "green" | "orange";

const toneClasses: Record<Tone, string> = {
  blue: "bg-brand-blue/10 text-brand-blue",
  green: "bg-brand-green/10 text-brand-green",
  orange: "bg-brand-orange/10 text-brand-orange",
};

export function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-heading text-2xl font-extrabold text-slate-900">
          {value}
          {sub && <span className="ml-1.5 text-sm font-semibold text-slate-400">{sub}</span>}
        </p>
      </div>
    </div>
  );
}
