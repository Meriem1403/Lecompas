import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { MultiSelectFilter } from "@/app/components/ui/multi-select-filter";
import { cn } from "@/lib/utils";
import {
  emptyRiskEvaluationFilters,
  hasActiveRiskFilters,
  type GfmCompareOperator,
  type RiskEvaluationFilters,
} from "@/app/utils/riskFilterLogic";

interface RiskEvaluationFiltersPanelProps {
  filters: RiskEvaluationFilters;
  onChange: (filters: RiskEvaluationFilters) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  visibleRisks: Array<{
    service: string;
    domain?: string;
    unite?: string;
    site: string;
    status: string;
    numeroRisque: string;
    title?: string;
    riskLevel: number;
    severity: number;
    probability: number;
    responsable: string;
  }>;
  resultCount: number;
}

const fieldClass = "h-11 rounded-xl border-slate-200 bg-white shadow-sm data-[size=default]:h-11";

const severityOptions = [
  { value: "1", label: "Faible", on: "border-teal-300 bg-teal-50 text-teal-800" },
  { value: "2", label: "Moyen", on: "border-sky-300 bg-sky-50 text-sky-800" },
  { value: "3", label: "Élevé", on: "border-orange-300 bg-orange-50 text-orange-800" },
  { value: "4", label: "Très élevé", on: "border-rose-300 bg-rose-50 text-rose-800" },
];

const frequencyOptions = [
  { value: "1", label: "Rare", on: "border-teal-300 bg-teal-50 text-teal-800" },
  { value: "2", label: "Peu probable", on: "border-sky-300 bg-sky-50 text-sky-800" },
  { value: "3", label: "Probable", on: "border-orange-300 bg-orange-50 text-orange-800" },
  { value: "4", label: "Très probable", on: "border-rose-300 bg-rose-50 text-rose-800" },
];

const priorityOptions = [
  { value: "P1", label: "P1", on: "border-rose-300 bg-rose-50 text-rose-700" },
  { value: "P2", label: "P2", on: "border-orange-300 bg-orange-50 text-orange-700" },
  { value: "P3", label: "P3", on: "border-emerald-300 bg-emerald-50 text-emerald-700" },
];

