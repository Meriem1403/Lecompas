import React, { useState } from 'react';
import { APP_DATA_KEYS } from '@/app/services/appDataApi';
import { useAppDataDocumentStore } from '@/app/hooks/useAppDataDocumentStore';
import { AsbestosDeclarationListView } from './asbestos-declaration/AsbestosDeclarationListView';
import { AsbestosDeclarationForm } from './asbestos-declaration/AsbestosDeclarationForm';
import { AsbestosDeclarationDetail } from './asbestos-declaration/AsbestosDeclarationDetail';

export type DeclarationType = 'intermediaire' | 'presence';
export type DeclarationStatus = 'pending' | 'validated_admin' | 'validated_sg' | 'completed';

export interface PosteOccupe {
  intitule: string;
  dateDebut: string;
  dateFin: string;
}

// Pour l'attestation intermédiaire
export interface ExpositionDetails {
  produitsUtilises: string[]; // Checkboxes des produits
  autresProduits?: string;
  compositionProduits: string;
  mesuresPrevention: string;
  evaluationExposition: string;
}

// Pour l'attestation de présence
export interface PeriodePresence {
  batiments: string;
  dateDebut: string;
  dateFin: string;
  origineContamination: string;
}

export interface AsbestosDeclaration {
  id: string;
  type: DeclarationType;
  
  // Informations agent
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroSecurite?: string; // 5 premiers chiffres
  service: string;
  medecinPrevention: string;
  intitulePosteActuel: string;
  
  // Postes occupés (pour les deux types)
  postesOccupes: PosteOccupe[];
  
  // Spécifique à l'attestation intermédiaire
  expositionDetails?: ExpositionDetails;
  
  // Spécifique à l'attestation de présence
  periodesPresence?: PeriodePresence[];
  
  // Workflow et validation
  status: DeclarationStatus;
  createdBy: string;
  createdAt: string;
  
  // Validation Admin
  validatedByAdmin?: string;
  validatedByAdminDate?: string;
  adminComment?: string;
  
  // Validation SG
  validatedBySG?: string;
  validatedBySGDate?: string;
  sgComment?: string;
  
  // Envoi à l'agent
  sentToAgentDate?: string;
  deliveredDate?: string; // Date de délivrance finale
  
  updatedAt: string;
}

