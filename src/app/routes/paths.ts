/**
 * Correspondance entre les identifiants de vues (activeView historique) et les URLs.
 */
export const VIEW_TO_PATH: Record<string, string> = {
  categories: "/accueil",
  dashboard: "/tableau-de-bord",
  team: "/equipe",
  "access-management": "/gestion-acces",
  actualites: "/actualites",
  risks: "/evaluation-risques",
  create_risk: "/evaluation-risques/nouveau",
  retour_action: "/evaluation-risques/retour-action",
  "risk-awareness": "/sensibilisation-risques",
  "prevention-plan": "/plan-prevention",
  "safety-protocols": "/protocoles-securite",
  "safety-sheets": "/fiches-securite",
  actions: "/plan-action",
  documents: "/documents-duerp",
  cerbere: "/cerbere",
  users: "/admin/utilisateurs",
  "risks-management": "/gestion-risques",
  "risk-references": "/referentiel-risques",
  "action-returns": "/retours-action",
  roles: "/admin/roles",
  services: "/admin/services",
  domains: "/admin/domaines",
  locations: "/admin/lieux",
  "medical-visits": "/visites-medicales",
  "sst-registry": "/registre-sst",
  "arrivees-departs": "/arrivees-departs",
  accidents: "/accidentologie",
  registre: "/registre-accidents",
  archives: "/archives",
  mercury: "/mercure",
  asbestos: "/amiante",
  "asbestos-attestations": "/amiante/attestations",
  "signature-duerp": "/signature-duerp",
  settings: "/parametres",
};

const PATH_TO_VIEW = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([viewId, path]) => [path, viewId]),
) as Record<string, string>;

const CATEGORY_MODULE_PATH = /^\/categories\/([^/]+)$/;

export function getPathForView(
  viewId: string,
  categoryId?: string | null,
): string {
  if (viewId === "category-modules" && categoryId) {
    return `/categories/${categoryId}`;
  }
  return VIEW_TO_PATH[viewId] ?? "/tableau-de-bord";
}

export function resolveViewFromPathname(pathname: string): {
  viewId: string;
  categoryId: string | null;
} {
  const path = pathname.replace(/\/$/, "") || "/";

  if (path === "/" || path === "/accueil") {
    return { viewId: "categories", categoryId: null };
  }

  const categoryMatch = path.match(CATEGORY_MODULE_PATH);
  if (categoryMatch) {
    return { viewId: "category-modules", categoryId: categoryMatch[1] };
  }

  const viewId = PATH_TO_VIEW[path];
  if (viewId) {
    return { viewId, categoryId: null };
  }

  return { viewId: "dashboard", categoryId: null };
}

export const DEFAULT_AUTHENTICATED_PATH = "/accueil";
