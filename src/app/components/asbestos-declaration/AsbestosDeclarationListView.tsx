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
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  XCircle,
  Shield,
  Building2,
  User,
  ClipboardCheck
} from 'lucide-react';
import { AsbestosDeclaration, DeclarationStatus, DeclarationType } from '../AsbestosDeclarationView';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface AsbestosDeclarationListViewProps {
  declarations: AsbestosDeclaration[];
  currentUser: {
    name: string;
    role: 'admin' | 'chef_service' | 'agent';
  };
  onCreateNew: () => void;
  onViewDetail: (declaration: AsbestosDeclaration) => void;
  onEdit: (declaration: AsbestosDeclaration) => void;
  onDelete: (id: string) => void;
  onValidateAdmin: (id: string, comment: string) => void;
  onValidateSG: (id: string, comment: string) => void;
  onSendToAgent: (id: string) => void;
}

export function AsbestosDeclarationListView({
  declarations,
  currentUser,
  onCreateNew,
  onViewDetail,
  onEdit,
  onDelete,
  onValidateAdmin,
  onValidateSG,
  onSendToAgent
}: AsbestosDeclarationListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [declarationToDelete, setDeclarationToDelete] = useState<AsbestosDeclaration | null>(null);
  
  // Pour les validations
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [validateAction, setValidateAction] = useState<'admin' | 'sg' | null>(null);
  const [declarationToValidate, setDeclarationToValidate] = useState<AsbestosDeclaration | null>(null);
  const [validationComment, setValidationComment] = useState('');

  const statusConfig: Record<DeclarationStatus, { label: string; color: string; icon: any }> = {
    pending: {
      label: 'En attente validation Admin',
      color: 'from-gray-500 to-slate-600',
      icon: Clock,
    },
    validated_admin: {
      label: 'Validée Admin - En attente SG',
      color: 'from-blue-500 to-cyan-600',
      icon: ClipboardCheck,
    },
    validated_sg: {
      label: 'Validée SG - À transmettre',
      color: 'from-orange-500 to-amber-600',
      icon: Send,
    },
    completed: {
      label: 'Complète - Transmise à l\'agent',
      color: 'from-green-500 to-emerald-600',
      icon: CheckCircle2,
    },
  };

  const typeConfig: Record<DeclarationType, { label: string; description: string }> = {
    intermediaire: {
      label: 'Attestation Intermédiaire',
      description: 'Exposition antérieure au 31/01/2012'
    },
    presence: {
      label: 'Attestation de Présence',
      description: 'Présence dans lieux contaminés'
    }
  };

  const filteredDeclarations = declarations.filter(declaration => {
    const matchesSearch = 
      declaration.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      declaration.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      declaration.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      declaration.intitulePosteActuel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || declaration.status === filterStatus;
    const matchesType = filterType === 'all' || declaration.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistiques
  const stats = {
    total: declarations.length,
    pending: declarations.filter(d => d.status === 'pending').length,
    validated_admin: declarations.filter(d => d.status === 'validated_admin').length,
    validated_sg: declarations.filter(d => d.status === 'validated_sg').length,
    completed: declarations.filter(d => d.status === 'completed').length,
  };

  const handleDeleteClick = (declaration: AsbestosDeclaration) => {
    setDeclarationToDelete(declaration);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (declarationToDelete) {
      onDelete(declarationToDelete.id);
      toast.success(`Déclaration de ${declarationToDelete.prenom} ${declarationToDelete.nom} supprimée`);
      setDeleteDialogOpen(false);
      setDeclarationToDelete(null);
    }
  };

  const handleValidateClick = (declaration: AsbestosDeclaration, action: 'admin' | 'sg') => {
    setDeclarationToValidate(declaration);
    setValidateAction(action);
    setValidationComment('');
    setValidateDialogOpen(true);
  };

  const handleConfirmValidate = () => {
    if (declarationToValidate && validateAction && validationComment.trim()) {
      if (validateAction === 'admin') {
        onValidateAdmin(declarationToValidate.id, validationComment);
        toast.success('Déclaration validée par l\'Admin. En attente de validation SG.');
      } else {
        onValidateSG(declarationToValidate.id, validationComment);
        toast.success('Déclaration validée par le SG. Prête à être transmise à l\'agent.');
      }
      setValidateDialogOpen(false);
      setDeclarationToValidate(null);
      setValidateAction(null);
      setValidationComment('');
    }
  };

  const handleSendToAgentClick = (declaration: AsbestosDeclaration) => {
    onSendToAgent(declaration.id);
    toast.success(`Attestation transmise à ${declaration.prenom} ${declaration.nom}`);
  };

  const DeclarationCard = ({ declaration }: { declaration: AsbestosDeclaration }) => {
    const config = statusConfig[declaration.status];
    const typeInfo = typeConfig[declaration.type];
    const IconComponent = config.icon;

    // Déterminer les actions possibles selon le rôle et le statut
    const canValidateAdmin = currentUser.role === 'admin' && declaration.status === 'pending';
    const canValidateSG = (currentUser.role === 'admin' || currentUser.role === 'chef_service') && declaration.status === 'validated_admin';
    const canSendToAgent = (currentUser.role === 'admin' || currentUser.role === 'chef_service') && declaration.status === 'validated_sg';
    const canEdit = declaration.status === 'pending';
    const canDelete = currentUser.role === 'admin';

    return (
      <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all bg-white">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {declaration.prenom} {declaration.nom}
                </h3>
                <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                  {config.label}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">
                  {typeInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="font-semibold text-gray-900">{declaration.service}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Poste actuel</p>
                    <p className="font-semibold text-gray-900">{declaration.intitulePosteActuel}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Date de création</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(declaration.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow info */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {declaration.validatedByAdmin && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">
                    ✓ Admin: {declaration.validatedByAdmin}
                  </Badge>
                )}
                {declaration.validatedBySG && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-900 border-orange-200">
                    ✓ SG: {declaration.validatedBySG}
                  </Badge>
                )}
                {declaration.sentToAgentDate && (
                  <Badge variant="outline" className="bg-green-50 text-green-900 border-green-200">
                    ✓ Transmise le {new Date(declaration.sentToAgentDate).toLocaleDateString('fr-FR')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4 shrink-0">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onViewDetail(declaration)}>
                  <Eye className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(declaration)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteClick(declaration)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Actions de validation */}
              <div className="flex flex-col gap-2">
                {canValidateAdmin && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleValidateClick(declaration, 'admin')}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Valider (Admin)
                  </Button>
                )}
                {canValidateSG && (
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleValidateClick(declaration, 'sg')}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Valider (SG)
                  </Button>
                )}
                {canSendToAgent && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleSendToAgentClick(declaration)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Transmettre
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Déclarations d'Exposition Amiante</h1>
            <p className="text-gray-600 mt-1">
              Gestion des attestations avec workflow de validation
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle Déclaration
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setFilterStatus('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">⏳ En attente</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setFilterStatus('validated_admin')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">✓ Admin</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.validated_admin}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setFilterStatus('validated_sg')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">✓ SG</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{stats.validated_sg}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setFilterStatus('completed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">✅ Complète</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
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
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📋 Tous les statuts</SelectItem>
                  <SelectItem value="pending">⏳ En attente validation Admin</SelectItem>
                  <SelectItem value="validated_admin">✓ Validée Admin</SelectItem>
                  <SelectItem value="validated_sg">✓ Validée SG</SelectItem>
                  <SelectItem value="completed">✅ Complète</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📄 Tous les types</SelectItem>
                  <SelectItem value="intermediaire">Attestation Intermédiaire</SelectItem>
                  <SelectItem value="presence">Attestation de Présence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || filterStatus !== 'all' || filterType !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">{filteredDeclarations.length}</span> résultat{filteredDeclarations.length > 1 ? 's' : ''}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterType('all');
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

      {/* Declarations List */}
      <div className="space-y-3">
        {filteredDeclarations.length > 0 ? (
          filteredDeclarations.map(declaration => (
            <DeclarationCard key={declaration.id} declaration={declaration} />
          ))
        ) : (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune déclaration trouvée</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Aucune déclaration ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première déclaration d\'exposition à l\'amiante.'}
              </p>
              {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                <Button
                  onClick={onCreateNew}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une déclaration
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la déclaration de <strong>{declarationToDelete?.prenom} {declarationToDelete?.nom}</strong> ?
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

      {/* Validate Dialog */}
      <AlertDialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {validateAction === 'admin' ? 'Validation Admin' : 'Validation Secrétaire Général'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Déclaration de <strong>{declarationToValidate?.prenom} {declarationToValidate?.nom}</strong>
              <br />
              {validateAction === 'admin' 
                ? 'Après validation, la déclaration sera transmise au Secrétaire Général pour validation finale.'
                : 'Après validation, la déclaration sera prête à être transmise à l\'agent.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="validation-comment">Commentaire de validation *</Label>
            <Textarea
              id="validation-comment"
              value={validationComment}
              onChange={(e) => setValidationComment(e.target.value)}
              placeholder={validateAction === 'admin' 
                ? "Ex: Dossier complet, exposition avérée. Validation pour transmission au SG."
                : "Ex: Attestation validée. À transmettre à l'agent pour son suivi médical post-professionnel."}
              rows={4}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setValidationComment('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmValidate}
              disabled={!validationComment.trim()}
              className={validateAction === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              Valider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
