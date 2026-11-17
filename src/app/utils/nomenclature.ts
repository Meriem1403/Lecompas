import raw from "@/app/data/nomenclature-gm-pce-2024.json";

export interface NomenclatureEntry {
  domain: string;
  domainLabel: string;
  segment: string;
  segmentLabel: string;
  code: string;
  shortLabel: string;
  longLabel: string;
  valuation: string;
  pce: string;
  pceLabel: string;
  stockPce: string;
  stockLabel: string;
  fnp: string;
  immo: boolean;
  legacy: boolean;
  remark: string;
}

interface NomenclatureFile {
  version: string;
  deliveredOn: string;
  source: string;
  rows: NomenclatureEntry[];
}

const file = raw as NomenclatureFile;

export const NOMENCLATURE_VERSION = file.version;
export const NOMENCLATURE_DELIVERED_ON = file.deliveredOn;
export const NOMENCLATURE_SOURCE = file.source;
export const NOMENCLATURE_ENTRIES = file.rows;

const BY_CODE = new Map(file.rows.map((row) => [row.code, row]));

export function entryByCode(code: string) {
  return BY_CODE.get(code) ?? null;
}

export function hasAccount(entry: NomenclatureEntry) {
  return /^\d{6,}$/.test(entry.pce);
}

export function isUnused(entry: NomenclatureEntry) {
  return entry.shortLabel.toLowerCase().startsWith("ne pas utiliser");
}

export function chorusText(entry: NomenclatureEntry) {
  return hasAccount(entry) ? `${entry.code} ${entry.pce}` : entry.code;
}

export const SUBSIDY_NATURES = [
  { id: "transfert", label: "Transfert", detail: "Versement à un tiers" },
  { id: "csp", label: "Charge de service public", detail: "Fonctionnement d'un opérateur" },
  { id: "hors-csp", label: "Hors charge de service public", detail: "Subvention qui ne finance pas ce fonctionnement" },
  { id: "oeuvre", label: "Œuvre sociale", detail: "Association, fondation ou restauration" },
  { id: "investissement", label: "Investissement d'un opérateur", detail: "Charge d'investissement" },
] as const;

export type SubsidyNature = (typeof SUBSIDY_NATURES)[number]["id"];
export type SubsidySens = "direct" | "indirect";

export interface SubsidyMatch {
  entry: NomenclatureEntry;
  hint: string;
}

interface SubsidyRoute {
  nature: SubsidyNature;
  beneficiary: string;
  sens: SubsidySens | "";
  code: string;
  hint?: string;
}

const GENERIC = "Ce GM couvre plusieurs bénéficiaires. Le référentiel n'a pas de code plus fin.";

const BENEFICIARY_LABELS: Record<string, string> = {
  menage: "Ménage",
  epic: "EPIC",
  "entreprise-publique": "Entreprise publique",
  "entreprise-privee": "Entreprise privée",
  "institution-monetaire": "Institution monétaire ou assurance",
  hlm: "Organisme HLM",
  region: "Région",
  departement: "Département",
  commune: "Commune ou EPCI",
  eple: "EPLE",
  "competence-territoriale": "Établissement à compétence territoriale",
  "outre-mer": "Collectivité d'outre-mer",
  "autre-collectivite-territoriale": "Autre collectivité territoriale",
  epa: "EPA, EPSCP ou EPST",
  association: "Association ou fondation",
  gip: "GIP",
  "etablissement-prive": "Établissement privé",
  "securite-sociale": "Sécurité sociale",
  hopital: "Hôpital public",
  "organisme-social": "Autre organisme social",
  "orga-international-obligatoire": "Organisation internationale, contribution obligatoire",
  "orga-international-volontaire": "Organisation internationale, contribution volontaire",
  "pays-etranger": "Pays étranger",
  ue: "Union européenne",
  "autre-collectivite": "Autre collectivité",
  "autres-entreprises": "Autres transferts aux entreprises",
  autre: "Autre",
  epn: "EPN",
  entreprise: "Entreprise",
  "asso-culturelle": "Association culturelle ou sportive",
  restauration: "Restauration ou action sociale",
};

const MENAGE_DIRECT = ["07.01.01", "07.01.02", "07.01.03", "07.01.04", "07.01.05", "07.01.06", "07.01.07", "07.01.08", "07.01.09", "07.01.10", "07.01.11"];
const MENAGE_INDIRECT = ["07.02.01", "07.02.02", "07.02.03", "07.02.04", "07.02.05", "07.02.06", "07.02.07", "07.02.08"];

