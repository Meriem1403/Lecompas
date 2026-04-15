import React, { useState, useEffect } from "react";
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
import { ActionsView } from "./components/ActionsView";
import { RiskFormDialog } from "./components/RiskFormDialog";
import { RiskEditView } from "./components/RiskEditView";
import {
  AdminTabsView,
  FAKE_DOMAINS,
  FAKE_LOCATIONS,
  FAKE_SERVICES,
} from "./components/AdminTabsView";
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
import { AdministrationModulesView } from "./components/AdministrationModulesView";
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
  ArrowLeft,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Progress } from "./components/ui/progress";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "chef_service" | "agent";
  service: string;
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
  status: "identifié" | "en_cours" | "traité"; // Etat d'avancement
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
  title: string;
  description: string;
  severity: "bénin" | "modéré" | "grave" | "très_grave";
  type: "travail" | "trajet" | "maladie_pro";
  victim: string;
  location: string;
  witnesses: string[];
  measures: string;
  createdAt: string;
}

// Fake data
const FAKE_RISKS: Risk[] = [
  {
    id: "1",
    numeroRisque: "RISK-2026-001",
    title: "Risque de chute sur sol glissant",
    unite: "Unité Administrative",
    service: "Service Affaires Maritimes",
    site: "Siège Marseille",
    situation:
      "Sol mouillé dans le couloir principal du bâtiment A suite au nettoyage quotidien",
    associatedRisk:
      "Chute de plain-pied pouvant entraîner des traumatismes (entorses, fractures)",
    category: "mécanique",
    responsable: "Jean Martin (Responsable HSE)",
    severity: 3,
    probability: 3,
    riskLevel: 9,
    existingMeasures: [
      'Panneaux de signalisation "Sol glissant"',
      "Nettoyage hors heures de pointe",
      "Chaussures antidérapantes fournies au personnel",
    ],
    moyenMaitrise:
      "Mesures de prévention collectives et individuelles",
    calculPriorite: 9,
    prioriteFinale: 6,
    plannedMeasures: [
      {
        description:
          "Installation de tapis antidérapants dans les zones à risque",
        responsible: "Marie Dupont (Services Généraux)",
        deadline: "2026-03-15",
        status: "in_progress",
      },
      {
        description:
          "Formation du personnel de nettoyage sur les techniques de séchage rapide",
        responsible: "Jean Martin (Responsable HSE)",
        deadline: "2026-02-28",
        status: "completed",
        completedDate: "2026-01-20",
        effectiveness:
          "Temps de séchage réduit de 40%, aucune chute constatée depuis",
      },
    ],
    status: "en_cours",
    echeance: "2026-03-31",
    retourAction:
      "Formation effectuée avec succès. Installation en cours.",
    observation:
      "Amélioration significative constatée depuis la mise en place des mesures",
    createdAt: "2025-12-15T10:00:00Z",
    updatedAt: "2026-01-20T15:30:00Z",
  },
  {
    id: "2",
    numeroRisque: "RISK-2026-002",
    title: "Exposition aux produits chimiques - Atelier",
    unite: "Unité Technique",
    service: "Service Technique",
    site: "Port de Marseille",
    situation:
      "Manipulation quotidienne de solvants et produits chimiques dans l'atelier de peinture sans ventilation adéquate",
    associatedRisk:
      "Intoxication par inhalation, brûlures chimiques, dermatoses professionnelles",
    category: "chimique",
    responsable: "Pierre Leclerc (Chef de service)",
    severity: 4,
    probability: 3,
    riskLevel: 12,
    existingMeasures: [
      "EPI : gants nitrile, masque FFP2",
      "Fiches de données de sécurité disponibles",
      "Formation annuelle manipulation produits chimiques",
      "Douche de sécurité installée",
    ],
    moyenMaitrise:
      "EPI, ventilation, formation et substitution de produits",
    calculPriorite: 12,
    prioriteFinale: 8,
    plannedMeasures: [
      {
        description:
          "Installation d'un système de ventilation VMC dans l'atelier",
        responsible: "Pierre Leclerc (Maintenance)",
        deadline: "2026-04-30",
        status: "pending",
      },
      {
        description:
          "Remplacement des solvants par des produits moins toxiques",
        responsible: "Sophie Bernard (Achats)",
        deadline: "2026-06-15",
        status: "pending",
      },
      {
        description:
          "Mise en place d'une surveillance médicale renforcée",
        responsible: "Dr. Laurent (Médecin du travail)",
        deadline: "2026-03-01",
        status: "in_progress",
      },
    ],
    status: "identifié",
    echeance: "2026-06-30",
    retourAction:
      "Surveillance médicale en cours. Étude de substitution lancée.",
    observation:
      "Risque prioritaire nécessitant une action rapide",
    createdAt: "2025-11-10T08:00:00Z",
    updatedAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "3",
    numeroRisque: "RISK-2026-003",
    title: "Travail en hauteur - Maintenance toiture",
    unite: "Unité Maintenance",
    service: "Service Technique",
    site: "Port de Toulon",
    situation:
      "Interventions de maintenance sur toiture plate à 8 mètres de hauteur sans système antichute permanent",
    associatedRisk:
      "Chute de hauteur avec risque de blessures graves voire mortelles",
    category: "mécanique",
    responsable: "Marc Durand (Responsable travaux)",
    severity: 4,
    probability: 2,
    riskLevel: 8,
    existingMeasures: [
      "Harnais de sécurité individuel",
      "Ligne de vie temporaire",
      "Autorisation de travail en hauteur obligatoire",
      "Formation travail en hauteur validée",
      "Contrôle visuel des EPI avant chaque intervention",
    ],
    moyenMaitrise:
      "Protection collective et individuelle, autorisation de travail",
    calculPriorite: 8,
    prioriteFinale: 4,
    plannedMeasures: [
      {
        description:
          "Installation de lignes de vie permanentes sur toute la toiture",
        responsible: "Marc Durand (Travaux)",
        deadline: "2026-05-30",
        status: "in_progress",
      },
      {
        description:
          "Mise en place de garde-corps permanents aux zones d'accès",
        responsible: "Marc Durand (Travaux)",
        deadline: "2026-05-30",
        status: "pending",
      },
    ],
    status: "en_cours",
    echeance: "2026-05-31",
    retourAction:
      "Travaux de sécurisation en cours. Livraison prévue dans les délais.",
    observation:
      "Investissement important nécessaire pour la sécurité",
    createdAt: "2025-10-05T14:00:00Z",
    updatedAt: "2026-01-10T11:00:00Z",
  },
  {
    id: "4",
    numeroRisque: "RISK-2026-004",
    title: "Risques psychosociaux - Service client",
    unite: "Unité Administrative",
    service: "Service Formation",
    site: "Siège Marseille",
    situation:
      "Charge de travail élevée au service client avec pics d'activité réguliers, clients agressifs, objectifs de performance élevés",
    associatedRisk:
      "Stress chronique, burn-out, troubles anxieux, démotivation, turnover élevé",
    category: "psychosocial",
    responsable: "Anne Petit (Manager Service Client)",
    severity: 3,
    probability: 4,
    riskLevel: 12,
    existingMeasures: [
      "Entretiens annuels d'évaluation",
      "Cellule d'écoute psychologique",
      "Droit à la déconnexion",
      "Formation gestion du stress",
    ],
    moyenMaitrise:
      "Organisation du travail, soutien psychologique, formation",
    calculPriorite: 12,
    prioriteFinale: 6,
    plannedMeasures: [
      {
        description:
          "Embauche de 2 conseillers supplémentaires pour réduire la charge",
        responsible: "Claire Dubois (RH)",
        deadline: "2026-03-31",
        status: "in_progress",
      },
      {
        description:
          "Mise en place de pause relaxation 10 min/jour",
        responsible: "Anne Petit (Manager Service Client)",
        deadline: "2026-02-15",
        status: "completed",
        completedDate: "2026-02-01",
        effectiveness:
          "Retours positifs des équipes, baisse de 25% des arrêts maladie",
      },
      {
        description:
          "Réorganisation des plannings pour mieux répartir les pics",
        responsible: "Anne Petit (Manager Service Client)",
        deadline: "2026-02-28",
        status: "in_progress",
      },
    ],
    status: "en_cours",
    echeance: "2026-03-31",
    retourAction:
      "Mesures en cours d'application. Amélioration déjà constatée.",
    observation:
      "Suivi régulier nécessaire avec les équipes RH",
    createdAt: "2025-09-20T09:00:00Z",
    updatedAt: "2026-02-01T16:00:00Z",
  },
  {
    id: "5",
    numeroRisque: "RISK-2026-005",
    title:
      "Troubles musculo-squelettiques - Postes de travail bureau",
    unite: "Unité Administrative",
    service: "Service Administratif",
    site: "Siège Marseille",
    situation:
      "Postes de travail sur écran non ergonomiques, sièges inadaptés, absence de matériel ergonomique",
    associatedRisk:
      "TMS (tendinites, lombalgies, cervicalgies), fatigue visuelle",
    category: "ergonomique",
    responsable: "Sophie Bernard (Responsable Achats)",
    severity: 2,
    probability: 4,
    riskLevel: 8,
    existingMeasures: [
      "Écrans ajustables en hauteur",
      "Formation gestes et postures",
      "Pauses recommandées toutes les 2h",
    ],
    moyenMaitrise:
      "Aménagement ergonomique des postes, formation",
    calculPriorite: 8,
    prioriteFinale: 4,
    plannedMeasures: [
      {
        description:
          "Remplacement de tous les sièges par des sièges ergonomiques",
        responsible: "Sophie Bernard (Achats)",
        deadline: "2026-04-15",
        status: "pending",
      },
      {
        description:
          "Fourniture de souris et claviers ergonomiques",
        responsible: "Sophie Bernard (Achats)",
        deadline: "2026-03-30",
        status: "pending",
      },
      {
        description:
          "Audit ergonomique de tous les postes de travail",
        responsible: "Cabinet ERGOCONFORT",
        deadline: "2026-02-28",
        status: "in_progress",
      },
    ],
    status: "identifié",
    echeance: "2026-04-30",
    retourAction:
      "Audit en cours. Commandes prévues selon recommandations.",
    observation:
      "Amélioration progressive du confort de travail",
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-01-10T14:00:00Z",
  },
  {
    id: "6",
    numeroRisque: "RISK-2026-006",
    title: "Risque électrique - Armoires électriques",
    unite: "Unité Maintenance",
    service: "Service Technique",
    site: "Siège Marseille",
    situation:
      "Armoires électriques vétustes dans le sous-sol, certaines portes ne ferment plus correctement",
    associatedRisk:
      "Électrisation, électrocution, incendie d'origine électrique",
    category: "électrique",
    responsable: "Pierre Leclerc (Chef maintenance)",
    severity: 4,
    probability: 2,
    riskLevel: 8,
    existingMeasures: [
      "Habilitations électriques du personnel",
      "Signalisation danger électrique",
      "Vérifications annuelles réglementaires",
      "Consignation avant intervention",
    ],
    moyenMaitrise:
      "Habilitation, signalisation, vérifications périodiques",
    calculPriorite: 8,
    prioriteFinale: 3,
    plannedMeasures: [
      {
        description:
          "Remplacement complet des armoires électriques du sous-sol",
        responsible: "Entreprise ELEC PRO",
        deadline: "2026-06-30",
        status: "pending",
      },
      {
        description:
          "Mise en place de verrous à clé sur toutes les armoires",
        responsible: "Pierre Leclerc (Maintenance)",
        deadline: "2026-03-15",
        status: "in_progress",
      },
    ],
    status: "identifié",
    echeance: "2026-06-30",
    retourAction:
      "Appel d'offres lancé pour le remplacement. Sécurisation temporaire en cours.",
    observation:
      "Risque grave nécessitant une attention prioritaire",
    createdAt: "2025-11-20T11:00:00Z",
    updatedAt: "2026-01-12T10:00:00Z",
  },
];

