import React, { useState, useEffect, useMemo, startTransition, useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useRequestLeave } from "./components/leaveGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./components/ui/dialog";
import { Textarea } from "./components/ui/textarea";
import { ScrollArea } from "./components/ui/scroll-area";
import { Separator } from "./components/ui/separator";
import { AccidentsView } from "./components/AccidentsView";
import { enrichAccidentWithRegulatoryGravity } from "./utils/accidentRegulatoryGravity";
import {
  mapRisksToDuerpRefs,
  normalizeAccidentRecord,
} from "./utils/accidentRecord";
import { ActionsView } from "./components/ActionsView";
import type { Action } from "./types/action";
import { RiskFormDialog } from "./components/RiskFormDialog";
import { ListPaginationBar } from "./components/ui/list-pagination-bar";
import { RiskEvaluationFiltersPanel } from "./components/RiskEvaluationFiltersPanel";
import {
  emptyRiskEvaluationFilters,
  matchesRiskEvaluationFilters,
  type RiskEvaluationFilters,
} from "./utils/riskFilterLogic";
import { RiskEditView } from "./components/RiskEditView";
import { RiskEvaluationFacts, RiskProgress } from "./components/risks/RiskEvaluationFacts";
import { RiskConsultationDetail, RiskScalePair } from "./components/risks/RiskConsultationDetail";
import {
  AdminTabsView,
  FAKE_USERS,
  FAKE_DOMAINS,
  FAKE_LOCATIONS,
  FAKE_SERVICES,
  DEFAULT_ADMIN_CATEGORIES,
  DEFAULT_ADMIN_ROLES,
} from "./components/AdminTabsView";
import { Role } from "./components/admin/RoleManagementView";
import { AppUser } from "./components/admin/UserManagementView";
import { DocumentsView } from "./components/DocumentsView";
import { ArchivesView } from "./components/ArchivesView";
import { RegistreAccidentsView } from "./components/RegistreAccidentsView";
import { SettingsView } from "./components/SettingsView";
import { CerbereView } from "./components/CerbereView";
import { ReservationsView } from "./components/ReservationsView";
import { InformatiqueModulesView } from "./components/InformatiqueModulesView";
import { ActualitesView } from "./components/ActualitesView";
import { NotificationBell } from "./components/NotificationBell";
import { ArriveesDepartsView } from "./components/ArriveesDepartsView";
import { TransportCoverageView } from "./components/TransportCoverageView";
import { RetourActionView } from "./components/RetourActionView";
import { DashboardView } from "./components/DashboardView";
import { DUERPSignatureManagement } from "./components/DUERPSignatureManagement";
import { RisksManagementView } from "./components/admin/RisksManagementView";
import {
  RiskReference,
  RiskReferencesManagementView,
} from "./components/admin/RiskReferencesManagementView";
import { RISK_REFERENCE_FIXTURES, stickReferenceContent } from "./fixtures/riskReferenceFixtures";
import { CSN_PACA_CORSE_RISK_FIXTURES } from "./fixtures/csnPacaCorseRiskFixtures";
import { PAPRIPACT_2026_ACTION_FIXTURES } from "./fixtures/papripactFixtures";
import {
  buildRiskAwarenessKey,
  normalizeRiskTitle,
  loadAwarenessRecords,
  loadManualActions,
  loadNotifications,
  loadPersistedRisks,
  loadSecuritySheets,
  loadSuppressedAwarenessKeys,
  saveAwarenessRecords,
  saveManualActions,
  saveNotifications,
  savePersistedRisks,
  saveSecuritySheets,
  saveSuppressedAwarenessKeys,
  loadPapripactSignaturesStorage,
  savePapripactSignaturesStorage,
  type AppNotification,
} from "./utils/lecompasStorage";
import {
  loadPapripactSignatures,
  savePapripactSignatures,
  mergeInitialManualActions,
  completePapripactFromFixtures,
  type PapripactSignatureRecord,
} from "./utils/papripactStorage";
import {
  DEFAULT_AUTHENTICATED_PATH,
  getPathForView,
  resolveViewFromPathname,
} from "./routes/paths";
import { MercuryView } from "./components/MercuryView";
import { AsbestosView } from "./components/AsbestosView";
import { AsbestosAttestationsView } from "./components/AsbestosAttestationsView";
import { AsbestosDeclarationView } from "./components/AsbestosDeclarationView";
import { MedicalVisitsView } from "./components/MedicalVisitsView";
import { SSTRegistryView } from "./components/SSTRegistryView";
import { LoginPage } from "./components/LoginPage";
import { CategoriesView } from "./components/CategoriesView";
import { DUERPModulesView } from "./components/DUERPModulesView";
import { RHModulesView } from "./components/RHModulesView";
import { EnvironnementModulesView } from "./components/EnvironnementModulesView";
import { ApplicationsModulesView } from "./components/ApplicationsModulesView";
import { AdministrationModulesView } from "./components/AdministrationModulesView";
import { TeamView } from "./components/TeamView";
import { AccessManagementView } from "./components/AccessManagementView";
import { RiskAwarenessRecord } from "./components/RiskAwarenessView";
import { PreventionPlanView } from "./components/PreventionPlanView";
import { SafetyProtocolView } from "./components/SafetyProtocolView";
import {
  defaultSecuritySheetsState,
  SecuritySheetView,
} from "./components/SecuritySheetView";
import { ACCESS_MODULES } from "./components/access-management/constants";
import { presetForRoleCode, profileFromRoleCode, profileHasAnyGrant, roleCodeFromUserRole } from "./components/access-management/roleAccess";
import { loadAdminUsers, saveAdminUsers } from "./utils/adminUserRecord";
import {
  appUserDisplayName,
  sessionRoleFromAppRole,
} from "./utils/userRoles";
import {
  DEMO_LOGIN_ACCOUNTS,
  directoryUserToSessionUser,
  resolveDirectoryEmail,
  sessionUsersMatch,
  syncSessionWithDirectory,
} from "./utils/demoAccounts";
import { EmployeeAccessProfile } from "./components/access-management/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import {
  AlertCircle,
  Shield,
  Activity,
  Users,
  TrendingUp,
  FileText,
  PlusCircle,
  LogOut,
  LayoutDashboard,
  AlertTriangle,
  Calendar,
  Settings,
  ChevronRight,
  Check,
  X,
  Clock,
  User,
  MapPin,
  Flame,
  Droplet,
  Zap,
  Wind,
  Target,
  Award,
  TrendingDown,
  Edit,
  Trash2,
  Brain,
  Armchair,
  Cog,
  CheckCircle2,
  CheckCircle,
  Search,
  Loader,
  Building2,
  Layers,
  Tag,
  UserCog,
  UserCheck,
  Archive,
  ClipboardList,
  Bell,
  Calculator,
  Send,
  MessageSquare,
  Eye,
  LayoutGrid,
  Table2,
  FileSignature,
  Database,
  Stethoscope,
  ArrowLeft,
  ChevronLeft,
  Menu,
  FileCheck,
  Car,
  Bus,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "./components/ui/progress";
import {
  isBackendApiEnabled,
  isDemoLoginAllowed,
} from "./config/dataBackend";
import {
  ApiError,
  isApiAccessToken,
  setStoredAccessToken,
} from "@/lib/apiClient";
import {
  clearAuthSession,
  readAuthSession,
  touchAuthActivity,
  updateStoredSessionUser,
  writeAuthSession,
} from "./utils/authSession";
import {
  fetchProfile,
  loginWithApi,
  mapApiRoleToSessionRole,
} from "./services/authApi";
import { fetchRisksFromApi, syncRisksToApi } from "./services/risksApi";
import { ensureOfficialDuerpRiskBase } from "./utils/duerpRiskBase";
import { closeRiskNumberGap, denseRiskNumbers, nextRiskNumber } from "./utils/riskSequence";
import {
  fetchAdminUsers,
  syncAdminUsersToApi,
} from "./services/usersApi";
import {
  fetchActionsFromApi,
  syncActionsToApi,
} from "./services/actionsApi";
import {
  fetchAccidentsFromApi,
  syncAccidentsToApi,
} from "./services/accidentsApi";
import {
  fetchNotificationsFromApi,
  syncNotificationsToApi,
} from "./services/notificationsApi";
import {
  fetchActionReturnsFromApi,
  syncActionReturnsToApi,
} from "./services/actionReturnsApi";
import { ACTION_RETURN_FIXTURES, previewActionReturnsForRisks } from "./fixtures/actionReturnFixtures";
import { APP_DATA_KEYS, fetchAppData, saveAppData } from "./services/appDataApi";
import {
  hydrateAppDataValue,
  useAppDataBackendSync,
} from "./hooks/useAppDataBackendSync";
import type { OrganizationSnapshot } from "./types/organization";
import { normalizeOrganizationSnapshot } from "./utils/normalizeOrganizationSnapshot";
import { buildDefaultAccessProfiles } from "./utils/accessProfileDefaults";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "chef_service" | "agent" | "prestataire" | "rh";
  service: string;
  domain?: string;
  location?: string;
}

interface Risk {
  id: string;
  numeroRisque: string; // Numéro risque
  title: string; // Risque
  detachedFromReference?: boolean;
  unite: string; // Unité
  domain?: string; // Domaine
  service: string; // Service
  site: string; // Site
  situation: string; // Situation dangereuse
  associatedRisk: string; // Dommage
  category: string;
  responsable: string; // Responsable du risque
  severity: number; // Gravité
  probability: number; // Fréquence
  riskLevel: number; // Priorité initiale
  existingMeasures: string[]; // Mesure Existante
  moyenMaitrise: string; // Moyen de Maitrise
  calculPriorite: number; // Calcul priorité
  prioriteFinale: number; // Priorité finale 2
  plannedMeasures: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: "pending" | "in_progress" | "completed";
    completedDate?: string;
    effectiveness?: string;
  }>; // Mesures A proposer
  status: "a_traiter" | "en_traitement" | "maitrise" | "supprime"; // Etat d'avancement
  echeance: string; // Échéance
  retourAction: string; // Retour d'action
  observation: string; // Observation
  createdAt: string;
  updatedAt: string;
}

interface ActionReturn {
  id: string;
  riskId: string;
  riskTitle: string;
  proposedBy: string;
  proposedDate: string;
  proposedMeasure: string;
  justification: string;
  status:
    | "pending"
    | "validated_add"
    | "validated_replace"
    | "rejected";
  reviewedBy?: string;
  reviewedDate?: string;
  reviewComment?: string;
  targetMeasureIndex?: number;
  targetMeasureText?: string;
}

interface Accident {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  accidentCategory?: string;
  accidentEventType?: string;
  severity: "bénin" | "modéré" | "grave" | "très_grave";
  hasWorkStoppage?: boolean;
  workStoppageStartDate?: string;
  workStoppageEndDate?: string;
  workStoppageDays?: number;
  hasReturnToWorkMedicalConditions?: boolean;
  returnToWorkMedicalConditions?: string;
  regulatoryGravity?: "G1" | "G2" | "G3" | "G4" | "G5";
  type: "travail" | "trajet" | "maladie_pro";
  victim: string;
  victimFirstName?: string;
  victimLastName?: string;
  location: string;
  service?: string;
  domain?: string;
  circumstances?: string;
  accidentCauses?: string;
  causeAnalysis?: string;
  comments?: string;
  duerpRiskId?: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
  duerpRiskFreeText?: string;
  witnesses: string[];
  measures: string;
  lesionSites?: string[];
  lesionNatures?: string[];
  correctiveActions?: string[];
  createdAt: string;
}

// Données risques CSN PACA-CORSE (évaluation + gestion)
const FAKE_RISKS: Risk[] = CSN_PACA_CORSE_RISK_FIXTURES;

const DEFAULT_APP_NOTIFICATIONS: AppNotification[] = [
  {
    id: "a1",
    titre: "Mise à jour du système DUERP",
    contenu:
      "Une nouvelle version du système DUERP sera déployée le 10 février 2026.",
    type: "info",
    dateCreation: "2026-02-01",
    isRead: false,
  },
  {
    id: "a4",
    titre: "URGENT - Nouveau protocole COVID-19",
    contenu:
      "Suite aux nouvelles directives gouvernementales, un protocole sanitaire renforcé est mis en place immédiatement.",
    type: "urgent",
    dateCreation: "2026-02-02",
    isRead: false,
  },
];

