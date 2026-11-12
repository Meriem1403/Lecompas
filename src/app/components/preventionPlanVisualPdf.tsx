import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

import type { PlanProtocolFields, PlanRecord, PlanStatus, RiskInput } from "@/app/types/preventionPlan";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42;
const HEADER = 78;
const FOOTER = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;

const NAVY = rgb(0, 0, 0.569);
const INK = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.35, 0.38, 0.42);
const RULE = rgb(0.78, 0.8, 0.84);
const RED = rgb(0.882, 0.063, 0.184);
const WHITE = rgb(1, 1, 1);
const PALE_STONE = rgb(0.965, 0.96, 0.95);
const PALE_SAND = rgb(0.975, 0.96, 0.93);
const PALE_SAGE = rgb(0.945, 0.96, 0.945);
const PALE_BLUSH = rgb(0.975, 0.95, 0.945);
const PALE_MIST = rgb(0.95, 0.955, 0.965);
const EDGE_STONE = rgb(0.62, 0.6, 0.56);
const EDGE_SAND = rgb(0.66, 0.58, 0.46);
const EDGE_SAGE = rgb(0.5, 0.58, 0.52);
const EDGE_BLUSH = rgb(0.66, 0.54, 0.52);
const EDGE_MIST = rgb(0.55, 0.6, 0.66);
const SAUGE = rgb(0.4, 0.5, 0.45);
const DUST = rgb(0.58, 0.44, 0.44);

type Paint = ReturnType<typeof rgb>;

const STATUS_LABEL: Record<PlanStatus, string> = {
  a_lancer: "À lancer",
  en_cours: "En cours",
  termine: "Terminé",
};

const PRIORITY_LABEL = { haute: "Haute", moyenne: "Moyenne", basse: "Basse" } as const;

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function pdfSafe(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[•▪►]/g, "- ")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/[^\u0000-\u00ff]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shown(value: string | undefined | null): string {
  const text = pdfSafe(value);
  return text || "Non renseigné";
}

function formatDate(value: string | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value?.trim() || "");
  if (!match) return shown(value);
  const day = Number(match[3]);
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return shown(value);
  return `${day} ${month} ${match[1]}`;
}

function transmissionLabel(value: string | undefined): string {
  if (value === "oui") return "Oui";
  if (value === "non") return "Non";
  return "Non renseigné";
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = pdfSafe(text).replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  const pushWord = (word: string) => {
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      lines.push(word);
      return;
    }
    let chunk = "";
    for (const char of word) {
      const next = chunk + char;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) chunk = next;
      else {
        if (chunk) lines.push(chunk);
        chunk = char;
      }
    }
    if (chunk) lines.push(chunk);
  };
  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (index < paragraphs.length - 1) lines.push("");
      return;
    }
    let current = "";
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
      else {
        if (current) lines.push(current);
        if (font.widthOfTextAtSize(word, size) <= maxWidth) current = word;
        else {
          pushWord(word);
          current = "";
        }
      }
    });
    if (current) lines.push(current);
  });
  return lines.length > 0 ? lines : [""];
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

