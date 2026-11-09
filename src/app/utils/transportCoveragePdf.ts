import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface TransportJustificatif {
  id: string;
  name: string;
  dataUrl: string;
}

export interface TransportCoverageRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  agentEmail: string;
  ministereDirectionAffectation: string;
  nom: string;
  prenom: string;
  numeroSecuriteSociale: string;
  matricule: string;
  corps: string;
  grade: string;
  dateArriveeStructure: string;
  domicileNumeroRue: string;
  domicileCommune: string;
  domicileCodePostal: string;
  domicileArret: string;
  travailNumeroRue: string;
  travailCommune: string;
  travailCodePostal: string;
  travailArret: string;
  abonnementHebdomadaire: boolean;
  abonnementMensuel: boolean;
  abonnementAnnuel: boolean;
  abonnementVelo: boolean;
  periodeMoisDebut: string;
  periodeAnneeDebut: string;
  periodeMoisFin: string;
  periodeAnneeFin: string;
  semaineDu: string;
  semaineAu: string;
  allocationSpeciale: boolean;
  modeTransport: "" | "vehicule" | "taxi" | "autres";
  modeTransportAutres: string;
  faitLe: string;
  faitA: string;
  signatureAgent: string;
  /** Image du pad de signature (data URL PNG). */
  signatureImage?: string;
  montantIleDeFrance: string;
  montantHorsIleDeFrance: string;
  montantLocationVelo: string;
  zonesIleDeFrance: string;
  zonesHorsIleDeFrance: string;
  montantTotalMensuel: string;
  certificateurNom: string;
  certificateurDate: string;
  certificateurFonction: string;
  justificatifs: TransportJustificatif[];
  /** brouillon, envoyée au DRH, ou traitée. */
  statut?: "brouillon" | "en_attente_rh" | "traitee";
  /** Nom du fichier glissé en haut. Le contenu n'est pas conservé. */
  feuilleJointeNom?: string;
}

/** Repère du formulaire source (XObject 1240×1753, y vers le bas). */
const SX = 0.480081;
const SY = 0.480077;
const PAGE_H = 842;
const PAGE_DY = 0.15;

type Box = [x: number, y: number, w: number, h: number];

export const BOX = {
  affectation: [357.1, 233.2, 809.6, 26.9],
  nom: [115.2, 263.9, 531.7, 26.9],
  prenom: [742.9, 263.9, 426, 26.9],
  matricule: [865.8, 294.5, 299.6, 28.3],
  corps: [122.5, 326.6, 449.9, 26.9],
  grade: [648.5, 326.6, 518.5, 26.9],
  dateArrivee: [345.6, 357.2, 823.3, 26.9],
  domicileRue: [371.1, 387.8, 800.8, 26.9],
  domicileCommune: [382.9, 418.4, 479.1, 26.9],
  domicileCp: [981.6, 418.4, 191.4, 26.9],
  domicileArret: [452.3, 449.1, 723.8, 26.9],
  travailRue: [371.1, 479.7, 800.8, 26.9],
  travailCommune: [382.9, 510.3, 479.1, 26.9],
  travailCp: [981.6, 510.3, 191.4, 26.9],
  travailArret: [495, 541.6, 679.5, 26.9],
  moisDebut: [159.3, 779.7, 257.1, 26.9],
  anneeDebut: [458.3, 779.7, 91.6, 26.9],
  moisFin: [711.5, 779.7, 257.1, 26.9],
  anneeFin: [1020.9, 779.7, 91.6, 26.9],
  semaineDu: [163, 806.7, 384.2, 26.9],
  semaineAu: [609.6, 806.7, 444.3, 26.9],
  autres: [645.6, 1136.5, 473.2, 21.4],
  faitLe: [110.2, 1287.3, 407.2, 26.9],
  faitA: [87.9, 1314.2, 428.4, 26.9],
  montantIdf: [267.8, 1428.4, 237.3, 35.5],
  montantHors: [267.8, 1475.7, 237.3, 35.4],
  montantVelo: [267.8, 1522.8, 237.3, 35.4],
} satisfies Record<string, Box>;

