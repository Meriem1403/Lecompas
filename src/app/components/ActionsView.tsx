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
import { PapripactSignaturePanel } from './PapripactSignaturePanel';
import { mergePapripactActions, parsePapripactWorkbook } from '@/app/utils/papripactImport';
import type { PapripactSignatureRecord } from '@/app/utils/papripactStorage';
import { ListPaginationBar } from './ui/list-pagination-bar';
import { ActionFiltersPanel } from './ActionFiltersPanel';
import {
  emptyActionFilters,
  matchesActionFilters,
  type ActionFilters,
} from '@/app/utils/actionFilterLogic';

import type { Action, DuerpActionRisk } from "@/app/types/action";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { IMPORTED_PAPRIPACT_PROGRAM } from "@/app/seeds/importedSeeds";

export type { Action, DuerpActionRisk };
export type Risk = DuerpActionRisk;

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
  onActionsChange?: (actions: Action[]) => void;
  risks?: Risk[];
  onUpdateRisk?: (riskId: string, updater: (risk: Risk) => Risk) => void;
  currentUserRole?: 'admin' | 'chef_service' | 'agent';
  currentUserName?: string;
  serviceOptions?: string[];
  locationOptions?: string[];
  papripactSignatures?: PapripactSignatureRecord[];
  onSavePapripactSignature?: (record: PapripactSignatureRecord) => void;
  accessToken?: string;
}

function parseDuerpActionId(actionId: string): { riskId: string; measureIndex: number } | null {
  if (!actionId.startsWith('duerp::')) return null;
  const parts = actionId.split('::');
  if (parts.length !== 3) return null;
  const measureIndex = Number(parts[2]);
  if (!Number.isFinite(measureIndex)) return null;
  return { riskId: parts[1], measureIndex };
}

function buildDuerpActionId(riskId: string, measureIndex: number) {
  return `duerp::${riskId}::${measureIndex}`;
}

function matchesResponsible(action: Action, currentUserName: string) {
  const normalizedUser = currentUserName.trim().toLowerCase();
  if (!normalizedUser) return false;
  return action.responsable
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .includes(normalizedUser);
}

