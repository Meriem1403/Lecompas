import { jsPDF } from "jspdf";
import {
  formatAccidentDateFr,
  formatAccidentDateTimeFr,
} from "@/app/utils/accidentDateTime";
import {
  formatStoppagePeriodFr,
  REGULATORY_GRAVITY_LABELS,
  normalizeAccidentStoppageFields,
  type RegulatoryGravity,
} from "@/app/utils/accidentRegulatoryGravity";
import { getLegalTypeLabel } from "@/app/utils/accidentRecord";
import { pdfSplitLines, pdfWriteBlock, pdfWriteLine, sanitizePdfText } from "@/app/utils/pdfText";

export interface AccidentPdfSource {
  id: string;
  title: string;
  date: string;
  time?: string;
  createdAt: string;
  type: "travail" | "trajet" | "maladie_pro";
  accidentCategory?: string;
  accidentEventType?: string;
  victim: string;
  victimFirstName?: string;
  victimLastName?: string;
  location: string;
  service?: string;
  domain?: string;
  description: string;
  circumstances?: string;
  accidentCauses?: string;
  causeAnalysis?: string;
  comments?: string;
  measures: string;
  severity: string;
  witnesses?: string[];
  lesionSites?: string[];
  lesionNatures?: string[];
  correctiveActions?: string[];
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
  duerpRiskFreeText?: string;
  hasWorkStoppage?: boolean;
  workStoppageStartDate?: string;
  workStoppageEndDate?: string;
  workStoppageDays?: number;
  hasReturnToWorkMedicalConditions?: boolean;
  returnToWorkMedicalConditions?: string;
  regulatoryGravity?: string;
}

function formatDuerpLine(acc: AccidentPdfSource): string {
  if (acc.duerpRiskNumber && acc.duerpRiskLabel) {
    return `${acc.duerpRiskNumber} - ${acc.duerpRiskLabel}`;
  }
  return acc.duerpRiskFreeText?.trim() || "";
}

function joinList(items?: string[]): string {
  return (items ?? []).filter(Boolean).join(", ") || "Non renseigné";
}

function regulatoryLabel(gravity: RegulatoryGravity): string {
  return sanitizePdfText(REGULATORY_GRAVITY_LABELS[gravity] ?? gravity);
}

type PdfSection = { title: string; lines: string[] };

function buildAccidentSections(acc: AccidentPdfSource): PdfSection[] {
  const stoppage = normalizeAccidentStoppageFields(acc);
  const witnesses = acc.witnesses ?? [];

  const sections: PdfSection[] = [
    {
      title: "Identification",
      lines: [
        `Référence : ${acc.id}`,
        `Titre : ${acc.title}`,
        `Victime : ${acc.victim}`,
        ...(acc.victimFirstName || acc.victimLastName
          ? [`Prénom : ${acc.victimFirstName || "-"}`, `Nom : ${acc.victimLastName || "-"}`]
          : []),
        `Date et heure : ${formatAccidentDateTimeFr(acc.date, acc.time)}`,
        `Type légal : ${getLegalTypeLabel(acc.type)}`,
        ...(acc.accidentCategory ? [`Catégorie : ${acc.accidentCategory}`] : []),
        ...(acc.accidentEventType ? [`Type (nature) : ${acc.accidentEventType}`] : []),
        `Lieu : ${acc.location}`,
        ...(acc.service ? [`Service : ${acc.service}`] : []),
        ...(acc.domain ? [`Domaine : ${acc.domain}`] : []),
        `Déclaration enregistrée le : ${new Date(acc.createdAt).toLocaleString("fr-FR")}`,
      ],
    },
    {
      title: "Gravité et arrêt de travail",
      lines: [
        `Gravité (tableau de bord) : ${acc.severity}`,
        `Classement réglementaire : ${stoppage.regulatoryGravity} - ${regulatoryLabel(stoppage.regulatoryGravity)}`,
        formatStoppagePeriodFr(
          stoppage.hasWorkStoppage,
          stoppage.workStoppageStartDate,
          stoppage.workStoppageEndDate,
        ),
        ...(stoppage.hasWorkStoppage && stoppage.workStoppageDays != null
          ? [`Durée : ${stoppage.workStoppageDays} jour(s) calendaire(s)`]
          : []),
        stoppage.hasReturnToWorkMedicalConditions
          ? `Reprise - médecine du travail : ${stoppage.returnToWorkMedicalConditions || "Oui (non détaillé)"}`
          : "Reprise - médecine du travail : non renseignée",
      ],
    },
    {
      title: "Description et circonstances",
      lines: [
        `Description des faits : ${acc.description}`,
        ...(acc.circumstances ? [`Circonstances : ${acc.circumstances}`] : []),
      ],
    },
    {
      title: "Lésions et actions",
      lines: [
        `Siège(s) de lésion : ${joinList(acc.lesionSites)}`,
        `Nature(s) de lésion : ${joinList(acc.lesionNatures)}`,
        `Actions correctives : ${joinList(acc.correctiveActions)}`,
        `Témoins : ${witnesses.length > 0 ? witnesses.join(", ") : "Aucun"}`,
      ],
    },
    {
      title: "Causes et analyse",
      lines: [
        ...(acc.accidentCauses ? [`Causes : ${acc.accidentCauses}`] : ["Causes : non renseignées"]),
        ...(acc.causeAnalysis
          ? [`Analyse des causes : ${acc.causeAnalysis}`]
          : ["Analyse des causes : non renseignée"]),
      ],
    },
    {
      title: "Mesures et commentaires",
      lines: [
        `Mesures prises et suivi : ${acc.measures || "Non renseigné"}`,
        ...(acc.comments ? [`Commentaires : ${acc.comments}`] : []),
      ],
    },
  ];

  const duerp = formatDuerpLine(acc);
  if (duerp) {
    sections.push({ title: "Risque DUERP", lines: [duerp] });
  }

  return sections;
}

