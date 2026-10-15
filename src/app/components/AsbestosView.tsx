import React, { useState } from 'react';
import { APP_DATA_KEYS } from '@/app/services/appDataApi';
import { useAppDataDocumentStore } from '@/app/hooks/useAppDataDocumentStore';
import { AsbestosListView } from './asbestos/AsbestosListView';
import { AsbestosInterventionForm } from './asbestos/AsbestosInterventionForm';
import { AsbestosInterventionDetail } from './asbestos/AsbestosInterventionDetail';

export interface AsbestosIntervention {
  id: string;
  reference: string;
  
  // Identification
  zoneMateriau: string;
  localisationPrecise: string;
  
  // Diagnostic
  datePremiereReperage: string;
  typeAnalyseInitiale: 'Type A' | 'Type B' | 'Type C';
  resultatAnalyse: string;
  
  // Suivi
  dernierControle?: string;
  scoreActuel: 1 | 2 | 3 | null;
  evolutionScore?: string;
  
  // Actions
  actionsRealisees?: string;
  retraitRealise: boolean;
  dateRetrait?: string;
  entrepriseRetrait?: string;
  
  // Gestion
  actionAPrevoir?: string;
  echeanceAction?: string;
  priorite?: 'Faible' | 'Moyenne' | 'Élevée' | 'Urgente';
  
  // Statut
  statut: 'non_amiante' | 'surveiller' | 'action_requise' | 'retrait_effectue';
  
  // Documents
  fichierDiagnostic?: string;
  fichierPhotos?: string[];
  
