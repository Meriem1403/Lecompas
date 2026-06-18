import React from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { MultiSelectFilter } from "@/app/components/ui/multi-select-filter";
import {
  emptyRiskEvaluationFilters,
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
    riskLevel: number;
    severity: number;
    probability: number;
    responsable: string;
  }>;
  resultCount: number;
}

export function RiskEvaluationFiltersPanel({
  filters,
  onChange,
  searchQuery,
  onSearchChange,
  visibleRisks,
  resultCount,
}: RiskEvaluationFiltersPanelProps) {
  const patch = (partial: Partial<RiskEvaluationFilters>) =>
    onChange({ ...filters, ...partial });

  const uniqueSorted = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur" role="region" aria-label="Filtres évaluation des risques">
      <CardContent className="pt-6 space-y-4">
        <Input
          placeholder="Rechercher (risque, service, domaine, lieux, responsable...)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <MultiSelectFilter
            label="Service"
            selected={filters.services}
            onChange={(services) => patch({ services })}
            options={uniqueSorted(visibleRisks.map((r) => r.service)).map((value) => ({
              value,
              label: value,
            }))}
          />
          <MultiSelectFilter
            label="Domaine"
            selected={filters.domains}
            onChange={(domains) => patch({ domains })}
            options={uniqueSorted(visibleRisks.map((r) => r.domain || r.unite || "")).map(
              (value) => ({ value, label: value }),
            )}
          />
          <MultiSelectFilter
            label="Site / Lieu"
            selected={filters.sites}
            onChange={(sites) => patch({ sites })}
            options={uniqueSorted(visibleRisks.map((r) => r.site)).map((value) => ({
              value,
              label: value,
            }))}
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
            selected={filters.riskNumbers}
            onChange={(riskNumbers) => patch({ riskNumbers })}
            options={uniqueSorted(visibleRisks.map((r) => r.numeroRisque)).map((value) => ({
              value,
              label: value,
            }))}
          />
          <MultiSelectFilter
            label="Priorité (P1/P2/P3)"
            selected={filters.priorityBands}
            onChange={(priorityBands) =>
              patch({ priorityBands: priorityBands as RiskEvaluationFilters["priorityBands"] })
            }
            options={[
              { value: "P1", label: "P1 (GFM > 9)" },
              { value: "P2", label: "P2 (4 ≤ GFM ≤ 9)" },
              { value: "P3", label: "P3 (GFM < 4)" },
            ]}
          />
          <MultiSelectFilter
            label="Niveau GFM (valeurs exactes)"
            selected={filters.gfmLevels}
            onChange={(gfmLevels) => patch({ gfmLevels })}
            options={uniqueSorted(visibleRisks.map((r) => String(r.riskLevel))).map((value) => ({
              value,
              label: `GFM ${value}`,
            }))}
          />
          <MultiSelectFilter
            label="Gravité"
            selected={filters.severities}
            onChange={(severities) => patch({ severities })}
            options={["1", "2", "3", "4"].map((value) => ({ value, label: value }))}
          />
          <MultiSelectFilter
            label="Fréquence"
            selected={filters.frequencies}
            onChange={(frequencies) => patch({ frequencies })}
            options={["1", "2", "3", "4"].map((value) => ({ value, label: value }))}
          />
          <MultiSelectFilter
            label="Responsable"
            selected={filters.responsables}
            onChange={(responsables) => patch({ responsables })}
            options={uniqueSorted(
              visibleRisks.flatMap((r) =>
                r.responsable.split(",").map((name) => name.trim()),
              ),
            ).map((value) => ({ value, label: value }))}
          />
        </div>

        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-1 space-y-1">
            <Label className="text-xs font-semibold text-indigo-900">Comparer le GFM</Label>
            <Select
              value={filters.gfmOperator}
              onValueChange={(value) =>
                patch({ gfmOperator: value as GfmCompareOperator })
              }
            >
              <SelectTrigger className="bg-white">
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
          <div className="space-y-1">
            <Label className="text-xs text-indigo-900">
              {filters.gfmOperator === "between" ? "GFM min" : "Valeur GFM"}
            </Label>
            <Input
              type="number"
              step="0.01"
              className="bg-white"
              placeholder="ex. 4"
              value={filters.gfmValue}
              onChange={(e) => patch({ gfmValue: e.target.value })}
              disabled={filters.gfmOperator === "any"}
            />
          </div>
          {filters.gfmOperator === "between" ? (
            <div className="space-y-1">
              <Label className="text-xs text-indigo-900">GFM max</Label>
              <Input
                type="number"
                step="0.01"
                className="bg-white"
                placeholder="ex. 9"
                value={filters.gfmValueMax}
                onChange={(e) => patch({ gfmValueMax: e.target.value })}
              />
            </div>
          ) : null}
          <p className="text-xs text-indigo-800 md:col-span-2">
            Exemple : « Inférieur à » + 4 affiche tous les risques avec GFM &lt; 4 (P3).
            Les filtres se cumulent (logique ET), comme dans Excel.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">{resultCount} risque(s) affiché(s)</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(emptyRiskEvaluationFilters());
              onSearchChange("");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
