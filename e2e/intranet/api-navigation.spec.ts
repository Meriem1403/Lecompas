import { expect, test } from "@playwright/test";
import { API_BASE, loginWithApiCredentials } from "../helpers/apiLogin";

test.describe("intranet API — navigation", () => {
  test("admin : login API, modules environnement et RH", async ({ page }) => {
    const token = await loginWithApiCredentials(
      page,
      "admin@dirm-med.gouv.fr",
      "change-me",
    );

    await page.goto("/mercure");
    await expect(
      page.getByRole("heading", { name: "Campagnes mercure" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/arrivees-departs");
    await expect(
      page.getByRole("heading", { name: "Arrivées et départs" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/amiante/declarations");
    await expect(
      page.getByRole("heading", {
        name: "Déclarations d'Exposition Amiante",
      }),
    ).toBeVisible({ timeout: 20_000 });

    const profile = await page.request.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profile.ok()).toBeTruthy();
  });

  test("agent : login API, actualités et registre SST", async ({ page }) => {
    await loginWithApiCredentials(page, "agent@dirm-med.gouv.fr", "agent123");

    await page.goto("/actualites");
    await expect(
      page.getByRole("heading", { name: "Actualités et notifications" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/registre-sst");
    await expect(
      page.getByRole("heading", { name: "Registre SST" }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
