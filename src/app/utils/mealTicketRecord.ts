import { AppUser } from "../components/admin/UserManagementView";
import { isMealTicketRecipient, MealProviderIdentity } from "./userRoles";

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
const TICKETS_STORAGE_VERSION = "4";
const LEGACY_TICKETS_STORAGE_KEY = "goudurix_meal_tickets";
const QR_PREFIX = "GOUDURIX-REPAS";

export function resetMealTicketsStorage(): void {
  localStorage.removeItem(TICKETS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TICKETS_STORAGE_KEY);
  localStorage.setItem(TICKETS_STORAGE_VERSION_KEY, TICKETS_STORAGE_VERSION);
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

export function saveMealTickets(tickets: MealTicket[]): void {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  localStorage.setItem(TICKETS_STORAGE_VERSION_KEY, TICKETS_STORAGE_VERSION);
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
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
}

function generateTicketNumber(month: string, sequence: number): string {
  const compactMonth = month.replace("-", "");
  return `TR-${compactMonth}-${String(sequence).padStart(5, "0")}`;
}

export function buildQrPayload(ticket: MealTicket): string {
  return `${QR_PREFIX}|${ticket.id}|${ticket.qrToken}|${ticket.ticketNumber}`;
}

export function parseQrPayload(payload: string): {
  ticketId: string;
  qrToken: string;
  ticketNumber: string;
} | null {
  const trimmed = payload.trim();
  if (!trimmed.startsWith(QR_PREFIX)) return null;
  const parts = trimmed.split("|");
  if (parts.length < 4) return null;
  return {
    ticketId: parts[1],
    qrToken: parts[2],
    ticketNumber: parts[3],
  };
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
}

export function generateMonthlyTickets({
  month,
  agents,
  existingTickets,
  mealsPerPerson,
  generatedBy,
  filters,
  selectedUserIds,
}: GenerateTicketsOptions): { tickets: MealTicket[]; created: number; skipped: number } {
  let eligibleRecipients = filterMealTicketRecipients(agents, filters);
  if (selectedUserIds && selectedUserIds.length > 0) {
    const idSet = new Set(selectedUserIds);
    eligibleRecipients = eligibleRecipients.filter((u) => idSet.has(u.id));
  }

  const perPerson = Math.max(1, Math.min(31, Math.floor(mealsPerPerson)));

  const monthTickets = existingTickets.filter((t) => t.month === month);
  let sequence =
    monthTickets.reduce((max, ticket) => {
      const match = ticket.ticketNumber.match(/-(\d{5})$/);
      const num = match ? Number(match[1]) : 0;
      return Math.max(max, num);
    }, 0) + 1;

  const newTickets: MealTicket[] = [];
  let skipped = 0;

  for (const agent of eligibleRecipients) {
    const existingCount = countUserMonthTickets(existingTickets, agent.id, month);
    const toCreate = perPerson - existingCount;

    if (toCreate <= 0) {
      skipped += 1;
      continue;
    }

    for (let i = 0; i < toCreate; i += 1) {
      const mealIndex = existingCount + i + 1;
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
      };
      newTickets.push(ticket);
      sequence += 1;
    }
  }

  return {
    tickets: [...existingTickets, ...newTickets],
    created: newTickets.length,
    skipped,
  };
}

export interface ValidateTicketResult {
  success: boolean;
  message: string;
  ticket?: MealTicket;
}

export function validateMealTicket(
  tickets: MealTicket[],
  ticketId: string,
  qrToken: string,
  provider: MealProviderIdentity,
): { tickets: MealTicket[]; result: ValidateTicketResult } {
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return { tickets, result: { success: false, message: "Ticket introuvable." } };
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
