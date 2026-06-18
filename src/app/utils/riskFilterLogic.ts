import { getPriorityBandFromGfm } from "@/app/services/riskPriority";

export type GfmCompareOperator = "any" | "lt" | "lte" | "gt" | "gte" | "eq" | "between";

export interface RiskEvaluationFilters {
  services: string[];
  domains: string[];
  sites: string[];
  statuses: string[];
  riskNumbers: string[];
  priorityBands: Array<"P1" | "P2" | "P3">;
  gfmLevels: string[];
  gfmOperator: GfmCompareOperator;
  gfmValue: string;
  gfmValueMax: string;
  severities: string[];
  frequencies: string[];
  responsables: string[];
}

export const emptyRiskEvaluationFilters = (): RiskEvaluationFilters => ({
  services: [],
  domains: [],
  sites: [],
  statuses: [],
  riskNumbers: [],
  priorityBands: [],
  gfmLevels: [],
  gfmOperator: "any",
  gfmValue: "",
  gfmValueMax: "",
  severities: [],
  frequencies: [],
  responsables: [],
});

interface RiskLike {
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
  title: string;
  situation: string;
  associatedRisk: string;
}

function includesAny(selected: string[], value: string) {
  if (selected.length === 0) return true;
  return selected.includes(value);
}

function includesAnyInCsv(selected: string[], raw?: string) {
  if (selected.length === 0) return true;
  const values = (raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.some((value) => selected.includes(value));
}

function matchesGfmComparison(level: number, operator: GfmCompareOperator, minRaw: string, maxRaw: string) {
  if (operator === "any") return true;
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (!Number.isFinite(min) && operator !== "between") return true;
  switch (operator) {
    case "lt":
      return Number.isFinite(min) ? level < min : true;
    case "lte":
      return Number.isFinite(min) ? level <= min : true;
    case "gt":
      return Number.isFinite(min) ? level > min : true;
    case "gte":
      return Number.isFinite(min) ? level >= min : true;
    case "eq":
      return Number.isFinite(min) ? level === min : true;
    case "between":
      if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
      return level >= min && level <= max;
    default:
      return true;
  }
}

export function matchesRiskEvaluationFilters(
  risk: RiskLike,
  filters: RiskEvaluationFilters,
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase();
  if (query.length > 0) {
    const haystack = [
      risk.title,
      risk.situation,
      risk.associatedRisk,
      risk.responsable,
      risk.service,
      risk.domain || risk.unite,
      risk.site,
      risk.numeroRisque,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (!includesAnyInCsv(filters.services, risk.service)) return false;
  if (!includesAnyInCsv(filters.domains, risk.domain || risk.unite)) return false;
  if (!includesAnyInCsv(filters.sites, risk.site)) return false;
  if (!includesAny(filters.statuses, risk.status)) return false;
  if (!includesAny(filters.riskNumbers, risk.numeroRisque)) return false;
  if (!includesAny(filters.severities, String(risk.severity))) return false;
  if (!includesAny(filters.frequencies, String(risk.probability))) return false;

  if (filters.responsables.length > 0) {
    const responsibles = risk.responsable
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (!responsibles.some((name) => filters.responsables.includes(name))) {
      return false;
    }
  }

  if (filters.priorityBands.length > 0) {
    const band = getPriorityBandFromGfm(risk.riskLevel);
    if (!filters.priorityBands.includes(band)) return false;
  }

  if (filters.gfmLevels.length > 0) {
    const levelKey = String(risk.riskLevel);
    if (!filters.gfmLevels.includes(levelKey)) return false;
  }

  if (
    !matchesGfmComparison(
      risk.riskLevel,
      filters.gfmOperator,
      filters.gfmValue,
      filters.gfmValueMax,
    )
  ) {
    return false;
  }

  return true;
}

export function hasActiveRiskFilters(filters: RiskEvaluationFilters, searchQuery: string) {
  return (
    searchQuery.trim().length > 0 ||
    filters.services.length > 0 ||
    filters.domains.length > 0 ||
    filters.sites.length > 0 ||
    filters.statuses.length > 0 ||
    filters.riskNumbers.length > 0 ||
    filters.priorityBands.length > 0 ||
    filters.gfmLevels.length > 0 ||
    filters.severities.length > 0 ||
    filters.frequencies.length > 0 ||
    filters.responsables.length > 0 ||
    filters.gfmOperator !== "any"
  );
}
