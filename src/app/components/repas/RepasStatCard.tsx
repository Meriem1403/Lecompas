import React from "react";
import { Card, CardContent } from "../ui/card";

export function RepasStatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card className="border-2 border-white/60 bg-white/90 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
