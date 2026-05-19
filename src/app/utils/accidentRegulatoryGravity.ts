import { formatAccidentDateShortFr } from "@/app/utils/accidentDateTime";

/** Gravité réglementaire (accidentologie) selon la durée d'arrêt de travail. */
export type RegulatoryGravity = "G1" | "G2" | "G3" | "G4" | "G5";

export interface AccidentWorkStoppageFields {
  hasWorkStoppage?: boolean;
  workStoppageStartDate?: string;
  workStoppageEndDate?: string;
  workStoppageDays?: number | null;
  hasReturnToWorkMedicalConditions?: boolean;
  returnToWorkMedicalConditions?: string;
  regulatoryGravity?: RegulatoryGravity;
}

export type AccidentDashboardSeverity = "bénin" | "modéré" | "grave" | "très_grave";

export const REGULATORY_GRAVITY_LABELS: Record<RegulatoryGravity, string> = {
  G1: "G1 — Pas d'arrêt de travail",
  G2: "G2 — Arrêt de 1 à 8 jours",
  G3: "G3 — Arrêt de 9 à 45 jours",
  G4: "G4 — Arrêt de 46 à 90 jours",
  G5: "G5 — Arrêt supérieur à 90 jours",
};

export const REGULATORY_GRAVITY_SHORT: Record<RegulatoryGravity, string> = {
  G1: "Sans arrêt",
  G2: "1–8 j",
  G3: "9–45 j",
  G4: "46–90 j",
  G5: "> 90 j",
};

/**
 * Seuils réglementaires (jours inclusifs par palier, sans chevauchement) :
 * G1 : 0 | G2 : 1–8 | G3 : 9–45 | G4 : 46–90 | G5 : > 90
 */
/** Jours calendaires inclusifs entre début et fin (fin = aujourd'hui si absente). */
export function computeWorkStoppageDaysFromDates(
  startDate?: string,
  endDate?: string,
): number | undefined {
  if (!startDate?.trim()) return undefined;
  const start = new Date(`${startDate.trim()}T12:00:00`);
  const end = endDate?.trim()
    ? new Date(`${endDate.trim()}T12:00:00`)
    : new Date(`${new Date().toISOString().split("T")[0]}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  if (end < start) return undefined;
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return diffDays + 1;
}

export function formatStoppagePeriodFr(
  hasWorkStoppage: boolean,
  startDate?: string,
  endDate?: string,
): string {
  if (!hasWorkStoppage) return "Pas d'arrêt de travail";
  if (!startDate?.trim()) return "Arrêt déclaré — dates non renseignées";
  const startFr = formatAccidentDateShortFr(startDate);
  if (!endDate?.trim()) return `Du ${startFr} — arrêt en cours`;
  return `Du ${startFr} au ${formatAccidentDateShortFr(endDate)}`;
}

export function computeRegulatoryGravity(
  hasWorkStoppage: boolean,
  workStoppageDays?: number | null,
): RegulatoryGravity {
  if (!hasWorkStoppage) return "G1";
  const days = Math.max(0, Math.floor(Number(workStoppageDays) || 0));
  if (days === 0) return "G1";
  if (days <= 8) return "G2";
  if (days <= 45) return "G3";
  if (days <= 90) return "G4";
  return "G5";
}

export function getRegulatoryGravityBadgeClass(g: RegulatoryGravity): string {
  switch (g) {
    case "G1":
      return "bg-emerald-600 text-white";
    case "G2":
      return "bg-lime-600 text-white";
    case "G3":
      return "bg-amber-500 text-white";
    case "G4":
      return "bg-orange-600 text-white";
    default:
      return "bg-red-700 text-white";
  }
}

export function normalizeAccidentStoppageFields(accident: AccidentWorkStoppageFields): {
  hasWorkStoppage: boolean;
  workStoppageStartDate: string | undefined;
  workStoppageEndDate: string | undefined;
  workStoppageDays: number | undefined;
  hasReturnToWorkMedicalConditions: boolean;
  returnToWorkMedicalConditions: string | undefined;
  regulatoryGravity: RegulatoryGravity;
} {
  const hasWorkStoppage = Boolean(accident.hasWorkStoppage);
  const workStoppageStartDate = accident.workStoppageStartDate?.trim() || undefined;
  const workStoppageEndDate = accident.workStoppageEndDate?.trim() || undefined;
  const daysFromDates = hasWorkStoppage
    ? computeWorkStoppageDaysFromDates(workStoppageStartDate, workStoppageEndDate)
    : undefined;
  const workStoppageDays =
    daysFromDates ??
    (accident.workStoppageDays != null && !Number.isNaN(Number(accident.workStoppageDays))
      ? Math.max(0, Math.floor(Number(accident.workStoppageDays)))
      : undefined);
  const hasReturnToWorkMedicalConditions = Boolean(accident.hasReturnToWorkMedicalConditions);
  const returnToWorkMedicalConditions =
    accident.returnToWorkMedicalConditions?.trim() || undefined;
  const regulatoryGravity =
    accident.regulatoryGravity ??
    computeRegulatoryGravity(hasWorkStoppage, workStoppageDays);
  return {
    hasWorkStoppage,
    workStoppageStartDate,
    workStoppageEndDate,
    workStoppageDays,
    hasReturnToWorkMedicalConditions,
    returnToWorkMedicalConditions,
    regulatoryGravity,
  };
}

export function enrichAccidentWithRegulatoryGravity<T extends AccidentWorkStoppageFields>(
  accident: T,
): T & ReturnType<typeof normalizeAccidentStoppageFields> {
  const normalized = normalizeAccidentStoppageFields(accident);
  return {
    ...accident,
    hasWorkStoppage: normalized.hasWorkStoppage,
    workStoppageStartDate: normalized.hasWorkStoppage
      ? normalized.workStoppageStartDate
      : undefined,
    workStoppageEndDate: normalized.hasWorkStoppage
      ? normalized.workStoppageEndDate
      : undefined,
    workStoppageDays: normalized.hasWorkStoppage ? normalized.workStoppageDays : undefined,
    hasReturnToWorkMedicalConditions: normalized.hasReturnToWorkMedicalConditions,
    returnToWorkMedicalConditions: normalized.hasReturnToWorkMedicalConditions
      ? normalized.returnToWorkMedicalConditions
      : undefined,
    regulatoryGravity: normalized.regulatoryGravity,
  };
}
