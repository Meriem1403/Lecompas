import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  UserPlus,
  UserMinus,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Search,
  Calendar,
  User,
  Briefcase,
  Award,
  ClipboardList,
  Filter,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ArriveesDepartsNewDemandePage } from '@/app/components/ArriveesDepartsNewDemandePage';
import { ArriveesDepartsDetailPage } from '@/app/components/ArriveesDepartsDetailPage';
import { ArriveesDepartsQuestionnaireFormPage } from '@/app/components/ArriveesDepartsQuestionnaireFormPage';
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';

// Types
interface Question {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: {
    showIfQuestionId: string;
    showIfAnswer: string | string[];
  };
}

interface Questionnaire {
  id: string;
  nom: string;
  description: string;
  type: 'arrivee' | 'depart';
  questions: Question[];
  actif: boolean;
  createdAt: string;
  createdBy: string;
}

interface Demande {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
  corps: string;
  grade: string;
  statutDemande: 'brouillon' | 'en_attente' | 'validee' | 'refusee';
  typeDemande: 'arrivee' | 'depart';
  questionnaireId: string;
  reponses: Record<string, any>;
  createdAt: string;
  createdBy: string;
  validatedAt?: string;
  validatedBy?: string;
  commentaire?: string;
}

// Données fictives - Questionnaires
const mockQuestionnaires: Questionnaire[] = [
  {
    id: 'q1',
    nom: 'Questionnaire d\'arrivée standard',
    description: 'Questions pour les nouveaux arrivants',
    type: 'arrivee',
    actif: true,
    createdAt: '2026-01-15',
    createdBy: 'Admin Système',
    questions: [
      {
        id: 'q1_1',
        type: 'text',
        label: 'Quelle est votre formation initiale ?',
        required: true,
      },
      {
        id: 'q1_2',
        type: 'radio',
        label: 'Avez-vous déjà travaillé dans le secteur maritime ?',
        required: true,
        options: ['Oui', 'Non'],
      },
      {
        id: 'q1_3',
        type: 'textarea',
        label: 'Si oui, décrivez vos précédentes expériences',
        required: false,
        conditionalLogic: {
          showIfQuestionId: 'q1_2',
          showIfAnswer: 'Oui',
        },
      },
      {
        id: 'q1_4',
        type: 'checkbox',
        label: 'Quelles formations souhaitez-vous suivre ?',
        required: false,
        options: [
          'Sécurité incendie',
          'Premiers secours',
          'DUERP et prévention des risques',
          'Habilitations électriques',
          'Travail en hauteur',
        ],
      },
      {
        id: 'q1_5',
        type: 'radio',
        label: 'Avez-vous des restrictions médicales pour certaines tâches ?',
        required: true,
        options: ['Oui', 'Non', 'Préfère ne pas répondre'],
      },
      {
        id: 'q1_6',
        type: 'textarea',
        label: 'Si oui, précisez',
        required: false,
        conditionalLogic: {
          showIfQuestionId: 'q1_5',
          showIfAnswer: 'Oui',
        },
      },
      {
        id: 'q1_7',
        type: 'date',
        label: 'Date de disponibilité souhaitée',
        required: true,
      },
    ],
  },
  {
    id: 'q2',
    nom: 'Questionnaire de départ',
    description: 'Questions pour les agents quittant le service',
    type: 'depart',
    actif: true,
    createdAt: '2026-01-20',
    createdBy: 'Admin Système',
    questions: [
      {
        id: 'q2_1',
        type: 'radio',
        label: 'Raison du départ',
        required: true,
        options: ['Mutation', 'Retraite', 'Démission', 'Fin de contrat', 'Autre'],
      },
      {
        id: 'q2_2',
        type: 'textarea',
        label: 'Si autre, précisez',
        required: false,
        conditionalLogic: {
          showIfQuestionId: 'q2_1',
          showIfAnswer: 'Autre',
        },
      },
      {
        id: 'q2_3',
        type: 'date',
        label: 'Date de départ prévue',
        required: true,
      },
      {
        id: 'q2_4',
        type: 'radio',
        label: 'Avez-vous du matériel à restituer ?',
        required: true,
        options: ['Oui', 'Non'],
      },
      {
        id: 'q2_5',
        type: 'checkbox',
        label: 'Quel matériel devez-vous restituer ?',
        required: true,
        options: [
          'Badge d\'accès',
          'Ordinateur portable',
          'Téléphone professionnel',
          'Clés',
          'Véhicule de service',
          'Équipements de protection individuelle',
        ],
        conditionalLogic: {
          showIfQuestionId: 'q2_4',
          showIfAnswer: 'Oui',
        },
      },
      {
        id: 'q2_6',
        type: 'textarea',
        label: 'Commentaires ou suggestions pour améliorer le service',
        required: false,
      },
    ],
  },
];

