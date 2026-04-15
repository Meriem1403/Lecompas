import React, { useState } from 'react';
import { AsbestosAttestationsListView } from './asbestos-attestations/AsbestosAttestationsListView';
import { AsbestosAttestationForm } from './asbestos-attestations/AsbestosAttestationForm';
import { AsbestosAttestationDetail } from './asbestos-attestations/AsbestosAttestationDetail';

// Type d'attestation
export type AttestationType = 'intermediaire' | 'presence';

// Statut de validation de l'attestation
export type AttestationStatus = 
  | 'brouillon'           // Agent en cours de rédaction
  | 'en_attente_admin'    // Soumise, en attente validation Admin
  | 'rejetee_admin'       // Rejetée par Admin
  | 'en_attente_sg'       // Validée Admin, en attente validation SG
  | 'rejetee_sg'          // Rejetée par SG
  | 'validee'             // Validée par SG
  | 'envoyee_agent';      // Envoyée à l'agent

// Poste occupé avec période
export interface PosteOccupe {
  id: string;
  intitulePoste: string;
  dateDebut: string;
  dateFin: string;
}

// Ligne du tableau des produits/procédés (Attestation intermédiaire)
export interface ProduitProcede {
  id: string;
  produitProcede: string;
  compositionProduits: string;
  mesuresPrevention: string;
  evaluationExposition: string;
}

// Période de présence dans les locaux (Attestation de présence)
export interface PeriodePresence {
  id: string;
  batimentsLocaux: string;
  dateDebut: string;
  dateFin: string;
  origineSuspicion: string;
}

// Validation step
export interface ValidationStep {
  validatedBy: string;
  validatedDate: string;
  comment?: string;
  action: 'approved' | 'rejected';
}

// Attestation d'exposition à l'amiante
export interface AsbestosAttestation {
  id: string;
  type: AttestationType; // 'intermediaire' ou 'presence'
  status: AttestationStatus;
  
  // Informations agent
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroSecu: string; // 5 premiers chiffres
  service: string;
  medecinPrevention: string;
  
  // Spécifique à l'attestation intermédiaire
  postesOccupes?: PosteOccupe[];
  produitsProcessus?: ProduitProcede[];
  
  // Spécifique à l'attestation de présence
  intitulePoste?: string;
  periodesPresence?: PeriodePresence[];
  
  // Workflow de validation
  dateCreation: string;
  dateLivraison?: string;
  createdBy: string;
  
