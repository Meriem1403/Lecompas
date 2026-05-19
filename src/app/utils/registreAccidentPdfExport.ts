import { jsPDF } from "jspdf";
import { getLegalTypeLabel } from "@/app/utils/accidentRecord";
import { pdfSplitLines, pdfWriteBlock, pdfWriteLine, sanitizePdfText } from "@/app/utils/pdfText";

export interface RegistreBeninPdfSource {
  numero: number;
  annee: number;
  nomVictime: string;
  prenomVictime: string;
  dateAccident: string;
  heureAccident: string;
  lieuAccident: string;
  circonstances: string;
  natureLesions: string;
  siegeLesions: string;
  soignant: string;
  observations?: string;
  categorieAccident?: string;
  typeAccidentNature?: string;
  typeLegal?: string;
  descriptionFaits?: string;
  causes?: string;
  analyseCauses?: string;
  commentaires?: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
  duerpRiskFreeText?: string;
  signatureSoignant?: boolean;
  signatureVictime?: boolean;
  signatureSoignantDate?: string;
  signatureVictimeDate?: string;
}

function duerpLine(acc: RegistreBeninPdfSource): string {
  if (acc.duerpRiskNumber && acc.duerpRiskLabel) {
    return `${acc.duerpRiskNumber} - ${acc.duerpRiskLabel}`;
  }
  return acc.duerpRiskFreeText?.trim() || "";
}

function extraLines(acc: RegistreBeninPdfSource): string[] {
  const lines: string[] = [];
  if (acc.categorieAccident) lines.push(`Catégorie : ${acc.categorieAccident}`);
  if (acc.typeAccidentNature) lines.push(`Type (nature) : ${acc.typeAccidentNature}`);
  if (acc.typeLegal) lines.push(`Type légal : ${getLegalTypeLabel(acc.typeLegal)}`);
  if (acc.descriptionFaits) lines.push(`Description : ${acc.descriptionFaits}`);
  if (acc.causes) lines.push(`Causes : ${acc.causes}`);
  if (acc.analyseCauses) lines.push(`Analyse : ${acc.analyseCauses}`);
  if (acc.commentaires) lines.push(`Commentaires : ${acc.commentaires}`);
  const duerp = duerpLine(acc);
  if (duerp) lines.push(`Risque DUERP : ${duerp}`);
  return lines;
}

