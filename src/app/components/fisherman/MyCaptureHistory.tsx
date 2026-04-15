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
  Edit,
  Trash2,
  Eye,
  Search,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Scale,
  Ruler,
  Target,
  Filter,
  PlusCircle,
  XCircle,
} from 'lucide-react';
import { CaptureRecord, FishingZone } from '../FishermanView';
import { toast } from 'sonner';

interface MyCaptureHistoryProps {
  captures: CaptureRecord[];
  onEdit: (capture: CaptureRecord) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export function MyCaptureHistory({ captures: propsCaptures, onEdit, onDelete, onBack }: MyCaptureHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'submitted' | 'validated'>('all');
  const [selectedCapture, setSelectedCapture] = useState<CaptureRecord | null>(null);

  // Mock data for demonstration
  const mockCaptures: CaptureRecord[] = [
    {
      id: 'cap-001',
      userId: 'user-1',
      authorizationId: 'auth-001',
      zone: 'calanques',
      captureDate: '2024-02-03',
      captureTime: '08:30',
      location: 'Calanque de Sormiou',
      isNoCatch: false,
      captures: [
        {
          id: 'c1',
          species: 'Loup (Bar)',
          quantity: 2,
          size: 45,
          weight: 1.8,
          technique: 'Leurre souple',
          photo: undefined,
        },
        {
          id: 'c2',
          species: 'Daurade royale',
          quantity: 1,
          size: 38,
          weight: 1.2,
          technique: 'Pêche au flotteur',
          photo: undefined,
        },
      ],
      status: 'validated',
      validatedBy: 'Gestionnaire Marine',
      validatedDate: '2024-02-03T15:00:00Z',
      createdAt: '2024-02-03T09:15:00Z',
      updatedAt: '2024-02-03T15:00:00Z',
    },
    {
      id: 'cap-002',
      userId: 'user-1',
      authorizationId: 'auth-001',
      zone: 'calanques',
      captureDate: '2024-02-01',
      captureTime: '14:00',
      location: 'Calanque de Morgiou',
      isNoCatch: false,
      captures: [
        {
          id: 'c3',
          species: 'Sar commun',
          quantity: 3,
          size: 25,
          weight: 0.8,
          technique: 'Ligne à main',
          photo: undefined,
        },
      ],
      status: 'submitted',
      createdAt: '2024-02-01T16:30:00Z',
      updatedAt: '2024-02-01T16:30:00Z',
    },
    {
      id: 'cap-003',
      userId: 'user-1',
      authorizationId: 'auth-002',
      zone: 'golfe_lion',
      captureDate: '2024-01-28',
      captureTime: '07:15',
      location: 'Large du Cap Leucate',
      isNoCatch: true,
      captures: [],
      status: 'validated',
      validatedBy: 'Service Pêche',
      validatedDate: '2024-01-28T18:00:00Z',
      createdAt: '2024-01-28T12:00:00Z',
      updatedAt: '2024-01-28T18:00:00Z',
    },
    {
      id: 'cap-004',
      userId: 'user-1',
      authorizationId: 'auth-003',
      zone: 'cerbere_banyuls',
      captureDate: '2024-01-25',
      captureTime: '10:45',
      location: 'Réserve de Banyuls',
      isNoCatch: false,
      captures: [
        {
          id: 'c4',
          species: 'Pageot',
          quantity: 4,
          size: 22,
          weight: 0.6,
          technique: 'Palangrotte',
          photo: undefined,
        },
        {
          id: 'c5',
          species: 'Rouget',
          quantity: 2,
          size: 18,
          weight: 0.3,
          technique: 'Palangrotte',
          photo: undefined,
        },
      ],
      status: 'validated',
      validatedBy: 'Commission Banyuls',
      validatedDate: '2024-01-26T10:00:00Z',
      createdAt: '2024-01-25T14:20:00Z',
      updatedAt: '2024-01-26T10:00:00Z',
    },
    {
      id: 'cap-005',
      userId: 'user-1',
      authorizationId: 'auth-001',
      zone: 'calanques',
      captureDate: '2024-02-05',
      captureTime: '06:00',
      location: 'Calanque En-Vau',
      isNoCatch: false,
      captures: [
        {
          id: 'c6',
          species: 'Denti',
          quantity: 1,
          size: 52,
          weight: 2.5,
          technique: 'Jig',
          photo: undefined,
        },
      ],
      status: 'draft',
      createdAt: '2024-02-05T08:30:00Z',
      updatedAt: '2024-02-05T08:30:00Z',
    },
  ];

  const allCaptures = propsCaptures.length > 0 ? propsCaptures : mockCaptures;

  const zoneNames: Record<FishingZone, string> = {
    golfe_lion: 'Golfe du Lion',
    calanques: 'Parc des Calanques',
    bonifacio: 'Bouches de Bonifacio',
    cap_corse: 'Cap Corse',
    cerbere_banyuls: 'Cerbère-Banyuls',
    mediterranee: 'Méditerranée',
  };

  const zoneColors: Record<FishingZone, string> = {
    golfe_lion: 'from-blue-400 to-cyan-500',
    calanques: 'from-emerald-400 to-teal-500',
    bonifacio: 'from-purple-400 to-indigo-500',
    cap_corse: 'from-orange-400 to-amber-500',
    cerbere_banyuls: 'from-rose-400 to-pink-500',
    mediterranee: 'from-sky-400 to-blue-500',
  };

  const filteredCaptures = allCaptures.filter(capture => {
    const matchesSearch = 
      capture.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capture.captures.some(c => c.species.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || capture.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: allCaptures.length,
    validated: allCaptures.filter(c => c.status === 'validated').length,
    submitted: allCaptures.filter(c => c.status === 'submitted').length,
    draft: allCaptures.filter(c => c.status === 'draft').length,
    totalFish: allCaptures.reduce((sum, c) => sum + c.captures.reduce((s, cap) => s + cap.quantity, 0), 0),
    noCatch: allCaptures.filter(c => c.isNoCatch).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Validée
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gradient-to-r from-gray-400 to-slate-500 text-white border-0">
            <Edit className="h-3 w-3 mr-1" />
            Brouillon
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

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette déclaration ?')) {
      onDelete(id);
      toast.success('Déclaration supprimée');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <Fish className="h-9 w-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Mes déclarations de capture
                </h1>
                <p className="text-gray-600 mt-1">
                  Historique de vos captures déclarées
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
              size="lg"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Nouvelle déclaration
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">Validées</p>
                <p className="text-2xl font-bold text-green-900">{stats.validated}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-cyan-900">{stats.submitted}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">Total poissons</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalFish}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-gray-600">Sans capture</p>
                <p className="text-2xl font-bold text-amber-900">{stats.noCatch}</p>
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
                    placeholder="Rechercher par lieu ou espèce..."
                    className="pl-10 border-2 hover:border-blue-300"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterStatus('all')}
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  className={filterStatus === 'all' ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Toutes
                </Button>
                <Button
                  onClick={() => setFilterStatus('validated')}
                  variant={filterStatus === 'validated' ? 'default' : 'outline'}
                  className={filterStatus === 'validated' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : ''}
                >
                  Validées
                </Button>
                <Button
                  onClick={() => setFilterStatus('submitted')}
                  variant={filterStatus === 'submitted' ? 'default' : 'outline'}
                  className={filterStatus === 'submitted' ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white' : ''}
                >
                  En attente
                </Button>
                <Button
                  onClick={() => setFilterStatus('draft')}
                  variant={filterStatus === 'draft' ? 'default' : 'outline'}
                  className={filterStatus === 'draft' ? 'bg-gradient-to-r from-gray-400 to-slate-500 text-white' : ''}
                >
                  Brouillons
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Captures List */}
        {filteredCaptures.length === 0 ? (
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="pt-12 pb-12 text-center">
              <Fish className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune déclaration trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCaptures.map((capture) => (
              <Card
                key={capture.id}
                className={`shadow-lg border-2 hover:shadow-xl transition-all ${
                  capture.status === 'validated'
                    ? 'border-green-300 bg-gradient-to-br from-green-50/50 to-emerald-50/50'
                    : capture.status === 'submitted'
                    ? 'border-cyan-300 bg-gradient-to-br from-cyan-50/50 to-teal-50/50'
                    : 'border-gray-300 bg-gradient-to-br from-gray-50/50 to-slate-50/50'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${zoneColors[capture.zone]} flex items-center justify-center shadow-lg shrink-0`}>
                        {capture.isNoCatch ? (
                          <XCircle className="h-8 w-8 text-white" />
                        ) : (
                          <Fish className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {capture.isNoCatch ? 'Aucune capture' : `${capture.captures.reduce((sum, c) => sum + c.quantity, 0)} poisson(s)`}
                          </CardTitle>
                          {getStatusBadge(capture.status)}
                        </div>
                        <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {capture.location} - {zoneNames[capture.zone]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(capture.captureDate)} à {capture.captureTime}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedCapture(capture)}
                        size="sm"
                        variant="outline"
                        className="border-2 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      {capture.status === 'draft' && (
                        <>
                          <Button
                            onClick={() => onEdit(capture)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            onClick={() => handleDelete(capture.id)}
                            size="sm"
                            variant="outline"
                            className="border-2 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {!capture.isNoCatch && capture.captures.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {capture.captures.map((fish) => (
                        <div
                          key={fish.id}
                          className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                              <Fish className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{fish.species}</p>
                              <p className="text-xs text-gray-600">{fish.technique}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500 text-xs">Quantité</p>
                              <p className="font-bold text-blue-900">{fish.quantity}</p>
                            </div>
                            {fish.size && (
                              <div className="text-center">
                                <p className="text-gray-500 text-xs flex items-center gap-1 justify-center">
                                  <Ruler className="h-3 w-3" /> Taille
                                </p>
                                <p className="font-bold text-cyan-900">{fish.size} cm</p>
                              </div>
                            )}
                            {fish.weight && (
                              <div className="text-center">
                                <p className="text-gray-500 text-xs flex items-center gap-1 justify-center">
                                  <Scale className="h-3 w-3" /> Poids
                                </p>
                                <p className="font-bold text-teal-900">{fish.weight} kg</p>
                              </div>
                            )}
                            {fish.photo && (
                              <div>
                                <Badge variant="outline" className="bg-purple-50 border-purple-300">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Photo
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {capture.validatedBy && (
                      <div className="mt-4 p-3 rounded-lg bg-green-100 border border-green-300">
                        <p className="text-sm">
                          <strong>Validé par :</strong> {capture.validatedBy}
                        </p>
                        {capture.validatedDate && (
                          <p className="text-xs text-gray-600 mt-1">
                            Le {formatDate(capture.validatedDate)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedCapture && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setSelectedCapture(null)}>
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardHeader className={`bg-gradient-to-r ${
                selectedCapture.status === 'validated'
                  ? 'from-green-100 to-emerald-100 border-b-2 border-green-200'
                  : selectedCapture.status === 'submitted'
                  ? 'from-cyan-100 to-teal-100 border-b-2 border-cyan-200'
                  : 'from-gray-100 to-slate-100 border-b-2 border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      Détails de la déclaration
                    </CardTitle>
                    <CardDescription>
                      {selectedCapture.location} - {zoneNames[selectedCapture.zone]}
                    </CardDescription>
                  </div>
                  {getStatusBadge(selectedCapture.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Date & Location */}
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Date et lieu
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Date de pêche</p>
                      <p className="font-semibold">{formatDate(selectedCapture.captureDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Heure</p>
                      <p className="font-semibold">{selectedCapture.captureTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Lieu</p>
                      <p className="font-semibold">{selectedCapture.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Zone</p>
                      <p className="font-semibold">{zoneNames[selectedCapture.zone]}</p>
                    </div>
                  </div>
                </div>

                {/* Captures */}
                {selectedCapture.isNoCatch ? (
                  <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-lg text-center">
                    <XCircle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                    <p className="font-bold text-amber-900 text-lg">Aucune capture déclarée</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Cette déclaration d'absence de capture est importante pour les données scientifiques
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Fish className="h-5 w-5 text-cyan-600" />
                      Captures ({selectedCapture.captures.length} espèce(s))
                    </h3>
                    <div className="space-y-3">
                      {selectedCapture.captures.map((fish) => (
                        <div
                          key={fish.id}
                          className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-lg text-blue-900">{fish.species}</h4>
                              <p className="text-sm text-gray-600">{fish.technique}</p>
                            </div>
                            {fish.photo && (
                              <Badge className="bg-purple-500 text-white">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Photo disponible
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-gray-500 mb-1">Quantité</p>
                              <p className="text-2xl font-bold text-blue-900">{fish.quantity}</p>
                            </div>
                            {fish.size && (
                              <div className="text-center p-3 bg-white rounded-lg border border-cyan-200">
                                <p className="text-gray-500 mb-1 flex items-center gap-1 justify-center">
                                  <Ruler className="h-3 w-3" /> Taille
                                </p>
                                <p className="text-2xl font-bold text-cyan-900">{fish.size} <span className="text-sm">cm</span></p>
                              </div>
                            )}
                            {fish.weight && (
                              <div className="text-center p-3 bg-white rounded-lg border border-teal-200">
                                <p className="text-gray-500 mb-1 flex items-center gap-1 justify-center">
                                  <Scale className="h-3 w-3" /> Poids
                                </p>
                                <p className="text-2xl font-bold text-teal-900">{fish.weight} <span className="text-sm">kg</span></p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation */}
                {selectedCapture.validatedBy && (
                  <div className="p-4 rounded-lg bg-green-100 border-2 border-green-300">
                    <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Validation
                    </h3>
                    <p className="text-sm">
                      <strong>Validé par :</strong> {selectedCapture.validatedBy}
                    </p>
                    {selectedCapture.validatedDate && (
                      <p className="text-sm text-gray-700 mt-1">
                        Le {formatDate(selectedCapture.validatedDate)}
                      </p>
                    )}
                    {selectedCapture.adminComment && (
                      <p className="text-sm mt-2 p-2 bg-white rounded border border-green-200">
                        {selectedCapture.adminComment}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <Button onClick={() => setSelectedCapture(null)} variant="outline">
                    Fermer
                  </Button>
                  {selectedCapture.status === 'draft' && (
                    <>
                      <Button
                        onClick={() => {
                          onEdit(selectedCapture);
                          setSelectedCapture(null);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => {
                          handleDelete(selectedCapture.id);
                          setSelectedCapture(null);
                        }}
                        variant="outline"
                        className="border-2 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </>
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
