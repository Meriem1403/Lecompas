import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Droplet,
  Plus,
  Calendar,
  MapPin,
  Users,
  ClipboardList,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  Filter,
  FileText
} from 'lucide-react';
import { MercuryCampaign } from '../MercuryView';
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

interface MercuryListViewProps {
  campaigns: MercuryCampaign[];
  onCreateNew: () => void;
  onViewDetail: (campaign: MercuryCampaign) => void;
  onEdit: (campaign: MercuryCampaign) => void;
  onDelete: (id: string) => void;
}

export function MercuryListView({ campaigns, onCreateNew, onViewDetail, onEdit, onDelete }: MercuryListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<MercuryCampaign | null>(null);

  const statusConfig = {
    planifiee: {
      label: 'Planifiée',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Calendar,
    },
    en_cours: {
      label: 'En cours',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: Clock,
    },
    rapport_recu: {
      label: 'Rapport reçu',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: FileCheck,
    },
    synthese_produite: {
      label: 'Synthèse produite',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle2,
    },
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.zones.some(z => z.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || campaign.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteClick = (campaign: MercuryCampaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      onDelete(campaignToDelete.id);
      toast.success(`Campagne "${campaignToDelete.reference}" supprimée avec succès`);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl">
            <Droplet className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campagnes mercure</h1>
            <p className="text-gray-600 mt-1">
              Gestion complète des campagnes de prélèvements : planification, suivi, rapport et synthèse
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planifiées</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {campaigns.filter(c => c.statut === 'planifiee').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {campaigns.filter(c => c.statut === 'en_cours').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rapports reçus</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {campaigns.filter(c => c.statut === 'rapport_recu').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Synthèses produites</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {campaigns.filter(c => c.statut === 'synthese_produite').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
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
                placeholder="Rechercher par titre, référence, zone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="planifiee">Planifiée</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="rapport_recu">Rapport reçu</SelectItem>
                  <SelectItem value="synthese_produite">Synthèse produite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCampaigns.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="pt-12 pb-12 text-center">
              <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune campagne trouvée</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Aucune campagne ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première campagne de prélèvement mercure.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={onCreateNew}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => {
            const config = statusConfig[campaign.statut];
            const IconComponent = config.icon;
            
            return (
              <Card key={campaign.id} className={`border-2 ${config.borderColor} shadow-lg hover:shadow-xl transition-all`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900">{campaign.titre}</h3>
                            <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">Réf: {campaign.reference}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-start gap-2">
                          <ClipboardList className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Programme</p>
                            <p className="text-sm font-semibold text-gray-900">{campaign.programme}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Zones ({campaign.zones.length})</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {campaign.zones[0]}{campaign.zones.length > 1 && ` +${campaign.zones.length - 1}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Prestataire</p>
                            <p className="text-sm font-semibold text-gray-900">{campaign.prestataire}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Date prévue</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(campaign.datePrevue).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {campaign.dateReelle && (
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Date réelle</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(campaign.dateReelle).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        )}

                        {campaign.dateReceptionRapport && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Rapport reçu le</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(campaign.dateReceptionRapport).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {campaign.ecartsConstates && (
                        <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-900">Écarts constatés</p>
                              <p className="text-sm text-amber-800">{campaign.ecartsConstates}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetail(campaign)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Consulter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(campaign)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteClick(campaign)}
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
              Êtes-vous sûr de vouloir supprimer la campagne <strong>{campaignToDelete?.reference}</strong> - "{campaignToDelete?.titre}" ?
              <br /><br />
              Cette action est irréversible et supprimera toutes les données associées (planification, suivi terrain, rapport et synthèse).
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