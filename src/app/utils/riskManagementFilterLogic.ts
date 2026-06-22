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
  | "status"
  | "echeance";

export type RiskManagementColumnFilters = Record<RiskManagementColumnKey, string[]>;

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
  { key: "status", label: "Statut", minWidth: "100px" },
  { key: "echeance", label: "Échéance", minWidth: "110px" },
];

export function formatMoyenMaitriseLabel(value?: string): string {
  if (value === "0.75") return "En cours (0,75)";
  if (value === "0.5") return "Finalisé (0,5)";
  return "Aucun (1)";
}

export const emptyRiskManagementColumnFilters = (): RiskManagementColumnFilters =>
  Object.fromEntries(
    RISK_MANAGEMENT_FILTERABLE_COLUMNS.map((col) => [col.key, []]),
  ) as RiskManagementColumnFilters;

function splitCsv(value?: string): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function includesAnySelected(selected: string[], values: string[]): boolean {
  if (selected.length === 0) return true;
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
    case "status":
      return [risk.status || ""];
    case "echeance":
      return [risk.echeance || ""];
    default:
      return [];
  }
}

export function getColumnFilterLabel(key: RiskManagementColumnKey, value: string): string {
  if (!value) return "(vide)";
  if (key === "moyenMaitrise") return formatMoyenMaitriseLabel(value);
  if (key === "status") return getRiskWorkflowStatusLabel(value as Risk["status"]);
  if (key === "priorityBand") return value;
  return value;
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
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function matchesRiskManagementColumnFilters(
  risk: Risk,
  filters: RiskManagementColumnFilters,
): boolean {
  return RISK_MANAGEMENT_FILTERABLE_COLUMNS.every(({ key }) => {
    const selected = filters[key];
    return includesAnySelected(selected, getColumnValues(risk, key));
  });
}

export function hasActiveRiskManagementColumnFilters(
  filters: RiskManagementColumnFilters,
): boolean {
  return RISK_MANAGEMENT_FILTERABLE_COLUMNS.some(({ key }) => filters[key].length > 0);
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
