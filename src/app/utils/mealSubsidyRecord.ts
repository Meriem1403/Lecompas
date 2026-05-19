import { AppUser, Location } from "../components/admin/UserManagementView";
import { USER_INM_HISTORY_FIXTURES } from "../fixtures/userInmFixtures";

/** Période tarifaire (souvent alignée sur l'année civile). */
export interface MealSubsidyPeriod {
  id: string;
  label: string;
  /** Date de début d'application (YYYY-MM-DD). */
  validFrom: string;
  /** Date de fin optionnelle (YYYY-MM-DD). */
  validTo?: string;
  /**
   * Montant interministériel national (€ / repas) pour les agents éligibles
   * selon les tranches d'INM de la période.
   */
  interministerialAmount: number;
}

/** Tranche d'indice majoré (INM) déterminant l'éligibilité interministérielle. */
export interface InmSubsidyBracket {
  id: string;
  periodId: string;
  minInm: number;
  maxInm: number;
  grantsInterministerial: boolean;
}

/** Subvention ministérielle par lieu et par période (€ / repas). */
export interface MinisterialSubsidyRate {
  id: string;
  periodId: string;
  locationId: string;
  locationName: string;
  amount: number;
}

export interface MealSubsidyConfig {
  periods: MealSubsidyPeriod[];
  inmBrackets: InmSubsidyBracket[];
  ministerialRates: MinisterialSubsidyRate[];
}

export interface UserInmHistoryEntry {
  id: string;
  userId: string;
  inm: number;
  /** Date d'effet (YYYY-MM-DD) — ex. passage à 556 au 2026-04-01. */
  effectiveFrom: string;
  note?: string;
  createdAt: string;
}

export interface AgentMealSubsidyBreakdown {
  period: MealSubsidyPeriod | null;
  inm: number | null;
  ministerialAmount: number;
  interministerialAmount: number;
  totalPerMeal: number;
  eligibleInterministerial: boolean;
}

const SUBSIDY_CONFIG_KEY = "goudurix_meal_subsidy_config";
const SUBSIDY_CONFIG_VERSION_KEY = "goudurix_meal_subsidy_config_version";
/** Incrémenter pour ré-harmoniser lieux / barèmes en local. */
const SUBSIDY_CONFIG_VERSION = "3";

export function normalizeLocationKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
const INM_HISTORY_KEY = "goudurix_user_inm_history";
const INM_HISTORY_VERSION_KEY = "goudurix_user_inm_history_version";
/** Incrémenter pour réinitialiser l'historique INM de démo en local. */
const INM_HISTORY_VERSION = "1";

/** Barème 2025 issu de « MONTANTS DES SUBVENTIONS 2025 » (département → ministérielle). */
const DEFAULT_MINISTERIAL_BY_REGION: Record<string, number> = {
  "2A": 3,
  "2B": 3.74,
  "6": 3.91,
  "11": 2.89,
  "13": 3.4,
  "34": 8.85,
  "83": 1.6,
};

const DEFAULT_PERIOD_2026: MealSubsidyPeriod = {
  id: "period-2026",
  label: "2026",
  validFrom: "2026-01-01",
  interministerialAmount: 1.62,
};

function buildDefaultConfig(locations: Pick<Location, "id" | "name" | "regionCode">[]): MealSubsidyConfig {
  const period = DEFAULT_PERIOD_2026;
  const ministerialRates: MinisterialSubsidyRate[] = locations
    .filter((loc) => loc.regionCode && DEFAULT_MINISTERIAL_BY_REGION[loc.regionCode])
    .map((loc) => ({
      id: `min-${period.id}-${loc.id}`,
      periodId: period.id,
      locationId: loc.id,
      locationName: loc.name,
      amount: DEFAULT_MINISTERIAL_BY_REGION[loc.regionCode!],
    }));

  return {
    periods: [period],
    inmBrackets: [
      {
        id: "inm-2026-eligible",
        periodId: period.id,
        minInm: 0,
        maxInm: 539,
        grantsInterministerial: true,
      },
      {
        id: "inm-2026-ineligible",
        periodId: period.id,
        minInm: 540,
        maxInm: 9999,
        grantsInterministerial: false,
      },
    ],
    ministerialRates,
  };
}

