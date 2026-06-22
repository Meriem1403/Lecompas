import React, { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnFilterOption {
  value: string;
  label: string;
}

interface ColumnFilterPopoverProps {
  options: ColumnFilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  ariaLabel: string;
}

export function ColumnFilterPopover({
  options,
  selected,
  onChange,
  ariaLabel,
}: ColumnFilterPopoverProps) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAllVisible = () => {
    const visibleValues = filteredOptions.map((opt) => opt.value);
    onChange([...new Set([...selected, ...visibleValues])]);
  };

  const isActive = selected.length > 0;

  return (
    <Popover onOpenChange={(open) => !open && setQuery("")}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 shrink-0",
            isActive
              ? "text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/80",
          )}
          aria-label={ariaLabel}
          title={isActive ? `${selected.length} filtre(s) actif(s)` : "Filtrer la colonne"}
        >
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 mb-2"
          aria-label={`Recherche filtre ${ariaLabel}`}
        />
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            type="button"
            className="text-xs text-indigo-700 hover:underline"
            onClick={selectAllVisible}
          >
            Tout cocher
          </button>
          <button
            type="button"
            className="text-xs text-red-600 hover:underline"
            onClick={() => onChange([])}
          >
            Effacer
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {filteredOptions.length === 0 ? (
            <p className="text-xs text-gray-500 px-2 py-3">Aucune valeur</p>
          ) : (
            filteredOptions.map((option) => {
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
                  <span className="truncate" title={option.label}>
                    {option.label}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
