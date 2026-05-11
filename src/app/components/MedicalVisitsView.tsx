import React, { useState } from 'react';
import { toast } from 'sonner';
import { MedicalVisitsListView } from './medical/MedicalVisitsListView';
import { MedicalVisitForm } from './medical/MedicalVisitForm';
import { MedicalVisitDetail } from './medical/MedicalVisitDetail';
import { AppUser } from '@/app/components/admin/UserManagementView';
import type { MedicalVisitReportFile } from './medical/medicalVisitReportFile';

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
  statutMilitaire: 'Militaire' | 'Civil'; // Nouveau champ
  
  // Informations administratives
  domaine?: string;
  lieu?: string;
  service?: string; // Service pour filtrage / affichage
  
  // Visites médicales
  derniereVisiteMedicale?: string;
  prochaineVisiteMedicale?: string;
  surveillanceMedicaleAnnee?: number; // Périodicité en années
  /** Compte rendu de visite médicale (fichier joint : PDF, scan, etc.) */
  compteRenduVisite?: MedicalVisitReportFile;
  /** Indique si le conseiller de prévention doit être prévenu (enregistré sur la fiche ; envoi réel hors périmètre UI). */
  prevenirConseillerPrevention?: boolean;
  /** Indique si le secrétaire général doit être prévenu. */
  prevenirSecretaireGeneral?: boolean;
  
  // Aménagements
  amenagementPoste?: string;
  surveillanceParticuliere?: string; // Aménagement, suivi AT, invalidité...
  
  // Liaison avec les risques - IDs des risques auxquels l'agent est exposé
  risquesExposition?: string[]; // Array d'IDs de risques

  // Lien avec l'annuaire Utilisateurs (Administration)
  employeeId?: string;
  
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
    statutMilitaire: 'Civil',
    domaine: 'Méditerranée occidentale',
    lieu: 'Marseille',
    service: 'Aménagement Littoral',
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
    statutMilitaire: 'Civil',
    domaine: 'Méditerranée orientale',
    lieu: 'Toulon',
    service: 'Sécurité Maritime',
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
    statutMilitaire: 'Civil',
    domaine: 'Méditerranée orientale',
    lieu: 'Nice',
    service: 'Ressources Humaines',
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
    statutMilitaire: 'Civil',
    domaine: 'Méditerranée occidentale',
    lieu: 'Marseille',
    service: 'Moyens Généraux',
    derniereVisiteMedicale: '2024-01-08',
    prochaineVisiteMedicale: '2024-07-08',
    surveillanceMedicaleAnnee: 0.5,
    amenagementPoste: 'Port de charges limité à 10kg',
    surveillanceParticuliere: 'Reconnaissance travailleur handicapé (RQTH) - Invalidité 2ème catégorie - Visite médicale semestrielle obligatoire',
    prevenirConseillerPrevention: true,
    prevenirSecretaireGeneral: false,
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
    statutMilitaire: 'Civil',
    domaine: 'Corse',
    lieu: 'Ajaccio',
    service: 'Direction',
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
    statutMilitaire: 'Militaire',
    domaine: 'Méditerranée occidentale',
    lieu: 'Sète',
    service: 'Contrôle Sécurité',
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
    nom: 'Leclerc',
    prenom: 'Pierre',
    statutMilitaire: 'Civil',
    employeeId: '3',
    domaine: 'Technique',
    lieu: 'Site Lyon',
    service: 'Maintenance',
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
    statutMilitaire: 'Civil',
    domaine: 'Méditerranée occidentale',
    lieu: 'Marseille',
    service: 'Environnement',
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
  users: AppUser[];
}

export function MedicalVisitsView({ risks, users }: MedicalVisitsViewProps) {
  const [medicalVisits, setMedicalVisits] = useState<MedicalVisit[]>(initialMedicalVisits);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedVisit, setSelectedVisit] = useState<MedicalVisit | null>(null);

  const handleCreateVisit = (visit: MedicalVisit) => {
    if (
      visit.employeeId &&
      medicalVisits.some(
        (v) => v.employeeId && String(v.employeeId) === String(visit.employeeId),
      )
    ) {
      toast.error('Un suivi médical existe déjà pour cet agent dans l’annuaire.');
      return;
    }
    setMedicalVisits([...medicalVisits, visit]);
    toast.success('Suivi médical créé.');
    setViewMode('list');
  };

  const handleUpdateVisit = (updatedVisit: MedicalVisit) => {
    if (
      updatedVisit.employeeId &&
      medicalVisits.some(
        (v) =>
          v.id !== updatedVisit.id &&
          v.employeeId &&
          String(v.employeeId) === String(updatedVisit.employeeId),
      )
    ) {
      toast.error('Un autre suivi est déjà associé à cet agent.');
      return;
    }
    setMedicalVisits(medicalVisits.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    toast.success('Suivi médical mis à jour.');
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
          key="medical-create"
          users={users}
          risks={risks}
          onSave={handleCreateVisit}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedVisit && (
        <MedicalVisitForm
          key={`medical-edit-${selectedVisit.id}`}
          medicalVisit={selectedVisit}
          users={users}
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