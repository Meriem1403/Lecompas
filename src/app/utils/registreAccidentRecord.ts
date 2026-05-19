import {
  EMPTY_ACCIDENT_EXTENDED,
  type AccidentDuerpRiskRef,
} from "@/app/utils/accidentRecord";
import type { AccidentExtendedValues } from "@/app/components/AccidentExtendedFields";

/** Champs alignés Papripact / module accidentologie pour le registre bénin */
export interface RegistreAccidentExtended {
  categorieAccident: string;
  typeAccidentNature: string;
  typeLegal: "" | "travail" | "trajet" | "maladie_pro";
  descriptionFaits: string;
  causes: string;
  analyseCauses: string;
  commentaires: string;
  duerpRiskId: string;
  duerpRiskFreeText: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
}

export const EMPTY_REGISTRE_EXTENDED: RegistreAccidentExtended = {
  categorieAccident: "",
  typeAccidentNature: "",
  typeLegal: "",
  descriptionFaits: "",
  causes: "",
  analyseCauses: "",
  commentaires: "",
  duerpRiskId: "",
  duerpRiskFreeText: "",
};

export function registreToExtendedValues(
  data: RegistreAccidentExtended & { prenomVictime: string; nomVictime: string; circonstances: string },
): AccidentExtendedValues {
  return {
    accidentCategory: data.categorieAccident,
    accidentEventType: data.typeAccidentNature,
    victimFirstName: data.prenomVictime,
    victimLastName: data.nomVictime,
    circumstances: data.circonstances,
    accidentCauses: data.causes,
    causeAnalysis: data.analyseCauses,
    comments: data.commentaires,
    duerpRiskId: data.duerpRiskId,
    duerpRiskFreeText: data.duerpRiskFreeText,
  };
}

export function patchRegistreFromExtended(
  patch: Partial<AccidentExtendedValues>,
): Partial<RegistreAccidentExtended & { prenomVictime?: string; nomVictime?: string; circonstances?: string }> {
  const out: Partial<
    RegistreAccidentExtended & { prenomVictime?: string; nomVictime?: string; circonstances?: string }
  > = {};
  if (patch.accidentCategory !== undefined) out.categorieAccident = patch.accidentCategory;
  if (patch.accidentEventType !== undefined) out.typeAccidentNature = patch.accidentEventType;
  if (patch.victimFirstName !== undefined) out.prenomVictime = patch.victimFirstName;
  if (patch.victimLastName !== undefined) out.nomVictime = patch.victimLastName;
  if (patch.circumstances !== undefined) out.circumstances = patch.circumstances;
  if (patch.accidentCauses !== undefined) out.causes = patch.accidentCauses;
  if (patch.causeAnalysis !== undefined) out.analyseCauses = patch.causeAnalysis;
  if (patch.comments !== undefined) out.commentaires = patch.comments;
  if (patch.duerpRiskId !== undefined) out.duerpRiskId = patch.duerpRiskId;
  if (patch.duerpRiskFreeText !== undefined) out.duerpRiskFreeText = patch.duerpRiskFreeText;
  return out;
}

export function normalizeRegistreAccident<T extends RegistreAccidentExtended>(
  accident: T,
  risks?: AccidentDuerpRiskRef[],
): T {
  const linked = accident.duerpRiskId
    ? risks?.find((r) => r.id === accident.duerpRiskId)
    : undefined;
  return {
    ...accident,
    duerpRiskNumber: linked?.numeroRisque ?? accident.duerpRiskNumber,
    duerpRiskLabel: linked?.title ?? accident.duerpRiskLabel,
  };
}

export { EMPTY_ACCIDENT_EXTENDED };
