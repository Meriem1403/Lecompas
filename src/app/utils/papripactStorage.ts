import type { Action } from "@/app/components/ActionsView";

export interface PapripactSignatureRecord {
  year: number;
  signedBy: string;
  signedAt: string;
  comment?: string;
  signatureDataUrl?: string;
}

const PAPRIPACT_SIGNATURE_KEY = "lecompas_papripact_signatures_v1";
const PAPRIPACT_IMPORTED_KEY = "lecompas_papripact_imported_v1";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function loadPapripactSignatures(): PapripactSignatureRecord[] {
  return readJson<PapripactSignatureRecord[]>(PAPRIPACT_SIGNATURE_KEY) ?? [];
}

export function savePapripactSignatures(records: PapripactSignatureRecord[]) {
  writeJson(PAPRIPACT_SIGNATURE_KEY, records);
}

export function isPapripactFixtureLoaded(): boolean {
  return localStorage.getItem(PAPRIPACT_IMPORTED_KEY) === "1";
}

export function markPapripactFixtureLoaded() {
  localStorage.setItem(PAPRIPACT_IMPORTED_KEY, "1");
}

export function mergeInitialManualActions(
  stored: Action[] | null,
  fixtureActions: Action[],
): Action[] {
  if (stored && stored.length > 0) return stored;
  if (isPapripactFixtureLoaded()) return stored ?? [];
  markPapripactFixtureLoaded();
  return fixtureActions;
}
