import { DEFAULT_DROPDOWN_DATA } from "@/app/components/DropdownManagerView";

export const ACCIDENT_CATEGORY_OPTIONS = [...DEFAULT_DROPDOWN_DATA.categorieAccident];
export const ACCIDENT_EVENT_TYPE_OPTIONS = [...DEFAULT_DROPDOWN_DATA.typeAccident];

export interface AccidentDuerpRiskRef {
  id: string;
  numeroRisque: string;
  title: string;
}

export const EMPTY_ACCIDENT_EXTENDED = {
  accidentCategory: "",
  accidentEventType: "",
  victimFirstName: "",
  victimLastName: "",
  circumstances: "",
  accidentCauses: "",
  causeAnalysis: "",
  comments: "",
  duerpRiskId: "",
  duerpRiskFreeText: "",
} as const;

export function mapRisksToDuerpRefs(
  risks: Array<{ id: string; numeroRisque: string; title: string }>,
): AccidentDuerpRiskRef[] {
  return risks.map((r) => ({
    id: r.id,
    numeroRisque: r.numeroRisque,
    title: r.title,
  }));
}

export function buildVictimFullName(firstName?: string, lastName?: string, fallback?: string): string {
  const full = `${(firstName ?? "").trim()} ${(lastName ?? "").trim()}`.trim();
  return full || (fallback ?? "").trim();
}

export function splitVictimName(fullName?: string): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function normalizeAccidentRecord<T extends {
  victim?: string;
  victimFirstName?: string;
  victimLastName?: string;
  duerpRiskId?: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
}>(accident: T, risks?: AccidentDuerpRiskRef[]): T {
  const victim = buildVictimFullName(
    accident.victimFirstName,
    accident.victimLastName,
    accident.victim,
  );
  const split = splitVictimName(victim);
  const linked = accident.duerpRiskId
    ? risks?.find((r) => r.id === accident.duerpRiskId)
    : undefined;
  return {
    ...accident,
    victim,
    victimFirstName: accident.victimFirstName?.trim() || split.firstName,
    victimLastName: accident.victimLastName?.trim() || split.lastName,
    duerpRiskNumber: linked?.numeroRisque ?? accident.duerpRiskNumber,
    duerpRiskLabel: linked?.title ?? accident.duerpRiskLabel,
  };
}

export function validateAccidentCore(accident: {
  title?: string;
  victim?: string;
  victimFirstName?: string;
  victimLastName?: string;
  location?: string;
}): string | null {
  if (!accident.title?.trim()) return "Indiquez un titre pour l'accident.";
  const victim = buildVictimFullName(
    accident.victimFirstName,
    accident.victimLastName,
    accident.victim,
  );
  if (!victim) return "Indiquez le nom et le prénom de la victime.";
  if (!accident.location?.trim()) return "Indiquez le lieu de l'accident.";
  return null;
}

export function getLegalTypeLabel(type: string): string {
  switch (type) {
    case "trajet":
      return "Accident de trajet";
    case "maladie_pro":
      return "Maladie professionnelle";
    default:
      return "Accident du travail";
  }
}
