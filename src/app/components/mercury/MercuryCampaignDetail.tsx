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
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Clock,
  ClipboardList,
  Sparkles,
  TrendingUp,
  DollarSign
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
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

interface MercuryCampaignDetailProps {
  campaign: MercuryCampaign;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MercuryCampaignDetail({ campaign, onBack, onEdit, onDelete }: MercuryCampaignDetailProps) {
  const statusConfig = {
    planifiee: {
      label: 'Planifiée',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      icon: Calendar,
    },
    en_cours: {
      label: 'En cours',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      icon: Clock,
    },
    rapport_recu: {
      label: 'Rapport reçu',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      icon: FileText,
    },
    synthese_produite: {
      label: 'Synthèse produite',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      icon: CheckCircle2,
    },
  };

  const config = statusConfig[campaign.statut];
  const StatusIcon = config.icon;

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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.titre}</h1>
              <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 text-sm px-3 py-1`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-gray-600">Référence : {campaign.reference}</p>
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
                  Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete();
                    toast.success('Campagne supprimée avec succès');
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

      {/* Phase 1: Planification */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Calendar className="h-6 w-6" />
                Phase 1 : Planification
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                Programme d'intervention et organisation de la campagne
              </CardDescription>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Programme d'intervention</p>
              <p className="text-base font-semibold text-gray-900">{campaign.programme}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Prestataire</p>
              <div>
                <p className="text-base font-semibold text-gray-900">{campaign.prestataire}</p>
                {campaign.contactPrestataire && (
                  <p className="text-sm text-gray-600">{campaign.contactPrestataire}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Dates prévisionnelles</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <p className="text-base font-semibold text-gray-900">
                  {new Date(campaign.datePrevue).toLocaleDateString('fr-FR')}
                  {campaign.dateFinPrevue && ` - ${new Date(campaign.dateFinPrevue).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
            </div>

            {campaign.budgetEstime && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Budget estimé</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-base font-semibold text-gray-900">
                    {campaign.budgetEstime.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-500 mb-2">Zones concernées</p>
            <div className="flex flex-wrap gap-2">
              {campaign.zones.map((zone, idx) => (
                <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-900 border-blue-300">
                  <MapPin className="h-3 w-3 mr-1" />
                  {zone}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Objectifs de la campagne</p>
            <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg border">{campaign.objectifs}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-3">Types de prélèvements prévus</p>
            <div className="space-y-2">
              {campaign.typesPrelevements.map((prelevement, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{prelevement.type}</span>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    {prelevement.quantite} {prelevement.unite}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2: Suivi Terrain */}
      {(campaign.dateReelle || campaign.prelevementsRealises) && (
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <MapPin className="h-6 w-6" />
                  Phase 2 : Suivi Terrain
                </CardTitle>
                <CardDescription className="text-orange-700 mt-1">
                  Prélèvements effectués et conditions d'intervention
                </CardDescription>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {campaign.dateReelle && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dates réelles d'intervention</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(campaign.dateReelle).toLocaleDateString('fr-FR')}
                      {campaign.dateFinReelle && ` - ${new Date(campaign.dateFinReelle).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {campaign.prelevementsRealises && campaign.prelevementsRealises.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-500 mb-3">Prélèvements réalisés</p>
                  <div className="space-y-2">
                    {campaign.prelevementsRealises.map((prelevement, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-orange-600" />
                            <span className="font-semibold text-gray-900">{prelevement.type}</span>
                          </div>
                          <Badge className="bg-orange-600 text-white">
                            {prelevement.quantite} {prelevement.unite}
                          </Badge>
                        </div>
                        {prelevement.description && (
                          <p className="text-sm text-gray-700 ml-8 italic">{prelevement.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {campaign.ecartsConstates && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">Écarts constatés</p>
                    <p className="text-sm text-amber-800">{campaign.ecartsConstates}</p>
                  </div>
                </div>
              </div>
            )}

            {campaign.difficultes && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Difficultés rencontrées</p>
                <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg border">{campaign.difficultes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 3: Rapport */}
      {campaign.rapportRecu && (
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <FileText className="h-6 w-6" />
                  Phase 3 : Rapport Prestataire
                </CardTitle>
                <CardDescription className="text-purple-700 mt-1">
                  Document reçu et vérifications effectuées
                </CardDescription>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {campaign.dateReceptionRapport && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Date de réception</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(campaign.dateReceptionRapport).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            {campaign.fichierRapport && (
              <div className="p-4 bg-white border-2 border-purple-300 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{campaign.fichierRapport}</p>
                    <p className="text-xs text-gray-500">Document PDF du prestataire</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-3">État des vérifications</p>
              
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                campaign.verificationAdministrative ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {campaign.verificationAdministrative ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">Vérification administrative</p>
                    <p className="text-sm text-gray-600">Complétude du dossier, factures, conventions</p>
                  </div>
                </div>
                <Badge className={campaign.verificationAdministrative ? 'bg-green-600' : 'bg-gray-400'}>
                  {campaign.verificationAdministrative ? 'Validée' : 'En attente'}
                </Badge>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                campaign.verificationCoherence === true
                  ? 'bg-green-50 border-green-300'
                  : campaign.verificationCoherence === false
                  ? 'bg-red-50 border-red-300'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {campaign.verificationCoherence === true ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : campaign.verificationCoherence === false ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">Vérification de cohérence</p>
                    <p className="text-sm text-gray-600">Données cohérentes, échantillons complets</p>
                  </div>
                </div>
                <Badge className={
                  campaign.verificationCoherence === true
                    ? 'bg-green-600'
                    : campaign.verificationCoherence === false
                    ? 'bg-red-600'
                    : 'bg-gray-400'
                }>
                  {campaign.verificationCoherence === true
                    ? 'Validée'
                    : campaign.verificationCoherence === false
                    ? 'Non conforme'
                    : 'En attente'}
                </Badge>
              </div>
            </div>

            {campaign.notesVerification && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Notes de vérification</p>
                <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg border">{campaign.notesVerification}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phase 4: Synthèse */}
      {campaign.syntheseProduite && (
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Sparkles className="h-6 w-6" />
                  Phase 4 : Synthèse de la Campagne
                </CardTitle>
                <CardDescription className="text-green-700 mt-1">
                  Synthèse produite le {campaign.dateSynthese && new Date(campaign.dateSynthese).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Synthèse exploitable</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Document synthétique extrayant l'essentiel du rapport technique pour une compréhension rapide
                  </p>
                </div>
              </div>
            </div>

            {campaign.contexteIntervention && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">📋 Contexte de l'intervention</p>
                <p className="text-base text-gray-900 bg-white p-4 rounded-lg border-2 border-gray-200">
                  {campaign.contexteIntervention}
                </p>
              </div>
            )}

            {campaign.lieuEtDate && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">📍 Lieu et dates</p>
                <p className="text-base text-gray-900 bg-white p-4 rounded-lg border-2 border-gray-200">
                  {campaign.lieuEtDate}
                </p>
              </div>
            )}

            {campaign.prelevementsEffectues && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">🔬 Prélèvements effectués</p>
                <p className="text-base text-gray-900 bg-white p-4 rounded-lg border-2 border-gray-200">
                  {campaign.prelevementsEffectues}
                </p>
              </div>
            )}

            <Separator />

            {campaign.resultatsMarquants && (
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-2">⭐ Résultats marquants (Mercure)</p>
                <p className="text-base text-gray-900 bg-amber-50 p-4 rounded-lg border-2 border-amber-300 font-semibold">
                  {campaign.resultatsMarquants}
                </p>
              </div>
            )}

            {campaign.pointsAttention && (
              <div>
                <p className="text-sm font-semibold text-orange-900 mb-2">⚠️ Points d'attention</p>
                <p className="text-base text-gray-900 bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                  {campaign.pointsAttention}
                </p>
              </div>
            )}

            {campaign.anomalies && (
              <div>
                <p className="text-sm font-semibold text-red-900 mb-2">🚨 Anomalies détectées</p>
                <p className="text-base text-gray-900 bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  {campaign.anomalies}
                </p>
              </div>
            )}

            <Separator />

            {campaign.conclusion && (
              <div>
                <p className="text-sm font-semibold text-green-900 mb-2">✅ Conclusion</p>
                <p className="text-base text-gray-900 bg-green-50 p-4 rounded-lg border-2 border-green-400 font-bold">
                  {campaign.conclusion}
                </p>
              </div>
            )}

            {campaign.suitesADonner && (
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-2">→ Suites à donner</p>
                <p className="text-base text-gray-900 bg-blue-50 p-4 rounded-lg border-2 border-blue-400 font-bold">
                  {campaign.suitesADonner}
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger la Synthèse (PDF)
              </Button>
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
              <p className="font-semibold text-gray-900">{campaign.createdBy}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Date de création</p>
              <p className="font-semibold text-gray-900">
                {new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Dernière modification</p>
              <p className="font-semibold text-gray-900">
                {new Date(campaign.updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
