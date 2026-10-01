export function isBackendApiEnabled(): boolean {
  return import.meta.env.VITE_USE_BACKEND_API !== "false";
}

/** Connexion démo locale si l’API est injoignable (dev / Netlify sans backend). */
export function isDemoLoginAllowed(): boolean {
  return import.meta.env.VITE_ALLOW_DEMO_LOGIN === "true";
}
