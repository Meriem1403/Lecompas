import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { Document } from "@/app/components/DocumentsView";
import { downloadDuerpTableExcel } from "@/app/utils/duerpTableExport";
import type { Risk } from "@/app/components/admin/RisksManagementView";

export function readLibraryFile(file: File) {
  const limit = 10 * 1024 * 1024;
  if (file.size > limit) return Promise.reject(new Error("size"));
  return new Promise<{ fileName: string; fileDataUrl: string; fileSize: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      fileName: file.name,
      fileDataUrl: String(reader.result || ""),
      fileSize: file.size,
    });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function safeName(value: string) {
  return value.replace(/[^\w.-]+/g, "_").slice(0, 80) || "document";
}

export function downloadStoredFile(document: Document) {
  if (!document.fileDataUrl) return false;
  const link = window.document.createElement("a");
  link.href = document.fileDataUrl;
  link.download = document.fileName || `${safeName(document.title)}.pdf`;
  link.click();
  return true;
}

export function downloadDocumentPdf(document: Document) {
  if (document.fileDataUrl?.startsWith("data:application/pdf")) {
    downloadStoredFile(document);
    return;
  }
  const pdf = new jsPDF();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  const title = pdf.splitTextToSize(document.title, 170);
  pdf.text(title, 20, 24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  let y = 24 + title.length * 8 + 6;
  const lines = [
    `Type : ${document.type}`,
    `Statut : ${document.status}`,
    `Version : ${document.version}`,
    `Auteur : ${document.createdBy}`,
    `Fichier : ${document.fileName || "Aucun"}`,
    "",
    ...pdf.splitTextToSize(document.description || "", 170),
  ];
  lines.forEach((line) => {
    pdf.text(String(line), 20, y);
    y += 7;
  });
  pdf.save(`${safeName(document.title)}.pdf`);
}

export function downloadDocumentExcel(document: Document) {
  if (document.riskRows?.length) {
    downloadDuerpTableExcel(document.riskRows, document.version || "document");
    return;
  }
  const sheet = XLSX.utils.json_to_sheet([
    {
      Titre: document.title,
      Type: document.type,
      Statut: document.status,
      Version: document.version,
      Auteur: document.createdBy,
      Creation: document.createdAt,
      MiseAJour: document.updatedAt,
      Fichier: document.fileName || "",
      Directeur: document.directorName || "",
      Description: document.description,
    },
  ]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Document");
  XLSX.writeFile(book, `${safeName(document.title)}.xlsx`);
}

export function downloadDuerpExcel(risks: Risk[], version: string) {
  const rows = risks.map((risk) => ({
    Numero: risk.numeroRisque,
    Titre: risk.detachedFromReference ? "Lié à aucun risque" : risk.title,
    Service: risk.service,
    Domaine: risk.domain || risk.unite,
    Lieu: risk.site,
    Responsable: risk.responsable,
    Gravite: risk.severity,
    Frequence: risk.probability,
    GFM: risk.riskLevel,
    Situation: risk.situation,
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "DUERP");
  XLSX.writeFile(book, `DUERP_${safeName(version)}.xlsx`);
}

const LIBRARY_KEY = "lecompas_documents_library_v1";
const SAVED_SIGNATURE_KEY = "lecompas_director_signature_v1";
let memoryLibrary: Document[] | null = null;

export function loadDocumentLibrary(): Document[] | null {
  if (memoryLibrary) return memoryLibrary;
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Document[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDocumentLibrary(documents: Document[]) {
  memoryLibrary = documents;
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(documents));
  } catch {
    // Le navigateur peut refuser un PDF trop volumineux. La session en cours garde les documents.
  }
}

export function loadSavedSignature() {
  return localStorage.getItem(SAVED_SIGNATURE_KEY) || "";
}

export function saveSavedSignature(dataUrl: string) {
  localStorage.setItem(SAVED_SIGNATURE_KEY, dataUrl);
}
