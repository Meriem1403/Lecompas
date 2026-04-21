import React from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../ui/utils";

interface AccessMetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "violet" | "orange" | "slate";
}

const accentClasses = {
  violet: {
    card: "border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50",
    icon: "from-violet-600 to-purple-500",
    text: "text-violet-900",
    label: "text-violet-700",
  },
  orange: {
    card: "border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50",
    icon: "from-blue-500 to-cyan-500",
    text: "text-blue-900",
    label: "text-blue-700",
  },
  slate: {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 to-zinc-50",
    icon: "from-slate-500 to-slate-700",
    text: "text-slate-900",
    label: "text-slate-600",
  },
};

export function AccessMetricCard({
  label,
  value,
  icon: Icon,
  accent = "violet",
}: AccessMetricCardProps) {
  const styles = accentClasses[accent];

  return (
    <Card className={cn("rounded-2xl border shadow-sm", styles.card)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide",
                styles.label,
              )}
            >
              {label}
            </p>
            <p className={cn("mt-1 text-2xl font-bold", styles.text)}>{value}</p>
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md",
              styles.icon,
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
