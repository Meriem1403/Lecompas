import { expect, type Page } from "@playwright/test";

const API_BASE =
  process.env.PLAYWRIGHT_API_BASE ||
  "http://127.0.0.1:8000/make-server-cfb78916";

export async function loginWithApiCredentials(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("checkbox", { name: "Se souvenir de moi" }).check();
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/accueil\/?$/, { timeout: 25_000 });
  await expect(
    page.getByRole("heading", { name: "Choisissez une catégorie" }),
  ).toBeVisible({ timeout: 15_000 });

  const token = await page.evaluate(() =>
    localStorage.getItem("duerp_token"),
  );
  expect(token).toBeTruthy();
  expect(token).not.toMatch(/^token-/);
  return token!;
}

export { API_BASE };
