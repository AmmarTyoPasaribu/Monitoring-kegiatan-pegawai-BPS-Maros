import { cn } from "@/lib/cn";

type Tone = "green" | "blue" | "orange" | "slate" | "red";

const toneClasses: Record<Tone, string> = {
  green: "bg-brand-green/10 text-brand-green ring-1 ring-inset ring-brand-green/20",
  blue: "bg-brand-blue/10 text-brand-blue-dark ring-1 ring-inset ring-brand-blue/20",
  orange: "bg-brand-orange/10 text-brand-orange ring-1 ring-inset ring-brand-orange/25",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  red: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
