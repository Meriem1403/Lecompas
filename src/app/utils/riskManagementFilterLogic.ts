import { getPriorityBandFromGfm, getRiskWorkflowStatusLabel } from "@/app/services/riskPriority";
import type { Risk } from "@/app/components/admin/RisksManagementView";

export type RiskManagementColumnKey =
  | "numeroRisque"
  | "title"
  | "unite"
  | "domain"
  | "service"
  | "site"
  | "responsable"
  | "situation"
  | "associatedRisk"
  | "severity"
  | "probability"
  | "calculPriorite"
  | "moyenMaitrise"
  | "riskLevel"
  | "priorityBand"
  | "prioriteFinale"
  | "existingMeasures"
  | "plannedMeasures"
  | "progress"
  | "echeance"
  | "retourAction"
  | "observation"
  | "status";

export type ColumnFilterKind = "text" | "number" | "date";

export type ColumnConditionOperator =
  | "none"
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between";

export interface ColumnFilterState {
  values: string[] | null;
  operator: ColumnConditionOperator;
  query: string;
  queryTo: string;
}

export type RiskManagementColumnFilters = Record<RiskManagementColumnKey, ColumnFilterState>;

export const RISK_MANAGEMENT_FILTERABLE_COLUMNS: Array<{
  key: RiskManagementColumnKey;
  label: string;
  minWidth: string;
}> = [
  { key: "numeroRisque", label: "N° risque", minWidth: "130px" },
  { key: "title", label: "Risque", minWidth: "200px" },
  { key: "unite", label: "Unité", minWidth: "120px" },
  { key: "domain", label: "Domaine", minWidth: "140px" },
  { key: "service", label: "Service", minWidth: "150px" },
  { key: "site", label: "Site", minWidth: "120px" },
  { key: "responsable", label: "Responsable", minWidth: "150px" },
  { key: "situation", label: "Situation dangereuse", minWidth: "250px" },
  { key: "associatedRisk", label: "Dommages associés", minWidth: "250px" },
  { key: "severity", label: "Gravité", minWidth: "80px" },
  { key: "probability", label: "Fréquence", minWidth: "100px" },
  { key: "calculPriorite", label: "Priorité initiale", minWidth: "120px" },
  { key: "moyenMaitrise", label: "Moyen de maîtrise", minWidth: "150px" },
  { key: "riskLevel", label: "Niveau GFM", minWidth: "120px" },
  { key: "priorityBand", label: "P1/P2/P3", minWidth: "90px" },
  { key: "prioriteFinale", label: "Priorité finale", minWidth: "120px" },
  { key: "existingMeasures", label: "Mesures existantes", minWidth: "200px" },
  { key: "plannedMeasures", label: "Actions planifiées", minWidth: "200px" },
  { key: "progress", label: "Avancement", minWidth: "130px" },
  { key: "echeance", label: "Échéance", minWidth: "110px" },
  { key: "retourAction", label: "Retour d'action", minWidth: "200px" },
  { key: "observation", label: "Observation", minWidth: "200px" },
  { key: "status", label: "Statut", minWidth: "100px" },
];

const numberColumns = new Set<RiskManagementColumnKey>([
  "numeroRisque",
  "severity",
  "probability",
  "calculPriorite",
  "riskLevel",
  "prioriteFinale",
  "progress",
]);

export function columnFilterKind(key: RiskManagementColumnKey): ColumnFilterKind {
  if (key === "echeance") return "date";
  if (numberColumns.has(key)) return "number";
  return "text";
}

export const emptyColumnFilterState = (): ColumnFilterState => ({
  values: null,
  operator: "none",
  query: "",
  queryTo: "",
});

export function formatMoyenMaitriseLabel(value?: string): string {
  if (value === "0.75") return "En cours (0,75)";
  if (value === "0.5") return "Finalisé (0,5)";
  return "Aucun (1)";
}

export const emptyRiskManagementColumnFilters = (): RiskManagementColumnFilters =>
  Object.fromEntries(
    RISK_MANAGEMENT_FILTERABLE_COLUMNS.map((col) => [col.key, emptyColumnFilterState()]),
  ) as RiskManagementColumnFilters;

function splitCsv(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function includesAnySelected(selected: string[] | null, values: string[]): boolean {
  if (selected === null) return true;
  if (selected.length === 0) return false;
  if (values.length === 0) return selected.includes("");
  return values.some((value) => selected.includes(value));
}

function getColumnValues(risk: Risk, key: RiskManagementColumnKey): string[] {
  switch (key) {
    case "numeroRisque":
      return [risk.numeroRisque || ""];
    case "title":
      return [risk.title || ""];
    case "unite":
      return [risk.unite || ""];
    case "domain":
      return [risk.domain || risk.unite || ""];
    case "service":
      return splitCsv(risk.service);
    case "site":
      return splitCsv(risk.site);
    case "responsable":
      return splitCsv(risk.responsable);
    case "situation":
      return [risk.situation || ""];
    case "associatedRisk":
      return [risk.associatedRisk || ""];
    case "severity":
      return [String(risk.severity)];
    case "probability":
      return [String(risk.probability)];
    case "calculPriorite":
      return [String(risk.calculPriorite)];
    case "moyenMaitrise":
      return [risk.moyenMaitrise || ""];
    case "riskLevel":
      return [String(risk.riskLevel)];
    case "priorityBand":
      return [getPriorityBandFromGfm(risk.riskLevel)];
    case "prioriteFinale":
      return [String(risk.prioriteFinale)];
    case "existingMeasures":
      return risk.existingMeasures?.length ? risk.existingMeasures : [""];
    case "plannedMeasures":
      return risk.plannedMeasures?.length
        ? risk.plannedMeasures.map((measure) => measure.description || "")
        : [""];
    case "progress": {
      const total = risk.plannedMeasures?.length || 0;
      const completed = risk.plannedMeasures?.filter((measure) => measure.status === "completed").length || 0;
      return [total > 0 ? String(Math.round((completed / total) * 100)) : "0"];
    }
    case "status":
      return [risk.status || ""];
    case "echeance":
      return [risk.echeance || ""];
    case "retourAction":
      return [risk.retourAction || ""];
    case "observation":
      return [risk.observation || ""];
    default:
      return [];
  }
}

export function getColumnFilterLabel(key: RiskManagementColumnKey, value: string): string {
  if (!value) return "(vide)";
  if (key === "moyenMaitrise") return formatMoyenMaitriseLabel(value);
  if (key === "status") return getRiskWorkflowStatusLabel(value as Risk["status"]);
  if (key === "echeance") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
  }
  if (key === "progress") return `${value} %`;
  return value;
}

