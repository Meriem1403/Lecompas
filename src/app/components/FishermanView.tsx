import React, { useState } from 'react';
import { ZoneSelection } from './fisherman/ZoneSelection';
import { AuthorizationRequest } from './fisherman/AuthorizationRequest';
import { CaptureDeclaration } from './fisherman/CaptureDeclaration';
import { AccountManagement } from './fisherman/AccountManagement';
import { MyAuthorizations } from './fisherman/MyAuthorizations';
import { MyCaptureHistory } from './fisherman/MyCaptureHistory';

export type FishingZone = 
  | 'golfe_lion'
  | 'calanques'
  | 'bonifacio'
  | 'cap_corse'
  | 'cerbere_banyuls'
  | 'mediterranee';

export interface FishingAuthorization {
  id: string;
  userId: string;
  zone: FishingZone;
  status: 'pending' | 'approved' | 'rejected';
  
  // Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  address: string;
  zipCode: string;
  city: string;
  
  // Informations de pêche
  boatName?: string;
  boatRegistration?: string;
  estimatedTrips: number;
  hasPreviousDeclaration: boolean;
  previousDeclarationFile?: string;
  isNewFisher: boolean;
  
  // Consentement
  regulationAccepted: boolean;
  
  // Méta
  submittedDate: string;
  validatedDate?: string;
  validatedBy?: string;
  adminComment?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CaptureRecord {
  id: string;
  userId: string;
  authorizationId: string;
  zone: FishingZone;
  
  // Date et lieu
  captureDate: string;
  captureTime: string;
  location: string;
  
  // Captures
  isNoCatch: boolean; // Déclaration d'absence de capture
  captures: {
    id: string;
    species: string;
    quantity: number;
    size?: number; // cm
    weight?: number; // kg
    technique: string;
    photo?: string;
  }[];
  
  // Statut
  status: 'draft' | 'submitted' | 'validated';
  validatedBy?: string;
  validatedDate?: string;
  adminComment?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface FisherAccount {
  id: string;
  email: string;
  password: string;
  
  // Profil
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
  zipCode: string;
  city: string;
  phone?: string;
  
  // Préférences pêche
  role: 'fisher' | 'scientist' | 'manager';
  favoriteZone?: FishingZone;
  fishingType: string;
  federationMember: boolean;
  federationName?: string;
  
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'zone-selection' | 'authorization' | 'capture' | 'account' | 'my-authorizations' | 'my-captures';

interface FishermanViewProps {
  currentUserName: string;
}

export function FishermanView({ currentUserName }: FishermanViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('zone-selection');
  const [selectedZone, setSelectedZone] = useState<FishingZone | null>(null);
  const [authorizations, setAuthorizations] = useState<FishingAuthorization[]>([]);
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);

  const handleZoneSelect = (zone: FishingZone) => {
    setSelectedZone(zone);
    setViewMode('authorization');
  };

  const handleCreateAuthorization = (authorization: FishingAuthorization) => {
    setAuthorizations([...authorizations, authorization]);
  };

  const handleCreateCapture = (capture: CaptureRecord) => {
    setCaptures([...captures, capture]);
  };

  const handleUpdateCapture = (updatedCapture: CaptureRecord) => {
    setCaptures(captures.map(c => c.id === updatedCapture.id ? updatedCapture : c));
  };

  const handleDeleteCapture = (id: string) => {
    setCaptures(captures.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen">
      {viewMode === 'zone-selection' && (
        <ZoneSelection
          onZoneSelect={handleZoneSelect}
          onGoToAccount={() => setViewMode('account')}
          onGoToMyAuthorizations={() => setViewMode('my-authorizations')}
          onGoToMyCaptures={() => setViewMode('my-captures')}
        />
      )}

      {viewMode === 'authorization' && selectedZone && (
        <AuthorizationRequest
          zone={selectedZone}
          currentUserName={currentUserName}
          onSave={handleCreateAuthorization}
          onBack={() => setViewMode('zone-selection')}
          onGoToCapture={() => setViewMode('capture')}
        />
      )}

      {viewMode === 'capture' && selectedZone && (
        <CaptureDeclaration
          zone={selectedZone}
          currentUserName={currentUserName}
          authorizations={authorizations.filter(a => a.zone === selectedZone && a.status === 'approved')}
          onSave={handleCreateCapture}
          onBack={() => setViewMode('zone-selection')}
        />
      )}

      {viewMode === 'account' && (
        <AccountManagement
          currentUserName={currentUserName}
          onBack={() => setViewMode('zone-selection')}
        />
      )}

      {viewMode === 'my-authorizations' && (
        <MyAuthorizations
          authorizations={authorizations}
          onBack={() => setViewMode('zone-selection')}
        />
      )}

      {viewMode === 'my-captures' && (
        <MyCaptureHistory
          captures={captures}
          onEdit={(capture) => {
            // Navigate to edit
          }}
          onDelete={handleDeleteCapture}
          onBack={() => setViewMode('zone-selection')}
        />
      )}
    </div>
  );
}
