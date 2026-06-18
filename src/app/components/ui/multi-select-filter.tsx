import React from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { ChevronsUpDown, X } from "lucide-react";
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
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = "Tous",
  className,
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
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between font-normal h-10 bg-white"
          >
            <span className="truncate text-left">{summary}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            {selected.length > 0 ? (
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => onChange([])}
              >
                Effacer
              </button>
            ) : null}
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-50",
                    checked && "bg-indigo-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.value)}
                  />
                  <span className="truncate">{option.label}</span>
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
