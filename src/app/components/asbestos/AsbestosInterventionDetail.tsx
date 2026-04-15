import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
  Shield,
  Activity,
  TrendingUp,
  ClipboardCheck,
  FileText,
  Building2,
  Clock,
  XCircle
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
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

interface AsbestosInterventionDetailProps {
  intervention: AsbestosIntervention;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AsbestosInterventionDetail({ intervention, onBack, onEdit, onDelete }: AsbestosInterventionDetailProps) {
  const statusConfig = {
    non_amiante: {
      label: 'Non amianté',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      icon: CheckCircle2,
    },
    surveiller: {
      label: 'À surveiller',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      icon: Clock,
    },
    action_requise: {
      label: 'Action requise',
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      icon: AlertTriangle,
    },
    retrait_effectue: {
      label: 'Retrait effectué',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
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
    1: { label: 'Score 1', color: 'bg-green-600', description: 'État correct - Faible risque' },
    2: { label: 'Score 2', color: 'bg-orange-600', description: 'État intermédiaire - Risque moyen' },
    3: { label: 'Score 3', color: 'bg-red-600', description: 'État dégradé - Risque élevé' },
  };

  const config = statusConfig[intervention.statut];
  const StatusIcon = config.icon;
  const scoreInfo = intervention.scoreActuel ? scoreConfig[intervention.scoreActuel] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">{intervention.zoneMateriau}</h1>
              <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 text-sm px-3 py-1`}>
                {config.label}
              </Badge>
              {intervention.priorite && (
                <Badge variant="outline" className={`${priorityConfig[intervention.priorite].color} text-sm px-3 py-1`}>
                  Priorité {intervention.priorite}
                </Badge>
              )}
              {scoreInfo && (
                <Badge className={`${scoreInfo.color} text-white text-sm px-3 py-1`}>
                  {scoreInfo.label}
                </Badge>
              )}
              {intervention.retraitRealise && (
                <Badge className="bg-purple-600 text-white text-sm px-3 py-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Retrait effectué
                </Badge>
              )}
            </div>
            <p className="text-gray-600">Référence : {intervention.reference}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
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
                  Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete();
                    toast.success('Intervention supprimée avec succès');
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Section 1: Identification */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <MapPin className="h-6 w-6" />
            Identification et Localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Zone / Matériau</p>
              <p className="text-base font-semibold text-gray-900">{intervention.zoneMateriau}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Localisation précise</p>
              <p className="text-base font-semibold text-gray-900">{intervention.localisationPrecise}</p>
            </div>

            {intervention.batiment && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Bâtiment</p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <p className="text-base font-semibold text-gray-900">{intervention.batiment}</p>
                </div>
              </div>
            )}

            {intervention.etage && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Étage / Niveau</p>
                <p className="text-base font-semibold text-gray-900">{intervention.etage}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Diagnostic Initial */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-6 w-6" />
            Diagnostic Initial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Date du 1er repérage</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="text-base font-semibold text-gray-900">
                  {new Date(intervention.datePremiereReperage).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Type d'analyse initiale</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300">
                {intervention.typeAnalyseInitiale}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-500 mb-2">Résultat de l'analyse</p>
            <div className={`p-4 rounded-lg border-2 ${
              intervention.statut === 'non_amiante' 
                ? 'bg-green-50 border-green-300' 
                : 'bg-amber-50 border-amber-300'
            }`}>
              <p className="text-base text-gray-900 font-semibold">
                {intervention.resultatAnalyse}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Suivi */}
      {(intervention.dernierControle || intervention.scoreActuel || intervention.evolutionScore) && (
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Activity className="h-6 w-6" />
              Suivi et Évaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {intervention.dernierControle && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dernier contrôle</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(intervention.dernierControle).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}

              {scoreInfo && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Score actuel</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${scoreInfo.color} text-white`}>
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <p className="font-bold">{scoreInfo.label}</p>
                      <p className="text-sm">{scoreInfo.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {intervention.evolutionScore && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 mb-2">Évolution du score</p>
                  <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                    <p className="text-base text-gray-900">{intervention.evolutionScore}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 4: Actions Réalisées */}
      {(intervention.actionsRealisees || intervention.retraitRealise) && (
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <ClipboardCheck className="h-6 w-6" />
              Actions Réalisées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {intervention.actionsRealisees && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Mesures de gestion effectuées</p>
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <p className="text-base text-gray-900 whitespace-pre-line">{intervention.actionsRealisees}</p>
                </div>
              </div>
            )}

            {intervention.retraitRealise && (
              <>
                <Separator />
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <p className="font-bold text-green-900 text-lg">Retrait effectué</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intervention.dateRetrait && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date du retrait</p>
                        <p className="text-base font-semibold text-gray-900">
                          {new Date(intervention.dateRetrait).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    {intervention.entrepriseRetrait && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Entreprise de désamiantage</p>
                        <p className="text-base font-semibold text-gray-900">{intervention.entrepriseRetrait}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 5: Gestion Future */}
      {(intervention.actionAPrevoir || intervention.echeanceAction) && (
        <Card className="border-2 border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <TrendingUp className="h-6 w-6" />
              Action à Prévoir et Gestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {intervention.actionAPrevoir && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Action à prévoir</p>
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <p className="text-base text-gray-900 font-semibold whitespace-pre-line">
                    {intervention.actionAPrevoir}
                  </p>
                </div>
              </div>
            )}

            {intervention.echeanceAction && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Échéance de l'action</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(intervention.echeanceAction).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 6: Documents */}
      {intervention.fichierDiagnostic && (
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="h-6 w-6" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="p-4 bg-white border-2 border-purple-300 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">{intervention.fichierDiagnostic}</p>
                  <p className="text-xs text-gray-500">PDF - Rapport de diagnostic</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      <Card className="border-0 shadow-lg bg-gray-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Responsable du suivi</p>
              <p className="font-semibold text-gray-900">{intervention.responsable}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Créé par</p>
              <p className="font-semibold text-gray-900">{intervention.createdBy}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Date de création</p>
              <p className="font-semibold text-gray-900">
                {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Dernière modification</p>
              <p className="font-semibold text-gray-900">
                {new Date(intervention.updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
