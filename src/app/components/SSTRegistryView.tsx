import React, { useState } from 'react';
import { APP_DATA_KEYS } from '@/app/services/appDataApi';
import { useAppDataDocumentStore } from '@/app/hooks/useAppDataDocumentStore';
import { SSTRegistryListView } from './sst-registry/SSTRegistryListView';
import { SSTRegistryForm } from './sst-registry/SSTRegistryForm';
import { SSTRegistryDetail } from './sst-registry/SSTRegistryDetail';

// Type pour les sites géographiques
export type GeographicSite = 'PACA' | 'Occitanie' | 'Corse';

// Type pour les domaines
export type Domain = 
  | 'locaux_travail'
  | 'machines_outils'
  | 'epc'
  | 'epi'
  | 'situations_risques'
  | 'conditions_travail'
  | 'formation'
  | 'evenements_dangereux'
  | 'autre';

// Type pour l'état d'une action
export type ActionStatus = 'en_attente' | 'en_cours' | 'realise' | 'annule';

// Type pour l'état global de la fiche
export type RemarkStatus = 'nouvelle' | 'transmise' | 'en_cours' | 'cloturee';

// Action de suivi
export interface FollowUpAction {
  id: string;
  date: string;
  description: string;
  entity: string; // Entité/agent chargé(e)
  deadline?: string; // Délais
  status: ActionStatus;
}

// Remarque RSST
export interface SSTRemark {
  id: string;
  ficheNumber: string; // Numéro de fiche (ex: "42")
  
  // Formulaire de saisie
  service: string;
  geographicSites: GeographicSite[];
  siteComments?: string;
  isAnonymous: boolean;
  agentName?: string; // Si pas anonyme
  domains: Domain[];
  otherDomain?: string;
  observation: string; // Max 800 caractères
  sitePrecisions: string; // Lieu, bât, étage, bureau
  
  // Métadonnées
  submissionDate: string;
  submissionTime: string;
  submittedBy: string; // Nom de l'utilisateur qui a saisi
  
  // Suivi
  status: RemarkStatus;
  registryKeeperName: string; // Personne chargée de la tenue du registre
  transmittedTo?: string; // "Chef de service, CP, SG, Secrétaire CHSCT"
  
  // Observations du responsable
  managerObservations?: {
    name: string;
    function: string;
    date: string;
    comment: string;
  };
  
  // Actions de suivi
  followUpActions: FollowUpAction[];
  
