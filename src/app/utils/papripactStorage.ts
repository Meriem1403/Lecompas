import type { Action } from "@/app/types/action";

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

const PAPRIPACT_DETAIL_KEYS = [
  "papripactIndicators",
  "papripactComments",
  "papripactCost",
  "papripactUnits",
] as const;

/** Complète les colonnes du tableau quand une action importée a été enregistrée sans elles. */
export function completePapripactFromFixtures(
  actions: Action[],
  fixtureActions: Action[],
): Action[] {
  const byId = new Map(fixtureActions.map((action) => [action.id, action]));
  let changed = false;
  const next = actions.map((action) => {
    const fixture = byId.get(action.id);
    if (!fixture) return action;
    const patch: Partial<Action> = {};
    for (const key of PAPRIPACT_DETAIL_KEYS) {
      const current = action[key];
      const incoming = fixture[key];
      if ((current === undefined || current === "") && incoming) {
        patch[key] = incoming;
      }
    }
    if (Object.keys(patch).length === 0) return action;
    changed = true;
    return { ...action, ...patch };
  });
  return changed ? next : actions;
}

export function mergeInitialManualActions(
  stored: Action[] | null,
  fixtureActions: Action[],
): Action[] {
  if (stored && stored.length > 0) {
    return completePapripactFromFixtures(stored, fixtureActions);
  }
  if (isPapripactFixtureLoaded()) return stored ?? [];
  markPapripactFixtureLoaded();
  return fixtureActions;
}
