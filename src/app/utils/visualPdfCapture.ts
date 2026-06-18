import html2canvas from "html2canvas";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDomPaint(): Promise<void> {
  await sleep(0);
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  await sleep(220);
}

/** Capture un nœud DOM hors écran et génère un PDF multipage (format A4). */
export async function captureElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<boolean> {
  try {
    const { jsPDF } = await import("jspdf");
    await waitForDomPaint();

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#f8fafc",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(filename);
    return true;
  } catch {
    return false;
  }
}

export async function renderReactToPdf(
  render: (mount: HTMLElement) => { unmount: () => void },
  filename: string,
  widthPx = 794,
): Promise<boolean> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.zIndex = "-10";
  host.style.pointerEvents = "none";
  host.style.width = `${widthPx}px`;
  host.style.maxWidth = `${widthPx}px`;
  host.style.backgroundColor = "#f1f5f9";
  host.style.padding = "12px";
  host.style.boxSizing = "border-box";

  const mount = document.createElement("div");
  host.appendChild(mount);
  document.body.appendChild(host);

  const { unmount } = render(mount);

  try {
    return await captureElementToPdf(host, filename);
  } finally {
    unmount();
    host.remove();
  }
}
