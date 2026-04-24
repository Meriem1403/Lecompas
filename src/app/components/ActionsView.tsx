import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Shield,
  Search
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { ActionCreateView } from './ActionCreateView';
import { ActionDetailView } from './ActionDetailView';
import { ActionEditView } from './ActionEditView';
import { toast } from 'sonner';
import { ListPaginationBar } from './ui/list-pagination-bar';

export interface Action {
  id: string;
  title: string;
  description: string;
  riskId: string;
  riskTitle: string;
  priority: 'Haute' | 'Moyenne' | 'Faible';
  status: 'À faire' | 'En cours' | 'Terminée' | 'En retard';
  responsable: string;
  deadline: string;
  createdAt: string;
  createdBy?: string;
  completedAt?: string;
  budget?: number;
  source?: 'DUERP' | 'MANUEL';
}

export interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  unite: string;
  service: string;
  site: string;
  situation: string;
  associatedRisk: string;
  category: string;
  plannedMeasures?: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
}

// Fake data
const FAKE_ACTIONS: Action[] = [
  {
    id: '1',
    title: 'Installation de garde-corps supplémentaires',
    description: 'Installer des garde-corps conformes aux normes sur les zones de stockage en hauteur pour prévenir les chutes.',
    riskId: 'risk-1',
    riskTitle: 'Travail en hauteur sans protection',
    priority: 'Haute',
    status: 'En cours',
    responsable: 'Marie Martin',
    deadline: '2025-02-15',
    createdAt: '2025-01-10',
    budget: 5000
  },
  {
    id: '2',
    title: 'Formation gestes et postures',
    description: 'Organiser une session de formation sur les gestes et postures pour tous les opérateurs de manutention.',
    riskId: 'risk-2',
    riskTitle: 'Troubles musculo-squelettiques (TMS)',
    priority: 'Haute',
    status: 'À faire',
    responsable: 'Jean Dupont',
    deadline: '2025-03-01',
    createdAt: '2025-01-15',
    budget: 1200
  },
  {
    id: '3',
    title: 'Révision du système de ventilation',
    description: 'Contrôle et maintenance préventive du système de ventilation de l\'atelier de peinture.',
    riskId: 'risk-3',
    riskTitle: 'Exposition aux produits chimiques',
    priority: 'Moyenne',
    status: 'En retard',
    responsable: 'Pierre Leclerc',
    deadline: '2025-01-20',
    createdAt: '2024-12-15',
    budget: 3500
  },
  {
    id: '4',
    title: 'Mise en place de la signalétique',
    description: 'Installation de panneaux de signalisation et marquage au sol pour les zones de circulation des engins.',
    riskId: 'risk-4',
    riskTitle: 'Collision engins/piétons',
    priority: 'Haute',
    status: 'À faire',
    responsable: 'Sophie Bernard',
    deadline: '2025-02-28',
    createdAt: '2025-01-20',
    budget: 800
  },
  {
    id: '5',
    title: 'Audit électrique complet',
    description: 'Réaliser un audit de sécurité électrique sur l\'ensemble des installations de l\'atelier.',
    riskId: 'risk-5',
    riskTitle: 'Risque électrique',
    priority: 'Haute',
    status: 'En cours',
    responsable: 'Marc Rousseau',
    deadline: '2025-03-15',
    createdAt: '2025-01-05',
    budget: 2500
  },
  {
    id: '6',
    title: 'Remplacement EPI défectueux',
    description: 'Renouvellement des équipements de protection individuelle usés ou non conformes.',
    riskId: 'risk-6',
    riskTitle: 'Absence d\'EPI adaptés',
    priority: 'Moyenne',
    status: 'Terminée',
    responsable: 'Julie Moreau',
    deadline: '2025-01-25',
    createdAt: '2024-12-20',
    completedAt: '2025-01-22',
    budget: 1500
  }
];

interface ActionsViewProps {
  actions?: Action[];
  risks?: Risk[];
  currentUserRole?: 'admin' | 'chef_service' | 'agent';
  currentUserName?: string;
}

