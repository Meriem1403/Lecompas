import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Send,
  User,
  Briefcase,
  AlertTriangle,
  FileSignature,
  Shield,
  UserCheck,
  Clock,
  ChevronRight,
  Building2,
  MessageSquare
} from 'lucide-react';
import { AsbestosAttestation } from '../AsbestosAttestationsView';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { toast } from 'sonner';

interface AsbestosAttestationDetailProps {
  attestation: AsbestosAttestation;
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onValidateAdmin: (id: string, comment: string) => void;
  onRejectAdmin: (id: string, comment: string) => void;
  onValidateSG: (id: string, comment: string) => void;
  onRejectSG: (id: string, comment: string) => void;
  onSubmit: (id: string) => void;
}

export function AsbestosAttestationDetail({
  attestation,
  currentUserRole,
  currentUserName,
  onBack,
  onEdit,
  onDelete,
  onValidateAdmin,
  onRejectAdmin,
  onValidateSG,
  onRejectSG,
  onSubmit
}: AsbestosAttestationDetailProps) {
  const [validationComment, setValidationComment] = useState('');
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationAction, setValidationAction] = useState<'validate_admin' | 'reject_admin' | 'validate_sg' | 'reject_sg' | null>(null);

  const statusConfig = {
    brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileSignature },
    en_attente_admin: { label: 'En attente Admin', color: 'bg-blue-100 text-blue-700', icon: Clock },
    rejetee_admin: { label: 'Rejetée Admin', color: 'bg-red-100 text-red-700', icon: XCircle },
    en_attente_sg: { label: 'En attente SG', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    rejetee_sg: { label: 'Rejetée SG', color: 'bg-red-100 text-red-700', icon: XCircle },
    validee: { label: 'Validée', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    envoyee_agent: { label: 'Envoyée à l\'agent', color: 'bg-purple-100 text-purple-700', icon: Send },
  };

  const typeConfig = {
    intermediaire: {
      label: 'Attestation d\'exposition intermédiaire à l\'amiante (antérieure au 31 janvier 2012)',
      color: 'bg-indigo-600',
    },
    presence: {
      label: 'Attestation de présence dans les lieux de travail susceptibles d\'avoir été contaminés par de l\'amiante',
      color: 'bg-teal-600',
    },
  };

  const config = statusConfig[attestation.status];
  const typeInfo = typeConfig[attestation.type];
  const StatusIcon = config.icon;

  const handleValidationAction = (action: typeof validationAction) => {
    setValidationAction(action);
    setValidationComment('');
    setValidationDialogOpen(true);
  };

  const handleConfirmValidation = () => {
    if (!validationComment.trim()) {
      toast.error('Un commentaire est obligatoire');
      return;
    }

    switch (validationAction) {
      case 'validate_admin':
        onValidateAdmin(attestation.id, validationComment);
        toast.success('Attestation validée par l\'Admin');
        break;
      case 'reject_admin':
        onRejectAdmin(attestation.id, validationComment);
        toast.info('Attestation rejetée par l\'Admin');
        break;
      case 'validate_sg':
        onValidateSG(attestation.id, validationComment);
        toast.success('Attestation validée par le SG');
        break;
      case 'reject_sg':
        onRejectSG(attestation.id, validationComment);
        toast.info('Attestation rejetée par le SG');
        break;
    }

    setValidationDialogOpen(false);
    setValidationAction(null);
    setValidationComment('');
  };

  const handleSubmit = () => {
    onSubmit(attestation.id);
    toast.success('Attestation soumise pour validation Admin');
  };

  const canEdit = attestation.status === 'brouillon' || attestation.status === 'rejetee_admin' || attestation.status === 'rejetee_sg';
  const canDelete = attestation.status === 'brouillon';
  const canSubmit = attestation.status === 'brouillon';
  const canValidateAdmin = currentUserRole === 'admin' && attestation.status === 'en_attente_admin';
  const canValidateSG = currentUserRole === 'chef_service' && attestation.status === 'en_attente_sg';

  return (
    <div className="space-y-6">
      {/* Debug Card - Affiche le rôle et les conditions */}
      <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-2 text-sm">
            <h3 className="font-bold text-purple-900 mb-2">🔍 Informations de débogage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Votre rôle actuel :</p>
                <p className="font-bold text-purple-900">{currentUserRole}</p>
              </div>
              <div>
                <p className="text-gray-600">Statut de l'attestation :</p>
                <p className="font-bold text-purple-900">{attestation.status}</p>
              </div>
              <div>
                <p className="text-gray-600">canValidateAdmin :</p>
                <p className={`font-bold ${canValidateAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {canValidateAdmin ? '✅ OUI' : '❌ NON'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Condition : role=admin ET status=en_attente_admin
                </p>
              </div>
              <div>
                <p className="text-gray-600">canValidateSG :</p>
                <p className={`font-bold ${canValidateSG ? 'text-green-600' : 'text-red-600'}`}>
                  {canValidateSG ? '✅ OUI' : '❌ NON'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Condition : role=chef_service ET status=en_attente_sg
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">
                {attestation.prenom} {attestation.nom}
              </h1>
              <Badge className={`${config.color} border-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-gray-600">{typeInfo.label}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Soumettre
            </Button>
          )}
          {canValidateAdmin && (
            <>
              <Button
                onClick={() => handleValidationAction('validate_admin')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider
              </Button>
              <Button
                onClick={() => handleValidationAction('reject_admin')}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          {canValidateSG && (
            <>
              <Button
                onClick={() => handleValidationAction('validate_sg')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider
              </Button>
              <Button
                onClick={() => handleValidationAction('reject_sg')}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer cette attestation ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete();
                      toast.success('Attestation supprimée');
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Help Card for validation buttons */}
      {!canValidateAdmin && !canValidateSG && !canSubmit && (
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">💡 Comment valider cette attestation ?</h3>
                <p className="text-sm text-gray-700">
                  {attestation.status === 'brouillon' && (
                    <><strong>Cette attestation est en brouillon.</strong> Cliquez sur "Soumettre" pour l'envoyer à l'Admin.</>
                  )}
                  {attestation.status === 'en_attente_admin' && (
                    <><strong>Changez votre rôle</strong> en "Administrateur" dans la sidebar pour voir les boutons de validation.</>
                  )}
                  {attestation.status === 'en_attente_sg' && (
                    <><strong>Changez votre rôle</strong> en "Secrétaire Général (SG)" dans la sidebar pour voir les boutons de validation.</>
                  )}
                  {attestation.status === 'validee' && (
                    <>✅ Cette attestation a été <strong>entièrement validée</strong> et est prête à être délivrée.</>
                  )}
                  {(attestation.status === 'rejetee_admin' || attestation.status === 'rejetee_sg') && (
                    <>❌ Cette attestation a été <strong>rejetée</strong>. Vous pouvez la modifier et la soumettre à nouveau.</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Status */}
      <Card className="border-2 border-amber-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="text-amber-900">Workflow de validation</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className={`flex-1 text-center ${attestation.status !== 'brouillon' ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center ${
                attestation.status !== 'brouillon' ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                <Send className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-2">Soumis</p>
            </div>

            <ChevronRight className="h-6 w-6 text-gray-400" />

            <div className={`flex-1 text-center ${attestation.validationAdmin ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center ${
                attestation.validationAdmin 
                  ? attestation.validationAdmin.action === 'approved' ? 'bg-blue-500' : 'bg-red-500'
                  : 'bg-gray-300'
              }`}>
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-2">Validation Admin</p>
              {attestation.validationAdmin && (
                <p className="text-xs text-gray-600 mt-1">
                  {attestation.validationAdmin.validatedBy}
                </p>
              )}
            </div>

            <ChevronRight className="h-6 w-6 text-gray-400" />

            <div className={`flex-1 text-center ${attestation.validationSG ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center ${
                attestation.validationSG 
                  ? attestation.validationSG.action === 'approved' ? 'bg-green-500' : 'bg-red-500'
                  : 'bg-gray-300'
              }`}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-2">Validation SG</p>
              {attestation.validationSG && (
                <p className="text-xs text-gray-600 mt-1">
                  {attestation.validationSG.validatedBy}
                </p>
              )}
            </div>

            <ChevronRight className="h-6 w-6 text-gray-400" />

            <div className={`flex-1 text-center ${attestation.status === 'validee' ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center ${
                attestation.status === 'validee' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-2">Validée</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Comments */}
      {(attestation.validationAdmin || attestation.validationSG) && (
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MessageSquare className="h-6 w-6" />
              Commentaires de validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {attestation.validationAdmin && (
              <div className={`p-4 rounded-lg border-2 ${
                attestation.validationAdmin.action === 'approved' 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-5 w-5" />
                  <span className="font-semibold">Admin - {attestation.validationAdmin.validatedBy}</span>
                  <span className="text-sm text-gray-600">
                    • {new Date(attestation.validationAdmin.validatedDate).toLocaleDateString('fr-FR')}
                  </span>
                  <Badge className={attestation.validationAdmin.action === 'approved' ? 'bg-blue-600' : 'bg-red-600'}>
                    {attestation.validationAdmin.action === 'approved' ? 'Approuvé' : 'Rejeté'}
                  </Badge>
                </div>
                <p className="text-gray-800">{attestation.validationAdmin.comment}</p>
              </div>
            )}

            {attestation.validationSG && (
              <div className={`p-4 rounded-lg border-2 ${
                attestation.validationSG.action === 'approved' 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">SG - {attestation.validationSG.validatedBy}</span>
                  <span className="text-sm text-gray-600">
                    • {new Date(attestation.validationSG.validatedDate).toLocaleDateString('fr-FR')}
                  </span>
                  <Badge className={attestation.validationSG.action === 'approved' ? 'bg-green-600' : 'bg-red-600'}>
                    {attestation.validationSG.action === 'approved' ? 'Approuvé' : 'Rejeté'}
                  </Badge>
                </div>
                <p className="text-gray-800">{attestation.validationSG.comment}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informations Agent */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <User className="h-6 w-6" />
            Éléments d'identification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="text-base font-semibold text-gray-900">{attestation.nom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prénom</p>
              <p className="text-base font-semibold text-gray-900">{attestation.prenom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de naissance</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(attestation.dateNaissance).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">N° Sécu</p>
              <p className="text-base font-semibold text-gray-900">{attestation.numeroSecu}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="text-base font-semibold text-gray-900">{attestation.service}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Médecin de prévention</p>
              <p className="text-base font-semibold text-gray-900">{attestation.medecinPrevention}</p>
            </div>
          </div>

          {attestation.intitulePoste && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-500">Intitulé du poste</p>
                <p className="text-base font-semibold text-gray-900">{attestation.intitulePoste}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Postes occupés (attestation intermédiaire) */}
      {attestation.type === 'intermediaire' && attestation.postesOccupes && attestation.postesOccupes.length > 0 && (
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Briefcase className="h-6 w-6" />
              Poste(s) occupé(s)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {attestation.postesOccupes.map((poste, index) => (
              <div key={poste.id} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Poste #{index + 1}</h4>
                <p className="text-base text-gray-800 mb-2">{poste.intitulePoste}</p>
                <p className="text-sm text-gray-600">
                  Du {new Date(poste.dateDebut).toLocaleDateString('fr-FR')} au {new Date(poste.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Produits/procédés (attestation intermédiaire) */}
      {attestation.type === 'intermediaire' && attestation.produitsProcessus && attestation.produitsProcessus.length > 0 && (
        <Card className="border-2 border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-6 w-6" />
              Produits ou procédés potentiellement utilisés pour l'Amiante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Produits ou procédés</th>
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Composition</th>
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Mesures de prévention</th>
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Évaluation exposition</th>
                  </tr>
                </thead>
                <tbody>
                  {attestation.produitsProcessus.map((produit) => (
                    <tr key={produit.id}>
                      <td className="border p-3 text-sm text-gray-800">{produit.produitProcede}</td>
                      <td className="border p-3 text-sm text-gray-800">{produit.compositionProduits}</td>
                      <td className="border p-3 text-sm text-gray-800">{produit.mesuresPrevention}</td>
                      <td className="border p-3 text-sm text-gray-800">{produit.evaluationExposition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Périodes de présence (attestation de présence) */}
      {attestation.type === 'presence' && attestation.periodesPresence && attestation.periodesPresence.length > 0 && (
        <Card className="border-2 border-teal-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <Building2 className="h-6 w-6" />
              Périodes de présence dans les locaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Bâtiments/Locaux</th>
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Période</th>
                    <th className="border p-3 text-left text-sm font-semibold text-gray-900">Origine suspicion</th>
                  </tr>
                </thead>
                <tbody>
                  {attestation.periodesPresence.map((periode) => (
                    <tr key={periode.id}>
                      <td className="border p-3 text-sm text-gray-800">{periode.batimentsLocaux}</td>
                      <td className="border p-3 text-sm text-gray-800">
                        Du {new Date(periode.dateDebut).toLocaleDateString('fr-FR')} au {new Date(periode.dateFin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="border p-3 text-sm text-gray-800 whitespace-pre-line">{periode.origineSuspicion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      <Card className="border-0 shadow-lg bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Créé par</p>
              <p className="font-semibold text-gray-900">{attestation.createdBy}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Date de création</p>
              <p className="font-semibold text-gray-900">
                {new Date(attestation.dateCreation).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {attestation.dateLivraison && (
              <div>
                <p className="text-gray-500 mb-1">Date de livraison</p>
                <p className="font-semibold text-green-900">
                  {new Date(attestation.dateLivraison).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validationAction === 'validate_admin' && 'Valider l\'attestation (Admin)'}
              {validationAction === 'reject_admin' && 'Rejeter l\'attestation (Admin)'}
              {validationAction === 'validate_sg' && 'Valider l\'attestation (SG)'}
              {validationAction === 'reject_sg' && 'Rejeter l\'attestation (SG)'}
            </DialogTitle>
            <DialogDescription>
              Veuillez saisir un commentaire pour expliquer votre décision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="comment">Commentaire *</Label>
              <Textarea
                id="comment"
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                placeholder="Saisissez votre commentaire..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmValidation}
              className={
                validationAction?.includes('validate')
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}