function parseFilterNumber(value: string): number | null {
  const normalized = value.trim().replace("%", "").replace(",", ".");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseFilterDate(value: string): string {
  const trimmed = value.trim();
  const french = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (french) {
    const [, day, month, year] = french;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed.slice(0, 10);
}

function matchesCondition(
  key: RiskManagementColumnKey,
  values: string[],
  filter: ColumnFilterState,
): boolean {
  if (filter.operator === "none" || !filter.query.trim()) return true;
  const kind = columnFilterKind(key);
  return values.some((value) => {
    const displayed = getColumnFilterLabel(key, value).toLocaleLowerCase("fr");
    const query = filter.query.trim().toLocaleLowerCase("fr");
    const queryTo = filter.queryTo.trim().toLocaleLowerCase("fr");
    if (kind === "number") {
      const current = parseFilterNumber(value);
      const min = parseFilterNumber(filter.query);
      const max = parseFilterNumber(filter.queryTo);
      if (current === null || min === null) return false;
      switch (filter.operator) {
        case "equals":
          return current === min;
        case "notEquals":
          return current !== min;
        case "gt":
          return current > min;
        case "gte":
          return current >= min;
        case "lt":
          return current < min;
        case "lte":
          return current <= min;
        case "between":
          return max !== null && current >= Math.min(min, max) && current <= Math.max(min, max);
        default:
          return displayed.includes(query);
      }
    }
    if (kind === "date") {
      const current = parseFilterDate(value);
      const min = parseFilterDate(filter.query);
      const max = parseFilterDate(filter.queryTo);
      if (!current || !min) return false;
      switch (filter.operator) {
        case "equals":
          return current === min;
        case "notEquals":
          return current !== min;
        case "gt":
          return current > min;
        case "lt":
          return current < min;
        case "between":
          return Boolean(max) && current >= (min < max ? min : max) && current <= (min < max ? max : min);
        default:
          return displayed.includes(query);
      }
    }
    switch (filter.operator) {
      case "equals":
        return displayed === query;
      case "notEquals":
        return displayed !== query;
      case "startsWith":
        return displayed.startsWith(query);
      case "endsWith":
        return displayed.endsWith(query);
      case "notContains":
        return !displayed.includes(query);
      case "contains":
        return displayed.includes(query);
      default:
        return true;
    }
  });
}

export function buildColumnFilterOptions(
  risks: Risk[],
  key: RiskManagementColumnKey,
): Array<{ value: string; label: string }> {
  const seen = new Map<string, string>();
  risks.forEach((risk) => {
    getColumnValues(risk, key).forEach((value) => {
      const normalized = value || "";
      if (!seen.has(normalized)) {
        seen.set(normalized, getColumnFilterLabel(key, normalized));
      }
    });
  });
  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => String(a.label ?? "").localeCompare(String(b.label ?? ""), "fr"));
}

export function matchesRiskManagementColumnFilters(
  risk: Risk,
  filters: RiskManagementColumnFilters,
): boolean {
  return RISK_MANAGEMENT_FILTERABLE_COLUMNS.every(({ key }) => {
    const filter = filters[key];
    const values = getColumnValues(risk, key);
    return includesAnySelected(filter.values, values) && matchesCondition(key, values, filter);
  });
}

export function hasActiveRiskManagementColumnFilters(
  filters: RiskManagementColumnFilters,
): boolean {
  return RISK_MANAGEMENT_FILTERABLE_COLUMNS.some(({ key }) => {
    const filter = filters[key];
    return filter.values !== null || (filter.operator !== "none" && filter.query.trim().length > 0);
  });
}

export function compareRiskColumn(
  left: Risk,
  right: Risk,
  key: RiskManagementColumnKey,
  direction: "asc" | "desc",
): number {
  const leftValue = getColumnValues(left, key)[0] || "";
  const rightValue = getColumnValues(right, key)[0] || "";
  const kind = columnFilterKind(key);
  let result = 0;
  if (kind === "number") {
    result = (parseFilterNumber(leftValue) ?? 0) - (parseFilterNumber(rightValue) ?? 0);
  } else if (kind === "date") {
    result = parseFilterDate(leftValue).localeCompare(parseFilterDate(rightValue));
  } else {
    result = getColumnFilterLabel(key, leftValue).localeCompare(
      getColumnFilterLabel(key, rightValue),
      "fr",
      { numeric: true, sensitivity: "base" },
    );
  }
  return direction === "asc" ? result : -result;
}

export function matchesRiskManagementSearch(risk: Risk, searchQuery: string): boolean {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    risk.numeroRisque,
    risk.title,
    risk.service,
    risk.domain,
    risk.unite,
    risk.site,
    risk.responsable,
    risk.situation,
    risk.associatedRisk,
    risk.echeance,
    risk.retourAction,
    risk.observation,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}
