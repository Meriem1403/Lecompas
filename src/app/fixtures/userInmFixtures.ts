import { UserInmHistoryEntry } from "../utils/mealSubsidyRecord";

/** Historique INM initial pour les comptes de démo (effet au 01/01/2026). */
export const USER_INM_HISTORY_FIXTURES: UserInmHistoryEntry[] = [
  {
    id: "inm-fix-1",
    userId: "1",
    inm: 610,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Jean Dupont",
  },
  {
    id: "inm-fix-2",
    userId: "2",
    inm: 505,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Marie Martin",
  },
  {
    id: "inm-fix-4",
    userId: "4",
    inm: 560,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Sophie Bernard",
  },
  {
    id: "inm-fix-3",
    userId: "3",
    inm: 480,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Pierre Leclerc (agent démo)",
  },
  {
    id: "inm-fix-5",
    userId: "5",
    inm: 520,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Thomas Lambert",
  },
  {
    id: "inm-fix-6",
    userId: "6",
    inm: 550,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Claire Dubois (hors tranche inter.)",
  },
  {
    id: "inm-fix-7",
    userId: "7",
    inm: 390,
    effectiveFrom: "2026-01-01",
    createdAt: "2026-01-01T08:00:00Z",
    note: "Fixture — INM initial Nicolas Petit",
  },
];
