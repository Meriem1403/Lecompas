import { expect, test } from "@playwright/test";
import { API_BASE, loginWithApiCredentials } from "../helpers/apiLogin";

const E2E_TITRE = "Campagne E2E persistance intranet";

test("mercure : données /app-data visibles après rechargement", async ({
  page,
}) => {
  const token = await loginWithApiCredentials(
    page,
    "admin@dirm-med.gouv.fr",
    "change-me",
  );

  const campaign = {
    id: `e2e-mercury-${Date.now()}`,
    reference: "MERC-E2E-001",
    titre: E2E_TITRE,
    statut: "planifiee",
    programme: "Programme test E2E",
    zones: ["Zone test"],
    datePrevue: "2026-06-01",
    typesPrelevements: [],
    prestataire: "Labo test",
    contactPrestataire: "contact@test.fr",
    objectifs: "Validation persistance",
    createdBy: "e2e",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const put = await page.request.put(`${API_BASE}/app-data/mercuryCampaigns`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: { value: [campaign] },
  });
  expect(put.ok()).toBeTruthy();

  await page.goto("/mercure");
  await expect(page.getByText(E2E_TITRE)).toBeVisible({ timeout: 20_000 });

  await page.reload();
  await expect(page.getByText(E2E_TITRE)).toBeVisible({ timeout: 20_000 });
});
