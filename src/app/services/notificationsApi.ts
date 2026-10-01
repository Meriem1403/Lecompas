import type { AppNotification } from "@/app/utils/lecompasStorage";
import {
  fetchCollection,
  syncCollectionToApi,
} from "@/app/services/apiCollectionSync";

export async function fetchNotificationsFromApi(
  token?: string,
): Promise<AppNotification[]> {
  return fetchCollection<AppNotification>(
    "/notifications",
    "notifications",
    token,
  );
}

export async function syncNotificationsToApi(
  notifications: AppNotification[],
  token?: string,
): Promise<void> {
  await syncCollectionToApi("/notifications", notifications, token);
}
