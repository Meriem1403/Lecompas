import React from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { MultiSelectFilter } from "@/app/components/ui/multi-select-filter";
import type { Action } from "@/app/components/ActionsView";
import {
  emptyActionFilters,
  type ActionFilters,
} from "@/app/utils/actionFilterLogic";
import { Search } from "lucide-react";

interface ActionFiltersPanelProps {
  filters: ActionFilters;
  onChange: (filters: ActionFilters) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  actions: Action[];
  resultCount: number;
  groupByRisk?: boolean;
  onGroupByRiskChange?: (value: boolean) => void;
}

export function ActionFiltersPanel({
  filters,
  onChange,
  searchQuery,
  onSearchChange,
  actions,
  resultCount,
  groupByRisk = false,
  onGroupByRiskChange,
}: ActionFiltersPanelProps) {
  const patch = (partial: Partial<ActionFilters>) =>
    onChange({ ...filters, ...partial });

  const uniqueSorted = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

  const serviceOptions = uniqueSorted(
    actions.flatMap((action) =>
      action.services?.length ? action.services : ["DIRM MED"],
    ),
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-xl">
        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-10"
          placeholder="Rechercher une action, un risque, un responsable..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <MultiSelectFilter
          label="Source"
          selected={filters.sources}
          onChange={(sources) => patch({ sources })}
          options={[
            { value: "DUERP", label: "DUERP" },
            { value: "MANUEL", label: "Manuelle" },
          ]}
        />
        <MultiSelectFilter
          label="Statut"
          selected={filters.statuses}
          onChange={(statuses) => patch({ statuses })}
          options={[
            { value: "À faire", label: "À faire" },
            { value: "En cours", label: "En cours" },
            { value: "Terminée", label: "Terminée" },
            { value: "En retard", label: "En retard" },
          ]}
        />
        <MultiSelectFilter
          label="Priorité"
          selected={filters.priorities}
          onChange={(priorities) => patch({ priorities })}
          options={[
            { value: "Haute", label: "Haute" },
            { value: "Moyenne", label: "Moyenne" },
            { value: "Faible", label: "Faible" },
          ]}
        />
        <MultiSelectFilter
          label="PAPRIPACT"
          selected={filters.papripactModes}
          onChange={(papripactModes) => patch({ papripactModes })}
          options={[
            { value: "retenue", label: "Retenue PAPRIPACT" },
            { value: "hors", label: "Hors PAPRIPACT" },
          ]}
        />
        <MultiSelectFilter
          label="Service"
          selected={filters.services}
          onChange={(services) => patch({ services })}
          options={serviceOptions.map((value) => ({ value, label: value }))}
        />
        <MultiSelectFilter
          label="Responsable"
          selected={filters.responsables}
          onChange={(responsables) => patch({ responsables })}
          options={uniqueSorted(actions.map((action) => action.responsable)).map(
            (value) => ({ value, label: value }),
          )}
        />
        <MultiSelectFilter
          label="Année PAPRIPACT"
          selected={filters.papripactYears}
          onChange={(papripactYears) => patch({ papripactYears })}
          options={uniqueSorted(
            actions
              .filter((action) => action.papripactYear)
              .map((action) => String(action.papripactYear)),
          ).map((value) => ({ value, label: value }))}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(e) => patch({ overdueOnly: e.target.checked })}
            />
            Afficher uniquement les actions en retard
          </label>
          {onGroupByRiskChange ? (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={groupByRisk}
                onChange={(e) => onGroupByRiskChange(e.target.checked)}
              />
              Regrouper par risque associé
            </label>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">{resultCount} action(s) affichée(s)</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(emptyActionFilters());
              onSearchChange("");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </div>
    </div>
  );
}
