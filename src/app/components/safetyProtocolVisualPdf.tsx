import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

export interface SafetyProtocolPdfInput {
  id: string;
  title: string;
  operationType: string;
  service: string;
  domain: string;
  location: string;
  entreprise1: string;
  entreprise2: string;
  responsable: string;
  date: string;
  status: "brouillon" | "valide" | "signe";
  risques: string;
  mesures: string;
  urgence: string;
  signatures: string;
  circulation: string;
  documents: string[];
  attachments?: Array<{ fileName: string }>;
  signatureDematerialiseeUrl?: string;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42;
const HEADER = 78;
const FOOTER = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;
const NAVY = rgb(0, 0, 0.569);
const RED = rgb(0.882, 0.063, 0.184);
const WHITE = rgb(1, 1, 1);
const INK = rgb(0.15, 0.16, 0.2);
const MUTED = rgb(0.38, 0.4, 0.46);
const RULE = rgb(0.82, 0.82, 0.86);
const PALE = rgb(0.95, 0.94, 0.98);
const EDGE = rgb(0.48, 0.44, 0.62);

const STATUS = { brouillon: "Brouillon", valide: "Valide", signe: "Signé" } as const;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

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

async function embedSignature(pdf: PDFDocument, dataUrl: string | undefined): Promise<PDFImage | null> {
  const match = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUrl?.trim() || "");
  if (!match) return null;
  try {
    const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
    return match[1].toLowerCase() === "png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function downloadSafetyProtocolVisualPdf(protocol: SafetyProtocolPdfInput): Promise<void> {
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
    if (y - (height + 36) < bottom) newPage();
    else y -= 10;
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, color: PALE });
    page.drawRectangle({ x: MARGIN, y: y - height, width: 2, height, color: EDGE });
    page.drawText(pdfSafe(title), { x: MARGIN + 10, y: y - 13, size: 9, font: bold, color: INK });
    y -= height;
  };

  const field = (label: string, value: string) => {
    const labelW = 150;
    const lines = wrap(shown(value), regular, 9, CONTENT_W - labelW - 12);
    let rest = lines.length ? lines : [""];
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
      if (guard === 1) paint(wrap(label, bold, 8, labelW - 12), MARGIN + 8, y - 2, bold, 8, EDGE);
      paint(slice, MARGIN + labelW + 6, y - 1, regular, 9, shown(value) === "Non renseigné" ? MUTED : INK);
      y -= height;
    }
  };

  drawHeader(page);
  const titleLines = wrap(shown(protocol.title), bold, 13, CONTENT_W - 24);
  const blockH = 58 + titleLines.length * 16;
  page.drawRectangle({ x: MARGIN, y: y - blockH, width: CONTENT_W, height: blockH, borderColor: EDGE, borderWidth: 0.7, color: WHITE });
  let pen = y - 20;
  page.drawText("PROTOCOLE DE SÉCURITÉ", { x: MARGIN + 12, y: pen, size: 14, font: bold, color: EDGE });
  pen -= 14;
  page.drawText("Code du travail, articles R4515-4 à R4515-11", { x: MARGIN + 12, y: pen, size: 8, font: regular, color: MUTED });
  pen -= 16;
  titleLines.forEach((line) => {
    page.drawText(line, { x: MARGIN + 12, y: pen, size: 12, font: bold, color: INK });
    pen -= 15;
  });
  page.drawText(pdfSafe(protocol.operationType || "Opération non renseignée"), { x: MARGIN + 12, y: pen, size: 9, font: regular, color: MUTED });
  y -= blockH + 8;

  field("Statut", STATUS[protocol.status]);
  field("Date", formatDate(protocol.date));
  field("Responsable", protocol.responsable);
  field("Service", protocol.service);
  field("Domaine", protocol.domain);
  field("Lieu", protocol.location);

  section("Entreprises");
  field("Entreprise APB", protocol.entreprise1);
  field("Société intervenante", protocol.entreprise2);

  section("Évaluation des risques et mesures");
  field("Nature des risques", protocol.risques);
  field("Mesures de prévention", protocol.mesures);

  section("Premiers secours");
  field("Mesures d'urgence", protocol.urgence);

  section("Signatures");
  field("Signataires", protocol.signatures);
  const image = await embedSignature(pdf, protocol.signatureDematerialiseeUrl);
  if (image) {
    const maxW = 160;
    const maxH = 56;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    if (y - (height + 16) < bottom) newPage();
    page.drawImage(image, { x: MARGIN, y: y - height - 6, width, height });
    y -= height + 14;
  }

  section("Plan de circulation et de déchargement");
  field("Circulation", protocol.circulation);

  const documents = [...(protocol.documents ?? []), ...(protocol.attachments ?? []).map((item) => item.fileName)].filter(Boolean);
  section("Documents associés");
  field("Pièces", documents.length ? documents.map((name, index) => `${index + 1}. ${name}`).join("\n") : "");

  const generated = formatDate(new Date().toISOString().slice(0, 10));
  pages.forEach((target, index) => {
    target.drawLine({ start: { x: MARGIN, y: 28 }, end: { x: PAGE_W - MARGIN, y: 28 }, thickness: 0.4, color: RULE });
    target.drawText(`DIRM Méditerranée  ·  Généré le ${generated}`, { x: MARGIN, y: 16, size: 8, font: regular, color: MUTED });
    const label = `Page ${index + 1} / ${pages.length}`;
    target.drawText(label, { x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 8), y: 16, size: 8, font: regular, color: MUTED });
  });

  pdf.setTitle(`Protocole de sécurité ${pdfSafe(protocol.title)}`);
  pdf.setAuthor("DIRM Méditerranée");
  pdf.setSubject("Protocole de sécurité, articles R4515-4 à R4515-11 du code du travail");
  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `protocole-securite-${pdfSafe(protocol.id) || "document"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
