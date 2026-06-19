import { jsPDF } from "jspdf";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import type { Action } from "@/app/types/action";
import { getPriorityBandFromGfm } from "@/app/services/riskPriority";

export interface DuerpPdfMeta {
  entreprise: string;
  adresse: string;
  responsable: string;
  version: string;
  dateDebut: string;
  dateFin: string;
  methodologie: string;
}

export type DuerpExportMode = "complet" | "synthese";

function priorityLabel(level: number) {
  return getPriorityBandFromGfm(level);
}

function addFooter(pdf: jsPDF, pageNum: number, total: number) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Page ${pageNum} / ${total}`, w / 2, h - 8, { align: "center" });
}

function ensureSpace(pdf: jsPDF, y: number, needed: number, margin: number) {
  const pageH = pdf.internal.pageSize.getHeight();
  if (y + needed > pageH - 18) {
    pdf.addPage();
    return margin + 8;
  }
  return y;
}

export function generateDuerpPdf(
  risks: Risk[],
  actions: Action[],
  meta: DuerpPdfMeta,
  mode: DuerpExportMode = "synthese",
): jsPDF {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  // Page de garde
  pdf.setFillColor(147, 51, 234);
  pdf.rect(0, 0, pageWidth, 52, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("DOCUMENT UNIQUE", pageWidth / 2, 18, { align: "center" });
  pdf.setFontSize(16);
  pdf.text("D'ÉVALUATION DES RISQUES PROFESSIONNELS", pageWidth / 2, 28, { align: "center" });
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    mode === "synthese" ? "Édition synthétique" : "Édition complète",
    pageWidth / 2,
    40,
    { align: "center" },
  );

  y = 62;
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(meta.entreprise, pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(meta.adresse, pageWidth / 2, y, { align: "center" });
  y += 14;

  const metaLines = [
    `Version : ${meta.version}`,
    `Période : ${new Date(meta.dateDebut).toLocaleDateString("fr-FR")} — ${new Date(meta.dateFin).toLocaleDateString("fr-FR")}`,
    `Responsable : ${meta.responsable}`,
    `Date d'édition : ${new Date().toLocaleDateString("fr-FR")}`,
    `Nombre de risques : ${risks.length}`,
  ];
  metaLines.forEach((line) => {
    pdf.text(line, margin, y);
    y += 6;
  });

  // Synthèse par priorité
  pdf.addPage();
  y = margin;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("Synthèse des priorités (GFM)", margin, y);
  y += 8;
  const p1 = risks.filter((r) => r.riskLevel > 9).length;
  const p2 = risks.filter((r) => r.riskLevel >= 4 && r.riskLevel <= 9).length;
  const p3 = risks.filter((r) => r.riskLevel < 4).length;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  [`P1 (GFM > 9) : ${p1}`, `P2 (4 ≤ GFM ≤ 9) : ${p2}`, `P3 (GFM < 4) : ${p3}`].forEach(
    (line) => {
      pdf.text(line, margin, y);
      y += 6;
    },
  );
  y += 4;

  // Tableau des risques
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Inventaire des risques", margin, y);
  y += 8;

  const sortedRisks = [...risks].sort((a, b) => b.riskLevel - a.riskLevel);
  const riskSlice =
    mode === "synthese"
      ? sortedRisks
      : sortedRisks;

  pdf.setFontSize(8);
  riskSlice.forEach((risk, index) => {
    const band = priorityLabel(risk.riskLevel);
    const title = `${risk.numeroRisque} — ${risk.title}`;
    const situation =
      mode === "synthese"
        ? (risk.situation || "").replace(/\s+/g, " ").trim().slice(0, 180)
        : (risk.situation || "").replace(/\s+/g, " ").trim().slice(0, 400);
    const dommages = (risk.associatedRisk || "").slice(0, mode === "synthese" ? 120 : 250);
    const mesuresExistantes =
      mode === "synthese"
        ? (risk.existingMeasures || []).slice(0, 2).join(" ; ")
        : (risk.existingMeasures || []).join(" ; ");
    const mesuresPlanifiees =
      mode === "synthese"
        ? (risk.plannedMeasures || [])
            .filter((m) => m.description?.trim())
            .slice(0, 2)
            .map((m) => m.description)
            .join(" ; ")
        : (risk.plannedMeasures || [])
            .filter((m) => m.description?.trim())
            .map((m) => m.description)
            .join(" ; ");

    const block = [
      `${index + 1}. [${band}] ${title}`,
      `Service : ${risk.service || "—"} | Site : ${risk.site || "—"}`,
      `Gravité ${risk.severity} × Fréquence ${risk.probability} → GFM ${risk.riskLevel}`,
      situation ? `Situation : ${situation}` : "",
      dommages ? `Dommages associés : ${dommages}` : "",
      mesuresExistantes ? `Mesures existantes : ${mesuresExistantes}` : "",
      mesuresPlanifiees ? `Actions planifiées : ${mesuresPlanifiees}` : "",
    ].filter(Boolean);

    const lines = pdf.splitTextToSize(block.join("\n"), pageWidth - 2 * margin);
    const blockH = lines.length * 3.8 + 4;
    y = ensureSpace(pdf, y, blockH, margin);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Risque ${risk.numeroRisque}`, margin, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.text(lines, margin, y);
    y += lines.length * 3.8 + 5;
  });

  if (mode === "complet" && meta.methodologie.trim()) {
    y = ensureSpace(pdf, y, 30, margin);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Méthodologie", margin, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const methLines = pdf.splitTextToSize(meta.methodologie, pageWidth - 2 * margin);
    pdf.text(methLines, margin, y);
    y += methLines.length * 4 + 8;
  }

  // Plan d'actions PAPRIPACT / prioritaires
  const actionSlice = actions.filter(
    (a) =>
      a.papripactYear ||
      a.priority === "Haute" ||
      a.source === "DUERP",
  );
  if (actionSlice.length > 0) {
    pdf.addPage();
    y = margin;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Plan d'actions prioritaires", margin, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    actionSlice.slice(0, mode === "synthese" ? 30 : 80).forEach((action, idx) => {
      const line = `${idx + 1}. ${action.title} | ${action.responsable} | échéance ${new Date(action.deadline).toLocaleDateString("fr-FR")}${action.papripactYear ? ` | PAPRIPACT ${action.papripactYear}` : ""}`;
      const lines = pdf.splitTextToSize(line, pageWidth - 2 * margin);
      y = ensureSpace(pdf, y, lines.length * 4 + 2, margin);
      pdf.text(lines, margin, y);
      y += lines.length * 4 + 2;
    });
  }

  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    pdf.setPage(p);
    addFooter(pdf, p, totalPages);
  }

  return pdf;
}
