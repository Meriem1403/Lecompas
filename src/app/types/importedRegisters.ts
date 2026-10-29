export interface RegisterAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export type AsbestosRegisterRowKind =
  | "synthese"
  | "controle"
  | "historique"
  | "materiau";

export interface AsbestosRegisterRow {
  id: string;
  kind: AsbestosRegisterRowKind;
  attachments: RegisterAttachment[];
  materiau?: string;
  localisation?: string;
  description?: string;
  score?: string;
  dateControle?: string;
  lieuZone?: string;
  typeControle?: string;
  zoneRetrait?: string;
  zonesPresence?: string;
  zonesNonAmiantees?: string;
  action?: string;
  prochaineEcheance?: string;
  rawCol1?: string;
  rawCol2?: string;
  rawCol3?: string;
  rawCol4?: string;
  rawCol5?: string;
  rawCol6?: string;
  rawCol7?: string;
  rawCol8?: string;
  rawCol9?: string;
  zoneMateriau?: string;
  datePremierReperage?: string;
  typeAnalyse?: string;
  dernierControle?: string;
  scoreActuel?: string;
  actionsRealisees?: string;
  retraitRealise?: string;
  actionAPrevoir?: string;
  statutMateriau?: string;
}

export interface AsbestosSiteDtaRow {
  id: string;
  departement: string;
  site: string;
  dateDernierControle: string;
  acces: string;
  commentaires: string;
  dtaStatut: string;
  attachments: RegisterAttachment[];
}

export interface AccidentYearIndicator {
  year: number;
  nbAccidents: number;
  sansArret: number;
  avecArret: number;
}

export interface AccidentCauseYearIndicator {
  cause: string;
  year: number;
  nbAccidents: number;
  sansArret: number;
  avecArret: number;
  joursArret: number;
}

export interface AccidentSuiviIndicateurs {
  byYear: AccidentYearIndicator[];
  byCauseYear: AccidentCauseYearIndicator[];
  importedAt?: string;
}
