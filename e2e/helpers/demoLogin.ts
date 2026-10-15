import { expect, type Page } from "@playwright/test";

export type DemoRoleLabel = "Administrateur" | "Chef de service" | "Agent";

export async function loginWithDemoAccount(
  page: Page,
  roleLabel: DemoRoleLabel,
) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Connexion" }),
  ).toBeVisible();

  await page
    .getByRole("button")
    .filter({ hasText: roleLabel })
    .click();

  await page.waitForURL(/\/accueil\/?$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "Choisissez une catégorie" }),
  ).toBeVisible({ timeout: 10_000 });
}