function formatRegistreDate(dateAccident: string): string {
  if (!dateAccident?.trim()) return "-";
  const parsed = new Date(`${dateAccident.trim()}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateAccident;
  return parsed.toLocaleDateString("fr-FR");
}

export function exportRegistreBeninDeclarationPdf(
  accident: RegistreBeninPdfSource,
  options?: {
    hasSoignantSignature?: boolean;
    hasVictimeSignature?: boolean;
    fileName?: string;
  },
): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;
  const contentWidth = pageWidth - margin * 2 - 8;

  const addSection = (title: string, lines: string[]) => {
    const safeLines = lines.map((l) => sanitizePdfText(l)).filter(Boolean);
    const bodyLines = safeLines.flatMap((line) => pdfSplitLines(pdf, line, contentWidth));
    const blockHeight = Math.max(14, 10 + bodyLines.length * 5);

    if (y + blockHeight > pageHeight - 15) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y - 5, pageWidth - margin * 2, blockHeight, 2, 2, "F");
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y - 5, pageWidth - margin * 2, blockHeight, 2, 2, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(11);
    pdfWriteLine(pdf, title, margin + 3, y + 1);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85);
    y += 7;
    bodyLines.forEach((line) => {
      pdfWriteLine(pdf, line, margin + 4, y + 1);
      y += 5;
    });
    y += 7;
  };

  pdf.setFillColor(220, 38, 38);
  pdf.rect(0, 0, pageWidth, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdfWriteLine(pdf, "Registre - accident bénin", pageWidth / 2, 12, { align: "center" });
  pdf.setFontSize(11);
  pdfWriteLine(pdf, `N° ${accident.numero}/${accident.annee}`, pageWidth / 2, 20, { align: "center" });

  y = 36;
  addSection("Identification", [
    `Victime : ${accident.prenomVictime} ${accident.nomVictime}`.trim(),
    `Date : ${formatRegistreDate(accident.dateAccident)} à ${accident.heureAccident || "-"}`,
    `Lieu : ${accident.lieuAccident}`,
    ...extraLines(accident),
  ]);

  addSection("Circonstances et lésions", [
    `Circonstances : ${accident.circonstances}`,
    `Nature : ${accident.natureLesions}`,
    `Siège : ${accident.siegeLesions}`,
  ]);

  addSection("Soignant et signatures", [
    `Soignant : ${accident.soignant}`,
    `Signature soignant : ${options?.hasSoignantSignature ? "Oui" : "Non"}`,
    `Signature victime : ${options?.hasVictimeSignature ? "Oui" : "Non"}`,
  ]);

  if (accident.observations?.trim()) {
    addSection("Observations registre", [accident.observations]);
  }

  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdfWriteLine(pdf, "Document généré depuis le registre des accidents bénins", margin, pageHeight - 10);

  pdf.save(
    options?.fileName ??
      `Registre_Benin_${accident.numero}_${accident.annee}.pdf`,
  );
}

export function exportRegistreBeninListPdf(
  accidents: RegistreBeninPdfSource[],
  options?: {
    hasSoignantSignature: (acc: RegistreBeninPdfSource) => boolean;
    hasVictimeSignature: (acc: RegistreBeninPdfSource) => boolean;
  },
): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 20;

  pdf.setFillColor(220, 38, 38);
  pdf.rect(0, 0, pageWidth, 50, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdfWriteLine(pdf, "REGISTRE DES ACCIDENTS", pageWidth / 2, 20, { align: "center" });
  pdf.setFontSize(18);
  pdfWriteLine(pdf, "DU TRAVAIL", pageWidth / 2, 30, { align: "center" });
  pdf.setFontSize(12);
  pdfWriteLine(pdf, "(Accidents bénins sans arrêt)", pageWidth / 2, 40, { align: "center" });

  yPos = 65;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(31, 41, 55);
  pdfWriteLine(pdf, `Date d'édition: ${new Date().toLocaleDateString("fr-FR")}`, margin, yPos);
  pdfWriteLine(pdf, `Total accidents: ${accidents.length}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 15;

  accidents.forEach((accident) => {
    if (yPos > pageHeight - 70) {
      pdf.addPage();
      yPos = 20;
    }

    const extras = extraLines(accident);
    const boxHeight = 55 + Math.min(extras.length, 3) * 5;

    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, boxHeight, 2, 2, "F");
    pdf.setDrawColor(209, 213, 219);
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, boxHeight, 2, 2, "S");

    pdf.setFillColor(220, 38, 38);
    pdf.rect(margin, yPos, 25, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdfWriteLine(pdf, `N° ${accident.numero}/${accident.annee}`, margin + 12.5, yPos + 5.5, {
      align: "center",
    });

    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(8);
    pdfWriteLine(
      pdf,
      `Date: ${formatRegistreDate(accident.dateAccident)} à ${accident.heureAccident || "-"}`,
      margin + 30,
      yPos + 5.5,
    );

    let innerY = yPos + 12;
    pdf.setFont("helvetica", "bold");
    pdfWriteLine(pdf, "Victime:", margin + 3, innerY);
    pdf.setFont("helvetica", "normal");
    pdfWriteLine(pdf, `${accident.prenomVictime} ${accident.nomVictime}`.trim(), margin + 20, innerY);
    innerY += 6;

    pdf.setFont("helvetica", "bold");
    pdfWriteLine(pdf, "Circonstances:", margin + 3, innerY);
    pdf.setFont("helvetica", "normal");
    innerY = pdfWriteBlock(
      pdf,
      accident.circonstances,
      margin + 30,
      innerY,
      pageWidth - 2 * margin - 35,
    );

    extras.slice(0, 2).forEach((line) => {
      pdf.setFontSize(7);
      pdfWriteLine(pdf, line, margin + 3, innerY);
      innerY += 4;
    });

    pdf.setFontSize(8);
    const sigSoignant = options?.hasSoignantSignature(accident) ?? false;
    const sigVictime = options?.hasVictimeSignature(accident) ?? false;
    pdfWriteLine(
      pdf,
      `Signatures - Soignant: ${sigSoignant ? "Oui" : "Non"} | Victime: ${sigVictime ? "Oui" : "Non"}`,
      margin + 3,
      yPos + boxHeight - 4,
    );

    yPos += boxHeight + 6;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    pdf.setPage(i);
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdfWriteLine(pdf, "Registre des Accidents du Travail - Conservation 5 ans", margin, pageHeight - 10);
    pdfWriteLine(pdf, `Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  pdf.save(`Registre_Accidents_${new Date().toISOString().split("T")[0]}.pdf`);
}
