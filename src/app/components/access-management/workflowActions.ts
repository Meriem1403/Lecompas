import { ACCESS_MODULES } from "./constants";

/** Action de circuit, distincte du CRUD. `seats` = nombre de personnes à désigner (0 = droit ouvert). */
export interface WorkflowActionDef {
  id: string;
  label: string;
  seats: number;
}

export type WorkflowAssignments = Record<string, Record<string, string[]>>;

export const EMPTY_WORKFLOW_ASSIGNMENTS: WorkflowAssignments = {};

const MODULE_WORKFLOW_ACTIONS: Record<string, WorkflowActionDef[]> = {
  dashboard: [{ id: "diffuser", label: "Diffuser le tableau de bord", seats: 1 }],
  team: [{ id: "consulter", label: "Consulter une fiche", seats: 0 }],
  "access-management": [{ id: "designer", label: "Désigner les responsables", seats: 1 }],
  actualites: [{ id: "publier", label: "Publier une actualité", seats: 1 }],
  risks: [
    { id: "proposer", label: "Proposer une évaluation", seats: 0 },
    { id: "valider", label: "Valider l'évaluation", seats: 2 },
  ],
  "risk-awareness": [
    { id: "enregistrer", label: "Enregistrer une sensibilisation", seats: 0 },
    { id: "viser", label: "Viser la sensibilisation", seats: 1 },
  ],
  "prevention-plan": [
    { id: "envoyer", label: "Envoyer le plan", seats: 1 },
    { id: "valider", label: "Valider le plan", seats: 2 },
  ],
  "safety-protocols": [
    { id: "envoyer", label: "Envoyer le protocole", seats: 1 },
    { id: "valider", label: "Valider le protocole", seats: 2 },
  ],
  "safety-sheets": [
    { id: "rediger", label: "Rédiger la fiche", seats: 0 },
    { id: "valider", label: "Valider la fiche", seats: 1 },
  ],
  actions: [
    { id: "proposer", label: "Proposer une action", seats: 0 },
    { id: "cloturer", label: "Clôturer une action", seats: 1 },
  ],
  documents: [{ id: "publier", label: "Publier un document", seats: 1 }],
  cerbere: [
    { id: "demander", label: "Déposer une demande", seats: 0 },
    { id: "valider", label: "Valider l'habilitation", seats: 2 },
  ],
  reservations: [
    { id: "reserver", label: "Réserver", seats: 0 },
    { id: "valider", label: "Valider la réservation", seats: 1 },
  ],
  users: [{ id: "habiliter", label: "Habiliter un compte", seats: 1 }],
  "risks-management": [{ id: "valider", label: "Valider une fiche risque", seats: 1 }],
  "risk-references": [{ id: "publier", label: "Publier une référence", seats: 1 }],
  "action-returns": [
    { id: "deposer", label: "Déposer un retour", seats: 0 },
    { id: "valider", label: "Valider le retour", seats: 2 },
  ],
  roles: [{ id: "definir", label: "Définir les circuits", seats: 1 }],
  services: [{ id: "valider", label: "Valider un rattachement", seats: 1 }],
  domains: [{ id: "valider", label: "Valider un domaine", seats: 1 }],
  locations: [{ id: "valider", label: "Valider un lieu", seats: 1 }],
  "medical-visits": [
    { id: "planifier", label: "Planifier une visite", seats: 1 },
    { id: "cloturer", label: "Clôturer le suivi", seats: 1 },
  ],
  "sst-registry": [
    { id: "consigner", label: "Consigner une remarque", seats: 0 },
    { id: "viser", label: "Viser le registre", seats: 1 },
  ],
  "arrivees-departs": [
    { id: "demander", label: "Déposer une demande", seats: 0 },
    { id: "valider", label: "Valider la demande RH", seats: 1 },
  ],
  "transport-coverage": [
    { id: "demander", label: "Déposer la demande", seats: 0 },
    { id: "certifier", label: "Certifier le cadre BRH", seats: 1 },
  ],
  accidents: [
    { id: "declarer", label: "Déclarer un accident", seats: 0 },
    { id: "valider", label: "Valider la déclaration", seats: 1 },
  ],
  registre: [{ id: "viser", label: "Viser le registre", seats: 1 }],
  archives: [{ id: "archiver", label: "Archiver un dossier", seats: 1 }],
  mercury: [
    { id: "saisir", label: "Saisir une campagne", seats: 0 },
    { id: "valider", label: "Valider les résultats", seats: 1 },
  ],
  asbestos: [
    { id: "renseigner", label: "Renseigner le suivi", seats: 0 },
    { id: "valider", label: "Valider le diagnostic", seats: 1 },
  ],
  "asbestos-attestations": [
    { id: "deposer", label: "Déposer l'attestation", seats: 0 },
    { id: "valider", label: "Valider l'attestation (secrétaire général)", seats: 1 },
  ],
  "asbestos-declarations": [
    { id: "declarer", label: "Déclarer une exposition", seats: 0 },
    { id: "valider", label: "Valider la déclaration", seats: 2 },
  ],
  "signature-duerp": [
    { id: "proposer", label: "Proposer à la signature", seats: 1 },
    { id: "signer", label: "Signer le DUERP", seats: 2 },
  ],
  settings: [{ id: "appliquer", label: "Appliquer un paramètre", seats: 1 }],
};

for (const moduleItem of ACCESS_MODULES) {
  if (!MODULE_WORKFLOW_ACTIONS[moduleItem.id]?.length) {
    throw new Error(`Circuit manquant pour le module ${moduleItem.id}`);
  }
}

export function workflowActionsFor(moduleId: string): WorkflowActionDef[] {
  return MODULE_WORKFLOW_ACTIONS[moduleId] ?? [];
}

export function blankActions(moduleId: string): Record<string, boolean> {
  return Object.fromEntries(workflowActionsFor(moduleId).map((action) => [action.id, false]));
}

export function seatLabel(seats: number): string {
  if (seats <= 0) return "";
  return seats > 1 ? `${seats} responsables` : "1 responsable";
}
