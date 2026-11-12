import React, { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowDownNarrowWide, ArrowUpAZ, ArrowUpNarrowWide, Filter } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ColumnConditionOperator, ColumnFilterKind, ColumnFilterState } from "@/app/utils/riskManagementFilterLogic";
import { emptyColumnFilterState } from "@/app/utils/riskManagementFilterLogic";

export interface ColumnFilterOption {
  value: string;
  label: string;
}

const textOperators: Array<{ value: ColumnConditionOperator; label: string }> = [
  { value: "none", label: "Aucune condition" },
  { value: "contains", label: "Contient" },
  { value: "notContains", label: "Ne contient pas" },
  { value: "equals", label: "Est égal à" },
  { value: "notEquals", label: "Est différent de" },
  { value: "startsWith", label: "Commence par" },
  { value: "endsWith", label: "Se termine par" },
];

const numberOperators: Array<{ value: ColumnConditionOperator; label: string }> = [
  { value: "none", label: "Aucune condition" },
  { value: "equals", label: "Est égal à" },
  { value: "notEquals", label: "Est différent de" },
  { value: "gt", label: "Supérieur à" },
  { value: "gte", label: "Supérieur ou égal à" },
  { value: "lt", label: "Inférieur à" },
  { value: "lte", label: "Inférieur ou égal à" },
  { value: "between", label: "Entre" },
];

const dateOperators: Array<{ value: ColumnConditionOperator; label: string }> = [
  { value: "none", label: "Aucune condition" },
  { value: "equals", label: "Est égal à" },
  { value: "notEquals", label: "Est différent de" },
  { value: "gt", label: "Après le" },
  { value: "lt", label: "Avant le" },
  { value: "between", label: "Entre" },
];

interface ColumnFilterPopoverProps {
  options: ColumnFilterOption[];
  filter: ColumnFilterState;
  kind: ColumnFilterKind;
  sorted?: "asc" | "desc" | null;
  onApply: (filter: ColumnFilterState) => void;
  onSort: (direction: "asc" | "desc") => void;
  ariaLabel: string;
}

