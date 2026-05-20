import { AppUser, Location } from "../components/admin/UserManagementView";
import { isMealTicketRecipient, MealProviderIdentity } from "./userRoles";
import {
  AgentMealSubsidyBreakdown,
  MealSubsidyConfig,
  UserInmHistoryEntry,
  computeAgentMealSubsidy,
  getInmForMonth,
  resolveLocationId,
  roundMoney,
} from "./mealSubsidyRecord";
import {
  clearMealTicketsIndexedDb,
  clearMealTicketsLocalStoragePayload,
  saveMealTicketsToIndexedDb,
} from "./mealTicketIndexedDb";

export type MealTicketStatus = "active" | "used" | "cancelled";

export interface MealTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  agentName: string;
  agentEmail: string;
  service: string;
  domain: string;
  location: string;
  month: string;
  /** Toujours 1 par ticket (un QR = un repas). Anciens jeux peuvent avoir mealCount > 1. */
  mealCount: number;
  /** Numéro du repas dans le mois pour cet utilisateur (1, 2, … 22) */
  mealIndex?: number;
  qrToken: string;
  status: MealTicketStatus;
  generatedAt: string;
  generatedBy: string;
  usedAt?: string;
  usedByProviderId?: string;
  usedByProviderName?: string;
  /** INM retenu pour le mois du ticket */
  agentInm?: number;
  subsidyMinisterial?: number;
  subsidyInterministerial?: number;
  /** Montant du ticket = subventions totales agent (ministérielle + interministérielle) pour ce repas. */
  subsidyTotal?: number;
  /**
   * @deprecated Le montant ticket est `subsidyTotal`. Conservé pour anciens jeux de données.
   */
  ticketParticipationEUR?: number;
  /** @deprecated */
  referenceMealPriceEUR?: number;
  /** @deprecated */
  agentCopayEUR?: number;
}

export interface MealTicketFilters {
  month?: string;
  service?: string;
  domain?: string;
  location?: string;
  status?: MealTicketStatus | "all";
  search?: string;
}

const TICKETS_STORAGE_KEY = "goudurix_meal_tickets_v2";
const TICKETS_STORAGE_VERSION_KEY = "goudurix_meal_tickets_version";
/** Incrémenter pour remettre à zéro les tickets en local (tests / changement de modèle). */
const TICKETS_STORAGE_VERSION = "5";
const LEGACY_TICKETS_STORAGE_KEY = "goudurix_meal_tickets";
const MEAL_TICKETS_RESET_NONCE_KEY = "goudurix_meal_tickets_reset_nonce";
export const MEAL_TICKETS_RESET_EVENT = "goudurix-meal-tickets-reset";
const QR_PREFIX = "GOUDURIX-REPAS";

function broadcastMealTicketsReset(nonce: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MEAL_TICKETS_RESET_EVENT, { detail: nonce }));
}

