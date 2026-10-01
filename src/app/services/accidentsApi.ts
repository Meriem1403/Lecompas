import {
  fetchCollection,
  syncCollectionToApi,
} from "@/app/services/apiCollectionSync";

/** Accidentologie — structure alignée sur le state `App.tsx` / `AccidentsView`. */
export interface StoredAccident {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: "bénin" | "modéré" | "grave" | "très_grave";
  type: "travail" | "trajet" | "maladie_pro";
  victim: string;
  location: string;
  witnesses: string[];
  measures: string;
  createdAt: string;
  [key: string]: unknown;
}

export async function fetchAccidentsFromApi(
  token?: string,
): Promise<StoredAccident[]> {
  return fetchCollection<StoredAccident>("/accidents", "accidents", token);
}

export async function syncAccidentsToApi(
  accidents: StoredAccident[],
  token?: string,
): Promise<void> {
  await syncCollectionToApi("/accidents", accidents, token);
}