export async function renderPreventionPlanPdf(
  plan: PlanRecord,
  protocol: PlanProtocolFields,
  risks: RiskInput[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages: PDFPage[] = [];
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H - HEADER;

  const drawHeader = (target: PDFPage) => {
    target.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W / 3, height: 4, color: NAVY });
    target.drawRectangle({ x: PAGE_W / 3, y: PAGE_H - 4, width: PAGE_W / 3, height: 4, color: WHITE });
    target.drawRectangle({ x: (PAGE_W / 3) * 2, y: PAGE_H - 4, width: PAGE_W / 3, height: 4, color: RED });
    target.drawText("RÉPUBLIQUE FRANÇAISE", { x: MARGIN, y: PAGE_H - 24, size: 9, font: bold, color: NAVY });
    target.drawText("Liberté  ·  Égalité  ·  Fraternité", { x: MARGIN, y: PAGE_H - 38, size: 8, font: regular, color: MUTED });
    const right = "Direction interrégionale de la mer";
    const right2 = "Méditerranée";
    target.drawText(right, {
      x: PAGE_W - MARGIN - bold.widthOfTextAtSize(right, 8),
      y: PAGE_H - 24,
      size: 8,
      font: bold,
      color: NAVY,
    });
    target.drawText(right2, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(right2, 8),
      y: PAGE_H - 36,
      size: 8,
      font: regular,
      color: MUTED,
    });
    target.drawLine({
      start: { x: MARGIN, y: PAGE_H - 52 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 52 },
      thickness: 0.6,
      color: NAVY,
    });
  };

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    drawHeader(page);
    y = PAGE_H - HEADER;
  };

  const BOTTOM = MARGIN + FOOTER;
  const LEADING = 12;
  const BODY = 9;

  const ensure = (needed: number) => {
    const room = PAGE_H - HEADER - BOTTOM;
    if (needed >= room) return;
    if (y - needed < BOTTOM) newPage();
  };

  const paintLines = (
    lines: string[],
    x: number,
    top: number,
    font: PDFFont,
    size: number,
    color: typeof INK,
    leading = LEADING,
  ) => {
    lines.forEach((line, index) => {
      if (!line) return;
      page.drawText(line, { x, y: top - size - index * leading, size, font, color });
    });
  };

  let accent: Paint = EDGE_STONE;
  let accentSoft: Paint = PALE_STONE;

  const section = (title: string, fill: Paint = PALE_STONE, edge: Paint = EDGE_STONE) => {
    accent = edge;
    accentSoft = fill;
    const height = 18;
    if (y - (height + 40) < BOTTOM) newPage();
    else y -= 10;
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, color: fill });
    page.drawRectangle({ x: MARGIN, y: y - height, width: 2, height, color: edge });
    page.drawText(pdfSafe(title), { x: MARGIN + 10, y: y - 13, size: 9, font: bold, color: INK });
    y -= height;
  };

  const fieldRow = (label: string, value: string) => {
    const labelW = 150;
    const text = shown(value);
    const valueLines = wrap(text, regular, BODY, CONTENT_W - labelW - 12);
    const labelLines = wrap(label, bold, 8, labelW - 12);
    let rest = valueLines.length ? valueLines : [""];
    let first = true;
    let guard = 0;
    while (rest.length && guard < 40) {
      guard += 1;
      const room = Math.floor((y - BOTTOM - 8) / LEADING);
      if (room < 1) {
        newPage();
        continue;
      }
      const count = Math.min(rest.length, room);
      const slice = rest.slice(0, count);
      rest = rest.slice(count);
      const height = Math.max(slice.length, first ? labelLines.length : 1) * LEADING + 8;
      page.drawRectangle({ x: MARGIN, y: y - height, width: labelW, height, color: accentSoft });
      page.drawRectangle({ x: MARGIN, y: y - height, width: 2, height, color: accent });
      page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, borderColor: RULE, borderWidth: 0.45 });
      page.drawLine({
        start: { x: MARGIN + labelW, y },
        end: { x: MARGIN + labelW, y: y - height },
        thickness: 0.45,
        color: RULE,
      });
      if (first) paintLines(labelLines, MARGIN + 8, y - 2, bold, 8, accent, 10);
      paintLines(slice, MARGIN + labelW + 6, y - 1, regular, BODY, text === "Non renseigné" ? MUTED : INK);
      y -= height;
      first = false;
    }
  };

  const drawTiles = (items: Array<{ label: string; value: string; bar: Paint; soft: Paint }>) => {
    const gap = 8;
    for (let index = 0; index < items.length; index += 2) {
      const pair = [items[index], items[index + 1]].filter((item): item is (typeof items)[number] => Boolean(item));
      const width = pair.length === 2 ? (CONTENT_W - gap) / 2 : CONTENT_W;
      const blocks = pair.map((item) => wrap(shown(item.value), regular, BODY, width - 16));
      if (blocks.some((lines) => lines.length > 5)) {
        pair.forEach((item) => fieldRow(item.label, item.value));
        continue;
      }
      const height = Math.max(...blocks.map((lines) => Math.max(lines.length, 1))) * LEADING + 22;
      ensure(height);
      pair.forEach((item, itemIndex) => {
        const x = MARGIN + itemIndex * (width + gap);
        const raw = shown(item.value);
        page.drawRectangle({ x, y: y - height, width, height, color: item.soft, borderColor: item.bar, borderWidth: 0.45 });
        page.drawRectangle({ x, y: y - 3.5, width, height: 3.5, color: item.bar });
        page.drawText(pdfSafe(item.label).toUpperCase(), { x: x + 8, y: y - 16, size: 7, font: bold, color: item.bar });
        paintLines(blocks[itemIndex], x + 8, y - 18, regular, BODY, raw === "Non renseigné" ? MUTED : INK);
      });
      y -= height + 6;
    }
  };

  const columnWidths = (weights: number[]) => {
    const widths: number[] = [];
    let used = 0;
    weights.forEach((weight, index) => {
      if (index === weights.length - 1) widths.push(CONTENT_W - used);
      else {
        const width = Math.round(CONTENT_W * weight);
        widths.push(width);
        used += width;
      }
    });
    return widths;
  };

  const statusTone = (value: string) => {
    if (value === "Oui") return SAUGE;
    if (value === "Non") return DUST;
    return MUTED;
  };

  const drawTable = (
    headers: string[],
    rows: string[][],
    weights: number[],
    look: { header: Paint; zebra: Paint; columns?: Paint[]; statusColumn?: number },
  ) => {
    const widths = columnWidths(weights);
    const headerLines = headers.map((header, index) => wrap(header, bold, 8, Math.max(12, widths[index] - 8)));
    const paintHeader = () => {
      const count = Math.max(1, ...headerLines.map((lines) => lines.length));
      const height = count * 10 + 8;
      if (y - (height + 24) < BOTTOM) newPage();
      let x = MARGIN;
      headerLines.forEach((lines, index) => {
        page.drawRectangle({
          x,
          y: y - height,
          width: widths[index],
          height,
          color: look.columns?.[index] ?? look.header,
        });
        paintLines(lines, x + 5, y - 1, bold, 8, INK, 10);
        x += widths[index];
      });
      y -= height;
    };
    paintHeader();
    rows.forEach((row, rowIndex) => {
      const wrapped = row.map((cell, index) => {
        const lines = wrap(shown(cell), regular, 8, Math.max(12, widths[index] - 8));
        return lines.length ? lines : [""];
      });
      let pending = wrapped;
      let guard = 0;
      while (pending.some((lines) => lines.length) && guard < 50) {
        guard += 1;
        const room = Math.floor((y - BOTTOM - 8) / 11);
        if (room < 1) {
          newPage();
          paintHeader();
          continue;
        }
        const firstChunk = pending.every((lines, index) => lines.length === wrapped[index].length);
        const count = Math.min(room, Math.max(...pending.map((lines) => lines.length)));
        const slice = pending.map((lines) => lines.slice(0, count));
        pending = pending.map((lines) => lines.slice(count));
        const height = Math.max(1, ...slice.map((lines) => lines.length)) * 11 + 8;
        if (rowIndex % 2 === 0) {
          page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, color: look.zebra });
        }
        page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, borderColor: RULE, borderWidth: 0.4 });
        let x = MARGIN;
        slice.forEach((lines, index) => {
          if (index > 0) {
            page.drawLine({ start: { x, y }, end: { x, y: y - height }, thickness: 0.4, color: RULE });
          }
          const badge = look.statusColumn === index && firstChunk ? lines[0] : "";
          if (badge === "Oui" || badge === "Non" || badge === "Non renseigné") {
            const tone = statusTone(badge);
            page.drawRectangle({ x: x + 5, y: y - 12.5, width: 3.5, height: 3.5, color: tone });
            page.drawText(badge, { x: x + 12, y: y - 14, size: 8, font: regular, color: tone });
          } else {
            paintLines(lines, x + 5, y - 1, regular, 8, INK, 11);
          }
          x += widths[index];
        });
        y -= height;
      }
    });
  };

  drawHeader(page);

  const titleBlock = () => {
    const ref = wrap(
      shown(protocol.codeTravailReference || "Code du travail, articles R4515-4 à R4515-11"),
      regular,
      8,
      CONTENT_W - 24,
    );
    const risk = wrap(`${shown(plan.riskNumber)}  ·  ${shown(plan.riskTitle)}`, bold, 11, CONTENT_W - 24);
    const height = 86 + ref.length * 11 + risk.length * 14;
    ensure(height);
    page.drawRectangle({ x: MARGIN, y: y - height, width: CONTENT_W, height, color: WHITE, borderColor: EDGE_STONE, borderWidth: 0.6 });
    let pen = y - 22;
    page.drawText("PLAN DE PRÉVENTION", { x: MARGIN + 12, y: pen, size: 15, font: bold, color: INK });
    pen -= 16;
    ref.forEach((line) => {
      page.drawText(line, { x: MARGIN + 12, y: pen, size: 8, font: regular, color: MUTED });
      pen -= 11;
    });
    pen -= 4;
    risk.forEach((line) => {
      page.drawText(line, { x: MARGIN + 12, y: pen, size: 11, font: bold, color: INK });
      pen -= 14;
    });
    pen -= 6;
    page.drawLine({
      start: { x: MARGIN + 12, y: pen + 4 },
      end: { x: PAGE_W - MARGIN - 12, y: pen + 4 },
      thickness: 0.4,
      color: RULE,
    });
    const metaX = MARGIN + 12;
    const metaMid = MARGIN + CONTENT_W / 2;
    page.drawText("STATUT", { x: metaX, y: pen - 8, size: 7, font: bold, color: MUTED });
    page.drawText("PRIORITÉ", { x: metaMid, y: pen - 8, size: 7, font: bold, color: MUTED });
    page.drawText(STATUS_LABEL[plan.status], { x: metaX, y: pen - 22, size: 11, font: bold, color: INK });
    page.drawText(PRIORITY_LABEL[plan.priority], { x: metaMid, y: pen - 22, size: 11, font: bold, color: INK });
    y -= height;
  };

  titleBlock();
  if (y - 8 < BOTTOM) newPage();
  else y -= 8;

  drawTiles([
    { label: "Service", value: plan.service, bar: EDGE_STONE, soft: PALE_STONE },
    { label: "Domaine", value: plan.domain, bar: EDGE_MIST, soft: PALE_MIST },
    { label: "Lieu de l'opération", value: protocol.lieuLivraison || plan.location, bar: EDGE_SAND, soft: PALE_SAND },
    { label: "Responsable", value: plan.owner, bar: EDGE_SAGE, soft: PALE_SAGE },
    { label: "Échéance", value: formatDate(plan.dueDate), bar: EDGE_SAND, soft: PALE_SAND },
    { label: "Type d'opération", value: protocol.operationType, bar: EDGE_BLUSH, soft: PALE_BLUSH },
  ]);

  section("Objet et actions de prévention", PALE_STONE, EDGE_STONE);
  fieldRow("Objectif", plan.objective);
  fieldRow(
    "Actions",
    plan.actions.length ? plan.actions.map((action, index) => `${index + 1}. ${action}`).join("\n") : "",
  );

  section("1. Co-intervenants", PALE_BLUSH, EDGE_BLUSH);
  const orgs = protocol.coIntervenantRows.filter((row) =>
    [row.qualite, row.denomination, row.adresse, row.contactNom, row.contactEmail, row.complements].some((part) => part.trim()),
  );
  if (orgs.length === 0) fieldRow("Structures", "");
  else {
    drawTable(
      ["Qualité", "Dénomination", "Contact", "Adresse"],
      orgs.map((row) => [
        row.qualite,
        row.denomination,
        [row.contactNom, row.contactEmail].filter((part) => part.trim()).join("\n"),
        [row.adresse, row.complements].filter((part) => part.trim()).join("\n"),
      ]),
      [0.18, 0.24, 0.28, 0.3],
      { header: PALE_BLUSH, zebra: rgb(0.99, 0.975, 0.972) },
    );
  }

  section("2. Nature de la prestation", PALE_MIST, EDGE_MIST);
  fieldRow("Prestation", protocol.prestationNature);

  section("3. Organisation de l'opération", PALE_MIST, EDGE_MIST);
  fieldRow("Lieu de livraison ou prise en charge", protocol.lieuLivraison);
  fieldRow("Matériels spécifiques", protocol.materielsSpecifiques);
  fieldRow("Consignes de sécurité sur le site", protocol.consignesSite);
  fieldRow("Consignes concernant l'opération", protocol.consignesOperation);

  section("4. Évaluation des risques (art. R4515-5)", PALE_SAND, EDGE_SAND);
  const riskRows = protocol.riskEvaluationRows.filter((row) =>
    [row.domaine, row.natureRisques, row.mesuresPrevention, row.evaluationRiskFreeText].some((part) => part.trim()),
  );
  if (riskRows.length === 0) fieldRow("Situations", "");
  else {
    drawTable(
      ["Situation dangereuse", "Dommages associés", "Mesures de prévention"],
      riskRows.map((row) => {
        const linked = row.linkedEvaluationRiskId ? risks.find((risk) => risk.id === row.linkedEvaluationRiskId) : undefined;
        const prefix = linked
          ? `Risque n° ${linked.numeroRisque}\n`
          : row.evaluationRiskFreeText.trim()
            ? `Hors référentiel : ${row.evaluationRiskFreeText.trim()}\n`
            : "";
        return [`${prefix}${row.domaine}`, row.natureRisques, row.mesuresPrevention];
      }),
      [0.36, 0.32, 0.32],
      { header: PALE_SAND, zebra: rgb(0.99, 0.98, 0.96), columns: [PALE_SAND, PALE_BLUSH, PALE_SAGE] },
    );
  }
  if (protocol.evaluationRisques.trim()) fieldRow("Complément", protocol.evaluationRisques);

  section("5. Premiers secours (art. R4515-6)", PALE_SAGE, EDGE_SAGE);
  fieldRow("Personnes à prévenir", protocol.personnesAPrevenir);
  fieldRow("Mesures en cas d'accident ou d'incendie", protocol.mesuresUrgence);

  section("6. Transmission du plan (art. R4515-11)", PALE_MIST, EDGE_MIST);
  fieldRow("Liste de diffusion", protocol.planTransmis);
  drawTable(
    ["Destinataire", "Transmission", "Nom", "Observation"],
    [
      ["Cellule sécurité prévention DIRM MED", transmissionLabel(protocol.transmissionCelluleSecuriteStatus), protocol.transmissionCelluleSecuriteNom, protocol.transmissionCelluleSecuriteObs],
      ["Correspondant hygiène et sécurité du site", transmissionLabel(protocol.transmissionCorrespondantSiteStatus), protocol.transmissionCorrespondantSiteNom, protocol.transmissionCorrespondantSiteObs],
      ["Correspondant hygiène et sécurité APB", transmissionLabel(protocol.transmissionCorrespondantAPBStatus), protocol.transmissionCorrespondantAPBNom, protocol.transmissionCorrespondantAPBObs],
    ],
    [0.36, 0.16, 0.22, 0.26],
    { header: PALE_MIST, zebra: rgb(0.98, 0.983, 0.99), statusColumn: 1 },
  );
  if (protocol.observationsTransmission.trim()) fieldRow("Observations de transmission", protocol.observationsTransmission);

  section("7. Observations et remarques", PALE_STONE, EDGE_STONE);
  fieldRow("Remarques", protocol.observationsRemarques);

  const signers = [
    { entite: protocol.signatureEntite1, nom: protocol.signatureNom1, prenom: protocol.signaturePrenom1, date: protocol.signatureDate1, image: await embedSignature(pdf, protocol.signatureDematerialiseeUrl1) },
    { entite: protocol.signatureEntite2, nom: protocol.signatureNom2, prenom: protocol.signaturePrenom2, date: protocol.signatureDate2, image: await embedSignature(pdf, protocol.signatureDematerialiseeUrl2) },
    { entite: protocol.signatureEntite3, nom: protocol.signatureNom3, prenom: protocol.signaturePrenom3, date: protocol.signatureDate3, image: await embedSignature(pdf, protocol.signatureDematerialiseeUrl3) },
  ];
  const boxGap = 8;
  const boxW = (CONTENT_W - boxGap * 2) / 3;
  const bands = signers.map((signer, index) =>
    wrap(signer.entite || `Signataire ${index + 1}`, bold, 8, boxW - 12).slice(0, 2),
  );
  const bandH = Math.max(...bands.map((lines) => lines.length), 1) * 10 + 6;
  const boxH = bandH + 84;
  if (y - (28 + boxH) < BOTTOM) newPage();
  section("8. Signatures");
  const signerTones = [
    { fill: PALE_STONE, edge: EDGE_STONE },
    { fill: PALE_SAND, edge: EDGE_SAND },
    { fill: PALE_SAGE, edge: EDGE_SAGE },
  ];
  signers.forEach((signer, index) => {
    const x = MARGIN + index * (boxW + boxGap);
    const signerTone = signerTones[index] ?? signerTones[0];
    page.drawRectangle({ x, y: y - boxH, width: boxW, height: boxH, borderColor: signerTone.edge, borderWidth: 0.5 });
    page.drawRectangle({ x, y: y - bandH, width: boxW, height: bandH, color: signerTone.fill });
    paintLines(bands[index], x + 6, y - 1, bold, 8, INK, 10);
    const name = wrap(`${signer.prenom} ${signer.nom}`.trim() || "Nom non renseigné", regular, 8, boxW - 12).slice(0, 2);
    paintLines(name, x + 6, y - bandH - 2, regular, 8, INK, 11);
    page.drawText(pdfSafe(signer.date ? formatDate(signer.date) : "Date non renseignée"), {
      x: x + 6,
      y: y - bandH - 30,
      size: 8,
      font: regular,
      color: MUTED,
    });
    page.drawLine({
      start: { x: x + 8, y: y - boxH + 18 },
      end: { x: x + boxW - 8, y: y - boxH + 18 },
      thickness: 0.4,
      color: RULE,
    });
    if (signer.image) {
      const maxW = boxW - 16;
      const maxH = 42;
      const scale = Math.min(maxW / signer.image.width, maxH / signer.image.height, 1);
      const width = signer.image.width * scale;
      const height = signer.image.height * scale;
      page.drawImage(signer.image, { x: x + 8, y: y - boxH + 22, width, height });
    } else {
      page.drawText("Signature", { x: x + 6, y: y - boxH + 6, size: 7, font: regular, color: MUTED });
    }
  });
  y -= boxH;

  section("10. Plan de circulation et de déchargement", PALE_SAGE, EDGE_SAGE);
  fieldRow("Plan de circulation", protocol.planCirculation);
  fieldRow("Matériel à remplacer", protocol.materielRemplacer);

  section("Annexes", PALE_BLUSH, EDGE_BLUSH);
  if (protocol.annexAttachments.length === 0 && !protocol.annexesDocuments.trim()) fieldRow("Pièces jointes", "");
  else {
    if (protocol.annexAttachments.length > 0) {
      fieldRow(
        "Pièces jointes",
        protocol.annexAttachments.map((attachment, index) => `${index + 1}. ${attachment.fileName}`).join("\n"),
      );
    }
    if (protocol.annexesDocuments.trim()) fieldRow("Complément", protocol.annexesDocuments);
  }

  const generated = formatDate(new Date().toISOString().slice(0, 10));
  pages.forEach((target, index) => {
    target.drawLine({
      start: { x: MARGIN, y: 28 },
      end: { x: PAGE_W - MARGIN, y: 28 },
      thickness: 0.4,
      color: RULE,
    });
    target.drawText(`DIRM Méditerranée  ·  Généré le ${generated}`, { x: MARGIN, y: 16, size: 8, font: regular, color: MUTED });
    const pageLabel = `Page ${index + 1} / ${pages.length}`;
    target.drawText(pageLabel, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(pageLabel, 8),
      y: 16,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  pdf.setTitle(`Plan de prévention ${pdfSafe(plan.riskNumber)} ${pdfSafe(plan.riskTitle)}`);
  pdf.setAuthor("DIRM Méditerranée");
  pdf.setSubject("Plan de prévention, articles R4515-4 à R4515-11 du code du travail");
  return pdf.save();
}

export async function downloadPreventionPlanVisualPdf(
  plan: PlanRecord,
  protocol: PlanProtocolFields,
  risks: RiskInput[],
): Promise<void> {
  const bytes = await renderPreventionPlanPdf(plan, protocol, risks);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plan-prevention-${pdfSafe(plan.riskNumber || plan.id) || "document"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
