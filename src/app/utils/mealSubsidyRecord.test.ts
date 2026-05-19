import { describe, expect, it } from "vitest";
import {
  getActivePeriodForMonth,
  getLastDayOfMonth,
  periodCoversMonth,
  repairMealSubsidyConfig,
} from "./mealSubsidyRecord";

const LOCATIONS = [
  { id: "2", name: "Site Lyon", regionCode: "13" },
  { id: "3", name: "Site Marseille", regionCode: "13" },
];

describe("mealSubsidyRecord périodes", () => {
  it("calcule le dernier jour de mai 2026", () => {
    expect(getLastDayOfMonth("2026-05")).toBe("2026-05-31");
  });

  it("trouve la période 2026 pour mai 2026 (config par défaut)", () => {
    const config = repairMealSubsidyConfig(
      {
        periods: [
          {
            id: "period-2026",
            label: "2026",
            validFrom: "2026-01-01",
            interministerialAmount: 1.62,
          },
        ],
        inmBrackets: [],
        ministerialRates: [],
      },
      LOCATIONS,
    );
    const period = getActivePeriodForMonth(config, "2026-05");
    expect(period).not.toBeNull();
    expect(period?.id).toBe("period-2026");
  });

  it("répare une config dont la seule période se termine en 2025", () => {
    const broken = {
      periods: [
        {
          id: "period-2025",
          label: "2025",
          validFrom: "2025-01-01",
          validTo: "2025-12-31",
          interministerialAmount: 1.5,
        },
      ],
      inmBrackets: [],
      ministerialRates: [
        {
          id: "min-2025-2",
          periodId: "period-2025",
          locationId: "2",
          locationName: "Site Lyon",
          amount: 3.4,
        },
      ],
    };
    const repaired = repairMealSubsidyConfig(broken, LOCATIONS);
    expect(periodCoversMonth(repaired.periods.find((p) => p.id === "period-2026")!, "2026-05")).toBe(
      true,
    );
    const period = getActivePeriodForMonth(repaired, "2026-05");
    expect(period?.id).toBe("period-2026");
  });
});
