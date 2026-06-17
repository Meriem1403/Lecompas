import React, { useState, useEffect, useMemo, startTransition } from "react";
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
import { RiskFormDialog } from "./components/RiskFormDialog";
import { ListPaginationBar } from "./components/ui/list-pagination-bar";
import { RiskEditView } from "./components/RiskEditView";
import {
  AdminTabsView,
  FAKE_USERS,
  FAKE_DOMAINS,
  FAKE_LOCATIONS,
  FAKE_SERVICES,
} from "./components/AdminTabsView";
import { AppUser } from "./components/admin/UserManagementView";
import { DocumentsView } from "./components/DocumentsView";
import { ArchivesView } from "./components/ArchivesView";
import { RegistreAccidentsView } from "./components/RegistreAccidentsView";
import { SettingsView } from "./components/SettingsView";
import { CerbereView } from "./components/CerbereView";
import { ActualitesView } from "./components/ActualitesView";
import { NotificationBell } from "./components/NotificationBell";
import { ArriveesDepartsView } from "./components/ArriveesDepartsView";
import { ActionReturnHistory } from "./components/ActionReturnHistory";
import { RetourActionView } from "./components/RetourActionView";
import { DashboardView } from "./components/DashboardView";
import { DUERPSignatureManagement } from "./components/DUERPSignatureManagement";
import { RisksManagementView } from "./components/admin/RisksManagementView";
import {
  RiskReference,
  RiskReferencesManagementView,
} from "./components/admin/RiskReferencesManagementView";
import { RISK_REFERENCE_FIXTURES } from "./fixtures/riskReferenceFixtures";
import { CSN_PACA_CORSE_RISK_FIXTURES } from "./fixtures/csnPacaCorseRiskFixtures";
import { MercuryView } from "./components/MercuryView";
import { AsbestosView } from "./components/AsbestosView";
import { AsbestosAttestationsView } from "./components/AsbestosAttestationsView";
import { MedicalVisitsView } from "./components/MedicalVisitsView";
import { SSTRegistryView } from "./components/SSTRegistryView";
import { FishermanView } from "./components/FishermanView";
import { LoginPage } from "./components/LoginPage";
import { CategoriesView } from "./components/CategoriesView";
import { DUERPModulesView } from "./components/DUERPModulesView";
import { RHModulesView } from "./components/RHModulesView";
import { EnvironnementModulesView } from "./components/EnvironnementModulesView";
import { ApplicationsModulesView } from "./components/ApplicationsModulesView";
import { AdministrationModulesView } from "./components/AdministrationModulesView";
import { ComptabiliteModulesView } from "./components/ComptabiliteModulesView";
import { RepasView } from "./components/RepasView";
import { TeamView } from "./components/TeamView";
import { AccessManagementView } from "./components/AccessManagementView";
import { RiskAwarenessView } from "./components/RiskAwarenessView";
import { RiskAwarenessRecord } from "./components/RiskAwarenessView";
import { PreventionPlanView } from "./components/PreventionPlanView";
import { SafetyProtocolView } from "./components/SafetyProtocolView";
import {
  defaultSecuritySheetsState,
  SecuritySheetView,
} from "./components/SecuritySheetView";
import { ACCESS_MODULES } from "./components/access-management/constants";
import { loadAdminUsers, saveAdminUsers } from "./utils/adminUserRecord";
import { hydrateMealTickets } from "./utils/mealTicketIndexedDb";
import { MealTicket, getMealTicketsResetNonce, saveMealTickets, subscribeMealTicketsReset } from "./utils/mealTicketRecord";
import {
  loadMealSubsidyConfig,
  loadUserInmHistory,
  MealSubsidyConfig,
  repairMealSubsidyConfig,
  saveMealSubsidyConfig,
  saveUserInmHistory,
  UserInmHistoryEntry,
} from "./utils/mealSubsidyRecord";
import { MealSubsidyManagementView } from "./components/repas/MealSubsidyManagementView";
import {
  appUserDisplayName,
  appUserToMealProvider,
  resolvePrestataireByEmail,
  ROLE_PRESTATAIRE,
  sessionRoleFromAppRole,
} from "./utils/userRoles";
import {
  DEMO_LOGIN_ACCOUNTS,
  directoryUserToSessionUser,
  findDemoDirectoryUser,
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
  FileSignature,
  Database,
  Stethoscope,
  Fish,
  Info,
  ArrowLeft,
  ChevronLeft,
  Menu,
  FileCheck,
  UtensilsCrossed,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "./components/ui/progress";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "chef_service" | "agent" | "prestataire";
  service: string;
  domain?: string;
  location?: string;
}

interface Risk {
  id: string;
  numeroRisque: string; // Numéro risque
  title: string; // Risque
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
  const [activeView, setActiveView] = useState("categories");
  const [categoryView, setCategoryView] = useState<string | null>(null);
  const [risks, setRisks] = useState<Risk[]>(FAKE_RISKS);
  const [adminUsers, setAdminUsers] = useState<AppUser[]>(() => loadAdminUsers(FAKE_USERS));
  const [accessProfiles, setAccessProfiles] = useState<
    Record<string, EmployeeAccessProfile>
  >(() => {
    const defaultCrud = {
      create: true,
      read: true,
      update: true,
      delete: true,
    };
    return Object.fromEntries(
      FAKE_USERS.map((employee) => [
        employee.id,
        {
          employeeId: employee.id,
          modulePermissions: Object.fromEntries(
            ACCESS_MODULES.map((moduleItem) => [
              moduleItem.id,
              {
                canView: true,
                crud: defaultCrud,
              },
            ]),
          ),
        },
      ]),
    );
  });
  const [riskReferences, setRiskReferences] = useState<
    RiskReference[]
  >(RISK_REFERENCE_FIXTURES);
  const previousRiskReferencesRef = React.useRef<RiskReference[]>(
    riskReferences,
  );
  const [riskAwarenessRecords, setRiskAwarenessRecords] = useState<
    RiskAwarenessRecord[]
  >([]);
  const [securitySheets, setSecuritySheets] = useState(defaultSecuritySheetsState);
  const [adminServices, setAdminServices] = useState(FAKE_SERVICES);
  const [adminDomains, setAdminDomains] = useState(FAKE_DOMAINS);
  const [adminLocations, setAdminLocations] = useState(FAKE_LOCATIONS);
  const [accidents, setAccidents] =
    useState<Accident[]>(FAKE_ACCIDENTS);
  const [mealTickets, setMealTickets] = useState<MealTicket[]>([]);
  const [mealTicketsHydrated, setMealTicketsHydrated] = React.useState(false);
  const mealTicketsResetNonceRef = React.useRef(getMealTicketsResetNonce());
  const [mealSubsidyConfig, setMealSubsidyConfig] = useState<MealSubsidyConfig>(() =>
    loadMealSubsidyConfig(FAKE_LOCATIONS),
  );
  const [userInmHistory, setUserInmHistory] = useState<UserInmHistoryEntry[]>(() =>
    loadUserInmHistory(),
  );
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(
    null,
  );
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
    if (user.role === "admin") return true;

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
  const [riskServiceFilter, setRiskServiceFilter] =
    useState("all");
  const [riskStatusFilter, setRiskStatusFilter] =
    useState("all");
  const [riskLevelFilter, setRiskLevelFilter] =
    useState("all");
  const [riskNumberFilter, setRiskNumberFilter] =
    useState("all");
  const [riskSearchQuery, setRiskSearchQuery] = useState("");
  const [riskCurrentPage, setRiskCurrentPage] = useState(1);
  const riskPageSize = 6;

