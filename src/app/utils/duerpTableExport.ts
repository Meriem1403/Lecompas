import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import { getPriorityBandFromGfm, getRiskWorkflowStatusLabel } from "@/app/services/riskPriority";
import { formatMoyenMaitriseLabel } from "@/app/utils/riskManagementFilterLogic";

export const DUERP_TABLE_COLUMNS = [
  "N° risque",
  "Risque",
  "Unité",
  "Domaine",
  "Service",
  "Site",
  "Responsable",
  "Situation dangereuse",
  "Dommages associés",
  "Gravité",
  "Fréquence",
  "Priorité initiale",
  "Moyen de maîtrise",
  "Niveau GFM",
  "Priorité P1/P2/P3",
  "Priorité finale",
  "Mesures existantes",
  "Actions planifiées",
  "Avancement",
  "Échéance",
  "Retour d'action",
  "Observation",
  "Statut",
] as const;

export type DuerpTableRow = Record<(typeof DUERP_TABLE_COLUMNS)[number], string>;

const COLUMN_WIDTHS = [28, 52, 32, 36, 40, 32, 40, 58, 58, 18, 22, 24, 36, 22, 22, 22, 52, 52, 28, 32, 44, 44, 28];

export function risksToDuerpRows(risks: Risk[]): DuerpTableRow[] {
  return risks.map((risk) => {
    const completed = risk.plannedMeasures?.filter((measure) => measure.status === "completed").length || 0;
    const total = risk.plannedMeasures?.length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      "N° risque": risk.numeroRisque || "",
      "Risque": risk.detachedFromReference ? "Lié à aucun risque" : risk.title || "",
      "Unité": risk.unite || "",
      "Domaine": risk.domain || risk.unite || "",
      "Service": risk.service || "",
      "Site": risk.site || "",
      "Responsable": risk.responsable || "",
      "Situation dangereuse": risk.situation || "",
      "Dommages associés": risk.associatedRisk || "",
      "Gravité": String(risk.severity ?? ""),
      "Fréquence": String(risk.probability ?? ""),
      "Priorité initiale": String(risk.calculPriorite ?? ""),
      "Moyen de maîtrise": formatMoyenMaitriseLabel(risk.moyenMaitrise),
      "Niveau GFM": String(risk.riskLevel ?? ""),
      "Priorité P1/P2/P3": getPriorityBandFromGfm(risk.riskLevel),
      "Priorité finale": String(risk.prioriteFinale ?? ""),
      "Mesures existantes": risk.existingMeasures?.join(" ; ") || "",
      "Actions planifiées": risk.plannedMeasures?.map((measure) => `${measure.description} (${measure.responsible})`).join(" ; ") || "",
      "Avancement": `${completed}/${total} (${progress} %)`,
      "Échéance": risk.echeance ? new Date(risk.echeance).toLocaleDateString("fr-FR") : "",
      "Retour d'action": risk.retourAction || "",
      "Observation": risk.observation || "",
      "Statut": getRiskWorkflowStatusLabel(risk.status),
    };
  });
}

export function duerpMention(date = new Date()) {
  return `Reprend le tableau de l'onglet Mise à jour des risques, arrêté le ${date.toLocaleDateString("fr-FR")}.`;
}

function fileStamp(date = new Date()) {
  return date.toISOString().split("T")[0];
}

export function downloadDuerpTableExcel(rows: DuerpTableRow[], version = fileStamp()) {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...DUERP_TABLE_COLUMNS] });
  sheet["!cols"] = COLUMN_WIDTHS.map((width) => ({ wch: Math.round(width / 2.2) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Mise à jour des risques");
  XLSX.writeFile(book, `DUERP_mise_a_jour_${version}.xlsx`);
}

export function generateDuerpTablePdf(
  rows: DuerpTableRow[],
  signature?: { dataUrl: string; name: string; at: string },
) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const columns = DUERP_TABLE_COLUMNS;
  const widths = COLUMN_WIDTHS;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const scale = (pageWidth - margin * 2) / tableWidth;
  const scaled = widths.map((width) => width * scale);

  const drawHeader = (y: number) => {
    pdf.setFillColor(245, 243, 255);
    pdf.rect(margin, y, pageWidth - margin * 2, 22, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(49, 46, 80);
    let x = margin;
    columns.forEach((column, index) => {
      const lines = pdf.splitTextToSize(column, scaled[index] - 3);
      pdf.text(lines.slice(0, 2), x + 1.5, y + 8);
      x += scaled[index];
    });
    return y + 22;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(30, 27, 50);
  pdf.text("DUERP, mise à jour des risques", margin, 28);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(`DIRM Méditerranée · ${duerpMention()} · ${rows.length} ligne(s)`, margin, 42);

  let y = drawHeader(52);
  rows.forEach((row, rowIndex) => {
    const cells = columns.map((column, index) => pdf.splitTextToSize(String(row[column] || ""), scaled[index] - 3).slice(0, 2));
    const rowHeight = Math.max(16, ...cells.map((lines) => lines.length * 7 + 6));
    if (y + rowHeight > pageHeight - 24) {
      pdf.addPage();
      y = drawHeader(18);
    }
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(250, 250, 252);
      pdf.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
    }
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, y, pageWidth - margin * 2, rowHeight);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(30, 41, 59);
    let x = margin;
    cells.forEach((lines, index) => {
      pdf.text(lines, x + 1.5, y + 8);
      x += scaled[index];
    });
    y += rowHeight;
  });

  if (signature?.dataUrl) {
    let targetPage = pdf.getNumberOfPages();
    if (y > pageHeight - 96) {
      pdf.addPage();
      targetPage = pdf.getNumberOfPages();
    }
    pdf.setPage(targetPage);
    const bandY = pageHeight - 78;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, bandY, 240, 58, "F");
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(margin, bandY, 240, 58);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Signé par ${signature.name}`, margin + 6, bandY + 12);
    pdf.text(signature.at, margin + 6, bandY + 22);
    const format = signature.dataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
    pdf.addImage(signature.dataUrl, format, margin + 120, bandY + 8, 100, 40);
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`DIRM Méditerranée · Page ${page} / ${pages}`, pageWidth / 2, pageHeight - 12, { align: "center" });
  }
  return pdf;
}

export function duerpTableFile(rows: DuerpTableRow[]) {
  const fileDataUrl = generateDuerpTablePdf(rows).output("datauristring");
  return {
    fileName: `DUERP_mise_a_jour_${fileStamp()}.pdf`,
    fileDataUrl,
    fileSize: Math.round((fileDataUrl.length * 3) / 4),
    riskRows: rows,
  };
}
