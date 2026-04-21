import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  FileSignature,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Mail,
  FileText,
  AlertTriangle,
  Download,
  Eye,
  History,
  Shield,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { ElectronicSignaturePage } from '@/app/components/ElectronicSignaturePage';

export type DUERPStatus = 'draft' | 'pending_signature' | 'signed' | 'expired';

export interface DUERPSignature {
  id: string;
  version: string;
  status: DUERPStatus;
  createdDate: string;
  sentForSignatureDate?: string;
  signedDate?: string;
  expirationDate?: string;
  
  // Informations sur le signataire
  signatoryEmail: string;
  signatoryName: string;
  signatoryTitle: string;
  
  // Modifications qui ont déclenché la mise à jour
  changesSummary: {
    newRisks: number;
    updatedRisks: number;
    newMeasures: number;
    updatedMeasures: number;
  };
  
  // Signature électronique
  signatureData?: {
    signedBy: string;
    signedAt: string;
    ipAddress: string;
    userAgent: string;
    certificateId?: string;
  };
  
  // Commentaires et observations
  comments?: string;
}

interface DUERPSignatureManagementProps {
  currentSignature?: DUERPSignature;
  signatureHistory: DUERPSignature[];
  directorEmail: string;
  directorName: string;
  onSendForSignature: (comments?: string) => void;
  onViewDocument: (signatureId: string) => void;
  onDownloadDocument: (signatureId: string) => void;
}

