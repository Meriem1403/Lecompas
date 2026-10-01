import { ApiError, apiJson } from "@/lib/apiClient";
import type { Risk } from "@/app/components/admin/RisksManagementView";

export async function fetchRisksFromApi(token?: string): Promise<Risk[]> {
  const data = await apiJson<{ risks: Risk[] }>("/risks", {}, token);
  return Array.isArray(data.risks) ? data.risks : [];
}

export async function syncRisksToApi(risks: Risk[], token?: string): Promise<void> {
  for (const risk of risks) {
    try {
      await apiJson<{ risk: Risk }>(
        `/risks/${encodeURIComponent(risk.id)}`,
        {
          method: "PUT",
          body: JSON.stringify(risk),
        },
        token,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await apiJson<{ risk: Risk }>(
          "/risks",
          {
            method: "POST",
            body: JSON.stringify(risk),
          },
          token,
        );
      } else {
        throw error;
      }
    }
  }
}