const FAKE_ACCIDENTS: Accident[] = [
  {
    id: "1",
    date: "2026-01-25",
    time: "14:20",
    title: "Chute dans escalier - blessure cheville",
    description:
      "L'employée descendait l'escalier principal en portant un carton. Elle a manqué une marche et s'est tordu la cheville. Transport aux urgences, diagnostic : entorse cheville gauche grade 2.",
    severity: "modéré",
    type: "travail",
    accidentCategory: "Travail",
    accidentEventType: "Chute de plain-pied",
    victim: "Amélie Rousseau",
    victimFirstName: "Amélie",
    victimLastName: "Rousseau",
    location: "Escalier principal, 2ème étage",
    circumstances:
      "Descente de l'escalier principal, marche 4, port d'un carton de fournitures (~8 kg), main droite occupée, rampe non utilisée.",
    accidentCauses:
      "Charge portée dans l'escalier, attention partielle, absence de signalisation récente des travaux de peinture.",
    causeAnalysis:
      "Analyse QQOQCCP : combinaison charge + déplacement + environnement (marche légèrement glissante).",
    comments: "Déclaration CPAM en cours. Retour d'expérience prévu en réunion sécurité.",
    duerpRiskId: "1",
    duerpRiskNumber: "RISK-2026-001",
    duerpRiskLabel: "Risque de chute sur sol glissant",
    witnesses: ["Thomas Blanchard", "Julie Mercier"],
    measures:
      "Arrt de travail 15 jours. Main courante renforcée. Rappel : ne pas porter de charges lourdes dans les escaliers.",
    hasWorkStoppage: true,
    workStoppageStartDate: "2026-01-25",
    workStoppageEndDate: "2026-02-08",
    workStoppageDays: 15,
    hasReturnToWorkMedicalConditions: true,
    returnToWorkMedicalConditions:
      "Reprise à mi-temps pendant 2 semaines, pas de port de charges lourdes. Visite de reprise médecine du travail programmée.",
    regulatoryGravity: "G3",
    lesionSites: ["Cheville", "Membre inférieur"],
    lesionNatures: ["Entorse"],
    correctiveActions: ["Balisage de zone", "Formation complémentaire"],
    createdAt: "2026-01-25T14:30:00Z",
  },
  {
    id: "2",
    date: "2026-01-18",
    time: "10:15",
    title: "Brûlure chimique - projection produit",
    description:
      "Lors du transvasement d'un produit de nettoyage concentré, projection dans l'œil malgré le port de lunettes. Rinçage immédiat au poste de rinçage oculaire pendant 15 minutes.",
    severity: "grave",
    type: "travail",
    accidentCategory: "Travail",
    accidentEventType: "Projection",
    victim: "Carlos Mendes",
    victimFirstName: "Carlos",
    victimLastName: "Mendes",
    location: "Local produits chimiques, Bâtiment B",
    circumstances:
      "Transvasement produit concentré vers flacon doseur, lunettes de protection portées, projection résiduelle malgré rinçage préalable du bec.",
    accidentCauses:
      "Surpression résiduelle, position du flacon, réflexe de retirer les lunettes pour mieux voir.",
    causeAnalysis: "Revue de la procédure de transvasement et du poste de rinçage oculaire.",
    comments: "FDS révisée et affichée. Contrôle EPI programmé.",
    duerpRiskFreeText: "Manipulation produits chimiques corrosifs",
    witnesses: ["Fatima El Amrani"],
    measures:
      "Transport SAMU. Bilan ophtalmologique : brûlure superficielle cornée. Arrêt 7 jours. Formation complémentaire manipulation produits chimiques programmée. Révision procédure transvasement.",
    hasWorkStoppage: true,
    workStoppageStartDate: "2026-01-18",
    workStoppageEndDate: "2026-01-24",
    workStoppageDays: 7,
    hasReturnToWorkMedicalConditions: false,
    regulatoryGravity: "G2",
    lesionSites: ["Yeux"],
    lesionNatures: ["Brûlure", "Irritation"],
    correctiveActions: ["Mise à jour consigne sécurité", "Contrôle périodique renforcé"],
    createdAt: "2026-01-18T10:15:00Z",
  },
  {
    id: "3",
    date: "2026-01-10",
    time: "08:45",
    title: "Accident de trajet - collision routière",
    description:
      "Accident de la route sur le trajet domicile-travail. Collision avec un autre véhicule à un carrefour.",
    severity: "modéré",
    type: "trajet",
    accidentCategory: "Trajet",
    accidentEventType: "Accident de la route",
    victim: "Stéphane Moreau",
    victimFirstName: "Stéphane",
    victimLastName: "Moreau",
    location:
      "Carrefour Avenue de la République / Rue Victor Hugo",
    circumstances:
      "Trajet domicile-travail, feu orange clignotant, visibilité réduite par pluie.",
    accidentCauses: "Priorité non respectée par l'autre véhicule selon PV police.",
    causeAnalysis: "Analyse interne : sensibilisation conduite sous intempéries.",
    witnesses: [],
    measures:
      "Déclaration accident de trajet. Arrêt de travail 21 jours. Fracture côte + contusions multiples. Suivi médical en cours.",
    hasWorkStoppage: true,
    workStoppageStartDate: "2026-01-10",
    workStoppageEndDate: "2026-01-30",
    workStoppageDays: 21,
    hasReturnToWorkMedicalConditions: true,
    returnToWorkMedicalConditions:
      "Aménagement de poste temporaire, éviter les déplacements longs jusqu'au prochain avis du médecin du travail.",
    regulatoryGravity: "G3",
    lesionSites: ["Thorax", "Bras"],
    lesionNatures: ["Fracture", "Contusion"],
    correctiveActions: ["Formation complémentaire"],
    comments: "Dossier assurance et déclaration trajet transmis RH.",
    createdAt: "2026-01-10T08:45:00Z",
  },
  {
    id: "4",
    date: "2026-01-05",
    time: "15:20",
    title: "Coupure main - manipulation carton",
    description:
      "Coupure profonde à la main droite lors de l'ouverture d'un carton avec un cutter. Lame a dérapé.",
    severity: "bénin",
    type: "travail",
    accidentCategory: "Travail",
    accidentEventType: "Coupure",
    victim: "Nadia Benali",
    victimFirstName: "Nadia",
    victimLastName: "Benali",
    location: "Réserve, rez-de-chaussée",
    circumstances: "Ouverture cartons en réserve, cutter standard sans lame rétractable.",
    accidentCauses: "Outil inadapté, geste trop appuyé, carton glissant.",
    comments: "Rappel cutters sécurité distribué à l'équipe logistique.",
    witnesses: ["Karim Ziani"],
    measures:
      "Soins infirmerie. Suture 3 points au centre de soins. Arrêt de travail 3 jours. Rappel : utiliser les cutters de sécurité avec lame rétractable.",
    hasWorkStoppage: true,
    workStoppageStartDate: "2026-01-05",
    workStoppageEndDate: "2026-01-07",
    workStoppageDays: 3,
    hasReturnToWorkMedicalConditions: false,
    regulatoryGravity: "G2",
    lesionSites: ["Main"],
    lesionNatures: ["Coupure", "Plaie"],
    correctiveActions: ["Ajout EPI", "Mise à jour consigne sécurité"],
    createdAt: "2026-01-05T15:20:00Z",
  },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const requestLeave = useRequestLeave();
  const { viewId: activeView, categoryId: categoryView } = useMemo(
    () => resolveViewFromPathname(location.pathname),
    [location.pathname],
  );
  const goToView = useCallback(
    (viewId: string, categoryId?: string | null) => {
      requestLeave(() => navigate(getPathForView(viewId, categoryId ?? null)));
    },
    [navigate, requestLeave],
  );
  const risksSkipSyncRef = React.useRef(false);
  const risksReadyRef = React.useRef(!isBackendApiEnabled());
  const adminUsersSkipSyncRef = React.useRef(false);
  const actionsSkipSyncRef = React.useRef(false);
  const accidentsSkipSyncRef = React.useRef(false);
  const notificationsSkipSyncRef = React.useRef(false);
  const mainScrollRef = React.useRef<HTMLElement>(null);
  const actionReturnsSkipSyncRef = React.useRef(false);
  const appDataSkipRef = React.useRef<Record<string, boolean>>({});
  const [risks, setRisks] = useState<Risk[]>(() =>
    isBackendApiEnabled()
      ? loadPersistedRisks() ?? []
      : loadPersistedRisks() ?? FAKE_RISKS,
  );
  const [manualActions, setManualActions] = useState<Action[]>(() =>
    mergeInitialManualActions(
      loadManualActions(),
      PAPRIPACT_2026_ACTION_FIXTURES,
    ),
  );
  const [papripactSignatures, setPapripactSignatures] = useState<
    PapripactSignatureRecord[]
  >(() => loadPapripactSignaturesStorage().length > 0
    ? loadPapripactSignaturesStorage()
    : loadPapripactSignatures());
  const [suppressedAwarenessKeys, setSuppressedAwarenessKeys] = useState<
    string[]
  >(() => loadSuppressedAwarenessKeys());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const stored = loadNotifications();
    if (stored && stored.length > 0) return stored;
    return DEFAULT_APP_NOTIFICATIONS;
  });
  const [adminUsers, setAdminUsers] = useState<AppUser[]>(() => loadAdminUsers(FAKE_USERS));
  const [accessProfiles, setAccessProfiles] = useState<
    Record<string, EmployeeAccessProfile>
  >(() => buildDefaultAccessProfiles(FAKE_USERS));

  React.useEffect(() => {
    setAccessProfiles((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const employee of adminUsers) {
        if (next[employee.id]) continue;
        const created = buildDefaultAccessProfiles([employee])[employee.id];
        if (created) {
          next[employee.id] = created;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [adminUsers]);

  const [riskReferences, setRiskReferences] = useState<
    RiskReference[]
  >(RISK_REFERENCE_FIXTURES);
  const previousRiskReferencesRef = React.useRef<RiskReference[]>(
    riskReferences,
  );
  const [riskAwarenessRecords, setRiskAwarenessRecords] = useState<
    RiskAwarenessRecord[]
  >(() => loadAwarenessRecords() ?? []);
  const [securitySheets, setSecuritySheets] = useState(() =>
    loadSecuritySheets() ?? defaultSecuritySheetsState,
  );
  const [adminServices, setAdminServices] = useState(FAKE_SERVICES);
  const [adminDomains, setAdminDomains] = useState(FAKE_DOMAINS);
  const [adminLocations, setAdminLocations] = useState(FAKE_LOCATIONS);
  const [adminCategories, setAdminCategories] = useState(DEFAULT_ADMIN_CATEGORIES);
  const [accidents, setAccidents] = useState<Accident[]>(() =>
    isBackendApiEnabled() ? [] : FAKE_ACCIDENTS,
  );
  const [actionReturns, setActionReturns] = useState<ActionReturn[]>(() =>
    isBackendApiEnabled() ? [] : ACTION_RETURN_FIXTURES,
  );
  const [adminRoles, setAdminRoles] = useState<Role[]>(DEFAULT_ADMIN_ROLES);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(
    null,
  );
  const [referenceSheetRequest, setReferenceSheetRequest] = useState<{
    numeroRisque: string;
    title: string;
  } | null>(null);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [riskToEdit, setRiskToEdit] = useState<Risk | null>(
    null,
  );
  const [riskDeleteDialogOpen, setRiskDeleteDialogOpen] =
    useState(false);
  const [riskToDelete, setRiskToDelete] = useState<
    string | null
  >(null);

  const parseMultiValues = (value?: string) =>
    (value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  const canAccessRisk = (risk: Risk) => {
    if (!user) return false;
    const directoryRole = adminUsers.find((person) => {
      const sameEmail =
        Boolean(person.email) &&
        Boolean(user.email) &&
        person.email.toLowerCase() === user.email.toLowerCase();
      const sameName =
        `${person.firstName} ${person.lastName}`.toLowerCase() ===
        (user.name || "").toLowerCase();
      return sameEmail || person.id === user.id || sameName;
    })?.role;
    if (user.role === "admin" || (directoryRole && presetForRoleCode(directoryRole) === "admin")) {
      return true;
    }

    const userServices = parseMultiValues(user.service);
    const userDomains = parseMultiValues(user.domain);
    const userLocations = parseMultiValues(user.location);

    const riskServices = parseMultiValues(risk.service);
    const riskDomains = parseMultiValues(risk.domain || risk.unite);
    const riskLocations = parseMultiValues(risk.site);

    const serviceMatch =
      userServices.length === 0 ||
      userServices.some((service) => riskServices.includes(service));
    const domainMatch =
      userDomains.length === 0 ||
      userDomains.some((domain) => riskDomains.includes(domain));
    const locationMatch =
      userLocations.length === 0 ||
      userLocations.some((location) => riskLocations.includes(location));

    return serviceMatch && domainMatch && locationMatch;
  };

  const visibleRisks = risks.filter(canAccessRisk);
  const [riskEvaluationFilters, setRiskEvaluationFilters] =
    useState<RiskEvaluationFilters>(emptyRiskEvaluationFilters());
  const [riskSearchQuery, setRiskSearchQuery] = useState("");
  const [riskCurrentPage, setRiskCurrentPage] = useState(1);
  const riskPageSize = 6;

  const filteredVisibleRisks = React.useMemo(() => {
    return visibleRisks.filter((risk) =>
      matchesRiskEvaluationFilters(risk, riskEvaluationFilters, riskSearchQuery),
    );
  }, [visibleRisks, riskEvaluationFilters, riskSearchQuery]);

  const totalRiskPages = Math.max(
    1,
    Math.ceil(filteredVisibleRisks.length / riskPageSize),
  );
  const paginatedRisks = React.useMemo(() => {
    const start = (riskCurrentPage - 1) * riskPageSize;
    return filteredVisibleRisks.slice(start, start + riskPageSize);
  }, [filteredVisibleRisks, riskCurrentPage]);

  React.useEffect(() => {
    setRiskCurrentPage(1);
  }, [riskEvaluationFilters, riskSearchQuery]);

  React.useEffect(() => {
    if (riskCurrentPage > totalRiskPages) {
      setRiskCurrentPage(totalRiskPages);
    }
  }, [riskCurrentPage, totalRiskPages]);

  const serviceOptions = adminServices.map((s) => s.name);
  const domainOptions = adminDomains.map((d) => d.name);
  const locationOptions = adminLocations.map((l) => l.name);
  const concernedPersons = adminUsers.map((user) => ({
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    service: user.service || "",
    domain: user.domain || "",
    location: user.location || "",
  }));

  const splitCsvValues = (value?: string) =>
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const pickCatalogValue = (
    rawValues: string[],
    allowedValues: string[],
  ) => {
    const allowedByKey = new Map(
      allowedValues.map((value) => [value.toLowerCase(), value]),
    );
    for (const raw of rawValues) {
      const match = allowedByKey.get(raw.toLowerCase());
      if (match) return match;
    }
    return "";
  };

  const normalizeRiskWithCatalog = (risk: Risk): Risk => {
    const normalizedService = pickCatalogValue(
      splitCsvValues(risk.service),
      serviceOptions,
    ) || serviceOptions[0] || "";

    const selectedServiceConfig = adminServices.find(
      (service) => service.name === normalizedService,
    );

    const allowedDomains =
      selectedServiceConfig?.domains?.filter((domain) =>
        domainOptions.includes(domain),
      ) || domainOptions;
    const allowedLocations =
      selectedServiceConfig?.locations?.filter((location) =>
        locationOptions.includes(location),
      ) || locationOptions;

    const normalizedDomain =
      pickCatalogValue(
        splitCsvValues(risk.domain || risk.unite),
        allowedDomains,
      ) || allowedDomains[0] || "";
    const normalizedLocation =
      pickCatalogValue(splitCsvValues(risk.site), allowedLocations) ||
      allowedLocations[0] ||
      "";

    return {
      ...risk,
      service: normalizedService,
      domain: normalizedDomain,
      unite: risk.unite?.trim() || normalizedDomain,
      site: normalizedLocation,
    };
  };

  React.useEffect(() => {
    setRisks((previousRisks) => {
      const normalizedRisks = previousRisks.map((risk) =>
        normalizeRiskWithCatalog(risk),
      );
      const hasChanges = normalizedRisks.some((risk, index) => {
        const currentRisk = previousRisks[index];
        return (
          currentRisk.service !== risk.service ||
          (currentRisk.domain || "") !== (risk.domain || "") ||
          (currentRisk.unite || "") !== (risk.unite || "") ||
          (currentRisk.site || "") !== (risk.site || "")
        );
      });

      return hasChanges ? normalizedRisks : previousRisks;
    });
  }, [adminServices, adminDomains, adminLocations]);

  React.useEffect(() => {
    const previousReferences = previousRiskReferencesRef.current;
    const previousById = new Map(
      previousReferences.map((reference) => [reference.id, reference]),
    );
    const changedReferences = riskReferences
      .map((reference) => ({
        current: reference,
        previous: previousById.get(reference.id),
      }))
      .filter(
        ({ current, previous }) =>
          previous &&
          (previous.numeroRisque !== current.numeroRisque ||
            previous.title !== current.title),
      ) as Array<{
      current: RiskReference;
      previous: RiskReference;
    }>;

    if (changedReferences.length === 0) {
      previousRiskReferencesRef.current = riskReferences;
      return;
    }

    setRisks((previousRisks) => {
      let hasChanges = false;
      const updatedRisks = previousRisks.map((risk) => {
        const matchingReference = changedReferences.find(
          ({ previous }) =>
            risk.numeroRisque === previous.numeroRisque &&
            risk.title === previous.title,
        );

        if (!matchingReference) return risk;

        hasChanges = true;
        return {
          ...risk,
          title: matchingReference.current.title,
          updatedAt: new Date().toISOString(),
        };
      });

      return hasChanges ? updatedRisks : previousRisks;
    });

    previousRiskReferencesRef.current = riskReferences;
  }, [riskReferences]);

  const hydrateRisksFromApi = React.useCallback(
    async (token: string, installOfficialBase: boolean) => {
      try {
        let fromApi = await fetchRisksFromApi(token);
        if (installOfficialBase) {
          try {
            const wrote = await ensureOfficialDuerpRiskBase(fromApi, token);
            if (wrote) {
              fromApi = await fetchRisksFromApi(token);
              toast.success(
                `Base des risques du classeur chargée (${fromApi.length} risques).`,
              );
            }
          } catch (error) {
            console.error("[Lecompas] import base risques", error);
            toast.error(
              "Le remplacement de la base des risques a échoué. Les données affichées sont inchangées.",
            );
          }
        }
        risksSkipSyncRef.current = true;
        setRisks(fromApi);
      } finally {
        risksReadyRef.current = true;
      }
    },
    [],
  );

  const hydrateAdminUsersFromApi = React.useCallback(
    async (token: string, isAdmin: boolean) => {
      adminUsersSkipSyncRef.current = true;
      try {
        const fromApi = await fetchAdminUsers(token);
        if (fromApi.length > 0) {
          setAdminUsers(fromApi);
          return;
        }
      } catch (error) {
        console.warn("[Lecompas] chargement annuaire API", error);
        return;
      }

      const local = loadAdminUsers(FAKE_USERS);
      setAdminUsers(local);
      if (!isAdmin) {
        return;
      }

      adminUsersSkipSyncRef.current = false;
      try {
        await syncAdminUsersToApi(local, token);
        adminUsersSkipSyncRef.current = true;
        const refreshed = await fetchAdminUsers(token);
        if (refreshed.length > 0) {
          setAdminUsers(refreshed);
        }
      } catch (error) {
        console.error("[Lecompas] sync annuaire API", error);
        toast.error("Synchronisation des comptes avec le serveur impossible");
      }
    },
    [],
  );

  const getLocalManualActions = React.useCallback(
    () =>
      mergeInitialManualActions(
        loadManualActions(),
        PAPRIPACT_2026_ACTION_FIXTURES,
      ),
    [],
  );

  const getLocalNotifications = React.useCallback(() => {
    const stored = loadNotifications();
    if (stored && stored.length > 0) return stored;
    return DEFAULT_APP_NOTIFICATIONS;
  }, []);

  const hydrateActionsFromApi = React.useCallback(
    async (token: string) => {
      actionsSkipSyncRef.current = true;
      try {
        const fromApi = await fetchActionsFromApi(token);
        if (fromApi.length > 0) {
          const completed = completePapripactFromFixtures(
            fromApi,
            PAPRIPACT_2026_ACTION_FIXTURES,
          );
          if (completed !== fromApi) actionsSkipSyncRef.current = false;
          setManualActions(completed);
          return;
        }
      } catch (error) {
        console.warn("[Lecompas] chargement actions API", error);
        return;
      }
      const local = getLocalManualActions();
      setManualActions(local);
      if (local.length === 0) return;
      actionsSkipSyncRef.current = false;
      try {
        await syncActionsToApi(local, token);
        actionsSkipSyncRef.current = true;
        const refreshed = await fetchActionsFromApi(token);
        if (refreshed.length > 0) setManualActions(refreshed);
      } catch (error) {
        console.error("[Lecompas] sync actions API", error);
        toast.error("Synchronisation du plan d’action avec le serveur impossible");
      }
    },
    [getLocalManualActions],
  );

  const hydrateAccidentsFromApi = React.useCallback(async (token: string) => {
    accidentsSkipSyncRef.current = true;
    try {
      const fromApi = await fetchAccidentsFromApi(token);
      if (fromApi.length > 0) {
        setAccidents(fromApi as Accident[]);
        return;
      }
    } catch (error) {
      console.warn("[Lecompas] chargement accidents API", error);
      return;
    }
    setAccidents(FAKE_ACCIDENTS);
    accidentsSkipSyncRef.current = false;
    try {
      await syncAccidentsToApi(FAKE_ACCIDENTS, token);
      accidentsSkipSyncRef.current = true;
      const refreshed = await fetchAccidentsFromApi(token);
      if (refreshed.length > 0) setAccidents(refreshed as Accident[]);
    } catch (error) {
      console.error("[Lecompas] sync accidents API", error);
      toast.error("Synchronisation des accidents avec le serveur impossible");
    }
  }, []);

  const hydrateNotificationsFromApi = React.useCallback(
    async (token: string) => {
      notificationsSkipSyncRef.current = true;
      try {
        const fromApi = await fetchNotificationsFromApi(token);
        if (fromApi.length > 0) {
          setNotifications(fromApi);
          return;
        }
      } catch (error) {
        console.warn("[Lecompas] chargement notifications API", error);
        return;
      }
      const local = getLocalNotifications();
      setNotifications(local);
      if (local.length === 0) return;
      notificationsSkipSyncRef.current = false;
      try {
        await syncNotificationsToApi(local, token);
        notificationsSkipSyncRef.current = true;
        const refreshed = await fetchNotificationsFromApi(token);
        if (refreshed.length > 0) setNotifications(refreshed);
      } catch (error) {
        console.error("[Lecompas] sync notifications API", error);
        toast.error("Synchronisation des notifications avec le serveur impossible");
      }
    },
    [getLocalNotifications],
  );

  const hydrateActionReturnsFromApi = React.useCallback(
    async (token: string) => {
      actionReturnsSkipSyncRef.current = true;
      try {
        const fromApi = await fetchActionReturnsFromApi(token);
        if (fromApi.length > 0) {
          setActionReturns(fromApi);
          return;
        }
      } catch (error) {
        console.warn("[Lecompas] chargement retours d’action API", error);
        return;
      }
      setActionReturns(ACTION_RETURN_FIXTURES);
      actionReturnsSkipSyncRef.current = false;
      try {
        await syncActionReturnsToApi(ACTION_RETURN_FIXTURES, token);
        actionReturnsSkipSyncRef.current = true;
        const refreshed = await fetchActionReturnsFromApi(token);
        if (refreshed.length > 0) setActionReturns(refreshed);
      } catch (error) {
        console.error("[Lecompas] sync retours d’action API", error);
        toast.error(
          "Synchronisation des retours d’action avec le serveur impossible",
        );
      }
    },
    [],
  );

  const hydrateOrganizationFromApi = React.useCallback(async (token: string) => {
    await hydrateAppDataValue<OrganizationSnapshot>({
      key: APP_DATA_KEYS.organization,
      token,
      skipRef: appDataSkipRef,
      setValue: (snapshot) => {
        const defaults = {
          services: FAKE_SERVICES,
          domains: FAKE_DOMAINS,
          locations: FAKE_LOCATIONS,
          categories: DEFAULT_ADMIN_CATEGORIES,
        };
        const safe = normalizeOrganizationSnapshot(snapshot, defaults);
        setAdminServices(safe.services);
        setAdminDomains(safe.domains);
        setAdminLocations(safe.locations);
        setAdminCategories(
          safe.categories.length ? safe.categories : DEFAULT_ADMIN_CATEGORIES,
        );
      },
      getDefault: () => ({
        services: FAKE_SERVICES,
        domains: FAKE_DOMAINS,
        locations: FAKE_LOCATIONS,
        categories: DEFAULT_ADMIN_CATEGORIES,
      }),
      getLocal: () => null,
    });
  }, []);

  const hydrateAccessProfilesFromApi = React.useCallback(
    async (token: string) => {
      await hydrateAppDataValue<Record<string, EmployeeAccessProfile>>({
        key: APP_DATA_KEYS.accessProfiles,
        token,
        skipRef: appDataSkipRef,
        setValue: setAccessProfiles,
        getDefault: () => buildDefaultAccessProfiles(FAKE_USERS),
        getLocal: () => null,
      });
    },
    [],
  );

  const hydrateRiskReferencesFromApi = React.useCallback(async (token: string) => {
    await hydrateAppDataValue<RiskReference[]>({
      key: APP_DATA_KEYS.riskReferences,
      token,
      skipRef: appDataSkipRef,
      setValue: setRiskReferences,
      getDefault: () => RISK_REFERENCE_FIXTURES,
      getLocal: () => null,
    });
  }, []);

  const hydrateSecuritySheetsFromApi = React.useCallback(async (token: string) => {
    await hydrateAppDataValue({
      key: APP_DATA_KEYS.securitySheets,
      token,
      skipRef: appDataSkipRef,
      setValue: setSecuritySheets,
      getDefault: () => defaultSecuritySheetsState,
      getLocal: () => loadSecuritySheets(),
    });
  }, []);

  const hydrateAwarenessFromApi = React.useCallback(async (token: string) => {
    await hydrateAppDataValue<RiskAwarenessRecord[]>({
      key: APP_DATA_KEYS.awarenessRecords,
      token,
      skipRef: appDataSkipRef,
      setValue: setRiskAwarenessRecords,
      getDefault: () => [],
      getLocal: () => loadAwarenessRecords(),
    });
  }, []);

  const hydrateSuppressedAwarenessFromApi = React.useCallback(
    async (token: string) => {
      await hydrateAppDataValue<string[]>({
        key: APP_DATA_KEYS.suppressedAwarenessKeys,
        token,
        skipRef: appDataSkipRef,
        setValue: setSuppressedAwarenessKeys,
        getDefault: () => [],
        getLocal: () => loadSuppressedAwarenessKeys(),
      });
    },
    [],
  );

  const hydrateAdminRolesFromApi = React.useCallback(async (token: string) => {
    await hydrateAppDataValue<Role[]>({
      key: APP_DATA_KEYS.adminRoles,
      token,
      skipRef: appDataSkipRef,
      setValue: setAdminRoles,
      getDefault: () => DEFAULT_ADMIN_ROLES,
      getLocal: () => DEFAULT_ADMIN_ROLES,
    });
  }, []);

  const hydratePapripactSignaturesFromApi = React.useCallback(
    async (token: string) => {
      await hydrateAppDataValue<PapripactSignatureRecord[]>({
        key: APP_DATA_KEYS.papripactSignatures,
        token,
        skipRef: appDataSkipRef,
        setValue: setPapripactSignatures,
        getDefault: () =>
          loadPapripactSignaturesStorage().length > 0
            ? loadPapripactSignaturesStorage()
            : loadPapripactSignatures(),
        getLocal: () =>
          loadPapripactSignaturesStorage().length > 0
            ? loadPapripactSignaturesStorage()
            : loadPapripactSignatures(),
      });
    },
    [],
  );

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      if (!isBackendApiEnabled()) savePersistedRisks(risks);
      return;
    }
    if (!risksReadyRef.current) return;
    if (risksSkipSyncRef.current) {
      risksSkipSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void syncRisksToApi(risks, accessToken).catch((error) => {
        console.error("[Lecompas] sync risques API", error);
        toast.error("Synchronisation des risques avec le serveur impossible");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [risks, accessToken]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveAdminUsers(adminUsers);
      return;
    }
    if (adminUsersSkipSyncRef.current) {
      adminUsersSkipSyncRef.current = false;
      return;
    }
    if (user?.role !== "admin") {
      return;
    }
    const timer = window.setTimeout(() => {
      void syncAdminUsersToApi(adminUsers, accessToken).catch((error) => {
        console.error("[Lecompas] sync comptes API", error);
        toast.error("Synchronisation des comptes avec le serveur impossible");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [adminUsers, accessToken, user?.role]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveManualActions(manualActions);
      return;
    }
    if (actionsSkipSyncRef.current) {
      actionsSkipSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void syncActionsToApi(manualActions, accessToken).catch((error) => {
        console.error("[Lecompas] sync actions API", error);
        toast.error("Synchronisation du plan d’action avec le serveur impossible");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [manualActions, accessToken]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      return;
    }
    if (accidentsSkipSyncRef.current) {
      accidentsSkipSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void syncAccidentsToApi(accidents, accessToken).catch((error) => {
        console.error("[Lecompas] sync accidents API", error);
        toast.error("Synchronisation des accidents avec le serveur impossible");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [accidents, accessToken]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveNotifications(notifications);
      return;
    }
    if (notificationsSkipSyncRef.current) {
      notificationsSkipSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void syncNotificationsToApi(notifications, accessToken).catch((error) => {
        console.error("[Lecompas] sync notifications API", error);
        toast.error("Synchronisation des notifications avec le serveur impossible");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [notifications, accessToken]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      return;
    }
    if (actionReturnsSkipSyncRef.current) {
      actionReturnsSkipSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void syncActionReturnsToApi(actionReturns, accessToken).catch((error) => {
        console.error("[Lecompas] sync retours d’action API", error);
        toast.error(
          "Synchronisation des retours d’action avec le serveur impossible",
        );
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [actionReturns, accessToken]);

  const previousRisksRef = React.useRef<Risk[] | null>(null);
  React.useEffect(() => {
    const previousRisks = previousRisksRef.current;
    previousRisksRef.current = risks;

    setRisks((prev) => {
      let changed = false;
      const next = prev.map((risk) => {
        if (!risk.detachedFromReference || !risk.title.trim()) return risk;
        changed = true;
        return { ...risk, detachedFromReference: false };
      });
      return changed ? next : prev;
    });

    if (previousRisks) {
      const freshKeys = risks
        .filter((risk) => !previousRisks.some((before) => String(before.id) === String(risk.id)))
        .map((risk) => buildRiskAwarenessKey(risk));
      if (freshKeys.length > 0) {
        setSuppressedAwarenessKeys((prev) => {
          const next = prev.filter((key) => !freshKeys.includes(key));
          return next.length === prev.length ? prev : next;
        });
      }
    }

    const titleIsCatalog = (title: string) =>
      riskReferences.some((reference) => normalizeRiskTitle(reference.title) === normalizeRiskTitle(title));

    setRiskAwarenessRecords((previous) => {
      let records = previous;
      if (previousRisks) {
        previousRisks.forEach((before) => {
          const after = risks.find((risk) => String(risk.id) === String(before.id));
          if (!after || normalizeRiskTitle(before.title) === normalizeRiskTitle(after.title)) return;
          const oldNorm = normalizeRiskTitle(before.title);
          const stillUsed = risks.some((risk) => normalizeRiskTitle(risk.title) === oldNorm);
          if (stillUsed || titleIsCatalog(before.title) || titleIsCatalog(after.title)) return;
          const oldKey = buildRiskAwarenessKey(before);
          const newKey = buildRiskAwarenessKey(after);
          records = records.map((record) =>
            record.riskKey === oldKey || normalizeRiskTitle(record.riskTitle) === oldNorm
              ? {
                  ...record,
                  riskKey: newKey,
                  riskNumber: after.numeroRisque,
                  riskTitle: after.title,
                }
              : record,
          );
        });
      }

      const sourceByKey = new Map<
        string,
        { riskNumber: string; riskTitle: string }
      >();

      riskReferences.forEach((reference) => {
        const key = `${reference.numeroRisque}::${reference.title}`;
        sourceByKey.set(key, {
          riskNumber: reference.numeroRisque,
          riskTitle: reference.title,
        });
      });

      risks.forEach((risk) => {
        if (!risk.title.trim() || risk.detachedFromReference) return;
        const key = `${risk.numeroRisque}::${risk.title}`;
        sourceByKey.set(key, {
          riskNumber: risk.numeroRisque,
          riskTitle: risk.title,
        });
      });

      const previousByRiskKey = new Map<string, RiskAwarenessRecord[]>();
      records.forEach((record) => {
        const bucket = previousByRiskKey.get(record.riskKey) || [];
        bucket.push(record);
        previousByRiskKey.set(record.riskKey, bucket);
      });

      const nextRecords: RiskAwarenessRecord[] = [];

      sourceByKey.forEach((source, riskKey) => {
        const existingRecords = previousByRiskKey.get(riskKey) || [];
        if (existingRecords.length > 0) {
          const titleInCatalog = riskReferences.some(
            (reference) => normalizeRiskTitle(reference.title) === normalizeRiskTitle(source.riskTitle),
          );
          nextRecords.push(
            ...existingRecords.map((existing) => ({
              ...existing,
              riskNumber: titleInCatalog
                ? source.riskNumber
                : existing.riskNumber.trim() || source.riskNumber,
              riskTitle: source.riskTitle,
            })),
          );
          return;
        }

        if (suppressedAwarenessKeys.includes(riskKey)) {
          return;
        }

        nextRecords.push({
          id: crypto.randomUUID(),
          riskKey,
          riskNumber: source.riskNumber,
          riskTitle: source.riskTitle,
          summary: "",
          content: "",
          links: [],
          documents: [],
          status: "a_completer",
        });
      });

      records.forEach((record) => {
        if (!sourceByKey.has(record.riskKey) && record.riskTitle.trim()) {
          nextRecords.push(record);
        }
      });

      const catalogTitles = new Set(riskReferences.map((reference) => normalizeRiskTitle(reference.title)));
      const usedNumbers = new Set(
        riskReferences.map((reference) => reference.numeroRisque.trim()).filter(Boolean),
      );
      return nextRecords.map((record) => {
        if (!record.riskTitle.trim() || catalogTitles.has(normalizeRiskTitle(record.riskTitle))) {
          return record;
        }
        const current = record.riskNumber.trim();
        if (current && !usedNumbers.has(current)) {
          usedNumbers.add(current);
          return record;
        }
        const next = nextRiskNumber(usedNumbers);
        usedNumbers.add(next);
        return current === next ? record : { ...record, riskNumber: next };
      });
    });
  }, [riskReferences, risks, suppressedAwarenessKeys]);

  React.useEffect(() => {
    const catalogTitles = new Set(riskReferences.map((reference) => normalizeRiskTitle(reference.title)));
    const visibleRecords = riskAwarenessRecords.filter(
      (record) =>
        record.riskTitle.trim() &&
        !catalogTitles.has(normalizeRiskTitle(record.riskTitle)),
    );
    const planned = denseRiskNumbers([
      ...riskReferences.map((reference) => ({ id: reference.id, numero: reference.numeroRisque })),
      ...visibleRecords.map((record) => ({ id: record.id, numero: record.riskNumber })),
    ]);
    const referencesNeedUpdate = riskReferences.some(
      (reference) => planned.get(reference.id) !== reference.numeroRisque,
    );
    if (referencesNeedUpdate) {
      setRiskReferences((current) =>
        current.map((reference) => {
          const next = planned.get(reference.id);
          if (!next || next === reference.numeroRisque) return reference;
          return { ...stickReferenceContent(reference), numeroRisque: next };
        }),
      );
    }
    const recordsNeedUpdate = visibleRecords.some(
      (record) => planned.get(record.id) !== record.riskNumber,
    );
    if (recordsNeedUpdate) {
      setRiskAwarenessRecords((current) =>
        current.map((record) => {
          const next = planned.get(record.id);
          if (!next || next === record.riskNumber) return record;
          return { ...record, riskNumber: next };
        }),
      );
    }
  }, [riskReferences, riskAwarenessRecords]);

  const resolveDemoUser = (
    email: string,
    fallback: {
      name: string;
      role: User["role"];
      service: string;
      domain: string;
      location: string;
    },
  ): User => {
    const lookupEmail = resolveDirectoryEmail(email);
    const adminUser = adminUsers.find(
      (u) =>
        (u.email ?? "").toLowerCase() === lookupEmail.toLowerCase(),
    );
    if (adminUser) {
      return directoryUserToSessionUser(adminUser, fallback.role);
    }
    return {
      id: `user-${lookupEmail}`,
      email: lookupEmail,
      ...fallback,
    };
  };

  const persistSessionUser = (
    resolvedUser: User,
    token: string,
    rememberMe: boolean,
  ) => {
    startTransition(() => {
      setUser(resolvedUser);
      setAccessToken(token);
      setIsAuthenticated(true);

      writeAuthSession(resolvedUser, token, rememberMe);
    });
  };

  const completeDemoLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<boolean> => {
    const demoAccount = DEMO_LOGIN_ACCOUNTS.find(
      (acc) => acc.email === email && acc.password === password,
    );

    const directoryLookupEmail = resolveDirectoryEmail(email);
    const directoryUser = adminUsers.find(
      (u) =>
        (u.email ?? "").toLowerCase() === email.toLowerCase() ||
        (u.email ?? "").toLowerCase() === directoryLookupEmail.toLowerCase(),
    );
    const directoryMatch =
      directoryUser &&
      directoryUser.password &&
      directoryUser.password === password;

    if (!demoAccount && !directoryMatch) {
      return false;
    }

    const loginEmail = demoAccount?.email ?? directoryUser!.email;
    const demoRoleByEmail: Record<string, User["role"]> = {
      "admin@dirm-med.gouv.fr": "admin",
      "chef@dirm-med.gouv.fr": "chef_service",
      "agent@dirm-med.gouv.fr": "agent",
    };
    const fallback = demoAccount
      ? {
          email: loginEmail,
          password,
          name:
            directoryUser != null
              ? appUserDisplayName(directoryUser)
              : loginEmail,
          role: (directoryUser
            ? sessionRoleFromAppRole(directoryUser.role)
            : demoRoleByEmail[demoAccount.email] ?? "agent") as User["role"],
          service: directoryUser?.service ?? "",
          domain: directoryUser?.domain ?? "",
          location: directoryUser?.location ?? "",
        }
      : {
          email: directoryUser!.email,
          password,
          name: appUserDisplayName(directoryUser!),
          role: sessionRoleFromAppRole(directoryUser!.role),
          service: directoryUser!.service,
          domain: directoryUser!.domain,
          location: directoryUser!.location,
        };

    const token = `token-${Date.now()}`;
    const resolvedUser = resolveDemoUser(loginEmail, {
      name: fallback.name,
      role: fallback.role,
      service: fallback.service,
      domain: fallback.domain,
      location: fallback.location,
    });

    persistSessionUser(resolvedUser, token, rememberMe);
    return true;
  };

  // Handle Login
  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<boolean> => {
    if (isBackendApiEnabled()) {
      try {
        const { access_token, user: apiUser } = await loginWithApi(
          email,
          password,
        );
        setStoredAccessToken(access_token);

        const directoryUser = adminUsers.find(
          (u) => u.email.toLowerCase() === apiUser.email.toLowerCase(),
        );
        const resolvedUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: mapApiRoleToSessionRole(apiUser.role),
          service: apiUser.service || directoryUser?.service || "",
          domain: apiUser.domain || directoryUser?.domain,
          location: apiUser.location || directoryUser?.location,
        };

        persistSessionUser(resolvedUser, access_token, rememberMe);
        await Promise.all([
          hydrateRisksFromApi(access_token, resolvedUser.role === "admin"),
          hydrateAdminUsersFromApi(
            access_token,
            resolvedUser.role === "admin",
          ),
          hydrateActionsFromApi(access_token),
          hydrateAccidentsFromApi(access_token),
          hydrateNotificationsFromApi(access_token),
          hydrateActionReturnsFromApi(access_token),
          hydrateOrganizationFromApi(access_token),
          hydrateAccessProfilesFromApi(access_token),
          hydrateRiskReferencesFromApi(access_token),
          hydrateSecuritySheetsFromApi(access_token),
          hydrateAwarenessFromApi(access_token),
          hydrateSuppressedAwarenessFromApi(access_token),
          hydrateAdminRolesFromApi(access_token),
          hydratePapripactSignaturesFromApi(access_token),
        ]);
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return false;
        }
        console.warn("[Lecompas] login API indisponible", error);
        toast.error(
          "Serveur indisponible. Vérifiez l’API ou le réseau intranet.",
        );
        return false;
      }
    }

    if (!isDemoLoginAllowed()) return false;
    return completeDemoLogin(email, password, rememberMe);
  };

  // Handle Logout
  const handleLogout = (reason?: "expired") => {
    setUser(null);
    setAccessToken("");
    setIsAuthenticated(false);
    navigate(DEFAULT_AUTHENTICATED_PATH);
    clearAuthSession();
    setStoredAccessToken(null);
    queueMicrotask(() =>
      toast.info(
        reason === "expired"
          ? "Session expirée. Reconnectez-vous."
          : "Déconnexion réussie",
      ),
    );
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement
  React.useEffect(() => {
    const saved = readAuthSession();
    if (!saved) return;
    const savedToken = saved.token;
    const savedUser = saved.userJson;

    const restoreDemoSession = (userData: User) => {
      const synced = syncSessionWithDirectory(userData, FAKE_USERS);
      setUser(synced);
      setAccessToken(savedToken);
      setIsAuthenticated(true);
    };

    try {
      const userData = JSON.parse(savedUser) as User;

      if (isBackendApiEnabled() && isApiAccessToken(savedToken)) {
        void (async () => {
          const profile = await fetchProfile(savedToken);
          if (!profile) {
            clearAuthSession();
            setStoredAccessToken(null);
            return;
          }
          restoreDemoSession({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: userData.role === "rh" ? "rh" : mapApiRoleToSessionRole(profile.role),
            service: profile.service ?? userData.service ?? "",
            domain: profile.domain ?? userData.domain,
            location: profile.location ?? userData.location,
          });
          const restoredRole = mapApiRoleToSessionRole(profile.role);
          await Promise.all([
            hydrateRisksFromApi(savedToken, restoredRole === "admin"),
            hydrateAdminUsersFromApi(savedToken, restoredRole === "admin"),
            hydrateActionsFromApi(savedToken),
            hydrateAccidentsFromApi(savedToken),
            hydrateNotificationsFromApi(savedToken),
            hydrateActionReturnsFromApi(savedToken),
            hydrateOrganizationFromApi(savedToken),
            hydrateAccessProfilesFromApi(savedToken),
            hydrateRiskReferencesFromApi(savedToken),
            hydrateSecuritySheetsFromApi(savedToken),
            hydrateAwarenessFromApi(savedToken),
            hydrateSuppressedAwarenessFromApi(savedToken),
            hydrateAdminRolesFromApi(savedToken),
            hydratePapripactSignaturesFromApi(savedToken),
          ]);
        })();
        return;
      }

      restoreDemoSession({
        id: userData.id ?? `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        service: userData.service ?? "",
        domain: userData.domain,
        location: userData.location,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données utilisateur",
        error,
      );
      clearAuthSession();
      setStoredAccessToken(null);
    }
  }, [
    hydrateRisksFromApi,
    hydrateAdminUsersFromApi,
    hydrateActionsFromApi,
    hydrateAccidentsFromApi,
    hydrateNotificationsFromApi,
    hydrateActionReturnsFromApi,
    hydrateOrganizationFromApi,
    hydrateAccessProfilesFromApi,
    hydrateRiskReferencesFromApi,
    hydrateSecuritySheetsFromApi,
    hydrateAwarenessFromApi,
    hydrateSuppressedAwarenessFromApi,
    hydrateAdminRolesFromApi,
    hydratePapripactSignaturesFromApi,
  ]);

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;
    const synced = syncSessionWithDirectory(user, adminUsers);
    if (!sessionUsersMatch(user, synced)) {
      setUser(synced);
      updateStoredSessionUser(synced);
    }
  }, [adminUsers, isAuthenticated, user]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const expireIfNeeded = () => {
      if (!readAuthSession()) handleLogout("expired");
    };
    const onActivity = () => {
      if (!readAuthSession()) {
        handleLogout("expired");
        return;
      }
      touchAuthActivity();
    };
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    const timer = window.setInterval(expireIfNeeded, 60_000);
    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.clearInterval(timer);
    };
  }, [isAuthenticated]);

  const organizationSnapshot = useMemo<OrganizationSnapshot>(
    () => ({
      services: adminServices,
      domains: adminDomains,
      locations: adminLocations,
      categories: adminCategories,
    }),
    [adminServices, adminDomains, adminLocations, adminCategories],
  );

  useAppDataBackendSync(
    APP_DATA_KEYS.organization,
    organizationSnapshot,
    accessToken,
    appDataSkipRef,
    () => {},
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.accessProfiles,
    accessProfiles,
    accessToken,
    appDataSkipRef,
    () => {},
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.riskReferences,
    riskReferences,
    accessToken,
    appDataSkipRef,
    () => {},
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.securitySheets,
    securitySheets,
    accessToken,
    appDataSkipRef,
    saveSecuritySheets,
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.awarenessRecords,
    riskAwarenessRecords,
    accessToken,
    appDataSkipRef,
    saveAwarenessRecords,
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.suppressedAwarenessKeys,
    suppressedAwarenessKeys,
    accessToken,
    appDataSkipRef,
    saveSuppressedAwarenessKeys,
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.adminRoles,
    adminRoles,
    accessToken,
    appDataSkipRef,
    () => {},
  );
  useAppDataBackendSync(
    APP_DATA_KEYS.papripactSignatures,
    papripactSignatures,
    accessToken,
    appDataSkipRef,
    (records) => {
      savePapripactSignaturesStorage(records);
      savePapripactSignatures(records);
    },
  );

  const serviceNames = useMemo(
    () => adminServices.map((s) => s.name),
    [adminServices],
  );
  const domainNames = useMemo(
    () => adminDomains.map((d) => d.name),
    [adminDomains],
  );
  const locationNames = useMemo(
    () => adminLocations.map((l) => l.name),
    [adminLocations],
  );

  React.useEffect(() => {
    if (selectedRisk && !canAccessRisk(selectedRisk)) {
      setSelectedRisk(null);
      setIsEditingRisk(false);
    }
  }, [selectedRisk, risks, user]);

  React.useEffect(() => {
    setRisks((previous) => {
      if (previous.every((risk) => risk.id)) return previous;
      const used = new Set(previous.map((risk) => risk.id).filter(Boolean));
      return previous.map((risk, index) => {
        if (risk.id) return risk;
        let id = `risk-${Date.now()}-${index}`;
        while (used.has(id)) id = `${id}-x`;
        used.add(id);
        return { ...risk, id };
      });
    });
  }, [risks]);

  React.useEffect(() => {
    if (activeView !== "retour_action" || !selectedRisk) return;
    const fresh = selectedRisk.id
      ? risks.find((risk) => risk.id === selectedRisk.id)
      : undefined;
    if (!fresh) {
      setSelectedRisk(null);
      return;
    }
    if (fresh !== selectedRisk) setSelectedRisk(fresh);
  }, [activeView, risks, selectedRisk]);

  React.useEffect(() => {
    if (isBackendApiEnabled()) return;
    if (risks.length === 0 || risks.some((risk) => !risk.id)) return;
    const samples = previewActionReturnsForRisks(risks);
    setActionReturns((prev) => {
      const missing = samples.filter((sample) => !prev.some((item) => item.id === sample.id));
      return missing.length === 0 ? prev : [...missing, ...prev];
    });
  }, [risks]);

  const [actionReturnsCurrentPage, setActionReturnsCurrentPage] =
    useState(1);
  const [actionReturnsDisplay, setActionReturnsDisplay] = useState<"cards" | "table">("cards");
  const [actionReturnsSearch, setActionReturnsSearch] = useState("");
  const [actionReturnsServiceFilter, setActionReturnsServiceFilter] =
    useState("all");
  const [actionReturnsAuthorFilter, setActionReturnsAuthorFilter] =
    useState("all");
  const [actionReturnsRiskFilter, setActionReturnsRiskFilter] =
    useState("all");
  const ACTION_RETURNS_PAGE_SIZE = 6;
  const riskLinkedToActionReturn = (actionReturn: { riskId: string }) =>
    risks.find((risk) => risk.id !== "" && risk.id === actionReturn.riskId);
  const pendingActionReturns = actionReturns.filter(
    (ar) => ar.status === "pending" && riskLinkedToActionReturn(ar),
  );
  const filteredPendingActionReturns = pendingActionReturns.filter(
    (actionReturn) => {
      const linkedRisk = riskLinkedToActionReturn(actionReturn);
      const service = linkedRisk?.service || "";
      const site = linkedRisk?.site || "";
      const riskTitle =
        linkedRisk?.title || actionReturn.riskTitle || "";
      const searchBlob = [
        actionReturn.proposedBy,
        actionReturn.proposedMeasure,
        actionReturn.justification,
        riskTitle,
        service,
        site,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        actionReturnsSearch.trim() === "" ||
        searchBlob.includes(actionReturnsSearch.toLowerCase());
      const matchesService =
        actionReturnsServiceFilter === "all" ||
        service === actionReturnsServiceFilter;
      const matchesAuthor =
        actionReturnsAuthorFilter === "all" ||
        actionReturn.proposedBy === actionReturnsAuthorFilter;
      const matchesRisk =
        actionReturnsRiskFilter === "all" ||
        actionReturn.riskId === actionReturnsRiskFilter;
      return (
        matchesSearch &&
        matchesService &&
        matchesAuthor &&
        matchesRisk
      );
    },
  );
  const availableActionReturnServices = Array.from(
    new Set(
      pendingActionReturns
        .map((ar) => riskLinkedToActionReturn(ar)?.service || "")
        .filter(Boolean),
    ),
  ).sort();
  const availableActionReturnAuthors = Array.from(
    new Set(pendingActionReturns.map((ar) => ar.proposedBy).filter(Boolean)),
  ).sort();
  const availableActionReturnRisks = Array.from(
    new Set(
      pendingActionReturns
        .map((ar) => {
          const risk = riskLinkedToActionReturn(ar);
          if (!risk) return null;
          return `${risk.id}::${risk.title}`;
        })
        .filter(Boolean) as string[],
    ),
  ).sort((a, b) => a.localeCompare(b, "fr"));
  const actionReturnsTotalPages = Math.max(
    1,
    Math.ceil(
      filteredPendingActionReturns.length /
        ACTION_RETURNS_PAGE_SIZE,
    ),
  );
  const paginatedPendingActionReturns = filteredPendingActionReturns.slice(
    (actionReturnsCurrentPage - 1) * ACTION_RETURNS_PAGE_SIZE,
    actionReturnsCurrentPage * ACTION_RETURNS_PAGE_SIZE,
  );

  useEffect(() => {
    if (actionReturnsCurrentPage > actionReturnsTotalPages) {
      setActionReturnsCurrentPage(actionReturnsTotalPages);
    }
  }, [actionReturnsCurrentPage, actionReturnsTotalPages]);

  useEffect(() => {
    setActionReturnsCurrentPage(1);
  }, [
    actionReturnsSearch,
    actionReturnsServiceFilter,
    actionReturnsAuthorFilter,
    actionReturnsRiskFilter,
  ]);

  // Générer automatiquement les notifications pour les retours d'action en attente
  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas admin ou n'est pas connecté
    if (!user || user.role !== "admin") return;

    const pendingActionReturns = actionReturns.filter(
      (ar) => ar.status === "pending",
    );

    // Créer des notifications pour chaque retour d'action en attente si elles n'existent pas déjà
    const newNotifications: any[] = [];
    pendingActionReturns.forEach((ar) => {
      const existingNotification = notifications.find(
        (n) => n.actionReturnId === ar.id,
      );
      if (!existingNotification) {
        const newNotification = {
          id: `notif-${ar.id}`,
          titre: `Retour d'action - En attente`,
          contenu: `${ar.proposedBy} a proposé une nouvelle mesure pour le risque "${ar.riskTitle}"`,
          type: "alerte" as const,
          dateCreation: ar.proposedDate,
          isRead: false,
          actionReturnId: ar.id,
        };
        newNotifications.push(newNotification);
      }
    });

    if (newNotifications.length > 0) {
      setNotifications((prev) => [
        ...prev,
        ...newNotifications,
      ]);
    }
  }, [actionReturns]);

  // Risk CRUD handlers
  const handleAddRisk = () => {
    setRiskToEdit(null);
    goToView("create_risk");
  };

  const handleEditRisk = (risk: Risk, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedRisk(risk);
    setIsEditingRisk(true);
  };

  const handleDeleteRiskClick = (
    id: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setRiskToDelete(id);
    setRiskDeleteDialogOpen(true);
  };

  const deleteRiskById = (id: string) => {
    const targetId = String(id);
    const deletedRisk = risks.find((risk) => String(risk.id) === targetId);
    const nextRisks = closeRiskNumberGap(risks, targetId);
    const numberChanges = new Map<string, { key: string; number: string }>();
    for (const risk of nextRisks) {
      const previous = risks.find((item) => item.id === risk.id);
      if (!previous || previous.numeroRisque === risk.numeroRisque) continue;
      numberChanges.set(buildRiskAwarenessKey(previous), {
        key: buildRiskAwarenessKey(risk),
        number: risk.numeroRisque,
      });
    }
    setRisks(nextRisks);
    if (targetId) {
      setActionReturns((prev) => prev.filter((item) => item.riskId !== targetId));
    }
    if (deletedRisk) {
      setRiskAwarenessRecords((prev) =>
        prev.map((record) => {
          const change = numberChanges.get(record.riskKey);
          return change
            ? { ...record, riskKey: change.key, riskNumber: change.number }
            : record;
        }),
      );
      setSuppressedAwarenessKeys((prev) =>
        prev.map((key) => numberChanges.get(key)?.key ?? key),
      );
    }
    toast.success("Risque supprimé avec succès");
    if (String(selectedRisk?.id) === targetId) {
      setSelectedRisk(null);
    }
  };

  const handleDeleteRiskConfirm = () => {
    if (riskToDelete) {
      deleteRiskById(riskToDelete);
      setRiskDeleteDialogOpen(false);
      setRiskToDelete(null);
    }
  };

  const handleUpdateRisk = useCallback(
    (riskId: string, updater: (risk: Risk) => Risk) => {
      setRisks((prev) =>
        prev.map((risk) =>
          String(risk.id) === String(riskId) ? updater(risk) : risk,
        ),
      );
    },
    [],
  );

  const handleAwarenessRecordDeleted = useCallback(
    (record: RiskAwarenessRecord) => {
      setRiskAwarenessRecords((prev) => {
        const remainingForKey = prev.filter(
          (item) =>
            item.id !== record.id && item.riskKey === record.riskKey,
        );
        if (remainingForKey.length === 0) {
          setSuppressedAwarenessKeys((keys) =>
            keys.includes(record.riskKey)
              ? keys
              : [...keys, record.riskKey],
          );
        }
        return prev.filter((item) => item.id !== record.id);
      });
    },
    [],
  );

  const detachRisksFromReference = useCallback((title: string) => {
    const from = normalizeRiskTitle(title);
    if (!from) return;
    const updatedAt = new Date().toISOString();
    setRisks((prev) =>
      prev.map((risk) =>
        normalizeRiskTitle(risk.title) === from
          ? { ...risk, title: "", detachedFromReference: true, updatedAt }
          : risk,
      ),
    );
    setSelectedRisk((prev) =>
      prev && normalizeRiskTitle(prev.title) === from
        ? { ...prev, title: "", detachedFromReference: true, updatedAt }
        : prev,
    );
    setRiskAwarenessRecords((prev) =>
      prev.filter((record) => normalizeRiskTitle(record.riskTitle) !== from),
    );
  }, []);

  const renameRisksLinkedToTitle = useCallback((previousTitle: string, nextTitle: string) => {
    const from = normalizeRiskTitle(previousTitle);
    const to = nextTitle.trim();
    if (!from || normalizeRiskTitle(to) === from) return;
    setRisks((prev) =>
      prev.map((risk) =>
        normalizeRiskTitle(risk.title) === from
          ? { ...risk, title: to, updatedAt: new Date().toISOString() }
          : risk,
      ),
    );
    setSelectedRisk((prev) =>
      prev && normalizeRiskTitle(prev.title) === from ? { ...prev, title: to } : prev,
    );
    setRiskAwarenessRecords((prev) =>
      prev.map((record) =>
        normalizeRiskTitle(record.riskTitle) === from
          ? { ...record, riskTitle: to, riskKey: `${record.riskNumber}::${to}` }
          : record,
      ),
    );
  }, []);

  const handleAwarenessRecordSaved = useCallback((riskKey: string) => {
    setSuppressedAwarenessKeys((prev) =>
      prev.filter((key) => key !== riskKey),
    );
  }, []);

  const handleSaveRisk = (riskData: any) => {
    if (riskData.id) {
      // Update existing risk
      setRisks((prev) =>
        prev.map((r) =>
          r.id === riskData.id
            ? {
                ...riskData,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
    } else {
      const newRisk: Risk = {
        ...riskData,
        numeroRisque: nextRiskNumber(risks.map((risk) => risk.numeroRisque)),
        id: `risk-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRisks((prev) => [newRisk, ...prev]);
      setSuppressedAwarenessKeys((prev) =>
        prev.filter((key) => key !== buildRiskAwarenessKey(newRisk)),
      );
    }
  };

  // Action Return handlers
  const handleSubmitActionReturn = (actionReturnData: {
    riskId: string;
    riskTitle: string;
    proposedBy: string;
    proposedMeasure: string;
    justification: string;
  }) => {
    let riskId = actionReturnData.riskId;
    if (!riskId && selectedRisk) {
      riskId = `risk-${Date.now()}`;
      const stamped = { ...selectedRisk, id: riskId };
      setRisks((prev) =>
        prev.map((risk) =>
          risk === selectedRisk ||
          (!risk.id &&
            risk.createdAt === selectedRisk.createdAt &&
            risk.updatedAt === selectedRisk.updatedAt &&
            risk.numeroRisque === selectedRisk.numeroRisque &&
            risk.title === selectedRisk.title)
            ? stamped
            : risk,
        ),
      );
      setSelectedRisk(stamped);
    }
    if (!riskId) {
      toast.error("Le retour d'action doit être rattaché à une fiche.");
      return;
    }
    const linked = risks.find((risk) => risk.id === riskId) ?? selectedRisk;
    const newActionReturn: ActionReturn = {
      ...actionReturnData,
      riskId,
      riskTitle: linked?.title || actionReturnData.riskTitle,
      id: `ar-${Date.now()}`,
      proposedDate: new Date().toISOString(),
      status: "pending",
    };
    setActionReturns((prev) => [newActionReturn, ...prev]);

    // Ajouter une notification pour l'admin
    const newNotification = {
      id: `notif-ar-${Date.now()}`,
      titre: `Nouveau retour d'action: ${actionReturnData.riskTitle}`,
      contenu: `${actionReturnData.proposedBy} propose une nouvelle mesure de prévention.`,
      type: "alerte",
      dateCreation: new Date().toISOString(),
      isRead: false,
      actionReturnId: newActionReturn.id,
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // Afficher un message de succès
    toast.success(
      "Retour d'action envoyé avec succès ! Il sera examiné par l'administrateur.",
    );

    // Revenir à la carte de risque
    goToView("risks");
  };

  const handleValidateActionReturn = (
    actionReturnId: string,
    action: "add" | "replace" | "reject",
    comment: string,
    targetMeasureIndex?: number,
  ) => {
    const actionReturn = actionReturns.find(
      (ar) => ar.id === actionReturnId,
    );
    if (!actionReturn) return;

    if (action === "reject") {
      // Rejeter le retour d'action
      setActionReturns((prev) =>
        prev.map((ar) =>
          ar.id === actionReturnId
            ? {
                ...ar,
                status: "rejected" as const,
                reviewedBy: user.name,
                reviewedDate: new Date().toISOString(),
                reviewComment: comment,
              }
            : ar,
        ),
      );
    } else {
      // Approuver (add ou replace)
      const status =
        action === "add"
          ? "validated_add"
          : "validated_replace";

      setActionReturns((prev) =>
        prev.map((ar) =>
          ar.id === actionReturnId
            ? {
                ...ar,
                status: status as const,
                reviewedBy: user.name,
                reviewedDate: new Date().toISOString(),
                reviewComment: comment,
                targetMeasureIndex: targetMeasureIndex,
                targetMeasureText:
                  targetMeasureIndex !== undefined
                    ? (risks.find(
                        (r) => r.id === actionReturn.riskId,
                      )?.existingMeasures ?? [])[targetMeasureIndex]
                    : undefined,
              }
            : ar,
        ),
      );

      // Mettre à jour les mesures du risque
      setRisks((prev) =>
        prev.map((risk) => {
          if (risk.id === actionReturn.riskId) {
            const measures = risk.existingMeasures ?? [];
            if (action === "add") {
              return {
                ...risk,
                existingMeasures: [
                  ...measures,
                  actionReturn.proposedMeasure,
                ],
                retourAction: actionReturn.proposedMeasure,
                updatedAt: new Date().toISOString(),
              };
            } else if (
              action === "replace" &&
              targetMeasureIndex !== undefined
            ) {
              const newMeasures = [...measures];
              newMeasures[targetMeasureIndex] =
                actionReturn.proposedMeasure;
              return {
                ...risk,
                existingMeasures: newMeasures,
                retourAction: actionReturn.proposedMeasure,
                updatedAt: new Date().toISOString(),
              };
            }
          }
          return risk;
        }),
      );
    }

    // Supprimer la notification associée
    setNotifications((prev) =>
      prev.filter(
        (notif) => notif.actionReturnId !== actionReturnId,
      ),
    );

    // Afficher un message de succès
    if (action === "reject") {
      toast.info("Retour d'action refusé");
    } else if (action === "add") {
      toast.success(
        "Retour d'action approuvé ! La mesure a été ajoutée aux mesures existantes.",
      );
    } else if (action === "replace") {
      toast.success(
        "Retour d'action approuvé ! La mesure a été remplacée.",
      );
    }
  };

  const openActionReturn = (actionReturn: ActionReturn) => {
    const linked = riskLinkedToActionReturn(actionReturn);
    if (!linked) return;
    setSelectedRisk(linked);
    goToView("retour_action");
  };

  const formatActionReturnDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date non renseignée";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Accident CRUD handlers
  const duerpRiskRefs = useMemo(() => mapRisksToDuerpRefs(risks), [risks]);

  const handleAddAccident = (accidentData: any) => {
    const newAccident: Accident = enrichAccidentWithRegulatoryGravity(
      normalizeAccidentRecord(
        {
          ...accidentData,
          id: `accident-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        duerpRiskRefs,
      ),
    );
    setAccidents((prev) => [newAccident, ...prev]);
  };

  const handleUpdateAccident = (accidentData: any) => {
    setAccidents((prev) =>
      prev.map((a) =>
        a.id === accidentData.id
          ? enrichAccidentWithRegulatoryGravity(
              normalizeAccidentRecord({ ...a, ...accidentData }, duerpRiskRefs),
            )
          : a,
      ),
    );
  };

  const handleDeleteAccident = (id: string) => {
    setAccidents((prev) => prev.filter((a) => a.id !== id));
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      mécanique: AlertTriangle,
      chimique: Droplet,
      électrique: Zap,
      biologique: Activity,
      psychosocial: Users,
      ergonomique: Activity,
    };
    return icons[category as keyof typeof icons] || Shield;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      mécanique: "from-orange-500 to-red-500",
      chimique: "from-purple-500 to-pink-500",
      électrique: "from-yellow-400 to-orange-500",
      biologique: "from-green-400 to-teal-500",
      psychosocial: "from-blue-500 to-indigo-600",
      ergonomique: "from-indigo-500 to-purple-600",
    };
    return (
      colors[category as keyof typeof colors] ||
      "from-gray-400 to-gray-600"
    );
  };

  const getRiskLevelColor = (level: number) => {
    if (level > 9) return "from-red-500 to-rose-600"; // P1
    if (level >= 4) return "from-orange-500 to-amber-600"; // P2
    return "from-green-400 to-emerald-500"; // P3
  };

  const getRiskLevelLabel = (level: number) => {
    if (level > 9) return "P1";
    if (level >= 4) return "P2";
    return "P3";
  };

  const stats = [
    {
      title: "Risques Identifiés",
      value: risks.length,
      icon: Shield,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: "Risques P1",
      value: risks.filter((r) => r.riskLevel > 9).length,
      icon: AlertCircle,
      gradient: "from-red-500 to-pink-500",
      bgGradient: "from-red-50 to-pink-50",
    },
    {
      title: "Actions en cours",
      value: risks.reduce(
        (acc, r) =>
          acc +
          (r.plannedMeasures ?? []).filter(
            (m) => m.status === "in_progress",
          ).length,
        0,
      ),
      icon: Activity,
      gradient: "from-orange-500 to-yellow-500",
      bgGradient: "from-orange-50 to-yellow-50",
    },
    {
      title: "Accidents ce mois",
      value: accidents.length,
      icon: AlertTriangle,
      gradient: "from-purple-500 to-indigo-500",
      bgGradient: "from-purple-50 to-indigo-50",
    },
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const sidebarItems = [
    {
      section: "Accueil",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          color: "text-blue-500",
        },
        {
          id: "team",
          label: "Équipe",
          icon: Users,
          color: "text-sky-600",
        },
        {
          id: "actualites",
          label: "Actualités",
          icon: Bell,
          color: "text-indigo-600",
        },
      ],
    },
    {
      section: "Risques",
      items: [
        {
          id: "risks",
          label: "Évaluation des risques",
          icon: Shield,
          color: "text-purple-500",
        },
        {
          id: "risks-management",
          label: "Mise à jour des risques",
          icon: Database,
          color: "text-red-600",
        },
        {
          id: "action-returns",
          label: "Retours d'action",
          icon: MessageSquare,
          color: "text-emerald-600",
        },
        {
          id: "risk-references",
          label: "Référentiel des risques",
          icon: FileText,
          color: "text-amber-600",
        },
      ],
    },
    {
      section: "Prévention",
      items: [
        {
          id: "prevention-plan",
          label: "Plan de prévention",
          icon: Target,
          color: "text-sky-600",
        },
        {
          id: "safety-protocols",
          label: "Protocole de sécurité",
          icon: Shield,
          color: "text-cyan-600",
        },
        {
          id: "safety-sheets",
          label: "Fiches de sécurité",
          icon: FileCheck,
          color: "text-pink-600",
        },
        {
          id: "documents",
          label: "Documents SST",
          icon: FileText,
          color: "text-orange-500",
        },
        {
          id: "archives",
          label: "Archives (40 ans)",
          icon: Archive,
          color: "text-red-500",
        },
        {
          id: "signature-duerp",
          label: "Signature DUERP",
          icon: FileSignature,
          color: "text-purple-600",
        },
      ],
    },
    {
      section: "Accidents",
      items: [
        {
          id: "accidents",
          label: "Accidentologie",
          icon: AlertCircle,
          color: "text-red-500",
        },
        {
          id: "registre",
          label: "Registre des accidents",
          icon: ClipboardList,
          color: "text-rose-500",
        },
        {
          id: "actions",
          label: "Plan d'action",
          icon: Calendar,
          color: "text-green-500",
        },
      ],
    },
    {
      section: "Ressources humaines",
      items: [
        {
          id: "medical-visits",
          label: "Visites médicales",
          icon: Stethoscope,
          color: "text-pink-600",
        },
        {
          id: "sst-registry",
          label: "Registre SST",
          icon: ClipboardList,
          color: "text-rose-600",
        },
        {
          id: "arrivees-departs",
          label: "Arrivées et départs",
          icon: ClipboardList,
          color: "text-teal-600",
        },
        {
          id: "transport-coverage",
          label: "Transports",
          icon: Bus,
          color: "text-sky-700",
        },
      ],
    },
    {
      section: "Environnement",
      items: [
        {
          id: "mercury",
          label: "Campagnes mercure",
          icon: Droplet,
          color: "text-cyan-600",
        },
        {
          id: "asbestos",
          label: "Diagnostics amiante",
          icon: Shield,
          color: "text-purple-600",
        },
        {
          id: "asbestos-attestations",
          label: "Attestations amiante",
          icon: FileSignature,
          color: "text-amber-600",
        },
        {
          id: "asbestos-declarations",
          label: "Déclarations amiante",
          icon: ClipboardList,
          color: "text-rose-600",
        },
      ],
    },
    {
      section: "Informatique",
      items: [
        {
          id: "cerbere",
          label: "Applications Cerbère",
          icon: Shield,
          color: "text-indigo-600",
        },
        {
          id: "reservations",
          label: "Réservations",
          icon: Car,
          color: "text-violet-600",
        },
      ],
    },
    {
      section: "Paramétrage",
      items: [
        {
          id: "access-management",
          label: "Gestion des accès",
          icon: Cog,
          color: "text-violet-600",
        },
        {
          id: "users",
          label: "Utilisateurs",
          icon: Users,
          color: "text-blue-600",
        },
        {
          id: "roles",
          label: "Rôles",
          icon: UserCog,
          color: "text-purple-600",
        },
        {
          id: "services",
          label: "Services",
          icon: Building2,
          color: "text-green-600",
        },
        {
          id: "domains",
          label: "Domaines",
          icon: Layers,
          color: "text-orange-600",
        },
        {
          id: "locations",
          label: "Lieux",
          icon: MapPin,
          color: "text-cyan-600",
        },
        {
          id: "settings",
          label: "Paramètres",
          icon: Settings,
          color: "text-gray-500",
        },
      ],
    },
  ];

  const currentAdminUser = useMemo(() => {
    if (!user) return null;
    const linked = adminUsers.find(
      (adminUser) =>
        adminUser.email?.toLowerCase() ===
        resolveDirectoryEmail(user.email).toLowerCase(),
    );
    if (linked) return linked;
    return (
      adminUsers.find((adminUser) => adminUser.id === user.id) ??
      adminUsers.find(
        (adminUser) =>
          `${adminUser.firstName} ${adminUser.lastName}`.toLowerCase() ===
          user.name?.toLowerCase(),
      ) ??
      null
    );
  }, [adminUsers, user]);

  const hasViewAccess = (viewId: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (viewId === "risk-references") return true;

    const moduleExists = ACCESS_MODULES.some(
      (moduleItem) => moduleItem.id === viewId,
    );
    if (!moduleExists) return true;

    if (!currentAdminUser) return true;
    const stored = accessProfiles[currentAdminUser.id];
    const profile = profileHasAnyGrant(stored)
      ? stored
      : profileFromRoleCode(currentAdminUser.id, currentAdminUser.role, adminRoles);
    const grant = profile.modulePermissions[viewId];
    if (grant) return Boolean(grant.canView);
    return profileFromRoleCode(
      currentAdminUser.id,
      currentAdminUser.role,
      adminRoles,
    ).modulePermissions[viewId]?.canView ?? false;
  };

  const canManageModule = (viewId: string) => {
    if (!user) return false;
    if (user.role === "agent" || user.role === "prestataire" || user.role === "rh") return false;
    if (user.role === "admin") return true;
    const sameRole =
      currentAdminUser &&
      roleCodeFromUserRole(user.role) === roleCodeFromUserRole(currentAdminUser.role);
    const profile = sameRole
      ? (profileHasAnyGrant(accessProfiles[currentAdminUser.id])
          ? accessProfiles[currentAdminUser.id]
          : profileFromRoleCode(currentAdminUser.id, user.role, adminRoles))
      : profileFromRoleCode(user.id, user.role, adminRoles);
    const crud = profile.modulePermissions[viewId]?.crud;
    return Boolean(crud?.create || crud?.update || crud?.delete);
  };

  const filteredSidebarItems = sidebarItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasViewAccess(item.id)),
    }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    if (!user) return;
    if (activeView === "categories" || activeView === "category-modules") return;
    if (!hasViewAccess(activeView)) {
      toast.error("Accès non autorisé pour cet onglet.");
      navigate(getPathForView("dashboard"));
    }
  }, [activeView, user, accessProfiles, currentAdminUser, adminRoles, navigate]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeView, selectedRisk?.id, isEditingRisk]);

  const normalizedPath = location.pathname.replace(/\/$/, "") || "/";
  if (normalizedPath === "/") {
    return <Navigate to={DEFAULT_AUTHENTICATED_PATH} replace />;
  }

  // Si l'utilisateur n'est pas authentifié, afficher la page de login
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // Vue catégories (page d'accueil)
  if (activeView === "categories") {
    return (
      <>
        <CategoriesView
          onSelectCategory={(categoryId) =>
            goToView("category-modules", categoryId)
          }
          onGoToDashboard={() => goToView("dashboard")}
          onGoToRisks={() => goToView("risks")}
        />
      </>
    );
  }

  // Vue modules d'une catégorie
  if (activeView === "category-modules" && categoryView) {
    if (categoryView === "duerp") {
      return (
        <>
          <DUERPModulesView
            onSelectModule={(moduleId) => goToView(moduleId)}
            onGoBack={() => goToView("categories")}
          />
        </>
      );
    }
    if (categoryView === "rh") {
      return (
        <>
          <RHModulesView
            onSelectModule={(moduleId) => goToView(moduleId)}
            onGoBack={() => goToView("categories")}
          />
        </>
      );
    }
    if (categoryView === "environnement") {
      return (
        <>
          <EnvironnementModulesView
            onSelectModule={(moduleId) => goToView(moduleId)}
            onGoBack={() => goToView("categories")}
          />
        </>
      );
    }
    if (categoryView === "communication") {
      return <Navigate to={getPathForView("actualites")} replace />;
    }
    if (categoryView === "applications") {
      return (
        <>
          <ApplicationsModulesView
            onSelectModule={(moduleId) => goToView(moduleId)}
            onGoBack={() => goToView("categories")}
          />
        </>
      );
    }
    if (categoryView === "administration") {
      return (
        <>
          <AdministrationModulesView
            onSelectModule={(moduleId) => goToView(moduleId)}
            onGoBack={() => goToView("categories")}
          />
        </>
      );
    }
    if (categoryView === "validation") {
      return <Navigate to={getPathForView("signature-duerp")} replace />;
    }
    if (categoryView === "informatique") {
      return (
        <>
          <InformatiqueModulesView
            onSelectModule={(moduleId) => goToView(moduleId)}
            onGoBack={() => goToView("categories")}
          />
        </>
      );
    }
    return <Navigate to={DEFAULT_AUTHENTICATED_PATH} replace />;
  }

  const fullBleedModuleViews = new Set(["reservations"]);
  const isFullBleedModule = fullBleedModuleViews.has(activeView);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">

      {/* Sidebar */}
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Fermer la sidebar"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`h-full w-72 shrink-0 bg-white/80 backdrop-blur-xl border-r border-purple-100 flex flex-col shadow-xl fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 overflow-hidden lg:static lg:z-auto lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarOpen ? "lg:flex" : "lg:hidden"}`}
      >
        <div className="p-6 border-b border-purple-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-500/40 shrink-0">
                <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-800 to-sky-700 bg-clip-text text-transparent truncate">
                  Le Compas
                </h1>
                <p className="text-xs text-slate-600 font-semibold tracking-wide truncate">
                  DIRM
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                setIsMobileSidebarOpen(false);
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Bouton retour aux catégories */}
          <button
            onClick={() => {
              goToView("categories");
              setIsMobileSidebarOpen(false);
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
          >
            <LayoutDashboard className="h-4 w-4" />
            Retour aux catégories
          </button>

          {/* Role Selector */}
          <div className="mt-4 p-3 bg-gradient-to-br from-violet-50 via-indigo-50 to-slate-50 rounded-xl border border-violet-200/90 shadow-sm">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <UserCog className="h-3.5 w-3.5 text-violet-700 shrink-0" aria-hidden />
              Rôle actuel :
            </p>
            <select
              value={user?.role || "agent"}
              onChange={(e) => {
                const newRole = e.target.value as User["role"];
                if (!user) return;
                const syncedUser = { ...user, role: newRole };
                setUser(syncedUser);
                updateStoredSessionUser(syncedUser);
                const roleLabels: Record<User["role"], string> = {
                  admin: "Administrateur",
                  chef_service: "Chef de service",
                  agent: "Agent",
                  prestataire: "Prestataire",
                  rh: "RH",
                };
                toast.success(`Rôle changé : ${roleLabels[newRole]}`);
              }}
              className="w-full px-3 py-2 text-sm font-semibold bg-white border-2 border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 cursor-pointer"
            >
              <option value="agent">Agent</option>
              <option value="rh">RH</option>
              <option value="admin">Administrateur</option>
              <option value="chef_service">Chef de service</option>
            </select>
            <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 flex-wrap">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" aria-hidden />
              <span>Connecté :</span>
              <span className="font-semibold text-gray-900">{user?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-6">
            {filteredSidebarItems.map((section, index) => {
              return (
                <div key={section.section}>
                  {index > 0 && <Separator className="mb-4" />}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                    {section.section}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (!hasViewAccess(item.id)) {
                              toast.error("Accès non autorisé pour cet onglet.");
                              return;
                            }
                            goToView(item.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/50 scale-105"
                              : "text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${isActive ? "text-white" : item.color}`}
                          />
                          <span className="min-w-0 text-left leading-tight">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-purple-100">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-purple-600 font-medium">
                  {user?.role === "admin"
                    ? "Administrateur"
                    : user?.role === "chef_service"
                      ? "Chef de service"
                      : user?.role === "rh"
                        ? "RH"
                        : user?.role === "prestataire"
                          ? "Prestataire"
                          : "Agent"}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-purple-200 hover:bg-purple-50 text-purple-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:text-purple-800"
      >
        Aller au contenu principal
      </a>
      {/* Main Content */}
      <main
        id="main-content"
        ref={mainScrollRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50"
        tabIndex={-1}
      >
        {/* Header */}
        {!isFullBleedModule ? (
        <header className="bg-white/80 backdrop-blur-xl border-b border-purple-100 sticky top-0 z-10 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                {!isSidebarOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="mb-3 hidden lg:inline-flex border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Ouvrir le menu
                  </Button>
                )}
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-800 to-sky-700 bg-clip-text text-transparent">
                  Bienvenue, {user?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 font-semibold"
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    {user?.service}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`font-semibold ${
                      user?.role === "admin"
                        ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700"
                        : user?.role === "chef_service"
                          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700"
                          : user?.role === "rh"
                            ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800"
                            : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <UserCog className="h-3 w-3 mr-1" />
                    {user?.role === "admin"
                      ? "Administrateur"
                      : user?.role === "chef_service"
                        ? "Chef de service"
                        : user?.role === "rh"
                          ? "RH"
                          : "Agent"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <NotificationBell
                  notifications={notifications.filter(
                    (item) =>
                      !item.recipientEmail ||
                      item.recipientEmail.toLowerCase() === (user?.email || "").toLowerCase(),
                  )}
                  onMarkAsRead={(id) => {
                    setNotifications(
                      notifications.map((n) =>
                        n.id === id
                          ? { ...n, isRead: true }
                          : n,
                      ),
                    );
                  }}
                  onMarkAllAsRead={() => {
                    const email = (user?.email || "").toLowerCase();
                    setNotifications(
                      notifications.map((n) =>
                        !n.recipientEmail || n.recipientEmail.toLowerCase() === email
                          ? { ...n, isRead: true }
                          : n,
                      ),
                    );
                  }}
                  onNavigateToActualites={() =>
                    goToView("actualites")
                  }
                  onReviewActionReturn={(actionReturnId) => {
                    const actionReturn = actionReturns.find(
                      (ar) => ar.id === actionReturnId,
                    );
                    if (
                      actionReturn &&
                      actionReturn.status === "pending"
                    ) {
                      // Trouver le risque associé
                      const risk = risks.find(
                        (r) => r.id === actionReturn.riskId,
                      );
                      if (risk) {
                        setSelectedRisk(risk);
                        goToView("retour_action");
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>
        ) : null}

        <div
          className={
            isFullBleedModule
              ? "flex min-h-0 min-w-0 w-full flex-1 flex-col"
              : "w-full p-4 sm:p-6 lg:p-8"
          }
        >
          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <DashboardView
              risks={visibleRisks}
              accidents={accidents}
              actions={manualActions}
              teamSize={adminUsers.length}
              awarenessCount={riskReferences.length}
              securitySheetCount={securitySheets.length}
              pendingReturns={actionReturns.filter((item) => item.status === "pending").length}
              accessToken={accessToken}
              onNavigateToRisk={(risk) => {
                const fullRisk = visibleRisks.find((item) => item.id === risk.id);
                if (!fullRisk) return;
                setSelectedRisk(fullRisk);
                goToView("risks");
              }}
              onOpenModule={(viewId) => goToView(viewId)}
              getRiskLevelColor={getRiskLevelColor}
              getRiskLevelLabel={getRiskLevelLabel}
            />
          )}
          {activeView === "team" && (
            <TeamView
              users={adminUsers}
              services={adminServices}
              domains={adminDomains}
              locations={adminLocations}
              currentUserRole={user?.role}
              currentUserService={user?.service}
            />
          )}
          {activeView === "access-management" && (
            <AccessManagementView
              users={adminUsers}
              roles={adminRoles}
              profiles={accessProfiles}
              onProfilesChange={setAccessProfiles}
              accessToken={accessToken}
            />
          )}

          {/* Mercury Campaigns View */}
          {activeView === "mercury" && (
            <MercuryView accessToken={accessToken} />
          )}

          {/* Asbestos Diagnostics View */}
          {activeView === "asbestos" && (
            <AsbestosView accessToken={accessToken} />
          )}

          {/* Asbestos Attestations View */}
          {activeView === "asbestos-attestations" && (
            <AsbestosAttestationsView
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              accessToken={accessToken}
            />
          )}

          {activeView === "asbestos-declarations" && (
            <AsbestosDeclarationView
              accessToken={accessToken}
              currentUser={{
                name: user?.name || "Utilisateur",
                role: user?.role || "agent",
              }}
            />
          )}

          {/* Medical Visits View */}
          {activeView === "medical-visits" && (
            <MedicalVisitsView
              risks={risks}
              users={adminUsers}
              accessToken={accessToken}
            />
          )}

          {/* SST Registry View */}
          {activeView === "sst-registry" && (
            <SSTRegistryView
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              accessToken={accessToken}
            />
          )}

          {/* Retour Action View */}
          {activeView === "retour_action" && !selectedRisk && (
            <Navigate to={getPathForView("risks")} replace />
          )}

          {activeView === "retour_action" && selectedRisk && (
            <RetourActionView
              risk={selectedRisk}
              user={user}
              actionReturns={actionReturns}
              onBack={() => {
                goToView("risks");
              }}
              onSubmitRetourAction={handleSubmitActionReturn}
              onValidateRetourAction={
                handleValidateActionReturn
              }
              getRiskLevelColor={getRiskLevelColor}
              getRiskLevelLabel={getRiskLevelLabel}
            />
          )}

          {/* Create Risk View */}
          {activeView === "create_risk" && (
            <RiskEditView
              risk={null}
              onSave={(riskData) => {
                const newRisk: Risk = {
                  id: `risk-${Date.now()}`,
                  ...riskData,
                  numeroRisque: nextRiskNumber(risks.map((risk) => risk.numeroRisque)),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setRisks([...risks, newRisk]);
                goToView("risks");
                toast.success("Risque créé avec succès");
              }}
              onCancel={() => goToView("risks")}
              getCategoryIcon={getCategoryIcon}
              getCategoryColor={getCategoryColor}
              getRiskLevelColor={getRiskLevelColor}
              getRiskLevelLabel={getRiskLevelLabel}
              existingRisks={risks}
              serviceOptions={serviceOptions}
              domainOptions={domainOptions}
              locationOptions={locationOptions}
              serviceCatalog={adminServices}
              riskReferences={riskReferences}
              concernedPersons={concernedPersons}
            />
          )}

          {/* Risks View */}
          {activeView === "risks" && (
            <div className="space-y-6">
              {!selectedRisk ? (
                <>
                  {/* Header with Add Button */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          Évaluation des risques
                        </h1>
                        <p className="text-gray-600 mt-1">
                          Vue de lecture pour les chefs de service et les agents. Même liste que Mise à jour des risques.
                        </p>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <Button
                        onClick={handleAddRisk}
                        className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Nouveau risque
                      </Button>
                    )}
                  </div>

                  <RiskEvaluationFiltersPanel
                    filters={riskEvaluationFilters}
                    onChange={setRiskEvaluationFilters}
                    searchQuery={riskSearchQuery}
                    onSearchChange={setRiskSearchQuery}
                    visibleRisks={visibleRisks}
                    resultCount={filteredVisibleRisks.length}
                  />

                  <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredVisibleRisks.length === 0 ? (
                      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur col-span-full">
                        <CardContent className="pt-12 pb-12 text-center">
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                            <Shield className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-lg mb-4">
                            Aucun risque identifié
                          </p>
                          {user?.role === 'admin' && (
                            <Button
                              onClick={handleAddRisk}
                              className="bg-gradient-to-r from-purple-600 to-indigo-600"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Identifier le premier risque
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      paginatedRisks.map((risk) => {
                        const priorityGradient = getRiskLevelColor(
                          risk.riskLevel,
                        );
                        const completedActions =
                          risk.plannedMeasures.filter(
                            (m) => m.status === "completed",
                          ).length;
                        const totalActions =
                          risk.plannedMeasures.length;

                        return (
                          <Card
                            key={risk.id}
                            className="relative flex h-full cursor-pointer flex-col overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur transition-shadow hover:shadow-2xl"
                            onClick={() => {
                              setSelectedRisk(risk);
                              setIsEditingRisk(false);
                            }}
                          >
                            <div className={`h-2 bg-gradient-to-r ${priorityGradient}`} />
                            <CardHeader className="space-y-4">
                              <div className="flex items-start gap-4">
                                <div className={`shrink-0 rounded-2xl bg-gradient-to-br ${priorityGradient} px-4 py-3 text-center text-white shadow-lg`}>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Priorité finale</p>
                                  <p className="mt-1 text-3xl font-extrabold leading-none">{getRiskLevelLabel(risk.riskLevel)}</p>
                                  <p className="mt-1 text-xs opacity-90">GFM {risk.riskLevel}</p>
                                </div>
                                <div className="min-w-0 pt-1">
                                  <p className="text-xs font-semibold text-violet-700">N° {risk.numeroRisque}</p>
                                  <CardTitle className="mt-1 text-lg font-bold leading-snug text-slate-900">
                                    {risk.detachedFromReference ? (
                                      <span className="text-amber-800">Lié à aucun risque</span>
                                    ) : (
                                      risk.title
                                    )}
                                  </CardTitle>
                                </div>
                              </div>
                              <CardDescription className="line-clamp-2 text-gray-600">
                                {risk.situation}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col">
                              <div className="flex flex-1 flex-col gap-3">
                                {risk.service ? (
                                  <div className="flex min-w-0 items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                                    <span className="min-w-0 break-words text-sm font-semibold text-blue-800">{risk.service}</span>
                                  </div>
                                ) : null}
                                {risk.unite ? (
                                  <div className="flex min-w-0 items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                    <Tag className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                    <span className="min-w-0 break-words text-sm font-semibold text-amber-800">{risk.unite}</span>
                                  </div>
                                ) : null}
                                {risk.domain ? (
                                  <div className="flex min-w-0 items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                    <span className="min-w-0 break-words text-sm font-semibold text-indigo-800">{risk.domain}</span>
                                  </div>
                                ) : null}
                                {risk.site ? (
                                  <div className="flex min-w-0 items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    <span className="min-w-0 break-words text-sm font-semibold text-emerald-800">{risk.site}</span>
                                  </div>
                                ) : null}
                                <div className="mt-auto space-y-3">
                                <RiskScalePair severity={risk.severity} probability={risk.probability} />
                                <RiskProgress completed={completedActions} total={totalActions} />
                                {user?.role === "chef_service" && (
                                  <Button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedRisk(risk);
                                      goToView("retour_action");
                                    }}
                                    className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                  >
                                    <Send className="h-4 w-4" />
                                    Faire un retour d'action
                                  </Button>
                                )}
                                {user?.role === "admin" && (
                                  <div className="grid grid-cols-2 gap-3 pt-1">
                                    <Button
                                      type="button"
                                      onClick={(e) => handleEditRisk(risk, e)}
                                      className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Modifier
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={(e) => handleDeleteRiskClick(risk.id, e)}
                                      className="h-11 w-full rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Supprimer
                                    </Button>
                                  </div>
                                )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );

                      })
                    )}
                  </div>
                  <ListPaginationBar
                    currentPage={riskCurrentPage}
                    totalPages={totalRiskPages}
                    totalItems={filteredVisibleRisks.length}
                    onPageChange={setRiskCurrentPage}
                    itemLabel="risque(s)"
                  />
                </>
              ) : isEditingRisk && selectedRisk ? (
                /* Risk Edit View */
                <RiskEditView
                  risk={selectedRisk}
                  onSave={(updatedRisk) => {
                    setRisks(
                      risks.map((r) =>
                        r.id === updatedRisk.id
                          ? updatedRisk
                          : r,
                      ),
                    );
                    setIsEditingRisk(false);
                    setSelectedRisk(updatedRisk);
                    toast.success("Risque modifié avec succès");
                  }}
                  onCancel={() => setIsEditingRisk(false)}
                  getCategoryIcon={getCategoryIcon}
                  getCategoryColor={getCategoryColor}
                  getRiskLevelColor={getRiskLevelColor}
                  getRiskLevelLabel={getRiskLevelLabel}
                  existingRisks={risks}
                  serviceOptions={serviceOptions}
                  domainOptions={domainOptions}
                  locationOptions={locationOptions}
                  serviceCatalog={adminServices}
                  riskReferences={riskReferences}
                  concernedPersons={concernedPersons}
                />
              ) : selectedRisk ? (
                <RiskConsultationDetail
                  risk={selectedRisk}
                  riskLevelGradient={getRiskLevelColor}
                  riskLevelLabel={getRiskLevelLabel}
                  onBack={() => {
                    setSelectedRisk(null);
                    setIsEditingRisk(false);
                  }}
                  onEdit={() => setIsEditingRisk(true)}
                  onDelete={() => {
                    setRiskToDelete(selectedRisk.id);
                    setRiskDeleteDialogOpen(true);
                  }}
                  canManage={user?.role === "admin"}
                  canProposeReturn={user?.role === "chef_service"}
                  onProposeReturn={() => goToView("retour_action")}
                  actionReturns={actionReturns.filter((item) => item.riskId === selectedRisk.id)}
                  userRole={user?.role}
                  onManageActionReturns={() => goToView("action-returns")}
                  onLearnMore={() => {
                    setReferenceSheetRequest({
                      numeroRisque: selectedRisk.numeroRisque,
                      title: selectedRisk.title,
                    });
                    goToView("risk-references");
                  }}
                />
              ) : null}
            </div>
          )}

          {/* Accidents View */}
          {activeView === "accidents" && (
            <AccidentsView
              accidents={accidents}
              risks={duerpRiskRefs}
              onAdd={handleAddAccident}
              onUpdate={handleUpdateAccident}
              onDelete={handleDeleteAccident}
              agents={adminUsers}
              serviceOptions={serviceOptions}
              domainOptions={domainOptions}
              locationOptions={locationOptions}
              accessToken={accessToken}
            />
          )}

          {(activeView === "risk-references" || activeView === "risk-awareness") && (
            <RiskReferencesManagementView
              references={riskReferences}
              setReferences={setRiskReferences}
              awarenessRecords={
                user?.role === "admin"
                  ? riskAwarenessRecords
                  : riskAwarenessRecords.filter((record) =>
                      visibleRisks.some(
                        (risk) =>
                          `${risk.numeroRisque}::${risk.title}` === record.riskKey,
                      ),
                    )
              }
              setAwarenessRecords={setRiskAwarenessRecords}
              onAwarenessDeleted={handleAwarenessRecordDeleted}
              onAwarenessSaved={handleAwarenessRecordSaved}
              onRenameLinkedRisks={renameRisksLinkedToTitle}
              onReferenceRemoved={detachRisksFromReference}
              canManage={canManageModule("risk-references")}
              openSheetFor={referenceSheetRequest}
              onOpenSheetHandled={() => setReferenceSheetRequest(null)}
            />
          )}
          {activeView === "prevention-plan" && (
            <PreventionPlanView
              risks={visibleRisks}
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              accessToken={accessToken}
            />
          )}
          {activeView === "safety-protocols" && (
            <SafetyProtocolView
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              currentUserService={user?.service || ""}
              currentUserDomain={user?.domain || ""}
              currentUserLocation={user?.location || ""}
              serviceOptions={serviceOptions}
              domainOptions={domainOptions}
              locationOptions={locationOptions}
              accessToken={accessToken}
            />
          )}
          {activeView === "safety-sheets" && (
            <SecuritySheetView
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              records={securitySheets}
              setRecords={setSecuritySheets}
            />
          )}

          {/* Actions View */}
          {activeView === "actions" && (
            <ActionsView
              actions={manualActions}
              onActionsChange={setManualActions}
              risks={risks}
              onUpdateRisk={handleUpdateRisk}
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || ""}
              serviceOptions={serviceOptions}
              locationOptions={locationOptions}
              papripactSignatures={papripactSignatures}
              onSavePapripactSignature={(record) =>
                setPapripactSignatures((prev) => {
                  const others = prev.filter((item) => item.year !== record.year);
                  return [...others, record];
                })
              }
              accessToken={accessToken}
            />
          )}

          {/* Risks Management View */}
          {activeView === "risks-management" && (
            <RisksManagementView
              risks={risks}
              setRisks={setRisks}
              serviceOptions={serviceOptions}
              domainOptions={domainOptions}
              locationOptions={locationOptions}
              serviceCatalog={adminServices}
              riskReferences={riskReferences}
              concernedPersons={concernedPersons}
              onDeleteRisk={deleteRiskById}
              actionReturns={actionReturns}
              onManageActionReturns={() => goToView("action-returns")}
              onProposeReturn={
                user?.role === "chef_service"
                  ? (risk) => {
                      setSelectedRisk(risk);
                      goToView("retour_action");
                    }
                  : undefined
              }
              onLearnMore={(risk) => {
                setReferenceSheetRequest({
                  numeroRisque: risk.numeroRisque,
                  title: risk.title,
                });
                goToView("risk-references");
              }}
              getCategoryIcon={getCategoryIcon}
              getCategoryColor={getCategoryColor}
              riskLevelGradient={getRiskLevelColor}
              getRiskLevelLabel={getRiskLevelLabel}
            />
          )}


          {/* Action Returns View */}
          {activeView === "action-returns" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Retours d'action
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Propositions en attente, rattachées à la fiche du risque
                  </p>
                </div>
                <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    aria-pressed={actionReturnsDisplay === "cards"}
                    onClick={() => setActionReturnsDisplay("cards")}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                      actionReturnsDisplay === "cards"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Cartes
                  </button>
                  <button
                    type="button"
                    aria-pressed={actionReturnsDisplay === "table"}
                    onClick={() => setActionReturnsDisplay("table")}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                      actionReturnsDisplay === "table"
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    <Table2 className="h-4 w-4" />
                    Tableau
                  </button>
                </div>
              </div>

              <Card className="border border-emerald-100 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Input
                      placeholder="Rechercher (risque, mesure, auteur...)"
                      value={actionReturnsSearch}
                      onChange={(e) =>
                        setActionReturnsSearch(e.target.value)
                      }
                      className="h-11 rounded-xl border-slate-200 bg-white"
                    />
                    <Select
                      value={actionReturnsServiceFilter}
                      onValueChange={setActionReturnsServiceFilter}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Tous les services
                        </SelectItem>
                        {availableActionReturnServices.map((service) => (
                          <SelectItem
                            key={service}
                            value={service}
                          >
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={actionReturnsAuthorFilter}
                      onValueChange={setActionReturnsAuthorFilter}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Auteur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Tous les auteurs
                        </SelectItem>
                        {availableActionReturnAuthors.map((author) => (
                          <SelectItem
                            key={author}
                            value={author}
                          >
                            {author}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={actionReturnsRiskFilter}
                      onValueChange={setActionReturnsRiskFilter}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Risque" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          Tous les risques
                        </SelectItem>
                        {availableActionReturnRisks.map((riskValue) => {
                          const [riskId, riskTitle] = riskValue.split("::");
                          return (
                            <SelectItem
                              key={riskId}
                              value={riskId}
                            >
                              {riskTitle}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {filteredPendingActionReturns.length === 0 ? (
                <Card className="border border-dashed border-slate-200 bg-white shadow-sm">
                  <CardContent className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Aucun retour d'action en attente
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Une proposition est toujours portée par une fiche du risque.
                    </p>
                  </CardContent>
                </Card>
              ) : actionReturnsDisplay === "cards" ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {paginatedPendingActionReturns.map((actionReturn) => {
                    const linked = riskLinkedToActionReturn(actionReturn);
                    if (!linked) return null;
                    const title = linked.detachedFromReference || !linked.title.trim()
                      ? "Lié à aucun risque"
                      : linked.title;
                    return (
                      <article
                        key={actionReturn.id}
                        className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm transition hover:shadow-md"
                        onClick={() => openActionReturn(actionReturn)}
                      >
                        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              {linked.numeroRisque ? (
                                <span className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 px-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
                                  {linked.numeroRisque}
                                </span>
                              ) : null}
                              <h4 className="text-lg font-semibold leading-snug text-slate-900">
                                {title}
                              </h4>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                              <Clock className="h-3.5 w-3.5" />
                              En attente
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                            {actionReturn.proposedMeasure}
                          </p>
                          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 shadow-sm">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                                <User className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-emerald-800/70">Auteur</p>
                                <p className="truncate text-sm font-semibold text-slate-900">{actionReturn.proposedBy}</p>
                              </div>
                            </div>
                            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-teal-100 bg-white px-3 py-2.5 shadow-sm">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
                                <Calendar className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-teal-800/70">Date</p>
                                <p className="truncate text-sm font-semibold text-slate-900">{formatActionReturnDate(actionReturn.proposedDate)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-auto grid grid-cols-1 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                openActionReturn(actionReturn);
                              }}
                              className="h-10 w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Consulter
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <Card className="overflow-hidden border border-emerald-100 bg-white shadow-sm">
                  <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px]">
                        <thead className="border-b border-emerald-100 bg-emerald-50/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Risque</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Auteur</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Statut</th>
                            <th className="w-24 px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                          {paginatedPendingActionReturns.map((actionReturn) => {
                            const linked = riskLinkedToActionReturn(actionReturn);
                            if (!linked) return null;
                            const title = linked.detachedFromReference || !linked.title.trim()
                              ? "Lié à aucun risque"
                              : linked.title;
                            return (
                              <tr
                                key={actionReturn.id}
                                className="cursor-pointer align-middle transition-colors hover:bg-emerald-50/40"
                                onClick={() => openActionReturn(actionReturn)}
                              >
                                <td className="px-4 py-4">
                                  <div className="flex min-w-0 items-start gap-3">
                                    {linked.numeroRisque ? (
                                      <span className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 px-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
                                        {linked.numeroRisque}
                                      </span>
                                    ) : null}
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
                                      <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-5 text-slate-500">{actionReturn.proposedMeasure}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                                      <User className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm font-semibold text-slate-900">{actionReturn.proposedBy}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-700">{formatActionReturnDate(actionReturn.proposedDate)}</td>
                                <td className="px-4 py-4">
                                  <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                                    <Clock className="h-3.5 w-3.5" />
                                    En attente
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    aria-label="Consulter"
                                    title="Consulter"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openActionReturn(actionReturn);
                                    }}
                                    className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 text-slate-700 shadow-sm hover:bg-slate-50"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
              <ListPaginationBar
                currentPage={actionReturnsCurrentPage}
                totalPages={actionReturnsTotalPages}
                totalItems={filteredPendingActionReturns.length}
                onPageChange={setActionReturnsCurrentPage}
                itemLabel="retour(s) en attente"
              />
            </div>
          )}

          {/* Admin Tabs - Users, Roles, Services, Domains, Locations, Categories */}
          {(activeView === "users" ||
            activeView === "roles" ||
            activeView === "services" ||
            activeView === "domains" ||
            activeView === "locations" ||
            activeView === "categories") && (
            <AdminTabsView
              activeTab={
                activeView as
                  | "users"
                  | "roles"
                  | "services"
                  | "domains"
                  | "locations"
                  | "categories"
              }
              servicesData={adminServices}
              setServicesData={setAdminServices}
              usersData={adminUsers}
              setUsersData={setAdminUsers}
              domainsData={adminDomains}
              setDomainsData={setAdminDomains}
              locationsData={adminLocations}
              setLocationsData={setAdminLocations}
              categoriesData={adminCategories}
              setCategoriesData={setAdminCategories}
              adminDisplayName={user?.name}
              rolesData={adminRoles}
              setRolesData={setAdminRoles}
              onApplyRoleAccess={(role) => {
                if (!role.modulePermissions) return;
                setAccessProfiles((prev) => {
                  const next = { ...prev };
                  adminUsers
                    .filter((adminUser) => adminUser.role === role.code)
                    .forEach((adminUser) => {
                      next[adminUser.id] = {
                        employeeId: adminUser.id,
                        modulePermissions: role.modulePermissions!,
                      };
                    });
                  return next;
                });
              }}
            />
          )}

          {/* Documents view */}
          {activeView === "documents" && (
            <DocumentsView
              risks={risks}
              actions={manualActions}
              accessToken={accessToken}
            />
          )}

          {/* Archives view */}
          {activeView === "archives" && (
            <ArchivesView accessToken={accessToken} />
          )}

          {/* Registre accidents view */}
          {activeView === "registre" && (
            <RegistreAccidentsView
              risks={duerpRiskRefs}
              agents={adminUsers}
              serviceOptions={serviceOptions}
              domainOptions={domainOptions}
              locationOptions={locationOptions}
              accessToken={accessToken}
            />
          )}

          {/* Settings view */}
          {activeView === "settings" && (
            <SettingsView
              accessToken={accessToken}
              userId={user?.id}
              userEmail={user?.email}
              userName={user?.name}
            />
          )}

          {/* Cerbere view */}
          {activeView === "cerbere" && (
            <CerbereView
              usersData={adminUsers}
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              currentUserEmail={user?.email}
              currentUserService={user?.service}
              currentUserDomain={user?.domain}
              currentUserLocation={user?.location}
              accessToken={accessToken}
            />
          )}

          {activeView === "reservations" && (
            <ReservationsView
              accessToken={accessToken}
              currentUserName={user?.name || "Utilisateur"}
              onBack={() => goToView("category-modules", "informatique")}
            />
          )}

          {/* Actualités view */}
          {activeView === "actualites" && (
            <ActualitesView
              userRole={user?.role || "agent"}
              accessToken={accessToken}
              serviceOptions={serviceNames}
              domainOptions={domainNames}
              locationOptions={locationNames}
              categoryOptions={adminCategories.map((c) => c.name)}
            />
          )}

          {activeView === "arrivees-departs" && (
            <ArriveesDepartsView
              userRole={user?.role || "agent"}
              accessToken={accessToken}
            />
          )}

          {activeView === "transport-coverage" && (
            <TransportCoverageView
              accessToken={accessToken}
              currentUserId={user?.id || ""}
              currentUserName={user?.name || ""}
              currentUserEmail={user?.email || ""}
              currentUserRole={user?.role || "agent"}
              directory={adminUsers.map((person) => ({
                id: person.id,
                email: person.email,
                firstName: person.firstName,
                lastName: person.lastName,
              }))}
              onNotify={(notice) => {
                setNotifications((prev) => [
                  {
                    id: crypto.randomUUID(),
                    titre: notice.titre,
                    contenu: notice.contenu,
                    type: "info",
                    dateCreation: new Date().toISOString(),
                    isRead: false,
                    recipientEmail: notice.recipientEmail,
                  },
                  ...prev,
                ]);
              }}
            />
          )}

          {/* Signature DUERP view */}
          {activeView === "signature-duerp" && (
            <DUERPSignatureManagement
              currentSignature={{
                id: "duerp-2025-v1",
                version: "2025.1",
                status: "pending_signature",
                createdDate: "2025-01-15T10:00:00Z",
                sentForSignatureDate: "2025-01-15T14:30:00Z",
                signatoryEmail:
                  "jean-marc.dubois@developpement-durable.gouv.fr",
                signatoryName: "Jean-Marc DUBOIS",
                signatoryTitle: "Directeur Interrégional",
                changesSummary: {
                  newRisks: 12,
                  updatedRisks: 8,
                  newMeasures: 15,
                  updatedMeasures: 6,
                },
                comments:
                  "Mise à jour suite aux dernières évaluations des risques pour l'année 2025. Nouveaux risques identifiés dans les activités en mer.",
                expirationDate: "2025-02-14T23:59:59Z",
              }}
              signatureHistory={[
                {
                  id: "duerp-2024-v3",
                  version: "2024.3",
                  status: "signed",
                  createdDate: "2024-11-20T10:00:00Z",
                  sentForSignatureDate: "2024-11-20T15:00:00Z",
                  signedDate: "2024-11-22T09:30:00Z",
                  signatoryEmail:
                    "jean-marc.dubois@developpement-durable.gouv.fr",
                  signatoryName: "Jean-Marc DUBOIS",
                  signatoryTitle: "Directeur Interrégional",
                  changesSummary: {
                    newRisks: 5,
                    updatedRisks: 12,
                    newMeasures: 8,
                    updatedMeasures: 10,
                  },
                  signatureData: {
                    signedBy: "Jean-Marc DUBOIS",
                    signedAt: "2024-11-22T09:30:00Z",
                    ipAddress: "192.168.1.100",
                    userAgent: "Mozilla/5.0",
                    certificateId: "CERT-2024-11-22-001",
                  },
                  comments: "Validation de fin d'année 2024",
                },
                {
                  id: "duerp-2024-v2",
                  version: "2024.2",
                  status: "signed",
                  createdDate: "2024-07-10T10:00:00Z",
                  sentForSignatureDate: "2024-07-10T16:00:00Z",
                  signedDate: "2024-07-12T11:15:00Z",
                  signatoryEmail:
                    "jean-marc.dubois@developpement-durable.gouv.fr",
                  signatoryName: "Jean-Marc DUBOIS",
                  signatoryTitle: "Directeur Interrégional",
                  changesSummary: {
                    newRisks: 8,
                    updatedRisks: 6,
                    newMeasures: 10,
                    updatedMeasures: 4,
                  },
                  signatureData: {
                    signedBy: "Jean-Marc DUBOIS",
                    signedAt: "2024-07-12T11:15:00Z",
                    ipAddress: "192.168.1.105",
                    userAgent: "Mozilla/5.0",
                    certificateId: "CERT-2024-07-12-002",
                  },
                },
                {
                  id: "duerp-2024-v1",
                  version: "2024.1",
                  status: "signed",
                  createdDate: "2024-01-15T10:00:00Z",
                  sentForSignatureDate: "2024-01-15T14:00:00Z",
                  signedDate: "2024-01-17T10:45:00Z",
                  signatoryEmail:
                    "jean-marc.dubois@developpement-durable.gouv.fr",
                  signatoryName: "Jean-Marc DUBOIS",
                  signatoryTitle: "Directeur Interrégional",
                  changesSummary: {
                    newRisks: 20,
                    updatedRisks: 15,
                    newMeasures: 25,
                    updatedMeasures: 12,
                  },
                  signatureData: {
                    signedBy: "Jean-Marc DUBOIS",
                    signedAt: "2024-01-17T10:45:00Z",
                    ipAddress: "192.168.1.98",
                    userAgent: "Mozilla/5.0",
                    certificateId: "CERT-2024-01-17-003",
                  },
                  comments: "Première version 2024",
                },
              ]}
              directorEmail="jean-marc.dubois@developpement-durable.gouv.fr"
              directorName="Jean-Marc DUBOIS"
              onSendForSignature={(comments) => {
                console.log(
                  "Envoi pour signature avec commentaires:",
                  comments,
                );
                toast.success(
                  "Document envoyé pour signature au directeur",
                );
                // Ici on enverrait un email au directeur avec le lien de signature
              }}
              onViewDocument={(signatureId) => {
                console.log(
                  "Visualisation du document:",
                  signatureId,
                );
                toast.info("Ouverture du document...");
              }}
              onDownloadDocument={(signatureId) => {
                console.log(
                  "Téléchargement du document:",
                  signatureId,
                );
                toast.success(
                  "Téléchargement du document PDF en cours...",
                );
              }}
            />
          )}
        </div>
      </main>

      {/* Risk CRUD Dialogs */}
      <RiskFormDialog
        open={riskDialogOpen}
        onOpenChange={setRiskDialogOpen}
        risk={riskToEdit}
        onSave={handleSaveRisk}
        serviceOptions={serviceOptions}
        domainOptions={domainOptions}
        locationOptions={locationOptions}
        serviceCatalog={adminServices}
        riskReferences={riskReferences}
        concernedPersons={concernedPersons}
        suggestedNumber={nextRiskNumber(risks.map((risk) => risk.numeroRisque))}
      />

      <AlertDialog
        open={riskDeleteDialogOpen}
        onOpenChange={setRiskDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce risque ? La fiche reste dans le référentiel, avec la mention « Lié à aucun risque ».
              Cette action est irréversible et supprimera
              également toutes les actions planifiées associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRiskConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}