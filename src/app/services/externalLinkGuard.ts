const ALLOWED_EXTERNAL_HOSTS = [
  "travail-emploi.gouv.fr",
  "inrs.fr",
  "gouv.fr",
  "dirm-mediterranee.developpement-durable.gouv.fr",
  "dirm-mediterranee.e2.rie.gouv.fr",
  "lecompas.netlify.app",
];

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase();
}

function isHostAllowed(hostname: string): boolean {
  const host = normalizeHost(hostname);
  return ALLOWED_EXTERNAL_HOSTS.some((allowedHost) => {
    const normalizedAllowedHost = normalizeHost(allowedHost);
    return host === normalizedAllowedHost || host.endsWith(`.${normalizedAllowedHost}`);
  });
}

export function isAllowedExternalUrl(url: string): boolean {
  if (!url || url === "#") return false;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return isHostAllowed(parsed.hostname);
  } catch {
    return false;
  }
}

export function getBlockedExternalLinkMessage(url: string): string {
  return `Lien externe bloqué (domaine non autorisé): ${url}`;
}
