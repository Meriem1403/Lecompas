/** Normalise le texte pour jsPDF (évite undefined et certains caractères Unicode problématiques). */
export function sanitizePdfText(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/[\u2713\u2717\u2714]/g, (c) => (c === "\u2713" || c === "\u2714" ? "Oui" : "Non"))
    .replace(/\u00A0/g, " ");
}

export function pdfSplitLines(
  pdf: { splitTextToSize: (text: string, maxWidth: number) => string[] },
  text: unknown,
  maxWidth: number,
): string[] {
  const safe = sanitizePdfText(text);
  if (!safe) return [];
  return pdf.splitTextToSize(safe, maxWidth);
}

export function pdfWriteLine(
  pdf: { text: (text: string | string[], x: number, y: number, options?: object) => void },
  text: unknown,
  x: number,
  y: number,
  options?: object,
): void {
  const safe = sanitizePdfText(text);
  if (!safe) return;
  pdf.text(safe, x, y, options);
}

export function pdfWriteBlock(
  pdf: { splitTextToSize: (text: string, maxWidth: number) => string[]; text: (text: string, x: number, y: number) => void },
  text: unknown,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5,
): number {
  const lines = pdfSplitLines(pdf, text, maxWidth);
  lines.forEach((line) => {
    pdf.text(line, x, y);
    y += lineHeight;
  });
  return y;
}
