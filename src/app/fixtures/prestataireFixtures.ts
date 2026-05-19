import { AppUser } from "../components/admin/UserManagementView";
import { ROLE_PRESTATAIRE } from "../utils/userRoles";

/** Mot de passe commun pour les comptes prestataires de test (hors compte démo principal). */
export const PRESTATAIRE_FIXTURE_PASSWORD = "presta123";

/**
 * Prestataires repas préchargés pour les tests (scan QR, stats, historique).
 * `lastName` = nom de l'établissement affiché dans l'app.
 */
export const PRESTATAIRE_FIXTURES: AppUser[] = [
  {
    id: "p-demo",
    firstName: "—",
    lastName: "Cantine DIRMMED (démo)",
    email: "prestataire@dirm-med.gouv.fr",
    password: "presta123",
    position: "Restauration collective",
    service: "Prestataire",
    domain: "—",
    location: "Siège Paris",
    category: "Prestataire",
    role: ROLE_PRESTATAIRE,
    createdAt: "2025-01-10T08:00:00Z",
    createdBy: "Système",
  },
  {
    id: "p-marseille-port",
    firstName: "—",
    lastName: "Restaurant du Port",
    email: "restaurant.port@marseille.dirm-med.gouv.fr",
    password: PRESTATAIRE_FIXTURE_PASSWORD,
    position: "Restauration maritime",
    service: "Prestataire",
    domain: "—",
    location: "Site Marseille",
    category: "Prestataire",
    role: ROLE_PRESTATAIRE,
    createdAt: "2025-02-15T09:00:00Z",
    createdBy: "Jean-Marc DUBOIS",
  },
  {
    id: "p-lyon-self",
    firstName: "—",
    lastName: "Self Service Lyon",
    email: "self.lyon@dirm-med.gouv.fr",
    password: PRESTATAIRE_FIXTURE_PASSWORD,
    position: "Self / comptoir",
    service: "Prestataire",
    domain: "—",
    location: "Site Lyon",
    category: "Prestataire",
    role: ROLE_PRESTATAIRE,
    createdAt: "2025-03-01T10:30:00Z",
    createdBy: "Marie Martin",
  },
  {
    id: "p-bordeaux-brasserie",
    firstName: "—",
    lastName: "Brasserie Atlantique",
    email: "brasserie.bordeaux@dirm-med.gouv.fr",
    password: PRESTATAIRE_FIXTURE_PASSWORD,
    position: "Brasserie / tickets repas",
    service: "Prestataire",
    domain: "—",
    location: "Site Bordeaux",
    category: "Prestataire",
    role: ROLE_PRESTATAIRE,
    createdAt: "2025-03-20T11:00:00Z",
    createdBy: "Jean-Marc DUBOIS",
  },
];

/** Aide-mémoire pour la page de connexion et la doc de test */
export const PRESTATAIRE_FIXTURE_LOGINS = [
  {
    email: "prestataire@dirm-med.gouv.fr",
    password: "presta123",
    label: "Cantine DIRMMED (démo)",
    location: "Siège Paris",
  },
  {
    email: "restaurant.port@marseille.dirm-med.gouv.fr",
    password: PRESTATAIRE_FIXTURE_PASSWORD,
    label: "Restaurant du Port",
    location: "Site Marseille",
  },
  {
    email: "self.lyon@dirm-med.gouv.fr",
    password: PRESTATAIRE_FIXTURE_PASSWORD,
    label: "Self Service Lyon",
    location: "Site Lyon",
  },
  {
    email: "brasserie.bordeaux@dirm-med.gouv.fr",
    password: PRESTATAIRE_FIXTURE_PASSWORD,
    label: "Brasserie Atlantique",
    location: "Site Bordeaux",
  },
] as const;
