import { jsPDF } from "jspdf";
import type { AsbestosRegisterRow, AsbestosSiteDtaRow } from "@/app/types/importedRegisters";
import { displayMaterial, displayZone, formatMaybeExcelDate, registerRowScore } from "@/app/utils/asbestosDisplayUtils";

function clip(pdf: jsPDF, value: string, max: number) {
  let text = value || "—";
  if (pdf.getTextWidth(text) <= max) return text;
  while (text.length > 1 && pdf.getTextWidth(`${text}…`) > max) text = text.slice(0, -1);
  return `${text}…`;
}

function chrome(pdf: jsPDF, page: number, pages: number) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(0, 85, 164);
  pdf.rect(0, 0, width / 3, 5, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(width / 3, 0, width / 3, 5, "F");
  pdf.setFillColor(239, 65, 53);
  pdf.rect((width / 3) * 2, 0, width / 3, 5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(41, 37, 36);
  pdf.text("RÉPUBLIQUE FRANÇAISE", 42, 24);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(87, 83, 78);
  pdf.text("Liberté  ·  Égalité  ·  Fraternité", 42, 36);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(120, 53, 15);
  pdf.text("DIRM MÉDITERRANÉE", width - 42, 24, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(87, 83, 78);
  pdf.text("Suivi amiante", width - 42, 36, { align: "right" });
  pdf.setDrawColor(214, 211, 209);
  pdf.setLineWidth(0.5);
  pdf.line(42, 46, width - 42, 46);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  const today = new Date().toLocaleDateString("fr-FR");
  pdf.text(`DIRM Méditerranée · Généré le ${today}`, 42, height - 24);
  pdf.text(`Page ${page} / ${pages}`, width - 42, height - 24, { align: "right" });
}

export function downloadAsbestosSitePdf(site: AsbestosSiteDtaRow, zones: AsbestosRegisterRow[]) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const inner = width - margin * 2;
  let y = 68;

  const ensure = (need: number) => {
    if (y + need < height - 48) return;
    pdf.addPage();
    y = 68;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(41, 37, 36);
  const title = pdf.splitTextToSize(site.site || "Site", inner);
  pdf.text(title, margin, y);
  y += title.length * 18 + 4;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(87, 83, 78);
  pdf.text(site.departement || "Service non renseigné", margin, y);
  y += 18;

  const facts: [string, string][] = [
    ["Personne en charge", site.personneEnCharge || "—"],
    ["Présence amiante", site.presenceAmiante || "—"],
    ["Type d'accès", site.acces || "—"],
    ["DTA", site.dtaStatut || "—"],
    ["Dernier contrôle", formatMaybeExcelDate(site.dateDernierControle)],
    ["Prochain contrôle", formatMaybeExcelDate(site.prochainControle)],
    ["Date de mise à jour", formatMaybeExcelDate(site.dateMaj)],
  ];
  facts.forEach(([label, value]) => {
    ensure(28);
    pdf.setFillColor(250, 247, 242);
    pdf.roundedRect(margin, y, inner, 22, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 53, 15);
    pdf.text(label.toUpperCase(), margin + 8, y + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(41, 37, 36);
    pdf.text(clip(pdf, value, inner - 150), margin + 140, y + 14);
    y += 26;
  });

  if (site.commentaires) {
    ensure(40);
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(41, 37, 36);
    pdf.text("Commentaires", margin, y);
    y += 14;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(68, 64, 60);
    const lines = pdf.splitTextToSize(site.commentaires, inner);
    lines.forEach((line: string) => {
      ensure(14);
      pdf.text(line, margin, y);
      y += 12;
    });
    y += 8;
  }

  ensure(36);
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(41, 37, 36);
  pdf.text("Matériaux et zones amiantés", margin, y);
  y += 8;
  pdf.setDrawColor(167, 180, 158);
  pdf.setLineWidth(1);
  pdf.line(margin, y, margin + 180, y);
  y += 16;

  if (zones.length === 0) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(120, 113, 108);
    pdf.text("Aucune zone rattachée à ce site.", margin, y);
  } else {
    zones.forEach((zone, index) => {
      ensure(52);
      pdf.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 245);
      pdf.rect(margin, y - 11, inner, 46, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(41, 37, 36);
      pdf.text(clip(pdf, displayMaterial(zone), inner - 80), margin + 6, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 53, 15);
      pdf.text(clip(pdf, registerRowScore(zone) || "—", 70), margin + inner - 76, y);
      pdf.setFontSize(8);
      pdf.setTextColor(87, 83, 78);
      pdf.text(clip(pdf, `Zone : ${displayZone(zone)}`, inner - 12), margin + 6, y + 14);
      pdf.text(
        `Dernier contrôle ${formatMaybeExcelDate(zone.dernierControle)}  ·  ${zone.statutMateriau || "statut non renseigné"}`,
        margin + 6,
        y + 26,
      );
      y += 50;
    });
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    chrome(pdf, page, pages);
  }
  const safe = (site.site || "site").replace(/[^\w\-]+/g, "-").slice(0, 40);
  pdf.save(`amiante-${safe}.pdf`);
}