const FAKE_ACCIDENTS: Accident[] = [
  {
    id: "1",
    date: "2026-01-25",
    title: "Chute dans escalier - blessure cheville",
    description:
      "L'employée descendait l'escalier principal en portant un carton. Elle a manqué une marche et s'est tordu la cheville. Transport aux urgences, diagnostic : entorse cheville gauche grade 2.",
    severity: "modéré",
    type: "travail",
    victim: "Amélie Rousseau",
    location: "Escalier principal, 2ème étage",
    witnesses: ["Thomas Blanchard", "Julie Mercier"],
    measures:
      "Arrt de travail 15 jours. Main courante renforcée. Rappel : ne pas porter de charges lourdes dans les escaliers.",
    createdAt: "2026-01-25T14:30:00Z",
  },
  {
    id: "2",
    date: "2026-01-18",
    title: "Brûlure chimique - projection produit",
    description:
      "Lors du transvasement d'un produit de nettoyage concentré, projection dans l'œil malgré le port de lunettes. Rinçage immédiat au poste de rinçage oculaire pendant 15 minutes.",
    severity: "grave",
    type: "travail",
    victim: "Carlos Mendes",
    location: "Local produits chimiques, Bâtiment B",
    witnesses: ["Fatima El Amrani"],
    measures:
      "Transport SAMU. Bilan ophtalmologique : brûlure superficielle cornée. Arrêt 7 jours. Formation complémentaire manipulation produits chimiques programmée. Révision procédure transvasement.",
    createdAt: "2026-01-18T10:15:00Z",
  },
  {
    id: "3",
    date: "2026-01-10",
    title: "Accident de trajet - collision routière",
    description:
      "Accident de la route sur le trajet domicile-travail. Collision avec un autre véhicule à un carrefour.",
    severity: "modéré",
    type: "trajet",
    victim: "Stéphane Moreau",
    location:
      "Carrefour Avenue de la République / Rue Victor Hugo",
    witnesses: [],
    measures:
      "Déclaration accident de trajet. Arrêt de travail 21 jours. Fracture côte + contusions multiples. Suivi médical en cours.",
    createdAt: "2026-01-10T08:45:00Z",
  },
  {
    id: "4",
    date: "2026-01-05",
    title: "Coupure main - manipulation carton",
    description:
      "Coupure profonde à la main droite lors de l'ouverture d'un carton avec un cutter. Lame a dérapé.",
    severity: "bénin",
    type: "travail",
    victim: "Nadia Benali",
    location: "Réserve, rez-de-chaussée",
    witnesses: ["Karim Ziani"],
    measures:
      "Soins infirmerie. Suture 3 points au centre de soins. Arrêt de travail 3 jours. Rappel : utiliser les cutters de sécurité avec lame rétractable.",
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
  const [adminServices, setAdminServices] = useState(FAKE_SERVICES);
  const [adminDomains, setAdminDomains] = useState(FAKE_DOMAINS);
  const [adminLocations, setAdminLocations] = useState(FAKE_LOCATIONS);
  const [accidents, setAccidents] =
    useState<Accident[]>(FAKE_ACCIDENTS);
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

  const serviceOptions = adminServices.map((s) => s.name);
  const domainOptions = adminDomains.map((d) => d.name);
  const locationOptions = adminLocations.map((l) => l.name);

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

  // Handle Login
  const handleLogin = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<boolean> => {
    // Vérification des identifiants de démonstration
    const demoAccounts = [
      {
        email: "admin@dirm-med.gouv.fr",
        password: "admin123",
        name: "Jean-Marc DUBOIS",
        role: "admin" as const,
        service: "Direction",
      },
      {
        email: "chef@dirm-med.gouv.fr",
        password: "chef123",
        name: "Marie MARTIN",
        role: "chef_service" as const,
        service: "Secrétariat Général",
      },
      {
        email: "agent@dirm-med.gouv.fr",
        password: "agent123",
        name: "Pierre LECLERC",
        role: "agent" as const,
        service: "Service Technique",
      },
    ];

    const account = demoAccounts.find(
      (acc) => acc.email === email && acc.password === password,
    );

    if (account) {
      // Simuler la récupération du token
      const token = `token-${Date.now()}`;

      setUser({
        id: `user-${Date.now()}`,
        email: account.email,
        name: account.name,
        role: account.role,
        service: account.service,
      });
      setAccessToken(token);
      setIsAuthenticated(true);

      // Sauvegarder dans localStorage si "Se souvenir de moi"
      if (rememberMe) {
        localStorage.setItem(
          "duerp_user",
          JSON.stringify({
            email: account.email,
            name: account.name,
            role: account.role,
            service: account.service,
          }),
        );
        localStorage.setItem("duerp_token", token);
      }

      return true;
    }

    return false;
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    setAccessToken("");
    setIsAuthenticated(false);
    setActiveView("dashboard");
    localStorage.removeItem("duerp_user");
    localStorage.removeItem("duerp_token");
    toast.info("Déconnexion réussie");
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement
  React.useEffect(() => {
    const savedUser = localStorage.getItem("duerp_user");
    const savedToken = localStorage.getItem("duerp_token");

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser({
          id: `user-${Date.now()}`,
          ...userData,
        });
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
      setRisks((prev) =>
        prev.filter((r) => r.id !== riskToDelete),
      );
      toast.success("Risque supprimé avec succès");
      setRiskDeleteDialogOpen(false);
      setRiskToDelete(null);
      if (selectedRisk?.id === riskToDelete) {
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
  const handleAddAccident = (accidentData: any) => {
    const newAccident: Accident = {
      ...accidentData,
      id: `accident-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAccidents((prev) => [newAccident, ...prev]);
  };

  const handleUpdateAccident = (accidentData: any) => {
    setAccidents((prev) =>
      prev.map((a) =>
        a.id === accidentData.id
          ? { ...a, ...accidentData }
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
    if (level >= 12) return "from-red-500 to-rose-600";
    if (level >= 8) return "from-orange-500 to-amber-600";
    if (level >= 4) return "from-yellow-400 to-orange-400";
    return "from-green-400 to-emerald-500";
  };

  const getRiskLevelLabel = (level: number) => {
    if (level >= 12) return "Critique";
    if (level >= 8) return "Élevé";
    if (level >= 4) return "Moyen";
    return "Faible";
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
      title: "Risques Critiques",
      value: risks.filter((r) => r.riskLevel >= 12).length,
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
      ],
    },
    {
      section: "DUERP Manager",
      items: [
        {
          id: "risks",
          label: "Évaluation des risques",
          icon: Shield,
          color: "text-purple-500",
        },
        {
          id: "accidents",
          label: "Accidentologie",
          icon: AlertCircle,
          color: "text-red-500",
        },
        {
          id: "registre",
          label: "Registre Accidents",
          icon: ClipboardList,
          color: "text-rose-500",
        },
        {
          id: "actions",
          label: "Plan d'actions",
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
          label: "Arrivées & Départs",
          icon: ClipboardList,
          color: "text-teal-600",
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
          label: "Attestations Amiante",
          icon: FileSignature,
          color: "text-amber-600",
        },
        {
          id: "fisherman",
          label: "Gestion pêche",
          icon: Fish,
          color: "text-teal-600",
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
        {
          id: "categories",
          label: "Catégories",
          icon: Tag,
          color: "text-pink-600",
        },
        {
          id: "cerbere",
          label: "Applications Cerbère",
          icon: Shield,
          color: "text-indigo-600",
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

  // Si l'utilisateur n'est pas authentifié, afficher la page de login
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // Vue catégories (page d'accueil)
  if (activeView === "categories") {
    return (
      <>
        <Toaster position="top-right" />
        <CategoriesView
          onSelectCategory={(categoryId) => {
            setCategoryView(categoryId);
            setActiveView("category-modules");
          }}
          onGoToDashboard={() => setActiveView("dashboard")}
        />
      </>
    );
  }

  // Vue modules d'une catégorie
  if (activeView === "category-modules" && categoryView) {
    if (categoryView === "duerp") {
      return (
        <>
          <Toaster position="top-right" />
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
          <Toaster position="top-right" />
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
          <Toaster position="top-right" />
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
    if (categoryView === "administration") {
      return (
        <>
          <Toaster position="top-right" />
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-purple-100 flex flex-col shadow-xl">
        <div className="p-6 border-b border-purple-100">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Plateforme DI-MED
              </h1>
              <p className="text-xs text-purple-600 font-medium">
                Direction Interrégionale de la Mer
              </p>
            </div>
          </div>

          {/* Bouton retour aux catégories */}
          <button
            onClick={() => setActiveView("categories")}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
          >
            <LayoutDashboard className="h-4 w-4" />
            Retour aux catégories
          </button>

          {/* Role Selector */}
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              🎭 Rôle actuel :
            </p>
            <select
              value={user?.role || "agent"}
              onChange={(e) => {
                const newRole = e.target.value as
                  | "admin"
                  | "chef_service"
                  | "agent";
                setUser(
                  user ? { ...user, role: newRole } : null,
                );
                toast.success(
                  `Rôle changé : ${
                    newRole === "admin"
                      ? "Administrateur"
                      : newRole === "chef_service"
                        ? "Chef de service"
                        : "Agent"
                  }`,
                );
              }}
              className="w-full px-3 py-2 text-sm font-semibold bg-white border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="agent">Agent</option>
              <option value="admin">Administrateur</option>
              <option value="chef_service">
                Chef de service
              </option>
            </select>
            <p className="text-xs text-gray-600 mt-2">
              Connecté :{" "}
              <span className="font-semibold text-gray-900">
                {user?.name}
              </span>
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-6">
            {sidebarItems.map((section, index) => {
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
                          onClick={() => setActiveView(item.id)}
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
        </ScrollArea>

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
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Bonjour {user?.name}
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
            <MedicalVisitsView risks={risks} />
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
            />
          )}

          {/* Risks View */}
          {activeView === "risks" && (
            <div className="space-y-6">
              {!selectedRisk ? (
                <>
                  {/* Header with Add Button */}
                  <div className="flex items-start justify-between">
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
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Nouveau risque
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {risks.length === 0 ? (
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
                      risks.map((risk) => {
                        const Icon = getCategoryIcon(
                          risk.category,
                        );
                        const gradient = getCategoryColor(
                          risk.category,
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
                              className={`h-2 bg-gradient-to-r ${gradient}`}
                            ></div>

                            {/* Action Buttons - Visible on hover */}
                            {user?.role === 'admin' && (
                              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
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
                              <div className="flex items-start justify-between">
                                <div
                                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform`}
                                >
                                  <Icon className="h-7 w-7 text-white" />
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
                                {risk.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 text-gray-600">
                                {risk.situation}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Service Badge */}
                                {risk.service && (
                                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-700">
                                      {risk.service}
                                    </span>
                                  </div>
                                )}

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

                                <div className="grid grid-cols-2 gap-3">
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

                                <Badge
                                  variant="outline"
                                  className={`w-full justify-center capitalize font-bold border-2 bg-gradient-to-r ${gradient} text-white border-0 py-2 flex items-center gap-2`}
                                >
                                  {React.createElement(
                                    getCategoryIcon(
                                      risk.category,
                                    ),
                                    { className: "h-4 w-4" },
                                  )}
                                  {risk.category}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
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
                />
              ) : selectedRisk ? (
                /* Risk Detail View */
                <div className="space-y-6">
                  <div className="flex justify-end mb-4">
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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(selectedRisk.category)} flex items-center justify-center shadow-lg`}
                            >
                              {React.createElement(
                                getCategoryIcon(
                                  selectedRisk.category,
                                ),
                                {
                                  className:
                                    "h-8 w-8 text-white",
                                },
                              )}
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
                          <div className="flex space-x-2">
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
                          <div className="grid grid-cols-2 gap-4">
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
                          <div className="grid grid-cols-3 gap-3">
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

                        {/* Risques associés */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-red-500" />
                            Risques associés
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
                                      <div className="flex items-start justify-between mb-2">
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
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
                          <div className="grid grid-cols-2 gap-4">
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

                      {/* Category Card */}
                      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Tag className="h-5 w-5 mr-2 text-purple-500" />
                            Catégorie
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge
                            className={`w-full justify-center capitalize font-bold border-0 bg-gradient-to-r ${getCategoryColor(selectedRisk.category)} text-white py-3 text-base`}
                          >
                            {React.createElement(
                              getCategoryIcon(
                                selectedRisk.category,
                              ),
                              { className: "h-5 w-5 mr-2" },
                            )}
                            {selectedRisk.category}
                          </Badge>
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
              onAdd={handleAddAccident}
              onUpdate={handleUpdateAccident}
              onDelete={handleDeleteAccident}
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
              <div className="grid grid-cols-1 gap-6">
                {actionReturns.filter(ar => ar.status === 'pending').length === 0 ? (
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
                  actionReturns.filter(ar => ar.status === 'pending').map((actionReturn) => {
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
              domainsData={adminDomains}
              setDomainsData={setAdminDomains}
              locationsData={adminLocations}
              setLocationsData={setAdminLocations}
            />
          )}

          {/* Documents view */}
          {activeView === "documents" && <DocumentsView />}

          {/* Archives view */}
          {activeView === "archives" && <ArchivesView />}

          {/* Registre accidents view */}
          {activeView === "registre" && (
            <RegistreAccidentsView />
          )}

          {/* Settings view */}
          {activeView === "settings" && <SettingsView />}

          {/* Cerbere view */}
          {activeView === "cerbere" && <CerbereView />}

          {/* Actualités view */}
          {activeView === "actualites" && (
            <ActualitesView userRole={user?.role || "agent"} />
          )}

          {/* Arrivées & Départs view */}
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