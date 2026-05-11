/** Fichier joint (compte rendu de visite médicale, PDF, scan, etc.) */
export interface MedicalVisitReportFile {
  name: string;
  dataUrl?: string;
  mimeType?: string;
}

export function openVisitReportInNewTab(doc: MedicalVisitReportFile) {
  if (!doc.dataUrl) {
    throw new Error("No file data");
  }
  const [meta, base64] = doc.dataUrl.split(",");
  if (!meta || !base64) throw new Error("Invalid data URL");
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mimeType = doc.mimeType || mimeMatch?.[1] || "application/octet-stream";
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  const blob = new Blob([buffer], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Popup blocked");
  }
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}

export function downloadVisitReportFile(doc: MedicalVisitReportFile) {
  if (!doc.dataUrl) {
    throw new Error("No file data");
  }
  const [meta, base64] = doc.dataUrl.split(",");
  if (!meta || !base64) throw new Error("Invalid data URL");
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mimeType = doc.mimeType || mimeMatch?.[1] || "application/octet-stream";
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  const blob = new Blob([buffer], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = doc.name || "compte-rendu-visite-medicale.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function readFileAsVisitReport(file: File): Promise<MedicalVisitReportFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name.trim(),
        dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        mimeType: file.type || undefined,
      });
    reader.onerror = () =>
      resolve({
        name: file.name.trim(),
        mimeType: file.type || undefined,
      });
    reader.readAsDataURL(file);
  });
}
