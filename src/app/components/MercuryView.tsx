import React, { useState } from 'react';
import { MercuryListView } from './mercury/MercuryListView';
import { MercuryCampaignForm } from './mercury/MercuryCampaignForm';
import { MercuryCampaignDetail } from './mercury/MercuryCampaignDetail';

export interface Prelevement {
  id: string;
  type: string;
  quantite: number;
  unite: string;
  description?: string;
}

export interface MercuryCampaign {
  id: string;
  reference: string;
  titre: string;
  statut: 'planifiee' | 'en_cours' | 'rapport_recu' | 'synthese_produite';
  
  // Phase 1 : Planification
  programme: string;
  zones: string[];
  datePrevue: string;
  dateFinPrevue?: string;
  typesPrelevements: Prelevement[];
  prestataire: string;
  contactPrestataire: string;
  budgetEstime?: number;
  objectifs: string;
  
  // Phase 2 : Suivi Terrain
  dateReelle?: string;
  dateFinReelle?: string;
  prelevementsRealises?: Prelevement[];
  ecartsConstates?: string;
  difficultes?: string;
  photos?: string[];
  
  // Phase 3 : Rapport
  rapportRecu?: boolean;
  dateReceptionRapport?: string;
  fichierRapport?: string;
  verificationAdministrative?: boolean;
  verificationCoherence?: boolean;
  notesVerification?: string;
  
