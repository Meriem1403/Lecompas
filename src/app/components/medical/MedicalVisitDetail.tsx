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
  CheckCircle2,
  AlertTriangle,
  User,
  Briefcase,
  Stethoscope,
  Shield,
  Activity,
  Clock,
  AlertCircle,
  Users,
  Building2,
  Target
} from 'lucide-react';
import { MedicalVisit, Risk } from '../MedicalVisitsView';
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

interface MedicalVisitDetailProps {
  medicalVisit: MedicalVisit;
  risks: Risk[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MedicalVisitDetail({ medicalVisit, risks, onBack, onEdit, onDelete }: MedicalVisitDetailProps) {
  const statusConfig = {
    a_jour: {
      label: 'À jour',
      color: 'from-green-500 to-emerald-500',
      icon: CheckCircle2,
    },
    a_planifier: {
      label: 'À planifier',
      color: 'from-blue-500 to-cyan-500',
      icon: Clock,
    },
    en_retard: {
      label: 'En retard',
      color: 'from-orange-500 to-amber-500',
      icon: AlertCircle,
    },
    urgent: {
      label: 'Urgent',
      color: 'from-red-500 to-rose-500',
      icon: AlertTriangle,
    },
  };

  // Calculer le statut automatiquement
  const calculateStatus = (): typeof medicalVisit.statut => {
    if (!medicalVisit.prochaineVisiteMedicale) return 'a_planifier';
    
    const today = new Date();
    const nextVisit = new Date(medicalVisit.prochaineVisiteMedicale);
    const diffDays = Math.floor((nextVisit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'urgent';
    if (diffDays < 30) return 'en_retard';
    if (diffDays < 90) return 'a_planifier';
    return 'a_jour';
  };

  const currentStatus = calculateStatus();
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  const getDaysUntilNextVisit = (): { days: number; text: string; color: string } | null => {
    if (!medicalVisit.prochaineVisiteMedicale) return null;
    const nextVisit = new Date(medicalVisit.prochaineVisiteMedicale);
    const today = new Date();
    const days = Math.floor((nextVisit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      return {
        days,
        text: `En retard de ${Math.abs(days)} jours`,
        color: 'text-red-600'
      };
    }
    
    return {
      days,
      text: `Dans ${days} jours`,
      color: days < 30 ? 'text-orange-600' : days < 90 ? 'text-blue-600' : 'text-green-600'
    };
  };

  const nextVisitInfo = getDaysUntilNextVisit();

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
              <h1 className="text-3xl font-bold text-gray-900">{medicalVisit.prenom} {medicalVisit.nom}</h1>
              <Badge className={`bg-gradient-to-r ${config.color} text-white border-0 text-sm px-3 py-1`}>
                {config.label}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-700 text-sm px-3 py-1">
                {medicalVisit.sexe === 'M' ? 'Homme' : 'Femme'}
              </Badge>
              {medicalVisit.amenagementPoste && medicalVisit.amenagementPoste !== 'Aucun' && (
                <Badge className="bg-purple-600 text-white text-sm px-3 py-1">
                  <Activity className="h-3 w-3 mr-1" />
                  Aménagement
                </Badge>
              )}
              {medicalVisit.surveillanceParticuliere && (
                <Badge className="bg-amber-600 text-white text-sm px-3 py-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Surveillance particulière
                </Badge>
              )}
            </div>
            <p className="text-gray-600">{medicalVisit.libellePoste}</p>
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
                  Êtes-vous sûr de vouloir supprimer le suivi médical de {medicalVisit.prenom} {medicalVisit.nom} ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete();
                    toast.success('Suivi médical supprimé avec succès');
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

      {/* Section 1: Informations Personnelles */}
      <Card className="border-2 border-pink-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="flex items-center gap-2 text-pink-900">
            <User className="h-6 w-6" />
            Informations Personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sexe</p>
              <p className="text-base font-semibold text-gray-900">
                {medicalVisit.sexe === 'M' ? 'Homme' : 'Femme'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Nom</p>
              <p className="text-base font-semibold text-gray-900">{medicalVisit.nom}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Prénom</p>
              <p className="text-base font-semibold text-gray-900">{medicalVisit.prenom}</p>
            </div>

            {medicalVisit.nombreEnfants !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Nombre d'enfants</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-pink-600" />
                  <p className="text-base font-semibold text-gray-900">
                    {medicalVisit.nombreEnfants} enfant{medicalVisit.nombreEnfants > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Informations Administratives */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Briefcase className="h-6 w-6" />
            Informations Administratives et Poste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Département</p>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <p className="text-base font-semibold text-gray-900">{medicalVisit.departement}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Structure détaillée</p>
              <p className="text-base font-semibold text-gray-900">{medicalVisit.structureDetaillee}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-500 mb-1">Grade (Libellé NNE)</p>
            <p className="text-base font-semibold text-gray-900">{medicalVisit.gradeNNE}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Libellé de poste</p>
              <p className="text-base font-semibold text-gray-900">{medicalVisit.libellePoste}</p>
            </div>

            {medicalVisit.echelon && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Échelon</p>
                <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300">
                  {medicalVisit.echelon}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {medicalVisit.inm && (
              <div>
                <p className="text-sm text-gray-500 mb-1">INM</p>
                <p className="text-base font-semibold text-gray-900">{medicalVisit.inm}</p>
                <p className="text-xs text-gray-500 mt-0.5">Indice de rémunération</p>
              </div>
            )}

            {medicalVisit.nombreHeuresRemunerees !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Heures rémunérées</p>
                <p className="text-base font-semibold text-gray-900">{medicalVisit.nombreHeuresRemunerees} h/an</p>
              </div>
            )}

            {medicalVisit.etpe !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-1">ETPE</p>
                <p className="text-base font-semibold text-gray-900">{medicalVisit.etpe.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Équivalent Temps Plein</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Visites médicales */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Stethoscope className="h-6 w-6" />
            Visites médicales et surveillance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {medicalVisit.derniereVisiteMedicale && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Dernière visite médicale</p>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(medicalVisit.derniereVisiteMedicale).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {medicalVisit.prochaineVisiteMedicale && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Prochaine visite médicale</p>
                <div className={`p-3 rounded-lg border-2 ${
                  currentStatus === 'urgent' ? 'bg-red-50 border-red-300' :
                  currentStatus === 'en_retard' ? 'bg-orange-50 border-orange-300' :
                  currentStatus === 'a_planifier' ? 'bg-blue-50 border-blue-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-5 w-5 ${
                      currentStatus === 'urgent' ? 'text-red-600' :
                      currentStatus === 'en_retard' ? 'text-orange-600' :
                      currentStatus === 'a_planifier' ? 'text-blue-600' :
                      'text-green-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(medicalVisit.prochaineVisiteMedicale).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      {nextVisitInfo && (
                        <p className={`text-sm font-semibold mt-0.5 ${nextVisitInfo.color}`}>
                          {nextVisitInfo.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {medicalVisit.surveillanceMedicaleAnnee !== undefined && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 mb-2">Périodicité de la surveillance médicale</p>
                <Badge variant="outline" className="bg-green-50 text-green-900 border-green-300 text-base px-4 py-2">
                  {medicalVisit.surveillanceMedicaleAnnee === 0.5 
                    ? 'Semestrielle (6 mois)' 
                    : medicalVisit.surveillanceMedicaleAnnee === 1 
                    ? 'Annuelle (1 an)' 
                    : `Tous les ${medicalVisit.surveillanceMedicaleAnnee} ans`
                  }
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Aménagements et Surveillance Particulière */}
      {(medicalVisit.amenagementPoste || medicalVisit.surveillanceParticuliere) && (
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Shield className="h-6 w-6" />
              Aménagements et Surveillance Particulière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {medicalVisit.amenagementPoste && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Aménagement de poste</p>
                <div className={`p-4 rounded-lg border-2 ${
                  medicalVisit.amenagementPoste === 'Aucun' 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-purple-50 border-purple-300'
                }`}>
                  <p className="text-base text-gray-900 whitespace-pre-line">
                    {medicalVisit.amenagementPoste}
                  </p>
                </div>
              </div>
            )}

            {medicalVisit.surveillanceParticuliere && (
              <>
                {medicalVisit.amenagementPoste && <Separator />}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Surveillance particulière</p>
                  <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <p className="text-base text-gray-900 whitespace-pre-line flex-1">
                        {medicalVisit.surveillanceParticuliere}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 5: Risques d'exposition */}
      {medicalVisit.risquesExposition && medicalVisit.risquesExposition.length > 0 && (
        <Card className="border-2 border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Target className="h-6 w-6" />
              Risques d'exposition
            </CardTitle>
            <CardDescription className="text-red-700">
              {medicalVisit.risquesExposition.length} risque{medicalVisit.risquesExposition.length > 1 ? 's' : ''} identifié{medicalVisit.risquesExposition.length > 1 ? 's' : ''} pour ce poste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalVisit.risquesExposition.map((riskId) => {
                const risk = risks.find(r => r.id === riskId);
                if (!risk) return null;
                
                return (
                  <div key={risk.id} className="p-4 bg-white border-2 border-red-200 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shrink-0">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">
                          {risk.numeroRisque}
                        </p>
                        <p className="text-sm text-gray-800 mb-2">
                          {risk.title}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-red-50 text-red-900 border-red-200 text-xs">
                            {risk.category}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200 text-xs">
                            {risk.unite}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-50 text-gray-900 border-gray-200 text-xs">
                            {risk.service}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
              <div className="flex items-start gap-2">
                <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Surveillance médicale adaptée</p>
                  <p className="text-sm text-amber-800 mt-1">
                    L'exposition à ces risques nécessite une surveillance médicale appropriée et des mesures de prévention spécifiques.
                  </p>
                </div>
              </div>
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
              <p className="font-semibold text-gray-900">{medicalVisit.createdBy}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Date de création</p>
              <p className="font-semibold text-gray-900">
                {new Date(medicalVisit.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Dernière modification</p>
              <p className="font-semibold text-gray-900">
                {new Date(medicalVisit.updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}