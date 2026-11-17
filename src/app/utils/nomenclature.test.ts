import { describe, expect, it } from "vitest";
import { entryByCode, hasAccount, searchNomenclature, subsidyMatches, subsidyRouteCodes, subsidySenses } from "./nomenclature";

describe("nomenclature subventions", () => {
  it("retrouve la charge de service public d'une association", () => {
    const match = subsidyMatches("csp", "association", "")[0];
    expect(match.entry.code).toBe("16.02.01");
    expect(match.entry.pce).toBe("6312000000");
    expect(hasAccount(match.entry)).toBe(true);
  });

  it("distingue le transfert direct et le transfert indirect", () => {
    expect(subsidySenses("transfert", "region")).toEqual(["direct", "indirect"]);
    expect(subsidyMatches("transfert", "region", "direct")[0].entry.code).toBe("10.01.01");
    expect(subsidyMatches("transfert", "region", "indirect")[0].entry.code).toBe("11.01.01");
  });

  it("pointe chaque parcours vers un GM du référentiel", () => {
    for (const code of subsidyRouteCodes()) {
      expect(entryByCode(code), code).not.toBeNull();
    }
  });
});

describe("recherche nomenclature", () => {
  it("trouve l'électricité courante et laisse de côté les anciens GM", () => {
    const found = searchNomenclature("electricite");
    expect(found[0]?.code).toBe("32.01.02");
    expect(found.some((entry) => entry.legacy)).toBe(false);
  });

  it("retrouve un ancien GM quand la recherche le demande", () => {
    const found = searchNomenclature("ex-ai expedition");
    expect(found[0]?.legacy).toBe(true);
    expect(found[0]?.code).toBe("01.01.01");
  });

  it("retrouve un compte PCE", () => {
    const found = searchNomenclature("6312000000");
    expect(found[0]?.code).toBe("16.02.01");
  });

  it("parcourt un domaine sans texte et respecte le compte technique", () => {
    const found = searchNomenclature("", { domain: "34", segment: "34.01", account: "technique" });
    expect(found.length).toBeGreaterThan(1);
    expect(found.every((entry) => entry.domain === "34" && entry.segment === "34.01" && entry.pce === "TECHNIQUE")).toBe(true);
  });
});
