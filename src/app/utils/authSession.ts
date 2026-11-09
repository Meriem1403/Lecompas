import { isBackendApiEnabled } from "@/app/config/dataBackend";
import { isApiAccessToken } from "@/lib/apiClient";

const USER_KEY = "duerp_user";
const TOKEN_KEY = "duerp_token";
const STARTED_KEY = "duerp_session_started_at";
const ACTIVITY_KEY = "duerp_last_activity";

/** Inactivité maximale avant déconnexion. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
/** Durée maximale d'une session, même avec « Se souvenir de moi ». */
export const SESSION_ABSOLUTE_MS = 8 * 60 * 60 * 1000;

export type StoredSession = {
  userJson: string;
  token: string;
  storage: Storage;
};

function stores(): Storage[] {
  if (typeof window === "undefined") return [];
  return [window.sessionStorage, window.localStorage];
}

export function clearAuthSession(): void {
  for (const storage of stores()) {
    storage.removeItem(USER_KEY);
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(STARTED_KEY);
    storage.removeItem(ACTIVITY_KEY);
  }
}

function readPair(storage: Storage): StoredSession | null {
  const userJson = storage.getItem(USER_KEY);
  const token = storage.getItem(TOKEN_KEY);
  if (!userJson || !token) return null;
  return { userJson, token, storage };
}

export function isStoredSessionExpired(
  startedAt: number,
  lastActivity: number,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(startedAt) || !Number.isFinite(lastActivity)) return true;
  if (startedAt <= 0 || lastActivity <= 0) return true;
  if (now - startedAt > SESSION_ABSOLUTE_MS) return true;
  if (now - lastActivity > SESSION_IDLE_MS) return true;
  return false;
}

function timestamps(storage: Storage): { startedAt: number; lastActivity: number } {
  return {
    startedAt: Number(storage.getItem(STARTED_KEY)),
    lastActivity: Number(storage.getItem(ACTIVITY_KEY)),
  };
}

/** Session locale encore valable. Une session sans date, ou un jeton de démo sur l'intranet, est ignorée. */
export function readAuthSession(now = Date.now()): StoredSession | null {
  const session =
    readPair(window.sessionStorage) ?? readPair(window.localStorage);
  if (!session) return null;

  const { startedAt, lastActivity } = timestamps(session.storage);
  const fixtureOnIntranet =
    isBackendApiEnabled() && !isApiAccessToken(session.token);
  if (
    fixtureOnIntranet ||
    isStoredSessionExpired(startedAt, lastActivity, now)
  ) {
    clearAuthSession();
    return null;
  }
  return session;
}

export function writeAuthSession(
  user: unknown,
  token: string,
  rememberMe: boolean,
  now = Date.now(),
): void {
  clearAuthSession();
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(STARTED_KEY, String(now));
  storage.setItem(ACTIVITY_KEY, String(now));
}

export function updateStoredSessionUser(user: unknown): void {
  const session = readPair(window.sessionStorage) ?? readPair(window.localStorage);
  if (!session) return;
  session.storage.setItem(USER_KEY, JSON.stringify(user));
}

export function touchAuthActivity(now = Date.now()): void {
  const session = readPair(window.sessionStorage) ?? readPair(window.localStorage);
  if (!session) return;
  const previous = Number(session.storage.getItem(ACTIVITY_KEY));
  if (Number.isFinite(previous) && now - previous < 60_000) return;
  session.storage.setItem(ACTIVITY_KEY, String(now));
}
