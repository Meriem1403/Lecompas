import { jsPDF } from "jspdf";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export type PaymentKind = "avance" | "acompte" | "solde";
export type PaymentStatus = "prévu" | "versé";

export interface SubsidyAttachment {
  name: string;
  dataUrl: string;
}

export interface SubsidyPayment {
  id: string;
  kind: PaymentKind;
  month: string;
  serviceFait: string;
  amount: number;
  place: string;
  status: PaymentStatus;
  settledAt?: string;
}

export interface SubsidyActor {
  id: string;
  name: string;
  email: string;
}

export interface SubsidyPieceFile {
  id: string;
  name: string;
  dataUrl: string;
}

export type PieceReview = "" | "accepte" | "refuse";

export interface SubsidyPieceSlot {
  id: string;
  label: string;
  files: SubsidyPieceFile[];
  note?: string;
  review?: PieceReview;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type DemandeStage = "pieces" | "ej" | "signature" | "decision";

export interface SubsidyRequest {
  id: string;
  receivedAt: string;
  label: string;
  kind: PaymentKind;
  amount: number;
  reference: string;
  note: string;
  text: string;
  pdf?: SubsidyAttachment | null;
  paymentId?: string;
  handlers?: SubsidyActor[];
  providers?: SubsidyActor[];
  pieces?: SubsidyPieceSlot[];
  extraFiles?: SubsidyPieceFile[];
  stage?: DemandeStage;
  signedAt?: string;
  signedBy?: string;
  signatureImage?: string;
  signedPdf?: SubsidyAttachment | null;
  paymentDecision?: "" | "oui" | "non";
}

export interface SubsidyFile {
  id: string;
  reference: string;
  ej: string;
  programme: string;
  objet: string;
  beneficiaire: string;
  signataire: string;
  qualite: string;
  suiviNom: string;
  suiviEmail: string;
  conventionDate: string;
  commencementDate: string;
  attestationPlace: string;
  attestationDate: string;
  courrierDate: string;
  courrierText: string;
  total: number;
  advanceRate: number;
  requestedAmount?: number;
  amountSource?: "total" | "demande" | "";
  payeeName: string;
  payeeBank: string;
  payments: SubsidyPayment[];
  demandes?: SubsidyRequest[];
  attestation?: SubsidyAttachment | null;
  attestationStamped?: SubsidyAttachment | null;
  ejStampVersion?: number;
  courrier?: SubsidyAttachment | null;
}

export const EMPTY_PAYMENT = (kind: PaymentKind = "avance"): SubsidyPayment => ({
  id: `pay-${Date.now()}`,
  kind,
  month: new Date().toISOString().slice(0, 7),
  serviceFait: "",
  amount: 0,
  place: "Marseille",
  status: "prévu",
});

export function round2(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function ejDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function formatEj(value: string) {
  const digits = ejDigits(value);
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  return digits;
}

export function extractEjCandidates(text: string) {
  const found = new Set<string>();
  const pattern = /EJ\s*n[°o]?\s*([0-9][0-9 \u00a0\n]{6,})/gi;
  for (const match of text.matchAll(pattern)) {
    const digits = ejDigits(match[1] || "");
    if (digits.length >= 8 && digits.length <= 14) found.add(digits);
  }
  return [...found];
}

export function courrierCarriesEj(text: string, ej: string) {
  const target = ejDigits(ej);
  if (target.length < 8) return false;
  return extractEjCandidates(text).includes(target);
}

export function applyEjToCourrier(text: string, ej: string) {
  const digits = ejDigits(ej);
  if (digits.length < 8) return text;
  const stamp = `EJ n° ${formatEj(digits)}`;
  const source = text.trim();
  if (!source) return `Objet : Demande de paiement ${stamp}`;
  if (/EJ\s*n[°o]?\s*[0-9]/i.test(source)) {
    return source.replace(/EJ\s*n[°o]?\s*[0-9][0-9 \u00a0\n]*/gi, `${stamp} `);
  }
  if (/EJ\s*n[°o]?/i.test(source)) {
    return source.replace(/EJ\s*n[°o]?\s*(?:_{2,}|…+|\.{2,})?\s*/gi, `${stamp} `);
  }
  if (/^objet\s*:/im.test(source)) {
    return source.replace(/^objet\s*:/im, `Objet : ${stamp} —`);
  }
  return `${stamp}\n${source}`;
}

export interface MoneyMention {
  amount: number;
  role: "total" | "demande" | "autre";
  excerpt: string;
}

function parseFrenchAmount(raw: string) {
  const normalized = raw.replace(/[ \u00a0\u202f.]/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function extractMoneyMentions(text: string): MoneyMention[] {
  const pattern = /(\d{1,3}(?:[ \u00a0\u202f.]\d{3})+|\d+)(?:[,.]\d{2})?\s*(?:€|euros?)/gi;
  const mentions: MoneyMention[] = [];
  for (const match of text.matchAll(pattern)) {
    const amount = parseFrenchAmount(match[1] || "");
    if (amount === null || amount <= 0) continue;
    const start = Math.max(0, (match.index || 0) - 90);
    const excerpt = text.slice(start, (match.index || 0) + match[0].length).replace(/\s+/g, " ").trim();
    const around = excerpt.toLowerCase();
    const role = /montant total|montant de la subvention|subvention de|subvention d['’]un montant/.test(around)
      ? "total"
      : /somme de|verser|à payer|a payer|demande de paiement/.test(around)
        ? "demande"
        : "autre";
    mentions.push({ amount, role, excerpt });
  }
  return mentions;
}

export function inferSubsidyFromText(text: string, rate: number) {
  const mentions = extractMoneyMentions(text);
  const totalHit = mentions.find((item) => item.role === "total");
  const demandeHit = mentions.find((item) => item.role === "demande");
  if (totalHit) {
    return { total: totalHit.amount, requested: demandeHit?.amount ?? null, source: "total" as const, mentions };
  }
  if (demandeHit && rate > 0 && rate < 1) {
    return { total: round2(demandeHit.amount / rate), requested: demandeHit.amount, source: "demande" as const, mentions };
  }
  return { total: null, requested: demandeHit?.amount ?? null, source: "aucun" as const, mentions };
}

export function extractReference(text: string) {
  return text.match(/\b[A-Z]{2,6}-[A-Z]?\d{2}-\d{3,6}\b/)?.[0] || "";
}

export function extractBeneficiaire(text: string) {
  if (/région\s+provence/i.test(text)) return "Région Provence-Alpes-Côte d'Azur";
  return "";
}

export function extractSignataire(text: string) {
  const match = text.match(/Madame\s+((?:[A-ZÉÈÀÂÊÎÔÙÇ][A-Za-zÀ-ÿ'’-]*\s+){0,2}[A-ZÉÈÀÂÊÎÔÙÇ]{2,}(?:\s+[A-ZÉÈÀÂÊÎÔÙÇ]{2,})?)/);
  return match?.[1]?.replace(/\s+/g, " ").trim() || "";
}

export function extractObjet(text: string) {
  const quotes = [...text.matchAll(/«\s*([^»]{12,})»/g)].map((match) => match[1].replace(/\s+/g, " ").trim());
  return quotes.sort((left, right) => right.length - left.length)[0] || "";
}

export async function stampEjOnPdf(bytes: Uint8Array, ej: string) {
  const digits = ejDigits(ej);
  if (digits.length < 8) throw new Error("Numéro EJ incomplet");
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPages()[0];
  const angle = ((page.getRotation().angle % 360) + 360) % 360;
  const { width, height } = page.getSize();
  if (angle === 0 && height > width) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const number = formatEj(digits);
    const right = width - 78;
    let size = 10;
    while (size > 7 && font.widthOfTextAtSize(number, size) > right - 448) size -= 0.5;
    page.drawText(number, {
      x: 448,
      y: 666,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    return pdf.save();
  }
  const font = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const label = `EJ n° ${formatEj(digits)}`;
  const size = 12;
  const textWidth = font.widthOfTextAtSize(label, size);
  const color = rgb(0.08, 0.16, 0.42);
  if (angle === 270) {
    const visualWidth = height;
    const left = (visualWidth - textWidth) / 2;
    page.drawText(label, {
      x: width * 0.778,
      y: visualWidth - left,
      size,
      font,
      color,
      rotate: degrees(270),
    });
  } else if (angle === 90) {
    page.drawText(label, {
      x: width * 0.22,
      y: (height - textWidth) / 2,
      size,
      font,
      color,
      rotate: degrees(90),
    });
  } else {
    page.drawText(label, {
      x: Math.max(36, (width - textWidth) / 2),
      y: height - 148,
      size,
      font,
      color,
    });
  }
  return pdf.save();
}

export function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const BELOW_20 = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];

function underHundred(value: number): string {
  if (value < 17) return BELOW_20[value];
  if (value < 20) return `dix-${BELOW_20[value - 10]}`;
  if (value < 70) {
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"][Math.floor(value / 10)];
    const unit = value % 10;
    if (unit === 0) return tens;
    if (unit === 1) return `${tens} et un`;
    return `${tens}-${BELOW_20[unit]}`;
  }
  if (value < 80) {
    const unit = value - 60;
    if (unit === 11) return "soixante et onze";
    return `soixante-${underHundred(unit)}`;
  }
  const unit = value - 80;
  if (unit === 0) return "quatre-vingts";
  return `quatre-vingt-${underHundred(unit)}`;
}

function underThousand(value: number): string {
  if (value < 100) return underHundred(value);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const hundred = hundreds === 1 ? "cent" : `${BELOW_20[hundreds]} cent`;
  if (rest === 0) return hundreds > 1 ? `${hundred}s` : hundred;
  return `${hundred} ${underHundred(rest)}`;
}

export function eurosEnLettres(amount: number) {
  const centsTotal = Math.round(Math.abs(amount) * 100);
  const euros = Math.floor(centsTotal / 100);
  const cents = centsTotal % 100;
  const words = euros === 0 ? "zéro" : spellEuros(euros);
  const euroLabel = euros > 1 ? "euros" : "euro";
  if (cents === 0) return capitalize(`${words} ${euroLabel}`);
  const centLabel = cents > 1 ? "centimes" : "centime";
  return capitalize(`${words} ${euroLabel} et ${underHundred(cents)} ${centLabel}`);
}

function spellEuros(value: number): string {
  if (value < 1000) return underThousand(value);
  const thousands = Math.floor(value / 1000);
  const rest = value % 1000;
  const mille = thousands === 1 ? "mille" : `${underThousand(thousands)} mille`;
  if (rest === 0) return mille;
  return `${mille} ${underThousand(rest)}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(round2(value));
}

export function formatDay(value?: string) {
  if (!value) return "—";
  const date = value.length === 7 ? new Date(`${value}-01T12:00:00`) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", value.length === 7
    ? { month: "long", year: "numeric" }
    : { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function subsidyReference(file: Pick<SubsidyFile, "total" | "advanceRate">) {
  const total = round2(file.total);
  const avance = round2(total * (Number(file.advanceRate) || 0));
  return { total, avance, apresAvance: round2(total - avance) };
}

const KIND_RANK: Record<PaymentKind, number> = { avance: 0, acompte: 1, solde: 2 };

export function orderedPayments(file: SubsidyFile) {
  return [...file.payments].sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.month.localeCompare(b.month) || a.id.localeCompare(b.id));
}

export function statementFor(file: SubsidyFile, payment: SubsidyPayment) {
  const ref = subsidyReference(file);
  let remaining = ref.total;
  const planned = orderedPayments(file).map((item) => {
    let due = remaining;
    if (item.kind === "avance") due = Math.min(ref.avance, remaining);
    if (item.kind === "acompte") due = Math.min(round2(item.amount), remaining);
    due = round2(Math.max(0, due));
    remaining = round2(Math.max(0, remaining - due));
    return { ...item, planned: due };
  });
  const index = Math.max(0, planned.findIndex((item) => item.id === payment.id));
  const current = planned[index];
  const previous = planned.slice(0, index).filter((item) => item.status === "versé");
  const previousSum = round2(previous.reduce((sum, item) => sum + item.planned, 0));
  const plannedThrough = round2(planned.slice(0, index + 1).reduce((sum, item) => sum + item.planned, 0));
  return {
    ...ref,
    previous,
    previousSum,
    due: current?.planned ?? 0,
    after: round2(Math.max(0, ref.total - plannedThrough)),
  };
}

export function withComputedAmounts(file: SubsidyFile): SubsidyFile {
  const next = orderedPayments(file).map((payment) => ({ ...payment }));
  next.forEach((payment, index) => {
    const snapshot = { ...file, payments: next };
    const statement = statementFor(snapshot, payment);
    if (payment.kind !== "acompte") next[index] = { ...payment, amount: statement.due };
  });
  return { ...file, payments: next };
}

export const KIND_LABEL: Record<PaymentKind, string> = {
  avance: "Avance",
  acompte: "Acompte",
  solde: "Solde",
};

function pdfMoney(value: number) {
  return formatMoney(value).replace(/[\u202f\u00a0]/g, " ");
}

function paintPageFooter(pdf: jsPDF, generated: string) {
  const width = pdf.internal.pageSize.getWidth();
  const count = pdf.getNumberOfPages();
  for (let index = 1; index <= count; index += 1) {
    pdf.setPage(index);
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    pdf.text(`DIRM Méditerranée · Généré le ${generated}`, 16, 288);
    pdf.text(`Page ${index} / ${count}`, width - 16, 288, { align: "right" });
  }
}

export function buildSuiviPdf(file: SubsidyFile) {
  const ready = withComputedAmounts(file);
  const ref = subsidyReference(ready);
  const ordered = orderedPayments(ready);
  const paid = round2(ordered.filter((item) => item.status === "versé").reduce((sum, item) => sum + round2(item.amount), 0));
  const remaining = round2(Math.max(0, ref.total - paid));
  const rateLabel = `${Math.round((ready.advanceRate || 0) * 1000) / 10} %`.replace(".", ",");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const generated = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  pdf.setFillColor(0, 85, 164);
  pdf.rect(16, 14, 18, 1.3, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(34, 14, 6, 1.3, "F");
  pdf.setFillColor(239, 65, 53);
  pdf.rect(40, 14, 18, 1.3, "F");
  pdf.setFont("times", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  pdf.text("RÉPUBLIQUE FRANÇAISE", width - 16, 16, { align: "right" });
  pdf.setFont("times", "italic");
  pdf.setFontSize(8);
  pdf.text("Liberté · Égalité · Fraternité", width - 16, 20.5, { align: "right" });
  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(15, 70, 58);
  pdf.text("ÉTAT DE SUIVI DES VERSEMENTS", 16, 34);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(60, 70, 66);
  pdf.text("DIRM Méditerranée", 16, 40);
  pdf.setDrawColor(210, 222, 216);
  pdf.line(16, 44, width - 16, 44);

  const identity = [
    `Bénéficiaire : ${ready.beneficiaire || "—"}`,
    `Objet : ${ready.objet || "—"}`,
    `Programme : ${ready.programme || "—"}`,
    `EJ n° ${formatEj(ready.ej) || "—"}`,
    ready.reference ? `Référence : ${ready.reference}` : "",
    ready.conventionDate ? `Convention signée le ${formatDay(ready.conventionDate)}` : "",
    ready.signataire ? `Attestation signée par ${ready.signataire}${ready.qualite ? `, ${ready.qualite}` : ""}` : "",
    ready.payeeName ? `Versement à : ${ready.payeeName}${ready.payeeBank ? ` — ${ready.payeeBank}` : ""}` : "",
  ].filter(Boolean);
  pdf.setFontSize(10.5);
  pdf.setTextColor(40, 40, 40);
  let y = 52;
  identity.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, width - 32);
    pdf.text(wrapped, 16, y);
    y += wrapped.length * 5.2;
  });

  y += 2;
  const cardWidth = (width - 32 - 8) / 3;
  const cards = [
    { label: `Avance ${rateLabel}`, value: pdfMoney(ref.avance), fill: [232, 244, 239] as const },
    { label: "Acomptes et solde", value: pdfMoney(ref.apresAvance), fill: [244, 244, 242] as const },
    { label: "Montant de la subvention", value: pdfMoney(ref.total), fill: [255, 246, 230] as const },
  ];
  cards.forEach((card, index) => {
    const x = 16 + index * (cardWidth + 4);
    pdf.setFillColor(...card.fill);
    pdf.roundedRect(x, y, cardWidth, 18, 2, 2, "F");
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(70, 80, 74);
    pdf.text(card.label, x + 3, y + 6);
    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(20, 50, 42);
    pdf.text(card.value, x + 3, y + 13);
  });
  y += 26;
  const demandes = ready.demandes || [];
  if (demandes.length || ready.requestedAmount) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    pdf.text(demandes.length > 1 ? "Demandes de paiement reçues" : "Demande de paiement reçue", 16, y);
    y += 5.5;
    pdf.setFont("times", "normal");
    const noteLines = demandes.length
      ? demandes.map((demande) => `${formatDay(demande.receivedAt)} · ${KIND_LABEL[demande.kind]} · ${demande.label || "Demande"} · ${pdfMoney(demande.amount)}`)
      : [`La demande porte sur ${pdfMoney(ready.requestedAmount || 0)}.`];
    noteLines.forEach((note) => {
      const wrapped = pdf.splitTextToSize(note, width - 32);
      pdf.text(wrapped, 16, y);
      y += wrapped.length * 5;
    });
    y += 3;
  }

  const columns = [16, 48, 82, 118, 146];
  const headers = ["Versement", "Mois", "Montant", "Statut", "Règlement"];
  const drawHeader = () => {
    pdf.setDrawColor(180, 198, 190);
    pdf.line(16, y, width - 16, y);
    pdf.setFont("times", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(40, 70, 60);
    headers.forEach((header, index) => pdf.text(header, columns[index], y + 5));
    y += 8;
    pdf.line(16, y, width - 16, y);
  };
  drawHeader();
  pdf.setFont("times", "normal");
  pdf.setTextColor(30, 30, 30);
  ordered.forEach((payment) => {
    if (y > 255) {
      pdf.addPage();
      y = 20;
      drawHeader();
      pdf.setFont("times", "normal");
      pdf.setTextColor(30, 30, 30);
    }
    const statement = statementFor(ready, payment);
    const cells = [
      KIND_LABEL[payment.kind],
      formatDay(payment.month),
      formatMoney(statement.due).replace(/[\u202f\u00a0]/g, " "),
      payment.status === "versé" ? "Versé" : "Prévu",
      payment.status === "versé" ? formatDateTime(payment.settledAt) || "—" : "—",
    ];
    cells.forEach((cell, index) => {
      const wrapped = pdf.splitTextToSize(cell, index === 4 ? 48 : 32);
      pdf.text(wrapped, columns[index], y + 5);
    });
    y += 9;
    if (payment.serviceFait) {
      pdf.setFontSize(8);
      pdf.setTextColor(90, 90, 90);
      pdf.text(`SF n° ${payment.serviceFait}`, columns[0], y + 1);
      pdf.setFontSize(10);
      pdf.setTextColor(30, 30, 30);
      y += 5;
    }
  });
  if (ordered.length === 0) {
    pdf.setFont("times", "italic");
    pdf.text("Aucun versement ouvert.", 16, y + 6);
    y += 12;
  }
  y += 6;
  const sums = [
    `Déjà versé : ${pdfMoney(paid)}`,
    paid > 0 ? `La somme de : ${eurosEnLettres(paid)}` : "",
    `Reste à verser : ${pdfMoney(remaining)}`,
    remaining > 0 ? `La somme de : ${eurosEnLettres(remaining)}` : "",
  ].filter(Boolean);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);
  sums.forEach((line) => {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
    const wrapped = pdf.splitTextToSize(line, width - 32);
    pdf.text(wrapped, 16, y);
    y += wrapped.length * 5.4;
  });
  y += 6;
  pdf.setFont("times", "italic");
  pdf.setFontSize(10);
  pdf.text("Suivi tenu par la DIRM Méditerranée. La date de chaque règlement est celle du changement de statut.", 16, Math.min(y, 276));
  paintPageFooter(pdf, generated);
  return pdf;
}

export function downloadSuiviPdf(file: SubsidyFile) {
  buildSuiviPdf(file).save(`suivi-versements-${ejDigits(file.ej) || "subvention"}.pdf`);
}

export function downloadStatementPdf(file: SubsidyFile) {
  downloadSuiviPdf(file);
}

export async function signSubsidyPdf(bytes: Uint8Array, signaturePng: Uint8Array, signer: string, at: string) {
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPages()[0];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const image = await pdf.embedPng(signaturePng);
  const angle = ((page.getRotation().angle % 360) + 360) % 360;
  const { width } = page.getSize();
  const scale = Math.min(150 / image.width, 42 / image.height, 1);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  const caption = `Signé électroniquement par ${signer} le ${at}`;
  if (angle === 270) {
    page.drawText(caption, { x: width - 86, y: 72, size: 8, font, color: rgb(0, 0, 0), rotate: degrees(270) });
    page.drawImage(image, { x: width - 64, y: 72, width: imageWidth, height: imageHeight, rotate: degrees(270) });
  } else {
    page.drawText(caption, { x: 64, y: 72, size: 9, font, color: rgb(0, 0, 0) });
    page.drawImage(image, { x: 64, y: 22, width: imageWidth, height: imageHeight });
  }
  return pdf.save();
}

export function downloadInvoicePdf(file: SubsidyFile, payment: SubsidyPayment, demande?: SubsidyRequest) {
  const ready = withComputedAmounts(file);
  const statement = statementFor(ready, payment);
  const amount = round2(statement.due || payment.amount);
  const issued = new Date();
  const issuedLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(issued);
  const number = `FV-${issued.getFullYear()}-${payment.id.replace(/\W/g, "").slice(-6).toUpperCase()}`;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(0, 85, 164);
  pdf.rect(16, 14, 18, 1.3, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(34, 14, 6, 1.3, "F");
  pdf.setFillColor(239, 65, 53);
  pdf.rect(40, 14, 18, 1.3, "F");
  pdf.setFont("times", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  pdf.text("RÉPUBLIQUE FRANÇAISE", width - 16, 16, { align: "right" });
  pdf.setFont("times", "italic");
  pdf.setFontSize(8);
  pdf.text("Liberté · Égalité · Fraternité", width - 16, 20.5, { align: "right" });
  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(15, 70, 58);
  pdf.text("FACTURE", 16, 34);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(40, 40, 40);
  pdf.text(`N° ${number}`, 16, 42);
  pdf.text(`Émise le ${issuedLabel}`, 16, 48);
  pdf.setDrawColor(210, 222, 216);
  pdf.line(16, 52, width - 16, 52);

  pdf.setFillColor(232, 244, 239);
  pdf.roundedRect(16, 58, 84, 42, 2, 2, "F");
  pdf.setFont("times", "bold");
  pdf.setFontSize(9);
  pdf.text("Émetteur", 20, 65);
  pdf.setFont("times", "normal");
  pdf.setFontSize(9);
  const issuer = [
    "DIRM Méditerranée",
    "Service des affaires économiques",
    "4 rue Hoche, BP 472",
    "34207 Sète",
    "affaires-economiques.dirm-med@developpement-durable.gouv.fr",
  ];
  issuer.forEach((line, index) => pdf.text(line, 20, 71 + index * 4.4));

  pdf.setFillColor(255, 246, 230);
  pdf.roundedRect(width - 100, 58, 84, 42, 2, 2, "F");
  pdf.setFont("times", "bold");
  pdf.text("Destinataire", width - 96, 65);
  pdf.setFont("times", "normal");
  const recipient = [
    ready.beneficiaire || "Bénéficiaire",
    ready.payeeName || "Paierie du bénéficiaire",
    ready.payeeBank || "",
    ready.reference ? `Réf. ${ready.reference}` : "",
  ].filter(Boolean);
  recipient.forEach((line, index) => {
    const wrapped = pdf.splitTextToSize(line, 76);
    pdf.text(wrapped, width - 96, 71 + index * 4.6);
  });

  let y = 112;
  const meta = [
    `EJ n° ${formatEj(ready.ej) || "—"}`,
    `Objet : ${ready.objet || ready.programme || "Subvention"}`,
    demande ? `Demande : ${demande.label || KIND_LABEL[payment.kind]}` : "",
    `Versement : ${KIND_LABEL[payment.kind]}${payment.month ? ` · ${formatDay(payment.month)}` : ""}`,
  ].filter(Boolean);
  meta.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, width - 32);
    pdf.text(wrapped, 16, y);
    y += wrapped.length * 5;
  });

  y += 4;
  pdf.setFillColor(232, 244, 239);
  pdf.rect(16, y, width - 32, 8, "F");
  pdf.setTextColor(15, 70, 58);
  pdf.setFont("times", "bold");
  pdf.setFontSize(9);
  pdf.text("Désignation", 20, y + 5.4);
  pdf.text("Montant", width - 20, y + 5.4, { align: "right" });
  y += 8;
  pdf.setTextColor(30, 30, 30);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.text(`${KIND_LABEL[payment.kind]} de subvention`, 20, y + 8);
  pdf.text(pdfMoney(amount), width - 20, y + 8, { align: "right" });
  pdf.setDrawColor(220, 228, 224);
  pdf.line(16, y + 12, width - 16, y + 12);
  y += 20;
  pdf.setFont("times", "bold");
  pdf.text("Total à payer", 20, y);
  pdf.text(pdfMoney(amount), width - 20, y, { align: "right" });
  y += 8;
  pdf.setFont("times", "italic");
  pdf.setFontSize(11);
  const words = pdf.splitTextToSize(amount > 0 ? eurosEnLettres(amount) : "Montant à préciser", width - 32);
  pdf.text(words, 16, y);
  y += words.length * 5 + 8;
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);
  const notes = [
    "Subvention publique. TVA non applicable.",
    "Le versement est fait au compte désigné par le bénéficiaire, sous réserve des pièces reçues.",
    ready.payeeName ? `Compte destinataire : ${ready.payeeName}${ready.payeeBank ? `, ${ready.payeeBank}` : ""}.` : "",
  ].filter(Boolean);
  notes.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, width - 32);
    pdf.text(wrapped, 16, y);
    y += wrapped.length * 5;
  });
  paintPageFooter(pdf, issuedLabel);
  pdf.save(`facture-${number}.pdf`);
}

export const PIECE_LABELS: Record<PaymentKind, string[]> = {
  avance: [
    "RIB du bénéficiaire",
    "KBIS de moins de trois mois, s'il est demandé",
    "Lettre de demande de versement",
    "Attestation de commencement d'exécution",
  ],
  acompte: [
    "Lettre de demande de versement",
    "Justificatifs du service fait",
    "Consommation des versements déjà reçus",
    "Rapport intermédiaire d'exécution",
  ],
  solde: [
    "Lettre de demande de versement",
    "Bilan technique final",
    "Bilan financier certifié, avec les justificatifs",
    "Déclaration d'achèvement et liste des aides publiques",
  ],
};

export function piecesForKind(kind: PaymentKind): SubsidyPieceSlot[] {
  return PIECE_LABELS[kind].map((label, index) => ({ id: `${kind}-${index}`, label, files: [], note: "", review: "", reviewNote: "" }));
}

export function demandeProgress(demande: Pick<SubsidyRequest, "kind" | "pieces">) {
  const expected = PIECE_LABELS[demande.kind] || [];
  const pieces = demande.pieces || [];
  const byLabel = new Map(pieces.map((piece) => [piece.label, piece]));
  const total = expected.length;
  const deposited = expected.filter((label) => (byLabel.get(label)?.files.length || 0) > 0).length;
  const accepted = expected.filter((label) => byLabel.get(label)?.review === "accepte").length;
  const refused = expected.filter((label) => byLabel.get(label)?.review === "refuse").length;
  const ready = expected.filter((label) => {
    const piece = byLabel.get(label);
    return Boolean(piece && piece.files.length > 0 && piece.review !== "refuse");
  }).length;
  return {
    total,
    deposited,
    accepted,
    refused,
    ready,
    percent: total ? Math.round((ready / total) * 100) : 0,
  };
}

export function blankRequest(partial: Partial<SubsidyRequest> = {}): SubsidyRequest {
  const kind = partial.kind || "acompte";
  return {
    id: `dem-${Date.now()}`,
    receivedAt: new Date().toISOString().slice(0, 10),
    label: "Nouvelle demande",
    kind,
    amount: 0,
    reference: "",
    note: "",
    text: "",
    pdf: null,
    handlers: [],
    providers: [],
    pieces: piecesForKind(kind),
    extraFiles: [],
    stage: "pieces",
    paymentDecision: "",
    ...partial,
  };
}

export function normalizeSubsidy(file: SubsidyFile): SubsidyFile {
  const demandes = [...(file.demandes || [])].map((demande) => ({
    ...demande,
    handlers: demande.handlers || [],
    providers: demande.providers || [],
    pieces: demande.pieces?.length ? demande.pieces : piecesForKind(demande.kind),
    extraFiles: demande.extraFiles || [],
    stage: demande.stage || "pieces",
    paymentDecision: demande.paymentDecision || "",
  }));
  if (demandes.length === 0 && (file.courrier || file.courrierText || file.requestedAmount)) {
    demandes.push({
      id: `dem-${file.id}`,
      receivedAt: file.courrierDate || "",
      label: "Demande initiale",
      kind: "avance",
      amount: file.requestedAmount || 0,
      reference: file.reference || "",
      note: "",
      text: file.courrierText || "",
      pdf: file.courrier || null,
    });
  }
  const requestedAmount = round2(demandes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)) || file.requestedAmount || 0;
  return withComputedAmounts({ ...file, demandes, requestedAmount });
}

export function withDemandes(file: SubsidyFile): SubsidyFile {
  const monthOf = (value: string) => (value || "").slice(0, 7) || new Date().toISOString().slice(0, 7);
  let payments = [...(file.payments || [])];
  const demandes = (file.demandes || []).map((demande) => {
    if (demande.kind !== "acompte") {
      const linked = payments.find((item) => item.kind === demande.kind);
      return linked ? { ...demande, paymentId: demande.paymentId || linked.id } : { ...demande, paymentId: undefined };
    }
    const paymentId = demande.paymentId && payments.some((item) => item.id === demande.paymentId)
      ? demande.paymentId
      : `pay-${demande.id}`;
    if (!payments.some((item) => item.id === paymentId)) {
      payments.push({
        id: paymentId,
        kind: "acompte",
        month: monthOf(demande.receivedAt),
        serviceFait: "",
        amount: demande.amount,
        place: "Marseille",
        status: "prévu",
      });
    } else {
      payments = payments.map((item) => (
        item.id === paymentId && item.status !== "versé"
          ? { ...item, amount: demande.amount, month: monthOf(demande.receivedAt) }
          : item
      ));
    }
    return { ...demande, paymentId };
  });
  const requestedAmount = round2(demandes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  let total = Number(file.total) || 0;
  let amountSource = file.amountSource || "";
  const firstAdvance = demandes.find((item) => item.kind === "avance" && item.amount > 0);
  if (!(total > 0) && firstAdvance && file.advanceRate > 0 && file.advanceRate < 1) {
    total = round2(firstAdvance.amount / file.advanceRate);
    amountSource = "demande";
  }
  let next: SubsidyFile = { ...file, demandes, payments, requestedAmount, total, amountSource };
  if (next.total > 0 && next.payments.length === 0) {
    const month = new Date().toISOString().slice(0, 7);
    next = {
      ...next,
      payments: [
        { id: `pay-avance-${next.id}`, kind: "avance", month, serviceFait: "", amount: 0, place: "Marseille", status: "prévu" },
        { id: `pay-solde-${next.id}`, kind: "solde", month, serviceFait: "", amount: 0, place: "Marseille", status: "prévu" },
      ],
    };
    next.demandes = (next.demandes || []).map((demande) => {
      if (demande.paymentId || demande.kind === "acompte") return demande;
      const linked = next.payments.find((item) => item.kind === demande.kind);
      return linked ? { ...demande, paymentId: linked.id } : demande;
    });
  }
  return withComputedAmounts(next);
}

export function sampleSubsidy(): SubsidyFile {
  return {
    id: "sub-fonds-vert-2026",
    reference: "SML-D26-18213",
    ej: "2105059013",
    programme: "Fonds vert",
    objet: "Création de la norme française Territoire engagé pour les mers et les océans, à partir du référentiel AFNOR SPEC Territoire engagé pour la Méditerranée",
    beneficiaire: "Région Provence-Alpes-Côte d'Azur",
    signataire: "Valérie RAIMONDINO",
    qualite: "Directrice de la Direction Biodiversité-mer",
    suiviNom: "Gilles GIORGETTI",
    suiviEmail: "ggiorgetti@maregionsud.fr",
    conventionDate: "2026-08-07",
    commencementDate: "2026-09-30",
    attestationPlace: "Marseille",
    attestationDate: "2026-11-03",
    courrierDate: "2026-11-09",
    courrierText: [
      "Objet : Demande de paiement Arrêté de Subvention Fonds Vert 2026 EJ n° ____ « Création de la norme française Territoire engagé pour les mers et les océans ».",
      "",
      "Je soussigné, Madame Valérie RAIMONDINO, agissant en qualité de Directrice de la Direction « Biodiversité – Mer » de la Région Provence-Alpes-Côte d'Azur :",
      "- confirme avoir pris connaissance de l'arrêté EJ n° ____ en objet et notamment des dispositions financières prévues dans son article 5.2 ;",
      "- déclare être à jour de mes obligations au titre de l'article 7 de l'Arrêté EJ n° ____ ;",
      "- certifie que les éléments mis à l'appui de la demande de versement sont exacts.",
      "",
      "Je vous remercie de verser la somme de 16 830 euros à la Région Provence-Alpes-Côte d'Azur.",
    ].join("\n"),
    total: 56100,
    advanceRate: 0.3,
    requestedAmount: 16830,
    amountSource: "demande",
    payeeName: "Paierie régionale de Provence-Alpes-Côte d'Azur",
    payeeBank: "Banque de France",
    demandes: [
      {
        id: "dem-fonds-vert-avance",
        receivedAt: "2026-11-09",
        label: "Demande d'avance",
        kind: "avance",
        amount: 16830,
        reference: "SML-D26-18213",
        note: "Courrier initial du bénéficiaire.",
        text: "",
        pdf: null,
        paymentId: "pay-avance-2026-11",
      },
    ],
    payments: [
      {
        id: "pay-avance-2026-11",
        kind: "avance",
        month: "2026-11",
        serviceFait: "",
        amount: 16830,
        place: "Marseille",
        status: "prévu",
      },
      {
        id: "pay-solde-2027",
        kind: "solde",
        month: "2027-06",
        serviceFait: "",
        amount: 39270,
        place: "Marseille",
        status: "prévu",
      },
    ],
  };
}