// Données de démonstration
const initialDeclarations: AsbestosDeclaration[] = [
  {
    id: '1',
    type: 'intermediaire',
    nom: 'MARTIN',
    prenom: 'Jean-Pierre',
    dateNaissance: '1975-05-20',
    numeroSecurite: '17505',
    service: 'DIRM Méditerranée - Centre de Sécurité Maritime',
    medecinPrevention: 'Dr. Sophie BERNARD',
    intitulePosteActuel: 'Technicien Sécurité Maritime',
    postesOccupes: [
      {
        intitule: 'Agent d\'entretien bâtiments',
        dateDebut: '2005-03-01',
        dateFin: '2010-12-31'
      },
      {
        intitule: 'Technicien maintenance navale',
        dateDebut: '2011-01-01',
        dateFin: '2012-01-31'
      }
    ],
    expositionDetails: {
      produitsUtilises: [
        'Entretien bâtiments/ouvrages/navires/feux-phares',
        'Fibrociment',
        'Mécanique automobile/marine (garnitures de friction)',
        'Travail sur/dans locaux floqués'
      ],
      compositionProduits: 'Fibrociment (plaques ondulées, canalisations), peintures contenant des fibres d\'amiante, garnitures de freins et d\'embrayage pour véhicules et navires.',
      mesuresPrevention: 'Port d\'équipements de protection individuelle (masques FFP3, combinaisons jetables), ventilation des locaux, humidification des surfaces avant intervention, contrôles réguliers de l\'empoussièrement.',
      evaluationExposition: 'Exposition intermittente : 1 à plusieurs fois par mois lors des opérations de maintenance. Durée d\'exposition estimée : 4-6 heures par mois en moyenne sur la période considérée.'
    },
    status: 'validated_sg',
    createdBy: 'Marie Dubois (RH)',
    createdAt: '2024-11-15T09:00:00Z',
    validatedByAdmin: 'Pierre Leroux',
    validatedByAdminDate: '2024-11-20T14:30:00Z',
    adminComment: 'Dossier complet, exposition avérée. Validation pour transmission au SG.',
    validatedBySG: 'Sophie Durand',
    validatedBySGDate: '2024-11-25T10:15:00Z',
    sgComment: 'Attestation validée. À transmettre à l\'agent pour son suivi médical post-professionnel.',
    updatedAt: '2024-11-25T10:15:00Z'
  },
  {
    id: '2',
    type: 'presence',
    nom: 'ROUSSEAU',
    prenom: 'Marc',
    dateNaissance: '1980-09-12',
    service: 'DIRM MED / CSN PACA CORSE',
    medecinPrevention: 'Dr. Sophie BERNARD',
    intitulePosteActuel: 'Inspecteur de la navigation et de la sécurité',
    postesOccupes: [
      {
        intitule: 'Inspecteur de la navigation et de la sécurité',
        dateDebut: '2012-02-01',
        dateFin: 'En poste'
      }
    ],
    periodesPresence: [
      {
        batiments: 'Navires étrangers et du pavillon, atelier et chantier naval',
        dateDebut: '2012-02-01',
        dateFin: 'En poste à ce jour',
        origineContamination: 'Présence possible et avérée dans les locaux des navires du pavillon dans le cadre des inspections et audits, et étrangers dans le cadre des inspections PSC. Liste des navires inspectés fournie en annexe (voir AEA intermédiaire).'
      },
      {
        batiments: 'Bureaux CSN - Bâtiment A, étage 2',
        dateDebut: '2015-06-01',
        dateFin: '2018-03-31',
        origineContamination: 'DTA mentionnant la présence de faux-plafonds amiantés en cours de dégradation. Travaux de désamiantage réalisés en mars 2018.'
      }
    ],
    status: 'validated_admin',
    createdBy: 'Jean Martin (RH)',
    createdAt: '2024-12-01T08:30:00Z',
    validatedByAdmin: 'Pierre Leroux',
    validatedByAdminDate: '2024-12-05T16:45:00Z',
    adminComment: 'Déclaration conforme. Périodes de présence vérifiées. Transmission au SG pour validation finale.',
    updatedAt: '2024-12-05T16:45:00Z'
  },
  {
    id: '3',
    type: 'intermediaire',
    nom: 'LAURENT',
    prenom: 'Isabelle',
    dateNaissance: '1978-03-15',
    numeroSecurite: '27803',
    service: 'DIRM Méditerranée - Service Environnement',
    medecinPrevention: 'Dr. Sophie BERNARD',
    intitulePosteActuel: 'Technicienne Laboratoire',
    postesOccupes: [
      {
        intitule: 'Technicienne analyses environnementales',
        dateDebut: '2008-09-01',
        dateFin: '2012-01-31'
      }
    ],
    expositionDetails: {
      produitsUtilises: [
        'Essais de laboratoire sur matériaux amiantés'
      ],
      compositionProduits: 'Échantillons de matériaux de construction contenant de l\'amiante chrysotile et amphiboles pour analyses en laboratoire.',
      mesuresPrevention: 'Travail sous hotte aspirante à flux laminaire, port systématique de masque FFP3, gants nitrile, lunettes de protection. Protocoles stricts de manipulation et d\'élimination des déchets amiantés.',
      evaluationExposition: 'Exposition occasionnelle : 2 à 4 fois par mois lors des analyses d\'échantillons. Durée d\'exposition : 1-2 heures par analyse. Niveau d\'empoussièrement mesuré < 5 fibres/litre (seuil réglementaire : 10 f/L).'
    },
    status: 'pending',
    createdBy: 'Marie Dubois (RH)',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z'
  },
  {
    id: '4',
    type: 'presence',
    nom: 'PETIT',
    prenom: 'Alexandre',
    dateNaissance: '1982-07-08',
    service: 'DIRM MED / Service Moyens Généraux',
    medecinPrevention: 'Dr. Sophie BERNARD',
    intitulePosteActuel: 'Agent de maintenance',
    postesOccupes: [
      {
        intitule: 'Agent de maintenance bâtiments',
        dateDebut: '2015-01-01',
        dateFin: 'En poste'
      }
    ],
    periodesPresence: [
      {
        batiments: 'Phare du Cap Sicié - Tour et bâtiments techniques',
        dateDebut: '2015-01-01',
        dateFin: '2020-12-31',
        origineContamination: 'DTA du 15/03/2014 mentionnant la présence d\'isolants amiantés dans les conduites et de revêtements muraux contenant de l\'amiante. Intervention mensuelle pour maintenance.'
      }
    ],
    status: 'completed',
    createdBy: 'Jean Martin (RH)',
    createdAt: '2024-10-10T14:00:00Z',
    validatedByAdmin: 'Pierre Leroux',
    validatedByAdminDate: '2024-10-15T11:20:00Z',
    adminComment: 'Dossier validé. Exposition documentée avec DTA.',
    validatedBySG: 'Sophie Durand',
    validatedBySGDate: '2024-10-22T09:30:00Z',
    sgComment: 'Attestation validée et délivrée à l\'agent.',
    sentToAgentDate: '2024-10-22T14:00:00Z',
    deliveredDate: '2024-10-22T14:00:00Z',
    updatedAt: '2024-10-22T14:00:00Z'
  },
  {
    id: '5',
    type: 'intermediaire',
    nom: 'MOREAU',
    prenom: 'Thomas',
    dateNaissance: '1970-11-30',
    numeroSecurite: '17011',
    service: 'DIRM Méditerranée - Contrôle Technique Véhicules',
    medecinPrevention: 'Dr. Sophie BERNARD',
    intitulePosteActuel: 'Contrôleur technique véhicules (retraité)',
    postesOccupes: [
      {
        intitule: 'Contrôleur technique automobile',
        dateDebut: '1995-06-01',
        dateFin: '2011-12-31'
      }
    ],
    expositionDetails: {
      produitsUtilises: [
        'Mécanique automobile/marine (garnitures de friction)',
        'Contrôles techniques de véhicules/navires'
      ],
      compositionProduits: 'Garnitures de freins et d\'embrayage contenant de l\'amiante chrysotile (jusqu\'en 1997), puis amosite dans certains véhicules importés jusqu\'en 2005.',
      mesuresPrevention: 'Port de gants, masques anti-poussières (avant 2000), puis masques FFP2/FFP3 (après 2000). Aspiration des poussières lors du contrôle des freins.',
      evaluationExposition: 'Exposition fréquente : plusieurs fois par semaine lors des contrôles techniques. Durée : 30-45 minutes par véhicule. Estimation : 15-20 véhicules/semaine sur la période 1995-2011.'
    },
    status: 'completed',
    createdBy: 'Marie Dubois (RH)',
    createdAt: '2024-09-05T09:00:00Z',
    validatedByAdmin: 'Pierre Leroux',
    validatedByAdminDate: '2024-09-12T15:00:00Z',
    adminComment: 'Exposition longue durée confirmée. Agent retraité - attestation pour suivi post-professionnel.',
    validatedBySG: 'Sophie Durand',
    validatedBySGDate: '2024-09-18T10:00:00Z',
    sgComment: 'Attestation validée. Envoyée à l\'agent retraité pour transmission à son médecin traitant.',
    sentToAgentDate: '2024-09-18T15:30:00Z',
    deliveredDate: '2024-09-18T15:30:00Z',
    updatedAt: '2024-09-18T15:30:00Z'
  }
];

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface AsbestosDeclarationViewProps {
  currentUser: {
    name: string;
    role: 'admin' | 'chef_service' | 'agent';
  };
  accessToken?: string;
}