export const CHECK = {
  hebdo: [61.1, 646.7, 20.9, 20.9],
  mensuel: [61.1, 672.1, 20.9, 20.9],
  annuel: [61.1, 697.5, 20.9, 20.9],
  velo: [61.1, 722.9, 20.9, 20.9],
  allocation: [59.1, 1089, 12.1, 14.5],
  vehicule: [275.1, 1139.9, 12.1, 14.5],
  taxi: [474.4, 1139.9, 12.1, 14.5],
  autres: [551.9, 1139.9, 12.1, 14.5],
} satisfies Record<string, Box>;

/** Début de chaque underscore du NIR, dans le repère du formulaire. */
export const NIR_SLOTS = [
  308.7, 335.4, 351, 377.6, 393.2, 419.9, 435.5, 462.1, 477.7, 493.4, 520,
  535.6, 551.2, 577.9, 593.5,
];
export const NIR_BASELINE = 314.46;
const NIR_SLOT_WIDTH = 10.416;

export function pagePoint(fx: number, fy: number) {
  return { x: fx * SX, y: PAGE_H - (fy * SY + PAGE_DY) };
}

export function formPoint(pdfX: number, pdfY: number) {
  return { x: pdfX / SX, y: (PAGE_H - PAGE_DY - pdfY) / SY };
}

