import { describe, expect, it } from "vitest";
import {
  countOfficialDuerpRisks,
  loadImportedDuerpRisks,
  shouldInstallOfficialDuerpBase,
} from "./duerpRiskBase";

const expected = 478;

describe("shouldInstallOfficialDuerpBase", () => {
  it("remplace une base courte sans identifiant du classeur", () => {
    const demo = Array.from({ length: 49 }, (_, index) => ({ id: `demo-${index}` }));
    expect(countOfficialDuerpRisks(demo)).toBe(0);
    expect(shouldInstallOfficialDuerpBase(demo, expected)).toBe(true);
  });

  it("laisse la base du classeur déjà complète", () => {
    const official = Array.from({ length: expected }, (_, index) => ({
      id: `duerp-import-${index}`,
    }));
    expect(shouldInstallOfficialDuerpBase(official, expected)).toBe(false);
  });

  it("ne réinstalle pas pour quelques suppressions", () => {
    const almost = Array.from({ length: expected - 5 }, (_, index) => ({
      id: `duerp-import-${index}`,
    }));
    expect(shouldInstallOfficialDuerpBase(almost, expected)).toBe(false);
  });

  it("charge les 478 lignes du classeur", async () => {
    const imported = await loadImportedDuerpRisks();
    expect(imported).toHaveLength(478);
    expect(imported.every((risk) => risk.id.startsWith("duerp-import-"))).toBe(true);
  });

  it("reprend un import interrompu", () => {
    const partial = Array.from({ length: 200 }, (_, index) => ({
      id: `duerp-import-${index}`,
    }));
    expect(shouldInstallOfficialDuerpBase(partial, expected)).toBe(true);
  });
});
