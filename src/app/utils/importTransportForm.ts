import {
  BOX,
  CHECK,
  NIR_BASELINE,
  NIR_SLOTS,
  formPoint,
  type TransportCoverageRequest,
} from "./transportCoveragePdf";

type Box = [number, number, number, number];

interface TextPiece {
  text: string;
  x: number;
  y: number;
}

const EXTRA_BOXES = {
  signatureAgent: [840, 1294, 220, 24],
  zonesIleDeFrance: [980, 1440, 90, 22],
  zonesHorsIleDeFrance: [1085, 1488, 90, 22],
  montantTotalMensuel: [450, 1588, 140, 24],
  certificateurNom: [100, 1676, 220, 22],
  certificateurDate: [730, 1676, 180, 22],
  certificateurFonction: [155, 1700, 320, 22],
} satisfies Record<string, Box>;

const FIELD_BY_BOX: Record<string, keyof TransportCoverageRequest> = {
  affectation: "ministereDirectionAffectation",
  nom: "nom",
  prenom: "prenom",
  matricule: "matricule",
  corps: "corps",
  grade: "grade",
  dateArrivee: "dateArriveeStructure",
  domicileRue: "domicileNumeroRue",
  domicileCommune: "domicileCommune",
  domicileCp: "domicileCodePostal",
  domicileArret: "domicileArret",
  travailRue: "travailNumeroRue",
  travailCommune: "travailCommune",
  travailCp: "travailCodePostal",
  travailArret: "travailArret",
  moisDebut: "periodeMoisDebut",
  anneeDebut: "periodeAnneeDebut",
  moisFin: "periodeMoisFin",
  anneeFin: "periodeAnneeFin",
  semaineDu: "semaineDu",
  semaineAu: "semaineAu",
  autres: "modeTransportAutres",
  faitLe: "faitLe",
  faitA: "faitA",
  montantIdf: "montantIleDeFrance",
  montantHors: "montantHorsIleDeFrance",
  montantVelo: "montantLocationVelo",
  ...Object.fromEntries(Object.keys(EXTRA_BOXES).map((key) => [key, key])),
};

const ALL_BOXES: Record<string, Box> = { ...BOX, ...EXTRA_BOXES };

function inside(box: Box, x: number, y: number, pad = 2) {
  return x >= box[0] - pad && x <= box[0] + box[2] + pad && y >= box[1] - pad && y <= box[1] + box[3] + pad;
}

const NOISE = /^(code pos|\(mois\)|\(année\)|\(jour\/mois\/année\)|au mois de|le|à|a)$/i;

