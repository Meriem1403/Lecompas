import { apiJson } from "@/lib/apiClient";

export const APP_DATA_KEYS = {
  organization: "organization",
  accessProfiles: "accessProfiles",
  riskReferences: "riskReferences",
  securitySheets: "securitySheets",
  awarenessRecords: "awarenessRecords",
  suppressedAwarenessKeys: "suppressedAwarenessKeys",
  safetyProtocols: "safetyProtocols",
  deletedProtocols: "deletedProtocols",
  preventionPlans: "preventionPlans",
  mealTickets: "mealTickets",
  mealSubsidyConfig: "mealSubsidyConfig",
  userInmHistory: "userInmHistory",
  papripactSignatures: "papripactSignatures",
} as const;

export type AppDataKey = (typeof APP_DATA_KEYS)[keyof typeof APP_DATA_KEYS];

export async function fetchAppData<T>(
  key: AppDataKey,
  token?: string,
): Promise<T | null> {
  const data = await apiJson<{ value: T | null }>(
    `/app-data/${encodeURIComponent(key)}`,
    {},
    token,
  );
  return data.value ?? null;
}

export async function saveAppData<T>(
  key: AppDataKey,
  value: T,
  token?: string,
): Promise<void> {
  await apiJson<{ ok: boolean }>(
    `/app-data/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: JSON.stringify({ value }),
    },
    token,
  );
}
