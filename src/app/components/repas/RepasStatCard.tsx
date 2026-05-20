import React from "react";
import { cn } from "../ui/utils";

export type RepasStatAccent =
  | "teal"
  | "emerald"
  | "cyan"
  | "sky"
  | "amber"
  | "orange"
  | "slate"
  | "violet"
  | "rose";

const accentIconShell: Record<RepasStatAccent, string> = {
  teal: "bg-teal-500/[0.12] text-teal-700 ring-teal-600/15",
  emerald: "bg-emerald-500/[0.12] text-emerald-700 ring-emerald-600/15",
  cyan: "bg-cyan-500/[0.12] text-cyan-800 ring-cyan-600/15",
  sky: "bg-sky-500/[0.12] text-sky-800 ring-sky-600/15",
  amber: "bg-amber-500/[0.15] text-amber-900 ring-amber-600/20",
  orange: "bg-orange-500/[0.12] text-orange-900 ring-orange-600/15",
  slate: "bg-slate-500/[0.1] text-slate-700 ring-slate-600/15",
  violet: "bg-violet-500/[0.12] text-violet-800 ring-violet-600/15",
  rose: "bg-rose-500/[0.1] text-rose-900 ring-rose-600/15",
};

export function RepasStatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "teal",
  layout = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  /** Style d’accent discret sur l’icône (sans gros dégradés). */
  accent?: RepasStatAccent;
  /** `currency` aligne les montants avec des chiffres à chasse fixe + taille mise en avant */
  layout?: "default" | "currency";
}) {
  const isCurrency = layout === "currency";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5",
        "shadow-[0_1px_3px_-1px_rgba(15,23,42,0.07),inset_0_1px_0_0_rgba(255,255,255,0.92)]",
        "ring-1 ring-slate-900/[0.03] transition duration-300",
        "hover:border-slate-300/95 hover:shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
      )}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-bl from-white to-slate-50/0 opacity-[0.45]"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium uppercase tracking-[0.12em] text-slate-500",
              isCurrency ? "text-[10px] leading-tight sm:text-[11px]" : "text-[11px] sm:text-xs",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-semibold tracking-tight text-slate-900 tabular-nums",
              isCurrency
                ? "text-xl leading-none sm:text-2xl font-bold"
                : "text-2xl sm:text-[1.75rem]",
            )}
          >
            {value}
          </p>
          {sub ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-500 sm:text-xs">{sub}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl p-3 ring-1",
            accentIconShell[accent],
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" strokeWidth={1.85} />
        </div>
      </div>
    </div>
  );
}
