import type { RiskReference } from "../components/admin/RiskReferencesManagementView";
import { displayRiskSheet } from "./riskReferenceSheets";

/**
 * Dossiers INRS vérifiés sur https://www.inrs.fr/risques.html.
 * Les numéros sans dossier dédié restent sans lien : il se renseigne sur la fiche.
 */
export const INRS_FICHE_BY_NUMERO: Record<string, string> = {
  "1": "https://www.inrs.fr/risques/amiante.html",
  "2": "https://www.inrs.fr/risques/biologiques.html",
  "3": "https://www.inrs.fr/risques/chimiques.html",
  "4": "https://www.inrs.fr/risques/cmr-agents-chimiques.html",
  "5": "https://www.inrs.fr/risques/chaleur.html",
  "6": "https://www.inrs.fr/risques/electriques.html",
  "7": "https://www.inrs.fr/risques/explosion.html",
  "8": "https://www.inrs.fr/risques/incendie-lieu-travail.html",
  "9": "https://www.inrs.fr/risques/rayonnements-optiques.html",
  "10": "https://www.inrs.fr/risques/explosion.html",
  "11": "https://www.inrs.fr/risques/mecaniques.html",
  "12": "https://www.inrs.fr/risques/machines.html",
  "14": "https://www.inrs.fr/risques/tms-troubles-musculosquelettiques.html",
  "15": "https://www.inrs.fr/risques/activite-physique.html",
  "16": "https://www.inrs.fr/risques/rayonnements-ionisants.html",
  "17": "https://www.inrs.fr/risques/activite-physique.html",
  "18": "https://www.inrs.fr/risques/machines.html",
  "19": "https://www.inrs.fr/risques/mecaniques.html",
  "20": "https://www.inrs.fr/risques/espaces-confines.html",
  "22": "https://www.inrs.fr/risques/chutes-de-plain-pied.html",
  "23": "https://www.inrs.fr/risques/chutes-hauteur.html",
  "24": "https://www.inrs.fr/risques/chaleur.html",
  "26": "https://www.inrs.fr/risques/air-interieur.html",
  "27": "https://www.inrs.fr/risques/bruit.html",
  "28": "https://www.inrs.fr/risques/travail-ecran.html",
  "29": "https://www.inrs.fr/risques/travail-horaires-atypiques.html",
  "30": "https://www.inrs.fr/risques/deplacements.html",
  "31": "https://www.inrs.fr/risques/travail-isole.html",
  "32": "https://www.inrs.fr/risques/vibration-corps-entier.html",
  "33": "https://www.inrs.fr/risques/psychosociaux.html",
  "34": "https://www.inrs.fr/risques/agressions-violences-externes.html",
  "35": "https://www.inrs.fr/risques/addictions.html",
  "36": "https://www.inrs.fr/risques/entreprises-exterieures.html",
  "37": "https://www.inrs.fr/risques/zoonoses.html",
  "38": "https://www.inrs.fr/risques/routiers.html",
  "39": "https://www.inrs.fr/risques/biologiques.html",
  "41": "https://www.inrs.fr/risques/teletravail.html",
};

export function resolveRiskReferenceFicheUrl(reference: {
  numeroRisque: string;
  ficheUrl?: string;
}): string {
  if (reference.ficheUrl !== undefined) return reference.ficheUrl.trim();
  return INRS_FICHE_BY_NUMERO[reference.numeroRisque.trim()] ?? "";
}

export function stickReferenceContent<T extends RiskReference>(reference: T): T {
  const copy = displayRiskSheet(reference);
  const filled = (value: string | undefined, fallback: string) =>
    value?.trim() ? value : fallback;
  return {
    ...reference,
    ficheUrl: reference.ficheUrl !== undefined ? reference.ficheUrl : resolveRiskReferenceFicheUrl(reference),
    description: filled(reference.description, copy.description),
    situations: filled(reference.situations, copy.situations),
    dommages: filled(reference.dommages, copy.dommages),
    prevention: filled(reference.prevention, copy.prevention),
  };
}

