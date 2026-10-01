import type { Action } from "@/app/types/action";
import {
  fetchCollection,
  syncCollectionToApi,
} from "@/app/services/apiCollectionSync";

export async function fetchActionsFromApi(token?: string): Promise<Action[]> {
  return fetchCollection<Action>("/actions", "actions", token);
}

export async function syncActionsToApi(
  actions: Action[],
  token?: string,
): Promise<void> {
  await syncCollectionToApi("/actions", actions, token, "actions");
}
