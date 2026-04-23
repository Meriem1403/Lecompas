import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { CerbereRequestDetail } from '@/app/components/CerbereRequestDetail';
import { CerbereRequestForm } from '@/app/components/CerbereRequestForm';
import { generateCerbereAttestation } from '@/utils/generateCerbereAttestation';
import { AppUser } from '@/app/components/admin/UserManagementView';

interface CerbereApplication {
  id: string;
  code: string;
  nom: string;
  description: string;
  profils: CerbereProfil[];
}

interface CerbereProfil {
  id: string;
  applicationId: string;
  identifiant: string;
  description: string;
}

interface CerbereRequest {
  id: string;
  agentConcerne: string;
  demandeur: string;
  applications: string[];
  profils: string[];
  reglePortee: string;
  restrictions: string;
  soumiseLe: string;
  statut:
    | 'en_attente_chef'
    | 'en_attente_admin'
    | 'validee'
    | 'refusee';
  valideePar?: string;
  dateValidation?: string;
  chefValidationPar?: string;
  chefValidationLe?: string;
  justification?: string;
}

const mockApplications: CerbereApplication[] = [
  {
    id: '1',
    code: 'CHORUS',
    nom: 'Chorus Pro',
    description: 'Application de gestion financière et budgétaire',
    profils: [
      { id: 'p1', applicationId: '1', identifiant: 'CHORUS_ADMIN', description: 'Administrateur Chorus avec droits complets' },
      { id: 'p2', applicationId: '1', identifiant: 'CHORUS_GESTIONNAIRE', description: 'Gestionnaire financier avec droits de saisie' },
      { id: 'p3', applicationId: '1', identifiant: 'CHORUS_LECTEUR', description: 'Consultation des données financières uniquement' },
    ],
  },
  {
    id: '2',
    code: 'SIRHIUS',
    nom: 'Sirhius RH',
    description: 'Système d\'information des ressources humaines',
    profils: [
      { id: 'p4', applicationId: '2', identifiant: 'SIRHIUS_ADMIN', description: 'Administrateur RH' },
      { id: 'p5', applicationId: '2', identifiant: 'SIRHIUS_GESTIONNAIRE', description: 'Gestionnaire RH' },
    ],
  },
  {
    id: '3',
    code: 'SAFIR',
    nom: 'SAFIR Navigation',
    description: 'Application de gestion des affaires maritimes et de la navigation',
    profils: [
      { id: 'p6', applicationId: '3', identifiant: 'SAFIR_ADMIN', description: 'Administrateur SAFIR' },
      { id: 'p7', applicationId: '3', identifiant: 'SAFIR_INSTRUCTEUR', description: 'Instructeur des dossiers maritimes' },
      { id: 'p8', applicationId: '3', identifiant: 'SAFIR_CONSULTANT', description: 'Consultation des dossiers' },
    ],
  },
  {
    id: '4',
    code: 'REGLISSE',
    nom: 'Reglisse',
    description: 'Application de gestion réglementaire',
    profils: [
      { id: 'p9', applicationId: '4', identifiant: 'REGLISSE_GESTIONNAIRE', description: 'Gestionnaire réglementaire' },
      { id: 'p10', applicationId: '4', identifiant: 'REGLISSE_LECTEUR', description: 'Lecture des textes réglementaires' },
    ],
  },
];

interface CerbereViewProps {
  usersData: AppUser[];
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
  currentUserEmail?: string;
  currentUserService?: string;
  currentUserDomain?: string;
  currentUserLocation?: string;
}

