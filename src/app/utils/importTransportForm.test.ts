import { describe, expect, it } from "vitest";
import { parseSubscriptionLines } from "./importTransportForm";

describe("parseSubscriptionLines", () => {
  it("lit un titre ZOU mensuel", () => {
    const parsed = parseSubscriptionLines([
      "MON ABONNEMENT",
      "ZAHZOUH",
      "MERIEM",
      "22/01/1998",
      "REF : PX612354",
      "DE :",
      "AUBAGNE",
      "À :",
      "MARSEILLE SAINT-CHARLES",
      "MENSUEL ZOU!",
      "Utilisable du 09/10/2026 au 08/11/2026",
      "38,90 €",
    ]);

    expect(parsed).toMatchObject({
      nom: "ZAHZOUH",
      prenom: "Meriem",
      domicileArret: "AUBAGNE",
      domicileCommune: "Aubagne",
      travailArret: "MARSEILLE SAINT-CHARLES",
      travailCommune: "Marseille",
      abonnementMensuel: true,
      periodeMoisDebut: "octobre",
      periodeAnneeDebut: "2026",
      periodeMoisFin: "novembre",
      periodeAnneeFin: "2026",
      montantHorsIleDeFrance: "38,90",
    });
  });
});
