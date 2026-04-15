import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  AlertTriangle,
  Plus,
  Calendar,
  MapPin,
  Search,
  Edit,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  XCircle,
  Activity,
  Building2,
  TrendingUp
} from 'lucide-react';
import { AsbestosIntervention } from '../AsbestosView';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

interface AsbestosListViewProps {
  interventions: AsbestosIntervention[];
  onCreateNew: () => void;
  onViewDetail: (intervention: AsbestosIntervention) => void;
  onEdit: (intervention: AsbestosIntervention) => void;
  onDelete: (id: string) => void;
}

export function AsbestosListView({ interventions, onCreateNew, onViewDetail, onEdit, onDelete }: AsbestosListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interventionToDelete, setInterventionToDelete] = useState<AsbestosIntervention | null>(null);

  const statusConfig = {
    non_amiante: {
      label: 'Non amianté',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle2,
    },
    surveiller: {
      label: 'À surveiller',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: Clock,
    },
    action_requise: {
      label: 'Action requise',
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertTriangle,
    },
    retrait_effectue: {
      label: 'Retrait effectué',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: CheckCircle2,
    },
  };

  const priorityConfig = {
    Faible: { color: 'bg-blue-100 text-blue-800 border-blue-300' },
    Moyenne: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    Élevée: { color: 'bg-orange-100 text-orange-800 border-orange-300' },
    Urgente: { color: 'bg-red-100 text-red-800 border-red-300' },
  };

  const scoreConfig = {
    1: { label: 'Score 1', color: 'bg-green-100 text-green-800 border-green-300', description: 'Faible' },
    2: { label: 'Score 2', color: 'bg-orange-100 text-orange-800 border-orange-300', description: 'Moyen' },
    3: { label: 'Score 3', color: 'bg-red-100 text-red-800 border-red-300', description: 'Élevé' },
  };

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.zoneMateriau.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.localisationPrecise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (intervention.batiment && intervention.batiment.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || intervention.statut === filterStatus;
    const matchesPriority = filterPriority === 'all' || intervention.priorite === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleDeleteClick = (intervention: AsbestosIntervention) => {
    setInterventionToDelete(intervention);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (interventionToDelete) {
      onDelete(interventionToDelete.id);
      toast.success(`Intervention "${interventionToDelete.reference}" supprimée avec succès`);
      setDeleteDialogOpen(false);
      setInterventionToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Diagnostics amiante</h1>
            <p className="text-gray-600 mt-1">
              Synthèse des interventions diagnostiques et suivi réglementaire des matériaux amiantés
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle Intervention
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Non amiantés</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {interventions.filter(i => i.statut === 'non_amiante').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À surveiller</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {interventions.filter(i => i.statut === 'surveiller').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action requise</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {interventions.filter(i => i.statut === 'action_requise').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retrait effectué</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">
                  {interventions.filter(i => i.statut === 'retrait_effectue').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher par zone, localisation, référence, bâtiment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="non_amiante">Non amianté</SelectItem>
                  <SelectItem value="surveiller">À surveiller</SelectItem>
                  <SelectItem value="action_requise">Action requise</SelectItem>
                  <SelectItem value="retrait_effectue">Retrait effectué</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                  <SelectItem value="Moyenne">Moyenne</SelectItem>
                  <SelectItem value="Élevée">Élevée</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interventions List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredInterventions.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="pt-12 pb-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune intervention trouvée</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Aucune intervention ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première intervention diagnostique amiante.'}
              </p>
              {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
                <Button
                  onClick={onCreateNew}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une intervention
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInterventions.map((intervention) => {
            const config = statusConfig[intervention.statut];
            const IconComponent = config.icon;
            const scoreInfo = intervention.scoreActuel ? scoreConfig[intervention.scoreActuel] : null;
            
            return (
              <Card key={intervention.id} className={`border-2 ${config.borderColor} shadow-lg hover:shadow-xl transition-all`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900">{intervention.zoneMateriau}</h3>
                            <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                              {config.label}
                            </Badge>
                            {intervention.priorite && (
                              <Badge variant="outline" className={priorityConfig[intervention.priorite].color}>
                                {intervention.priorite}
                              </Badge>
                            )}
                            {scoreInfo && (
                              <Badge variant="outline" className={scoreInfo.color}>
                                {scoreInfo.label} - {scoreInfo.description}
                              </Badge>
                            )}
                            {intervention.retraitRealise && (
                              <Badge className="bg-purple-600 text-white">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Retrait effectué
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Réf: {intervention.reference}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Localisation</p>
                            <p className="text-sm font-semibold text-gray-900">{intervention.localisationPrecise}</p>
                            {intervention.batiment && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                <Building2 className="h-3 w-3 inline mr-1" />
                                {intervention.batiment}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">1er repérage</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(intervention.datePremiereReperage).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{intervention.typeAnalyseInitiale}</p>
                          </div>
                        </div>

                        {intervention.dernierControle && (
                          <div className="flex items-start gap-2">
                            <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Dernier contrôle</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(intervention.dernierControle).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        )}

                        {intervention.echeanceAction && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Échéance action</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(intervention.echeanceAction).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {intervention.actionAPrevoir && (
                        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900">Action à prévoir</p>
                              <p className="text-sm text-blue-800">{intervention.actionAPrevoir}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {intervention.evolutionScore && (
                        <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-900">Évolution du score</p>
                              <p className="text-sm text-amber-800">{intervention.evolutionScore}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetail(intervention)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Consulter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(intervention)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteClick(intervention)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'intervention <strong>{interventionToDelete?.reference}</strong> - "{interventionToDelete?.zoneMateriau}" ?
              <br /><br />
              Cette action est irréversible et supprimera toutes les données associées (diagnostic, suivi, actions).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
