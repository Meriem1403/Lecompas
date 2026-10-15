import { describe, expect, it } from "vitest";
import { normalizeOrganizationSnapshot } from "@/app/utils/normalizeOrganizationSnapshot";

const fallback = {
  services: [
    {
      id: "1",
      name: "A",
      code: "A",
      description: "",
      manager: "",
      domains: [] as string[],
      locations: [] as string[],
    },
  ],
  domains: [],
  locations: [],
  categories: [{ id: "c1", name: "Cat" }],
};

describe("normalizeOrganizationSnapshot", () => {
  it("conserve un snapshot valide", () => {
    expect(normalizeOrganizationSnapshot(fallback, fallback)).toEqual(fallback);
  });

  it("retombe sur le défaut si données smoke invalides", () => {
    expect(
      normalizeOrganizationSnapshot({ marker: "bad" }, fallback),
    ).toEqual(fallback);
  });
});
