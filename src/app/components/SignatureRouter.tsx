import React, { useState, useEffect } from 'react';
import { ElectronicSignaturePage } from '@/app/components/ElectronicSignaturePage';
import { Card, CardContent } from '@/app/components/ui/card';
import { CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface SignatureRouterProps {
  onSignatureComplete?: () => void;
  onSignatureRejected?: () => void;
}

export function SignatureRouter({ onSignatureComplete, onSignatureRejected }: SignatureRouterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Vérifier si on a un token de signature dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const signatureToken = urlParams.get('signature');
    
    if (signatureToken) {
      console.log('Token de signature détecté:', signatureToken);
      // On pourrait valider le token ici
    }
  }, []);

  const handleSign = async (signature: { fullName: string; title: string; acceptance: boolean }) => {
    setIsProcessing(true);
    
    try {
      // Simuler l'envoi au serveur
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Signature enregistrée:', {
        ...signature,
        signedAt: new Date().toISOString(),
        ipAddress: '192.168.1.100', // Serait récupéré côté serveur
        userAgent: navigator.userAgent
      });
      
      setIsComplete(true);
      
      if (onSignatureComplete) {
        onSignatureComplete();
      }
      
      // Notifier l'admin (via email et notification in-app)
      console.log('Notification envoyée à l\'administrateur');
      
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      toast.error('Une erreur est survenue lors de la signature');
      setIsProcessing(false);
    }
  };

  const handleReject = (reason: string) => {
    console.log('Document refusé:', reason);
    
    if (onSignatureRejected) {
      onSignatureRejected();
    }
    
    toast.info('Refus enregistré. L\'administrateur a été notifié.');
  };

  const handleDownload = () => {
    toast.success('Téléchargement du document DUERP en cours...');
    console.log('Téléchargement du PDF');
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Document signé avec succès !</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Votre signature électronique a été enregistrée et l'administrateur a été notifié.
            </p>
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 text-sm text-gray-700">
              <p className="font-semibold text-green-900 mb-2">Détails de la signature :</p>
              <p>Date et heure : {new Date().toLocaleString('fr-FR')}</p>
              <p>Un email de confirmation vous a été envoyé.</p>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Vous pouvez maintenant fermer cette page en toute sécurité.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader className="h-16 w-16 text-purple-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Traitement en cours...</h2>
            <p className="text-gray-600">
              Votre signature est en cours d'enregistrement
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afficher la page de signature avec des données de démonstration
  return (
    <ElectronicSignaturePage
      documentId="duerp-2025-v1"
      documentVersion="2025.1"
      documentTitle="Document Unique d'Évaluation des Risques Professionnels (DUERP)"
      organizationName="Direction Interrégionale de la Mer Méditerranée"
      signatoryName="Jean-Marc DUBOIS"
      signatoryEmail="jean-marc.dubois@developpement-durable.gouv.fr"
      signatoryTitle="Directeur Interrégional"
      createdDate="2025-01-15T10:00:00Z"
      expirationDate="2025-02-14T23:59:59Z"
      changesSummary={{
        newRisks: 12,
        updatedRisks: 8,
        newMeasures: 15,
        updatedMeasures: 6
      }}
      onSign={handleSign}
      onReject={handleReject}
      onDownloadDocument={handleDownload}
    />
  );
}