export function DUERPSignatureManagement({
  currentSignature,
  signatureHistory,
  directorEmail,
  directorName,
  onSendForSignature,
  onViewDocument,
  onDownloadDocument
}: DUERPSignatureManagementProps) {
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [comments, setComments] = useState('');

  const handleSendForSignature = () => {
    if (!directorEmail) {
      toast.error('Veuillez configurer l\'email du directeur dans les paramètres');
      return;
    }
    
    onSendForSignature(comments);
    setSendDialogOpen(false);
    setComments('');
    
    toast.success(`Document envoyé pour signature à ${directorEmail}`);
  };

  const getStatusBadge = (status: DUERPStatus) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            <FileText className="h-3 w-3 mr-1" />
            Brouillon
          </Badge>
        );
      case 'pending_signature':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente de signature
          </Badge>
        );
      case 'signed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Signé
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Expiré
          </Badge>
        );
    }
  };

  const getStatusColor = (status: DUERPStatus) => {
    switch (status) {
      case 'draft': return 'from-gray-500 to-slate-500';
      case 'pending_signature': return 'from-amber-500 to-orange-500';
      case 'signed': return 'from-green-500 to-emerald-500';
      case 'expired': return 'from-red-500 to-rose-500';
    }
  };

  const canSendForSignature = !currentSignature || currentSignature.status === 'draft' || currentSignature.status === 'expired';

  return (
    <div className="space-y-6 p-3 sm:p-6">
      {/* Header avec statut actuel */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${currentSignature ? getStatusColor(currentSignature.status) : 'from-blue-500 to-cyan-500'} flex items-center justify-center shadow-lg`}>
          <FileSignature className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Signature du DUERP</h2>
          <p className="text-gray-600">Gestion de la validation et signature électronique</p>
        </div>
        {currentSignature && <div className="w-full sm:w-auto">{getStatusBadge(currentSignature.status)}</div>}
      </div>

      {/* Document actuel */}
      {currentSignature && (
        <Card className="border-0 shadow-xl">
          <CardHeader className={`bg-gradient-to-r ${currentSignature.status === 'signed' ? 'from-green-50 to-emerald-50' : currentSignature.status === 'pending_signature' ? 'from-amber-50 to-orange-50' : 'from-gray-50 to-slate-50'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  DUERP Version {currentSignature.version}
                </CardTitle>
                <CardDescription>
                  Créé le {new Date(currentSignature.createdDate).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </CardDescription>
              </div>
              {getStatusBadge(currentSignature.status)}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Informations sur le signataire */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{currentSignature.signatoryName}</p>
                  <p className="text-sm text-gray-600">{currentSignature.signatoryTitle}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {currentSignature.signatoryEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Résumé des modifications */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Modifications depuis la dernière version
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-2xl font-bold text-red-600">{currentSignature.changesSummary.newRisks}</p>
                  <p className="text-xs text-gray-600">Nouveaux risques</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">{currentSignature.changesSummary.updatedRisks}</p>
                  <p className="text-xs text-gray-600">Risques modifiés</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{currentSignature.changesSummary.newMeasures}</p>
                  <p className="text-xs text-gray-600">Nouvelles mesures</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{currentSignature.changesSummary.updatedMeasures}</p>
                  <p className="text-xs text-gray-600">Mesures modifiées</p>
                </div>
              </div>
            </div>

            {/* Dates importantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSignature.sentForSignatureDate && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-600">Envoyé pour signature</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(currentSignature.sentForSignatureDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              
              {currentSignature.signedDate && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Signé le</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(currentSignature.signedDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              
              {currentSignature.expirationDate && currentSignature.status !== 'signed' && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-xs text-gray-600">Date d'expiration</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(currentSignature.expirationDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Informations de signature (si signé) */}
            {currentSignature.signatureData && (
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-green-900">Signature électronique validée</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Signé par :</strong> {currentSignature.signatureData.signedBy}</p>
                      <p><strong>Date et heure :</strong> {new Date(currentSignature.signatureData.signedAt).toLocaleString('fr-FR')}</p>
                      <p><strong>Adresse IP :</strong> {currentSignature.signatureData.ipAddress}</p>
                      {currentSignature.signatureData.certificateId && (
                        <p><strong>ID Certificat :</strong> {currentSignature.signatureData.certificateId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Commentaires */}
            {currentSignature.comments && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Commentaires :</p>
                <p className="text-sm text-gray-700">{currentSignature.comments}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => onViewDocument(currentSignature.id)}
                className="w-full sm:w-auto border-blue-300 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualiser le document
              </Button>
              <Button
                variant="outline"
                onClick={() => onDownloadDocument(currentSignature.id)}
                className="w-full sm:w-auto border-green-300 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le PDF
              </Button>
              {canSendForSignature && (
                <Button
                  onClick={() => setSendDialogOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer pour signature
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Si aucun document actuel */}
      {!currentSignature && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardContent className="pt-6 pb-6 text-center">
            <FileSignature className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun DUERP en cours</h3>
            <p className="text-gray-600 mb-4">
              Créez un nouveau DUERP en ajoutant des risques et des mesures de prévention
            </p>
            {directorEmail && (
              <Button
                onClick={() => setSendDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Créer et envoyer pour signature
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historique des signatures */}
      {signatureHistory.length > 0 && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              Historique des signatures
            </CardTitle>
            <CardDescription>
              Toutes les versions précédentes du DUERP
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
                {signatureHistory.map((signature, index) => (
                  <div
                    key={signature.id}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                              Version {signature.version}
                            </Badge>
                            {getStatusBadge(signature.status)}
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            Créé le {new Date(signature.createdDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {signature.signedDate && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Signé le {new Date(signature.signedDate).toLocaleDateString('fr-FR')} par {signature.signatoryName}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => onViewDocument(signature.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => onDownloadDocument(signature.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'envoi pour signature */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-600" />
              Envoyer le DUERP pour signature
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le document sera envoyé par email à <strong>{directorName}</strong> ({directorEmail}) pour signature électronique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Le directeur recevra :</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                <li>• Un email avec un lien sécurisé de signature</li>
                <li>• Le document DUERP complet en PDF</li>
                <li>• Un résumé des modifications depuis la dernière version</li>
                <li>• Une date limite de signature (30 jours)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">
                Commentaires ou observations (optionnel)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ajoutez des commentaires pour le signataire..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Important :</strong> Une fois envoyé, vous recevrez une notification quand le document sera signé ou si la demande expire.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendForSignature}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer pour signature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}