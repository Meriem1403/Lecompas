import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  Fish,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Eye,
  Search,
  Calendar,
  MapPin,
  Mail,
  User,
  Ship,
  FileText,
  Filter,
} from 'lucide-react';
import { FishingAuthorization, FishingZone } from '../FishermanView';

interface MyAuthorizationsProps {
  authorizations: FishingAuthorization[];
  onBack: () => void;
}

export function MyAuthorizations({ authorizations: propsAuthorizations, onBack }: MyAuthorizationsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedAuthorization, setSelectedAuthorization] = useState<FishingAuthorization | null>(null);

  // Mock data for demonstration
  const mockAuthorizations: FishingAuthorization[] = [
    {
      id: 'auth-001',
      userId: 'user-1',
      zone: 'calanques',
      status: 'approved',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.fr',
      birthDate: '1985-06-15',
      address: '123 Avenue de la Mer',
      zipCode: '13008',
      city: 'Marseille',
      boatName: 'L\'Aventurier',
      boatRegistration: 'MA-123-AB',
      estimatedTrips: 25,
      hasPreviousDeclaration: true,
      isNewFisher: false,
      regulationAccepted: true,
      submittedDate: '2024-01-15T10:30:00Z',
      validatedDate: '2024-01-18T14:20:00Z',
      validatedBy: 'Gestionnaire Marine',
      adminComment: 'Autorisation approuvée. Tous les documents sont conformes.',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-18T14:20:00Z',
    },
    {
      id: 'auth-002',
      userId: 'user-1',
      zone: 'golfe_lion',
      status: 'pending',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.fr',
      birthDate: '1985-06-15',
      address: '123 Avenue de la Mer',
      zipCode: '13008',
      city: 'Marseille',
      estimatedTrips: 15,
      hasPreviousDeclaration: true,
      isNewFisher: false,
      regulationAccepted: true,
      submittedDate: '2024-02-01T09:15:00Z',
      createdAt: '2024-02-01T09:15:00Z',
      updatedAt: '2024-02-01T09:15:00Z',
    },
    {
      id: 'auth-003',
      userId: 'user-1',
      zone: 'cerbere_banyuls',
      status: 'approved',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.fr',
      birthDate: '1985-06-15',
      address: '123 Avenue de la Mer',
      zipCode: '13008',
      city: 'Marseille',
      boatName: 'L\'Aventurier',
      boatRegistration: 'MA-123-AB',
      estimatedTrips: 10,
      hasPreviousDeclaration: true,
      isNewFisher: false,
      regulationAccepted: true,
      submittedDate: '2023-11-20T11:00:00Z',
      validatedDate: '2023-11-23T16:45:00Z',
      validatedBy: 'Service des Pêches',
      adminComment: 'Dossier complet et validé.',
      createdAt: '2023-11-20T11:00:00Z',
      updatedAt: '2023-11-23T16:45:00Z',
    },
    {
      id: 'auth-004',
      userId: 'user-1',
      zone: 'bonifacio',
      status: 'rejected',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.fr',
      birthDate: '1985-06-15',
      address: '123 Avenue de la Mer',
      zipCode: '13008',
      city: 'Marseille',
      estimatedTrips: 20,
      hasPreviousDeclaration: false,
      isNewFisher: true,
      regulationAccepted: true,
      submittedDate: '2023-09-10T14:30:00Z',
      validatedDate: '2023-09-15T10:00:00Z',
      validatedBy: 'Commission Bonifacio',
      adminComment: 'Documents incomplets. Veuillez fournir la déclaration de captures précédente.',
      createdAt: '2023-09-10T14:30:00Z',
      updatedAt: '2023-09-15T10:00:00Z',
    },
  ];

  const allAuthorizations = propsAuthorizations.length > 0 ? propsAuthorizations : mockAuthorizations;

  const zoneNames: Record<FishingZone, string> = {
    golfe_lion: 'Parc naturel marin du Golfe du Lion',
    calanques: 'Parc national des Calanques',
    bonifacio: 'Réserve Naturelle des Bouches de Bonifacio',
    cap_corse: 'Parc naturel marin du Cap Corse et de l\'Agriate',
    cerbere_banyuls: 'RNN Marine de Cerbère-Banyuls',
    mediterranee: 'Méditerranée (hors parc marin réglementé)',
  };

  const zoneColors: Record<FishingZone, string> = {
    golfe_lion: 'from-blue-400 to-cyan-500',
    calanques: 'from-emerald-400 to-teal-500',
    bonifacio: 'from-purple-400 to-indigo-500',
    cap_corse: 'from-orange-400 to-amber-500',
    cerbere_banyuls: 'from-rose-400 to-pink-500',
    mediterranee: 'from-sky-400 to-blue-500',
  };

  const filteredAuthorizations = allAuthorizations.filter(auth => {
    const matchesSearch = 
      auth.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zoneNames[auth.zone].toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || auth.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: allAuthorizations.length,
    approved: allAuthorizations.filter(a => a.status === 'approved').length,
    pending: allAuthorizations.filter(a => a.status === 'pending').length,
    rejected: allAuthorizations.filter(a => a.status === 'rejected').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approuvée
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0">
            <XCircle className="h-3 w-3 mr-1" />
            Refusée
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileText className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words">
                Mes autorisations
              </h1>
              <p className="text-gray-600 mt-1">
                Consultez l'état de vos demandes d'autorisation de pêche
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Approuvées</p>
                <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Refusées</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par zone..."
                    className="pl-10 bg-white border-2 border-slate-300 hover:border-blue-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 w-full md:w-auto">
                <Button
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  className={`${filterStatus === 'all' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' : ''} w-full`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Toutes
                </Button>
                <Button
                  onClick={() => setFilterStatus('approved')}
                  variant={filterStatus === 'approved' ? 'default' : 'outline'}
                  className={`${filterStatus === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : ''} w-full`}
                >
                  Approuvées
                </Button>
                <Button
                  onClick={() => setFilterStatus('pending')}
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  className={`${filterStatus === 'pending' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : ''} w-full`}
                >
                  En attente
                </Button>
                <Button
                  onClick={() => setFilterStatus('rejected')}
                  variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                  className={`${filterStatus === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' : ''} w-full`}
                >
                  Refusées
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authorizations List */}
        {filteredAuthorizations.length === 0 ? (
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="pt-12 pb-12 text-center">
              <Fish className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune autorisation trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAuthorizations.map((auth) => (
              <Card
                key={auth.id}
                className={`shadow-lg border-2 hover:shadow-xl transition-all ${
                  auth.status === 'approved'
                    ? 'border-green-300 bg-gradient-to-br from-green-50/50 to-emerald-50/50'
                    : auth.status === 'pending'
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-orange-50/50'
                    : 'border-red-300 bg-gradient-to-br from-red-50/50 to-rose-50/50'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${zoneColors[auth.zone]} flex items-center justify-center shadow-lg shrink-0`}>
                        <Fish className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <CardTitle className="text-xl break-words">{zoneNames[auth.zone]}</CardTitle>
                          {getStatusBadge(auth.status)}
                        </div>
                        <CardDescription className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm">
                          <span className="flex items-center gap-1 break-words">
                            <Calendar className="h-3 w-3" />
                            Demandée le {formatDate(auth.submittedDate)}
                          </span>
                          {auth.validatedDate && (
                            <span className="flex items-center gap-1 break-words">
                              <CheckCircle2 className="h-3 w-3" />
                              Traitée le {formatDate(auth.validatedDate)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto xl:shrink-0">
                      <Button
                        onClick={() => setSelectedAuthorization(auth)}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto border-2 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      {auth.status === 'approved' && (
                        <Button
                          size="sm"
                          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Sorties estimées</p>
                      <p className="font-semibold">{auth.estimatedTrips} / an</p>
                    </div>
                    {auth.boatName && (
                      <div>
                        <p className="text-gray-500 mb-1">Bateau</p>
                        <p className="font-semibold">{auth.boatName}</p>
                      </div>
                    )}
                    {auth.boatRegistration && (
                      <div>
                        <p className="text-gray-500 mb-1">Immatriculation</p>
                        <p className="font-semibold">{auth.boatRegistration}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 mb-1">N° dossier</p>
                      <p className="font-semibold font-mono text-xs break-all">{auth.id}</p>
                    </div>
                  </div>

                  {auth.adminComment && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      auth.status === 'approved'
                        ? 'bg-green-100 border border-green-300'
                        : auth.status === 'rejected'
                        ? 'bg-red-100 border border-red-300'
                        : 'bg-amber-100 border border-amber-300'
                    }`}>
                      <p className="text-sm">
                        <strong>Commentaire :</strong> {auth.adminComment}
                      </p>
                      {auth.validatedBy && (
                        <p className="text-xs text-gray-600 mt-1">
                          Par {auth.validatedBy}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedAuthorization && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-6 z-50" onClick={() => setSelectedAuthorization(null)}>
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardHeader className={`bg-gradient-to-r ${
                selectedAuthorization.status === 'approved'
                  ? 'from-green-100 to-emerald-100 border-b-2 border-green-200'
                  : selectedAuthorization.status === 'pending'
                  ? 'from-amber-100 to-orange-100 border-b-2 border-amber-200'
                  : 'from-red-100 to-rose-100 border-b-2 border-red-200'
              }`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-2xl mb-2">
                      Détails de l'autorisation
                    </CardTitle>
                    <CardDescription className="break-words">
                      {zoneNames[selectedAuthorization.zone]}
                    </CardDescription>
                  </div>
                  {getStatusBadge(selectedAuthorization.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Personal Info */}
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Nom complet</p>
                      <p className="font-semibold">{selectedAuthorization.firstName} {selectedAuthorization.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-semibold">{selectedAuthorization.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date de naissance</p>
                      <p className="font-semibold">{formatDate(selectedAuthorization.birthDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ville</p>
                      <p className="font-semibold">{selectedAuthorization.city} ({selectedAuthorization.zipCode})</p>
                    </div>
                  </div>
                </div>

                {/* Fishing Info */}
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Ship className="h-5 w-5 text-cyan-600" />
                    Informations de pêche
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Sorties estimées</p>
                      <p className="font-semibold">{selectedAuthorization.estimatedTrips} / an</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Nouveau pêcheur</p>
                      <p className="font-semibold">{selectedAuthorization.isNewFisher ? 'Oui' : 'Non'}</p>
                    </div>
                    {selectedAuthorization.boatName && (
                      <>
                        <div>
                          <p className="text-gray-500">Nom du bateau</p>
                          <p className="font-semibold">{selectedAuthorization.boatName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Immatriculation</p>
                          <p className="font-semibold">{selectedAuthorization.boatRegistration}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Dates importantes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Date de soumission</p>
                      <p className="font-semibold">{formatDate(selectedAuthorization.submittedDate)}</p>
                    </div>
                    {selectedAuthorization.validatedDate && (
                      <div>
                        <p className="text-gray-500">Date de traitement</p>
                        <p className="font-semibold">{formatDate(selectedAuthorization.validatedDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAuthorization.adminComment && (
                  <div className={`p-4 rounded-lg ${
                    selectedAuthorization.status === 'approved'
                      ? 'bg-green-100 border-2 border-green-300'
                      : selectedAuthorization.status === 'rejected'
                      ? 'bg-red-100 border-2 border-red-300'
                      : 'bg-amber-100 border-2 border-amber-300'
                  }`}>
                    <p className="font-semibold mb-2">Commentaire de l'administration</p>
                    <p className="text-sm">{selectedAuthorization.adminComment}</p>
                    {selectedAuthorization.validatedBy && (
                      <p className="text-xs text-gray-600 mt-2">
                        Validé par : {selectedAuthorization.validatedBy}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                  <Button onClick={() => setSelectedAuthorization(null)} variant="outline">
                    Fermer
                  </Button>
                  {selectedAuthorization.status === 'approved' && (
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
