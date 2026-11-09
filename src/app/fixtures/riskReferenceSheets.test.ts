import { describe, expect, it } from "vitest";
import { RISK_REFERENCE_FIXTURES } from "./riskReferenceFixtures";
import { attachmentPreviewKind, displayRiskSheet } from "./riskReferenceSheets";

describe("displayRiskSheet", () => {
  it("donne un repère à chaque fiche du référentiel", () => {
    for (const reference of RISK_REFERENCE_FIXTURES) {
      const sheet = displayRiskSheet(reference);
      expect(sheet.description.length).toBeGreaterThan(20);
      expect(sheet.situations.length).toBeGreaterThan(20);
      expect(sheet.dommages.length).toBeGreaterThan(10);
      expect(sheet.prevention.length).toBeGreaterThan(20);
    }
  });

  it("laisse le texte saisi remplacer le repère", () => {
    const sheet = displayRiskSheet({
      numeroRisque: "23",
      description: "Consignes propres au service des phares.",
    });
    expect(sheet.description).toBe("Consignes propres au service des phares.");
    expect(sheet.prevention.length).toBeGreaterThan(20);
  });
});

describe("attachmentPreviewKind", () => {
  it("reconnaît un pdf et une image", () => {
    expect(attachmentPreviewKind("consigne.pdf", "application/pdf")).toBe("pdf");
    expect(attachmentPreviewKind("photo.PNG", "")).toBe("image");
    expect(attachmentPreviewKind("notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("none");
  });
});