/** Normalise une date vers YYYY-MM-DD (tolère ISO et formats navigateur). */
export function normalizeDateIso(dateInput: string): string {
  const trimmed = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed.slice(0, 10))) {
    return trimmed.slice(0, 10);
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return trimmed.slice(0, 10);
}

export function periodCoversMonth(period: MealSubsidyPeriod, month: string): boolean {
  const monthStart = `${month}-01`;
  const monthEnd = getLastDayOfMonth(month);
  const from = normalizeDateIso(period.validFrom);
  const to = period.validTo ? normalizeDateIso(period.validTo) : "9999-12-31";
  return from <= monthEnd && to >= monthStart;
}

function ensureYearPeriod(config: MealSubsidyConfig, year: string): MealSubsidyConfig {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const alreadyCovers = config.periods.some((p) => {
    const from = normalizeDateIso(p.validFrom);
    const to = p.validTo ? normalizeDateIso(p.validTo) : "9999-12-31";
    return from <= yearEnd && to >= yearStart;
  });
  if (alreadyCovers) return config;

  const periodId = `period-${year}`;
  if (config.periods.some((p) => p.id === periodId)) return config;

  const template =
    [...config.periods].sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] ??
    DEFAULT_PERIOD_2026;

  const newPeriod: MealSubsidyPeriod = {
    id: periodId,
    label: year,
    validFrom: yearStart,
    validTo: yearEnd,
    interministerialAmount: template.interministerialAmount || 1.62,
  };

  let ministerialRates = [...config.ministerialRates];
  for (const rate of config.ministerialRates.filter((r) => r.periodId === template.id)) {
    if (!ministerialRates.some((r) => r.periodId === periodId && r.locationId === rate.locationId)) {
      ministerialRates.push({
        ...rate,
        id: `min-${periodId}-${rate.locationId}`,
        periodId,
      });
    }
  }

  let inmBrackets = [...config.inmBrackets];
  if (!inmBrackets.some((b) => b.periodId === periodId)) {
    inmBrackets = [...inmBrackets, ...defaultInmBracketsForPeriod(periodId)];
  }

  return {
    ...config,
    periods: [...config.periods, newPeriod],
    ministerialRates,
    inmBrackets,
  };
}

/** Garantit au moins une période pour l'année du mois + année courante. */
export function repairMealSubsidyConfig(
  config: MealSubsidyConfig,
  locations: Pick<Location, "id" | "name" | "regionCode">[] = [],
): MealSubsidyConfig {
  const currentYear = String(new Date().getFullYear());
  let periods = config.periods.map((p) => ({
    ...p,
    validFrom: normalizeDateIso(p.validFrom),
    validTo: p.validTo ? normalizeDateIso(p.validTo) : undefined,
  }));

  let result: MealSubsidyConfig = { ...config, periods };
  if (result.periods.length === 0) {
    return hydrateMealSubsidyConfig(buildDefaultConfig(locations), locations);
  }

  const years = new Set<string>([currentYear, "2025", "2026", "2027"]);
  for (const p of result.periods) {
    years.add(normalizeDateIso(p.validFrom).slice(0, 4));
  }

  for (const year of years) {
    result = ensureYearPeriod(result, year);
  }

  return hydrateMealSubsidyConfig(result, locations);
}

function defaultInmBracketsForPeriod(periodId: string): InmSubsidyBracket[] {
  return [
    {
      id: `inm-${periodId}-eligible`,
      periodId,
      minInm: 0,
      maxInm: 539,
      grantsInterministerial: true,
    },
    {
      id: `inm-${periodId}-ineligible`,
      periodId,
      minInm: 540,
      maxInm: 9999,
      grantsInterministerial: false,
    },
  ];
}