  // Phase 4 : Synthèse
  syntheseProduite?: boolean;
  dateSynthese?: string;
  contexteIntervention?: string;
  lieuEtDate?: string;
  prelevementsEffectues?: string;
  resultatsMarquants?: string;
  pointsAttention?: string;
  anomalies?: string;
  conclusion?: string;
  suitesADonner?: string;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Données de démonstration
const initialCampaigns: MercuryCampaign[] = [
  {
    id: '1',
    reference: 'MERC-2025-001',
    titre: 'Contrôle mercure - Port de Marseille',
    statut: 'synthese_produite',
    programme: 'Surveillance qualité eau portuaire 2025',
    zones: ['Bassin Est', 'Quai du Commerce', 'Zone industrielle'],
    datePrevue: '2025-01-15',
    dateFinPrevue: '2025-01-17',
    typesPrelevements: [
      { id: '1', type: 'Eau de surface', quantite: 12, unite: 'échantillons' },
      { id: '2', type: 'Sédiments', quantite: 8, unite: 'carottes' },
    ],
    prestataire: 'Laboratoire Méditerranée Analyse',
    contactPrestataire: 'Dr. Sophie Martin - 04 91 XX XX XX',
    budgetEstime: 15000,
    objectifs: 'Évaluer la concentration en mercure suite aux travaux de dragage et vérifier la conformité aux normes environnementales.',
    dateReelle: '2025-01-16',
    dateFinReelle: '2025-01-17',
    prelevementsRealises: [
      { id: '1', type: 'Eau de surface', quantite: 12, unite: 'échantillons' },
      { id: '2', type: 'Sédiments', quantite: 6, unite: 'carottes', description: '2 carottes non prélevées (zone inaccessible)' },
    ],
    ecartsConstates: 'Décalage d\'un jour dû aux conditions météo. Zone industrielle partiellement inaccessible.',
    difficultes: 'Accès difficile au quai sud en raison de travaux non signalés.',
    rapportRecu: true,
    dateReceptionRapport: '2025-02-01',
    fichierRapport: 'rapport_mercure_marseille_2025.pdf',
    verificationAdministrative: true,
    verificationCoherence: true,
    notesVerification: 'Rapport complet et conforme. Toutes les analyses demandées présentes.',
    syntheseProduite: true,
    dateSynthese: '2025-02-03',
    contexteIntervention: 'Campagne de surveillance réglementaire suite aux travaux de dragage du port de Marseille réalisés en décembre 2024.',
    lieuEtDate: 'Port de Marseille (Bassin Est et Quai du Commerce) - 16-17 janvier 2025',
    prelevementsEffectues: '12 échantillons d\'eau de surface et 6 carottes de sédiments prélevés sur 3 zones',
    resultatsMarquants: 'Concentration moyenne en mercure : 0.08 µg/L (eau) et 0.12 mg/kg (sédiments). Valeurs conformes aux normes en vigueur.',
    pointsAttention: 'Point de mesure S3 (zone industrielle) présente une valeur légèrement élevée (0.18 mg/kg) sans dépassement de seuil.',
    anomalies: 'Aucune anomalie significative détectée.',
    conclusion: 'La qualité de l\'eau et des sédiments est satisfaisante. Pas d\'impact mesurable des travaux de dragage sur la contamination mercurielle.',
    suitesADonner: 'Poursuivre la surveillance semestrielle. Programmer un nouveau contrôle en juillet 2025. Surveiller particulièrement le point S3.',
    createdBy: 'Marie Dubois',
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2025-02-03T14:30:00Z',
  },
  {
    id: '2',
    reference: 'MERC-2025-002',
    titre: 'Étude mercure - Étang de Berre',
    statut: 'rapport_recu',
    programme: 'Suivi écologique Étang de Berre',
    zones: ['Nord Étang', 'Embouchure Touloubre', 'Zone Centrale'],
    datePrevue: '2025-02-10',
    dateFinPrevue: '2025-02-12',
    typesPrelevements: [
      { id: '1', type: 'Eau', quantite: 15, unite: 'échantillons' },
      { id: '2', type: 'Biote (poissons)', quantite: 20, unite: 'spécimens' },
    ],
    prestataire: 'Institut Océanographique Paul Ricard',
    contactPrestataire: 'Prof. Jean Leclerc - 04 42 XX XX XX',
    budgetEstime: 22000,
    objectifs: 'Mesurer la bioaccumulation du mercure dans la chaîne alimentaire de l\'étang de Berre.',
    dateReelle: '2025-02-10',
    dateFinReelle: '2025-02-12',
    prelevementsRealises: [
      { id: '1', type: 'Eau', quantite: 15, unite: 'échantillons' },
      { id: '2', type: 'Biote (poissons)', quantite: 22, unite: 'spécimens' },
    ],
    rapportRecu: true,
    dateReceptionRapport: '2025-02-28',
    fichierRapport: 'rapport_mercure_berre_2025.pdf',
    verificationAdministrative: true,
    verificationCoherence: false,
    notesVerification: 'Incohérence détectée : échantillon B12 manquant dans le tableau récapitulatif. Demande de clarification envoyée au prestataire.',
    createdBy: 'Pierre Leroux',
    createdAt: '2024-12-15T14:00:00Z',
    updatedAt: '2025-02-28T16:45:00Z',
  },
  {
    id: '3',
    reference: 'MERC-2025-003',
    titre: 'Campagne Golfe de Fos',
    statut: 'en_cours',
    programme: 'Surveillance industrielle 2025',
    zones: ['Zone portuaire Fos', 'Plage Napoléon'],
    datePrevue: '2025-03-05',
    dateFinPrevue: '2025-03-07',
    typesPrelevements: [
      { id: '1', type: 'Eau de mer', quantite: 20, unite: 'échantillons' },
      { id: '2', type: 'Sédiments', quantite: 10, unite: 'carottes' },
    ],
    prestataire: 'Eurofins Environnement',
    contactPrestataire: 'Mme Claire Dupont - 04 91 XX XX XX',
    budgetEstime: 18000,
    objectifs: 'Évaluer l\'impact des activités industrielles portuaires sur la contamination au mercure.',
    dateReelle: '2025-03-05',
    createdBy: 'Sophie Bernard',
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: '2025-03-05T08:00:00Z',
  },
  {
    id: '4',
    reference: 'MERC-2025-004',
    titre: 'Surveillance Calanques - Printemps',
    statut: 'planifiee',
    programme: 'Parc National des Calanques - Suivi annuel',
    zones: ['Calanque de Sormiou', 'Calanque de Morgiou', 'Île Riou'],
    datePrevue: '2025-04-15',
    dateFinPrevue: '2025-04-18',
    typesPrelevements: [
      { id: '1', type: 'Eau de mer', quantite: 18, unite: 'échantillons' },
      { id: '2', type: 'Organismes marins', quantite: 30, unite: 'spécimens' },
    ],
    prestataire: 'GIP Calanques',
    contactPrestataire: 'Dr. Thomas Blanc - 04 91 XX XX XX',
    budgetEstime: 25000,
    objectifs: 'Surveillance semestrielle de la qualité des eaux dans le Parc National des Calanques, focus sur mercure et métaux lourds.',
    createdBy: 'Marie Dubois',
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: '2025-02-01T11:00:00Z',
  },
];

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export function MercuryView() {
  const [campaigns, setCampaigns] = useState<MercuryCampaign[]>(initialCampaigns);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<MercuryCampaign | null>(null);

  const handleCreateCampaign = (campaign: MercuryCampaign) => {
    setCampaigns([...campaigns, campaign]);
    setViewMode('list');
  };

  const handleUpdateCampaign = (updatedCampaign: MercuryCampaign) => {
    setCampaigns(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    setViewMode('list');
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
    setViewMode('list');
  };

  const handleViewDetail = (campaign: MercuryCampaign) => {
    setSelectedCampaign(campaign);
    setViewMode('detail');
  };

  const handleEditCampaign = (campaign: MercuryCampaign) => {
    setSelectedCampaign(campaign);
    setViewMode('edit');
  };

  return (
    <>
      {viewMode === 'list' && (
        <MercuryListView
          campaigns={campaigns}
          onCreateNew={() => setViewMode('create')}
          onViewDetail={handleViewDetail}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
        />
      )}

      {viewMode === 'create' && (
        <MercuryCampaignForm
          onSave={handleCreateCampaign}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedCampaign && (
        <MercuryCampaignForm
          campaign={selectedCampaign}
          onSave={handleUpdateCampaign}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedCampaign && (
        <MercuryCampaignDetail
          campaign={selectedCampaign}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={() => {
            handleDeleteCampaign(selectedCampaign.id);
          }}
        />
      )}
    </>
  );
}
