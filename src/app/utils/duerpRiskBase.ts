import type { Risk } from "@/app/components/admin/RisksManagementView";
import { syncRisksToApi } from "@/app/services/risksApi";

export const DUERP_IMPORT_ID_PREFIX = "duerp-import-";

/** En dessous de cet écart, on considère la base déjà installée (suppressions volontaires). */
const INSTALL_GAP = 20;

export function countOfficialDuerpRisks(risks: Array<{ id?: string }>): number {
  return risks.filter((risk) =>
    String(risk.id ?? "").startsWith(DUERP_IMPORT_ID_PREFIX),
  ).length;
}

export function shouldInstallOfficialDuerpBase(
  risks: Array<{ id?: string }>,
  expectedCount: number,
): boolean {
  if (expectedCount <= 0) return false;
  return expectedCount - countOfficialDuerpRisks(risks) > INSTALL_GAP;
}

export async function loadImportedDuerpRisks(): Promise<Risk[]> {
  const loaded = await import("../seeds/imported/duerp-risks.json");
  const data = (loaded as { default?: unknown }).default ?? loaded;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is Risk =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as { id?: unknown }).id === "string",
  );
}

/** Remplace une base courte (démo) par le classeur. Ne fait rien si le classeur est déjà en place. */
export async function ensureOfficialDuerpRiskBase(
  current: Array<{ id?: string }>,
  token: string,
): Promise<boolean> {
  const imported = await loadImportedDuerpRisks();
  if (!shouldInstallOfficialDuerpBase(current, imported.length)) return false;
  await syncRisksToApi(imported, token);
  return true;
}