  // Métadonnées
  batiment?: string;
  etage?: string;
  responsable: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Données de démonstration
const initialInterventions: AsbestosIntervention[] = [
  {
    id: '1',
    reference: 'AMI-2024-001',
    zoneMateriau: 'Faux-plafond - Dalles fibrociment',
    localisationPrecise: 'Bureau 201, aile Est, 2ème étage',
    batiment: 'Bâtiment administratif principal',
    etage: '2ème étage',
    datePremiereReperage: '2022-03-15',
    typeAnalyseInitiale: 'Type B',
    resultatAnalyse: 'Présence d\'amiante chrysotile confirmée (15% masse)',
    dernierControle: '2024-11-20',
    scoreActuel: 2,
    evolutionScore: 'Score stable depuis 2022 (passage de 1 à 2 en 2023 suite à dégradation partielle)',
    actionsRealisees: 'Confinement temporaire réalisé le 15/04/2023. Signalétique apposée. Formation du personnel en contact.',
    retraitRealise: false,
    actionAPrevoir: 'Retrait complet prévu lors de la rénovation du bâtiment programmée en 2025',
    echeanceAction: '2025-06-30',
    priorite: 'Moyenne',
    statut: 'surveiller',
    fichierDiagnostic: 'diagnostic_bureau_201_2022.pdf',
    responsable: 'Marie Dubois',
    createdBy: 'Pierre Leroux',
    createdAt: '2022-03-15T10:00:00Z',
    updatedAt: '2024-11-20T14:30:00Z',
  },
  {
    id: '2',
    reference: 'AMI-2024-002',
    zoneMateriau: 'Canalisation - Calorifugeage tuyauterie',
    localisationPrecise: 'Sous-sol, chaufferie principale, circuit eau chaude',
    batiment: 'Bâtiment technique',
    etage: 'Sous-sol',
    datePremiereReperage: '2021-09-10',
    typeAnalyseInitiale: 'Type B',
    resultatAnalyse: 'Amiante chrysotile détectée dans le calorifugeage (25% masse)',
    dernierControle: '2024-09-10',
    scoreActuel: 3,
    evolutionScore: 'Dégradation constatée - passage du score 2 au score 3 en septembre 2024',
    actionsRealisees: 'Zone interdite d\'accès. Surveillance trimestrielle mise en place.',
    retraitRealise: true,
    dateRetrait: '2024-12-05',
    entrepriseRetrait: 'Désamiantage Pro - Certification SS4',
    actionAPrevoir: 'Contrôle post-retrait et restitution de zone',
    echeanceAction: '2024-12-20',
    priorite: 'Élevée',
    statut: 'retrait_effectue',
    fichierDiagnostic: 'diagnostic_chaufferie_2021.pdf',
    responsable: 'Sophie Bernard',
    createdBy: 'Marie Dubois',
    createdAt: '2021-09-10T09:00:00Z',
    updatedAt: '2024-12-05T16:00:00Z',
  },
  {
    id: '3',
    reference: 'AMI-2024-003',
    zoneMateriau: 'Revêtement de sol - Dalles vinyle-amiante',
    localisationPrecise: 'Couloir central, rez-de-chaussée, aile Nord',
    batiment: 'Bâtiment administratif principal',
    etage: 'Rez-de-chaussée',
    datePremiereReperage: '2023-05-22',
    typeAnalyseInitiale: 'Type A',
    resultatAnalyse: 'Absence d\'amiante confirmée par analyse en laboratoire',
    dernierControle: '2023-05-22',
    scoreActuel: null,
    actionsRealisees: 'Aucune - Matériau non amianté',
    retraitRealise: false,
    actionAPrevoir: 'Aucune action nécessaire',
    statut: 'non_amiante',
    fichierDiagnostic: 'diagnostic_couloir_nord_2023.pdf',
    responsable: 'Jean Martin',
    createdBy: 'Sophie Bernard',
    createdAt: '2023-05-22T11:00:00Z',
    updatedAt: '2023-05-22T11:00:00Z',
  },
  {
    id: '4',
    reference: 'AMI-2024-004',
    zoneMateriau: 'Toiture - Plaques fibrociment ondulées',
    localisationPrecise: 'Toiture atelier mécanique, zone sud',
    batiment: 'Ateliers techniques',
    etage: 'Toiture',
    datePremiereReperage: '2020-11-08',
    typeAnalyseInitiale: 'Type B',
    resultatAnalyse: 'Présence d\'amiante chrysotile et crocidolite (amiante bleu) - 35% masse',
    dernierControle: '2024-10-15',
    scoreActuel: 3,
    evolutionScore: 'Score 3 stable depuis le 1er repérage - matériau très dégradé',
    actionsRealisees: 'Bâchage temporaire réalisé en 2021. Accès restreint. Surveillance mensuelle.',
    retraitRealise: false,
    actionAPrevoir: 'RETRAIT URGENT PROGRAMMÉ - Désamiantage SS4 planifié pour février 2025',
    echeanceAction: '2025-02-28',
    priorite: 'Urgente',
    statut: 'action_requise',
    fichierDiagnostic: 'diagnostic_toiture_atelier_2020.pdf',
    responsable: 'Pierre Leroux',
    createdBy: 'Marie Dubois',
    createdAt: '2020-11-08T14:00:00Z',
    updatedAt: '2024-10-15T09:30:00Z',
  },
  {
    id: '5',
    reference: 'AMI-2024-005',
    zoneMateriau: 'Joint / Bourrage - Portes coupe-feu',
    localisationPrecise: 'Ensemble des portes coupe-feu du bâtiment A (12 portes)',
    batiment: 'Bâtiment A - Résidence',
    etage: 'Tous étages',
    datePremiereReperage: '2023-01-12',
    typeAnalyseInitiale: 'Type C',
    resultatAnalyse: 'Traces d\'amiante dans joints (< 5% masse) - Amiante non friable',
    dernierControle: '2024-01-15',
    scoreActuel: 1,
    evolutionScore: 'Score 1 stable - matériau en bon état',
    actionsRealisees: 'Étiquetage réglementaire apposé. Fiche de données de sécurité disponible.',
    retraitRealise: false,
    actionAPrevoir: 'Surveillance annuelle. Retrait lors du remplacement des portes (programmé 2027)',
    echeanceAction: '2025-01-15',
    priorite: 'Faible',
    statut: 'surveiller',
    fichierDiagnostic: 'diagnostic_portes_CF_batA_2023.pdf',
    responsable: 'Jean Martin',
    createdBy: 'Sophie Bernard',
    createdAt: '2023-01-12T10:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface AsbestosViewProps {
  accessToken?: string;
}

export function AsbestosView({ accessToken = '' }: AsbestosViewProps) {
  const [interventions, setInterventions] = useAppDataDocumentStore<AsbestosIntervention[]>(
    APP_DATA_KEYS.asbestosInterventions,
    accessToken,
    { seed: initialInterventions },
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIntervention, setSelectedIntervention] = useState<AsbestosIntervention | null>(null);

  const handleCreateIntervention = (intervention: AsbestosIntervention) => {
    setInterventions([...interventions, intervention]);
    setViewMode('list');
  };

  const handleUpdateIntervention = (updatedIntervention: AsbestosIntervention) => {
    setInterventions(interventions.map(i => i.id === updatedIntervention.id ? updatedIntervention : i));
    setViewMode('list');
  };

  const handleDeleteIntervention = (id: string) => {
    setInterventions(interventions.filter(i => i.id !== id));
    setViewMode('list');
  };

  const handleViewDetail = (intervention: AsbestosIntervention) => {
    setSelectedIntervention(intervention);
    setViewMode('detail');
  };

  const handleEditIntervention = (intervention: AsbestosIntervention) => {
    setSelectedIntervention(intervention);
    setViewMode('edit');
  };

  return (
    <>
      {viewMode === 'list' && (
        <AsbestosListView
          interventions={interventions}
          onCreateNew={() => setViewMode('create')}
          onViewDetail={handleViewDetail}
          onEdit={handleEditIntervention}
          onDelete={handleDeleteIntervention}
        />
      )}

      {viewMode === 'create' && (
        <AsbestosInterventionForm
          onSave={handleCreateIntervention}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedIntervention && (
        <AsbestosInterventionForm
          intervention={selectedIntervention}
          onSave={handleUpdateIntervention}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedIntervention && (
        <AsbestosInterventionDetail
          intervention={selectedIntervention}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={() => {
            handleDeleteIntervention(selectedIntervention.id);
          }}
        />
      )}
    </>
  );
}
