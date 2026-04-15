import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { FishingZone, FishingAuthorization, CaptureRecord } from '../FishermanView';

interface CaptureDeclarationProps {
  zone: FishingZone;
  currentUserName: string;
  authorizations: FishingAuthorization[];
  onSave: (capture: CaptureRecord) => void;
  onBack: () => void;
}

export function CaptureDeclaration({ zone, onBack }: CaptureDeclarationProps) {
  return (
    <div className="p-6">
      <Button onClick={onBack} variant="ghost">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      <h1 className="text-2xl font-bold mt-4">Déclaration de capture</h1>
      <p className="text-gray-600">Fonctionnalité en cours de développement...</p>
    </div>
  );
}
