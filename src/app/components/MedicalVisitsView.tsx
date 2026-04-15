import React, { useState } from 'react';
import { MedicalVisitsListView } from './medical/MedicalVisitsListView';
import { MedicalVisitForm } from './medical/MedicalVisitForm';
import { MedicalVisitDetail } from './medical/MedicalVisitDetail';

export interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  category: string;
  unite: string;
  service: string;
  situation: string;
}

export interface MedicalVisit {
  id: string;
  
  // Informations personnelles
  sexe: 'M' | 'F';
  nom: string;
  prenom: string;
  nombreEnfants?: number;
  statutMilitaire: 'Militaire' | 'Civil'; // Nouveau champ
  
  // Informations administratives
  departement: string;
  gradeNNE: string; // Libellé du grade NNE
  libellePoste: string;
  echelon?: string;
  structureDetaillee: string;
  service: string; // Service pour filtrage
  inm?: string; // Indice de rémunération
  nombreHeuresRemunerees?: number;
  etpe?: number; // Équivalent Temps Plein
  
  // Visites médicales
  derniereVisiteMedicale?: string;
  prochaineVisiteMedicale?: string;
  surveillanceMedicaleAnnee?: number; // Périodicité en années
  
  // Aménagements
  amenagementPoste?: string;
  surveillanceParticuliere?: string; // Aménagement, suivi AT, invalidité...
  
  // Liaison avec les risques - IDs des risques auxquels l'agent est exposé
  risquesExposition?: string[]; // Array d'IDs de risques
  
  // Statut calculé
  statut: 'a_jour' | 'a_planifier' | 'en_retard' | 'urgent';
  