/** Écoute les réinitialisations (autre onglet via storage, même onglet via CustomEvent). */
export function subscribeMealTicketsReset(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === MEAL_TICKETS_RESET_NONCE_KEY && event.newValue) {
      listener();
    }
  };

  window.addEventListener(MEAL_TICKETS_RESET_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(MEAL_TICKETS_RESET_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function getMealTicketsResetNonce(): string {
  if (typeof localStorage === "undefined") return "0";
  return localStorage.getItem(MEAL_TICKETS_RESET_NONCE_KEY) ?? "0";
}

/**
 * Remise à zéro complète (IndexedDB + secours localStorage) et synchronisation multi-onglets /
 * multi-vues (admin, prestataire, agent, chef).
 */
export async function resetMealTicketsStorageAsync(): Promise<void> {
  const nonce = String(Date.now());

  // Signaler les autres onglets avant toute écriture pour éviter qu'un save différé restaure d'anciens tickets.
  localStorage.setItem(MEAL_TICKETS_RESET_NONCE_KEY, nonce);
  broadcastMealTicketsReset(nonce);

  localStorage.removeItem(TICKETS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TICKETS_STORAGE_KEY);
  clearMealTicketsLocalStoragePayload();
  localStorage.setItem(TICKETS_STORAGE_VERSION_KEY, TICKETS_STORAGE_VERSION);

  try {
    await clearMealTicketsIndexedDb();
  } catch {
    /* ignore */
  }

  try {
    await saveMealTicketsToIndexedDb([]);
  } catch {
    /* ignore */
  }
}

/** @deprecated Préférer {@link resetMealTicketsStorageAsync} */
export function resetMealTicketsStorage(): void {
  void resetMealTicketsStorageAsync();
}

export function loadMealTickets(): MealTicket[] {
  try {
    const version = localStorage.getItem(TICKETS_STORAGE_VERSION_KEY);
    if (version !== TICKETS_STORAGE_VERSION) {
      resetMealTicketsStorage();
      return [];
    }
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persistance principale : IndexedDB (volumétrie). Garde un secours court dans localStorage si IDB échoue. */
export function saveMealTickets(tickets: MealTicket[]): void {
  void saveMealTicketsToIndexedDb(tickets)
    .then(() => {
      localStorage.setItem(TICKETS_STORAGE_VERSION_KEY, TICKETS_STORAGE_VERSION);
    })
    .catch(() => {
      try {
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
        localStorage.setItem(TICKETS_STORAGE_VERSION_KEY, TICKETS_STORAGE_VERSION);
      } catch {
        /* ignore quota */
      }
    });
}

export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function generateQrToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    .toUpperCase()
    .slice(0, 16);
}

function generateTicketNumber(month: string, sequence: number): string {
  const compactMonth = month.replace("-", "");
  return `TR-${compactMonth}-${String(sequence).padStart(5, "0")}`;
}

/** Données compactes embarquées dans le QR (scan depuis un autre appareil). */
interface QrTicketSnapshotCompact {
  i: string;
  t: string;
  n: string;
  u: string;
  a: string;
  e: string;
  s: string;
  d: string;
  l: string;
  m: string;
  x?: number;
  g?: string;
  /** Participation au ticket € / repas (= subventions totales agent, champ `st`). */
  rp?: number;
  /** Subvention totale € / repas (= montant du ticket). */
  st?: number;
  /** Ancien reste agent € / repas (tickets avant refonte participation). */
  ap?: number;
}

export interface ParsedQrPayload {
  ticketId: string;
  qrToken: string;
  ticketNumber: string;
  snapshot?: QrTicketSnapshotCompact;
}

function encodeSnapshot(ticket: MealTicket): string {
  const ticketAmount =
    ticket.subsidyTotal != null && Number.isFinite(ticket.subsidyTotal) && ticket.subsidyTotal >= 0
      ? roundMoney(ticket.subsidyTotal)
      : undefined;

  const compact: QrTicketSnapshotCompact = {
    i: ticket.id,
    t: ticket.qrToken,
    n: ticket.ticketNumber,
    u: ticket.userId,
    a: ticket.agentName,
    e: ticket.agentEmail,
    s: ticket.service,
    d: ticket.domain,
    l: ticket.location,
    m: ticket.month,
    ...(ticket.mealIndex != null ? { x: ticket.mealIndex } : {}),
    g: ticket.generatedAt,
    ...(ticketAmount != null ? { rp: ticketAmount, st: ticketAmount } : {}),
    ...(ticket.agentCopayEUR != null && ticket.agentCopayEUR >= 0 ? { ap: ticket.agentCopayEUR } : {}),
  };
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeSnapshot(encoded: string): QrTicketSnapshotCompact | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as QrTicketSnapshotCompact;
    if (!parsed?.i || !parsed?.t || !parsed?.n) return null;
    return parsed;
  } catch {
    return null;
  }
}

function ticketFromSnapshot(snapshot: QrTicketSnapshotCompact): MealTicket {
  return {
    id: snapshot.i,
    qrToken: snapshot.t,
    ticketNumber: snapshot.n,
    userId: snapshot.u,
    agentName: snapshot.a,
    agentEmail: snapshot.e,
    service: snapshot.s,
    domain: snapshot.d ?? "",
    location: snapshot.l ?? "",
    month: snapshot.m,
    mealCount: 1,
    mealIndex: snapshot.x,
    status: "active",
    generatedAt: snapshot.g ?? new Date().toISOString(),
    generatedBy: "QR",
    ...(snapshot.st != null
      ? { subsidyTotal: snapshot.st }
      : snapshot.rp != null
        ? { subsidyTotal: snapshot.rp }
        : {}),
    ...(snapshot.ap != null && snapshot.ap >= 0 ? { agentCopayEUR: snapshot.ap } : {}),
  };
}

export function buildQrPayload(ticket: MealTicket): string {
  const snapshot = encodeSnapshot(ticket);
  return `${QR_PREFIX}|${ticket.id}|${ticket.qrToken}|${ticket.ticketNumber}|${snapshot}`;
}

export function parseQrPayload(payload: string): ParsedQrPayload | null {
  const trimmed = payload.trim();
  if (!trimmed.startsWith(QR_PREFIX)) return null;
  const parts = trimmed.split("|");
  if (parts.length < 4) return null;
  const snapshotEncoded = parts[4];
  const snapshot = snapshotEncoded ? decodeSnapshot(snapshotEncoded) : undefined;
  return {
    ticketId: parts[1],
    qrToken: parts[2],
    ticketNumber: parts[3],
    snapshot,
  };
}

/** Importe un ticket depuis le QR si absent du stockage local (autre appareil). */
export function mergeTicketFromQrPayload(
  tickets: MealTicket[],
  parsed: ParsedQrPayload,
): MealTicket[] {
  if (tickets.some((t) => t.id === parsed.ticketId)) return tickets;
  if (!parsed.snapshot) return tickets;
  if (parsed.snapshot.t !== parsed.qrToken || parsed.snapshot.i !== parsed.ticketId) {
    return tickets;
  }
  return [...tickets, ticketFromSnapshot(parsed.snapshot)];
}

export function filterMealTicketRecipients(
  users: AppUser[],
  filters: Pick<MealTicketFilters, "service" | "domain" | "location">,
): AppUser[] {
  return users.filter((user) => {
    if (!isMealTicketRecipient(user)) return false;
    if (filters.service && filters.service !== "all" && user.service !== filters.service) {
      return false;
    }
    if (filters.domain && filters.domain !== "all" && user.domain !== filters.domain) {
      return false;
    }
    if (filters.location && filters.location !== "all" && user.location !== filters.location) {
      return false;
    }
    return true;
  });
}

/** @deprecated Préférer filterMealTicketRecipients */
export function filterAgents(
  users: AppUser[],
  filters: Pick<MealTicketFilters, "service" | "domain" | "location">,
): AppUser[] {
  return filterMealTicketRecipients(users, filters);
}

export function getUserMonthTickets(
  tickets: MealTicket[],
  userId: string,
  month: string,
): MealTicket[] {
  return tickets.filter(
    (t) => t.userId === userId && t.month === month && t.status !== "cancelled",
  );
}

export function countUserMonthTickets(
  tickets: MealTicket[],
  userId: string,
  month: string,
): number {
  return getUserMonthTickets(tickets, userId, month).length;
}

/**
 * Base pour attribuer mealIndex aux nouveaux tickets (toujours > aux numéros déjà pris).
 * Évite deux « Repas n°1 » lorsque des doublons existent ou que la liste d’agents contient deux fois la même personne.
 */
export function getNextMealIndexBase(
  tickets: MealTicket[],
  userId: string,
  month: string,
): number {
  const list = getUserMonthTickets(tickets, userId, month);
  let maxDeclared = 0;
  for (const t of list) {
    const n = t.mealIndex;
    if (typeof n === "number" && Number.isFinite(n) && n > maxDeclared) {
      maxDeclared = n;
    }
  }
  return Math.max(list.length, maxDeclared);
}

/** @deprecated Utiliser countUserMonthTickets / userHasFullMealAllocation */
export function hasActiveTicketForMonth(
  tickets: MealTicket[],
  userId: string,
  month: string,
): boolean {
  return countUserMonthTickets(tickets, userId, month) > 0;
}

export function userHasFullMealAllocation(
  tickets: MealTicket[],
  userId: string,
  month: string,
  mealsPerPerson: number,
): boolean {
  return countUserMonthTickets(tickets, userId, month) >= mealsPerPerson;
}

function mealUnitsOnTicket(ticket: MealTicket): number {
  return Math.max(1, ticket.mealCount);
}

/** Montants résolus pour affichage et agrégats compta. */
export interface ResolvedTicketMoneyEUR {
  /** Montant du ticket = subventions totales agent (€ / repas). */
  ticketAmountEUR: number;
  subsidyTotalEUR: number;
  subsidyMinisterialEUR: number;
  subsidyInterministerialEUR: number;
  /** @deprecated alias de {@link ResolvedTicketMoneyEUR.ticketAmountEUR} */
  ticketParticipationEUR: number;
  /** @deprecated alias de ticketAmountEUR */
  referenceMealPriceEUR: number;
  /** @deprecated alias de ticketAmountEUR */
  agentCopayEUR: number;
}

/**
 * Montant d’un ticket = total des subventions auxquelles l’agent a droit pour ce repas
 * (ministérielle + interministérielle, figées à la génération).
 */
export function resolveTicketMoneyEUR(ticket: MealTicket): ResolvedTicketMoneyEUR {
  const subsidyTotalEUR = roundMoney(ticket.subsidyTotal ?? 0);
  const ticketAmountEUR = subsidyTotalEUR;

  return {
    ticketAmountEUR,
    subsidyTotalEUR,
    subsidyMinisterialEUR: roundMoney(ticket.subsidyMinisterial ?? 0),
    subsidyInterministerialEUR: roundMoney(ticket.subsidyInterministerial ?? 0),
    ticketParticipationEUR: ticketAmountEUR,
    referenceMealPriceEUR: ticketAmountEUR,
    agentCopayEUR: ticketAmountEUR,
  };
}

/** Agrégation des montants tickets (= subventions agent) pour une liste. */
export interface MealTicketMoneyRollup {
  /** Somme des montants ticket (= subventions totales agent) × repas. */
  totalTicketParticipationEUR: number;
  totalComptabiliteSubventionEUR: number;
  mealUnits: number;
  /** @deprecated alias de totalTicketParticipationEUR */
  totalPrestataireEUR: number;
  /** @deprecated alias de totalTicketParticipationEUR */
  totalAgentCopayEUR: number;
}

/** Synthèse compta prestataire : tickets générés vs scannés vs reste (montant = subventions agent). */
export interface MealTicketAccountingRollup {
  generatedTicketCount: number;
  scannedTicketCount: number;
  remainingTicketCount: number;
  /** Montant cumulé des tickets émis (= Σ subventions totales agent). */
  generatedAmountEUR: number;
  /** Montant à facturer par le prestataire (tickets scannés). */
  scannedAmountEUR: number;
  /** Montant des tickets actifs non encore scannés. */
  remainingAmountEUR: number;
  /** @deprecated alias de generatedAmountEUR */
  generatedParticipationEUR: number;
  /** @deprecated alias de scannedAmountEUR */
  scannedParticipationEUR: number;
  /** @deprecated alias de remainingAmountEUR */
  remainingParticipationEUR: number;
  /** @deprecated alias de scannedAmountEUR */
  scannedSubventionEUR: number;
  /** @deprecated alias de generatedAmountEUR */
  generatedSubventionEUR: number;
}

export function rollupMealTicketsAccounting(tickets: MealTicket[]): MealTicketAccountingRollup {
  let generatedTicketCount = 0;
  let scannedTicketCount = 0;
  let remainingTicketCount = 0;
  let generatedAmount = 0;
  let scannedAmount = 0;
  let remainingAmount = 0;

  for (const t of tickets) {
    if (t.status === "cancelled") continue;

    const u = mealUnitsOnTicket(t);
    const amount = resolveTicketMoneyEUR(t).ticketAmountEUR * u;

    generatedTicketCount += 1;
    generatedAmount += amount;

    if (t.status === "used") {
      scannedTicketCount += 1;
      scannedAmount += amount;
    } else if (t.status === "active") {
      remainingTicketCount += 1;
      remainingAmount += amount;
    }
  }

  const generatedAmountEUR = roundMoney(generatedAmount);
  const scannedAmountEUR = roundMoney(scannedAmount);
  const remainingAmountEUR = roundMoney(remainingAmount);

  return {
    generatedTicketCount,
    scannedTicketCount,
    remainingTicketCount,
    generatedAmountEUR,
    scannedAmountEUR,
    remainingAmountEUR,
    generatedParticipationEUR: generatedAmountEUR,
    scannedParticipationEUR: scannedAmountEUR,
    remainingParticipationEUR: remainingAmountEUR,
    scannedSubventionEUR: scannedAmountEUR,
    generatedSubventionEUR: generatedAmountEUR,
  };
}

export function rollupMealTicketsMoney(tickets: MealTicket[]): MealTicketMoneyRollup {
  let totalAmount = 0;
  let mealUnitsCounted = 0;
  for (const t of tickets) {
    if (t.status === "cancelled") continue;
    const u = mealUnitsOnTicket(t);
    const m = resolveTicketMoneyEUR(t);
    totalAmount += m.ticketAmountEUR * u;
    mealUnitsCounted += u;
  }
  const totalTicketParticipationEUR = roundMoney(totalAmount);
  return {
    totalTicketParticipationEUR,
    totalComptabiliteSubventionEUR: totalTicketParticipationEUR,
    mealUnits: mealUnitsCounted,
    totalPrestataireEUR: totalTicketParticipationEUR,
    totalAgentCopayEUR: totalTicketParticipationEUR,
  };
}

export function countUserActiveMeals(
  tickets: MealTicket[],
  userId: string,
  month: string,
): number {
  return getUserMonthTickets(tickets, userId, month)
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + mealUnitsOnTicket(t), 0);
}

export function countUserUsedMeals(
  tickets: MealTicket[],
  userId: string,
  month: string,
): number {
  return getUserMonthTickets(tickets, userId, month)
    .filter((t) => t.status === "used")
    .reduce((sum, t) => sum + mealUnitsOnTicket(t), 0);
}

export function filterTickets(
  tickets: MealTicket[],
  filters: MealTicketFilters,
): MealTicket[] {
  const search = filters.search?.trim().toLowerCase();
  return tickets.filter((ticket) => {
    if (filters.month && filters.month !== "all" && ticket.month !== filters.month) {
      return false;
    }
    if (filters.service && filters.service !== "all" && ticket.service !== filters.service) {
      return false;
    }
    if (filters.domain && filters.domain !== "all" && ticket.domain !== filters.domain) {
      return false;
    }
    if (filters.location && filters.location !== "all" && ticket.location !== filters.location) {
      return false;
    }
    if (filters.status && filters.status !== "all" && ticket.status !== filters.status) {
      return false;
    }
    if (search) {
      const haystack = [
        ticket.ticketNumber,
        ticket.agentName,
        ticket.agentEmail,
        ticket.service,
        ticket.domain,
        ticket.location,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export interface GenerateTicketsOptions {
  month: string;
  agents: AppUser[];
  existingTickets: MealTicket[];
  /** Nombre de repas (= QR codes) à attribuer par personne pour ce mois */
  mealsPerPerson: number;
  generatedBy: string;
  filters: Pick<MealTicketFilters, "service" | "domain" | "location">;
  selectedUserIds?: string[];
  subsidyConfig?: MealSubsidyConfig;
  inmHistory?: UserInmHistoryEntry[];
  locationCatalog?: Pick<Location, "id" | "name" | "regionCode">[];
}

/** Recalcule les subventions sur les tickets actifs d'un mois (après changement INM / barèmes). */
export function applySubsidiesToMonthTickets(
  tickets: MealTicket[],
  month: string,
  agents: AppUser[],
  subsidyConfig: MealSubsidyConfig,
  inmHistory: UserInmHistoryEntry[],
  locationCatalog: Pick<Location, "id" | "name" | "regionCode">[],
  userIds?: string[],
): MealTicket[] {
  const idSet = userIds?.length ? new Set(userIds) : null;
  const agentById = new Map(agents.map((a) => [a.id, a]));

  return tickets.map((ticket) => {
    if (ticket.month !== month || ticket.status === "cancelled") return ticket;
    if (idSet && !idSet.has(ticket.userId)) return ticket;

    const agent = agentById.get(ticket.userId);
    if (!agent) return ticket;

    const locationId = resolveLocationId(locationCatalog, agent.location);
    const inm = getInmForMonth(inmHistory, agent.id, month, agent.inm);
    const subsidy = computeAgentMealSubsidy(subsidyConfig, {
      month,
      locationId,
      locationName: agent.location,
      inm,
      locationCatalog,
    });

    return {
      ...ticket,
      agentInm: subsidy.inm ?? undefined,
      subsidyMinisterial: subsidy.ministerialAmount,
      subsidyInterministerial: subsidy.interministerialAmount,
      subsidyTotal: subsidy.totalPerMeal,
    };
  });
}

export function generateMonthlyTickets({
  month,
  agents,
  existingTickets,
  mealsPerPerson,
  generatedBy,
  filters,
  selectedUserIds,
  subsidyConfig,
  inmHistory = [],
  locationCatalog = [],
}: GenerateTicketsOptions): { tickets: MealTicket[]; created: number; skipped: number } {
  let ticketsBase = existingTickets;
  if (subsidyConfig) {
    ticketsBase = applySubsidiesToMonthTickets(
      existingTickets,
      month,
      agents,
      subsidyConfig,
      inmHistory,
      locationCatalog,
      selectedUserIds,
    );
  }

  let eligibleRecipients = filterMealTicketRecipients(agents, filters);
  if (selectedUserIds && selectedUserIds.length > 0) {
    const idSet = new Set(selectedUserIds);
    eligibleRecipients = eligibleRecipients.filter((u) => idSet.has(u.id));
  }

  /** Évite deux passes de génération sur le même id (liste annuaire dupliquée). */
  {
    const seen = new Set<string>();
    eligibleRecipients = eligibleRecipients.filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }

  const perPerson = Math.max(1, Math.min(31, Math.floor(mealsPerPerson)));

  const monthTickets = ticketsBase.filter((t) => t.month === month);
  let sequence =
    monthTickets.reduce((max, ticket) => {
      const match = ticket.ticketNumber.match(/-(\d{5})$/);
      const num = match ? Number(match[1]) : 0;
      return Math.max(max, num);
    }, 0) + 1;

  const newTickets: MealTicket[] = [];
  let skipped = 0;

  for (const agent of eligibleRecipients) {
    const existingCount = countUserMonthTickets(ticketsBase, agent.id, month);
    const toCreate = perPerson - existingCount;

    if (toCreate <= 0) {
      skipped += 1;
      continue;
    }

    const locationId = resolveLocationId(locationCatalog, agent.location);
    let subsidy: AgentMealSubsidyBreakdown | null = null;
    if (subsidyConfig) {
      const inm = getInmForMonth(inmHistory, agent.id, month, agent.inm);
      subsidy = computeAgentMealSubsidy(subsidyConfig, {
        month,
        locationId,
        locationName: agent.location,
        inm,
        locationCatalog,
      });
    }

    const mealIndexBase = getNextMealIndexBase(ticketsBase, agent.id, month);

    for (let i = 0; i < toCreate; i += 1) {
      const mealIndex = mealIndexBase + i + 1;
      const ticket: MealTicket = {
        id: crypto.randomUUID(),
        ticketNumber: generateTicketNumber(month, sequence),
        userId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        agentEmail: agent.email,
        service: agent.service,
        domain: agent.domain,
        location: agent.location,
        month,
        mealCount: 1,
        mealIndex,
        qrToken: generateQrToken(),
        status: "active",
        generatedAt: new Date().toISOString(),
        generatedBy,
        ...(subsidy
          ? {
              agentInm: subsidy.inm ?? undefined,
              subsidyMinisterial: subsidy.ministerialAmount,
              subsidyInterministerial: subsidy.interministerialAmount,
              subsidyTotal: subsidy.totalPerMeal,
            }
          : {}),
      };
      newTickets.push(ticket);
      sequence += 1;
    }
  }

  return {
    tickets: [...ticketsBase, ...newTickets],
    created: newTickets.length,
    skipped,
  };
}

export interface ValidateTicketResult {
  success: boolean;
  message: string;
  ticket?: MealTicket;
}

export function validateMealTicketScan(
  tickets: MealTicket[],
  parsed: ParsedQrPayload,
  provider: MealProviderIdentity,
): { tickets: MealTicket[]; result: ValidateTicketResult } {
  const merged = mergeTicketFromQrPayload(tickets, parsed);
  return validateMealTicket(merged, parsed.ticketId, parsed.qrToken, provider, {
    hadLocalCopy: tickets.some((t) => t.id === parsed.ticketId),
    hadSnapshot: Boolean(parsed.snapshot),
  });
}

export function validateMealTicket(
  tickets: MealTicket[],
  ticketId: string,
  qrToken: string,
  provider: MealProviderIdentity,
  context?: { hadLocalCopy?: boolean; hadSnapshot?: boolean },
): { tickets: MealTicket[]; result: ValidateTicketResult } {
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    let hint = "";
    if (context?.hadSnapshot === false) {
      hint =
        " Ce QR date d'avant la mise à jour : regénérez les tickets (admin) puis scannez le nouveau QR.";
    } else if (!context?.hadLocalCopy) {
      hint = " Impossible d'importer les données du QR — regénérez le ticket.";
    }
    return {
      tickets,
      result: { success: false, message: `Ticket introuvable.${hint}` },
    };
  }
  if (ticket.qrToken !== qrToken) {
    return { tickets, result: { success: false, message: "Code QR invalide ou falsifié." } };
  }
  if (ticket.status === "cancelled") {
    return { tickets, result: { success: false, message: "Ce ticket a été annulé." } };
  }
  if (ticket.status === "used") {
    return {
      tickets,
      result: {
        success: false,
        message: `Ticket déjà utilisé le ${new Date(ticket.usedAt!).toLocaleDateString("fr-FR")} par ${ticket.usedByProviderName}.`,
        ticket,
      },
    };
  }

  const updated = tickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status: "used" as const,
          usedAt: new Date().toISOString(),
          usedByProviderId: provider.id,
          usedByProviderName: provider.name,
        }
      : t,
  );

  return {
    tickets: updated,
    result: {
      success: true,
      message: `Repas validé — ${ticket.agentName} (${ticket.ticketNumber}${ticket.mealIndex ? `, repas n°${ticket.mealIndex}` : ""}).`,
      ticket: updated.find((t) => t.id === ticketId),
    },
  };
}

export function getAgentTicket(
  tickets: MealTicket[],
  userId: string,
  month: string,
): MealTicket | undefined {
  return tickets.find(
    (t) => t.userId === userId && t.month === month && t.status !== "cancelled",
  );
}

export function getProviderScannedTickets(
  tickets: MealTicket[],
  providerId: string,
): MealTicket[] {
  return tickets
    .filter((t) => t.usedByProviderId === providerId && t.status === "used")
    .sort((a, b) => (b.usedAt ?? "").localeCompare(a.usedAt ?? ""));
}

export interface ProviderScanStats {
  today: number;
  thisMonth: number;
  totalMeals: number;
  totalTickets: number;
}

export function getProviderScanStats(
  tickets: MealTicket[],
  providerId: string,
  referenceMonth = getCurrentMonth(),
): ProviderScanStats {
  const scanned = getProviderScannedTickets(tickets, providerId);
  const todayStr = new Date().toISOString().slice(0, 10);

  const today = scanned.filter((t) => t.usedAt?.startsWith(todayStr)).length;
  const thisMonth = scanned.filter((t) => t.month === referenceMonth).length;
  const totalMeals = scanned.reduce((sum, t) => sum + mealUnitsOnTicket(t), 0);

  return {
    today,
    thisMonth,
    totalMeals,
    totalTickets: scanned.length,
  };
}

export function formatTicketDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAgentTicketsHistory(
  tickets: MealTicket[],
  userId: string,
): MealTicket[] {
  return tickets
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.month.localeCompare(a.month));
}

export interface AgentMonthSummary {
  activeTickets: MealTicket[];
  usedTickets: MealTicket[];
  mealsRemaining: number;
  mealsUsed: number;
  totalTickets: number;
}

export function getAgentMonthSummary(
  tickets: MealTicket[],
  userId: string,
  month: string,
): AgentMonthSummary {
  const monthTickets = tickets.filter(
    (t) => t.userId === userId && t.month === month && t.status !== "cancelled",
  );
  const activeTickets = monthTickets
    .filter((t) => t.status === "active")
    .sort((a, b) => (a.mealIndex ?? 0) - (b.mealIndex ?? 0));
  const usedTickets = monthTickets
    .filter((t) => t.status === "used")
    .sort((a, b) => (b.usedAt ?? "").localeCompare(a.usedAt ?? ""));

  return {
    activeTickets,
    usedTickets,
    mealsRemaining: countUserActiveMeals(tickets, userId, month),
    mealsUsed: countUserUsedMeals(tickets, userId, month),
    totalTickets: monthTickets.length,
  };
}

export function getAgentAvailableMonths(
  tickets: MealTicket[],
  userId: string,
): string[] {
  const months = new Set(
    tickets
      .filter((t) => t.userId === userId && t.status !== "cancelled")
      .map((t) => t.month),
  );
  months.add(getCurrentMonth());
  return Array.from(months).sort().reverse();
}

export function getAgentTicketsForMonth(
  tickets: MealTicket[],
  userId: string,
  month: string,
): MealTicket[] {
  return tickets
    .filter(
      (t) => t.userId === userId && t.month === month && t.status !== "cancelled",
    )
    .sort((a, b) => {
      const idx = (a.mealIndex ?? 0) - (b.mealIndex ?? 0);
      if (idx !== 0) return idx;
      return a.ticketNumber.localeCompare(b.ticketNumber);
    });
}

export interface MonthTicketsRollup {
  month: string;
  activeCount: number;
  usedCount: number;
  totalCount: number;
}

export function getAgentTicketsHistoryByMonth(
  tickets: MealTicket[],
  userId: string,
  excludeMonth?: string,
): MonthTicketsRollup[] {
  const byMonth = new Map<string, MealTicket[]>();
  for (const t of tickets.filter((x) => x.userId === userId && x.status !== "cancelled")) {
    if (excludeMonth && t.month === excludeMonth) continue;
    const list = byMonth.get(t.month) ?? [];
    list.push(t);
    byMonth.set(t.month, list);
  }
  return Array.from(byMonth.entries())
    .map(([month, list]) => ({
      month,
      activeCount: list.filter((t) => t.status === "active").length,
      usedCount: list.filter((t) => t.status === "used").length,
      totalCount: list.length,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export interface ChefScope {
  service: string;
  domain?: string;
  location?: string;
}

export function filterTicketsForChefScope(
  tickets: MealTicket[],
  scope: ChefScope,
): MealTicket[] {
  return tickets.filter((ticket) => {
    if (ticket.service !== scope.service) return false;
    if (scope.domain?.trim() && ticket.domain !== scope.domain) return false;
    if (scope.location?.trim() && ticket.location !== scope.location) return false;
    return true;
  });
}

export interface ChefTeamStats {
  teamAgentCount: number;
  ticketsIssued: number;
  ticketsActive: number;
  ticketsUsed: number;
  mealsRemaining: number;
  mealsUsed: number;
}

export interface AdminTicketStats {
  ticketsTotal: number;
  ticketsActive: number;
  ticketsUsed: number;
  ticketsCancelled: number;
  mealsRemaining: number;
  mealsUsed: number;
}

export function getAdminTicketStats(tickets: MealTicket[]): AdminTicketStats {
  const active = tickets.filter((t) => t.status === "active");
  const used = tickets.filter((t) => t.status === "used");
  const cancelled = tickets.filter((t) => t.status === "cancelled");

  return {
    ticketsTotal: tickets.length,
    ticketsActive: active.length,
    ticketsUsed: used.length,
    ticketsCancelled: cancelled.length,
    mealsRemaining: active.reduce((sum, t) => sum + mealUnitsOnTicket(t), 0),
    mealsUsed: used.reduce((sum, t) => sum + mealUnitsOnTicket(t), 0),
  };
}

export function cancelMealTicket(
  tickets: MealTicket[],
  ticketId: string,
): { tickets: MealTicket[]; success: boolean; message: string } {
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return { tickets, success: false, message: "Ticket introuvable." };
  }
  if (ticket.status === "used") {
    return {
      tickets,
      success: false,
      message: "Un ticket déjà utilisé ne peut pas être annulé.",
    };
  }
  if (ticket.status === "cancelled") {
    return { tickets, success: false, message: "Ce ticket est déjà annulé." };
  }

  return {
    tickets: tickets.map((t) =>
      t.id === ticketId ? { ...t, status: "cancelled" as const } : t,
    ),
    success: true,
    message: `Ticket ${ticket.ticketNumber} annulé.`,
  };
}

export function getChefTeamStats(
  tickets: MealTicket[],
  month: string,
  scope: ChefScope,
): ChefTeamStats {
  const scoped = filterTicketsForChefScope(
    tickets.filter((t) => t.month === month && t.status !== "cancelled"),
    scope,
  );
  const active = scoped.filter((t) => t.status === "active");
  const used = scoped.filter((t) => t.status === "used");

  return {
    teamAgentCount: new Set(scoped.map((t) => t.userId)).size,
    ticketsIssued: scoped.length,
    ticketsActive: active.length,
    ticketsUsed: used.length,
    mealsRemaining: active.reduce((sum, t) => sum + mealUnitsOnTicket(t), 0),
    mealsUsed: used.reduce((sum, t) => sum + mealUnitsOnTicket(t), 0),
  };
}

/** Nombre total de QR à créer pour une liste d'utilisateurs */
export function previewTicketsToCreate(
  tickets: MealTicket[],
  userIds: string[],
  month: string,
  mealsPerPerson: number,
): number {
  const perPerson = Math.max(1, Math.min(31, Math.floor(mealsPerPerson)));
  return userIds.reduce((sum, userId) => {
    const existing = countUserMonthTickets(tickets, userId, month);
    return sum + Math.max(0, perPerson - existing);
  }, 0);
}