function cleanPiece(text: string) {
  const clean = text.replace(/[^\p{L}\p{N}\s'.,/-]/gu, "").replace(/\s+/g, " ").trim();
  if (!clean || NOISE.test(clean)) return "";
  return clean;
}

function joinPieces(pieces: TextPiece[]) {
  const ordered = [...pieces].sort((a, b) => a.x - b.x);
  return ordered
    .map((piece) => cleanPiece(piece.text))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(value: string) {
  const match = /^(\d{2})[/.](\d{2})[/.](\d{4})$/.exec(value.trim());
  if (!match) return value.trim();
  return `${match[3]}-${match[2]}-${match[1]}`;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function titlePlace(value: string) {
  const city = value.replace(/\s+saint-charles.*/i, "").trim();
  return city
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (all) => all.toUpperCase());
}

/** Abonnement (ZOU, TER, etc.) : on lit les libellés, pas les cases du formulaire officiel. */
export function parseSubscriptionLines(lines: string[]): Partial<TransportCoverageRequest> | null {
  const blob = lines.join("\n");
  if (/prise en charge partielle|renseignements concernant l.?agent/i.test(blob)) return null;
  if (!/abonnement|mensuel|hebdomadaire|annuel|utilisable du|zou!/i.test(blob)) return null;

  const result: Partial<TransportCoverageRequest> = {};
  const placeAfter = (label: RegExp) => {
    const index = lines.findIndex((line) => label.test(line));
    if (index < 0) return "";
    const inline = lines[index].replace(label, "").trim();
    return inline || (lines[index + 1] || "").trim();
  };
  const departure = placeAfter(/^DE\s*:/i);
  const arrival = placeAfter(/^(À|A)\s*:/i);
  if (departure) {
    result.domicileArret = departure;
    result.domicileCommune = titlePlace(departure);
  }
  if (arrival) {
    result.travailArret = arrival;
    result.travailCommune = titlePlace(arrival);
  }
  if (/mensuel/i.test(blob)) result.abonnementMensuel = true;
  if (/hebdo/i.test(blob)) result.abonnementHebdomadaire = true;
  if (/annuel/i.test(blob)) result.abonnementAnnuel = true;
  if (/v[eé]lo/i.test(blob)) result.abonnementVelo = true;

  const range = blob.match(/du\s+(\d{2})\/(\d{2})\/(\d{4})\s+au\s+(\d{2})\/(\d{2})\/(\d{4})/i);
  if (range) {
    result.periodeMoisDebut = MOIS[Number(range[2]) - 1] || "";
    result.periodeAnneeDebut = range[3];
    result.periodeMoisFin = MOIS[Number(range[5]) - 1] || "";
    result.periodeAnneeFin = range[6];
  }
  const price = blob.match(/(\d{1,4}[.,]\d{2})\s*€/);
  if (price) {
    const amount = price[1].replace(".", ",");
    result.montantHorsIleDeFrance = amount;
    result.montantTotalMensuel = amount;
  }

  const birthIndex = lines.findIndex((line) => /^\d{2}\/\d{2}\/\d{4}$/.test(line));
  const nameLines = (birthIndex > 0 ? lines.slice(0, birthIndex) : lines).filter(
    (line) =>
      /^[\p{Lu}][\p{Lu}' -]{1,40}$/u.test(line) &&
      !/ABONNEMENT|MENSUEL|HEBDO|ANNUEL|CLASSE/i.test(line) &&
      !/^ZOU!?$/i.test(line),
  );
  if (nameLines[0]) result.nom = nameLines[0];
  if (nameLines[1]) result.prenom = titlePlace(nameLines[1]);
  return result;
}

async function openPdf(data: ArrayBuffer) {
  // Le module worker s'enregistre sur la page. Évite un fichier .mjs à part,
  // que le serveur refuse souvent de charger (et la lecture échoue alors).
  await import("pdfjs-dist/build/pdf.worker.min.mjs");
  const pdfjs = await import("pdfjs-dist");
  return pdfjs.getDocument({ data: new Uint8Array(data.slice(0)), isEvalSupported: false }).promise;
}

export async function readTransportForm(data: ArrayBuffer): Promise<Partial<TransportCoverageRequest>> {
  const doc = await openPdf(data);
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const pieces: TextPiece[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim() || !item.transform) continue;
    const [, , , , x, y] = item.transform;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const form = formPoint(x, y);
    pieces.push({ text: item.str.trim(), x: form.x, y: form.y });
  }
  const lines = [...pieces].sort((a, b) => a.y - b.y || a.x - b.x).map((piece) => piece.text);
  const subscription = parseSubscriptionLines(lines);
  if (subscription) {
    await doc.destroy();
    return subscription;
  }
  const blob = lines.join("\n");
  if (!/prise en charge partielle|renseignements concernant l.?agent/i.test(blob)) {
    await doc.destroy();
    return {};
  }

  const result: Partial<TransportCoverageRequest> = {};
  for (const [boxName, field] of Object.entries(FIELD_BY_BOX)) {
    const box = ALL_BOXES[boxName];
    if (!box) continue;
    const hits = pieces.filter((piece) => inside(box, piece.x, piece.y));
    const text = joinPieces(hits);
    if (!text) continue;
    if (
      field === "faitLe" ||
      field === "dateArriveeStructure" ||
      field === "semaineDu" ||
      field === "semaineAu" ||
      field === "certificateurDate"
    ) {
      (result as Record<string, string>)[field] = toIsoDate(text);
    } else {
      (result as Record<string, string>)[field] = text;
    }
  }

  const nir = pieces
    .filter((piece) => /^\d$/.test(piece.text) && Math.abs(piece.y - NIR_BASELINE) < 14)
    .sort((a, b) => a.x - b.x)
    .map((piece) => piece.text)
    .join("")
    .slice(0, 15);
  if (nir.length >= 13) result.numeroSecuriteSociale = nir;

  const marked = (box: Box) =>
    pieces.some((piece) => inside(box, piece.x, piece.y, 4) && /^x$/i.test(piece.text));
  if (marked(CHECK.hebdo)) result.abonnementHebdomadaire = true;
  if (marked(CHECK.mensuel)) result.abonnementMensuel = true;
  if (marked(CHECK.annuel)) result.abonnementAnnuel = true;
  if (marked(CHECK.velo)) result.abonnementVelo = true;
  if (marked(CHECK.allocation)) result.allocationSpeciale = true;
  if (marked(CHECK.vehicule)) result.modeTransport = "vehicule";
  else if (marked(CHECK.taxi)) result.modeTransport = "taxi";
  else if (marked(CHECK.autres)) result.modeTransport = "autres";

  await doc.destroy();
  return result;
}

export function transportFormHasValues(value: Partial<TransportCoverageRequest>) {
  return Object.values(value).some((item) => item === true || (typeof item === "string" && item.trim().length > 0));
}
