import type { MealTicket } from "./mealTicketRecord";

/** Base locale IndexedDB pour les volumes de tickets (> limite typical localStorage ~5 Mo). */
const DB_NAME = "lecompas-repas-tickets";
const DB_VERSION = 1;
const STORE = "tickets";

const LS_KEY = "lecompas_meal_tickets_v2";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB non disponible"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * Lecture unique depuis localStorage (migration hors IndexedDB ou secours).
 * N’infère pas le version key : tant que les données résident encore dans localStorage,
 * elles sont proposées pour copie IndexedDB puis effacement.
 */
export function readMealTicketsFromLocalStorageLoose(): MealTicket[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Supprime le stockage ancien fichier JSON après copie IndexedDB réussie. */
export function clearMealTicketsLocalStoragePayload(): void {
  localStorage.removeItem(LS_KEY);
}

/** Charge tous les tickets depuis IndexedDB. */
export async function loadMealTicketsFromIndexedDb(): Promise<MealTicket[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      resolve(Array.isArray(req.result) ? (req.result as MealTicket[]) : []);
    };
    tx.oncomplete = () => db.close();
  });
}

/** Remplace le contenu du store par la liste donnée (clé id). */
export async function saveMealTicketsToIndexedDb(tickets: MealTicket[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const clearReq = store.clear();
    clearReq.onerror = () => reject(clearReq.error);

    clearReq.onsuccess = () => {
      for (const t of tickets) {
        store.put(t);
      }
    };

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction IndexedDB annulée"));
  });
}

export async function clearMealTicketsIndexedDb(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.clear();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Hydratation complète : préfère IndexedDB, sinon migre une fois depuis localStorage.
 */
export async function hydrateMealTickets(): Promise<MealTicket[]> {
  try {
    const fromIdb = await loadMealTicketsFromIndexedDb();
    if (fromIdb.length > 0) {
      return fromIdb;
    }
    const legacy = readMealTicketsFromLocalStorageLoose();
    if (legacy.length > 0) {
      await saveMealTicketsToIndexedDb(legacy);
      clearMealTicketsLocalStoragePayload();
    }
    return legacy;
  } catch {
    return readMealTicketsFromLocalStorageLoose();
  }
}
