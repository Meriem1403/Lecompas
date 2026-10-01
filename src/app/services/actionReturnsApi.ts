import {
  fetchCollection,
  syncCollectionToApi,
} from "@/app/services/apiCollectionSync";
import type { ActionReturnFixture } from "@/app/fixtures/actionReturnFixtures";

export type ActionReturnRecord = ActionReturnFixture;

export async function fetchActionReturnsFromApi(
  token?: string,
): Promise<ActionReturnRecord[]> {
  return fetchCollection<ActionReturnRecord>(
    "/action-returns",
    "actionReturns",
    token,
  );
}

export async function syncActionReturnsToApi(
  items: ActionReturnRecord[],
  token?: string,
): Promise<void> {
  await syncCollectionToApi("/action-returns", items, token, "actionReturns");
}
