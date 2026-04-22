import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  ArrowLeft,
  User,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface CerbereRequest {
  id: string;
  agentConcerne: string;
  demandeur: string;
  applications: string[];
  profils: string[];
  reglePortee: string;
  restrictions: string;
  soumiseLe: string;
  statut: 'en_attente_chef' | 'en_attente_admin' | 'validee' | 'refusee';
  valideePar?: string;
  dateValidation?: string;
  chefValidationPar?: string;
  chefValidationLe?: string;
}

interface CerbereRequestDetailProps {
  request: CerbereRequest;
  onBack: () => void;
  onValidate: () => void;
  onReject: () => void;
  onDownloadAttestation: () => void;
  userRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
}

export function CerbereRequestDetail({
  request,
  onBack,
  onValidate,
  onReject,
  onDownloadAttestation,
  userRole,
  currentUserName,
}: CerbereRequestDetailProps) {
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente_chef':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-base px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            En attente de validation du chef de service
          </Badge>
        );
      case 'en_attente_admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-base px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            En attente de validation administrateur
          </Badge>
        );
      case 'validee':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 text-base px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            Validée
          </Badge>
        );
      case 'refusee':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 text-base px-4 py-2">
            <XCircle className="h-4 w-4 mr-2" />
            Refusée
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-3 sm:p-6">
      {/* En-tête avec retour */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
        <div className="w-full sm:w-auto">{getStatusBadge(request.statut)}</div>
      </div>

      {/* Carte principale */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-0">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl break-words">Demande d'habilitation Cerbère</CardTitle>
              <CardDescription className="text-base mt-1">
                Référence: {request.id.toUpperCase()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Agent concerné</h4>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                    {request.agentConcerne.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <p className="text-lg font-medium text-gray-900 break-words">{request.agentConcerne}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Demandeur</h4>
                </div>
                <p className="text-lg text-gray-700 mt-2 break-words">{request.demandeur}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Date de soumission</h4>
                </div>
                <p className="text-lg text-gray-700 mt-2">
                  {new Date(request.soumiseLe).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {request.valideePar && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-semibold text-gray-900">Validation</h4>
                  </div>
                  <p className="text-gray-700 mt-2">
                    <strong>Par:</strong> {request.valideePar}
                  </p>
                  <p className="text-gray-700 mt-1">
                    <strong>Le:</strong>{' '}
                    {new Date(request.dateValidation!).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}

              {request.statut === 'validee' && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-900">
                    Cette demande a été validée par votre chef de service
                    {request.chefValidationPar ? ` (${request.chefValidationPar})` : ''} puis par
                    l'administrateur
                    {request.valideePar ? ` (${request.valideePar})` : ''}.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Applications et profils demandés */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-indigo-600" />
              Applications et profils demandés
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-3">Applications</h5>
                <div className="flex flex-wrap gap-2">
                  {request.applications.map((app, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-sm px-3 py-1 bg-white"
                    >
                      {app}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-3">Profils</h5>
                <div className="flex flex-wrap gap-2">
                  {request.profils.map((profil, idx) => (
                    <Badge
                      key={idx}
                      className="text-sm px-3 py-1 bg-blue-100 text-blue-800 border-blue-300"
                    >
                      {profil}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Règles et restrictions */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Règle de portée</h4>
              <p className="text-gray-700">{request.reglePortee}</p>
            </div>

            {request.restrictions && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Restrictions éventuelles
                    </h4>
                    <p className="text-gray-700">{request.restrictions}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {request.statut === 'en_attente_admin' && userRole === 'admin' && (
              <>
                <Button
                  onClick={onValidate}
                  className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider la demande
                </Button>
                <Button
                  onClick={onReject}
                  variant="outline"
                  className="w-full sm:flex-1 text-red-600 hover:bg-red-50 border-red-300"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Refuser la demande
                </Button>
              </>
            )}

            {request.statut === 'validee' && (
              <Button
                onClick={onDownloadAttestation}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger l'attestation PDF
              </Button>
            )}

            {request.statut === 'en_attente_chef' &&
              userRole === 'chef_service' &&
              request.agentConcerne !== currentUserName && (
                <>
                  <Button
                    onClick={onValidate}
                    className="w-full sm:flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider
                  </Button>
                  <Button
                    onClick={onReject}
                    variant="outline"
                    className="w-full sm:flex-1 text-red-600 hover:bg-red-50 border-red-300"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                </>
              )}

            {(request.statut === 'en_attente_chef' || request.statut === 'en_attente_admin') &&
              userRole !== 'admin' && (
              <div className="w-full p-4 rounded-lg bg-orange-50 border border-orange-200">
                <p className="text-center text-gray-700">
                  <Clock className="h-5 w-5 inline mr-2 text-orange-600" />
                  {request.statut === 'en_attente_chef'
                    ? "Demande en attente de validation du chef de service"
                    : "Demande en attente de validation par l'administrateur"}
                </p>
              </div>
            )}

            {request.statut === 'refusee' && (
              <div className="w-full p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-center text-gray-700">
                  <XCircle className="h-5 w-5 inline mr-2 text-red-600" />
                  Cette demande a été refusée
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