function route(nature: SubsidyNature, beneficiary: string, sens: SubsidySens | "", code: string, hint?: string): SubsidyRoute {
  return { nature, beneficiary, sens, code, hint };
}

const SUBSIDY_ROUTES: SubsidyRoute[] = [
  ...MENAGE_DIRECT.map((code) => route("transfert", "menage", "direct", code)),
  ...MENAGE_INDIRECT.map((code) => route("transfert", "menage", "indirect", code)),
  route("transfert", "epic", "direct", "08.01.01"),
  route("transfert", "epic", "indirect", "09.01.01", GENERIC),
  route("transfert", "entreprise-publique", "direct", "08.02.01"),
  route("transfert", "entreprise-publique", "indirect", "09.01.01", GENERIC),
  route("transfert", "entreprise-privee", "direct", "08.03.01"),
  route("transfert", "entreprise-privee", "indirect", "09.01.01", GENERIC),
  route("transfert", "institution-monetaire", "direct", "08.04.01"),
  route("transfert", "hlm", "direct", "08.05.01"),
  route("transfert", "autres-entreprises", "indirect", "09.02.01"),
  route("transfert", "region", "direct", "10.01.01"),
  route("transfert", "region", "indirect", "11.01.01", GENERIC),
  route("transfert", "departement", "direct", "10.02.01"),
  route("transfert", "departement", "indirect", "11.01.01", GENERIC),
  route("transfert", "commune", "direct", "10.03.01"),
  route("transfert", "commune", "indirect", "11.01.01", GENERIC),
  route("transfert", "eple", "direct", "10.04.01"),
  route("transfert", "eple", "indirect", "11.01.01", GENERIC),
  route("transfert", "competence-territoriale", "direct", "10.05.01"),
  route("transfert", "competence-territoriale", "indirect", "11.01.01", GENERIC),
  route("transfert", "outre-mer", "direct", "10.06.01"),
  route("transfert", "outre-mer", "indirect", "11.02.01"),
  route("transfert", "autre-collectivite-territoriale", "direct", "10.07.01"),
  route("transfert", "autre-collectivite-territoriale", "indirect", "11.01.01", GENERIC),
  route("transfert", "epa", "direct", "12.01.01"),
  route("transfert", "epa", "indirect", "13.01.01", GENERIC),
  route("transfert", "association", "direct", "12.02.01"),
  route("transfert", "association", "indirect", "13.01.01", GENERIC),
  route("transfert", "gip", "direct", "12.03.01"),
  route("transfert", "gip", "indirect", "13.01.01", GENERIC),
  route("transfert", "etablissement-prive", "direct", "12.04.01"),
  route("transfert", "etablissement-prive", "indirect", "13.01.01", GENERIC),
  route("transfert", "securite-sociale", "direct", "12.05.01"),
  route("transfert", "hopital", "direct", "12.05.02"),
  route("transfert", "organisme-social", "direct", "12.05.04"),
  route("transfert", "orga-international-obligatoire", "direct", "12.06.01"),
  route("transfert", "orga-international-volontaire", "direct", "12.06.02"),
  route("transfert", "pays-etranger", "direct", "12.07.01"),
  route("transfert", "pays-etranger", "indirect", "13.02.01"),
  route("transfert", "ue", "direct", "12.08.01"),
  route("transfert", "autre-collectivite", "direct", "12.09.01"),
  route("transfert", "autre-collectivite", "indirect", "13.01.01", GENERIC),
  route("transfert", "autre", "direct", "14.01.01"),
  route("csp", "epn", "", "16.01.01"),
  route("csp", "association", "", "16.02.01"),
  route("csp", "gip", "", "16.03.01"),
  route("csp", "autre", "", "16.04.01"),
  route("hors-csp", "entreprise", "", "47.01.01"),
  route("hors-csp", "autre", "", "47.01.02"),
  route("oeuvre", "asso-culturelle", "", "15.01.01"),
  route("oeuvre", "association", "", "15.01.02"),
  route("oeuvre", "restauration", "", "15.01.03"),
  route("investissement", "epn", "", "26.01.37"),
  route("investissement", "association", "", "26.01.38"),
  route("investissement", "gip", "", "26.01.39"),
  route("investissement", "autre", "", "26.01.40"),
];

export function subsidyBeneficiaryLabel(id: string) {
  return BENEFICIARY_LABELS[id] || id;
}

