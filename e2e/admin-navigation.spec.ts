import { expect, test } from "@playwright/test";
import { loginWithDemoAccount } from "./helpers/demoLogin";

test("admin : campagnes mercure et arrivées-départs", async ({ page }) => {
  await loginWithDemoAccount(page, "Administrateur");

  await page.goto("/mercure");
  await expect(
    page.getByRole("heading", { name: "Campagnes mercure" }),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto("/arrivees-departs");
  await expect(
    page.getByRole("heading", { name: "Arrivées et départs" }),
  ).toBeVisible({ timeout: 15_000 });
});
