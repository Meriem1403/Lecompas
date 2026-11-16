import { jsPDF } from "jspdf";
import type { Document } from "@/app/components/DocumentsView";

function examplePdf(title: string, lines: string[]) {
  const pdf = new jsPDF();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, 20, 28);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  lines.forEach((line, index) => {
    pdf.text(line, 20, 44 + index * 8);
  });
  pdf.setFontSize(9);
  pdf.text("Exemple de la bibliothèque Documents SST, DIRM Méditerranée.", 20, 120);
  return pdf.output("datauristring") as string;
}

let cache: Document[] | null = null;

export function getDocumentLibraryFixtures(): Document[] {
  if (cache) return cache;
  const duerpPdf = examplePdf("DUERP 2026, version à signer", [
    "Extrait arrêté pour la signature du directeur.",
    "Ce fichier est un exemple, pour voir la visionneuse et le téléchargement.",
  ]);
  const procedurePdf = examplePdf("Procédure d'accueil des entreprises extérieures", [
    "Accueil, consignes de site et plan de prévention.",
    "Document d'exemple, sans valeur réglementaire.",
  ]);
  const compteRenduPdf = examplePdf("Compte-rendu CSSCT, mars 2026", [
    "Points examinés : accidents, formations, mises à jour du DUERP.",
    "Document d'exemple.",
  ]);
  cache = [
    {
      id: "fixture-duerp-2026",
      title: "DUERP 2026, version à signer",
      description: "Exemple d'une version figée, destinée à la signature du directeur.",
      type: "DUERP",
      version: "2026.1",
      status: "Envoyé pour signature",
      createdBy: "Prévention",
      createdAt: "2026-03-12",
      updatedAt: "2026-03-12",
      fileName: "DUERP_2026_a_signer.pdf",
      fileDataUrl: duerpPdf,
      fileSize: Math.round((duerpPdf.length * 3) / 4),
      purpose: "signature",
      editionKind: "instantanee",
      editionYear: 2026,
      snapshotAt: "2026-03-12",
      directorName: "Directeur Interrégional",
      badgeColor: "indigo",
      tags: ["exemple", "signature"],
      tagColors: { exemple: "ambre", signature: "indigo" },
      fixture: true,
    },
    {
      id: "fixture-procedure-accueil",
      title: "Procédure d'accueil des entreprises extérieures",
      description: "Exemple de procédure rangée dans la bibliothèque, avec un PDF joint.",
      type: "Procédure",
      version: "2.0",
      status: "Validé",
      createdBy: "Prévention",
      createdAt: "2026-02-02",
      updatedAt: "2026-02-18",
      fileName: "Procedure_accueil.pdf",
      fileDataUrl: procedurePdf,
      fileSize: Math.round((procedurePdf.length * 3) / 4),
      purpose: "bibliotheque",
      badgeColor: "emeraude",
      tags: ["exemple", "accueil"],
      tagColors: { exemple: "ambre", accueil: "ciel" },
      fixture: true,
    },
    {
      id: "fixture-cssct-2026",
      title: "Compte-rendu CSSCT, mars 2026",
      description: "Exemple de compte-rendu consultable dans la visionneuse.",
      type: "Compte-rendu",
      version: "1.0",
      status: "Validé",
      createdBy: "Secrétariat CSSCT",
      createdAt: "2026-03-20",
      updatedAt: "2026-03-21",
      fileName: "CR_CSSCT_mars_2026.pdf",
      fileDataUrl: compteRenduPdf,
      fileSize: Math.round((compteRenduPdf.length * 3) / 4),
      purpose: "bibliotheque",
      badgeColor: "ambre",
      tags: ["exemple", "cssct"],
      tagColors: { exemple: "ambre", cssct: "rose" },
      fixture: true,
    },
  ];
  return cache;
}