export function subsidyBeneficiaries(nature: SubsidyNature) {
  const seen: string[] = [];
  for (const item of SUBSIDY_ROUTES) {
    if (item.nature === nature && !seen.includes(item.beneficiary)) seen.push(item.beneficiary);
  }
  return seen;
}

export function subsidySenses(nature: SubsidyNature, beneficiary: string): SubsidySens[] {
  const senses: SubsidySens[] = [];
  for (const item of SUBSIDY_ROUTES) {
    if (item.nature !== nature || item.beneficiary !== beneficiary || !item.sens) continue;
    if (!senses.includes(item.sens)) senses.push(item.sens);
  }
  return senses;
}

export function subsidyMatches(nature: SubsidyNature, beneficiary: string, sens: SubsidySens | ""): SubsidyMatch[] {
  return SUBSIDY_ROUTES.filter((item) => item.nature === nature && item.beneficiary === beneficiary && item.sens === sens)
    .flatMap((item) => {
      const entry = entryByCode(item.code);
      return entry ? [{ entry, hint: item.hint || "" }] : [];
    });
}

export function subsidyRouteCodes() {
  return SUBSIDY_ROUTES.map((item) => item.code);
}

export interface NomenclatureSearchOptions {
  includeLegacy?: boolean;
  domain?: string;
  segment?: string;
  account?: "" | "compte" | "technique";
  immo?: "" | "oui" | "non";
}

export function nomenclatureDomains(includeLegacy = false) {
  const seen = new Map<string, string>();
  for (const entry of NOMENCLATURE_ENTRIES) {
    if (entry.legacy && !includeLegacy) continue;
    if (!seen.has(entry.domain)) seen.set(entry.domain, entry.domainLabel);
  }
  return [...seen].map(([code, label]) => ({ code, label })).sort((a, b) => a.code.localeCompare(b.code, "fr", { numeric: true }));
}

export function nomenclatureSegments(domain: string, includeLegacy = false) {
  const seen = new Map<string, string>();
  for (const entry of NOMENCLATURE_ENTRIES) {
    if (entry.domain !== domain) continue;
    if (entry.legacy && !includeLegacy) continue;
    if (!seen.has(entry.segment)) seen.set(entry.segment, entry.segmentLabel);
  }
  return [...seen].map(([code, label]) => ({ code, label })).sort((a, b) => a.code.localeCompare(b.code, "fr", { numeric: true }));
}

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function haystack(entry: NomenclatureEntry) {
  return fold([
    entry.domain,
    entry.domainLabel,
    entry.segment,
    entry.segmentLabel,
    entry.code,
    entry.shortLabel,
    entry.longLabel,
    entry.pce,
    entry.pceLabel,
    entry.stockPce,
    entry.stockLabel,
  ].join(" "));
}

export function searchNomenclature(query: string, options?: NomenclatureSearchOptions) {
  const folded = fold(query).trim();
  const domain = options?.domain || "";
  const segment = options?.segment || "";
  const hasText = folded.length >= 2;
  if (!hasText && !domain && !segment) return [];
  const includeLegacy = Boolean(options?.includeLegacy) || folded.includes("ex-") || folded.startsWith("ex ");
  const tokens = hasText ? folded.split(/\s+/).filter(Boolean) : [];
  const ranked = NOMENCLATURE_ENTRIES.flatMap((entry) => {
    if (entry.legacy && !includeLegacy) return [];
    if (domain && entry.domain !== domain) return [];
    if (segment && entry.segment !== segment) return [];
    if (options?.account === "compte" && !hasAccount(entry)) return [];
    if (options?.account === "technique" && entry.pce !== "TECHNIQUE") return [];
    if (options?.immo === "oui" && !entry.immo) return [];
    if (options?.immo === "non" && entry.immo) return [];
    const code = fold(entry.code);
    if (tokens.length && !tokens.every((token) => haystack(entry).includes(token))) return [];
    let score = 1;
    if (hasText && code === folded) score += 100;
    else if (hasText && code.startsWith(folded)) score += 40;
    if (hasText && fold(entry.pce) === folded) score += 80;
    else if (hasText && entry.pce.startsWith(folded)) score += 25;
    if (hasText && fold(entry.shortLabel).includes(folded)) score += 15;
    if (entry.legacy) score -= 8;
    if (isUnused(entry)) score -= 30;
    return [{ entry, score }];
  });
  ranked.sort((a, b) => b.score - a.score || a.entry.code.localeCompare(b.entry.code, "fr", { numeric: true }));
  return ranked.map((item) => item.entry);
}
