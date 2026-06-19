export interface RiskMeasure {
  description: string;
  responsible: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
}

export interface PlanRiskEvaluationRow {
  id: string;
  linkedEvaluationRiskId: string;
  evaluationRiskFreeText: string;
  domaine: string;
  natureRisques: string;
  mesuresPrevention: string;
}

export interface PlanCoIntervenantRow {
  id: string;
  qualite: string;
  denomination: string;
  adresse: string;
  contactNom: string;
  contactEmail: string;
  complements: string;
}

export interface PlanAnnexAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
}

export interface RiskInput {
  id: string;
  numeroRisque: string;
  title: string;
  service: string;
  domain?: string;
  site: string;
  responsable: string;
  riskLevel: number;
  plannedMeasures: RiskMeasure[];
  situation?: string;
  associatedRisk?: string;
  existingMeasures?: string[];
}

export interface PlanProtocolFields {
  protocoleTitle: string;
  codeTravailReference: string;
  operationType: string;
  coIntervenantRows: PlanCoIntervenantRow[];
  prestationNature: string;
  lieuLivraison: string;
  materielsSpecifiques: string;
  consignesSite: string;
  consignesOperation: string;
  evaluationRisques: string;
  riskEvaluationRows: PlanRiskEvaluationRow[];
  personnesAPrevenir: string;
  mesuresUrgence: string;
  planTransmis: string;
  transmissionCelluleSecurite: string;
  transmissionCorrespondantSite: string;
  transmissionCorrespondantAPB: string;
  transmissionCelluleSecuriteStatus: "non_renseigne" | "oui" | "non";
  transmissionCorrespondantSiteStatus: "non_renseigne" | "oui" | "non";
  transmissionCorrespondantAPBStatus: "non_renseigne" | "oui" | "non";
  transmissionCelluleSecuriteNom: string;
  transmissionCorrespondantSiteNom: string;
  transmissionCorrespondantAPBNom: string;
  transmissionCelluleSecuriteObs: string;
  transmissionCorrespondantSiteObs: string;
  transmissionCorrespondantAPBObs: string;
  observationsTransmission: string;
  observationsRemarques: string;
  signatureEntite1: string;
  signatureNom1: string;
  signaturePrenom1: string;
  signatureDate1: string;
  signatureEntite2: string;
  signatureNom2: string;
  signaturePrenom2: string;
  signatureDate2: string;
  signatureEntite3: string;
  signatureNom3: string;
  signaturePrenom3: string;
  signatureDate3: string;
  signatureDematerialiseeUrl1: string;
  signatureDematerialiseeUrl2: string;
  signatureDematerialiseeUrl3: string;
  planCirculation: string;
  materielRemplacer: string;
  annexAttachments: PlanAnnexAttachment[];
  annexesDocuments: string;
}

export type PlanStatus = "a_lancer" | "en_cours" | "termine";

export interface PlanRecord {
  id: string;
  riskId: string;
  riskNumber: string;
  riskTitle: string;
  service: string;
  domain: string;
  location: string;
  owner: string;
  dueDate: string;
  priority: "haute" | "moyenne" | "basse";
  status: PlanStatus;
  objective: string;
  actions: string[];
  protocol: PlanProtocolFields;
  updatedAt: string;
}