// Données fictives - Demandes
const mockDemandes: Demande[] = [
  {
    id: 'd1',
    nom: 'Martin',
    prenom: 'Sophie',
    statut: 'Titulaire',
    corps: 'Administratif',
    grade: 'Attaché',
    statutDemande: 'validee',
    typeDemande: 'arrivee',
    questionnaireId: 'q1',
    reponses: {
      q1_1: 'Master en administration publique',
      q1_2: 'Oui',
      q1_3: 'J\'ai travaillé 3 ans au port autonome de Bordeaux',
      q1_4: ['Sécurité incendie', 'DUERP et prévention des risques'],
      q1_5: 'Non',
      q1_7: '2026-03-01',
    },
    createdAt: '2026-01-20',
    createdBy: 'Sophie Martin',
    validatedAt: '2026-01-22',
    validatedBy: 'Admin Système',
  },
  {
    id: 'd2',
    nom: 'Dubois',
    prenom: 'Laurent',
    statut: 'Contractuel',
    corps: 'Technique',
    grade: 'Technicien',
    statutDemande: 'en_attente',
    typeDemande: 'arrivee',
    questionnaireId: 'q1',
    reponses: {
      q1_1: 'BTS Maintenance industrielle',
      q1_2: 'Non',
      q1_4: ['Habilitations électriques', 'Travail en hauteur'],
      q1_5: 'Non',
      q1_7: '2026-02-15',
    },
    createdAt: '2026-02-01',
    createdBy: 'Laurent Dubois',
  },
  {
    id: 'd3',
    nom: 'Leroy',
    prenom: 'Marie',
    statut: 'Titulaire',
    corps: 'Administratif',
    grade: 'Secrétaire administratif',
    statutDemande: 'en_attente',
    typeDemande: 'depart',
    questionnaireId: 'q2',
    reponses: {
      q2_1: 'Retraite',
      q2_3: '2026-06-30',
      q2_4: 'Oui',
      q2_5: ['Badge d\'accès', 'Ordinateur portable', 'Clés'],
      q2_6: 'Merci pour ces 25 années enrichissantes au sein du service.',
    },
    createdAt: '2026-01-28',
    createdBy: 'Marie Leroy',
  },
  {
    id: 'd4',
    nom: 'Bernard',
    prenom: 'Jean',
    statut: 'Titulaire',
    corps: 'Maritime',
    grade: 'Officier',
    statutDemande: 'brouillon',
    typeDemande: 'arrivee',
    questionnaireId: 'q1',
    reponses: {
      q1_1: 'École Nationale Supérieure Maritime',
      q1_2: 'Oui',
    },
    createdAt: '2026-02-03',
    createdBy: 'Jean Bernard',
  },
];

type ViewMode = 'list' | 'new-demande' | 'view-demande' | 'new-questionnaire' | 'edit-questionnaire';