/** Aligne les tarifs stockés avec le catalogue lieux et complète les montants manquants. */
export function hydrateMealSubsidyConfig(
  config: MealSubsidyConfig,
  locations: Pick<Location, "id" | "name" | "regionCode">[],
): MealSubsidyConfig {
  let ministerialRates = [...config.ministerialRates];
  let inmBrackets = [...config.inmBrackets];

  for (const period of config.periods) {
    if (!inmBrackets.some((b) => b.periodId === period.id)) {
      inmBrackets = [...inmBrackets, ...defaultInmBracketsForPeriod(period.id)];
    }

    for (const loc of locations) {
      const norm = normalizeLocationKey(loc.name);
      const idx = ministerialRates.findIndex(
        (r) =>
          r.periodId === period.id &&
          (r.locationId === loc.id || normalizeLocationKey(r.locationName) === norm),
      );

      if (idx >= 0) {
        const existing = ministerialRates[idx];
        ministerialRates[idx] = {
          ...existing,
          locationId: loc.id,
          locationName: loc.name,
        };
      } else if (loc.regionCode && DEFAULT_MINISTERIAL_BY_REGION[loc.regionCode] != null) {
        ministerialRates.push({
          id: `min-${period.id}-${loc.id}`,
          periodId: period.id,
          locationId: loc.id,
          locationName: loc.name,
          amount: DEFAULT_MINISTERIAL_BY_REGION[loc.regionCode],
        });
      }
    }
  }

  return { ...config, ministerialRates, inmBrackets };
}

export function loadMealSubsidyConfig(
  locations: Pick<Location, "id" | "name" | "regionCode">[] = [],
): MealSubsidyConfig {
  try {
    const version = localStorage.getItem(SUBSIDY_CONFIG_VERSION_KEY);
    const raw = localStorage.getItem(SUBSIDY_CONFIG_KEY);
    if (!raw) {
      const built = buildDefaultConfig(locations);
      saveMealSubsidyConfig(built);
      return built;
    }
    const parsed = JSON.parse(raw) as MealSubsidyConfig;
    if (!parsed?.periods?.length) {
      const built = buildDefaultConfig(locations);
      saveMealSubsidyConfig(built);
      return built;
    }
    const repaired = repairMealSubsidyConfig(parsed, locations);
    const shouldPersist =
      version !== SUBSIDY_CONFIG_VERSION ||
      JSON.stringify(repaired) !== JSON.stringify(parsed);
    if (shouldPersist) {
      saveMealSubsidyConfig(repaired);
    }
    return repaired;
  } catch {
    return buildDefaultConfig(locations);
  }
}

export function saveMealSubsidyConfig(config: MealSubsidyConfig): void {
  localStorage.setItem(SUBSIDY_CONFIG_KEY, JSON.stringify(config));
  localStorage.setItem(SUBSIDY_CONFIG_VERSION_KEY, SUBSIDY_CONFIG_VERSION);
}

export function loadUserInmHistory(): UserInmHistoryEntry[] {
  try {
    const version = localStorage.getItem(INM_HISTORY_VERSION_KEY);
    if (version !== INM_HISTORY_VERSION) {
      return [...USER_INM_HISTORY_FIXTURES];
    }
    const raw = localStorage.getItem(INM_HISTORY_KEY);
    if (!raw) return [...USER_INM_HISTORY_FIXTURES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...USER_INM_HISTORY_FIXTURES];
  } catch {
    return [...USER_INM_HISTORY_FIXTURES];
  }
}

export function saveUserInmHistory(entries: UserInmHistoryEntry[]): void {
  localStorage.setItem(INM_HISTORY_KEY, JSON.stringify(entries));
  localStorage.setItem(INM_HISTORY_VERSION_KEY, INM_HISTORY_VERSION);
}

export function getLastDayOfMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const last = new Date(year, monthNum, 0).getDate();
  return `${month}-${String(last).padStart(2, "0")}`;
}

