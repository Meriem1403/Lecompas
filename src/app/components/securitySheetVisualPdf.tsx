import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ControleRow, SecuritySheetRecord } from "@/app/components/SecuritySheetView";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42;
const HEADER = 78;
const FOOTER = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;
const NAVY = rgb(0, 0, 0.569);
const RED = rgb(0.882, 0.063, 0.184);
const WHITE = rgb(1, 1, 1);
const INK = rgb(0.16, 0.12, 0.14);
const MUTED = rgb(0.42, 0.36, 0.38);
const RULE = rgb(0.9, 0.84, 0.86);
const PALE = rgb(0.98, 0.94, 0.95);
const EDGE = rgb(0.55, 0.25, 0.34);

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const CONTROL_SECTIONS: { key: keyof SecuritySheetRecord; label: string; withInspector: boolean }[] = [
  { key: "controleAmiante", label: "Amiante", withInspector: false },
  { key: "controlePlomb", label: "Plomb", withInspector: false },
  { key: "controleEquipementPression", label: "Équipement sous pression", withInspector: false },
  { key: "controleElectricite", label: "Conformité électrique", withInspector: true },
  { key: "controleEquipements", label: "Équipements (machines)", withInspector: false },
  { key: "controleEpi", label: "EPI", withInspector: false },
  { key: "controleLevage", label: "Levage", withInspector: false },
  { key: "controleCvc", label: "Climatisation, ventilation, chauffage", withInspector: false },
  { key: "controlePortes", label: "Portes et portails", withInspector: true },
];

function pdfSafe(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/[^\u0000-\u00ff]/g, "")
    .trim();
}

function shown(value: string | undefined | null): string {
  return pdfSafe(value) || "Non renseigné";
}