export function ArriveesDepartsView({ userRole = 'agent' }: { userRole?: 'admin' | 'chef_service' | 'agent' }) {
  const [activeTab, setActiveTab] = useState(userRole === 'admin' ? 'demandes' : 'mes-demandes');
  const [demandes, setDemandes] = useState<Demande[]>(mockDemandes);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>(mockQuestionnaires);
  const [filteredDemandes, setFilteredDemandes] = useState<Demande[]>(mockDemandes);
  
  // Mode d'affichage
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  
  // Dialog pour suppression
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrage des demandes
  React.useEffect(() => {
    let filtered = demandes;

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.prenom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatut !== 'all') {
      filtered = filtered.filter((d) => d.statutDemande === filterStatut);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((d) => d.typeDemande === filterType);
    }

    setFilteredDemandes(filtered);
  }, [demandes, searchTerm, filterStatut, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredDemandes.length / DEFAULT_LIST_PAGE_SIZE));
  const paginatedDemandes = useMemo(() => {
    const start = (currentPage - 1) * DEFAULT_LIST_PAGE_SIZE;
    return filteredDemandes.slice(start, start + DEFAULT_LIST_PAGE_SIZE);
  }, [filteredDemandes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatut, filterType, activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Statistiques
  const stats = {
    total: demandes.length,
    enAttente: demandes.filter((d) => d.statutDemande === 'en_attente').length,
    validees: demandes.filter((d) => d.statutDemande === 'validee').length,
    arrivees: demandes.filter((d) => d.typeDemande === 'arrivee').length,
  };

  // Handlers
  const handleStartNewDemande = () => {
    setViewMode('new-demande');
  };

  const handleViewDemande = (demande: Demande) => {
    setSelectedDemande(demande);
    setViewMode('view-demande');
  };

  const handleSubmitDemande = (newDemande: Demande) => {
    setDemandes([newDemande, ...demandes]);
    setViewMode('list');
  };

  const handleValidateDemande = (demandeId: string, isApproved: boolean, commentaire?: string) => {
    setDemandes(
      demandes.map((d) =>
        d.id === demandeId
          ? {
              ...d,
              statutDemande: isApproved ? 'validee' : 'refusee',
              validatedAt: new Date().toISOString(),
              validatedBy: 'Admin Système',
              commentaire,
            }
          : d
      )
    );
    setViewMode('list');
    toast.success(isApproved ? 'Demande validée' : 'Demande refusée');
  };

  const handleDeleteDemande = () => {
    if (!selectedDemande) return;
    setDemandes(demandes.filter((d) => d.id !== selectedDemande.id));
    setIsDeleteDialogOpen(false);
    setSelectedDemande(null);
    toast.success('Demande supprimée');
  };

  const handleNewQuestionnaire = () => {
    setSelectedQuestionnaire(null);
    setViewMode('new-questionnaire');
  };

  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setViewMode('edit-questionnaire');
  };

  const handleSubmitQuestionnaire = (questionnaireData: Partial<Questionnaire>, questions: Question[]) => {
    if (selectedQuestionnaire) {
      // Modification
      setQuestionnaires(
        questionnaires.map((q) =>
          q.id === selectedQuestionnaire.id
            ? { ...q, ...questionnaireData, questions }
            : q
        )
      );
      toast.success('Questionnaire modifié');
    } else {
      // Création
      const newQuestionnaire: Questionnaire = {
        id: `q${Date.now()}`,
        nom: questionnaireData.nom!,
        description: questionnaireData.description!,
        type: questionnaireData.type!,
        questions,
        actif: true,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'Admin Système',
      };
      setQuestionnaires([...questionnaires, newQuestionnaire]);
      toast.success('Questionnaire créé');
    }
    setViewMode('list');
    setActiveTab('questionnaires');
  };

  const toggleQuestionnaireActif = (id: string) => {
    setQuestionnaires(
      questionnaires.map((q) => (q.id === id ? { ...q, actif: !q.actif } : q))
    );
    toast.success('Statut du questionnaire modifié');
  };

  // Badges de statut
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            <FileText className="h-3 w-3 mr-1" />
            Brouillon
          </Badge>
        );
      case 'en_attente':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'validee':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validée
          </Badge>
        );
      case 'refusee':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Refusée
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'arrivee' ? (
      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
        <UserPlus className="h-3 w-3 mr-1" />
        Arrivée
      </Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
        <UserMinus className="h-3 w-3 mr-1" />
        Départ
      </Badge>
    );
  };

  // Affichage des pages dédiées
  if (viewMode === 'new-demande') {
    return (
      <ArriveesDepartsNewDemandePage
        questionnaires={questionnaires}
        onBack={() => setViewMode('list')}
        onSubmit={handleSubmitDemande}
      />
    );
  }

  if (viewMode === 'view-demande' && selectedDemande) {
    const questionnaire = questionnaires.find((q) => q.id === selectedDemande.questionnaireId);
    return (
      <ArriveesDepartsDetailPage
        demande={selectedDemande}
        questionnaire={questionnaire || null}
        onBack={() => setViewMode('list')}
        onValidate={handleValidateDemande}
        userRole={userRole}
      />
    );
  }

  if ((viewMode === 'new-questionnaire' || viewMode === 'edit-questionnaire')) {
    return (
      <ArriveesDepartsQuestionnaireFormPage
        questionnaire={selectedQuestionnaire || undefined}
        questionnaires={questionnaires}
        onBack={() => setViewMode('list')}
        onSubmit={handleSubmitQuestionnaire}
      />
    );
  }

  // Affichage de la liste
  return (
    <div className="space-y-6">
      {/* En-tête avec gradient */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <CardHeader className="relative py-8 sm:py-10">
          <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <UserPlus className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-4xl font-bold text-white mb-1">Arrivées et départs</CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  Gestion des questionnaires d'intégration et de sortie
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleStartNewDemande}
              size="lg"
              className="w-full lg:w-auto lg:self-start bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides (admin uniquement) */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-600 mb-1">Total demandes</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-orange-600 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.enAttente}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-600 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-600 mb-1">Validées</p>
                  <p className="text-3xl font-bold text-green-900">{stats.validees}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-purple-600 mb-1">Arrivées</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.arrivees}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs améliorés */}
      <Card className="border-0 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-4">
            <div className="w-full overflow-x-auto">
              <TabsList className="flex min-w-max w-full md:grid md:grid-cols-3 h-auto p-1 bg-gradient-to-r from-gray-100 to-gray-200 gap-1">
              <TabsTrigger 
                value="mes-demandes" 
                className="flex-1 md:flex-none whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-4 md:px-6 rounded-lg transition-all"
              >
                <FileText className="h-5 w-5 mr-2" />
                <span className="font-semibold">Mes demandes</span>
              </TabsTrigger>
              {userRole === 'admin' && (
                <>
                  <TabsTrigger 
                    value="demandes"
                    className="flex-1 md:flex-none whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-4 md:px-6 rounded-lg transition-all"
                  >
                    <ClipboardList className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Toutes les demandes</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="questionnaires"
                    className="flex-1 md:flex-none whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-4 md:px-6 rounded-lg transition-all"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Questionnaires</span>
                  </TabsTrigger>
                </>
              )}
              </TabsList>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            {/* Mes demandes */}
            <TabsContent value="mes-demandes" className="mt-0 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Mes demandes</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Consultez et gérez vos demandes en cours
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {filteredDemandes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-blue-500" />
                    </div>
                    <p className="text-gray-600 text-lg font-medium">Aucune demande pour le moment</p>
                    <p className="text-gray-400 text-sm mt-2">Cliquez sur "Nouvelle demande" pour commencer</p>
                  </div>
                ) : (
                  paginatedDemandes.map((demande) => (
                    <Card key={demande.id} className="border-2 hover:border-blue-300 hover:shadow-xl transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                {demande.prenom[0]}{demande.nom[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {demande.prenom} {demande.nom}
                                </h4>
                                <div className="flex gap-2 mt-1">
                                  {getTypeBadge(demande.typeDemande)}
                                  {getStatutBadge(demande.statutDemande)}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="h-4 w-4 text-blue-500" />
                                <span><strong>Statut:</strong> {demande.statut}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Briefcase className="h-4 w-4 text-blue-500" />
                                <span><strong>Corps:</strong> {demande.corps}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Award className="h-4 w-4 text-blue-500" />
                                <span><strong>Grade:</strong> {demande.grade}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span><strong>Créée le:</strong> {new Date(demande.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="lg"
                            onClick={() => handleViewDemande(demande)}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Consulter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <ListPaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredDemandes.length}
                onPageChange={setCurrentPage}
                itemLabel="demande(s)"
              />
            </TabsContent>

            {/* Toutes les demandes (Admin) */}
            {userRole === 'admin' && (
              <TabsContent value="demandes" className="mt-0 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Toutes les demandes</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Gérez l'ensemble des demandes d'arrivée et de départ
                    </p>
                  </div>
                </div>

                {/* Filtres améliorés */}
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-5 w-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Filtres</h4>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Rechercher par nom ou prénom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                          />
                        </div>
                      </div>
                      <Select value={filterStatut} onValueChange={setFilterStatut}>
                        <SelectTrigger className="w-56 h-12 bg-white border-2 border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="brouillon">Brouillon</SelectItem>
                          <SelectItem value="en_attente">En attente</SelectItem>
                          <SelectItem value="validee">Validée</SelectItem>
                          <SelectItem value="refusee">Refusée</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-56 h-12 bg-white border-2 border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                          <SelectValue placeholder="Filtrer par type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les types</SelectItem>
                          <SelectItem value="arrivee">Arrivée</SelectItem>
                          <SelectItem value="depart">Départ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des demandes */}
                <div className="space-y-4">
                  {paginatedDemandes.map((demande) => (
                    <Card key={demande.id} className="border-2 hover:border-blue-300 hover:shadow-xl transition-all duration-200 group">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {demande.prenom[0]}{demande.nom[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {demande.prenom} {demande.nom}
                                </h4>
                                <div className="flex gap-2 mt-1">
                                  {getTypeBadge(demande.typeDemande)}
                                  {getStatutBadge(demande.statutDemande)}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="h-4 w-4 text-blue-500" />
                                <span><strong>Statut:</strong> {demande.statut}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Briefcase className="h-4 w-4 text-blue-500" />
                                <span><strong>Corps:</strong> {demande.corps}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Award className="h-4 w-4 text-blue-500" />
                                <span><strong>Grade:</strong> {demande.grade}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span><strong>Créée le:</strong> {new Date(demande.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="flex items-center gap-2 col-span-2 text-gray-600">
                                <User className="h-4 w-4 text-blue-500" />
                                <span className="text-xs"><strong>Par:</strong> {demande.createdBy}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Button
                              size="lg"
                              onClick={() => handleViewDemande(demande)}
                              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Consulter
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              className="w-full sm:w-auto text-red-600 hover:bg-red-50 border-2 border-red-300 hover:border-red-500"
                              onClick={() => {
                                setSelectedDemande(demande);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ListPaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredDemandes.length}
                  onPageChange={setCurrentPage}
                  itemLabel="demande(s)"
                />
              </TabsContent>
            )}

            {/* Questionnaires (Admin) */}
            {userRole === 'admin' && (
              <TabsContent value="questionnaires" className="mt-0 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Questionnaires</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Créez et gérez les questionnaires d'arrivée et de départ
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleNewQuestionnaire}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nouveau questionnaire
                  </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {questionnaires.map((questionnaire) => (
                    <Card
                      key={questionnaire.id}
                      className={`border-3 transition-all duration-200 hover:shadow-2xl ${
                        questionnaire.actif 
                          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                questionnaire.type === 'arrivee' 
                                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
                              }`}>
                                {questionnaire.type === 'arrivee' 
                                  ? <UserPlus className="h-5 w-5 text-white" />
                                  : <UserMinus className="h-5 w-5 text-white" />
                                }
                              </div>
                              <CardTitle className="text-xl">{questionnaire.nom}</CardTitle>
                            </div>
                            <CardDescription className="text-base mt-2">
                              {questionnaire.description}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {getTypeBadge(questionnaire.type)}
                            <Badge
                              className={`justify-center ${
                                questionnaire.actif
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              {questionnaire.actif ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <Separator />
                      <CardContent className="pt-4">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-gray-700">
                              <strong className="text-gray-900">{questionnaire.questions.length}</strong> question(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700">
                              Créé le <strong className="text-gray-900">{new Date(questionnaire.createdAt).toLocaleDateString('fr-FR')}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">
                              Par <strong className="text-gray-900">{questionnaire.createdBy}</strong>
                            </span>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex gap-2">
                          <Button
                            size="lg"
                            variant="outline"
                            className="flex-1 border-2 hover:border-blue-500 hover:text-blue-600"
                            onClick={() => handleEditQuestionnaire(questionnaire)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className={`border-2 ${
                              questionnaire.actif
                                ? 'text-orange-600 hover:bg-orange-50 border-orange-300 hover:border-orange-500'
                                : 'text-green-600 hover:bg-green-50 border-green-300 hover:border-green-500'
                            }`}
                            onClick={() => toggleQuestionnaireActif(questionnaire.id)}
                          >
                            {questionnaire.actif ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Dialog de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-base">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDemande} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-base"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