export function ColumnFilterPopover({
  options,
  filter,
  kind,
  sorted = null,
  onApply,
  onSort,
  ariaLabel,
}: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ColumnFilterState>(filter);
  const [search, setSearch] = useState("");

  const operators = kind === "number" ? numberOperators : kind === "date" ? dateOperators : textOperators;
  const isActive = filter.values !== null || (filter.operator !== "none" && filter.query.trim().length > 0);
  const visibleOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return options;
    return options.filter((option) => option.label.toLocaleLowerCase("fr").includes(query));
  }, [options, search]);

  const checkedValues = draft.values === null ? options.map((option) => option.value) : draft.values;
  const checked = new Set(checkedValues);
  const visibleChecked = visibleOptions.filter((option) => checked.has(option.value)).length;
  const allVisibleChecked = visibleOptions.length > 0 && visibleChecked === visibleOptions.length;

  const openMenu = (next: boolean) => {
    if (next) {
      setDraft(filter);
      setSearch("");
    }
    setOpen(next);
  };

  const setChecked = (values: string[]) => {
    const unique = [...new Set(values)];
    setDraft((current) => ({
      ...current,
      values: unique.length === options.length ? null : unique,
    }));
  };

  const toggle = (value: string) => {
    const next = new Set(checked);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setChecked([...next]);
  };

  const toggleVisible = () => {
    const visible = new Set(visibleOptions.map((option) => option.value));
    if (allVisibleChecked) {
      setChecked(checkedValues.filter((value) => !visible.has(value)));
      return;
    }
    setChecked([...checkedValues, ...visible]);
  };

  const sortLabels = kind === "number"
    ? ["Trier du plus petit au plus grand", "Trier du plus grand au plus petit"]
    : kind === "date"
      ? ["Trier du plus ancien au plus récent", "Trier du plus récent au plus ancien"]
      : ["Trier de A à Z", "Trier de Z à A"];
  const SortAsc = kind === "text" ? ArrowDownAZ : ArrowDownNarrowWide;
  const SortDesc = kind === "text" ? ArrowUpAZ : ArrowUpNarrowWide;

  return (
    <Popover open={open} onOpenChange={openMenu}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-5 w-5 shrink-0 rounded-sm",
            isActive || sorted
              ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
              : "text-slate-500 hover:bg-slate-200 hover:text-slate-800",
          )}
          aria-label={ariaLabel}
          title={isActive ? "Filtre actif" : "Filtrer"}
        >
          <Filter className={cn("h-3.5 w-3.5", isActive && "fill-sky-600")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b border-slate-200 p-1">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100",
              sorted === "asc" && "bg-sky-50 text-sky-800",
            )}
            onClick={() => {
              onSort("asc");
              setOpen(false);
            }}
          >
            <SortAsc className="h-4 w-4 text-slate-500" />
            {sortLabels[0]}
          </button>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100",
              sorted === "desc" && "bg-sky-50 text-sky-800",
            )}
            onClick={() => {
              onSort("desc");
              setOpen(false);
            }}
          >
            <SortDesc className="h-4 w-4 text-slate-500" />
            {sortLabels[1]}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={!isActive}
            onClick={() => {
              const cleared = emptyColumnFilterState();
              setDraft(cleared);
              onApply(cleared);
              setOpen(false);
            }}
          >
            Effacer le filtre
          </button>
        </div>
        <div className="space-y-2 border-b border-slate-200 p-2">
          <label className="block text-xs font-medium text-slate-500">
            Condition
            <select
              value={draft.operator}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  operator: event.target.value as ColumnConditionOperator,
                }))
              }
              className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
            >
              {operators.map((operator) => (
                <option key={operator.value} value={operator.value}>
                  {operator.label}
                </option>
              ))}
            </select>
          </label>
          {draft.operator !== "none" ? (
            <div className="grid grid-cols-1 gap-2">
              <Input
                type={kind === "date" ? "date" : kind === "number" ? "number" : "text"}
                value={draft.query}
                onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
                className="h-8"
                placeholder={kind === "text" ? "Valeur" : undefined}
                aria-label="Valeur de la condition"
              />
              {draft.operator === "between" ? (
                <Input
                  type={kind === "date" ? "date" : "number"}
                  value={draft.queryTo}
                  onChange={(event) => setDraft((current) => ({ ...current, queryTo: event.target.value }))}
                  className="h-8"
                  aria-label="Deuxième valeur"
                />
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher"
            className="mb-2 h-8"
            aria-label={`Recherche ${ariaLabel}`}
          />
          <label className="flex items-center gap-2 rounded px-1 py-1.5 text-sm font-medium hover:bg-slate-50">
            <input
              type="checkbox"
              checked={allVisibleChecked}
              ref={(node) => {
                if (node) node.indeterminate = visibleChecked > 0 && !allVisibleChecked;
              }}
              onChange={toggleVisible}
            />
            (Sélectionner tout)
          </label>
          <div className="max-h-48 space-y-0.5 overflow-y-auto">
            {visibleOptions.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-500">Aucune valeur</p>
            ) : (
              visibleOptions.map((option) => (
                <label key={option.value || "(vide)"} className="flex items-start gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked.has(option.value)}
                    onChange={() => toggle(option.value)}
                  />
                  <span className="min-w-0 break-words leading-snug" title={option.label}>
                    {option.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
          <Button type="button" variant="outline" className="h-8 rounded-md px-3" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            className="h-8 rounded-md bg-sky-700 px-3 text-white hover:bg-sky-800"
            onClick={() => {
              onApply(draft.values.length === 0 && checked.size === 0 ? { ...draft, values: ["__none__"] } : draft);
              setOpen(false);
            }}
            disabled={visibleOptions.length > 0 && checked.size === 0}
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
