import { describe, expect, it } from "vitest";
import { demandeProgress, piecesForKind } from "./subsidyAccounting";

describe("avancement d'une demande", () => {
  it("compte les pièces déposées et ignore une pièce refusée", () => {
    const pieces = piecesForKind("avance");
    pieces[0] = { ...pieces[0], files: [{ id: "a", name: "rib.pdf", dataUrl: "x" }] };
    pieces[1] = { ...pieces[1], files: [{ id: "b", name: "kbis.pdf", dataUrl: "x" }], review: "refuse" };
    const progress = demandeProgress({ kind: "avance", pieces });
    expect(progress.total).toBe(4);
    expect(progress.deposited).toBe(2);
    expect(progress.refused).toBe(1);
    expect(progress.ready).toBe(1);
    expect(progress.percent).toBe(25);
  });
});