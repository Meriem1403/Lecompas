export type RiskWorkflowStatus =
  | "a_traiter"
  | "en_traitement"
  | "maitrise"
  | "supprime";

interface PlannedMeasure {
  status: "pending" | "in_progress" | "completed";
}

export function parseMaitriseCoefficient(value: string): number {
  const normalized = (value || "").replace(",", ".").trim();
  if (!normalized) return 1;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 1;

  // Coefficient de maitrise: 1 = pas de reduction, 0.1 = reduction forte.
  if (parsed > 1) return 1;
  return parsed;
}

export function computeRiskValues(
  severity: number,
  probability: number,
  moyenMaitrise: string,
) {
  const initialPriority = Math.max(1, severity * probability);
  const coefficient = parseMaitriseCoefficient(moyenMaitrise);
  const residualPriority = Number((initialPriority * coefficient).toFixed(2));

  return {
    // Le niveau de risque affiché doit refléter le risque residuel.
    riskLevel: residualPriority,
    calculPriorite: initialPriority,
    prioriteFinale: residualPriority,
    coefficient,
  };
}

export function computeRiskWorkflowStatus(
  residualRisk: number,
  plannedMeasures: PlannedMeasure[],
): RiskWorkflowStatus {
  if (residualRisk <= 0) return "supprime";
  if (!plannedMeasures || plannedMeasures.length === 0) return "a_traiter";
  if (plannedMeasures.every((measure) => measure.status === "completed")) {
    return residualRisk < 4 ? "maitrise" : "en_traitement";
  }
  if (
    plannedMeasures.some(
      (measure) =>
        measure.status === "in_progress" || measure.status === "completed",
    )
  ) {
    return "en_traitement";
  }
  return "a_traiter";
}

export function getRiskWorkflowStatusLabel(status: RiskWorkflowStatus): string {
  switch (status) {
    case "a_traiter":
      return "A traiter";
    case "en_traitement":
      return "En traitement";
    case "maitrise":
      return "Maitrise";
    case "supprime":
      return "Supprime";
  }
}