function renderSections(
  pdf: jsPDF,
  sections: PdfSection[],
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number,
): number {
  let y = startY;
  const contentWidth = pageWidth - margin * 2 - 8;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 18) {
      pdf.addPage();
      y = 20;
    }
  };

  sections.forEach((section) => {
    const bodyLines = section.lines.flatMap((line) => pdfSplitLines(pdf, line, contentWidth));
    const blockHeight = Math.max(14, 10 + bodyLines.length * 5);
    ensureSpace(blockHeight + 4);

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y - 5, pageWidth - margin * 2, blockHeight, 2, 2, "F");
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, y - 5, pageWidth - margin * 2, blockHeight, 2, 2, "S");
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(11);
    pdfWriteLine(pdf, section.title, margin + 3, y + 1);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    y += 7;
    bodyLines.forEach((line) => {
      pdfWriteLine(pdf, line, margin + 4, y + 1);
      y += 5;
    });
    y += 7;
  });

  return y;
}

export function exportAccidentDeclarationPdf(
  accident: AccidentPdfSource,
  fileName?: string,
): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;

  pdf.setFillColor(220, 38, 38);
  pdf.rect(0, 0, pageWidth, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdfWriteLine(pdf, "Déclaration d'accident", pageWidth / 2, 12, { align: "center" });
  pdf.setFontSize(10);
  pdfWriteLine(pdf, accident.title || "Sans titre", pageWidth / 2, 20, { align: "center" });

  renderSections(pdf, buildAccidentSections(accident), 36, margin, pageWidth, pageHeight);

  pdf.setTextColor(107, 114, 128);
  pdf.setFontSize(8);
  pdfWriteLine(
    pdf,
    `Document généré le ${new Date().toLocaleDateString("fr-FR")} - Module accidentologie`,
    margin,
    pageHeight - 10,
  );

  const safeName =
    fileName ??
    `Declaration_Accident_${sanitizePdfText(accident.id)}_${sanitizePdfText(accident.date)}.pdf`.replace(
      /[^\w.-]+/g,
      "_",
    );
  pdf.save(safeName);
}

export function exportAccidentsListPdf(
  accidents: AccidentPdfSource[],
  options?: { title?: string; fileName?: string },
): void {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let yPos = 20;

  pdf.setFillColor(220, 38, 38);
  pdf.rect(0, 0, pageWidth, 40, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdfWriteLine(pdf, options?.title ?? "Registre des déclarations d'accidents", pageWidth / 2, 18, {
    align: "center",
  });
  pdf.setFontSize(10);
  pdfWriteLine(pdf, `Édition du ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, 30, {
    align: "center",
  });

  yPos = 52;
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdfWriteLine(pdf, `Total : ${accidents.length} déclaration(s)`, margin, yPos);
  yPos += 12;

  accidents.forEach((acc, index) => {
    if (yPos > pageHeight - 45) {
      pdf.addPage();
      yPos = 20;
    }

    const stoppage = normalizeAccidentStoppageFields(acc);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 42, 2, 2, "F");
    pdf.setDrawColor(209, 213, 219);
    pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 42, 2, 2, "S");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(185, 28, 28);
    pdfWriteLine(pdf, `${index + 1}. ${acc.title}`, margin + 3, yPos + 6);

    pdf.setFontSize(8);
    pdf.setTextColor(55, 65, 81);
    const meta = [
      `${formatAccidentDateFr(acc.date)} ${acc.time ?? ""}`.trim(),
      acc.victim,
      getLegalTypeLabel(acc.type),
      stoppage.regulatoryGravity,
    ]
      .filter(Boolean)
      .join(" | ");
    pdfWriteLine(pdf, meta, margin + 3, yPos + 12);

    const detailText = [
      acc.accidentCategory,
      acc.accidentEventType,
      acc.location,
      acc.circumstances || acc.description,
    ]
      .filter(Boolean)
      .join(" - ");

    pdf.setFont("helvetica", "normal");
    const detailLines = pdfSplitLines(pdf, detailText, pageWidth - 2 * margin - 6);
    detailLines.forEach((line, lineIndex) => {
      pdfWriteLine(pdf, line, margin + 3, yPos + 18 + lineIndex * 5);
    });

    yPos += 48;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    pdf.setPage(i);
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdfWriteLine(pdf, `Page ${i}/${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
  }

  const fileName =
    options?.fileName ??
    `Export_Accidents_${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}
