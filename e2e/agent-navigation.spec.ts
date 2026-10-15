import { expect, test } from "@playwright/test";
import { loginWithDemoAccount } from "./helpers/demoLogin";

test("agent : accueil, actualités et registre SST", async ({ page }) => {
  await loginWithDemoAccount(page, "Agent");

  await page.goto("/actualites");
  await expect(
    page.getByRole("heading", { name: "Actualités et notifications" }),
  ).toBeVisible({
    timeout: 15_000,
  });

  await page.goto("/registre-sst");
  await expect(page.getByRole("heading", { name: "Registre SST" })).toBeVisible({
    timeout: 15_000,
  });
});
