import React, { useState } from 'react';
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
  Shield
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
  completedAt?: string;
  budget?: number;
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
}

export function ActionsView({ actions: propActions, risks = [] }: ActionsViewProps) {
  const [actions, setActions] = useState<Action[]>(propActions || FAKE_ACTIONS);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingAction, setViewingAction] = useState<Action | null>(null);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    setIsCreating(true);
  };

  const handleSaveCreate = (actionData: Omit<Action, 'id' | 'createdAt'>) => {
    const newAction: Action = {
      ...actionData,
      id: `action-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
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
    setViewingAction(null);
    setEditingAction(action);
  };

  const handleEdit = (action: Action) => {
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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plan d'actions</h1>
            <p className="text-gray-600 mt-1">
              Suivi et gestion des actions de prévention
            </p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg" onClick={handleAdd}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Nouvelle action
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">En cours</p>
                <p className="text-3xl font-bold">{actions.filter(a => a.status === 'En cours').length}</p>
              </div>
              <Clock className="h-12 w-12 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-500 to-slate-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-100 text-sm font-medium">À faire</p>
                <p className="text-3xl font-bold">{actions.filter(a => a.status === 'À faire').length}</p>
              </div>
              <Calendar className="h-12 w-12 text-gray-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">En retard</p>
                <p className="text-3xl font-bold">{actions.filter(a => a.status === 'En retard').length}</p>
              </div>
              <AlertCircle className="h-12 w-12 text-red-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Terminées</p>
                <p className="text-3xl font-bold">{actions.filter(a => a.status === 'Terminée').length}</p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {actions.map((action) => {
          const statusConfig = getStatusConfig(action.status);
          const StatusIcon = statusConfig.icon;
          const overdue = isOverdue(action.deadline, action.status);

          return (
            <Card key={action.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleView(action)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Consulter
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(action)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDeleteClick(action.id)}
                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
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
      </div>

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