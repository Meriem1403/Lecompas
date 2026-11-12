import React from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  wrapOptions?: boolean;
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = "Tous",
  className,
  wrapOptions = false,
}: MultiSelectFilterProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? options
            .filter((opt) => selected.includes(opt.value))
            .map((opt) => opt.label)
            .join(", ")
        : `${selected.length} sélectionné(s)`;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-11 w-full justify-between rounded-xl border-slate-200 bg-white font-normal shadow-sm"
          >
            <span className="truncate text-left">{summary}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("rounded-xl p-2", wrapOptions ? "w-96" : "w-72")} align="start">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-700">{label}</span>
            {selected.length > 0 ? (
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => onChange([])}
              >
                Effacer
              </button>
            ) : null}
          </div>
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                    checked ? "bg-purple-50 text-purple-900" : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(option.value)}
                  />
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 bg-white",
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className={wrapOptions ? "min-w-0 whitespace-normal break-words" : "truncate"}>{option.label}</span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.slice(0, 3).map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <Badge key={value} variant="secondary" className="text-xs gap-1">
                {option?.label ?? value}
                <button type="button" onClick={() => toggle(value)} aria-label="Retirer">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {selected.length > 3 ? (
            <Badge variant="outline" className="text-xs">
              +{selected.length - 3}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