const RISK_REFERENCE_TITLES: Array<Pick<RiskReference, "id" | "numeroRisque" | "title">> = [
  { id: "gyptis-ref-1", numeroRisque: "1", title: "Risque Amiante" },
  { id: "gyptis-ref-2", numeroRisque: "2", title: "Biologique" },
  { id: "gyptis-ref-3", numeroRisque: "3", title: "Risque Chimique" },
  { id: "gyptis-ref-4", numeroRisque: "4", title: "Risque chimique lié à l'utilisation de produits CMR" },
  { id: "gyptis-ref-5", numeroRisque: "5", title: "Risque de brûlure thermique" },
  { id: "gyptis-ref-6", numeroRisque: "6", title: "Risque électrique" },
  { id: "gyptis-ref-7", numeroRisque: "7", title: "Risque explosion" },
  { id: "gyptis-ref-8", numeroRisque: "8", title: "Risque Incendie" },
  { id: "gyptis-ref-9", numeroRisque: "9", title: "Risque Rayonnement Optiques Artificiels: DEL/Eclairage à forte luminance/Laser" },
  { id: "gyptis-ref-10", numeroRisque: "10", title: "Risque lié à l'utilisation de produits pyrotechniques" },
  { id: "gyptis-ref-11", numeroRisque: "11", title: "Risque lié à la manipulation d'outils" },
  { id: "gyptis-ref-12", numeroRisque: "12", title: "Risque lié aux automatismes" },
  { id: "gyptis-ref-13", numeroRisque: "13", title: "Risque lié aux fluides et équipements sous-pression" },
  { id: "gyptis-ref-14", numeroRisque: "14", title: "Risque lié aux gestes répétitifs" },
  { id: "gyptis-ref-15", numeroRisque: "15", title: "Risque lié aux postures de travail" },
  { id: "gyptis-ref-16", numeroRisque: "16", title: "Risque lié aux rayonnements ionisants et non ionisants (électromagnétiques)" },
  { id: "gyptis-ref-17", numeroRisque: "17", title: "Risque manutention manuelle" },
  { id: "gyptis-ref-18", numeroRisque: "18", title: "Risque manutention mécanique et au levage" },
  { id: "gyptis-ref-19", numeroRisque: "19", title: "Risque mécanique" },
  { id: "gyptis-ref-20", numeroRisque: "20", title: "Risque d'asphyxie" },
  { id: "gyptis-ref-21", numeroRisque: "21", title: "Risque chute d'objet" },
  { id: "gyptis-ref-22", numeroRisque: "22", title: "Risque chutes de plain-pied" },
  { id: "gyptis-ref-23", numeroRisque: "23", title: "Risque chutes de hauteur" },
  { id: "gyptis-ref-24", numeroRisque: "24", title: "Risque lié à l'ambiance thermique" },
  { id: "gyptis-ref-25", numeroRisque: "25", title: "Risque lié à l'éclairage" },
  { id: "gyptis-ref-26", numeroRisque: "26", title: "Risque lié à la qualité de l'air" },
  { id: "gyptis-ref-27", numeroRisque: "27", title: "Risque lié au bruit" },
  { id: "gyptis-ref-28", numeroRisque: "28", title: "Risque lié au travail sur écran" },
  { id: "gyptis-ref-29", numeroRisque: "29", title: "Risque lié aux conditions de travail particulières (horaires décalés, astreinte..)" },
  { id: "gyptis-ref-30", numeroRisque: "30", title: "Risque lié aux déplacements internes" },
  { id: "gyptis-ref-31", numeroRisque: "31", title: "Risque lié aux interventions isolées" },
  { id: "gyptis-ref-32", numeroRisque: "32", title: "Risque lié aux vibrations" },
  { id: "gyptis-ref-33", numeroRisque: "33", title: "Risques psychosociaux (RPS)" },
  { id: "gyptis-ref-34", numeroRisque: "34", title: "Risque agression / agressivité lié au contact avec l'extérieur" },
  { id: "gyptis-ref-35", numeroRisque: "35", title: "Risque lié à l'alcool, drogues, médicaments, tabac." },
  { id: "gyptis-ref-36", numeroRisque: "36", title: "Risque lié à la co-activité et à l'intervention d'entreprises extérieures" },
  { id: "gyptis-ref-37", numeroRisque: "37", title: "Risque lié à la présence d'animaux" },
  { id: "gyptis-ref-38", numeroRisque: "38", title: "Risque routier" },
  { id: "gyptis-ref-39", numeroRisque: "39", title: "Risque sanitaire : transmission de maladies, infections, allergies." },
  { id: "gyptis-ref-40", numeroRisque: "40", title: "Risque de force majeure" },
  { id: "gyptis-ref-41", numeroRisque: "41", title: "Risque lié au poste en télétravail" },
  { id: "gyptis-ref-42", numeroRisque: "42", title: "Risque de noyade" },
  { id: "gyptis-ref-43", numeroRisque: "43", title: "Risque lié aux travaux en milieu hyperbare" },
  { id: "gyptis-ref-44", numeroRisque: "44", title: "Risque migrant" },
  { id: "gyptis-ref-45", numeroRisque: "45", title: "Risque port d'arme" },
];

/**
 * Référentiel des risques — source :
 * doc/Data/intégration circulaire et actualisation DUERP GYPTIS.xlsx (Feuil4)
 */
export const RISK_REFERENCE_FIXTURES: RiskReference[] = RISK_REFERENCE_TITLES.map((item) => ({
  ...item,
  ficheUrl: INRS_FICHE_BY_NUMERO[item.numeroRisque] ?? "",
  description: "",
  situations: "",
  dommages: "",
  prevention: "",
}));
