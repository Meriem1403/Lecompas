import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  FileSignature,
  CheckCircle,
  Shield,
  AlertTriangle,
  Download,
  Eye,
  Calendar,
  Building2,
  User,
  Mail,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface ElectronicSignaturePageProps {
  documentId: string;
  documentVersion: string;
  documentTitle: string;
  organizationName: string;
  signatoryName: string;
  signatoryEmail: string;
  signatoryTitle: string;
  createdDate: string;
  expirationDate: string;
  changesSummary: {
    newRisks: number;
    updatedRisks: number;
    newMeasures: number;
    updatedMeasures: number;
  };
  onSign: (signature: { fullName: string; title: string; acceptance: boolean }) => void;
  onReject: (reason: string) => void;
  onDownloadDocument: () => void;
}

export function ElectronicSignaturePage({
  documentId,
  documentVersion,
  documentTitle,
  organizationName,
  signatoryName,
  signatoryEmail,
  signatoryTitle,
  createdDate,
  expirationDate,
  changesSummary,
  onSign,
  onReject,
  onDownloadDocument
}: ElectronicSignaturePageProps) {
  const [fullName, setFullName] = useState(signatoryName);
  const [title, setTitle] = useState(signatoryTitle);
  const [hasReadDocument, setHasReadDocument] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isExpired = new Date(expirationDate) < new Date();
  const daysUntilExpiration = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const canSign = fullName.trim() !== '' && 
                  title.trim() !== '' && 
                  hasReadDocument && 
                  acceptsTerms && 
                  !isExpired &&
                  !isSigning;

  const handleSign = async () => {
    if (!canSign) return;

    setIsSigning(true);
    
    try {
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSign({
        fullName,
        title,
        acceptance: true
      });
      
      toast.success('Document signé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la signature');
      setIsSigning(false);
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer une raison pour le refus');
      return;
    }
    
    onReject(rejectReason);
    toast.info('Document refusé');
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Lien expiré</h2>
              <p className="text-gray-600 mb-6">
                Ce lien de signature a expiré le {new Date(expirationDate).toLocaleDateString('fr-FR')}.
              </p>
              <p className="text-sm text-gray-500">
                Veuillez contacter l'administrateur pour recevoir un nouveau lien de signature.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showRejectDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Refuser la signature
              </CardTitle>
              <CardDescription>
                Veuillez indiquer la raison du refus
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejectReason">Motif du refus *</Label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous refusez de signer ce document..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  Confirmer le refus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center shadow-xl mb-4">
            <FileSignature className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Signature Électronique</h1>
          <p className="text-gray-600">{documentTitle}</p>
        </div>

        {/* Avertissement d'expiration */}
        {daysUntilExpiration <= 7 && daysUntilExpiration > 0 && (
          <Card className="border-2 border-amber-300 bg-amber-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-900">
                  <strong>Attention :</strong> Ce lien expire dans {daysUntilExpiration} jour{daysUntilExpiration > 1 ? 's' : ''} 
                  ({new Date(expirationDate).toLocaleDateString('fr-FR')})
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations du document */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Informations du Document
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Organisation</p>
                  <p className="font-semibold text-gray-900">{organizationName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Version</p>
                  <p className="font-semibold text-gray-900">{documentVersion}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Date de création</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(createdDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Destinataire</p>
                  <p className="font-semibold text-gray-900">{signatoryName}</p>
                  <p className="text-xs text-gray-600">{signatoryEmail}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Modifications depuis la dernière version
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-2xl font-bold text-red-600">{changesSummary.newRisks}</p>
                  <p className="text-xs text-gray-600">Nouveaux risques</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <p className="text-2xl font-bold text-orange-600">{changesSummary.updatedRisks}</p>
                  <p className="text-xs text-gray-600">Risques modifiés</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{changesSummary.newMeasures}</p>
                  <p className="text-xs text-gray-600">Nouvelles mesures</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-2xl font-bold text-blue-600">{changesSummary.updatedMeasures}</p>
                  <p className="text-xs text-gray-600">Mesures modifiées</p>
                </div>
              </div>
            </div>

            <Button
              onClick={onDownloadDocument}
              variant="outline"
              className="w-full border-blue-300 hover:bg-blue-50"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le document complet (PDF)
            </Button>
          </CardContent>
        </Card>

        {/* Formulaire de signature */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-purple-600" />
              Formulaire de Signature
            </CardTitle>
            <CardDescription>
              Complétez les informations ci-dessous pour signer électroniquement
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Fonction *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Votre fonction"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                <Checkbox
                  id="readDocument"
                  checked={hasReadDocument}
                  onCheckedChange={(checked) => setHasReadDocument(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="readDocument" className="text-sm font-semibold text-gray-900 cursor-pointer">
                    J'ai lu et pris connaissance du document DUERP complet
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Téléchargez et lisez attentivement le document avant de signer
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptsTerms}
                  onCheckedChange={(checked) => setAcceptsTerms(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="acceptTerms" className="text-sm font-semibold text-gray-900 cursor-pointer">
                    J'accepte que cette signature électronique ait la même valeur juridique qu'une signature manuscrite
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Conformément à l'article 1367 du Code civil et au règlement eIDAS
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-green-900 mb-1">Sécurité de la signature</p>
                  <p>
                    Votre signature sera horodatée et enregistrée avec votre adresse IP, 
                    garantissant l'authenticité et la traçabilité de votre engagement.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 border-red-300 hover:bg-red-50"
                size="lg"
              >
                Refuser
              </Button>
              <Button
                onClick={handleSign}
                disabled={!canSign}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                size="lg"
              >
                {isSigning ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" />
                    Signature en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Signer le document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer légal */}
        <Card className="border-0 shadow-lg bg-gray-50">
          <CardContent className="pt-4 pb-4 text-center text-xs text-gray-600">
            <p>
              Ce système de signature électronique est conforme au règlement européen eIDAS (n° 910/2014)
              et à l'article 1367 du Code civil français. La signature électronique a la même valeur 
              juridique qu'une signature manuscrite.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
