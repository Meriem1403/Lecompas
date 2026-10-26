export type ReservationDomainId =
  | "salles-reunion"
  | "vehicules-ajaccio"
  | "vehicules-port-la-nouvelle"
  | "vehicules-sete"
  | "vehicules-zattara"
  | "visio-lifesize";

export interface ReservationResource {
  id: string;
  domainId: ReservationDomainId;
  label: string;
  detail?: string;
}

export interface ReservationDomain {
  id: ReservationDomainId;
  label: string;
}

export const RESERVATION_DOMAINS: ReservationDomain[] = [
  { id: "salles-reunion", label: "SALLES DE REUNION" },
  { id: "vehicules-ajaccio", label: "VEHICULES COB AJACCIO" },
  { id: "vehicules-port-la-nouvelle", label: "VEHICULES PORT LA NOUVELLE" },
  { id: "vehicules-sete", label: "VEHICULES SETE" },
  { id: "vehicules-zattara", label: "VEHICULES SIEGE ZATTARA" },
  { id: "visio-lifesize", label: "VISIO LIFESIZE" },
];

export const RESERVATION_RESOURCES: ReservationResource[] = [
  {
    id: "peugeot-308",
    domainId: "vehicules-zattara",
    label: "Peugeot 308 - GK-873-WM",
    detail: "ESSENCE / Trajets Longs — Plateau Direction",
  },
  {
    id: "renault-clio",
    domainId: "vehicules-zattara",
    label: "Renault CLIO - FR-144-QV",
    detail: "ESSENCE — Plateau Direction",
  },
  {
    id: "peugeot-e208",
    domainId: "vehicules-zattara",
    label: "Peugeot e-208 - GF-717-RC",
    detail: "Parking sous-sol — Ne jamais laisser le câble (vol)",
  },
  {
    id: "salle-med-1",
    domainId: "salles-reunion",
    label: "Salle réunion Marseille — Zattara",
    detail: "Capacité 12 personnes",
  },
  {
    id: "visio-1",
    domainId: "visio-lifesize",
    label: "Lifesize visio DIRM-MED1",
  },
  {
    id: "visio-2",
    domainId: "visio-lifesize",
    label: "Lifesize visio2",
  },
  {
    id: "visio-3",
    domainId: "visio-lifesize",
    label: "Lifesize visio3",
  },
];

/** Type / site (champ « Type » du formulaire GRR). */
export const RESERVATION_SITE_TYPES = [
  "Marseille",
  "Toulon",
  "Occitanie",
  "Corse",
  "Astreinte",
  "Autre",
  "Lifesize visio DIRM-MED1",
  "Lifesize visio2",
  "Lifesize visio3",
] as const;

export type ReservationSiteType = (typeof RESERVATION_SITE_TYPES)[number];

export const ALL_DAY_START = "07:00";
export const ALL_DAY_END = "20:00";
export const PLANNER_SLOT_MINUTES = 30;
