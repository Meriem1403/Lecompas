import * as XLSX from "xlsx";
import type { Action } from "@/app/types/action";

const STATUS_MAP: Record<string, Action["status"]> = {
  "en cours": "En cours",
  "a débuter": "À faire",
  "a debuter": "À faire",
  finalisé: "Terminée",
  finalise: "Terminée",
  "a reporter": "À faire",
  "stand by": "En cours",
  "a supprimer": "À faire",
};

function excelSerialToIso(serial: string | number): string {
  try {
    const n = Number(serial);
    if (!Number.isFinite(n)) return "2026-12-31";
    const base = new Date(Date.UTC(1899, 11, 30));
    base.setUTCDate(base.getUTCDate() + n);
    return base.toISOString().slice(0, 10);
  } catch {
    return "2026-12-31";
  }
}

function parseServices(units: string): string[] {
  const trimmed = (units || "").trim();
  if (!trimmed || trimmed.toLowerCase() === "tous les services") return [];
  return trimmed
    .split(/[-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parsePapripactWorkbook(
  buffer: ArrayBuffer,
  defaultYear = 2026,
): Action[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) =>
      name.toLowerCase().includes("papripact"),
    ) ?? workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], {
    defval: "",
  });

  return rows
    .map((row, index) => {
      const category =
        row["Catégorie d'action / Risques"] ||
        row["Categorie d'action / Risques"] ||
        row["__EMPTY"] ||
        "";
      const units = row["Unités concernées"] || row["Unites concernees"] || "";
      const description =
        row["Actions de prévention à mettre en place (Organisationnelle, collective, individuelle)"] ||
        row["Actions de prevention a mettre en place (Organisationnelle, collective, individuelle)"] ||
        "";
      const responsable = (row["Responsable(s) de l'action "] || row["Responsable(s) de l'action"] || "CP")
        .replace(/\n/g, ", ")
        .trim();
      const statusRaw = (row["Statut"] || "").trim().toLowerCase();
      const deadline = excelSerialToIso(row["Échéance"] || row["Echeance"] || "");

      if (!description.trim()) return null;

      const title = description.split("\n")[0].trim().slice(0, 140);

      return {
        id: `papripact-import-${defaultYear}-${Date.now()}-${index}`,
        title,
        description: description.trim(),
        riskId: "",
        riskTitle: category.trim() || "PAPRIPACT",
        priority: "Moyenne" as const,
        status: STATUS_MAP[statusRaw] ?? "À faire",
        responsable,
        deadline,
        createdAt: new Date().toISOString().slice(0, 10),
        source: "MANUEL" as const,
        services: parseServices(units),
        site: "",
        papripactYear: defaultYear,
      };
    })
    .filter((action): action is Action => Boolean(action));
}

export function mergePapripactActions(
  existing: Action[],
  imported: Action[],
): Action[] {
  const keys = new Set(
    existing.map((action) => `${action.papripactYear}::${action.title.toLowerCase()}`),
  );
  const novel = imported.filter((action) => {
    const key = `${action.papripactYear}::${action.title.toLowerCase()}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
  return [...existing, ...novel];
}
