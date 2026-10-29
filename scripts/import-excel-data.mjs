/**
 * Lit data/*.xlsx et génère src/app/seeds/imported/*.json
 * Usage: node scripts/import-excel-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "src/app/seeds/imported");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function cellStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && v > 40000 && v < 60000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  return String(v).replace(/\r\n/g, "\n").trim();
}

function slugId(prefix, index) {
  return `${prefix}-${index}`;
}

function importDuerpRisks() {
  const wb = XLSX.readFile(path.join(DATA_DIR, "MAJ DUERP.xlsx"));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const now = new Date().toISOString();
  const risks = [];
  let idx = 0;
  for (const row of rows) {
    const numero = cellStr(row["Numéro risque"] ?? row["Numero risque"]);
    const title = cellStr(row["Risque "] ?? row["Risque"]);
    if (!numero && !title) continue;
    idx += 1;
    const etat = cellStr(row["Etat d'avancement"] || "a_traiter");
    const statusMap = {
      "À traiter": "a_traiter",
      "A traiter": "a_traiter",
      "En traitement": "en_traitement",
      "Maîtrisé": "maitrise",
      Maitrise: "maitrise",
      Supprimé: "supprime",
    };
    const mesureRaw = cellStr(row["Mesures A proposer"]);
    risks.push({
      id: `duerp-import-${numero || idx}`,
      numeroRisque: numero || String(idx),
      title: title || `Risque ${numero}`,
      unite: cellStr(row["Unité "] ?? row["Unité"]),
      service: cellStr(row["Service"]),
      site: cellStr(row["Site"]),
      situation: cellStr(row["Situation dangereuse"]),
      associatedRisk: cellStr(row["Dommage"]),
      category: cellStr(row["Service"]) || "DUERP",
      responsable: cellStr(row["Responsable"]),
      severity: Number(row["Gravité"]) || 1,
      probability: Number(row["Fréquence"]) || 1,
      riskLevel: Number(row["Priorité initiale"]) || 1,
      existingMeasures: cellStr(row["Mesure Existante"])
        ? [cellStr(row["Mesure Existante"])]
        : [],
      moyenMaitrise: cellStr(row["Moyen de Maitrise"]),
      calculPriorite: Number(row["Calcul priorité"]) || 1,
      prioriteFinale: Number(row["Priorité finale 2"]) || 1,
      plannedMeasures: mesureRaw
        ? [
            {
              description: mesureRaw,
              responsible: cellStr(row["Responsable"]),
              deadline: cellStr(row["Échéance"] ?? row["Echeance"]),
              status: "pending",
            },
          ]
        : [],
      status: statusMap[etat] || "a_traiter",
      echeance: cellStr(row["Échéance"] ?? row["Echeance"]),
      retourAction: "",
      observation: cellStr(row["Observation"]),
      createdAt: now,
      updatedAt: cellStr(row["Denière MAJ"] ?? row["Derniere MAJ"]) || now,
    });
  }
  return risks;
}

/** Feuille 1 « Trié par date » — synthèse + historique contrôles */
function importAsbestosRegister() {
  const wb = XLSX.readFile(
    path.join(DATA_DIR, "tableau suivi amiante Tim (1).xlsx"),
  );
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const rows = [];
  let i = 0;
  for (const line of matrix) {
    const c0 = cellStr(line[0]);
    const joined = line.map(cellStr).join("|");
    if (!c0 && !cellStr(line[1])) continue;
    if (c0.startsWith("Synthèse") || c0 === "Type de matériau amianté restant")
      continue;
    if (c0 === "Date du contrôle") continue;

    i += 1;
    if (
      line.length >= 4 &&
      cellStr(line[1]) &&
      !cellStr(line[4]) &&
      cellStr(line[3]).match(/^(EP|AC1|AC2)/i)
    ) {
      rows.push({
        id: slugId("amiante-syn", i),
        kind: "synthese",
        materiau: c0,
        localisation: cellStr(line[1]),
        description: cellStr(line[2]),
        score: cellStr(line[3]),
        attachments: [],
      });
      continue;
    }

    if (cellStr(line[8]) || cellStr(line[7]) || cellStr(line[6])) {
      rows.push({
        id: slugId("amiante-ctl", i),
        kind: "controle",
        dateControle: c0,
        lieuZone: cellStr(line[1]),
        typeControle: cellStr(line[2]),
        zoneRetrait: cellStr(line[3]),
        zonesPresence: cellStr(line[4]),
        zonesNonAmiantees: cellStr(line[5]),
        score: cellStr(line[6]),
        action: cellStr(line[7]),
        prochaineEcheance: cellStr(line[8]),
        attachments: [],
      });
      continue;
    }

    if (c0.length > 3) {
      rows.push({
        id: slugId("amiante-row", i),
        kind: "historique",
        rawCol1: c0,
        rawCol2: cellStr(line[1]),
        rawCol3: cellStr(line[2]),
        rawCol4: cellStr(line[3]),
        rawCol5: cellStr(line[4]),
        rawCol6: cellStr(line[5]),
        rawCol7: cellStr(line[6]),
        rawCol8: cellStr(line[7]),
        rawCol9: cellStr(line[8]),
        attachments: [],
      });
    }
  }

  const wb2 = XLSX.readFile(path.join(DATA_DIR, "Nouveau tableau de suivi.xlsx"));
  const sheet2 = wb2.Sheets[wb2.SheetNames[1]] ?? wb2.Sheets[wb2.SheetNames[0]];
  const siteRows = XLSX.utils.sheet_to_json(sheet2, { defval: "" });
  const sitesDta = siteRows
    .filter((r) => cellStr(r["Site"]))
    .map((r, n) => ({
      id: slugId("amiante-site", n + 1),
      departement: cellStr(r["Département"] ?? r["Departement"]),
      site: cellStr(r["Site"]),
      dateDernierControle: cellStr(r["Date dernier contrôle"]),
      acces: cellStr(r["Accès"] ?? r["Acces"]),
      commentaires: cellStr(r["Commentaires"]),
      dtaStatut: cellStr(r["DTA"]),
      attachments: [],
    }));

  if (wb.SheetNames[1]) {
    const matSheet = wb.Sheets[wb.SheetNames[1]];
    const matRows = XLSX.utils.sheet_to_json(matSheet, { defval: "" });
    for (const r of matRows) {
      const zone = cellStr(r["Zone / matériau"] ?? r["Zone / materiau"]);
      if (!zone) continue;
      i += 1;
      rows.push({
        id: slugId("amiante-mat", i),
        kind: "materiau",
        zoneMateriau: zone,
        localisation: cellStr(r["Localisation précise"]),
        datePremierReperage: cellStr(r["Date 1er repérage"] ?? r["Date 1er reperage"]),
        typeAnalyse: cellStr(r["Type d’analyse initiale"] ?? r["Type d'analyse initiale"]),
        dernierControle: cellStr(r["Dernier contrôle"] ?? r["Dernier controle"]),
        scoreActuel: cellStr(r["Score actuel"]),
        actionsRealisees: cellStr(r["Actions réalisées"] ?? r["Actions realisees"]),
        retraitRealise: cellStr(r["Retrait réalisé"] ?? r["Retrait realise"]),
        actionAPrevoir: cellStr(r["Action à prévoir / gestion"]),
        statutMateriau: cellStr(r["Statut du matériau"] ?? r["Statut du materiau"]),
        attachments: [],
      });
    }
  }

  return { register: rows, sitesDta };
}