export function AsbestosDeclarationView({
  currentUser,
  accessToken = '',
}: AsbestosDeclarationViewProps) {
  const [declarations, setDeclarations] = useAppDataDocumentStore<AsbestosDeclaration[]>(
    APP_DATA_KEYS.asbestosDeclarations,
    accessToken,
    { seed: initialDeclarations },
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDeclaration, setSelectedDeclaration] = useState<AsbestosDeclaration | null>(null);

  const handleCreateDeclaration = (declaration: AsbestosDeclaration) => {
    setDeclarations([declaration, ...declarations]);
    setViewMode('list');
  };

  const handleUpdateDeclaration = (updatedDeclaration: AsbestosDeclaration) => {
    setDeclarations(declarations.map(d => d.id === updatedDeclaration.id ? updatedDeclaration : d));
    setViewMode('list');
  };

  const handleDeleteDeclaration = (id: string) => {
    setDeclarations(declarations.filter(d => d.id !== id));
    setViewMode('list');
  };

  const handleViewDetail = (declaration: AsbestosDeclaration) => {
    setSelectedDeclaration(declaration);
    setViewMode('detail');
  };

  const handleEditDeclaration = (declaration: AsbestosDeclaration) => {
    setSelectedDeclaration(declaration);
    setViewMode('edit');
  };

  const handleValidateAdmin = (id: string, comment: string) => {
    setDeclarations(declarations.map(d => 
      d.id === id 
        ? {
            ...d,
            status: 'validated_admin',
            validatedByAdmin: currentUser.name,
            validatedByAdminDate: new Date().toISOString(),
            adminComment: comment,
            updatedAt: new Date().toISOString()
          }
        : d
    ));
  };

  const handleValidateSG = (id: string, comment: string) => {
    setDeclarations(declarations.map(d => 
      d.id === id 
        ? {
            ...d,
            status: 'validated_sg',
            validatedBySG: currentUser.name,
            validatedBySGDate: new Date().toISOString(),
            sgComment: comment,
            updatedAt: new Date().toISOString()
          }
        : d
    ));
  };

  const handleSendToAgent = (id: string) => {
    setDeclarations(declarations.map(d => 
      d.id === id 
        ? {
            ...d,
            status: 'completed',
            sentToAgentDate: new Date().toISOString(),
            deliveredDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : d
    ));
  };

  return (
    <>
      {viewMode === 'list' && (
        <AsbestosDeclarationListView
          declarations={declarations}
          currentUser={currentUser}
          onCreateNew={() => setViewMode('create')}
          onViewDetail={handleViewDetail}
          onEdit={handleEditDeclaration}
          onDelete={handleDeleteDeclaration}
          onValidateAdmin={handleValidateAdmin}
          onValidateSG={handleValidateSG}
          onSendToAgent={handleSendToAgent}
        />
      )}

      {viewMode === 'create' && (
        <AsbestosDeclarationForm
          currentUser={currentUser}
          onSave={handleCreateDeclaration}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedDeclaration && (
        <AsbestosDeclarationForm
          declaration={selectedDeclaration}
          currentUser={currentUser}
          onSave={handleUpdateDeclaration}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedDeclaration && (
        <AsbestosDeclarationDetail
          declaration={selectedDeclaration}
          currentUser={currentUser}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={() => {
            handleDeleteDeclaration(selectedDeclaration.id);
          }}
          onValidateAdmin={handleValidateAdmin}
          onValidateSG={handleValidateSG}
          onSendToAgent={handleSendToAgent}
        />
      )}
    </>
  );
}