  const filteredVisibleRisks = React.useMemo(() => {
    const query = riskSearchQuery.trim().toLowerCase();
    return visibleRisks.filter((risk) => {
      const matchesService =
        riskServiceFilter === "all" ||
        risk.service === riskServiceFilter;
      const matchesStatus =
        riskStatusFilter === "all" ||
        risk.status === riskStatusFilter;
      const matchesRiskLevel =
        riskLevelFilter === "all" ||
        String(risk.riskLevel) === riskLevelFilter;
      const matchesRiskNumber =
        riskNumberFilter === "all" ||
        risk.numeroRisque === riskNumberFilter;

      const matchesSearch =
        query.length === 0 ||
        [
          risk.title,
          risk.situation,
          risk.associatedRisk,
          risk.responsable,
          risk.service,
          risk.domain || risk.unite,
          risk.site,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return (
        matchesService &&
        matchesStatus &&
        matchesRiskLevel &&
        matchesRiskNumber &&
        matchesSearch
      );
    });
  }, [
    visibleRisks,
    riskServiceFilter,
    riskStatusFilter,
    riskLevelFilter,
    riskNumberFilter,
    riskSearchQuery,
  ]);

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
  }, [
    riskServiceFilter,
    riskStatusFilter,
    riskLevelFilter,
    riskNumberFilter,
    riskSearchQuery,
  ]);

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
      selectedServiceConfig?.domains.filter((domain) =>
        domainOptions.includes(domain),
      ) || domainOptions;
    const allowedLocations =
      selectedServiceConfig?.locations.filter((location) =>
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
          numeroRisque: matchingReference.current.numeroRisque,
          title: matchingReference.current.title,
          updatedAt: new Date().toISOString(),
        };
      });

      return hasChanges ? updatedRisks : previousRisks;
    });

    previousRiskReferencesRef.current = riskReferences;
  }, [riskReferences]);

  React.useEffect(() => {
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
      const key = `${risk.numeroRisque}::${risk.title}`;
      sourceByKey.set(key, {
        riskNumber: risk.numeroRisque,
        riskTitle: risk.title,
      });
    });

    setRiskAwarenessRecords((previous) => {
      const previousByRiskKey = new Map<string, RiskAwarenessRecord[]>();
      previous.forEach((record) => {
        const bucket = previousByRiskKey.get(record.riskKey) || [];
        bucket.push(record);
        previousByRiskKey.set(record.riskKey, bucket);
      });

      return Array.from(sourceByKey.entries()).flatMap(([riskKey, source]) => {
        const existingRecords = previousByRiskKey.get(riskKey) || [];
        if (existingRecords.length > 0) {
          return existingRecords.map((existing) => ({
            ...existing,
            riskNumber: source.riskNumber,
            riskTitle: source.riskTitle,
          }));
        }
        return [
          {
            id: crypto.randomUUID(),
            riskKey,
            riskNumber: source.riskNumber,
            riskTitle: source.riskTitle,
            summary: "",
            content: "",
            links: [],
            documents: [],
            status: "a_completer",
          },
        ];
      });
    });
  }, [riskReferences, risks]);

  // Notifications state (actualités non lues)
  const [notifications, setNotifications] = useState<any[]>([
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
  ]);

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
      (u) => u.email.toLowerCase() === lookupEmail.toLowerCase(),
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

  // Handle Login
  const handleLogin = async (
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
        u.email.toLowerCase() === email.toLowerCase() ||
        u.email.toLowerCase() === directoryLookupEmail.toLowerCase(),
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
      "prestataire@dirm-med.gouv.fr": "prestataire",
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

    /**
     * startTransition évite un conflit DOM (insertBefore) sur Chrome Android :
     * le démontage brutal de la page de login + mise à jour Sonner en même temps
     * faisait planter le moteur de rendu.
     */
    startTransition(() => {
      setUser(resolvedUser);
      setAccessToken(token);
      setIsAuthenticated(true);

      if (rememberMe) {
        localStorage.setItem(
          "duerp_user",
          JSON.stringify({
            id: resolvedUser.id,
            email: resolvedUser.email,
            name: resolvedUser.name,
            role: resolvedUser.role,
            service: resolvedUser.service,
            domain: resolvedUser.domain,
            location: resolvedUser.location,
          }),
        );
        localStorage.setItem("duerp_token", token);
      }
    });

    return true;
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    setAccessToken("");
    setIsAuthenticated(false);
    setActiveView("dashboard");
    localStorage.removeItem("duerp_user");
    localStorage.removeItem("duerp_token");
    queueMicrotask(() => toast.info("Déconnexion réussie"));
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement
  React.useEffect(() => {
    const savedUser = localStorage.getItem("duerp_user");
    const savedToken = localStorage.getItem("duerp_token");

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        const synced = syncSessionWithDirectory(
          {
            id: userData.id ?? `user-${Date.now()}`,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            service: userData.service ?? "",
            domain: userData.domain,
            location: userData.location,
          },
          FAKE_USERS,
        );
        setUser(synced);
        setAccessToken(savedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données utilisateur",
          error,
        );
        localStorage.removeItem("duerp_user");
        localStorage.removeItem("duerp_token");
      }
    }
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;
    const synced = syncSessionWithDirectory(user, adminUsers);
    if (!sessionUsersMatch(user, synced)) {
      setUser(synced);
      if (localStorage.getItem("duerp_token")) {
        localStorage.setItem("duerp_user", JSON.stringify(synced));
      }
    }
  }, [adminUsers, isAuthenticated]);

  React.useEffect(() => {
    saveAdminUsers(adminUsers);
  }, [adminUsers]);

  React.useEffect(() => {
    return subscribeMealTicketsReset(() => {
      mealTicketsResetNonceRef.current = getMealTicketsResetNonce();
      setMealTickets([]);
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void hydrateMealTickets().then((loaded) => {
      if (!cancelled) {
        setMealTickets(loaded);
        setMealTicketsHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!mealTicketsHydrated) return;
    const nonceAtSchedule = mealTicketsResetNonceRef.current;
    const timer = window.setTimeout(() => {
      const nonceNow = getMealTicketsResetNonce();
      if (nonceNow !== nonceAtSchedule && mealTickets.length > 0) {
        return;
      }
      mealTicketsResetNonceRef.current = nonceNow;
      saveMealTickets(mealTickets);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [mealTickets, mealTicketsHydrated]);

  React.useEffect(() => {
    setMealSubsidyConfig((prev) => repairMealSubsidyConfig(prev, adminLocations));
  }, [adminLocations]);

  React.useEffect(() => {
    saveMealSubsidyConfig(mealSubsidyConfig);
  }, [mealSubsidyConfig]);

  React.useEffect(() => {
    saveUserInmHistory(userInmHistory);
  }, [userInmHistory]);

  const currentMealProvider = useMemo(() => {
    if (!user || user.role !== "prestataire") return null;
    const prestataire = resolvePrestataireByEmail(adminUsers, user.email);
    return prestataire ? appUserToMealProvider(prestataire) : null;
  }, [user, adminUsers]);

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

  // Action Returns state
  const [actionReturns, setActionReturns] = useState<
    ActionReturn[]
  >([
    {
      id: "ar1",
      riskId: "1",
      riskTitle: "Risque de chute sur sol glissant",
      proposedBy: "Chef de Service Maritime",
      proposedDate: "2026-02-01T10:30:00",
      proposedMeasure:
        "Installation de tapis antidérapants dans les zones à risque",
      justification:
        "Les panneaux de signalisation sont insuffisants. J'ai constaté que plusieurs agents ont failli glisser malgré les panneaux. L'ajout de tapis antidérapants réduirait significativement le risque.",
      status: "pending",
    },
    {
      id: "ar2",
      riskId: "2",
      riskTitle: "Exposition aux produits chimiques",
      proposedBy: "Chef de Service Technique",
      proposedDate: "2026-01-28T14:20:00",
      proposedMeasure:
        "Système de ventilation automatique avec détecteurs de gaz",
      justification:
        "La ventilation naturelle n'est pas suffisante pendant les périodes de forte chaleur. Un système automatique garantirait une extraction continue des vapeurs.",
      status: "validated_replace",
      targetMeasureIndex: 0,
      targetMeasureText: "Ventilation naturelle des locaux",
      reviewedBy: "Administrateur Démo",
      reviewedDate: "2026-01-29T09:15:00",
      reviewComment:
        "Excellente proposition. La ventilation automatique offre une meilleure protection.",
    },
    {
      id: "ar3",
      riskId: "5",
      riskTitle: "Risque lié au poste en télétravail",
      proposedBy: "Bernard Lemoine",
      proposedDate: "2025-12-11T11:30:00",
      proposedMeasure:
        "Mise en place d'un système de validation hebdomadaire des postures de travail par visioconférence avec un ergonome",
      justification:
        "La formation seule ne suffit pas. Un suivi régulier permettrait de corriger les mauvaises postures avant qu'elles ne deviennent problématiques.",
      status: "pending",
    },
    {
      id: "ar4",
      riskId: "3",
      riskTitle: "Risque électrique sur équipements",
      proposedBy: "Chef de Service Maintenance",
      proposedDate: "2026-01-25T16:45:00",
      proposedMeasure:
        "Formation spécialisée aux habilitations électriques pour tous les agents",
      justification:
        "Suite à un audit, il apparaît que certains agents manipulent des équipements électriques sans formation adéquate.",
      status: "rejected",
      reviewedBy: "Administrateur Démo",
      reviewedDate: "2026-01-26T11:00:00",
      reviewComment:
        "Budget 2026 déjà alloué. Proposition à revoir pour 2027.",
    },
    {
      id: "ar5",
      riskId: "5",
      riskTitle: "Risque lié au poste en télétravail",
      proposedBy: "Bernard Lemoine",
      proposedDate: "2025-12-11T10:44:00",
      proposedMeasure:
        "Installation de filtres anti-lumière bleue sur tous les écrans",
      justification:
        "Plusieurs agents se plaignent de fatigue oculaire. Les filtres anti-lumière bleue pourraient améliorer le confort visuel.",
      status: "validated_add",
      reviewedBy: "Administrateur Démo",
      reviewedDate: "2025-12-11T11:18:00",
      reviewComment: "",
    },
    {
      id: "ar6",
      riskId: "5",
      riskTitle: "Risque lié au poste en télétravail",
      proposedBy: "Bernard Lemoine",
      proposedDate: "2025-12-11T11:30:00",
      proposedMeasure:
        "Organisation de pauses actives collectives obligatoires toutes les 2 heures",
      justification:
        "L'isolement et le manque d'activité physique sont des problèmes récurrents. Des pauses collectives permettraient de maintenir le lien social et encourager le mouvement.",
      status: "pending",
    },
  ]);
  const [actionReturnsCurrentPage, setActionReturnsCurrentPage] =
    useState(1);
  const [actionReturnsSearch, setActionReturnsSearch] = useState("");
  const [actionReturnsServiceFilter, setActionReturnsServiceFilter] =
    useState("all");
  const [actionReturnsAuthorFilter, setActionReturnsAuthorFilter] =
    useState("all");
  const [actionReturnsRiskFilter, setActionReturnsRiskFilter] =
    useState("all");
  const ACTION_RETURNS_PAGE_SIZE = 6;
  const pendingActionReturns = actionReturns.filter(
    (ar) => ar.status === "pending",
  );
  const filteredPendingActionReturns = pendingActionReturns.filter(
    (actionReturn) => {
      const linkedRisk = risks.find((r) => r.id === actionReturn.riskId);
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
        .map((ar) => risks.find((r) => r.id === ar.riskId)?.service || "")
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
          const risk = risks.find((r) => r.id === ar.riskId);
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
    setActiveView("create_risk");
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

  const handleDeleteRiskConfirm = () => {
    if (riskToDelete) {
      const targetId = String(riskToDelete);
      setRisks((prev) =>
        prev.filter((r) => String(r.id) !== targetId),
      );
      toast.success("Risque supprimé avec succès");
      setRiskDeleteDialogOpen(false);
      setRiskToDelete(null);
      if (String(selectedRisk?.id) === targetId) {
        setSelectedRisk(null);
      }
    }
  };

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
      // Add new risk
      const newRisk: Risk = {
        ...riskData,
        id: `risk-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRisks((prev) => [newRisk, ...prev]);
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
    const newActionReturn: ActionReturn = {
      ...actionReturnData,
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
    setActiveView("risks");
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
                    ? risks.find(
                        (r) => r.id === actionReturn.riskId,
                      )?.existingMeasures[targetMeasureIndex]
                    : undefined,
              }
            : ar,
        ),
      );

      // Mettre à jour les mesures du risque
      setRisks((prev) =>
        prev.map((risk) => {
          if (risk.id === actionReturn.riskId) {
            if (action === "add") {
              // Ajouter la nouvelle mesure
              return {
                ...risk,
                existingMeasures: [
                  ...risk.existingMeasures,
                  actionReturn.proposedMeasure,
                ],
                updatedAt: new Date().toISOString(),
              };
            } else if (
              action === "replace" &&
              targetMeasureIndex !== undefined
            ) {
              // Remplacer la mesure existante
              const newMeasures = [...risk.existingMeasures];
              newMeasures[targetMeasureIndex] =
                actionReturn.proposedMeasure;
              return {
                ...risk,
                existingMeasures: newMeasures,
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
          r.plannedMeasures.filter(
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
      section: "Applications",
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
          id: "access-management",
          label: "Gestion des accès",
          icon: Cog,
          color: "text-violet-600",
        },
      ],
    },
    {
      section: "Communication",
      items: [
        {
          id: "actualites",
          label: "Actualités",
          icon: Bell,
          color: "text-indigo-600",
        },
      ],
    },
    {
      section: "Administration",
      items: [
        {
          id: "risks-management",
          label: "Gestion des risques",
          icon: Database,
          color: "text-red-600",
        },
        {
          id: "risk-references",
          label: "Référentiel des risques",
          icon: FileText,
          color: "text-amber-600",
        },
        {
          id: "action-returns",
          label: "Retours d'action",
          icon: MessageSquare,
          color: "text-emerald-600",
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
      ],
    },
    {
      section: "Prévention",
      items: [
        {
          id: "risks",
          label: "Évaluation des risques",
          icon: Shield,
          color: "text-purple-500",
        },
        {
          id: "risk-awareness",
          label: "Sensibilisation aux risques",
          icon: Info,
          color: "text-orange-600",
        },
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
        {
          id: "documents",
          label: "Documents DUERP",
          icon: FileText,
          color: "text-orange-500",
        },
        {
          id: "archives",
          label: "Archives (40 ans)",
          icon: Archive,
          color: "text-red-500",
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
          id: "fisherman",
          label: "Gestion de la pêche",
          icon: Fish,
          color: "text-teal-600",
        },
      ],
    },
    {
      section: "Validation",
      items: [
        {
          id: "signature-duerp",
          label: "Signature DUERP",
          icon: FileSignature,
          color: "text-purple-600",
        },
      ],
    },
    {
      section: "Comptabilité",
      items: [
        {
          id: "repas",
          label: "Repas",
          icon: UtensilsCrossed,
          color: "text-emerald-600",
        },
        {
          id: "tarifs-repas",
          label: "Tarifs repas",
          icon: Coins,
          color: "text-violet-600",
        },
      ],
    },
    {
      section: "Système",
      items: [
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

    const moduleExists = ACCESS_MODULES.some(
      (moduleItem) => moduleItem.id === viewId,
    );
    if (!moduleExists) return true;

    if (!currentAdminUser) return true;
    const profile = accessProfiles[currentAdminUser.id];
    if (!profile) return true;
    return profile.modulePermissions[viewId]?.canView ?? true;
  };

  const filteredSidebarItems = sidebarItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.id === "tarifs-repas" && user?.role !== "admin") return false;
        return hasViewAccess(item.id);
      }),
    }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    if (!user) return;
    if (activeView === "categories" || activeView === "category-modules") return;
    if (!hasViewAccess(activeView)) {
      toast.error("Accès non autorisé pour cet onglet.");
      setActiveView("dashboard");
    }
  }, [activeView, user, accessProfiles, currentAdminUser]);

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
          onSelectCategory={(categoryId) => {
            setCategoryView(categoryId);
            setActiveView("category-modules");
          }}
          onGoToDashboard={() => setActiveView("dashboard")}
          onGoToRisks={() => setActiveView("risks")}
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
            onSelectModule={(moduleId) => {
              setActiveView(moduleId);
              setCategoryView(null);
            }}
            onGoBack={() => setActiveView("categories")}
          />
        </>
      );
    }
    if (categoryView === "rh") {
      return (
        <>
          <RHModulesView
            onSelectModule={(moduleId) => {
              setActiveView(moduleId);
              setCategoryView(null);
            }}
            onGoBack={() => setActiveView("categories")}
          />
        </>
      );
    }
    if (categoryView === "environnement") {
      return (
        <>
          <EnvironnementModulesView
            onSelectModule={(moduleId) => {
              setActiveView(moduleId);
              setCategoryView(null);
            }}
            onGoBack={() => setActiveView("categories")}
          />
        </>
      );
    }
    if (categoryView === "communication") {
      setActiveView("actualites");
      setCategoryView(null);
    }
    if (categoryView === "applications") {
      return (
        <>
          <ApplicationsModulesView
            onSelectModule={(moduleId) => {
              setActiveView(moduleId);
              setCategoryView(null);
            }}
            onGoBack={() => setActiveView("categories")}
          />
        </>
      );
    }
    if (categoryView === "administration") {
      return (
        <>
          <AdministrationModulesView
            onSelectModule={(moduleId) => {
              setActiveView(moduleId);
              setCategoryView(null);
            }}
            onGoBack={() => setActiveView("categories")}
          />
        </>
      );
    }
    if (categoryView === "validation") {
      setActiveView("signature-duerp");
      setCategoryView(null);
    }
    if (categoryView === "informatique") {
      setActiveView("cerbere");
      setCategoryView(null);
    }
    if (categoryView === "comptabilite") {
      return (
        <>
          <ComptabiliteModulesView
            isAdmin={user?.role === "admin"}
            onSelectModule={(moduleId) => {
              setActiveView(moduleId);
              setCategoryView(null);
            }}
            onGoBack={() => setActiveView("categories")}
          />
        </>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex">

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
        className={`w-72 bg-white/80 backdrop-blur-xl border-r border-purple-100 flex flex-col shadow-xl fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 overflow-hidden lg:static lg:z-auto lg:translate-x-0 ${
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
              setActiveView("categories");
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
                const directoryUser = findDemoDirectoryUser(
                  adminUsers,
                  newRole,
                );

                if (newRole === "prestataire" && !directoryUser) {
                  toast.error(
                    "Créez d'abord un prestataire dans Utilisateurs → onglet Prestataires",
                  );
                  return;
                }

                if (!directoryUser) {
                  toast.error(
                    "Aucun utilisateur correspondant dans l'onglet Utilisateurs.",
                  );
                  return;
                }

                const syncedUser = directoryUserToSessionUser(
                  directoryUser,
                  newRole,
                );
                setUser(syncedUser);
                if (localStorage.getItem("duerp_token")) {
                  localStorage.setItem(
                    "duerp_user",
                    JSON.stringify(syncedUser),
                  );
                }
                const roleLabels: Record<User["role"], string> = {
                  admin: "Administrateur",
                  chef_service: "Chef de service",
                  agent: "Agent",
                  prestataire: "Prestataire",
                };
                toast.success(`Rôle changé : ${roleLabels[newRole]}`);
                if (newRole === "prestataire") {
                  setActiveView("repas");
                  setIsMobileSidebarOpen(false);
                }
              }}
              className="w-full px-3 py-2 text-sm font-semibold bg-white border-2 border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 cursor-pointer"
            >
              <option value="agent">Agent</option>
              <option value="admin">Administrateur</option>
              <option value="chef_service">Chef de service</option>
              <option value="prestataire">Prestataire</option>
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
                            setActiveView(item.id);
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
                          <span>{item.label}</span>
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
                  {user?.role}
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
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
                          : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <UserCog className="h-3 w-3 mr-1" />
                    {user?.role === "admin"
                      ? "Administrateur"
                      : user?.role === "chef_service"
                        ? "Chef de service"
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
                  notifications={notifications}
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
                    setNotifications(
                      notifications.map((n) => ({
                        ...n,
                        isRead: true,
                      })),
                    );
                  }}
                  onNavigateToActualites={() =>
                    setActiveView("actualites")
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
                        setActiveView("retour_action");
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Dashboard View */}
          {activeView === "dashboard" && (
            <DashboardView
              risks={risks}
              accidents={accidents}
              onNavigateToRisk={(risk) => {
                setSelectedRisk(risk);
                setActiveView("risks");
              }}
              getCategoryIcon={getCategoryIcon}
              getCategoryColor={getCategoryColor}
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
              profiles={accessProfiles}
              onProfilesChange={setAccessProfiles}
            />
          )}

          {/* Mercury Campaigns View */}
          {activeView === "mercury" && <MercuryView />}

          {/* Asbestos Diagnostics View */}
          {activeView === "asbestos" && <AsbestosView />}

          {/* Asbestos Attestations View */}
          {activeView === "asbestos-attestations" && (
            <AsbestosAttestationsView
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
            />
          )}

          {/* Medical Visits View */}
          {activeView === "medical-visits" && (
            <MedicalVisitsView risks={risks} users={adminUsers} />
          )}

          {/* SST Registry View */}
          {activeView === "sst-registry" && (
            <SSTRegistryView
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
            />
          )}

          {/* Fisherman View */}
          {activeView === "fisherman" && (
            <FishermanView
              currentUserName={user?.name || "Utilisateur"}
            />
          )}

          {/* Retour Action View */}
          {activeView === "retour_action" && selectedRisk && (
            <RetourActionView
              risk={selectedRisk}
              user={user}
              actionReturns={actionReturns}
              onBack={() => {
                setActiveView("risks");
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
                  id: (Math.max(...risks.map((r) => parseInt(r.id)), 0) + 1).toString(),
                  ...riskData,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setRisks([...risks, newRisk]);
                setActiveView("risks");
                toast.success("Risque créé avec succès");
              }}
              onCancel={() => setActiveView("risks")}
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
                          Identification et évaluation des
                          risques professionnels
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

                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-7 gap-3">
                        <div className="xl:col-span-2">
                          <Input
                            placeholder="Rechercher (risque, service, domaine, lieux, responsable...)"
                            value={riskSearchQuery}
                            onChange={(e) =>
                              setRiskSearchQuery(e.target.value)
                            }
                          />
                        </div>
                        <Select
                          value={riskServiceFilter}
                          onValueChange={setRiskServiceFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Tous les services
                            </SelectItem>
                            {[...new Set(visibleRisks.map((r) => r.service))]
                              .sort()
                              .map((service) => (
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
                          value={riskStatusFilter}
                          onValueChange={setRiskStatusFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Tous les statuts
                            </SelectItem>
                            <SelectItem value="a_traiter">
                              A traiter
                            </SelectItem>
                            <SelectItem value="en_traitement">
                              En traitement
                            </SelectItem>
                            <SelectItem value="maitrise">
                              Maitrise
                            </SelectItem>
                            <SelectItem value="supprime">
                              Supprime
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={riskLevelFilter}
                          onValueChange={setRiskLevelFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Tous niveaux
                            </SelectItem>
                            {[...new Set(
                              visibleRisks.map((r) =>
                                String(r.riskLevel),
                              ),
                            )]
                              .sort(
                                (a, b) =>
                                  Number(a) - Number(b),
                              )
                              .map((riskLevel) => (
                                <SelectItem
                                  key={riskLevel}
                                  value={riskLevel}
                                >
                                  Niveau {riskLevel}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={riskNumberFilter}
                          onValueChange={setRiskNumberFilter}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="N° risque" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              Tous les numéros
                            </SelectItem>
                            {[...new Set(
                              visibleRisks.map(
                                (r) => r.numeroRisque,
                              ),
                            )]
                              .sort()
                              .map((riskNumber) => (
                                <SelectItem
                                  key={riskNumber}
                                  value={riskNumber}
                                >
                                  {riskNumber}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-600">
                          {filteredVisibleRisks.length} risque(s)
                          affiché(s)
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRiskServiceFilter("all");
                            setRiskStatusFilter("all");
                            setRiskLevelFilter("all");
                            setRiskNumberFilter("all");
                            setRiskSearchQuery("");
                            setRiskCurrentPage(1);
                          }}
                        >
                          Réinitialiser les filtres
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                        const progress =
                          totalActions > 0
                            ? (completedActions /
                                totalActions) *
                              100
                            : 0;

                        return (
                          <Card
                            key={risk.id}
                            className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group hover:scale-105 bg-white/80 backdrop-blur overflow-hidden relative"
                            onClick={() => {
                              setSelectedRisk(risk);
                              setIsEditingRisk(false);
                            }}
                          >
                            <div
                              className={`h-2 bg-gradient-to-r ${priorityGradient}`}
                            ></div>

                            {/* Action Buttons - Visible on hover */}
                            {user?.role === 'admin' && (
                              <div className="absolute left-4 right-4 top-4 z-10 flex flex-col gap-2 opacity-100 transition-opacity sm:left-auto sm:right-4 sm:flex-row sm:opacity-0 sm:group-hover:opacity-100">
                                <Button
                                  size="sm"
                                  onClick={(e) =>
                                    handleEditRisk(risk, e)
                                  }
                                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) =>
                                    handleDeleteRiskClick(
                                      risk.id,
                                      e,
                                    )
                                  }
                                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            )}

                            <CardHeader>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="text-center p-3 rounded-xl bg-white border-2 border-slate-200 shadow-sm min-w-[130px]">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                    Priorité finale
                                  </p>
                                  <p className={`text-3xl font-extrabold mt-1 bg-gradient-to-r ${priorityGradient} bg-clip-text text-transparent`}>
                                    {risk.prioriteFinale}
                                  </p>
                                </div>
                                <Badge
                                  className={`bg-gradient-to-r ${getRiskLevelColor(risk.riskLevel)} text-white border-0 shadow-lg flex items-center`}
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {getRiskLevelLabel(
                                    risk.riskLevel,
                                  )}{" "}
                                  - {risk.riskLevel}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg mt-4 group-hover:text-purple-600 transition-colors font-bold">
                                <div className="space-y-2">
                                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 shadow-sm">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                                      Numéro du risque
                                    </span>
                                    <span className="font-mono text-xs font-bold text-violet-900">
                                      {risk.numeroRisque}
                                    </span>
                                  </div>
                                  <p>{risk.title}</p>
                                </div>
                              </CardTitle>
                              <CardDescription className="line-clamp-2 text-gray-600">
                                {risk.situation}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Service / Domaine / Lieux */}
                                <div className="space-y-2">
                                  {risk.service && (
                                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                      <Building2 className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                        Service :
                                      </span>
                                      <span className="text-sm font-semibold text-blue-700">
                                        {risk.service}
                                      </span>
                                    </div>
                                  )}
                                  {(risk.domain || risk.unite) && (
                                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                                      <Layers className="h-4 w-4 text-indigo-600" />
                                      <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                                        Domaine :
                                      </span>
                                      <span className="text-sm font-semibold text-indigo-700">
                                        {risk.domain || risk.unite}
                                      </span>
                                    </div>
                                  )}
                                  {risk.site && (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                      <MapPin className="h-4 w-4 text-emerald-600" />
                                      <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                        Lieux :
                                      </span>
                                      <span className="text-sm font-semibold text-emerald-700">
                                        {risk.site}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600 font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      Avancement actions
                                    </span>
                                    <span className="font-bold text-purple-600">
                                      {completedActions}/
                                      {totalActions}
                                    </span>
                                  </div>
                                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 shadow-md"
                                      style={{
                                        width: `${progress}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs text-gray-600 font-semibold">Gravité</Label>
                                    <div className={`w-full text-center py-3 rounded-lg font-bold text-base border-2 ${
                                      risk.severity === 4 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' :
                                      risk.severity === 3 ? 'bg-blue-50 border-blue-400 text-blue-700' :
                                      risk.severity === 2 ? 'bg-cyan-50 border-cyan-400 text-cyan-700' :
                                      'bg-teal-50 border-teal-400 text-teal-700'
                                    }`}>
                                      {risk.severity}/4
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs text-gray-600 font-semibold">Probabilité</Label>
                                    <div className={`w-full text-center py-3 rounded-lg font-bold text-base border-2 ${
                                      risk.probability === 4 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' :
                                      risk.probability === 3 ? 'bg-blue-50 border-blue-400 text-blue-700' :
                                      risk.probability === 2 ? 'bg-cyan-50 border-cyan-400 text-cyan-700' :
                                      'bg-teal-50 border-teal-400 text-teal-700'
                                    }`}>
                                      {risk.probability}/4
                                    </div>
                                  </div>
                                </div>

                                <div className={`rounded-xl border-2 p-4 text-center bg-gradient-to-r ${priorityGradient} text-white shadow-md`}>
                                  <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
                                    Priorisation
                                  </p>
                                  <p className="text-2xl font-extrabold">
                                    {getRiskLevelLabel(risk.riskLevel)}
                                  </p>
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
                /* Risk Detail View */
                <div className="space-y-6">
                  <div className="flex justify-start sm:justify-end mb-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRisk(null);
                        setIsEditingRisk(false);
                      }}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
                      <CardHeader>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
                            <div className={`rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 shadow-lg text-center min-w-[150px]`}>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                Priorité finale
                              </p>
                              <p className={`text-3xl font-extrabold mt-1 bg-gradient-to-r ${getRiskLevelColor(selectedRisk.riskLevel)} bg-clip-text text-transparent`}>
                                {selectedRisk.prioriteFinale}
                              </p>
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold">
                                {selectedRisk.title}
                              </CardTitle>
                              <Badge
                                className={`mt-2 bg-gradient-to-r ${getRiskLevelColor(selectedRisk.riskLevel)} text-white border-0 shadow-md`}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {getRiskLevelLabel(
                                  selectedRisk.riskLevel,
                                )}{" "}
                                - Niveau{" "}
                                {selectedRisk.riskLevel}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                            {user?.role === "chef_service" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setActiveView("retour_action")
                                }
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                              >
                                <Send className="h-3.5 w-3.5 mr-1" />
                                Retour d'action
                              </Button>
                            )}
                            {user?.role === 'admin' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setIsEditingRisk(true)
                                  }
                                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) =>
                                    handleDeleteRiskClick(
                                      selectedRisk.id,
                                      e,
                                    )
                                  }
                                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Supprimer
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Informations administratives - Section mise en avant */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl shadow-lg border border-gray-200 text-gray-800 space-y-4">
                          <h3 className="text-2xl font-bold flex items-center mb-4 text-gray-700">
                            <Building2 className="h-6 w-6 mr-3" />
                            Identification du risque
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-200">
                              <p className="text-xs font-semibold mb-1 text-gray-500 flex items-center">
                                <FileText className="h-3 w-3 mr-1" />{" "}
                                Numéro de risque
                              </p>
                              <p className="text-lg font-bold text-gray-800">
                                {selectedRisk.numeroRisque}
                              </p>
                            </div>
                            <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-200">
                              <p className="text-xs font-semibold mb-1 text-gray-500 flex items-center">
                                <User className="h-3 w-3 mr-1" />{" "}
                                Responsable
                              </p>
                              <p className="text-lg font-bold text-gray-800">
                                {selectedRisk.responsable}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="bg-white/80 backdrop-blur p-3 rounded-xl border border-gray-200">
                              <p className="text-xs font-semibold mb-1 text-gray-500 flex items-center">
                                <Users className="h-3 w-3 mr-1" />{" "}
                                Services
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(selectedRisk.service || "")
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                                  .map((service) => (
                                    <Badge
                                      key={service}
                                      variant="outline"
                                      className="bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      {service}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur p-3 rounded-xl border border-gray-200">
                              <p className="text-xs font-semibold mb-1 text-gray-500 flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />{" "}
                                Domaines
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(selectedRisk.domain || selectedRisk.unite || "")
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                                  .map((domain) => (
                                    <Badge
                                      key={domain}
                                      variant="outline"
                                      className="bg-orange-50 text-orange-700 border-orange-200"
                                    >
                                      {domain}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur p-3 rounded-xl border border-gray-200">
                              <p className="text-xs font-semibold mb-1 text-gray-500 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />{" "}
                                Lieux
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(selectedRisk.site || "")
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean)
                                  .map((location) => (
                                    <Badge
                                      key={location}
                                      variant="outline"
                                      className="bg-cyan-50 text-cyan-700 border-cyan-200"
                                    >
                                      {location}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Situation dangereuse */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                            Situation dangereuse
                          </h4>
                          <p className="text-gray-700 bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                            {selectedRisk.situation}
                          </p>
                        </div>

                        <Separator />

                        {/* Dommages associés */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-red-500" />
                            Dommages associés
                          </h4>
                          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <p className="text-gray-700">
                              {selectedRisk.associatedRisk}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Mesures existantes */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Mesures de prévention existantes
                          </h4>
                          <ul className="space-y-2">
                            {selectedRisk.existingMeasures &&
                            selectedRisk.existingMeasures
                              .length > 0 ? (
                              selectedRisk.existingMeasures.map(
                                (measure, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start"
                                  >
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200 mr-2"
                                    >
                                      {idx + 1}
                                    </Badge>
                                    <span className="text-gray-700">
                                      {measure}
                                    </span>
                                  </li>
                                ),
                              )
                            ) : (
                              <p className="text-gray-500 italic">
                                Aucune mesure existante définie
                              </p>
                            )}
                          </ul>
                        </div>

                        <Separator />

                        {/* Mesures planifiées */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            Actions planifiées (
                            {selectedRisk.plannedMeasures?.filter(
                              (m) => m.status === "completed",
                            ).length || 0}
                            /
                            {selectedRisk.plannedMeasures
                              ?.length || 0}{" "}
                            terminées)
                          </h4>
                          <div className="space-y-3">
                            {selectedRisk.plannedMeasures &&
                            selectedRisk.plannedMeasures
                              .length > 0 ? (
                              selectedRisk.plannedMeasures.map(
                                (measure, idx) => (
                                  <Card
                                    key={idx}
                                    className={`border-2 ${measure.status === "completed" ? "border-green-300 bg-green-50" : measure.status === "in_progress" ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                                        <div className="flex items-start space-x-3 flex-1">
                                          <Badge
                                            className={`${measure.status === "completed" ? "bg-green-500" : measure.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"} text-white flex items-center gap-1`}
                                          >
                                            {measure.status ===
                                            "completed" ? (
                                              <>
                                                <CheckCircle className="h-3 w-3" />{" "}
                                                Terminée
                                              </>
                                            ) : measure.status ===
                                              "in_progress" ? (
                                              <>
                                                <Loader className="h-3 w-3" />{" "}
                                                En cours
                                              </>
                                            ) : (
                                              <>
                                                <Clock className="h-3 w-3" />{" "}
                                                En attente
                                              </>
                                            )}
                                          </Badge>
                                          <div className="flex-1">
                                            <p className="font-semibold text-gray-900">
                                              {
                                                measure.description
                                              }
                                            </p>
                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                              <div>
                                                <span className="text-gray-500 font-medium">
                                                  Responsable:
                                                </span>
                                                <p className="text-gray-700 font-semibold">
                                                  {
                                                    measure.responsible
                                                  }
                                                </p>
                                              </div>
                                              <div>
                                                <span className="text-gray-500 font-medium">
                                                  Échéance:
                                                </span>
                                                <p className="text-gray-700 font-semibold">
                                                  {new Date(
                                                    measure.deadline,
                                                  ).toLocaleDateString(
                                                    "fr-FR",
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ),
                              )
                            ) : (
                              <p className="text-gray-500 italic">
                                Aucune action planifiée
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Observation - MISE EN AVANT */}
                        <Separator className="my-6" />
                        {selectedRisk.observation && (
                          <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl shadow-lg border border-gray-200 text-gray-800 space-y-3 mt-6">
                            <h3 className="text-2xl font-bold flex items-center mb-3 text-gray-700">
                              <AlertCircle className="h-6 w-6 mr-3" />
                              Observation
                            </h3>
                            <div className="bg-white/80 backdrop-blur p-5 rounded-xl border border-gray-200">
                              <p className="text-base font-medium leading-relaxed text-gray-800">
                                {selectedRisk.observation}
                              </p>
                            </div>
                          </div>
                        )}

                        <Separator className="my-6" />

                        {/* Bouton Faire un retour d'action */}
                        {user?.role === "chef_service" && (
                          <div className="flex justify-center">
                            <Button
                              onClick={() =>
                                setActiveView("retour_action")
                              }
                              size="lg"
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                              <Send className="h-5 w-5 mr-2" />
                              Faire un retour d'action
                            </Button>
                          </div>
                        )}

                        <Separator className="my-6" />

                        {/* Historique des retours d'action */}
                        <ActionReturnHistory
                          actionReturns={actionReturns.filter(
                            (ar) =>
                              ar.riskId === selectedRisk.id,
                          )}
                          userRole={user?.role}
                          onManageActionReturns={() => {
                            setActiveView("retour_action");
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Sidebar - Evaluation & Metadata */}
                    <div className="space-y-6">
                      {/* Evaluation Card */}
                      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Target className="h-5 w-5 mr-2 text-purple-500" />
                            Évaluation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                              <p className="text-gray-600 text-xs font-semibold mb-1">
                                Gravité
                              </p>
                              <p className="font-bold text-3xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                {selectedRisk.severity}/4
                              </p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
                              <p className="text-gray-600 text-xs font-semibold mb-1">
                                Probabilité
                              </p>
                              <p className="font-bold text-3xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                                {selectedRisk.probability}/4
                              </p>
                            </div>
                          </div>

                          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300">
                            <p className="text-gray-600 text-xs font-semibold mb-1">
                              Niveau de risque
                            </p>
                            <p className="font-bold text-4xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                              {selectedRisk.riskLevel}
                            </p>
                            <p className="text-sm font-semibold text-gray-600 mt-1">
                              {getRiskLevelLabel(
                                selectedRisk.riskLevel,
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Progress Card */}
                      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                            Avancement
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 font-semibold">
                                Actions réalisées
                              </span>
                              <span className="font-bold text-purple-600">
                                {selectedRisk.plannedMeasures?.filter(
                                  (m) =>
                                    m.status === "completed",
                                ).length || 0}
                                /
                                {selectedRisk.plannedMeasures
                                  ?.length || 0}
                              </span>
                            </div>
                            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 shadow-md"
                                style={{
                                  width: `${selectedRisk.plannedMeasures && selectedRisk.plannedMeasures.length > 0 ? (selectedRisk.plannedMeasures.filter((m) => m.status === "completed").length / selectedRisk.plannedMeasures.length) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                              {selectedRisk.plannedMeasures &&
                              selectedRisk.plannedMeasures
                                .length > 0
                                ? Math.round(
                                    (selectedRisk.plannedMeasures.filter(
                                      (m) =>
                                        m.status ===
                                        "completed",
                                    ).length /
                                      selectedRisk
                                        .plannedMeasures
                                        .length) *
                                      100,
                                  )
                                : 0}
                              % complété
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
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
            />
          )}

          {activeView === "risk-awareness" && (
            <RiskAwarenessView
              userRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
              records={riskAwarenessRecords}
              setRecords={setRiskAwarenessRecords}
              exposedRiskKeys={visibleRisks.map(
                (risk) => `${risk.numeroRisque}::${risk.title}`,
              )}
            />
          )}
          {activeView === "prevention-plan" && (
            <PreventionPlanView
              risks={visibleRisks}
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || "Utilisateur"}
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
              risks={risks}
              currentUserRole={user?.role || "agent"}
              currentUserName={user?.name || ""}
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
            />
          )}

          {activeView === "risk-references" && (
            <RiskReferencesManagementView
              references={riskReferences}
              setReferences={setRiskReferences}
            />
          )}

          {/* Action Returns View */}
          {activeView === "action-returns" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Retours d'action
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Gérer les propositions des chefs de service
                    </p>
                  </div>
                </div>
              </div>

              {/* List of Action Returns */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      placeholder="Rechercher (risque, mesure, auteur...)"
                      value={actionReturnsSearch}
                      onChange={(e) =>
                        setActionReturnsSearch(e.target.value)
                      }
                    />
                    <Select
                      value={actionReturnsServiceFilter}
                      onValueChange={setActionReturnsServiceFilter}
                    >
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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

              <div className="grid grid-cols-1 gap-6">
                {filteredPendingActionReturns.length === 0 ? (
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="h-12 w-12 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-lg mb-4">
                        Aucun retour d'action en attente
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedPendingActionReturns.map((actionReturn) => {
                    const risk = risks.find(r => r.id === actionReturn.riskId);
                    if (!risk) return null;

                    return (
                      <Card
                        key={actionReturn.id}
                        className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group hover:scale-[1.01] bg-white/80 backdrop-blur overflow-hidden"
                        onClick={() => {
                          setSelectedRisk(risk);
                          setActiveView("retour_action");
                        }}
                      >
                        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors font-bold">
                                {risk.title}
                              </CardTitle>
                              <CardDescription className="mt-2 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Proposé par {actionReturn.proposedBy}
                              </CardDescription>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(actionReturn.proposedDate).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </CardDescription>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              En attente
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-gray-600 font-semibold">Mesure proposée</Label>
                              <p className="text-sm text-gray-900 mt-1 bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">
                                {actionReturn.proposedMeasure}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 font-semibold">Justification</Label>
                              <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                {actionReturn.justification}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="h-4 w-4" />
                                {risk.service} - {risk.site}
                              </div>
                              <ChevronRight className="h-5 w-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
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
              adminDisplayName={user?.name}
              inmHistory={userInmHistory}
              onInmHistoryChange={setUserInmHistory}
            />
          )}

          {activeView === "tarifs-repas" && user?.role === "admin" && (
            <MealSubsidyManagementView
              config={mealSubsidyConfig}
              setConfig={setMealSubsidyConfig}
              locations={adminLocations}
              onGoBack={() => setCategoryView("comptabilite")}
            />
          )}

          {/* Documents view */}
          {activeView === "documents" && <DocumentsView />}

          {/* Archives view */}
          {activeView === "archives" && <ArchivesView />}

          {/* Registre accidents view */}
          {activeView === "registre" && (
            <RegistreAccidentsView
              risks={duerpRiskRefs}
              agents={adminUsers}
              serviceOptions={serviceOptions}
              domainOptions={domainOptions}
              locationOptions={locationOptions}
            />
          )}

          {/* Settings view */}
          {activeView === "settings" && <SettingsView />}

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
            />
          )}

          {/* Actualités view */}
          {activeView === "actualites" && (
            <ActualitesView userRole={user?.role || "agent"} />
          )}

          {/* Arrivées & Départs view */}
          {activeView === "repas" && user && (
            <RepasView
              currentUser={user}
              adminUsers={adminUsers}
              services={serviceNames}
              domains={domainNames}
              locations={locationNames}
              locationCatalog={adminLocations}
              mealTickets={mealTickets}
              setMealTickets={setMealTickets}
              currentProvider={currentMealProvider}
              mealSubsidyConfig={mealSubsidyConfig}
              setMealSubsidyConfig={setMealSubsidyConfig}
              userInmHistory={userInmHistory}
            />
          )}

          {activeView === "arrivees-departs" && (
            <ArriveesDepartsView
              userRole={user?.role || "agent"}
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
              Êtes-vous sûr de vouloir supprimer ce risque ?
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