  validationAdmin?: ValidationStep;
  validationSG?: ValidationStep;
  
  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

// Données de démonstration
const initialAttestations: AsbestosAttestation[] = [
  {
    id: '1',
    type: 'intermediaire',
    status: 'validee',
    nom: 'MARTIN',
    prenom: 'Jean',
    dateNaissance: '1975-03-15',
    numeroSecu: '17503',
    service: 'DIRM Méditerranée - Service Technique',
    medecinPrevention: 'Dr. BERNARD',
    postesOccupes: [
      {
        id: 'p1',
        intitulePoste: 'Technicien maintenance navale',
        dateDebut: '2005-01-01',
        dateFin: '2010-12-31',
      },
      {
        id: 'p2',
        intitulePoste: 'Chef d\'équipe entretien',
        dateDebut: '2011-01-01',
        dateFin: '2012-01-31',
      },
    ],
    produitsProcessus: [
      {
        id: 'pr1',
        produitProcede: 'Entretien bâtiments / navires',
        compositionProduits: 'Fibrociment, peintures amiantées',
        mesuresPrevention: 'EPI : masque FFP3, combinaison jetable, gants',
        evaluationExposition: 'Fréquente : 2 à 3 fois par semaine',
      },
      {
        id: 'pr2',
        produitProcede: 'Mécanique marine',
        compositionProduits: 'Garnitures de friction amiantées',
        mesuresPrevention: 'EPI : masque, gants, ventilation locale',
        evaluationExposition: 'Intermittente : 1 à 2 fois par mois',
      },
    ],
    dateCreation: '2024-01-15',
    dateLivraison: '2024-02-01',
    createdBy: 'Jean MARTIN',
    validationAdmin: {
      validatedBy: 'Sophie BERNARD',
      validatedDate: '2024-01-18',
      comment: 'Dossier complet, validation OK',
      action: 'approved',
    },
    validationSG: {
      validatedBy: 'Pierre DUBOIS',
      validatedDate: '2024-01-25',
      comment: 'Validé pour envoi à l\'agent',
      action: 'approved',
    },
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-25T14:30:00Z',
  },
  {
    id: '2',
    type: 'presence',
    status: 'en_attente_sg',
    nom: 'LAURENT',
    prenom: 'Marie',
    dateNaissance: '1982-07-22',
    numeroSecu: '28207',
    service: 'DIRM MED / CSN PACA CORSE',
    medecinPrevention: 'Dr. ROUSSEAU',
    intitulePoste: 'Inspecteur de la navigation',
    periodesPresence: [
      {
        id: 'per1',
        batimentsLocaux: 'Navires étrangers et du pavillon, atelier et chantier naval',
        dateDebut: '2012-02-01',
        dateFin: '2024-12-31',
        origineSuspicion: 'Présence possible et avérée dans les locaux des navires du pavillon dans le cadre des inspections et audits et étrangers dans le cadre des inspections PSC. (Voir liste des navires inspectés en annexe)',
      },
      {
        id: 'per2',
        batimentsLocaux: 'Centre de Sécurité des Navires - Bureaux administratifs',
        dateDebut: '2012-02-01',
        dateFin: '2020-06-30',
        origineSuspicion: 'Mention de dégradation de matériaux amiantés dans le DTA du bâtiment',
      },
    ],
    dateCreation: '2024-11-20',
    createdBy: 'Marie LAURENT',
    validationAdmin: {
      validatedBy: 'Sophie BERNARD',
      validatedDate: '2024-11-25',
      comment: 'Documents conformes, transmission au SG',
      action: 'approved',
    },
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-11-25T16:00:00Z',
  },
  {
    id: '3',
    type: 'intermediaire',
    status: 'en_attente_admin',
    nom: 'DUBOIS',
    prenom: 'Thomas',
    dateNaissance: '1968-11-10',
    numeroSecu: '16811',
    service: 'DIRM Méditerranée - Service Infrastructure',
    medecinPrevention: 'Dr. BERNARD',
    postesOccupes: [
      {
        id: 'p3',
        intitulePoste: 'Agent d\'entretien feux et phares',
        dateDebut: '1995-06-01',
        dateFin: '2008-12-31',
      },
      {
        id: 'p4',
        intitulePoste: 'Responsable maintenance signalisation maritime',
        dateDebut: '2009-01-01',
        dateFin: '2012-01-31',
      },
    ],
    produitsProcessus: [
      {
        id: 'pr3',
        produitProcede: 'Entretien feux-phares',
        compositionProduits: 'Fibrociment, câbles amiantés',
        mesuresPrevention: 'EPI : masque, combinaison, gants. Ventilation naturelle',
        evaluationExposition: 'Fréquente : 3 à 4 fois par semaine',
      },
      {
        id: 'pr4',
        produitProcede: 'Travail sur locaux floqués',
        compositionProduits: 'Flocage amiante-ciment',
        mesuresPrevention: 'Confinement zone, EPI complet, douche de décontamination',
        evaluationExposition: 'Occasionnelle : 2 à 3 fois par an',
      },
    ],
    dateCreation: '2024-12-10',
    createdBy: 'Thomas DUBOIS',
    createdAt: '2024-12-10T14:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
  },
  {
    id: '4',
    type: 'presence',
    status: 'rejetee_admin',
    nom: 'PETIT',
    prenom: 'Isabelle',
    dateNaissance: '1990-05-18',
    numeroSecu: '29005',
    service: 'DIRM MED / CSN PACA CORSE',
    medecinPrevention: 'Dr. ROUSSEAU',
    intitulePoste: 'Contrôleur de sécurité',
    periodesPresence: [
      {
        id: 'per3',
        batimentsLocaux: 'Navires étrangers - Inspections PSC',
        dateDebut: '2015-03-01',
        dateFin: '2024-12-31',
        origineSuspicion: 'Présence dans les locaux des navires étrangers lors des contrôles PSC',
      },
    ],
    dateCreation: '2024-12-01',
    createdBy: 'Isabelle PETIT',
    validationAdmin: {
      validatedBy: 'Sophie BERNARD',
      validatedDate: '2024-12-05',
      comment: 'Dossier incomplet : merci de fournir la liste détaillée des navires inspectés en pièce jointe',
      action: 'rejected',
    },
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2024-12-05T11:30:00Z',
  },
  {
    id: '5',
    type: 'intermediaire',
    status: 'brouillon',
    nom: 'MOREAU',
    prenom: 'Philippe',
    dateNaissance: '1972-09-25',
    numeroSecu: '17209',
    service: 'DIRM Méditerranée - Service Logistique',
    medecinPrevention: 'Dr. BERNARD',
    postesOccupes: [
      {
        id: 'p5',
        intitulePoste: 'Chauffeur et agent logistique',
        dateDebut: '2000-01-01',
        dateFin: '2012-01-31',
      },
    ],
    produitsProcessus: [
      {
        id: 'pr5',
        produitProcede: 'Contrôles techniques de véhicules',
        compositionProduits: 'Garnitures de frein et embrayage amiantées',
        mesuresPrevention: 'Gants, masque anti-poussière',
        evaluationExposition: 'Intermittente : 1 fois par mois',
      },
    ],
    dateCreation: '2024-12-15',
    createdBy: 'Philippe MOREAU',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
];

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface AsbestosAttestationsViewProps {
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
}

export function AsbestosAttestationsView({ currentUserRole, currentUserName }: AsbestosAttestationsViewProps) {
  const [attestations, setAttestations] = useState<AsbestosAttestation[]>(initialAttestations);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAttestation, setSelectedAttestation] = useState<AsbestosAttestation | null>(null);

  const handleCreateAttestation = (attestation: AsbestosAttestation) => {
    setAttestations([...attestations, attestation]);
    setViewMode('list');
  };

  const handleUpdateAttestation = (updatedAttestation: AsbestosAttestation) => {
    setAttestations(attestations.map(a => a.id === updatedAttestation.id ? updatedAttestation : a));
    setViewMode('list');
  };

  const handleDeleteAttestation = (id: string) => {
    setAttestations(attestations.filter(a => a.id !== id));
    setViewMode('list');
  };

  const handleViewDetail = (attestation: AsbestosAttestation) => {
    setSelectedAttestation(attestation);
    setViewMode('detail');
  };

  const handleEditAttestation = (attestation: AsbestosAttestation) => {
    setSelectedAttestation(attestation);
    setViewMode('edit');
  };

  const handleValidateAdmin = (id: string, comment: string) => {
    setAttestations(attestations.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'en_attente_sg',
            validationAdmin: {
              validatedBy: currentUserName,
              validatedDate: new Date().toISOString().split('T')[0],
              comment,
              action: 'approved',
            },
            updatedAt: new Date().toISOString(),
          }
        : a
    ));
  };

  const handleRejectAdmin = (id: string, comment: string) => {
    setAttestations(attestations.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'rejetee_admin',
            validationAdmin: {
              validatedBy: currentUserName,
              validatedDate: new Date().toISOString().split('T')[0],
              comment,
              action: 'rejected',
            },
            updatedAt: new Date().toISOString(),
          }
        : a
    ));
  };

  const handleValidateSG = (id: string, comment: string) => {
    setAttestations(attestations.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'validee',
            dateLivraison: new Date().toISOString().split('T')[0],
            validationSG: {
              validatedBy: currentUserName,
              validatedDate: new Date().toISOString().split('T')[0],
              comment,
              action: 'approved',
            },
            updatedAt: new Date().toISOString(),
          }
        : a
    ));
  };

  const handleRejectSG = (id: string, comment: string) => {
    setAttestations(attestations.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'rejetee_sg',
            validationSG: {
              validatedBy: currentUserName,
              validatedDate: new Date().toISOString().split('T')[0],
              comment,
              action: 'rejected',
            },
            updatedAt: new Date().toISOString(),
          }
        : a
    ));
  };

  const handleSubmitAttestation = (id: string) => {
    setAttestations(attestations.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'en_attente_admin',
            updatedAt: new Date().toISOString(),
          }
        : a
    ));
  };

  return (
    <>
      {viewMode === 'list' && (
        <AsbestosAttestationsListView
          attestations={attestations}
          currentUserRole={currentUserRole}
          onCreateNew={() => setViewMode('create')}
          onViewDetail={handleViewDetail}
          onEdit={handleEditAttestation}
          onDelete={handleDeleteAttestation}
        />
      )}

      {viewMode === 'create' && (
        <AsbestosAttestationForm
          currentUserName={currentUserName}
          onSave={handleCreateAttestation}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedAttestation && (
        <AsbestosAttestationForm
          attestation={selectedAttestation}
          currentUserName={currentUserName}
          onSave={handleUpdateAttestation}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedAttestation && (
        <AsbestosAttestationDetail
          attestation={selectedAttestation}
          currentUserRole={currentUserRole}
          currentUserName={currentUserName}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={() => {
            handleDeleteAttestation(selectedAttestation.id);
          }}
          onValidateAdmin={handleValidateAdmin}
          onRejectAdmin={handleRejectAdmin}
          onValidateSG={handleValidateSG}
          onRejectSG={handleRejectSG}
          onSubmit={handleSubmitAttestation}
        />
      )}
    </>
  );
}
