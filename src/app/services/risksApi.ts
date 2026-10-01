import { apiJson } from "@/lib/apiClient";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import { syncCollectionToApi } from "@/app/services/apiCollectionSync";

export async function fetchRisksFromApi(token?: string): Promise<Risk[]> {
  const data = await apiJson<{ risks: Risk[] }>("/risks", {}, token);
  return Array.isArray(data.risks) ? data.risks : [];
}

export async function syncRisksToApi(risks: Risk[], token?: string): Promise<void> {
  await syncCollectionToApi("/risks", risks, token, "risks");
}