export function ActionsView({
  actions: propActions,
  onActionsChange,
  risks = [],
  onUpdateRisk,
  currentUserRole = 'agent',
  currentUserName = '',
  serviceOptions = [],
  locationOptions = [],
  papripactSignatures = [],
  onSavePapripactSignature,
  accessToken = '',
}: ActionsViewProps) {
  const [papripactProgram] = useAppDataDocumentStore(
    APP_DATA_KEYS.papripactProgram,
    accessToken,
    { seed: IMPORTED_PAPRIPACT_PROGRAM },
  );
  const papripactYear = papripactProgram?.year ?? 2026;

  const [actions, setActions] = useState<Action[]>(
    (propActions ?? FAKE_ACTIONS).map((action) => ({
      ...action,
      source: action.source ?? 'MANUEL',
    })),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);
  const [actionFilters, setActionFilters] = useState<ActionFilters>(
    emptyActionFilters(),
  );
  const [groupByRisk, setGroupByRisk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const papripactInputRef = React.useRef<HTMLInputElement>(null);
  const pageSize = 6;

  React.useEffect(() => {
    if (propActions) {
      setActions(
        propActions.map((action) => ({
          ...action,
          source: action.source ?? 'MANUEL',
        })),
      );
    }
  }, [propActions]);

  const commitActions = (nextActions: Action[]) => {
    setActions(nextActions);
    onActionsChange?.(nextActions);
  };

  const handleImportPapripact = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const imported = parsePapripactWorkbook(buffer, 2026);
      const merged = mergePapripactActions(actions, imported);
      const added = merged.length - actions.length;
      commitActions(merged);
      toast.success(`${added} action(s) PAPRIPACT importée(s).`);
    } catch {
      toast.error("Impossible de lire le fichier PAPRIPACT.");
    }
  };


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
    commitActions([...actions, newAction]);
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
    if (updatedAction.source === 'DUERP' && onUpdateRisk) {
      const parsed = parseDuerpActionId(updatedAction.id);
      if (parsed) {
        const oldRiskId = String(parsed.riskId);
        const newRiskId = String(updatedAction.riskId || oldRiskId);
        const mappedStatus =
          updatedAction.status === 'Terminée'
            ? 'completed'
            : updatedAction.status === 'En cours'
              ? 'in_progress'
              : 'pending';
        const measurePayload = {
          description: updatedAction.description || updatedAction.title,
          responsible: updatedAction.responsable,
          deadline: updatedAction.deadline,
          status: mappedStatus as 'pending' | 'in_progress' | 'completed',
        };

        if (newRiskId && newRiskId !== oldRiskId) {
          onUpdateRisk(oldRiskId, (risk) => {
            const plannedMeasures = [...(risk.plannedMeasures || [])];
            if (!plannedMeasures[parsed.measureIndex]) return risk;
            plannedMeasures.splice(parsed.measureIndex, 1);
            return { ...risk, plannedMeasures };
          });
          onUpdateRisk(newRiskId, (risk) => ({
            ...risk,
            plannedMeasures: [...(risk.plannedMeasures || []), measurePayload],
          }));
        } else {
          onUpdateRisk(oldRiskId, (risk) => {
            const plannedMeasures = [...(risk.plannedMeasures || [])];
            const current = plannedMeasures[parsed.measureIndex];
            if (!current) return risk;
            plannedMeasures[parsed.measureIndex] = {
              ...current,
              ...measurePayload,
            };
            return { ...risk, plannedMeasures };
          });
        }

        toast.success('Action DUERP modifiée avec succès ✅');
        setEditingAction(null);
        return;
      }
    }

    commitActions(actions.map((a) => (a.id === updatedAction.id ? updatedAction : a)));
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
    if (!actionToDelete) return;

    const action = allActions.find((item) => item.id === actionToDelete);
    if (!action) return;

    if (action.source === 'DUERP' && onUpdateRisk) {
      const parsed = parseDuerpActionId(action.id);
      if (parsed) {
        onUpdateRisk(parsed.riskId, (risk) => ({
          ...risk,
          plannedMeasures: (risk.plannedMeasures || []).filter(
            (_, index) => index !== parsed.measureIndex,
          ),
        }));
        toast.success('Action DUERP supprimée avec succès ✅');
        setDeleteDialogOpen(false);
        setActionToDelete(null);
        return;
      }
    }

    commitActions(actions.filter((item) => item.id !== actionToDelete));
    toast.success('Action supprimée avec succès ✅');
    setDeleteDialogOpen(false);
    setActionToDelete(null);
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
        matchesResponsible(action, currentUserName) ||
        (action.createdBy || '').toLowerCase() === currentUserName.toLowerCase()
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
            id: buildDuerpActionId(String(risk.id), index),
            title: measure.description,
            description: measure.description,
            riskId: String(risk.id),
            riskTitle: `${risk.numeroRisque} - ${risk.title}`,
            priority: 'Moyenne',
            status: mappedStatus,
            responsable: measure.responsible || risk.service || 'Non défini',
            deadline: measure.deadline || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            createdBy: risk.responsable || '',
            source: 'DUERP',
            services: risk.service ? [risk.service] : [],
            site: risk.site,
          };
        });
    });
  }, [risks]);

  const allActions = useMemo<Action[]>(() => {
    return [...duerpActions, ...actions];
  }, [duerpActions, actions]);

  const filteredActions = useMemo<Action[]>(() => {
    return allActions.filter((action) =>
      matchesActionFilters(action, actionFilters, searchQuery),
    );
  }, [allActions, actionFilters, searchQuery]);

  const groupedActions = useMemo(() => {
    const map = new Map<string, Action[]>();
    filteredActions.forEach((action) => {
      const key = action.riskTitle?.trim() || "Sans risque associé";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(action);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [filteredActions]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [actionFilters, searchQuery, groupByRisk]);

  const totalResults = filteredActions.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const paginatedActions = useMemo<Action[]>(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActions.slice(start, start + pageSize);
  }, [filteredActions, currentPage]);

  const renderActionCard = (action: Action) => {
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Risque associé</p>
                        <p className="text-sm font-semibold text-gray-800">{action.riskTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Responsable</p>
                        <p className="text-sm font-semibold text-gray-800">{action.responsable}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Échéance</p>
                        <p className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                          {new Date(action.deadline).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {action.budget ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 text-green-500 font-bold shrink-0">€</div>
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-sm font-semibold text-gray-800">{action.budget.toLocaleString('fr-FR')} €</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`bg-gradient-to-r ${getPriorityGradient(action.priority)} text-white border-0 shadow-md`}>
                      Priorité {action.priority}
                    </Badge>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                      {action.status}
                    </Badge>
                    {action.source === 'DUERP' ? (
                      <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 shadow-md">DUERP</Badge>
                    ) : null}
                    {action.papripactYear ? (
                      <Badge className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white border-0 shadow-md">
                        PAPRIPACT {action.papripactYear}
                      </Badge>
                    ) : null}
                    {(action.services?.length || 0) > 0 ? (
                      <Badge variant="outline" className="border-slate-300 text-slate-700">
                        {(action.services || []).join(', ')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-300 text-slate-700">DIRM MED</Badge>
                    )}
                    {overdue && action.status !== 'Terminée' ? (
                      <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-md animate-pulse">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Retard
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xl:ml-4">
              <Button size="sm" onClick={() => handleView(action)} className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Consulter
              </Button>
              <Button size="sm" onClick={() => handleEdit(action)} disabled={!canEditAction(action)} className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md">
                <Edit className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
              <Button size="sm" onClick={() => handleDeleteClick(action.id)} disabled={!canDeleteAction(action)} className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Supprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Si on est en mode création, afficher uniquement la page de création
  if (isCreating) {
    return (
      <ActionCreateView
        onSave={handleSaveCreate}
        onCancel={handleCancelCreate}
        risks={risks}
        serviceOptions={serviceOptions}
        locationOptions={locationOptions}
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
        serviceOptions={serviceOptions}
        locationOptions={locationOptions}
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
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <input
            ref={papripactInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportPapripact(file);
              e.target.value = "";
            }}
          />
          {currentUserRole === 'admin' ? (
            <Button
              variant="outline"
              className="w-full lg:w-auto"
              onClick={() => papripactInputRef.current?.click()}
            >
              Importer PAPRIPACT (Excel)
            </Button>
          ) : null}
          <Button className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle action
          </Button>
        </div>
      </div>

      <PapripactSignaturePanel
        year={papripactYear}
        actions={allActions.filter((a) => a.papripactYear === papripactYear)}
        signature={papripactSignatures.find((item) => item.year === papripactYear)}
        onSaveSignature={(record) => onSavePapripactSignature?.(record)}
        canSign={currentUserRole === 'admin'}
      />

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
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur" role="region" aria-label="Filtres plan d'action">
        <CardContent className="p-4">
          <ActionFiltersPanel
            filters={actionFilters}
            onChange={setActionFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            actions={allActions}
            resultCount={totalResults}
            groupByRisk={groupByRisk}
            onGroupByRiskChange={setGroupByRisk}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groupByRisk
          ? groupedActions.map(([riskTitle, items]) => (
              <div key={riskTitle} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-lg font-bold text-slate-800">{riskTitle}</h3>
                  <Badge variant="outline">{items.length} action(s)</Badge>
                </div>
                {items.map((action) => renderActionCard(action))}
              </div>
            ))
          : paginatedActions.map((action) => renderActionCard(action))}
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
        className={`border-0 shadow-md bg-white/80 ${groupByRisk ? 'hidden' : ''}`}
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