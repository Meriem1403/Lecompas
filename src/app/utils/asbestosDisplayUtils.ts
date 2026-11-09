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

export function registerRowTitle(row: AsbestosRegisterRow): string {
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
  return [row.site, row.departement, row.commentaires, row.acces, row.dtaStatut]
    .map((value) => asText(value).toLowerCase())
    .some((value) => value.includes(q));
}

export function asText(value: unknown): string {
  if (value == null) return "";
  return String(value);
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
