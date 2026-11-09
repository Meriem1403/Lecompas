import { apiJson } from "@/lib/apiClient";
import { isSmokePayload } from "@/app/services/appDataApi";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import { syncCollectionToApi } from "@/app/services/apiCollectionSync";

export async function fetchRisksFromApi(token?: string): Promise<Risk[]> {
  const data = await apiJson<{ risks: Risk[] }>("/risks", {}, token);
  if (!Array.isArray(data.risks)) return [];
  return data.risks.filter(
    (risk) =>
      risk &&
      !isSmokePayload(risk) &&
      !String(risk.id || "").startsWith("smoke-") &&
      risk.title !== "Risque smoke intranet",
  );
}

export async function syncRisksToApi(risks: Risk[], token?: string): Promise<void> {
  await syncCollectionToApi("/risks", risks, token, "risks");
}