  // Métadonnées
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Données de démonstration
const initialMedicalVisits: MedicalVisit[] = [
  {
    id: '1',
    sexe: 'F',
    nom: 'MARTIN',
    prenom: 'Sophie',
    nombreEnfants: 2,
    statutMilitaire: 'Civil',
    departement: 'Bouches-du-Rhône (13)',
    gradeNNE: 'Ingénieur des Ponts, des Eaux et des Forêts',
    libellePoste: 'Chef du service Aménagement Littoral',
    echelon: 'HEA',
    structureDetaillee: 'DIRM MED - Service Aménagement Littoral',
    service: 'Aménagement Littoral',
    inm: '821',
    nombreHeuresRemunerees: 1607,
    etpe: 1.0,
    derniereVisiteMedicale: '2024-03-15',
    prochaineVisiteMedicale: '2026-03-15',
    surveillanceMedicaleAnnee: 2,
    amenagementPoste: 'Aucun',
    risquesExposition: ['1', '3'], // Exposition aux risques chimiques et psychosociaux
    statut: 'a_jour',
    createdBy: 'Marie Dubois',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
  },
  {
    id: '2',
    sexe: 'M',
    nom: 'BERNARD',
    prenom: 'Jean-Pierre',
    nombreEnfants: 3,
    statutMilitaire: 'Civil',
    departement: 'Var (83)',
    gradeNNE: 'Technicien supérieur développement durable',
    libellePoste: 'Technicien Sécurité Maritime',
    echelon: 'Principal',
    structureDetaillee: 'DIRM MED - Centre de Sécurité Maritime',
    service: 'Sécurité Maritime',
    inm: '567',
    nombreHeuresRemunerees: 1607,
    etpe: 1.0,
    derniereVisiteMedicale: '2023-11-20',
    prochaineVisiteMedicale: '2024-11-20',
    surveillanceMedicaleAnnee: 1,
    amenagementPoste: 'Poste de travail ergonomique (fauteuil adapté)',
    surveillanceParticuliere: 'Surveillance renforcée suite à accident de travail (juin 2023) - Contrôle annuel obligatoire',
    risquesExposition: ['2', '5', '8'], // Exposition aux chutes, manutention, conditions climatiques
    statut: 'a_planifier',
    createdBy: 'Pierre Leroux',
    createdAt: '2022-05-10T09:00:00Z',
    updatedAt: '2023-11-20T16:00:00Z',
  },
  {
    id: '3',
    sexe: 'F',
    nom: 'DUBOIS',
    prenom: 'Marie',
    nombreEnfants: 0,
    statutMilitaire: 'Civil',
    departement: 'Alpes-Maritimes (06)',
    gradeNNE: 'Attaché d\'administration de l\'État',
    libellePoste: 'Gestionnaire Ressources Humaines',
    echelon: 'Principal',
    structureDetaillee: 'DIRM MED - Service RH',
    service: 'Ressources Humaines',
    inm: '498',
    nombreHeuresRemunerees: 1400,
    etpe: 0.87,
    derniereVisiteMedicale: '2022-06-10',
    prochaineVisiteMedicale: '2024-06-10',
    surveillanceMedicaleAnnee: 2,
    risquesExposition: ['3', '10'], // Risques psychosociaux, écrans
    statut: 'en_retard',
    createdBy: 'Sophie Bernard',
    createdAt: '2021-09-10T10:00:00Z',
    updatedAt: '2022-06-10T11:00:00Z',
  },
  {
    id: '4',
    sexe: 'M',
    nom: 'ROUSSEAU',
    prenom: 'Thomas',
    nombreEnfants: 1,
    statutMilitaire: 'Civil',
    departement: 'Bouches-du-Rhône (13)',
    gradeNNE: 'Adjoint technique principal',
    libellePoste: 'Agent d\'entretien et de maintenance',
    echelon: '2ème classe',
    structureDetaillee: 'DIRM MED - Service Moyens Généraux',
    service: 'Moyens Généraux',
    inm: '345',
    nombreHeuresRemunerees: 1607,
    etpe: 1.0,
    derniereVisiteMedicale: '2024-01-08',
    prochaineVisiteMedicale: '2024-07-08',
    surveillanceMedicaleAnnee: 0.5,
    amenagementPoste: 'Port de charges limité à 10kg',
    surveillanceParticuliere: 'Reconnaissance travailleur handicapé (RQTH) - Invalidité 2ème catégorie - Visite médicale semestrielle obligatoire',
    risquesExposition: ['1', '5', '6'], // Chimique, manutention, électrique
    statut: 'a_planifier',
    createdBy: 'Jean Martin',
    createdAt: '2023-01-08T14:00:00Z',
    updatedAt: '2024-01-08T09:30:00Z',
  },
  {
    id: '5',
    sexe: 'F',
    nom: 'LAURENT',
    prenom: 'Isabelle',
    nombreEnfants: 2,
    statutMilitaire: 'Civil',
    departement: 'Var (83)',
    gradeNNE: 'Secrétaire administrative',
    libellePoste: 'Assistante de direction',
    echelon: 'Classe supérieure',
    structureDetaillee: 'DIRM MED - Direction',
    service: 'Direction',
    inm: '412',
    nombreHeuresRemunerees: 1280,
    etpe: 0.80,
    derniereVisiteMedicale: '2020-09-15',
    prochaineVisiteMedicale: '2022-09-15',
    surveillanceMedicaleAnnee: 2,
    amenagementPoste: 'Télétravail 3 jours/semaine',
    surveillanceParticuliere: 'Temps partiel thérapeutique - Reprise progressive suite à longue maladie',
    risquesExposition: ['3', '10'], // Risques psychosociaux, écrans
    statut: 'urgent',
    createdBy: 'Sophie Bernard',
    createdAt: '2020-01-12T10:00:00Z',
    updatedAt: '2020-09-15T11:00:00Z',
  },
  {
    id: '6',
    sexe: 'M',
    nom: 'PETIT',
    prenom: 'Alexandre',
    nombreEnfants: 0,
    statutMilitaire: 'Militaire',
    departement: 'Bouches-du-Rhône (13)',
    gradeNNE: 'Officier de Port',
    libellePoste: 'Inspecteur Contrôle Navigation Plaisance',
    echelon: 'Divisionnaire',
    structureDetaillee: 'DIRM MED - Service Contrôle Sécurité',
    service: 'Contrôle Sécurité',
    inm: '642',
    nombreHeuresRemunerees: 1607,
    etpe: 1.0,
    derniereVisiteMedicale: '2024-10-22',
    prochaineVisiteMedicale: '2026-10-22',
    surveillanceMedicaleAnnee: 2,
    risquesExposition: ['2', '7', '8'], // Chutes, navigation, conditions climatiques
    statut: 'a_jour',
    createdBy: 'Marie Dubois',
    createdAt: '2022-10-22T09:00:00Z',
    updatedAt: '2024-10-22T15:00:00Z',
  },
  {
    id: '7',
    sexe: 'M',
    nom: 'LEFEVRE',
    prenom: 'Marc',
    nombreEnfants: 1,
    statutMilitaire: 'Militaire',
    departement: 'Var (83)',
    gradeNNE: 'Officier marinier',
    libellePoste: 'Chef de quart surveillance maritime',
    echelon: 'Premier maître',
    structureDetaillee: 'DIRM MED - Centre Opérations Maritimes',
    service: 'Opérations Maritimes',
    inm: '589',
    nombreHeuresRemunerees: 1607,
    etpe: 1.0,
    derniereVisiteMedicale: '2024-01-10',
    prochaineVisiteMedicale: '2025-01-10',
    surveillanceMedicaleAnnee: 1,
    risquesExposition: ['3', '8', '9'], // Psychosociaux, climatiques, bruit
    statut: 'a_jour',
    createdBy: 'Pierre Leroux',
    createdAt: '2023-01-10T08:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '8',
    sexe: 'F',
    nom: 'MOREAU',
    prenom: 'Céline',
    nombreEnfants: 0,
    statutMilitaire: 'Civil',
    departement: 'Bouches-du-Rhône (13)',
    gradeNNE: 'Technicien supérieur en laboratoire',
    libellePoste: 'Analyste Environnement Marin',
    echelon: 'Principal',
    structureDetaillee: 'DIRM MED - Service Environnement',
    service: 'Environnement',
    inm: '523',
    nombreHeuresRemunerees: 1607,
    etpe: 1.0,
    derniereVisiteMedicale: '2023-08-20',
    prochaineVisiteMedicale: '2024-08-20',
    surveillanceMedicaleAnnee: 1,
    amenagementPoste: 'Hotte aspirante obligatoire',
    surveillanceParticuliere: 'Exposition aux produits chimiques - Surveillance médicale renforcée',
    risquesExposition: ['1', '4'], // Chimique, biologique
    statut: 'en_retard',
    createdBy: 'Jean Martin',
    createdAt: '2022-08-20T14:00:00Z',
    updatedAt: '2023-08-20T16:30:00Z',
  },
];

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface MedicalVisitsViewProps {
  risks: Risk[];
}

export function MedicalVisitsView({ risks }: MedicalVisitsViewProps) {
  const [medicalVisits, setMedicalVisits] = useState<MedicalVisit[]>(initialMedicalVisits);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedVisit, setSelectedVisit] = useState<MedicalVisit | null>(null);

