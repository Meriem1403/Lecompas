export interface ActionReturnFixture {
  id: string;
  riskId: string;
  riskTitle: string;
  proposedBy: string;
  proposedDate: string;
  proposedMeasure: string;
  justification: string;
  status:
    | "pending"
    | "validated_add"
    | "validated_replace"
    | "rejected";
  reviewedBy?: string;
  reviewedDate?: string;
  reviewComment?: string;
  targetMeasureIndex?: number;
  targetMeasureText?: string;
}

export const ACTION_RETURN_FIXTURES: ActionReturnFixture[] = [
  {
    id: "ar1",
    riskId: "1",
    riskTitle: "Risque de chute sur sol glissant",
    proposedBy: "Chef de Service Maritime",
    proposedDate: "2026-02-01T10:30:00",
    proposedMeasure:
      "Installation de tapis antidérapants dans les zones à risque",
    justification:
      "Les panneaux de signalisation sont insuffisants. J'ai constaté que plusieurs agents ont failli glisser malgré les panneaux. L'ajout de tapis antidérapants réduirait significativement le risque.",
    status: "pending",
  },
  {
    id: "ar2",
    riskId: "2",
    riskTitle: "Exposition aux produits chimiques",
    proposedBy: "Chef de Service Technique",
    proposedDate: "2026-01-28T14:20:00",
    proposedMeasure:
      "Système de ventilation automatique avec détecteurs de gaz",
    justification:
      "La ventilation naturelle n'est pas suffisante pendant les périodes de forte chaleur. Un système automatique garantirait une extraction continue des vapeurs.",
    status: "validated_replace",
    targetMeasureIndex: 0,
    targetMeasureText: "Ventilation naturelle des locaux",
    reviewedBy: "Administrateur Démo",
    reviewedDate: "2026-01-29T09:15:00",
    reviewComment:
      "Excellente proposition. La ventilation automatique offre une meilleure protection.",
  },
  {
    id: "ar3",
    riskId: "5",
    riskTitle: "Risque lié au poste en télétravail",
    proposedBy: "Bernard Lemoine",
    proposedDate: "2025-12-11T11:30:00",
    proposedMeasure:
      "Mise en place d'un système de validation hebdomadaire des postures de travail par visioconférence avec un ergonome",
    justification:
      "La formation seule ne suffit pas. Un suivi régulier permettrait de corriger les mauvaises postures avant qu'elles ne deviennent problématiques.",
    status: "pending",
  },
  {
    id: "ar4",
    riskId: "3",
    riskTitle: "Risque électrique sur équipements",
    proposedBy: "Chef de Service Maintenance",
    proposedDate: "2026-01-25T16:45:00",
    proposedMeasure:
      "Formation spécialisée aux habilitations électriques pour tous les agents",
    justification:
      "Suite à un audit, il apparaît que certains agents manipulent des équipements électriques sans formation adéquate.",
    status: "rejected",
    reviewedBy: "Administrateur Démo",
    reviewedDate: "2026-01-26T11:00:00",
    reviewComment: "Budget 2026 déjà alloué. Proposition à revoir pour 2027.",
  },
  {
    id: "ar5",
    riskId: "5",
    riskTitle: "Risque lié au poste en télétravail",
    proposedBy: "Bernard Lemoine",
    proposedDate: "2025-12-11T10:44:00",
    proposedMeasure:
      "Installation de filtres anti-lumière bleue sur tous les écrans",
    justification:
      "Plusieurs agents se plaignent de fatigue oculaire. Les filtres anti-lumière bleue pourraient améliorer le confort visuel.",
    status: "validated_add",
    reviewedBy: "Administrateur Démo",
    reviewedDate: "2025-12-11T11:18:00",
    reviewComment: "",
  },
  {
    id: "ar6",
    riskId: "5",
    riskTitle: "Risque lié au poste en télétravail",
    proposedBy: "Bernard Lemoine",
    proposedDate: "2025-12-11T11:30:00",
    proposedMeasure:
      "Organisation de pauses actives collectives obligatoires toutes les 2 heures",
    justification:
      "L'isolement et le manque d'activité physique sont des problèmes récurrents. Des pauses collectives permettraient de maintenir le lien social et encourager le mouvement.",
    status: "pending",
  },
];
