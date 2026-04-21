import React from "react";
import { cva } from "class-variance-authority";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

const pillVariants = cva(
  "h-8 rounded-full px-3 text-xs font-semibold border transition-colors",
  {
    variants: {
      active: {
        true: "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-600 hover:from-violet-700 hover:to-purple-700",
        false:
          "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

interface AccessCrudPillProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function AccessCrudPill({ label, active, onToggle }: AccessCrudPillProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(pillVariants({ active }))}
      onClick={onToggle}
    >
      {label}
    </Button>
  );
}