  const handleCreateVisit = (visit: MedicalVisit) => {
    setMedicalVisits([...medicalVisits, visit]);
    setViewMode('list');
  };

  const handleUpdateVisit = (updatedVisit: MedicalVisit) => {
    setMedicalVisits(medicalVisits.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    setViewMode('list');
  };

  const handleDeleteVisit = (id: string) => {
    setMedicalVisits(medicalVisits.filter(v => v.id !== id));
    setViewMode('list');
  };

  const handleViewDetail = (visit: MedicalVisit) => {
    setSelectedVisit(visit);
    setViewMode('detail');
  };

  const handleEditVisit = (visit: MedicalVisit) => {
    setSelectedVisit(visit);
    setViewMode('edit');
  };

  return (
    <>
      {viewMode === 'list' && (
        <MedicalVisitsListView
          medicalVisits={medicalVisits}
          onCreateNew={() => setViewMode('create')}
          onViewDetail={handleViewDetail}
          onEdit={handleEditVisit}
          onDelete={handleDeleteVisit}
        />
      )}

      {viewMode === 'create' && (
        <MedicalVisitForm
          risks={risks}
          onSave={handleCreateVisit}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedVisit && (
        <MedicalVisitForm
          medicalVisit={selectedVisit}
          risks={risks}
          onSave={handleUpdateVisit}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedVisit && (
        <MedicalVisitDetail
          medicalVisit={selectedVisit}
          risks={risks}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={() => {
            handleDeleteVisit(selectedVisit.id);
          }}
        />
      )}
    </>
  );
}