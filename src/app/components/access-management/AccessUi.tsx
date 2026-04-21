import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { cn } from "../ui/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 space-y-6">{children}</div>;
}

export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 transition-all duration-300">{children}</div>;
}

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "violet" | "orange" | "green";
  className?: string;
}) {
  const tones = {
    neutral: "bg-slate-50 border-slate-200 text-slate-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    orange: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", tones[tone], className)}>
      {children}
    </Badge>
  );
}

export function InfoChip({
  icon: Icon,
  label,
  value,
  tone = "violet",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "violet" | "orange" | "blue" | "teal";
}) {
  const tones = {
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    orange: "bg-blue-50 border-blue-200 text-blue-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    teal: "bg-teal-50 border-teal-200 text-teal-700",
  };
  return (
    <div
      className={cn(
        "group rounded-lg border px-3 py-2 flex items-center gap-2 transition-all duration-200 hover:shadow-sm",
        tones[tone],
      )}
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold truncate">{value}</span>
    </div>
  );
}

export function MetricBox({
  label,
  value,
  icon: Icon,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "violet" | "orange" | "slate";
}) {
  const tones = {
    violet: "from-violet-50 to-purple-50 border-violet-100",
    orange: "from-blue-50 to-cyan-50 border-blue-100",
    slate: "from-slate-50 to-zinc-50 border-slate-200",
  };
  const iconTones = {
    violet: "from-violet-600 to-purple-500",
    orange: "from-blue-500 to-cyan-500",
    slate: "from-slate-600 to-slate-500",
  };
  return (
    <Card
      className={cn(
        "group rounded-2xl border shadow-sm bg-gradient-to-br transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        tones[tone],
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
          <div
            className={cn(
              "h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md",
              iconTones[tone],
            )}
          >
            <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressSection({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card className="group rounded-2xl border border-violet-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">{label}</p>
        <p className="text-2xl font-bold text-violet-900">{value}%</p>
        <Progress
          value={value}
          className="h-2 bg-violet-100 transition-all duration-300 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-violet-600 [&_[data-slot=progress-indicator]]:to-indigo-600 [&_[data-slot=progress-indicator]]:transition-all [&_[data-slot=progress-indicator]]:duration-500"
        />
      </CardContent>
    </Card>
  );
}

export function RiskCard({
  title,
  description,
  icon: Icon,
  badge,
  selected,
  onClick,
  footer,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group rounded-3xl border-2 bg-white shadow-sm transition-all duration-300",
        onClick ? "cursor-pointer" : "",
        selected
          ? "border-violet-300 shadow-md"
          : "border-transparent hover:border-violet-200 hover:shadow-xl hover:-translate-y-1",
      )}
    >
      <CardHeader className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg">
            <Icon className="h-6 w-6 text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
          </div>
          {badge}
        </div>
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        <p className="text-sm text-slate-600">{description}</p>
      </CardHeader>
      {footer ? <CardContent className="p-5 pt-0">{footer}</CardContent> : null}
    </Card>
  );
}