  // Examen CHSCT
  chsctExam?: {
    date: string;
    observations: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Données de démonstration
const initialRemarks: SSTRemark[] = [
  {
    id: '1',
    ficheNumber: '42',
    service: 'SSGM',
    geographicSites: ['PACA'],
    isAnonymous: false,
    agentName: 'Costa Clémentine',
    domains: ['situations_risques'],
    observation: 'Plaque de protection d\'un luminaire a chuté sur la tête de Mme Costa en salle audiométrie. Quelles sont les actions à mener.',
    sitePrecisions: 'Bâtiment Zattara 1er étage - Salle audiométrie',
    submissionDate: '2017-09-29',
    submissionTime: '10:00',
    submittedBy: 'Costa Clémentine',
    status: 'cloturee',
    registryKeeperName: 'LAPAZ',
    transmittedTo: 'Chef du service, CP, SG, Secrétaire CHSCT',
    managerObservations: {
      name: 'Dr. Duport',
      function: 'Médecin de prévention',
      date: '2017-10-02',
      comment: 'Ticket GLPI fait, le service technique s\'est déplacé et a préféré ne pas repositionner le disque en verre.',
    },
    followUpActions: [
      {
        id: 'a1',
        date: '2017-10-02',
        description: 'Suite à l\'émission d\'un ticket via l\'application GLPI, intervention d\'un agent de l\'UL/DREAL qui a préféré ne pas repositionner la verrine en verre',
        entity: 'CSP/CS/UL-DREAL',
        status: 'realise',
      },
      {
        id: 'a2',
        date: '2017-10-19',
        description: 'Vérification de tous les luminaires de ce type au 1er étage partie SSGM. Deux ont été réenclenchés au niveau des faux plafonds WC. Dernièrement des travaux de passage de câble contrôles d\'accès ont été réalisés dans les faux plafond, beaucoup de plaques ne sont pas repositionnées.',
        entity: 'CP/CSP',
        status: 'realise',
      },
    ],
    chsctExam: {
      date: '2017-10-19',
      observations: 'Fiche clôturée suite aux actions correctives menées',
    },
    createdAt: '2017-09-29T10:00:00Z',
    updatedAt: '2017-10-19T14:30:00Z',
  },
  {
    id: '2',
    ficheNumber: '58',
    service: 'DIRM Méditerranée - Service Technique',
    geographicSites: ['PACA', 'Occitanie'],
    siteComments: 'Concerne les deux zones portuaires',
    isAnonymous: false,
    agentName: 'MARTIN Jean',
    domains: ['epi', 'situations_risques'],
    observation: 'Masques de protection respiratoire FFP3 périmés depuis 6 mois dans l\'armoire EPI du hangar technique. Besoin urgent de renouvellement pour les interventions en milieu confiné.',
    sitePrecisions: 'Site de Marseille - Hangar technique Port - Zone stockage EPI',
    submissionDate: '2024-11-15',
    submissionTime: '14:30',
    submittedBy: 'Jean MARTIN',
    status: 'en_cours',
    registryKeeperName: 'LAPAZ',
    transmittedTo: 'Chef du service Technique, Responsable Achats, CP',
    managerObservations: {
      name: 'BERNARD Sophie',
      function: 'Chef de Service Technique',
      date: '2024-11-16',
      comment: 'Demande validée. Commande urgente passée auprès du fournisseur habituel. Livraison prévue sous 5 jours ouvrés.',
    },
    followUpActions: [
      {
        id: 'a3',
        date: '2024-11-16',
        description: 'Bon de commande émis pour 50 masques FFP3 (réf. 3M Aura 9332+)',
        entity: 'Service Achats / Sophie BERNARD',
        deadline: '2024-11-23',
        status: 'en_cours',
      },
      {
        id: 'a4',
        date: '2024-11-16',
        description: 'Retrait immédiat des masques périmés et étiquetage "Non conforme - Ne pas utiliser"',
        entity: 'Jean MARTIN',
        status: 'realise',
      },
    ],
    createdAt: '2024-11-15T14:30:00Z',
    updatedAt: '2024-11-16T16:00:00Z',
  },
  {
    id: '3',
    ficheNumber: '63',
    service: 'DIRM MED / CSN PACA CORSE',
    geographicSites: ['Corse'],
    isAnonymous: true,
    domains: ['locaux_travail', 'conditions_travail'],
    observation: 'Problème d\'éclairage persistant dans le bureau 203. Deux néons sur quatre ne fonctionnent plus depuis plusieurs semaines. Cela crée une fatigue visuelle importante et des maux de tête en fin de journée.',
    sitePrecisions: 'Bâtiment principal CSN - 2ème étage - Bureau 203',
    submissionDate: '2024-12-01',
    submissionTime: '09:15',
    submittedBy: 'Anonyme',
    status: 'transmise',
    registryKeeperName: 'LAPAZ',
    transmittedTo: 'Services techniques, Chef de service CSN',
    followUpActions: [],
    createdAt: '2024-12-01T09:15:00Z',
    updatedAt: '2024-12-01T09:15:00Z',
  },
  {
    id: '4',
    ficheNumber: '67',
    service: 'DIRM Méditerranée - Service Infrastructure',
    geographicSites: ['PACA'],
    isAnonymous: false,
    agentName: 'DUBOIS Thomas',
    domains: ['machines_outils', 'evenements_dangereux'],
    observation: 'Presqu\'accident : défaillance du système de freinage d\'urgence de la plateforme élévatrice mobile. L\'engin a continué à descendre malgré l\'activation du bouton d\'arrêt d\'urgence. Heureusement pas de blessé mais situation très dangereuse.',
    sitePrecisions: 'Phare du Cap Couronne - Zone maintenance extérieure',
    submissionDate: '2024-12-10',
    submissionTime: '11:45',
    submittedBy: 'Thomas DUBOIS',
    status: 'transmise',
    registryKeeperName: 'LAPAZ',
    transmittedTo: 'Chef de service Infrastructure, CP, Inspection du Travail, Organisme de contrôle périodique',
    managerObservations: {
      name: 'ROUSSEAU Pierre',
      function: 'Chef de Service Infrastructure',
      date: '2024-12-10',
      comment: 'Mise en sécurité immédiate : plateforme condamnée et étiquetée "Hors service". Contrôle technique d\'urgence programmé. Déclaration presqu\'accident transmise.',
    },
    followUpActions: [
      {
        id: 'a5',
        date: '2024-12-10',
        description: 'Condamnation immédiate de la plateforme élévatrice et mise en place de signalisation',
        entity: 'Thomas DUBOIS / Pierre ROUSSEAU',
        status: 'realise',
      },
      {
        id: 'a6',
        date: '2024-12-10',
        description: 'Prise de contact avec l\'organisme de contrôle APAVE pour intervention urgente',
        entity: 'Service Infrastructure',
        deadline: '2024-12-12',
        status: 'en_cours',
      },
      {
        id: 'a7',
        date: '2024-12-11',
        description: 'Analyse de risque complémentaire et mise à jour DUERP',
        entity: 'CP / Chargé de prévention',
        deadline: '2024-12-20',
        status: 'en_attente',
      },
    ],
    createdAt: '2024-12-10T11:45:00Z',
    updatedAt: '2024-12-10T16:30:00Z',
  },
  {
    id: '5',
    ficheNumber: '71',
    service: 'DIRM Méditerranée - Service Logistique',
    geographicSites: ['Occitanie'],
    isAnonymous: false,
    agentName: 'MOREAU Philippe',
    domains: ['conditions_travail', 'formation'],
    observation: 'Demande de formation gestes et postures pour l\'équipe logistique. Plusieurs agents se plaignent de douleurs dorsales liées aux manutentions régulières de charges lourdes (matériel informatique, archives, mobilier).',
    sitePrecisions: 'Site de Sète - Service logistique - Entrepôt',
    submissionDate: '2024-12-15',
    submissionTime: '10:00',
    submittedBy: 'Philippe MOREAU',
    status: 'nouvelle',
    registryKeeperName: 'LAPAZ',
    followUpActions: [],
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
];

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

interface SSTRegistryViewProps {
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
  accessToken?: string;
}

export function SSTRegistryView({
  currentUserRole,
  currentUserName,
  accessToken = '',
}: SSTRegistryViewProps) {
  const [remarks, setRemarks] = useAppDataDocumentStore<SSTRemark[]>(
    APP_DATA_KEYS.sstRegistryRemarks,
    accessToken,
    { seed: initialRemarks },
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRemark, setSelectedRemark] = useState<SSTRemark | null>(null);

  const handleCreateRemark = (remark: SSTRemark) => {
    setRemarks([...remarks, remark]);
    setViewMode('list');
  };

  const handleUpdateRemark = (updatedRemark: SSTRemark) => {
    setRemarks(remarks.map(r => r.id === updatedRemark.id ? updatedRemark : r));
    setSelectedRemark(updatedRemark);
  };

  const handleDeleteRemark = (id: string) => {
    setRemarks(remarks.filter(r => r.id !== id));
    setViewMode('list');
  };

  const handleAddFollowUpAction = (remarkId: string, action: FollowUpAction) => {
    const updatedRemarks = remarks.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          followUpActions: [...r.followUpActions, action],
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    setRemarks(updatedRemarks);
    const updatedRemark = updatedRemarks.find(r => r.id === remarkId);
    if (updatedRemark) {
      setSelectedRemark(updatedRemark);
    }
  };

  const handleUpdateFollowUpAction = (remarkId: string, actionId: string, updatedAction: FollowUpAction) => {
    const updatedRemarks = remarks.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          followUpActions: r.followUpActions.map(a => a.id === actionId ? updatedAction : a),
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    setRemarks(updatedRemarks);
    const updatedRemark = updatedRemarks.find(r => r.id === remarkId);
    if (updatedRemark) {
      setSelectedRemark(updatedRemark);
    }
  };

  const handleDeleteFollowUpAction = (remarkId: string, actionId: string) => {
    const updatedRemarks = remarks.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          followUpActions: r.followUpActions.filter(a => a.id !== actionId),
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    setRemarks(updatedRemarks);
    const updatedRemark = updatedRemarks.find(r => r.id === remarkId);
    if (updatedRemark) {
      setSelectedRemark(updatedRemark);
    }
  };

  const handleUpdateStatus = (remarkId: string, newStatus: RemarkStatus) => {
    const updatedRemarks = remarks.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    setRemarks(updatedRemarks);
    const updatedRemark = updatedRemarks.find(r => r.id === remarkId);
    if (updatedRemark) {
      setSelectedRemark(updatedRemark);
    }
  };

  const handleAddManagerObservation = (remarkId: string, observation: SSTRemark['managerObservations']) => {
    const updatedRemarks = remarks.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          managerObservations: observation,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    setRemarks(updatedRemarks);
    const updatedRemark = updatedRemarks.find(r => r.id === remarkId);
    if (updatedRemark) {
      setSelectedRemark(updatedRemark);
    }
  };

  const handleAddCHSCTExam = (remarkId: string, exam: SSTRemark['chsctExam']) => {
    const updatedRemarks = remarks.map(r => {
      if (r.id === remarkId) {
        return {
          ...r,
          chsctExam: exam,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    setRemarks(updatedRemarks);
    const updatedRemark = updatedRemarks.find(r => r.id === remarkId);
    if (updatedRemark) {
      setSelectedRemark(updatedRemark);
    }
  };

  return (
    <div className="p-6">
      {viewMode === 'list' && (
        <SSTRegistryListView
          remarks={remarks}
          currentUserRole={currentUserRole}
          onView={(remark) => {
            setSelectedRemark(remark);
            setViewMode('detail');
          }}
          onEdit={(remark) => {
            setSelectedRemark(remark);
            setViewMode('edit');
          }}
          onDelete={handleDeleteRemark}
          onCreate={() => setViewMode('create')}
        />
      )}

      {viewMode === 'create' && (
        <SSTRegistryForm
          currentUserName={currentUserName}
          onSave={handleCreateRemark}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'edit' && selectedRemark && (
        <SSTRegistryForm
          remark={selectedRemark}
          currentUserName={currentUserName}
          onSave={handleUpdateRemark}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedRemark && (
        <SSTRegistryDetail
          remark={selectedRemark}
          currentUserRole={currentUserRole}
          currentUserName={currentUserName}
          onBack={() => setViewMode('list')}
          onEdit={() => setViewMode('edit')}
          onDelete={() => {
            handleDeleteRemark(selectedRemark.id);
          }}
          onAddFollowUpAction={handleAddFollowUpAction}
          onUpdateFollowUpAction={handleUpdateFollowUpAction}
          onDeleteFollowUpAction={handleDeleteFollowUpAction}
          onUpdateStatus={handleUpdateStatus}
          onAddManagerObservation={handleAddManagerObservation}
          onAddCHSCTExam={handleAddCHSCTExam}
        />
      )}
    </div>
  );
}
