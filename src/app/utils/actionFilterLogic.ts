import type { Action } from "@/app/components/ActionsView";

export interface ActionFilters {
  sources: string[];
  statuses: string[];
  priorities: string[];
  papripactModes: string[];
  services: string[];
  responsables: string[];
  papripactYears: string[];
  overdueOnly: boolean;
}

export const emptyActionFilters = (): ActionFilters => ({
  sources: [],
  statuses: [],
  priorities: [],
  papripactModes: [],
  services: [],
  responsables: [],
  papripactYears: [],
  overdueOnly: false,
});

function includesAny(selected: string[], value: string) {
  if (selected.length === 0) return true;
  return selected.includes(value);
}

function includesAnyInList(selected: string[], values: string[]) {
  if (selected.length === 0) return true;
  return values.some((value) => selected.includes(value));
}

function isActionOverdue(action: Action) {
  if (action.status === "Terminée") return false;
  if (action.status === "En retard") return true;
  if (!action.deadline) return false;
  const deadline = new Date(action.deadline);
  if (Number.isNaN(deadline.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
}

export function matchesActionFilters(
  action: Action,
  filters: ActionFilters,
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase();
  if (query.length > 0) {
    const haystack = [
      action.title,
      action.description,
      action.riskTitle,
      action.responsable,
      action.site,
      ...(action.services || []),
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (!includesAny(filters.sources, action.source || "MANUEL")) return false;
  if (!includesAny(filters.statuses, action.status)) return false;
  if (!includesAny(filters.priorities, action.priority)) return false;

  if (filters.papripactModes.length > 0) {
    const isPapripact = Boolean(action.papripactYear);
    const matchesRetenue =
      filters.papripactModes.includes("retenue") && isPapripact;
    const matchesHors = filters.papripactModes.includes("hors") && !isPapripact;
    if (!matchesRetenue && !matchesHors) return false;
  }

  const serviceValues = action.services?.length
    ? action.services
    : ["DIRM MED"];
  if (!includesAnyInList(filters.services, serviceValues)) return false;
  if (!includesAny(filters.responsables, action.responsable)) return false;

  if (filters.papripactYears.length > 0) {
    const year = action.papripactYear ? String(action.papripactYear) : "";
    if (!filters.papripactYears.includes(year)) return false;
  }

  if (filters.overdueOnly && !isActionOverdue(action)) return false;

  return true;
}

export function hasActiveActionFilters(filters: ActionFilters, searchQuery: string) {
  return (
    searchQuery.trim().length > 0 ||
    filters.sources.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.papripactModes.length > 0 ||
    filters.services.length > 0 ||
    filters.responsables.length > 0 ||
    filters.papripactYears.length > 0 ||
    filters.overdueOnly
  );
}
