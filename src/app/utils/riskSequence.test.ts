import { describe, expect, it } from "vitest";
import { closeRiskNumberGap, denseRiskNumbers, nextRiskNumber } from "./riskSequence";

describe("nextRiskNumber", () => {
  it("commence à 1 quand la liste est vide", () => {
    expect(nextRiskNumber([])).toBe("1");
  });

  it("prend la suite du plus grand numéro", () => {
    expect(nextRiskNumber(["12", "48", "7"])).toBe("49");
  });

  it("ignore les numéros qui ne sont pas une suite entière", () => {
    expect(nextRiskNumber(["RISK-2026-048", "15"])).toBe("16");
  });
});

describe("denseRiskNumbers", () => {
  it("resserre la suite après un trou", () => {
    const numbers = denseRiskNumbers([
      { id: "a", numero: "1" },
      { id: "b", numero: "45" },
      { id: "c", numero: "48" },
      { id: "d", numero: "49" },
    ]);

    expect([...numbers.values()]).toEqual(["1", "2", "3", "4"]);
  });
});

describe("closeRiskNumberGap", () => {
  it("décale les numéros qui suivent un numéro unique supprimé", () => {
    const risks = [
      { id: "a", numeroRisque: "1" },
      { id: "b", numeroRisque: "2" },
      { id: "c", numeroRisque: "3" },
      { id: "d", numeroRisque: "4" },
    ];

    expect(closeRiskNumberGap(risks, "b").map((risk) => risk.numeroRisque)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("laisse les numéros partagés du référentiel en place", () => {
    const risks = [
      { id: "a", numeroRisque: "34" },
      { id: "b", numeroRisque: "34" },
      { id: "c", numeroRisque: "38" },
    ];

    expect(closeRiskNumberGap(risks, "a").map((risk) => `${risk.id}:${risk.numeroRisque}`)).toEqual([
      "b:34",
      "c:38",
    ]);
  });
});