function ChoiceFilter({
  label,
  options,
  selected,
  onChange,
  columns,
}: {
  label?: string;
  options: Array<{ value: string; label: string; on: string }>;
  selected: string[];
  onChange: (values: string[]) => void;
  columns: string;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-semibold text-slate-500">{label}</p> : null}
      <div className={cn("grid gap-2", columns)}>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.value)}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 text-center text-sm font-semibold leading-tight",
                active ? option.on : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RiskEvaluationFiltersPanel({
  filters,
  onChange,
  searchQuery,
  onSearchChange,
  visibleRisks,
  resultCount,
}: RiskEvaluationFiltersPanelProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const filtersActive = hasActiveRiskFilters(filters, searchQuery);
  const patch = (partial: Partial<RiskEvaluationFilters>) =>
    onChange({ ...filters, ...partial });
  const resetFilters = () => {
    onChange(emptyRiskEvaluationFilters());
    onSearchChange("");
  };

  const uniqueSorted = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

  const riskNumberOptions = [...visibleRisks.reduce((groups, risk) => {
    const number = String(risk.numeroRisque || "").trim();
    if (!number) return groups;
    const titles = groups.get(number) ?? [];
    const title = String(risk.title || "").trim();
    if (title && !titles.includes(title)) titles.push(title);
    groups.set(number, titles);
    return groups;
  }, new Map<string, string[]>())]
    .sort(([left], [right]) => left.localeCompare(right, "fr", { numeric: true }))
    .map(([value, titles]) => ({
      value,
      label: titles.length > 0 ? `N° ${value} · ${titles.join(", ")}` : `N° ${value}`,
    }));

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur" role="region" aria-label="Filtres évaluation des risques">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm"
              placeholder="Rechercher (risque, service, domaine, lieux, responsable...)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <p className="shrink-0 text-sm font-semibold text-slate-600">{resultCount} risque(s)</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen((open) => !open)}
            className="h-11 rounded-xl border-purple-200 bg-white px-4 text-purple-700 hover:bg-purple-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filtersOpen ? "Masquer les filtres" : "Filtres"}
          </Button>
          {filtersActive ? (
            <Button type="button" variant="ghost" onClick={resetFilters} className="h-11 rounded-xl text-slate-600">
              Réinitialiser
            </Button>
          ) : null}
        </div>

        {filtersOpen ? (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">Identification</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MultiSelectFilter
                  label="Service"
                  selected={filters.services}
                  onChange={(services) => patch({ services })}
                  options={uniqueSorted(visibleRisks.map((risk) => risk.service)).map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <MultiSelectFilter
                  label="Domaine"
                  selected={filters.domains}
                  onChange={(domains) => patch({ domains })}
                  options={uniqueSorted(visibleRisks.map((risk) => risk.domain || risk.unite || "")).map(
                    (value) => ({ value, label: value }),
                  )}
                />
                <MultiSelectFilter
                  label="Lieu"
                  selected={filters.sites}
                  onChange={(sites) => patch({ sites })}
                  options={uniqueSorted(visibleRisks.map((risk) => risk.site)).map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <MultiSelectFilter
                  label="Responsable"
                  selected={filters.responsables}
                  onChange={(responsables) => patch({ responsables })}
                  options={uniqueSorted(
                    visibleRisks.flatMap((risk) =>
                      String(risk.responsable || "")
                        .split(",")
                        .map((name) => name.trim()),
                    ),
                  ).map((value) => ({ value, label: value }))}
                />
                <MultiSelectFilter
                  label="Statut"
                  selected={filters.statuses}
                  onChange={(statuses) => patch({ statuses })}
                  options={[
                    { value: "a_traiter", label: "À traiter" },
                    { value: "en_traitement", label: "En traitement" },
                    { value: "maitrise", label: "Maîtrisé" },
                    { value: "supprime", label: "Supprimé" },
                  ]}
                />
                <MultiSelectFilter
                  label="N° risque"
                  wrapOptions
                  selected={filters.riskNumbers}
                  onChange={(riskNumbers) => patch({ riskNumbers })}
                  options={riskNumberOptions}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">Évaluation</h2>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                  <p className="mb-3 text-sm font-bold text-orange-950">Gravité</p>
                  <ChoiceFilter
                    options={severityOptions}
                    selected={filters.severities}
                    onChange={(severities) => patch({ severities })}
                    columns="grid-cols-2 sm:grid-cols-4"
                  />
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                  <p className="mb-3 text-sm font-bold text-sky-950">Fréquence</p>
                  <ChoiceFilter
                    options={frequencyOptions}
                    selected={filters.frequencies}
                    onChange={(frequencies) => patch({ frequencies })}
                    columns="grid-cols-2 sm:grid-cols-4"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="mb-3 text-sm font-bold text-violet-950">Priorité</p>
                <ChoiceFilter
                  options={priorityOptions}
                  selected={filters.priorityBands}
                  onChange={(priorityBands) =>
                    patch({ priorityBands: priorityBands as RiskEvaluationFilters["priorityBands"] })
                  }
                  columns="grid-cols-3"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-bold text-slate-900">Niveau GFM</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <MultiSelectFilter
                    label="Valeur exacte"
                    selected={filters.gfmLevels}
                    onChange={(gfmLevels) => patch({ gfmLevels })}
                    options={uniqueSorted(visibleRisks.map((risk) => String(risk.riskLevel))).map((value) => ({
                      value,
                      label: `GFM ${value}`,
                    }))}
                  />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500">Comparer</Label>
                    <Select
                      value={filters.gfmOperator}
                      onValueChange={(value) => patch({ gfmOperator: value as GfmCompareOperator })}
                    >
                      <SelectTrigger className={fieldClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Sans comparaison</SelectItem>
                        <SelectItem value="lt">Strictement inférieur à</SelectItem>
                        <SelectItem value="lte">Inférieur ou égal à</SelectItem>
                        <SelectItem value="gt">Strictement supérieur à</SelectItem>
                        <SelectItem value="gte">Supérieur ou égal à</SelectItem>
                        <SelectItem value="eq">Égal à</SelectItem>
                        <SelectItem value="between">Entre (inclus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {filters.gfmOperator !== "any" ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">
                        {filters.gfmOperator === "between" ? "GFM min" : "Valeur"}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        className={fieldClass}
                        placeholder="ex. 4"
                        value={filters.gfmValue}
                        onChange={(e) => patch({ gfmValue: e.target.value })}
                      />
                    </div>
                  ) : null}
                  {filters.gfmOperator === "between" ? (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">GFM max</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className={fieldClass}
                        placeholder="ex. 9"
                        value={filters.gfmValueMax}
                        onChange={(e) => patch({ gfmValueMax: e.target.value })}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
