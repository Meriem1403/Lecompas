/**
 * Pousse les JSON générés par import-excel-data.mjs vers l'API intranet (prod / NAS).
 *
 * Prérequis: node scripts/import-excel-data.mjs
 * Env: INTRANET_API_BASE, INTRANET_ADMIN_EMAIL, INTRANET_ADMIN_PASSWORD
 *
 * Usage: node scripts/seed-imported-prod.mjs
 * Options: --force  écrase app-data même si déjà rempli
 *          --risks-only | --accidents-only | --app-data-only | --papripact-only
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SEED_DIR = path.join(ROOT, "src/app/seeds/imported");

const API_BASE = (
  process.env.INTRANET_API_BASE || "http://127.0.0.1:8000/make-server-cfb78916"
).replace(/\/$/, "");

const ADMIN_EMAIL =
  process.env.INTRANET_ADMIN_EMAIL || "admin@dirm-med.gouv.fr";
const ADMIN_PASSWORD = process.env.INTRANET_ADMIN_PASSWORD || "admin123";

const args = new Set(process.argv.slice(2));
const force = args.has("--force");

function readJson(name) {
  const p = path.join(SEED_DIR, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Fichier manquant: ${p} — lancez node scripts/import-excel-data.mjs`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function api(pathSuffix, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${pathSuffix}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { res, json };
}

async function login() {
  const { res, json } = await api("/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!res.ok) throw new Error(`Login échoué: ${res.status} ${JSON.stringify(json)}`);
  return json.token;
}

async function getAppData(key, token) {
  const { res, json } = await api(`/app-data/${key}`, { token });
  if (!res.ok) return null;
  return json?.value ?? null;
}

async function putAppData(key, value, token) {
  const { res, json } = await api(`/app-data/${key}`, {
    method: "PUT",
    token,
    body: { value },
  });
  if (!res.ok) throw new Error(`PUT app-data/${key}: ${res.status} ${JSON.stringify(json)}`);
}

async function seedAppData(token, { keysFilter = null } = {}) {
  const register = readJson("asbestos-register.json");
  const sitesDta = readJson("asbestos-sites-dta.json");
  const indicateurs = readJson("accident-indicators.json");

  let papripactProgram = null;
  try {
    papripactProgram = readJson("papripact-program.json");
  } catch {
    /* optional */
  }

  let pairs = [
    ["asbestosSuiviRegister", register],
    ["asbestosSitesDta", sitesDta],
    ["accidentSuiviIndicateurs", indicateurs],
    ...(papripactProgram ? [["papripactProgram", papripactProgram]] : []),
  ];
  if (keysFilter) {
    pairs = pairs.filter(([key]) => keysFilter.includes(key));
  }

  for (const [key, value] of pairs) {
    const existing = await getAppData(key, token);
    const empty =
      existing === null ||
      existing === undefined ||
      (Array.isArray(existing) && existing.length === 0) ||
      (typeof existing === "object" &&
        !Array.isArray(existing) &&
        Object.keys(existing).length === 0);
    if (!empty && !force) {
      console.log(`⏭  app-data/${key} déjà présent (utilisez --force)`);
      continue;
    }
    await putAppData(key, value, token);
    console.log(`✓ app-data/${key} (${Array.isArray(value) ? value.length + " lignes" : "document"})`);
  }
}

async function seedRisks(token) {
  const risks = readJson("duerp-risks.json");
  const { json: listJson } = await api("/risks", { token });
  const existing = listJson?.risks?.length ?? 0;
  if (existing > 50 && !force) {
    console.log(`⏭  /risks: ${existing} déjà en base (--force pour réimporter)`);
    return;
  }
  let ok = 0;
  for (const risk of risks) {
    const { res } = await api("/risks", { method: "POST", token, body: risk });
    if (res.ok) ok += 1;
  }
  console.log(`✓ /risks: ${ok}/${risks.length} créés`);
}

async function seedAccidents(token) {
  const accidents = readJson("accidents-declaratif.json");
  const { json: listJson } = await api("/accidents", { token });
  const existing = listJson?.accidents?.length ?? 0;
  if (existing > 10 && !force) {
    console.log(`⏭  /accidents: ${existing} déjà en base (--force pour réimporter)`);
    return;
  }
  let ok = 0;
  for (const acc of accidents) {
    const { res } = await api("/accidents", { method: "POST", token, body: acc });
    if (res.ok) ok += 1;
  }
  console.log(`✓ /accidents: ${ok}/${accidents.length} créés (victimes anonymisées)`);
}

async function seedPapripactActions(token) {
  const actions = readJson("papripact-actions.json");
  const { json: listJson } = await api("/actions", { token });
  const existing = listJson?.actions ?? [];
  const year = actions[0]?.papripactYear ?? 2026;
  const hasPapripact = existing.some((a) => a.papripactYear === year);
  if (hasPapripact && !force) {
    console.log(
      `⏭  /actions: PAPRIPACT ${year} déjà présent (--force pour réimporter)`,
    );
    return;
  }
  let ok = 0;
  for (const action of actions) {
    const { res } = await api("/actions", {
      method: "POST",
      token,
      body: action,
    });
    if (res.ok) ok += 1;
  }
  console.log(`✓ /actions PAPRIPACT: ${ok}/${actions.length} créées`);
}

async function main() {
  const token = await login();
  console.log(`API: ${API_BASE}`);

  const all =
    !args.has("--risks-only") &&
    !args.has("--accidents-only") &&
    !args.has("--app-data-only") &&
    !args.has("--papripact-only");

  if (all || args.has("--app-data-only")) await seedAppData(token);
  if (args.has("--papripact-only")) {
    await seedAppData(token, { keysFilter: ["papripactProgram"] });
    await seedPapripactActions(token);
  } else if (all) {
    await seedAppData(token);
    await seedPapripactActions(token);
  }
  if (all || args.has("--risks-only")) await seedRisks(token);
  if (all || args.has("--accidents-only")) await seedAccidents(token);

  console.log("Seed terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