export function ActionsView({
  actions: propActions,
  risks = [],
  currentUserRole = 'agent',
  currentUserName = '',
}: ActionsViewProps) {
  const getFilterButtonClass = (active: boolean, activeClass: string) =>
    active
      ? `${activeClass} text-white border-0 shadow-md`
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";

  const [actions, setActions] = useState<Action[]>(
    (propActions || FAKE_ACTIONS).map((action) => ({
      ...action,
      source: action.source ?? 'MANUEL',
    })),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'DUERP' | 'MANUEL'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Action['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Action['priority']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const handleAdd = () => {
    if (currentUserRole !== 'admin') {
      toast.info("Seul un administrateur peut créer une action depuis cet onglet.");
      return;
    }
    setIsCreating(true);
  };

  const handleSaveCreate = (actionData: Omit<Action, 'id' | 'createdAt'>) => {
    const newAction: Action = {
      ...actionData,
      id: `action-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUserName,
      source: 'MANUEL',
    };
    setActions([...actions, newAction]);
    toast.success('Action créée avec succès ✅');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleView = (action: Action) => {
    setViewingAction(action);
  };

  const handleBackFromView = () => {
    setViewingAction(null);
  };

  const handleEditFromView = (action: Action) => {
    if (!canEditAction(action)) {
      toast.info("Vous n'avez pas les droits pour modifier cette action.");
      return;
    }
    setViewingAction(null);
    setEditingAction(action);
  };

  const handleEdit = (action: Action) => {
    if (!canEditAction(action)) {
      toast.info("Vous n'avez pas les droits pour modifier cette action.");
      return;
    }
    setEditingAction(action);
  };

  const handleSaveEdit = (updatedAction: Action) => {
    setActions(actions.map(a => a.id === updatedAction.id ? updatedAction : a));
    toast.success('Action modifiée avec succès ✅');
    setEditingAction(null);
  };

  const handleCancelEdit = () => {
    setEditingAction(null);
  };

  const handleDeleteClick = (actionId: string) => {
    const action = allActions.find((a) => a.id === actionId);
    if (!action || !canDeleteAction(action)) {
      toast.info("Vous n'avez pas les droits pour supprimer cette action.");
      return;
    }
    setActionToDelete(actionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (actionToDelete) {
      setActions(actions.filter(a => a.id !== actionToDelete));
      toast.success('Action supprimée avec succès ✅');
      setDeleteDialogOpen(false);
      setActionToDelete(null);
    }
  };

  const getPriorityGradient = (priority: Action['priority']) => {
    switch (priority) {
      case 'Haute':
        return 'from-red-500 to-rose-500';
      case 'Moyenne':
        return 'from-orange-500 to-amber-500';
      case 'Faible':
        return 'from-green-500 to-emerald-500';
    }
  };

  const getStatusConfig = (status: Action['status']) => {
    switch (status) {
      case 'Terminée':
        return { 
          icon: CheckCircle2, 
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'En cours':
        return { 
          icon: Clock, 
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'En retard':
        return { 
          icon: AlertCircle, 
          gradient: 'from-red-500 to-rose-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
      case 'À faire':
        return { 
          icon: Calendar, 
          gradient: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
    }
  };

  const isOverdue = (deadline: string, status: Action['status']) => {
    if (status === 'Terminée') return false;
    return new Date(deadline) < new Date();
  };

  const canEditAction = (action: Action) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'chef_service') {
      return (
        action.responsable === currentUserName ||
        (action.createdBy || '') === currentUserName
      );
    }
    return false;
  };

  const canDeleteAction = (action: Action) => canEditAction(action);

  const duerpActions = useMemo<Action[]>(() => {
    return risks.flatMap((risk) => {
      const plannedMeasures = risk.plannedMeasures || [];
      return plannedMeasures
        .filter((measure) => measure.description?.trim())
        .map((measure, index) => {
          const mappedStatus: Action['status'] =
            measure.status === 'completed'
              ? 'Terminée'
              : measure.status === 'in_progress'
                ? 'En cours'
                : 'À faire';

          return {
            id: `duerp-${risk.id}-${index}`,
            title: measure.description,
            description: measure.description,
            riskId: risk.id,
            riskTitle: `${risk.numeroRisque} - ${risk.title}`,
            priority: 'Moyenne',
            status: mappedStatus,
            responsable: measure.responsible || risk.service || 'Non défini',
            deadline: measure.deadline || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: risk.responsable || '',
            source: 'DUERP',
          };
        });
    });
  }, [risks]);

  const allActions = useMemo<Action[]>(() => {
    return [...duerpActions, ...actions];
  }, [duerpActions, actions]);

  const filteredActions = useMemo<Action[]>(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return allActions.filter((action) => {
      const sourceMatch =
        sourceFilter === 'all' || action.source === sourceFilter;
      const statusMatch =
        statusFilter === 'all' || action.status === statusFilter;
      const priorityMatch =
        priorityFilter === 'all' || action.priority === priorityFilter;

      const searchMatch =
        normalizedSearch.length === 0 ||
        action.title.toLowerCase().includes(normalizedSearch) ||
        action.description.toLowerCase().includes(normalizedSearch) ||
        action.riskTitle.toLowerCase().includes(normalizedSearch) ||
        action.responsable.toLowerCase().includes(normalizedSearch);

      return sourceMatch && statusMatch && priorityMatch && searchMatch;
    });
  }, [allActions, sourceFilter, statusFilter, priorityFilter, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sourceFilter, statusFilter, priorityFilter, searchQuery]);

  const totalResults = filteredActions.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const paginatedActions = useMemo<Action[]>(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActions.slice(start, start + pageSize);
  }, [filteredActions, currentPage]);

  // Si on est en mode création, afficher uniquement la page de création
  if (isCreating) {
    return (
      <ActionCreateView
        onSave={handleSaveCreate}
        onCancel={handleCancelCreate}
        risks={risks}
      />
    );
  }

  // Si on est en mode consultation, afficher uniquement la page de détail
  if (viewingAction) {
    return (
      <ActionDetailView
        action={viewingAction}
        onBack={handleBackFromView}
        onEdit={handleEditFromView}
      />
    );
  }

  // Si on est en mode édition, afficher uniquement la page d'édition
  if (editingAction) {
    return (
      <ActionEditView
        action={editingAction}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        risks={risks}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plan d'action</h1>
            <p className="text-gray-600 mt-1">
              Suivi et gestion des actions de prévention
            </p>
          </div>
        </div>
        <Button className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" onClick={handleAdd}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nouvelle action
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-blue-100 text-sm font-medium">En cours</p>
                <p className="text-3xl font-bold">{allActions.filter(a => a.status === 'En cours').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-gray-500 to-slate-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-100 text-sm font-medium">À faire</p>
                <p className="text-3xl font-bold">{allActions.filter(a => a.status === 'À faire').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-red-100 text-sm font-medium">En retard</p>
                <p className="text-3xl font-bold">{allActions.filter(a => a.status === 'En retard').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-green-100 text-sm font-medium">Terminées</p>
                <p className="text-3xl font-bold">{allActions.filter(a => a.status === 'Terminée').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions List */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="w-full">
              <div className="relative max-w-xl">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une action, un risque, un responsable..."
                  className="w-full h-10 rounded-md border border-gray-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
              <span className="text-sm font-semibold text-gray-700">Source :</span>
              <Button
                size="sm"
                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSourceFilter('all')}
                className={getFilterButtonClass(
                  sourceFilter === 'all',
                  'bg-gradient-to-r from-slate-600 to-gray-700',
                )}
              >
                Toutes
              </Button>
              <Button
                size="sm"
                variant={sourceFilter === 'DUERP' ? 'default' : 'outline'}
                onClick={() => setSourceFilter('DUERP')}
                className={getFilterButtonClass(
                  sourceFilter === 'DUERP',
                  'bg-gradient-to-r from-violet-600 to-purple-600',
                )}
              >
                DUERP
              </Button>
              <Button
                size="sm"
                variant={sourceFilter === 'MANUEL' ? 'default' : 'outline'}
                onClick={() => setSourceFilter('MANUEL')}
                className={getFilterButtonClass(
                  sourceFilter === 'MANUEL',
                  'bg-gradient-to-r from-cyan-600 to-blue-600',
                )}
              >
                Manuelles
              </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
              <span className="text-sm font-semibold text-gray-700">Statut :</span>
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={getFilterButtonClass(
                  statusFilter === 'all',
                  'bg-gradient-to-r from-slate-600 to-gray-700',
                )}
              >
                Tous
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'À faire' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('À faire')}
                className={getFilterButtonClass(
                  statusFilter === 'À faire',
                  'bg-gradient-to-r from-gray-500 to-slate-500',
                )}
              >
                À faire
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'En cours' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('En cours')}
                className={getFilterButtonClass(
                  statusFilter === 'En cours',
                  'bg-gradient-to-r from-blue-500 to-cyan-500',
                )}
              >
                En cours
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'Terminée' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('Terminée')}
                className={getFilterButtonClass(
                  statusFilter === 'Terminée',
                  'bg-gradient-to-r from-green-500 to-emerald-500',
                )}
              >
                Terminée
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'En retard' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('En retard')}
                className={getFilterButtonClass(
                  statusFilter === 'En retard',
                  'bg-gradient-to-r from-red-500 to-rose-500',
                )}
              >
                En retard
              </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
              <span className="text-sm font-semibold text-gray-700">Priorité :</span>
              <Button
                size="sm"
                variant={priorityFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setPriorityFilter('all')}
                className={getFilterButtonClass(
                  priorityFilter === 'all',
                  'bg-gradient-to-r from-slate-600 to-gray-700',
                )}
              >
                Toutes
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'Haute' ? 'default' : 'outline'}
                onClick={() => setPriorityFilter('Haute')}
                className={getFilterButtonClass(
                  priorityFilter === 'Haute',
                  'bg-gradient-to-r from-red-500 to-rose-500',
                )}
              >
                Haute
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'Moyenne' ? 'default' : 'outline'}
                onClick={() => setPriorityFilter('Moyenne')}
                className={getFilterButtonClass(
                  priorityFilter === 'Moyenne',
                  'bg-gradient-to-r from-orange-500 to-amber-500',
                )}
              >
                Moyenne
              </Button>
              <Button
                size="sm"
                variant={priorityFilter === 'Faible' ? 'default' : 'outline'}
                onClick={() => setPriorityFilter('Faible')}
                className={getFilterButtonClass(
                  priorityFilter === 'Faible',
                  'bg-gradient-to-r from-green-500 to-emerald-500',
                )}
              >
                Faible
              </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedActions.map((action) => {
          const statusConfig = getStatusConfig(action.status);
          const StatusIcon = statusConfig.icon;
          const overdue = isOverdue(action.deadline, action.status);

          return (
            <Card key={action.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur group">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:space-x-4">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <StatusIcon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">{action.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              <Shield className="h-4 w-4 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Risque associé</p>
                              <p className="text-sm font-semibold text-gray-800">{action.riskTitle}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              <User className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Responsable</p>
                              <p className="text-sm font-semibold text-gray-800">{action.responsable}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="flex-shrink-0">
                              <Calendar className="h-4 w-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Échéance</p>
                              <p className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                                {new Date(action.deadline).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {action.budget && (
                            <div className="flex items-center space-x-2">
                              <div className="h-4 w-4 text-green-500 font-bold flex-shrink-0">€</div>
                              <div>
                                <p className="text-xs text-gray-500">Budget</p>
                                <p className="text-sm font-semibold text-gray-800">{action.budget.toLocaleString('fr-FR')} €</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`bg-gradient-to-r ${getPriorityGradient(action.priority)} text-white border-0 shadow-md`}>
                            Priorité {action.priority}
                          </Badge>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                            {action.status}
                          </Badge>
                          {action.source === 'DUERP' && (
                            <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-md">
                              DUERP
                            </Badge>
                          )}
                          {overdue && action.status !== 'Terminée' && (
                            <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-md animate-pulse">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Retard
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xl:ml-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleView(action)}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Consulter
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(action)}
                      disabled={!canEditAction(action)}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDeleteClick(action.id)}
                      disabled={!canDeleteAction(action)}
                      className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredActions.length === 0 && (
          <Card className="border-0 shadow-md bg-white/80">
            <CardContent className="p-6 text-center text-gray-600">
              Aucune action ne correspond aux filtres sélectionnés.
            </CardContent>
          </Card>
        )}
      </div>

      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalResults}
        onPageChange={setCurrentPage}
        itemLabel="action(s)"
        className="border-0 shadow-md bg-white/80"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette action ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}