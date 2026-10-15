import { expect, test } from "@playwright/test";

test("affiche l'écran de connexion", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Connexion" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Adresse email"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Mot de passe"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
});