function importAccidents() {
  const wb = XLSX.readFile(path.join(DATA_DIR, "analyse accident.xlsx"));
  const analyse = wb.Sheets["Analyse 2023-2025"] ?? wb.Sheets[wb.SheetNames[0]];
  const detail = wb.Sheets["Détail accident"] ?? wb.Sheets[wb.SheetNames[1]];
  const matrixA = XLSX.utils.sheet_to_json(analyse, { header: 1, defval: "" });
  const matrixD = XLSX.utils.sheet_to_json(detail, { header: 1, defval: "" });

  const byCauseYear = [];
  for (let r = 2; r < matrixA.length; r++) {
    const line = matrixA[r];
    const cause = cellStr(line[1]);
    const year = cellStr(line[2]);
    if (!cause || !year || !/^\d{4}$/.test(year)) continue;
    byCauseYear.push({
      cause,
      year: Number(year),
      nbAccidents: Number(line[3]) || 0,
      sansArret: Number(line[4]) || 0,
      avecArret: Number(line[5]) || 0,
      joursArret: Number(line[6]) || 0,
    });
  }

  const byYear = [];
  for (let r = 2; r < matrixA.length; r++) {
    const line = matrixA[r];
    const year = cellStr(line[8]);
    if (!year || !/^\d{4}$/.test(year)) continue;
    const total = Number(line[9]);
    if (Number.isNaN(total)) continue;
    if (byYear.some((y) => y.year === Number(year))) continue;
    byYear.push({
      year: Number(year),
      nbAccidents: total,
      sansArret: Number(line[10]) || 0,
      avecArret: Number(line[11]) || 0,
    });
  }

  const accidents = [];
  for (let r = 2; r < matrixD.length; r++) {
    const line = matrixD[r];
    const site = cellStr(line[1]);
    if (!site) continue;
    const dateRaw = line[5];
    const date = cellStr(dateRaw);
    const arret = cellStr(line[11]).toLowerCase();
    const gravite = cellStr(line[8]);
    const gMatch = gravite.match(/G[1-5]/i);
    accidents.push({
      id: slugId("acc-import", r),
      date,
      time: "",
      title: `${cellStr(line[4])} — ${site}`,
      description: cellStr(line[6]),
      accidentCategory: cellStr(line[3]),
      accidentEventType: cellStr(line[4]),
      severity:
        gMatch && ["G4", "G5"].includes(gMatch[0].toUpperCase())
          ? "grave"
          : gMatch && gMatch[0].toUpperCase() === "G3"
            ? "modéré"
            : "bénin",
      regulatoryGravity: gMatch ? gMatch[0].toUpperCase() : undefined,
      type:
        cellStr(line[3]).toLowerCase().includes("trajet") ? "trajet" : "travail",
      victim: "Anonymisé",
      victimFirstName: "",
      victimLastName: "",
      location: site,
      service: cellStr(line[2]),
      domain: cellStr(line[2]),
      circumstances: cellStr(line[6]),
      accidentCauses: cellStr(line[7]),
      hasWorkStoppage: arret === "oui" || arret === "yes",
      lesionSites: cellStr(line[9])
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      lesionNatures: cellStr(line[10])
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      witnesses: [],
      measures: "",
      createdAt: new Date().toISOString(),
    });
  }

  return {
    indicateurs: { byYear, byCauseYear, importedAt: new Date().toISOString() },
    accidents,
  };
}

function main() {
  ensureDir(OUT_DIR);
  const risks = importDuerpRisks();
  const { register, sitesDta } = importAsbestosRegister();
  const { indicateurs, accidents } = importAccidents();

  fs.writeFileSync(
    path.join(OUT_DIR, "duerp-risks.json"),
    JSON.stringify(risks, null, 0),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "asbestos-register.json"),
    JSON.stringify(register, null, 2),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "asbestos-sites-dta.json"),
    JSON.stringify(sitesDta, null, 2),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "accident-indicators.json"),
    JSON.stringify(indicateurs, null, 2),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "accidents-declaratif.json"),
    JSON.stringify(accidents, null, 2),
  );

  console.log("Import terminé:");
  console.log(`  DUERP risques: ${risks.length}`);
  console.log(`  Amiante registre: ${register.length}`);
  console.log(`  Amiante sites DTA: ${sitesDta.length}`);
  console.log(`  Accidents déclaratif: ${accidents.length}`);
  console.log(`  Indicateurs années: ${indicateurs.byYear.length}`);
}

main();