export function getActivePeriod(
  config: MealSubsidyConfig,
  dateIso: string,
): MealSubsidyPeriod | null {
  const target = normalizeDateIso(dateIso);
  const matches = config.periods.filter((p) => {
    const from = normalizeDateIso(p.validFrom);
    const to = p.validTo ? normalizeDateIso(p.validTo) : "9999-12-31";
    if (target < from) return false;
    if (target > to) return false;
    return true;
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
}

/** Période tarifaire applicable à un mois (YYYY-MM). */
export function getActivePeriodForMonth(
  config: MealSubsidyConfig,
  month: string,
): MealSubsidyPeriod | null {
  if (!config.periods.length) return null;

  const covering = config.periods.filter((p) => periodCoversMonth(p, month));
  if (covering.length > 0) {
    return covering.sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
  }

  const strict =
    getActivePeriod(config, getLastDayOfMonth(month)) ??
    getActivePeriod(config, `${month}-01`);
  if (strict) return strict;

  const year = month.slice(0, 4);
  const byYear = config.periods.filter(
    (p) =>
      p.id.includes(year) ||
      p.label.includes(year) ||
      normalizeDateIso(p.validFrom).startsWith(year),
  );
  if (byYear.length > 0) {
    return byYear.sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
  }

  const monthEnd = getLastDayOfMonth(month);
  const started = config.periods.filter(
    (p) => normalizeDateIso(p.validFrom) <= monthEnd,
  );
  if (started.length > 0) {
    return started.sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
  }

  return config.periods[0] ?? null;
}

export function getInmForDate(
  history: UserInmHistoryEntry[],
  userId: string,
  dateIso: string,
  fallbackInm?: number,
): number | null {
  const target = dateIso.slice(0, 10);
  const userEntries = history
    .filter((e) => e.userId === userId && e.effectiveFrom.slice(0, 10) <= target)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  if (userEntries.length > 0) return userEntries[0].inm;
  return fallbackInm ?? null;
}

export function getInmForMonth(
  history: UserInmHistoryEntry[],
  userId: string,
  month: string,
  fallbackInm?: number,
): number | null {
  return getInmForDate(history, userId, getLastDayOfMonth(month), fallbackInm);
}

export function isEligibleInterministerial(
  config: MealSubsidyConfig,
  periodId: string,
  inm: number | null,
): boolean {
  if (inm == null) return false;
  const bracket = config.inmBrackets.find(
    (b) =>
      b.periodId === periodId &&
      inm >= b.minInm &&
      inm <= b.maxInm &&
      b.grantsInterministerial,
  );
  return Boolean(bracket);
}

export function getMinisterialAmount(
  config: MealSubsidyConfig,
  periodId: string,
  locationId: string,
  locationName: string,
  locationCatalog: Pick<Location, "id" | "name" | "regionCode">[] = [],
): number {
  const normName = normalizeLocationKey(locationName);
  const rate = config.ministerialRates.find(
    (r) =>
      r.periodId === periodId &&
      (r.locationId === locationId ||
        normalizeLocationKey(r.locationName) === normName),
  );
  if (rate && rate.amount > 0) return rate.amount;

  const catalogEntry =
    locationCatalog.find((l) => l.id === locationId) ??
    locationCatalog.find((l) => normalizeLocationKey(l.name) === normName);

  if (catalogEntry?.regionCode && DEFAULT_MINISTERIAL_BY_REGION[catalogEntry.regionCode] != null) {
    return DEFAULT_MINISTERIAL_BY_REGION[catalogEntry.regionCode];
  }

  return rate?.amount ?? 0;
}

export function computeAgentMealSubsidy(
  config: MealSubsidyConfig,
  params: {
    month: string;
    locationId: string;
    locationName: string;
    inm: number | null;
    locationCatalog?: Pick<Location, "id" | "name" | "regionCode">[];
  },
): AgentMealSubsidyBreakdown {
  const period = getActivePeriodForMonth(config, params.month);
  if (!period) {
    return {
      period: null,
      inm: params.inm,
      ministerialAmount: 0,
      interministerialAmount: 0,
      totalPerMeal: 0,
      eligibleInterministerial: false,
    };
  }

  const ministerialAmount = getMinisterialAmount(
    config,
    period.id,
    params.locationId,
    params.locationName,
    params.locationCatalog ?? [],
  );
  const eligibleInter = isEligibleInterministerial(config, period.id, params.inm);
  const interministerialAmount = eligibleInter ? period.interministerialAmount : 0;

  return {
    period,
    inm: params.inm,
    ministerialAmount,
    interministerialAmount,
    totalPerMeal: roundMoney(ministerialAmount + interministerialAmount),
    eligibleInterministerial: eligibleInter,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function upsertMinisterialRate(
  config: MealSubsidyConfig,
  rate: Omit<MinisterialSubsidyRate, "id"> & { id?: string },
): MealSubsidyConfig {
  const id = rate.id ?? `min-${rate.periodId}-${rate.locationId}`;
  const next = config.ministerialRates.filter(
    (r) => !(r.periodId === rate.periodId && r.locationId === rate.locationId),
  );
  next.push({
    id,
    periodId: rate.periodId,
    locationId: rate.locationId,
    locationName: rate.locationName,
    amount: rate.amount,
  });
  return { ...config, ministerialRates: next };
}

export function appendInmHistoryEntry(
  history: UserInmHistoryEntry[],
  entry: Omit<UserInmHistoryEntry, "id" | "createdAt">,
): UserInmHistoryEntry[] {
  return [
    ...history,
    {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    },
  ];
}

export function resolveLocationId(
  locations: Pick<Location, "id" | "name">[],
  locationName: string,
): string {
  const norm = normalizeLocationKey(locationName);
  const match = locations.find((l) => normalizeLocationKey(l.name) === norm);
  return match?.id ?? locationName.trim();
}

export interface AgentSubsidyPreview extends AgentMealSubsidyBreakdown {
  warnings: string[];
}

/** Prévisualise la subvention pour un agent (INM + lieu → barèmes). */
export function previewAgentMealSubsidy(
  agent: AppUser,
  month: string,
  config: MealSubsidyConfig | undefined,
  inmHistory: UserInmHistoryEntry[],
  locationCatalog: Pick<Location, "id" | "name" | "regionCode">[],
): AgentSubsidyPreview {
  const warnings: string[] = [];
  const inm = getInmForMonth(inmHistory, agent.id, month, agent.inm);

  if (!agent.location?.trim()) {
    warnings.push("Lieu de travail non renseigné dans la fiche utilisateur");
  }
  if (inm == null) {
    warnings.push("INM non renseigné (fiche utilisateur ou historique)");
  }

  if (!config) {
    warnings.push("Configurez les tarifs dans « Tarifs & subventions »");
    return {
      period: null,
      inm,
      ministerialAmount: 0,
      interministerialAmount: 0,
      totalPerMeal: 0,
      eligibleInterministerial: false,
      warnings,
    };
  }

  const locationId = resolveLocationId(locationCatalog, agent.location);
  const breakdown = computeAgentMealSubsidy(config, {
    month,
    locationId,
    locationName: agent.location,
    inm,
    locationCatalog,
  });

  if (!breakdown.period) {
    warnings.push(
      "Aucune période tarifaire configurée — ouvrez Tarifs & subventions et enregistrez une période",
    );
  } else if (breakdown.ministerialAmount === 0 && agent.location?.trim()) {
    warnings.push(
      `Aucun montant ministériel pour « ${agent.location} » (période ${breakdown.period.label}, onglet Tarifs)`,
    );
  }
  if (breakdown.period && inm != null && !breakdown.eligibleInterministerial) {
    warnings.push(`INM ${inm} : pas de subvention interministérielle pour ce mois`);
  }

  return { ...breakdown, warnings };
}