/** WinAnsi (police Times) : les caractères hors jeu sont remplacés, le PDF n'est plus interrompu. */
export function pdfSafe(text: string) {
  return text
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u0153/g, "oe")
    .replace(/\u0152/g, "OE")
    .replace(/[^\u0000-\u00FF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fitText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const value = pdfSafe(text);
  if (!value) return { value: "", size };
  let nextSize = size;
  while (nextSize > 6 && font.widthOfTextAtSize(value, nextSize) > maxWidth) {
    nextSize -= 0.5;
  }
  let fitted = value;
  while (fitted.length > 1 && font.widthOfTextAtSize(fitted, nextSize) > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  return { value: fitted, size: nextSize };
}

function drawInBox(
  page: PDFPage,
  font: PDFFont,
  text: string,
  box: Box,
  size = 9,
) {
  const fitted = fitText(font, text, size, box[2] * SX - 6);
  if (!fitted.value) return;
  const baseline = pagePoint(box[0] + 3, box[1] + box[3] - (box[3] > 32 ? 12 : 8));
  page.drawText(fitted.value, { x: baseline.x, y: baseline.y, size: fitted.size, font, color: rgb(0.05, 0.1, 0.28) });
}

function drawAt(
  page: PDFPage,
  font: PDFFont,
  text: string,
  fx: number,
  fy: number,
  size = 9,
  maxWidth = 220,
  clearBehind = false,
) {
  const fitted = fitText(font, text, size, maxWidth);
  if (!fitted.value) return;
  const point = pagePoint(fx, fy);
  if (clearBehind) {
    const width = font.widthOfTextAtSize(fitted.value, fitted.size);
    page.drawRectangle({
      x: point.x - 1,
      y: point.y - 1.5,
      width: width + 3,
      height: fitted.size + 3,
      color: rgb(0.851, 0.851, 0.851),
    });
  }
  page.drawText(fitted.value, { x: point.x, y: point.y, size: fitted.size, font, color: rgb(0.05, 0.1, 0.28) });
}

function drawCheck(page: PDFPage, font: PDFFont, box: Box) {
  const size = Math.min(box[2], box[3]) * SY * 0.72;
  const mark = "X";
  const width = font.widthOfTextAtSize(mark, size);
  const center = pagePoint(box[0] + box[2] / 2, box[1] + box[3] / 2);
  page.drawText(mark, {
    x: center.x - width / 2,
    y: center.y - size * 0.35,
    size,
    font,
  });
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function formatFrenchDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export async function fillTransportCoveragePdf(
  templateBytes: ArrayBuffer,
  request: TransportCoverageRequest,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(templateBytes);
  const page = doc.getPages()[0];
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);

  drawInBox(page, font, request.ministereDirectionAffectation, BOX.affectation);
  drawInBox(page, font, request.nom, BOX.nom);
  drawInBox(page, font, request.prenom, BOX.prenom);
  drawInBox(page, font, request.matricule, BOX.matricule);
  drawInBox(page, font, request.corps, BOX.corps);
  drawInBox(page, font, request.grade, BOX.grade);
  drawInBox(page, font, formatFrenchDate(request.dateArriveeStructure), BOX.dateArrivee);
  drawInBox(page, font, request.domicileNumeroRue, BOX.domicileRue);
  drawInBox(page, font, request.domicileCommune, BOX.domicileCommune);
  drawInBox(page, font, request.domicileCodePostal, BOX.domicileCp);
  drawInBox(page, font, request.domicileArret, BOX.domicileArret);
  drawInBox(page, font, request.travailNumeroRue, BOX.travailRue);
  drawInBox(page, font, request.travailCommune, BOX.travailCommune);
  drawInBox(page, font, request.travailCodePostal, BOX.travailCp);
  drawInBox(page, font, request.travailArret, BOX.travailArret);

  const nir = request.numeroSecuriteSociale.replace(/\D/g, "").slice(0, 15);
  nir.split("").forEach((digit, index) => {
    const slot = NIR_SLOTS[index];
    if (slot == null) return;
    const width = font.widthOfTextAtSize(digit, 9);
    const origin = pagePoint(slot, NIR_BASELINE);
    page.drawText(digit, {
      x: origin.x + (NIR_SLOT_WIDTH * SX - width) / 2,
      y: origin.y,
      size: 9,
      font,
    });
  });

  if (request.abonnementHebdomadaire) drawCheck(page, bold, CHECK.hebdo);
  if (request.abonnementMensuel) drawCheck(page, bold, CHECK.mensuel);
  if (request.abonnementAnnuel) drawCheck(page, bold, CHECK.annuel);
  if (request.abonnementVelo) drawCheck(page, bold, CHECK.velo);

  drawInBox(page, font, request.periodeMoisDebut, BOX.moisDebut);
  drawInBox(page, font, request.periodeAnneeDebut, BOX.anneeDebut);
  drawInBox(page, font, request.periodeMoisFin, BOX.moisFin);
  drawInBox(page, font, request.periodeAnneeFin, BOX.anneeFin);
  drawInBox(page, font, formatFrenchDate(request.semaineDu), BOX.semaineDu);
  drawInBox(page, font, formatFrenchDate(request.semaineAu), BOX.semaineAu);

  if (request.allocationSpeciale) drawCheck(page, bold, CHECK.allocation);
  if (request.modeTransport === "vehicule") drawCheck(page, bold, CHECK.vehicule);
  if (request.modeTransport === "taxi") drawCheck(page, bold, CHECK.taxi);
  if (request.modeTransport === "autres") {
    drawCheck(page, bold, CHECK.autres);
    drawInBox(page, font, request.modeTransportAutres, BOX.autres, 8);
  }

  drawInBox(page, font, formatFrenchDate(request.faitLe), BOX.faitLe);
  drawInBox(page, font, request.faitA, BOX.faitA);
  if (request.signatureImage?.startsWith("data:image/")) {
    const bytes = dataUrlToBytes(request.signatureImage);
    const image = request.signatureImage.startsWith("data:image/png")
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
    const anchor = pagePoint(830, 1318);
    page.drawImage(image, { x: anchor.x, y: anchor.y, width: 100, height: 32 });
  } else {
    drawAt(page, font, request.signatureAgent, 860, 1307.5, 9, 160);
  }

  drawInBox(page, font, request.montantIleDeFrance, BOX.montantIdf);
  drawInBox(page, font, request.montantHorsIleDeFrance, BOX.montantHors);
  drawInBox(page, font, request.montantLocationVelo, BOX.montantVelo);
  drawAt(page, font, request.zonesIleDeFrance, 1000, 1452.9, 8, 90, true);
  drawAt(page, font, request.zonesHorsIleDeFrance, 1100, 1500.1, 8, 55, true);
  drawAt(page, font, request.montantTotalMensuel, 470, 1601.4, 9, 140);
  drawAt(page, font, request.certificateurNom, 120, 1688.9, 9, 180);
  drawAt(page, font, formatFrenchDate(request.certificateurDate), 750, 1688.9, 9, 140);
  drawAt(page, font, request.certificateurFonction, 170, 1711.8, 9, 360);

  return doc.save();
}

export const TRANSPORT_FORM_TEMPLATE_URL =
  "/formulaires/formulaire-transport-interministeriel.pdf";
