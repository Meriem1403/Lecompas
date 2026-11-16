import type {
  AsbestosRegisterRow,
  AsbestosRegisterRowKind,
  AsbestosSiteDtaRow,
} from "@/app/types/importedRegisters";

export function kindLabel(kind: AsbestosRegisterRowKind): string {
  switch (kind) {
    case "synthese":
      return "Synthèse MCA";
    case "controle":
      return "Contrôle / DTA";
    case "materiau":
      return "Matériau / zone";
    case "historique":
      return "Historique";
    default:
      return "Registre";
  }
}

export function formatMaybeExcelDate(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "—";
  if (/^\d{4,5}$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 30_000 && serial < 60_000) {
      const utc = new Date((serial - 25_569) * 86_400_000);
      if (!Number.isNaN(utc.getTime())) {
        return utc.toLocaleDateString("fr-FR");
      }
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw.slice(0, 10));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("fr-FR");
    }
  }
  return raw;
}

export function scoreTone(scoreRaw: string | undefined): {
  label: string;
  className: string;
} {
  const s = (scoreRaw ?? "").toUpperCase();
  if (!s || s === "—" || s === "-") {
    return {
      label: "—",
      className: "bg-slate-100 text-slate-700 border-slate-300",
    };
  }
  if (s.includes("AC2") || s.includes("URGENT")) {
    return {
      label: scoreRaw!.trim(),
      className: "bg-red-100 text-red-900 border-red-300 font-semibold",
    };
  }
  if (s.includes("AC1")) {
    return {
      label: scoreRaw!.trim(),
      className: "bg-orange-100 text-orange-900 border-orange-300 font-semibold",
    };
  }
  if (s.includes("EP")) {
    return {
      label: scoreRaw!.trim(),
      className: "bg-emerald-100 text-emerald-900 border-emerald-300",
    };
  }
  return {
    label: scoreRaw!.trim(),
    className: "bg-indigo-50 text-indigo-900 border-indigo-200",
  };
}

export const AMIANTE_ZONES = [
  "Toiture",
  "Bardage",
  "Façade",
  "Faux plafond",
  "Sol",
  "Cloisons",
  "Cages d'escalier",
  "Circulations",
  "Bureaux",
  "Bureau",
  "Vestiaires",
  "Sanitaires",
  "Cuisine",
  "Chaufferie",
  "Local technique",
  "Local de stockage",
  "Hangar",
  "Magasin",
  "Atelier",
  "Porche",
  "Gaines et réseaux",
  "Zones non accessibles",
] as const;

export const AMIANTE_MATERIAUX = [
  "Toiture et bardage en fibres-ciment",
  "Plaques de toiture en fibres-ciment",
  "Toiture en fibres-ciment",
  "Conduits en fibres-ciment",
  "Plaques planes en fibres-ciment",
  "Canalisations en fibres-ciment",
  "Bardage en fibres-ciment",
  "Dalles de sol et colle",
  "Dalles de sol",
  "Isolants de faux plafonds",
  "Faux plafonds",
  "Calorifugeages",
  "Flocages",
  "Enduits",
  "Joints",
  "Peintures",
  "Revêtements de sol",
  "Carton amiante",
] as const;

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function mentions(haystack: string, needle: string): boolean {
  const text = fold(haystack);
  const probe = fold(needle);
  if (probe.length > 2 && text.includes(probe)) return true;
  const singular = probe.replace(/s$/g, "");
  return singular.length > 2 && singular !== probe && text.includes(singular);
}

function matchList(text: string, list: readonly string[]): string {
  return list
    .filter((item) => mentions(text, item) || mentions(text, item.replace(" et ", " + ")))
    .sort((left, right) => right.length - left.length)[0] || "";
}

function listed(value: string, list: readonly string[]): boolean {
  return (list as readonly string[]).includes(value);
}

export function displayZone(row: AsbestosRegisterRow): string {
  const explicit = (row.zone || "").trim();
  if (listed(explicit, AMIANTE_ZONES)) return explicit;
  return matchList(`${explicit} ${row.localisation || ""} ${row.lieuZone || ""}`, AMIANTE_ZONES)
    || matchList(row.zoneMateriau || "", AMIANTE_ZONES)
    || explicit
    || "—";
}

export function displayMaterial(row: AsbestosRegisterRow): string {
  const explicit = (row.materiau || "").trim();
  if (listed(explicit, AMIANTE_MATERIAUX)) return explicit;
  return matchList(`${explicit} ${row.zoneMateriau || ""}`, AMIANTE_MATERIAUX) || explicit || "—";
}

export function registerRowTitle(row: AsbestosRegisterRow): string {
  if (row.kind === "materiau" || row.kind === "synthese") {
    const zone = displayZone(row);
    const material = displayMaterial(row);
    if (zone !== "—" && material !== "—") return `${zone} — ${material}`;
    if (material !== "—") return material;
    if (zone !== "—") return zone;
  }
  return (
    row.zoneMateriau ||
    row.materiau ||
    row.typeControle ||
    row.dateControle ||
    row.id
  );
}

export function registerRowScore(row: AsbestosRegisterRow): string {
  return asText(row.scoreActuel || row.score || row.rawCol6).trim();
}

export function matchesRegisterSearch(
  row: AsbestosRegisterRow,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return JSON.stringify(row).toLowerCase().includes(q);
}

export function matchesSiteSearch(row: AsbestosSiteDtaRow, query: string): boolean {
  const q = asText(query).trim().toLowerCase();
  if (!q) return true;
  return [row.site, row.departement, row.commentaires, row.acces, row.dtaStatut, row.personneEnCharge, row.presenceAmiante]
    .map((value) => asText(value).toLowerCase())
    .some((value) => value.includes(q));
}

export function asText(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function presenceTone(value: string | undefined): { label: string; className: string } {
  const raw = (value ?? "").trim();
  const s = raw.toLowerCase();
  if (s.startsWith("oui")) {
    return { label: raw, className: "bg-rose-50 text-rose-900 ring-1 ring-rose-200" };
  }
  if (s.includes("désamiant") || s.includes("desamiant")) {
    return { label: raw, className: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" };
  }
  if (s.startsWith("non mais")) {
    return { label: raw, className: "bg-sky-50 text-sky-900 ring-1 ring-sky-200" };
  }
  if (s.startsWith("non")) {
    return { label: raw, className: "bg-stone-100 text-stone-700 ring-1 ring-stone-200" };
  }
  if (s.includes("diagnost") || s.includes("vérif") || s.includes("verif")) {
    return { label: raw, className: "bg-amber-50 text-amber-950 ring-1 ring-amber-200" };
  }
  if (!raw) {
    return { label: "Non renseigné", className: "bg-stone-50 text-stone-500 ring-1 ring-stone-200" };
  }
  return { label: raw, className: "bg-stone-50 text-stone-800 ring-1 ring-stone-200" };
}

export function dtaStatutBadgeClass(statut: unknown): string {
  const s = asText(statut).trim().toLowerCase();
  if (s === "oui" || s.startsWith("oui")) {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (s === "non" || s.startsWith("non")) {
    return "bg-amber-100 text-amber-900 border-amber-300";
  }
  return "bg-slate-100 text-slate-800 border-slate-300";
}
