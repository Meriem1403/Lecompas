import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Shield,
  UserCheck,
  FileSignature,
  ChevronRight,
  Building2
} from 'lucide-react';
import { AsbestosAttestation, AttestationStatus } from '../AsbestosAttestationsView';
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

interface AsbestosAttestationsListViewProps {
  attestations: AsbestosAttestation[];
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  onCreateNew: () => void;
  onViewDetail: (attestation: AsbestosAttestation) => void;
  onEdit: (attestation: AsbestosAttestation) => void;
  onDelete: (id: string) => void;
}

export function AsbestosAttestationsListView({
  attestations,
  currentUserRole,
  onCreateNew,
  onViewDetail,
  onEdit,
  onDelete
}: AsbestosAttestationsListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attestationToDelete, setAttestationToDelete] = useState<AsbestosAttestation | null>(null);

  const statusConfig: Record<AttestationStatus, { label: string; color: string; bgColor: string; icon: any }> = {
    brouillon: {
      label: 'Brouillon',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: FileText,
    },
    en_attente_admin: {
      label: 'En attente Admin',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: Clock,
    },
    rejetee_admin: {
      label: 'Rejetée Admin',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: XCircle,
    },
    en_attente_sg: {
      label: 'En attente SG',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      icon: AlertTriangle,
    },
    rejetee_sg: {
      label: 'Rejetée SG',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: XCircle,
    },
    validee: {
      label: 'Validée',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle2,
    },
    envoyee_agent: {
      label: 'Envoyée à l\'agent',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      icon: Send,
    },
  };

  const typeConfig = {
    intermediaire: {
      label: 'Attestation intermédiaire (< 31/01/2012)',
      shortLabel: 'Intermédiaire',
      color: 'bg-indigo-600',
    },
    presence: {
      label: 'Attestation de présence',
      shortLabel: 'Présence',
      color: 'bg-teal-600',
    },
  };

  const filteredAttestations = attestations.filter(attestation => {
    const matchesSearch = 
      attestation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attestation.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attestation.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || attestation.type === filterType;
    const matchesStatus = filterStatus === 'all' || attestation.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteClick = (attestation: AsbestosAttestation) => {
    setAttestationToDelete(attestation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (attestationToDelete) {
      onDelete(attestationToDelete.id);
      toast.success(`Attestation de ${attestationToDelete.prenom} ${attestationToDelete.nom} supprimée`);
      setDeleteDialogOpen(false);
      setAttestationToDelete(null);
    }
  };

  // Statistiques
  const stats = {
    total: attestations.length,
    brouillon: attestations.filter(a => a.status === 'brouillon').length,
    enAttenteAdmin: attestations.filter(a => a.status === 'en_attente_admin').length,
    enAttenteSG: attestations.filter(a => a.status === 'en_attente_sg').length,
    validees: attestations.filter(a => a.status === 'validee' || a.status === 'envoyee_agent').length,
    rejetees: attestations.filter(a => a.status === 'rejetee_admin' || a.status === 'rejetee_sg').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl">
            <FileSignature className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attestations d'Exposition à l'Amiante</h1>
            <p className="text-gray-600 mt-1">
              Gestion des attestations avec workflow de validation Admin → SG
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          className="w-full lg:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle Attestation
        </Button>
      </div>

      {/* Workflow Info Card */}
      <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 shadow-lg">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-900 mb-1">Comment fonctionne le workflow de validation ?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Les attestations suivent un processus de validation en 3 étapes avant d'être délivrées à l'agent.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">1</div>
                <h4 className="font-semibold text-blue-900">Agent</h4>
              </div>
              <p className="text-xs text-gray-600">L'agent crée et soumet l'attestation pour validation</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">2</div>
                <h4 className="font-semibold text-indigo-900">Admin</h4>
              </div>
              <p className="text-xs text-gray-600">
                <strong>Changez votre rôle</strong> en "Administrateur" dans la sidebar pour <strong>valider ou rejeter</strong>
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">3</div>
                <h4 className="font-semibold text-purple-900">Secrétaire Général</h4>
              </div>
              <p className="text-xs text-gray-600">
                <strong>Changez votre rôle</strong> en "Secrétaire Général (SG)" pour <strong>validation finale</strong>
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">✓</div>
                <h4 className="font-semibold text-green-900">Attestation délivrée</h4>
              </div>
              <p className="text-xs text-gray-600">L'attestation validée est envoyée à l'agent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Brouillons</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{stats.brouillon}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">En attente administrateur</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.enAttenteAdmin}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Attente SG</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.enAttenteSG}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Validées</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.validees}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Rejetées</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejetees}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="font-semibold text-gray-900">Filtres</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, prénom, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
                  <SelectValue placeholder="Type d'attestation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="intermediaire">Attestation intermédiaire</SelectItem>
                  <SelectItem value="presence">Attestation de présence</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-white border-slate-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="en_attente_admin">En attente Admin</SelectItem>
                  <SelectItem value="en_attente_sg">🟠 En attente SG</SelectItem>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="rejetee_admin">Rejetée Admin</SelectItem>
                  <SelectItem value="rejetee_sg">Rejetée SG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">{filteredAttestations.length}</span> résultat{filteredAttestations.length > 1 ? 's' : ''}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                  className="text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attestations List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAttestations.map(attestation => {
          const statusInfo = statusConfig[attestation.status];
          const typeInfo = typeConfig[attestation.type];
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={attestation.id} className="border-l-4 border-amber-500 shadow-md hover:shadow-lg transition-all">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                        <FileSignature className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {attestation.prenom} {attestation.nom}
                      </h3>
                      <Badge className={`${typeInfo.color} text-white`}>
                        {typeInfo.shortLabel}
                      </Badge>
                      <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Service</p>
                          <p className="font-semibold text-gray-900">{attestation.service}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date de création</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(attestation.dateCreation).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {attestation.dateLivraison && (
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date de livraison</p>
                            <p className="font-semibold text-green-900">
                              {new Date(attestation.dateLivraison).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Workflow progress */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        attestation.status !== 'brouillon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Send className="h-3 w-3" />
                        <span>Soumis</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        attestation.validationAdmin ? 
                          attestation.validationAdmin.action === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <UserCheck className="h-3 w-3" />
                        <span>Admin</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        attestation.validationSG ? 
                          attestation.validationSG.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Shield className="h-3 w-3" />
                        <span>SG</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        attestation.status === 'validee' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Validé</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 xl:ml-4 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(attestation)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(attestation.status === 'brouillon' || attestation.status === 'rejetee_admin' || attestation.status === 'rejetee_sg') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(attestation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {attestation.status === 'brouillon' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDeleteClick(attestation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAttestations.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="pt-12 pb-12 text-center">
            <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune attestation trouvée</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Aucune attestation ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre première attestation d\'exposition à l\'amiante.'}
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
              <Button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une attestation
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'attestation de <strong>{attestationToDelete?.prenom} {attestationToDelete?.nom}</strong> ?
              <br /><br />
              Cette action est irréversible.
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