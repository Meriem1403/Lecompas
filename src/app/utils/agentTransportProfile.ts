import type { TransportCoverageRequest } from "./transportCoveragePdf";

export interface AgentTransportProfile {
  email: string;
  ministereDirectionAffectation: string;
  nom: string;
  prenom: string;
  numeroSecuriteSociale: string;
  matricule: string;
  corps: string;
  grade: string;
  dateArriveeStructure: string;
  domicileNumeroRue: string;
  domicileCommune: string;
  domicileCodePostal: string;
  domicileArret: string;
  travailNumeroRue: string;
  travailCommune: string;
  travailCodePostal: string;
  travailArret: string;
  signatureAgent: string;
  signatureImage: string;
}

export const EMPTY_AGENT_PROFILES: Record<string, AgentTransportProfile> = {};

const TEXT_KEYS = [
  "ministereDirectionAffectation",
  "nom",
  "prenom",
  "numeroSecuriteSociale",
  "matricule",
  "corps",
  "grade",
  "dateArriveeStructure",
  "domicileNumeroRue",
  "domicileCommune",
  "domicileCodePostal",
  "domicileArret",
  "travailNumeroRue",
  "travailCommune",
  "travailCodePostal",
  "travailArret",
  "signatureAgent",
] as const satisfies ReadonlyArray<keyof AgentTransportProfile & keyof TransportCoverageRequest>;

export function profileKey(email: string) {
  return email.trim().toLowerCase();
}

export function profileFromRequest(request: TransportCoverageRequest): AgentTransportProfile {
  const profile = { email: request.agentEmail, signatureImage: request.signatureImage || "" } as AgentTransportProfile;
  for (const key of TEXT_KEYS) profile[key] = request[key] || "";
  return profile;
}

export function applyProfile(
  request: TransportCoverageRequest,
  profile?: AgentTransportProfile | null,
): TransportCoverageRequest {
  if (!profile) return request;
  const next = { ...request };
  for (const key of TEXT_KEYS) {
    if (!next[key] && profile[key]) next[key] = profile[key];
  }
  if (!next.signatureImage && profile.signatureImage) next.signatureImage = profile.signatureImage;
  return next;
}

/** Première saisie : crée la fiche. Ensuite, ne complète que les champs encore vides. */
export function rememberProfile(
  existing: AgentTransportProfile | undefined,
  request: TransportCoverageRequest,
): AgentTransportProfile {
  if (!existing) return profileFromRequest(request);
  const next = { ...existing, email: existing.email || request.agentEmail };
  for (const key of TEXT_KEYS) {
    if (!next[key] && request[key]) next[key] = request[key];
  }
  if (!next.signatureImage && request.signatureImage) next.signatureImage = request.signatureImage;
  return next;
}