function formatDate(value: string | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value?.trim() || "");
  if (!match) return shown(value);
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}` : shown(value);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  pdfSafe(text).split("\n").forEach((paragraph, index, all) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      if (index < all.length - 1) lines.push("");
      return;
    }
    let current = "";
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
      else {
        if (current) lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
  });
  return lines.length ? lines : [""];
}

function filledRows(record: SecuritySheetRecord, key: keyof SecuritySheetRecord): ControleRow[] {
  const rows = record[key];
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row.action || row.site || row.dateRapport || row.reference || row.observation || row.datePassage || row.nomInspecteur);
}

export async function renderSecuritySheetPdf(record: SecuritySheetRecord): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages: PDFPage[] = [];
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H - HEADER;
  const bottom = MARGIN + FOOTER;

  const drawHeader = (target: PDFPage) => {
    target.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W / 3, height: 4, color: NAVY });
    target.drawRectangle({ x: PAGE_W / 3, y: PAGE_H - 4, width: PAGE_W / 3, height: 4, color: WHITE });
    target.drawRectangle({ x: (PAGE_W / 3) * 2, y: PAGE_H - 4, width: PAGE_W / 3, height: 4, color: RED });
    target.drawText("RÉPUBLIQUE FRANÇAISE", { x: MARGIN, y: PAGE_H - 24, size: 9, font: bold, color: NAVY });
    target.drawText("Liberté  ·  Égalité  ·  Fraternité", { x: MARGIN, y: PAGE_H - 38, size: 8, font: regular, color: MUTED });
    const right = "Direction interrégionale de la mer";
    const right2 = "Méditerranée";
    target.drawText(right, { x: PAGE_W - MARGIN - bold.widthOfTextAtSize(right, 8), y: PAGE_H - 24, size: 8, font: bold, color: NAVY });
    target.drawText(right2, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(right2, 8), y: PAGE_H - 36, size: 8, font: regular, color: MUTED });
    target.drawLine({ start: { x: MARGIN, y: PAGE_H - 52 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 52 }, thickness: 0.6, color: NAVY });
  };

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    drawHeader(page);
    y = PAGE_H - HEADER;
  };

  const paint = (lines: string[], x: number, top: number, font: PDFFont, size: number, color = INK) => {
    lines.forEach((line, index) => {
      if (!line) return;
      page.drawText(line, { x, y: top - size - index * 12, size, font, color });
    });
  };

  const section = (title: string) => {
    const height = 18;
    if (y - (height + 28) < bottom) newPage();
    else y -= 12;
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, color: PALE });
    page.drawRectangle({ x: MARGIN, y: y - height, width: 2, height, color: EDGE });
    page.drawText(pdfSafe(title), { x: MARGIN + 10, y: y - 13, size: 9, font: bold, color: INK });
    y -= height;
  };

  const field = (label: string, value: string) => {
    const labelW = 158;
    const lines = wrap(shown(value), regular, 9, CONTENT_W - labelW - 14);
    let rest = lines.length ? lines : [""];
    let first = true;
    let guard = 0;
    while (rest.length && guard < 40) {
      guard += 1;
      const room = Math.floor((y - bottom - 8) / 12);
      if (room < 1) {
        newPage();
        continue;
      }
      const slice = rest.slice(0, room);
      rest = rest.slice(room);
      const height = slice.length * 12 + 8;
      page.drawRectangle({ x: MARGIN, y: y - height, width: labelW, height, color: PALE });
      page.drawRectangle({ x: MARGIN, y: y - height, width: 2, height, color: EDGE });
      page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, borderColor: RULE, borderWidth: 0.4 });
      if (first) paint(wrap(label, bold, 8, labelW - 14), MARGIN + 8, y - 2, bold, 8, EDGE);
      paint(slice, MARGIN + labelW + 8, y - 1, regular, 9, shown(value) === "Non renseigné" ? MUTED : INK);
      y -= height;
      first = false;
    }
  };

  drawHeader(page);
  const titleLines = wrap(shown(record.titreFiche), bold, 13, CONTENT_W - 24);
  const blockH = 54 + titleLines.length * 16;
  page.drawRectangle({ x: MARGIN, y: y - blockH, width: CONTENT_W, height: blockH, borderColor: EDGE, borderWidth: 0.7, color: WHITE });
  let pen = y - 18;
  page.drawText("FICHE DE SÉCURITÉ", { x: MARGIN + 12, y: pen, size: 14, font: bold, color: EDGE });
  pen -= 16;
  titleLines.forEach((line) => {
    page.drawText(line, { x: MARGIN + 12, y: pen, size: 12, font: bold, color: INK });
    pen -= 15;
  });
  page.drawText(pdfSafe(record.nomSite || "Site non renseigné"), { x: MARGIN + 12, y: pen, size: 9, font: regular, color: MUTED });
  y -= blockH + 8;

  section("Identification");
  field("Unité DUERP", record.duerpTitre);
  field("Référentiel", record.referentielAnnee);
  field("Lieu contrôlé", record.lieuElementsControles);
  field("Création", formatDate(record.dateCreation));
  field("Mise à jour", formatDate(record.dateMiseAJour));
  field("Effectif", record.effectif);
  field("Adresse", record.adresse);
  field("Téléphone bureau", record.telephoneBureau);
  field("Astreinte", record.telephoneAstreinte);

  section("Activités et horaires");
  field("Activités", record.activitesPrincipales);
  field("Horaires", record.cyclesHoraires);

  section("Dispositif de prévention");
  field("Correspondant", record.correspondantPrevention);
  field("Registre SST", record.registreSst);
  field("Lien intranet", record.lienIntranet);
  field("Protocole d'accueil", record.protocoleAccueil);
  field("Registre des contrôles", record.registreControlesLieu);
  field("Habilitation électrique", record.personnelHabilitationElectrique);
  field("Évacuation incendie", record.procedureEvacuationIncendie);

  section("Contrôles réglementaires");
  CONTROL_SECTIONS.forEach((control) => {
    const rows = filledRows(record, control.key);
    if (y - 40 < bottom) newPage();
    y -= 8;
    page.drawText(pdfSafe(control.label), { x: MARGIN + 2, y: y - 11, size: 9, font: bold, color: EDGE });
    y -= 16;
    if (!rows.length) {
      field("Lignes", "");
      return;
    }
    rows.forEach((row, index) => {
      field(`Ligne ${index + 1}, action`, row.action);
      field("Site", row.site);
      field("Date du rapport", row.dateRapport);
      field("Référence", row.reference);
      field("Observation", row.observation);
      if (control.withInspector) {
        field("Date de passage", row.datePassage || "");
        field("Inspecteur", row.nomInspecteur || "");
      }
    });
  });

  section("Compléments");
  field("Autres informations", record.autresComplement);

  const generated = formatDate(new Date().toISOString().slice(0, 10));
  pages.forEach((target, index) => {
    target.drawLine({ start: { x: MARGIN, y: 28 }, end: { x: PAGE_W - MARGIN, y: 28 }, thickness: 0.4, color: RULE });
    target.drawText(`DIRM Méditerranée  ·  Généré le ${generated}`, { x: MARGIN, y: 16, size: 8, font: regular, color: MUTED });
    const label = `Page ${index + 1} / ${pages.length}`;
    target.drawText(label, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 8), y: 16, size: 8, font: regular, color: MUTED });
  });

  pdf.setTitle(`Fiche de sécurité ${pdfSafe(record.titreFiche)}`);
  pdf.setAuthor("DIRM Méditerranée");
  pdf.setSubject("Fiche de sécurité du site");
  return pdf.save();
}

export async function downloadSecuritySheetVisualPdf(record: SecuritySheetRecord): Promise<void> {
  const bytes = await renderSecuritySheetPdf(record);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = pdfSafe(record.nomSite || record.id).replace(/\s+/g, "-") || "document";
  link.download = `fiche-securite-${safeName}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
