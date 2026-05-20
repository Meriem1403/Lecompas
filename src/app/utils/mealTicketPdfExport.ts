import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import JSZip from "jszip";
import {
  MealTicket,
  buildQrPayload,
  formatMonthLabel,
  formatTicketDate,
  resolveTicketMoneyEUR,
} from "./mealTicketRecord";
import { formatEuro } from "./mealSubsidyRecord";
import { pdfWriteLine } from "./pdfText";

function mealTicketStatusLabel(status: MealTicket["status"]): string {
  if (status === "active") return "Actif";
  if (status === "used") return "Utilise";
  return "Annule";
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_");
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.click();
  URL.revokeObjectURL(url);
}

export async function generateMealTicketPdfBlob(
  ticket: MealTicket,
  agentName: string,
): Promise<Blob> {
  const qrPayload = buildQrPayload(ticket);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "H",
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 18;
  let y = 0;

  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageW, 32, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Ticket repas", pageW / 2, 14, { align: "center" });
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("Le Compas — DIRMMED", pageW / 2, 22, { align: "center" });

  y = 42;
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  const title =
    ticket.mealIndex != null
      ? `Repas n°${ticket.mealIndex}`
      : `Ticket ${formatMonthLabel(ticket.month)}`;
  pdfWriteLine(pdf, title, margin, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdfWriteLine(pdf, `N° ${ticket.ticketNumber}`, margin, y);
  y += 10;

  pdf.setTextColor(30, 41, 59);
  const lines: [string, string][] = [
    ["Titulaire", agentName],
    ["Mois", formatMonthLabel(ticket.month)],
    ["Service", ticket.service],
    ["Domaine", ticket.domain || "—"],
    ["Lieu", ticket.location || "—"],
    ["Statut", mealTicketStatusLabel(ticket.status)],
  ];
  if (ticket.generatedAt) {
    lines.push(["Emis le", formatTicketDate(ticket.generatedAt)]);
  }
  if (ticket.status === "used" && ticket.usedAt) {
    let used = formatTicketDate(ticket.usedAt);
    if (ticket.usedByProviderName) {
      used += ` — ${ticket.usedByProviderName}`;
    }
    lines.push(["Valide le", used]);
  }
  const mv = resolveTicketMoneyEUR(ticket);
  if (mv.ticketAmountEUR > 0) {
    lines.push(["Montant du ticket", formatEuro(mv.ticketAmountEUR)]);
    if (mv.subsidyMinisterialEUR > 0) {
      lines.push(["Subvention ministerielle", formatEuro(mv.subsidyMinisterialEUR)]);
    }
    if (mv.subsidyInterministerialEUR > 0) {
      lines.push([
        "Subvention interministerielle",
        formatEuro(mv.subsidyInterministerialEUR),
      ]);
    }
    if (ticket.agentInm != null) {
      lines.push(["INM retenu", String(ticket.agentInm)]);
    }
  }

  for (const [label, value] of lines) {
    pdf.setFont("helvetica", "bold");
    pdfWriteLine(pdf, `${label} :`, margin, y);
    pdf.setFont("helvetica", "normal");
    pdfWriteLine(pdf, value, margin + 38, y);
    y += 6;
  }

  y += 4;
  const qrSize = 58;
  const qrX = (pageW - qrSize) / 2;
  pdf.addImage(qrDataUrl, "PNG", qrX, y, qrSize, qrSize);
  y += qrSize + 8;

  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    "Presentez ce QR code au prestataire. Un scan = un repas.",
    pageW / 2,
    y,
    { align: "center" },
  );

  const footerY = pdf.internal.pageSize.getHeight() - 12;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, footerY - 4, pageW - margin, footerY - 4);
  pdf.setFontSize(8);
  pdf.text(
    `Document genere le ${new Date().toLocaleString("fr-FR")}`,
    pageW / 2,
    footerY,
    { align: "center" },
  );

  return pdf.output("blob");
}

export function mealTicketPdfFilename(ticket: MealTicket): string {
  const suffix =
    ticket.mealIndex != null
      ? `repas-${ticket.mealIndex}`
      : safeFilenamePart(ticket.ticketNumber);
  return `ticket-${suffix}.pdf`;
}

export async function downloadMealTicketPdf(
  ticket: MealTicket,
  agentName: string,
): Promise<void> {
  const blob = await generateMealTicketPdfBlob(ticket, agentName);
  triggerBlobDownload(blob, mealTicketPdfFilename(ticket));
}

export async function downloadAgentMealTicketsMonthZip(
  tickets: MealTicket[],
  agentName: string,
  month: string,
): Promise<void> {
  if (tickets.length === 0) return;

  const zip = new JSZip();

  for (const ticket of tickets) {
    const blob = await generateMealTicketPdfBlob(ticket, agentName);
    zip.file(mealTicketPdfFilename(ticket), blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipName = `tickets-repas-${safeFilenamePart(month)}.zip`;
  triggerBlobDownload(zipBlob, zipName);
}