export function CerbereView({
  usersData,
  currentUserRole,
  currentUserName,
  currentUserEmail,
  currentUserService,
  currentUserDomain,
  currentUserLocation,
}: CerbereViewProps) {
  const [activeTab, setActiveTab] = useState<'applications' | 'requests'>('applications');
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'form'>('list');
  const [applications, setApplications] = useState<CerbereApplication[]>(mockApplications);
  const [requests, setRequests] = useState<CerbereRequest[]>(() => {
    const normalize = (value?: string) => (value || '').trim().toLowerCase();
    const fullName = (u: AppUser) => `${u.firstName} ${u.lastName}`.trim();
    const currentUserData =
      usersData.find((u) => normalize(fullName(u)) === normalize(currentUserName)) || null;
    const users = usersData.length > 0 ? usersData : [];
    if (users.length === 0) {
      return [
        {
          id: 'fx-fallback',
          agentConcerne: currentUserName,
          demandeur: currentUserName,
          applications: ['CHORUS'],
          profils: ['CHORUS_LECTEUR'],
          reglePortee: currentUserService || 'Mon service',
          restrictions: 'Aucune',
          soumiseLe: new Date().toISOString().split('T')[0],
          statut: currentUserRole === 'agent' ? 'en_attente_chef' : 'en_attente_admin',
        },
      ];
    }

    const serviceChefs = users.filter((u) => normalize(u.role) === 'role_chef');
    const appSets = [
      { apps: ['CHORUS'], profils: ['CHORUS_LECTEUR'] },
      { apps: ['SAFIR'], profils: ['SAFIR_CONSULTANT'] },
      { apps: ['SIRHIUS'], profils: ['SIRHIUS_GESTIONNAIRE'] },
      { apps: ['REGLISSE'], profils: ['REGLISSE_LECTEUR'] },
    ];

    const generated = users.slice(0, 10).map((target, idx) => {
      const sameServiceChef = serviceChefs.find(
        (chef) => normalize(chef.service) === normalize(target.service),
      );
      const demandeurName = sameServiceChef ? fullName(sameServiceChef) : fullName(target);
      const selectedSet = appSets[idx % appSets.length];
      const statusCycle: CerbereRequest['statut'][] = [
        'en_attente_chef',
        'en_attente_admin',
        'validee',
        'refusee',
      ];
      const statut = statusCycle[idx % statusCycle.length];
      const day = String((idx % 9) + 1).padStart(2, '0');

      return {
        id: `fx-${target.id}`,
        agentConcerne: fullName(target),
        demandeur: demandeurName,
        applications: selectedSet.apps,
        profils: selectedSet.profils,
        reglePortee: target.service || 'Mon service',
        restrictions: idx % 2 === 0 ? 'Aucune' : 'Accès en lecture seule',
        soumiseLe: `2026-02-${day}`,
        statut,
        chefValidationPar:
          statut === 'en_attente_admin' || statut === 'validee' || statut === 'refusee'
            ? 'Sophie Bernard'
            : undefined,
        chefValidationLe:
          statut === 'en_attente_admin' || statut === 'validee' || statut === 'refusee'
            ? `2026-02-${String((idx % 9) + 8).padStart(2, '0')}`
            : undefined,
        valideePar: statut === 'validee' || statut === 'refusee' ? 'Admin Système' : undefined,
        dateValidation:
          statut === 'validee' || statut === 'refusee'
            ? `2026-02-${String((idx % 9) + 10).padStart(2, '0')}`
            : undefined,
      } satisfies CerbereRequest;
    });

    const currentName = currentUserData ? fullName(currentUserData) : currentUserName;
    const hasCurrentUserRequest = generated.some(
      (r) => normalize(r.demandeur) === normalize(currentName),
    );
    if (!hasCurrentUserRequest) {
      generated.unshift({
        id: `fx-self-${Date.now()}`,
        agentConcerne: currentName,
        demandeur: currentName,
        applications: ['CHORUS'],
        profils: ['CHORUS_LECTEUR'],
        reglePortee: currentUserData?.service || currentUserService || 'Mon service',
        restrictions: 'Aucune',
        soumiseLe: new Date().toISOString().split('T')[0],
        statut: currentUserRole === 'agent' ? 'en_attente_chef' : 'en_attente_admin',
      });
    }

    const sophie = users.find(
      (u) => normalize(fullName(u)) === normalize('Sophie Bernard'),
    );
    if (sophie) {
      const sophieTeam = users.filter(
        (u) =>
          normalize(u.service) === normalize(sophie.service) &&
          normalize(fullName(u)) !== normalize('Sophie Bernard'),
      );
      sophieTeam.slice(0, 2).forEach((member, index) => {
        const memberName = fullName(member);
        const alreadyExists = generated.some(
          (r) =>
            normalize(r.demandeur) === normalize('Sophie Bernard') &&
            normalize(r.agentConcerne) === normalize(memberName),
        );
        if (!alreadyExists) {
          generated.unshift({
            id: `fx-sophie-${member.id}`,
            agentConcerne: memberName,
            demandeur: 'Sophie Bernard',
            applications: index % 2 === 0 ? ['CHORUS'] : ['SAFIR'],
            profils: index % 2 === 0 ? ['CHORUS_GESTIONNAIRE'] : ['SAFIR_CONSULTANT'],
            reglePortee: sophie.service || member.service || 'Mon service',
            restrictions: 'Aucune',
            soumiseLe: `2026-03-${String(index + 1).padStart(2, '0')}`,
            statut: 'en_attente_admin',
          });
        }
      });
    }

    return generated;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chefScopeFilter, setChefScopeFilter] = useState<'all' | 'moi' | 'mes_agents'>('all');
  const [adminServiceFilter, setAdminServiceFilter] = useState('all');
  const [adminDomainFilter, setAdminDomainFilter] = useState('all');
  const [adminLocationFilter, setAdminLocationFilter] = useState('all');

  // États pour les dialogs
  const [isAddAppDialogOpen, setIsAddAppDialogOpen] = useState(false);
  const [isEditAppDialogOpen, setIsEditAppDialogOpen] = useState(false);
  const [isDeleteAppDialogOpen, setIsDeleteAppDialogOpen] = useState(false);
  const [isAddProfilDialogOpen, setIsAddProfilDialogOpen] = useState(false);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // États pour les formulaires
  const [selectedApp, setSelectedApp] = useState<CerbereApplication | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CerbereRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<CerbereRequest | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    description: '',
  });
  const [profilFormData, setProfilFormData] = useState({
    applicationId: '',
    identifiant: '',
    description: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  
  const userRole = currentUserRole;

  // Gestion des applications
  const handleAddApplication = () => {
    if (!formData.code || !formData.nom) {
      toast.error('Le code et le nom sont requis');
      return;
    }

    const newApp: CerbereApplication = {
      id: Date.now().toString(),
      code: formData.code,
      nom: formData.nom,
      description: formData.description,
      profils: [],
    };

    setApplications([...applications, newApp]);
    setIsAddAppDialogOpen(false);
    setFormData({ code: '', nom: '', description: '' });
    toast.success('Application ajoutée avec succès');
  };

  const handleEditApplication = () => {
    if (!selectedApp || !formData.code || !formData.nom) {
      toast.error('Le code et le nom sont requis');
      return;
    }

    setApplications(
      applications.map((app) =>
        app.id === selectedApp.id
          ? { ...app, code: formData.code, nom: formData.nom, description: formData.description }
          : app
      )
    );

    setIsEditAppDialogOpen(false);
    setSelectedApp(null);
    setFormData({ code: '', nom: '', description: '' });
    toast.success('Application modifiée avec succès');
  };

  const handleDeleteApplication = () => {
    if (!selectedApp) return;

    setApplications(applications.filter((app) => app.id !== selectedApp.id));
    setIsDeleteAppDialogOpen(false);
    setSelectedApp(null);
    toast.success('Application supprimée avec succès');
  };

  const handleAddProfil = () => {
    if (!profilFormData.applicationId || !profilFormData.identifiant) {
      toast.error('L\'application et l\'identifiant sont requis');
      return;
    }

    const newProfil: CerbereProfil = {
      id: Date.now().toString(),
      applicationId: profilFormData.applicationId,
      identifiant: profilFormData.identifiant,
      description: profilFormData.description,
    };

    setApplications(
      applications.map((app) =>
        app.id === profilFormData.applicationId
          ? { ...app, profils: [...app.profils, newProfil] }
          : app
      )
    );

    setIsAddProfilDialogOpen(false);
    setProfilFormData({ applicationId: '', identifiant: '', description: '' });
    toast.success('Profil ajouté avec succès');
  };

  const handleDeleteProfil = (appId: string, profilId: string) => {
    setApplications(
      applications.map((app) =>
        app.id === appId
          ? { ...app, profils: app.profils.filter((p) => p.id !== profilId) }
          : app
      )
    );
    toast.success('Profil supprimé avec succès');
  };

  // Gestion des demandes
  const handleValidateRequest = () => {
    if (!selectedRequest) return;

    if (userRole === 'chef_service' && selectedRequest.statut === 'en_attente_chef') {
      setRequests(
        requests.map((req) =>
          req.id === selectedRequest.id
            ? {
                ...req,
                statut: 'en_attente_admin',
                chefValidationPar: currentUserName,
                chefValidationLe: new Date().toISOString().split('T')[0],
              }
            : req,
        ),
      );
      setIsValidateDialogOpen(false);
      setSelectedRequest(null);
      toast.success("Demande validée par le chef, en attente de validation administrateur");
      return;
    }

    setRequests(
      requests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              statut: 'validee',
              valideePar: currentUserName,
              dateValidation: new Date().toISOString().split('T')[0],
            }
          : req
      )
    );

    setIsValidateDialogOpen(false);
    setSelectedRequest(null);
    toast.success('Demande validée avec succès');
  };

  const handleRejectRequest = () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error('Veuillez indiquer un motif de refus');
      return;
    }

    setRequests(
      requests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              statut: 'refusee',
              chefValidationPar:
                userRole === 'chef_service' ? currentUserName : req.chefValidationPar,
              chefValidationLe:
                userRole === 'chef_service'
                  ? new Date().toISOString().split('T')[0]
                  : req.chefValidationLe,
              valideePar: userRole === 'admin' ? currentUserName : req.valideePar,
              dateValidation: new Date().toISOString().split('T')[0],
              restrictions: `${req.restrictions} | Refusé: ${rejectionReason}`,
            }
          : req,
      ),
    );

    setIsRejectDialogOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
    toast.success('Demande refusée');
  };

  const normalize = (value?: string) => (value || '').trim().toLowerCase();
  const fullName = (u: AppUser) => `${u.firstName} ${u.lastName}`.trim();
  const currentUserData = useMemo(() => {
    return usersData.find((u) => normalize(fullName(u)) === normalize(currentUserName)) || null;
  }, [currentUserName, usersData]);

  const teamMemberNames = useMemo(() => {
    if (!currentUserData?.service) return [];
    return usersData
      .filter((u) => normalize(u.service) === normalize(currentUserData.service))
      .map((u) => fullName(u));
  }, [currentUserData, usersData]);

  const userByName = (name: string) =>
    usersData.find((u) => normalize(fullName(u)) === normalize(name)) || null;

  const adminServiceOptions = useMemo(
    () => Array.from(new Set(usersData.map((u) => u.service).filter(Boolean))),
    [usersData],
  );
  const adminDomainOptions = useMemo(
    () =>
      Array.from(
        new Set(
          usersData
            .filter((u) => adminServiceFilter === 'all' || u.service === adminServiceFilter)
            .map((u) => u.domain)
            .filter(Boolean),
        ),
      ),
    [adminServiceFilter, usersData],
  );
  const adminLocationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          usersData
            .filter((u) => adminServiceFilter === 'all' || u.service === adminServiceFilter)
            .filter((u) => adminDomainFilter === 'all' || u.domain === adminDomainFilter)
            .map((u) => u.location)
            .filter(Boolean),
        ),
      ),
    [adminDomainFilter, adminServiceFilter, usersData],
  );

  const matchesRoleScope = (req: CerbereRequest) => {
    if (userRole === 'agent') {
      return (
        normalize(req.demandeur) === normalize(currentUserName) ||
        normalize(req.agentConcerne) === normalize(currentUserName)
      );
    }

    if (userRole === 'chef_service') {
      const isMe = normalize(req.agentConcerne) === normalize(currentUserName);
      const isMyAgent = teamMemberNames.some(
        (name) => normalize(name) === normalize(req.agentConcerne),
      );
      if (!isMe && !isMyAgent) return false;

      if (chefScopeFilter === 'moi') {
        return isMe;
      }
      if (chefScopeFilter === 'mes_agents') {
        return !isMe && isMyAgent;
      }
      return true;
    }

    const targetUser = userByName(req.agentConcerne);
    if (adminServiceFilter !== 'all' && normalize(targetUser?.service) !== normalize(adminServiceFilter)) {
      return false;
    }
    if (adminDomainFilter !== 'all' && normalize(targetUser?.domain) !== normalize(adminDomainFilter)) {
      return false;
    }
    if (adminLocationFilter !== 'all' && normalize(targetUser?.location) !== normalize(adminLocationFilter)) {
      return false;
    }

    return true;
  };

  // Filtrage par rôle + filtres UI
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.agentConcerne.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.demandeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.applications.some((app) => app.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || req.statut === statusFilter;
    if (!matchesSearch || !matchesStatus) return false;

    return matchesRoleScope(req);
  });

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente_chef':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente de validation du chef de service
          </Badge>
        );
      case 'en_attente_admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente de validation administrateur
          </Badge>
        );
      case 'validee':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validée
          </Badge>
        );
      case 'refusee':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Refusée
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingRequestsCount = requests.filter(
    (r) =>
      (userRole === 'admin'
        ? r.statut === 'en_attente_admin'
        : r.statut === 'en_attente_chef' || r.statut === 'en_attente_admin') &&
      matchesRoleScope(r),
  ).length;

  // Handlers pour la nouvelle demande
  const handleSubmitNewRequest = (data: any) => {
    if (editingRequest) {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === editingRequest.id
            ? {
                ...req,
                ...data,
              }
            : req,
        ),
      );
      setEditingRequest(null);
      toast.success('Demande modifiée avec succès');
    } else {
      const initialStatus: CerbereRequest['statut'] =
        userRole === 'agent' ? 'en_attente_chef' : 'en_attente_admin';
      const newRequest: CerbereRequest = {
        id: `r${Date.now()}`,
        ...data,
        statut: initialStatus,
      };
      setRequests([...requests, newRequest]);
      toast.success('Demande soumise avec succès');
    }
    setCurrentView('list');
  };

  // Handler pour télécharger l'attestation
  const handleDownloadAttestation = (request: CerbereRequest) => {
    if (request.statut !== 'validee' || !request.valideePar || !request.dateValidation) {
      toast.error('Cette demande n\'a pas encore été validée');
      return;
    }

    generateCerbereAttestation({
      id: request.id,
      agentConcerne: request.agentConcerne,
      applications: request.applications,
      profils: request.profils,
      reglePortee: request.reglePortee,
      restrictions: request.restrictions,
      valideePar: request.valideePar,
      dateValidation: request.dateValidation,
    });

    toast.success('Attestation PDF téléchargée');
  };

  // Si on est en mode détail
  if (currentView === 'detail' && selectedRequest) {
    return (
      <CerbereRequestDetail
        request={selectedRequest}
        onBack={() => {
          setCurrentView('list');
          setSelectedRequest(null);
        }}
        onValidate={() => {
          setIsValidateDialogOpen(true);
        }}
        onReject={() => {
          setIsRejectDialogOpen(true);
        }}
        onDownloadAttestation={() => handleDownloadAttestation(selectedRequest)}
        userRole={userRole}
        currentUserName={currentUserName}
      />
    );
  }

  // Si on est en mode formulaire
  if (currentView === 'form') {
    return (
      <CerbereRequestForm
        onBack={() => {
          setCurrentView('list');
          setEditingRequest(null);
        }}
        onSubmit={handleSubmitNewRequest}
        applications={applications}
        userRole={userRole}
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
        currentUserService={currentUserService}
        currentUserDomain={currentUserDomain}
        currentUserLocation={currentUserLocation}
        usersData={usersData}
        initialData={
          editingRequest
            ? {
                agentConcerne: editingRequest.agentConcerne,
                applications: editingRequest.applications,
                profils: editingRequest.profils,
                reglePortee: editingRequest.reglePortee,
                restrictions: editingRequest.restrictions,
                justification: editingRequest.justification,
              }
            : null
        }
        submitLabel={editingRequest ? 'Enregistrer les modifications' : 'Soumettre la demande'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold text-gray-900">Gestion des applications Cerbère</h3>
          <p className="text-gray-600">
            Applications, profils et demandes d'habilitation
          </p>
        </div>
        {pendingRequestsCount > 0 && (
          <Badge className="w-full lg:w-auto justify-center bg-orange-500 text-white px-4 py-2 text-base">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {pendingRequestsCount} demande{pendingRequestsCount > 1 ? 's' : ''} en attente
          </Badge>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('applications')}
          className={`whitespace-nowrap px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'applications'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Applications et profils</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`whitespace-nowrap px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'requests'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Demandes d'habilitation</span>
            {pendingRequestsCount > 0 && (
              <Badge className="bg-orange-500 text-white ml-2">{pendingRequestsCount}</Badge>
            )}
          </div>
        </button>
      </div>

      {/* Contenu - Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:flex-1 lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une application..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300"
                />
              </div>
            </div>
            {userRole === 'admin' ? (
              <Button
                onClick={() => {
                  setFormData({ code: '', nom: '', description: '' });
                  setIsAddAppDialogOpen(true);
                }}
                className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle application
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setActiveTab('requests');
                  setCurrentView('form');
                }}
                className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Faire une demande
              </Button>
            )}
          </div>

          <div className="grid gap-6">
            {applications.map((app) => (
              <Card key={app.id} className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl break-words">{app.nom}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {app.code}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="mt-2">{app.description}</CardDescription>
                    </div>
                    {userRole === 'admin' ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(app);
                            setFormData({
                              code: app.code,
                              nom: app.nom,
                              description: app.description,
                            });
                            setIsEditAppDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsDeleteAppDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Profils ({app.profils.length})
                      </h4>
                      {userRole === 'admin' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProfilFormData({
                              applicationId: app.id,
                              identifiant: '',
                              description: '',
                            });
                            setIsAddProfilDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter un profil
                        </Button>
                      ) : null}
                    </div>

                    {app.profils.length > 0 ? (
                      <div className="space-y-2">
                        {app.profils.map((profil) => (
                          <div
                            key={profil.id}
                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {profil.identifiant}
                              </p>
                              <p className="text-sm text-gray-600">{profil.description}</p>
                            </div>
                            {userRole === 'admin' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteProfil(app.id, profil.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucun profil défini pour cette application
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contenu - Demandes d'habilitation */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="w-full xl:flex-1 xl:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une demande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente_chef">En attente chef</SelectItem>
                  <SelectItem value="en_attente_admin">En attente admin</SelectItem>
                  <SelectItem value="validee">Validées</SelectItem>
                  <SelectItem value="refusee">Refusées</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setCurrentView('form')}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Button>
            </div>
          </div>

          {userRole === 'chef_service' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-1">
                <Select
                  value={chefScopeFilter}
                  onValueChange={(value: 'all' | 'moi' | 'mes_agents') => setChefScopeFilter(value)}
                >
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Filtrer mes demandes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes mes demandes</SelectItem>
                    <SelectItem value="moi">Moi</SelectItem>
                    <SelectItem value="mes_agents">Mes agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {userRole === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={adminServiceFilter} onValueChange={setAdminServiceFilter}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {adminServiceOptions.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={adminDomainFilter} onValueChange={setAdminDomainFilter}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {adminDomainOptions.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={adminLocationFilter} onValueChange={setAdminLocationFilter}>
                <SelectTrigger className="bg-white border-slate-300">
                  <SelectValue placeholder="Lieu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lieux</SelectItem>
                  {adminLocationOptions.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {request.agentConcerne.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 break-words">{request.agentConcerne}</p>
                        <p className="text-sm text-gray-600">Demandeur : {request.demandeur}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {getStatusBadge(request.statut)}
                      <p className="text-xs text-gray-500">
                        Soumise le {new Date(request.soumiseLe).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Applications</p>
                    <div className="flex flex-wrap gap-1">
                      {request.applications.map((app, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {app}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {request.profils.map((profil, idx) => (
                        <Badge key={idx} className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                          {profil}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Règle de portée</p>
                      <p className="text-sm text-gray-800 break-words">{request.reglePortee}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Restrictions</p>
                      <p className="text-sm text-gray-800 break-words">{request.restrictions || 'Aucune'}</p>
                    </div>
                  </div>

                  {request.valideePar && (
                    <p className="text-xs text-gray-500">
                      Par {request.valideePar} le {new Date(request.dateValidation!).toLocaleDateString('fr-FR')}
                    </p>
                  )}

                  {request.statut === 'validee' ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <p className="text-xs text-green-900">
                        Demande validée par le chef de service
                        {request.chefValidationPar ? ` (${request.chefValidationPar})` : ''} et par
                        l'administrateur
                        {request.valideePar ? ` (${request.valideePar})` : ''}.
                      </p>
                    </div>
                  ) : null}

                  {request.statut === 'en_attente_admin' && userRole === 'admin' ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:flex-1"
                        onClick={() => {
                          setSelectedRequest(request);
                          setCurrentView('detail');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsValidateDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:flex-1 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsRejectDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:flex-1"
                        onClick={() => {
                          setSelectedRequest(request);
                          setCurrentView('detail');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      {userRole === 'chef_service' &&
                      request.statut === 'en_attente_chef' &&
                      normalize(request.agentConcerne) !== normalize(currentUserName) ? (
                        <>
                          <Button
                            size="sm"
                            className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsValidateDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valider
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:flex-1 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Refuser
                          </Button>
                        </>
                      ) : null}
                      {userRole !== 'admin' &&
                      (request.statut === 'en_attente_chef' ||
                        request.statut === 'en_attente_admin') ? (
                        <Button
                          size="sm"
                          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            setEditingRequest(request);
                            setCurrentView('form');
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredRequests.length === 0 && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune demande trouvée</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Dialog - Ajouter une application */}
      <Dialog open={isAddAppDialogOpen} onOpenChange={setIsAddAppDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle application Cerbère</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle application au catalogue Cerbère
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="Ex: CHORUS"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                placeholder="Ex: Chorus Pro"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'application"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddAppDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleAddApplication}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Modifier une application */}
      <Dialog open={isEditAppDialogOpen} onOpenChange={setIsEditAppDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'application</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom *</Label>
              <Input
                id="edit-nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditAppDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleEditApplication}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Ajouter un profil */}
      <Dialog open={isAddProfilDialogOpen} onOpenChange={setIsAddProfilDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau profil</DialogTitle>
            <DialogDescription>
              Ajoutez un profil d'accès pour cette application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profil-identifiant">Identifiant du profil *</Label>
              <Input
                id="profil-identifiant"
                placeholder="Ex: CHORUS_GESTIONNAIRE"
                value={profilFormData.identifiant}
                onChange={(e) =>
                  setProfilFormData({ ...profilFormData, identifiant: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profil-description">Description détaillée</Label>
              <Textarea
                id="profil-description"
                placeholder="Décrivez les droits et responsabilités de ce profil"
                rows={3}
                value={profilFormData.description}
                onChange={(e) =>
                  setProfilFormData({ ...profilFormData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddProfilDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleAddProfil}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Valider une demande */}
      <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Valider la demande</DialogTitle>
            <DialogDescription>
              {userRole === 'chef_service'
                ? "En validant cette demande, elle passera en attente de validation administrateur."
                : "Confirmez la validation de cette demande d'habilitation."}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3 py-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-gray-700">
                  <strong>Agent :</strong> {selectedRequest.agentConcerne}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Applications :</strong> {selectedRequest.applications.join(', ')}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Profils :</strong> {selectedRequest.profils.join(', ')}
                </p>
              </div>
              {userRole === 'chef_service' ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-900">
                    Cette demande n'est pas encore validée définitivement. Elle devra être validée par
                    l'administrateur. L'attestation sera disponible uniquement après validation
                    administrateur.
                  </p>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsValidateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              onClick={handleValidateRequest}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Refuser une demande */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              Indiquez le motif de refus de cette demande d'habilitation
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-gray-700">
                  <strong>Agent :</strong> {selectedRequest.agentConcerne}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Applications :</strong> {selectedRequest.applications.join(', ')}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Motif de refus *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Expliquez la raison du refus..."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              onClick={handleRejectRequest}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Supprimer une application */}
      <AlertDialog open={isDeleteAppDialogOpen} onOpenChange={setIsDeleteAppDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'application "{selectedApp?.nom}" ?
              Tous les profils associés seront également supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApplication}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}