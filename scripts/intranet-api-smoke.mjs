#!/usr/bin/env node
/**
 * Smoke test API intranet (PostgreSQL + backend Express).
 * Prérequis : `docker compose up -d db backend` puis wait-for-backend.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const API_BASE =
  process.env.API_BASE || "http://127.0.0.1:8000/make-server-cfb78916";

const appDataSrc = readFileSync(
  join(root, "src/app/services/appDataApi.ts"),
  "utf8",
);
const appDataBlock =
  appDataSrc.match(/export const APP_DATA_KEYS = \{([\s\S]*?)\} as const/)?.[1] ??
  "";
const APP_DATA_KEYS = [
  ...appDataBlock.matchAll(/:\s+"([^"]+)"/g),
].map((m) => m[1]);

function extractRegistryKeys() {
  const src = readFileSync(join(root, "backend/server.js"), "utf8");
  const start = src.indexOf("const APP_DATA_REGISTRY = {");
  if (start < 0) throw new Error("APP_DATA_REGISTRY introuvable");
  const end = src.indexOf("\n};", start);
  const block = src.slice(start, end);
  return [...block.matchAll(/^  (\w+):/gm)].map((m) => m[1]);
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { res, json };
}

async function login(email, password) {
  const { res, json } = await api("/login", {
    method: "POST",
    body: { email, password },
  });
  if (!res.ok) {
    throw new Error(`Login ${email}: ${res.status} ${JSON.stringify(json)}`);
  }
  if (!json?.access_token || String(json.access_token).startsWith("token-")) {
    throw new Error(`Jeton API invalide pour ${email}`);
  }
  return json.access_token;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const registryKeys = extractRegistryKeys().sort();
  const frontKeys = [...APP_DATA_KEYS].sort();
  assert(
    registryKeys.join(",") === frontKeys.join(","),
    `Clés app-data désalignées.\nFront: ${frontKeys.join(", ")}\nBack:  ${registryKeys.join(", ")}`,
  );
  console.log(`✓ ${frontKeys.length} clés app-data alignées front/back`);

  const { res: healthRes, json: health } = await api("/health");
  assert(healthRes.ok && health?.status === "ok", "Health KO");

  const adminToken = await login("admin@dirm-med.gouv.fr", "change-me");
  const agentToken = await login("agent@dirm-med.gouv.fr", "agent123");

  for (const role of ["admin", "agent"]) {
    const token = role === "admin" ? adminToken : agentToken;
    const { res, json } = await api("/profile", { token });
    assert(res.ok && json?.user?.email, `/profile ${role}`);
  }

  for (const collection of [
    "risks",
    "actions",
    "accidents",
    "notifications",
    "action-returns",
  ]) {
    const { res } = await api(`/${collection}`, { token: adminToken });
    assert(res.ok, `GET /${collection}`);
  }

  const { res: usersRes } = await api("/users", { token: adminToken });
  assert(usersRes.ok, "GET /users (admin)");

  const marker = `smoke-${Date.now()}`;
  const at = new Date().toISOString();

  function smokeValueForKey(key) {
    switch (key) {
      case "organization":
        return {
          services: [
            {
              id: "smoke-service",
              name: `Service ${marker}`,
              code: "SMK",
              description: "Test intranet",
              manager: "Smoke",
              domains: [],
              locations: [],
            },
          ],
          domains: [],
          locations: [],
          categories: [{ id: "smoke-cat", name: marker }],
        };
      case "accessProfiles":
      case "notificationPreferencesByUser":
        return { __smokeMarker: marker, __smokeAt: at };
      case "securitySheets":
      case "riskReferences":
      case "awarenessRecords":
      case "suppressedAwarenessKeys":
      case "safetyProtocols":
      case "deletedProtocols":
      case "preventionPlans":
      case "papripactSignatures":
      case "registreBenignAccidents":
      case "documentsLibrary":
      case "archivesLibrary":
      case "actualites":
      case "cerbereApplications":
      case "cerbereRequests":
      case "medicalVisits":
      case "sstRegistryRemarks":
      case "adminRoles":
      case "mercuryCampaigns":
      case "asbestosInterventions":
      case "asbestosAttestations":
      case "asbestosDeclarations":
      case "rhArriveesDepartsDemandes":
      case "rhArriveesDepartsQuestionnaires":
      case "resourceReservations":
      case "asbestosSuiviRegister":
      case "asbestosSitesDta":
        return [{ id: `smoke-${key}`, __smokeMarker: marker, __smokeAt: at }];
      case "accidentSuiviIndicateurs":
        return { __smokeMarker: marker, __smokeAt: at, byYear: [], byCauseYear: [] };
      case "papripactProgram":
        return { __smokeMarker: marker, __smokeAt: at, year: 2026, actionCount: 0 };
      default:
        return { __smokeMarker: marker, __smokeAt: at, key };
    }
  }

  function valueContainsMarker(value, markerText) {
    return JSON.stringify(value ?? null).includes(markerText);
  }

  for (const key of APP_DATA_KEYS) {
    const payload = smokeValueForKey(key);
    const put = await api(`/app-data/${key}`, {
      method: "PUT",
      token: adminToken,
      body: { value: payload },
    });
    assert(put.res.ok, `PUT /app-data/${key}`);

    const get = await api(`/app-data/${key}`, { token: agentToken });
    assert(
      get.res.ok && valueContainsMarker(get.json?.value, marker),
      `GET /app-data/${key}`,
    );
  }

  const riskId = `smoke-risk-${Date.now()}`;
  const createRisk = await api("/risks", {
    method: "POST",
    token: adminToken,
    body: {
      id: riskId,
      title: "Risque smoke intranet",
      description: "test",
      category: "test",
      level: "faible",
      status: "actif",
      service: "Maintenance",
    },
  });
  assert(createRisk.res.ok, "POST /risks");

  const listAdmin = await api("/risks", { token: adminToken });
  assert(
    listAdmin.res.ok &&
      listAdmin.json?.risks?.some((r) => r.id === riskId),
    "Risque visible (admin)",
  );

  const listAgent = await api("/risks", { token: agentToken });
  assert(
    listAgent.res.ok &&
      listAgent.json?.risks?.some((r) => r.id === riskId),
    "Risque visible (agent, périmètre service)",
  );

  const badKey = await api("/app-data/__unknown__", { token: adminToken });
  assert(badKey.res.status === 400, "Clé app-data inconnue → 400");

  console.log("✓ Smoke API intranet OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
