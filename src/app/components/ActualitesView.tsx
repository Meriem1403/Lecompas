import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
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
  Bell,
  AlertCircle,
  Info,
  AlertTriangle,
  Wrench,
  Calendar,
  Eye,
  Filter,
  FileText,
  Paperclip,
  CalendarCheck,
  Clock,
  MapPinned,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { ActualiteFormPage } from '@/app/components/ActualiteFormPage';
import { ActualiteDetailPage } from '@/app/components/ActualiteDetailPage';
import { ListPaginationBar } from '@/app/components/ui/list-pagination-bar';

interface Document {
  id: string;
  nom: string;
  type: string;
  url: string;
  taille: string;
}

interface Lien {
  id: string;
  titre: string;
  url: string;
}

interface Actualite {
  id: string;
  titre: string;
  contenu: string;
  type: 'info' | 'alerte' | 'urgent' | 'maintenance' | 'evenement' | 'document';
  auteur: string;
  dateCreation: string;
  dateExpiration?: string;
  dateEvenement?: string;
  heureDebut?: string;
  heureFin?: string;
  lieuEvenement?: string;
  imageUrl?: string;
  documents?: Document[];
  liens?: Lien[];
  destinataires: {
    roles: string[];
    services: string[];
    domaines: string[];
    lieux: string[];
    categories: string[];
  };
  estPublie: boolean;
  vuesPar: string[];
}

// Données fictives avec images, documents et liens
const mockActualites: Actualite[] = [
  {
    id: 'a1',
    titre: 'Mise à jour du système DUERP',
    contenu:
      'Une nouvelle version du système DUERP sera déployée le 10 février 2026. Cette mise à jour apportera de nouvelles fonctionnalités pour la gestion des risques chimiques et biologiques.',
    type: 'info',
    auteur: 'Admin Système',
    dateCreation: '2026-02-01',
    dateExpiration: '2026-02-15',
    imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    documents: [
      {
        id: 'd1',
        nom: 'Guide_mise_a_jour_DUERP.pdf',
        type: 'pdf',
        url: '#',
        taille: '2.4 MB',
      },
    ],
    liens: [
      {
        id: 'l1',
        titre: 'Documentation officielle',
        url: 'https://www.travail-emploi.gouv.fr/sante-au-travail/prevention-des-risques/duerp',
      },
    ],
    destinataires: {
      roles: ['admin', 'chef_service', 'agent'],
      services: [],
      domaines: [],
      lieux: [],
      categories: [],
    },
    estPublie: true,
    vuesPar: ['user1', 'user3'],
  },
  {
    id: 'a2',
    titre: 'Formation obligatoire - Sécurité incendie',
    contenu:
      'Tous les agents du service technique doivent suivre la formation sécurité incendie avant le 28 février 2026. Inscriptions ouvertes sur l\'intranet.',
    type: 'evenement',
    auteur: 'Marie Leroy',
    dateCreation: '2026-01-25',
    dateExpiration: '2026-02-28',
    dateEvenement: '2026-02-20',
    heureDebut: '09:00',
    heureFin: '17:00',
    lieuEvenement: 'Salle de formation - Bâtiment A',
    imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80',
    liens: [
      {
        id: 'l2',
        titre: 'Programme de formation',
        url: 'https://www.inrs.fr/risques/incendie-lieu-travail.html',
      },
      {
        id: 'l3',
        titre: 'S\'inscrire à la formation',
        url: '#',
      },
    ],
    destinataires: {
      roles: ['agent', 'chef_service'],
      services: ['Service Technique'],
      domaines: [],
      lieux: [],
      categories: [],
    },
    estPublie: true,
    vuesPar: [],
  },
  {
    id: 'a3',
    titre: 'URGENT - Nouveau protocole COVID-19',
    contenu:
      'Suite aux nouvelles directives gouvernementales, un protocole sanitaire renforcé est mis en place immédiatement. Port du masque obligatoire dans tous les espaces clos.',
    type: 'urgent',
    auteur: 'Admin Système',
    dateCreation: '2026-02-02',
    documents: [
      {
        id: 'd2',
        nom: 'Protocole_sanitaire_2026.pdf',
        type: 'pdf',
        url: '#',
        taille: '856 KB',
      },
      {
        id: 'd3',
        nom: 'Consignes_masques.pdf',
        type: 'pdf',
        url: '#',
        taille: '412 KB',
      },
    ],
    destinataires: {
      roles: ['admin', 'chef_service', 'agent'],
      services: [],
      domaines: [],
      lieux: [],
      categories: [],
    },
    estPublie: true,
    vuesPar: ['user2'],
  },
  {
    id: 'a4',
    titre: 'Nouveaux EPI disponibles',
    contenu:
      'De nouveaux équipements de protection individuelle sont disponibles au magasin. Casques anti-bruit, gants haute protection et lunettes de sécurité.',
    type: 'info',
    auteur: 'Jean Dupont',
    dateCreation: '2026-01-30',
    imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
    destinataires: {
      roles: ['agent'],
      services: ['Service Affaires Maritimes', 'Service Technique'],
      domaines: [],
      lieux: ['Port de Marseille'],
      categories: [],
    },
    estPublie: true,
    vuesPar: ['user1', 'user2', 'user4'],
  },
  {
    id: 'a5',
    titre: 'Rapport annuel DUERP 2025',
    contenu:
      'Le rapport annuel du Document Unique d\'Évaluation des Risques Professionnels pour l\'année 2025 est maintenant disponible. Consultez les statistiques et les actions menées.',
    type: 'document',
    auteur: 'Responsable HSE',
    dateCreation: '2026-01-15',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    documents: [
      {
        id: 'd4',
        nom: 'DUERP_Rapport_Annuel_2025.pdf',
        type: 'pdf',
        url: '#',
        taille: '5.2 MB',
      },
      {
        id: 'd5',
        nom: 'Statistiques_Risques_2025.xlsx',
        type: 'xlsx',
        url: '#',
        taille: '1.8 MB',
      },
    ],
    destinataires: {
      roles: ['admin', 'chef_service'],
      services: [],
      domaines: [],
      lieux: [],
      categories: [],
    },
    estPublie: true,
    vuesPar: ['user1'],
  },
];

type ViewMode = 'list' | 'new' | 'edit' | 'detail';
const ACTUALITES_PAGE_SIZE = 3;

export function ActualitesView({ userRole = 'agent' }: { userRole?: 'admin' | 'chef_service' | 'agent' }) {
  const [actualites, setActualites] = useState<Actualite[]>(mockActualites);
  const [filteredActualites, setFilteredActualites] = useState<Actualite[]>(mockActualites);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedActualite, setSelectedActualite] = useState<Actualite | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const currentUserId = 'user1';

  // Filtrage
  React.useEffect(() => {
    let filtered = actualites.filter((a) => a.estPublie);

    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    if (showOnlyUnread) {
      filtered = filtered.filter((a) => !a.vuesPar.includes(currentUserId));
    }

    filtered.sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime());

    setFilteredActualites(filtered);
  }, [actualites, filterType, showOnlyUnread]);

  const totalPages = Math.max(1, Math.ceil(filteredActualites.length / ACTUALITES_PAGE_SIZE));
  const paginatedActualites = React.useMemo(() => {
    const start = (currentPage - 1) * ACTUALITES_PAGE_SIZE;
    return filteredActualites.slice(start, start + ACTUALITES_PAGE_SIZE);
  }, [filteredActualites, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, showOnlyUnread]);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleMarkAsRead = (actualiteId: string) => {
    setActualites(
      actualites.map((a) =>
        a.id === actualiteId && !a.vuesPar.includes(currentUserId)
          ? { ...a, vuesPar: [...a.vuesPar, currentUserId] }
          : a
      )
    );
  };

  const handleViewDetail = (actualite: Actualite) => {
    setSelectedActualite(actualite);
    handleMarkAsRead(actualite.id);
    setViewMode('detail');
  };

  const handleNewActualite = () => {
    setSelectedActualite(null);
    setViewMode('new');
  };

  const handleEditActualite = (actualite: Actualite) => {
    setSelectedActualite(actualite);
    setViewMode('edit');
  };

  const handleSubmitActualite = (actualite: Actualite) => {
    if (viewMode === 'edit') {
      // Modification
      setActualites(actualites.map((a) => (a.id === actualite.id ? actualite : a)));
    } else {
      // Création
      setActualites([actualite, ...actualites]);
    }
    setViewMode('list');
  };

  const handleDeleteActualite = () => {
    if (!selectedActualite) return;
    setActualites(actualites.filter((a) => a.id !== selectedActualite.id));
    setIsDeleteDialogOpen(false);
    setSelectedActualite(null);
    setViewMode('list');
    toast.success('Actualité supprimée avec succès');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'alerte':
        return <AlertCircle className="h-5 w-5" />;
      case 'urgent':
        return <AlertTriangle className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'evenement':
        return <CalendarCheck className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Info</Badge>;
      case 'alerte':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Alerte</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Urgent</Badge>;
      case 'maintenance':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Maintenance</Badge>;
      case 'evenement':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Événement</Badge>;
      case 'document':
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300">Document</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'from-blue-500 to-cyan-500';
      case 'alerte':
        return 'from-orange-500 to-amber-500';
      case 'urgent':
        return 'from-red-500 to-rose-500';
      case 'maintenance':
        return 'from-purple-500 to-indigo-500';
      case 'evenement':
        return 'from-green-500 to-emerald-500';
      case 'document':
        return 'from-cyan-500 to-blue-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const unreadCount = actualites.filter(
    (a) => a.estPublie && !a.vuesPar.includes(currentUserId)
  ).length;

  // Affichage des pages dédiées
  if (viewMode === 'new' || viewMode === 'edit') {
    return (
      <ActualiteFormPage
        actualite={selectedActualite || undefined}
        onBack={() => setViewMode('list')}
        onSubmit={handleSubmitActualite}
      />
    );
  }

  if (viewMode === 'detail' && selectedActualite) {
    return (
      <ActualiteDetailPage
        actualite={selectedActualite}
        onBack={() => setViewMode('list')}
        onEdit={() => {
          setViewMode('edit');
        }}
        onDelete={() => {
          setIsDeleteDialogOpen(true);
        }}
        userRole={userRole}
      />
    );
  }

  // Affichage de la liste
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800 via-indigo-800 to-blue-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <CardHeader className="relative py-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <Bell className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl sm:text-4xl font-bold text-white mb-1">Actualités et notifications</CardTitle>
                <CardDescription className="text-slate-100 text-lg">
                  Informations, événements, documents et liens utiles
                </CardDescription>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="w-full lg:w-auto justify-center bg-white text-slate-900 border border-slate-200 text-xl px-6 py-3 shadow-xl">
                {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filtres et actions */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-56 bg-white border-2 border-slate-300">
                  <SelectValue placeholder="Type d'actualité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="alerte">Alerte</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="evenement">Événement</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border-2 border-blue-200">
                <Checkbox
                  id="showUnread"
                  checked={showOnlyUnread}
                  onCheckedChange={(checked) => setShowOnlyUnread(checked as boolean)}
                />
                <Label htmlFor="showUnread" className="cursor-pointer font-medium text-blue-900">
                  Non lues uniquement
                </Label>
              </div>
            </div>

            {userRole === 'admin' && (
              <Button
                size="lg"
                onClick={handleNewActualite}
                className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle actualité
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredActualites.length}
        onPageChange={setCurrentPage}
        itemLabel="actualité(s)"
      />

      {/* Liste des actualités */}
      <div className="space-y-4">
        {filteredActualites.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="h-12 w-12 text-blue-500" />
                </div>
                <p className="text-xl font-semibold text-gray-700">Aucune actualité à afficher</p>
                <p className="text-base mt-2">
                  {showOnlyUnread
                    ? 'Vous êtes à jour avec toutes les actualités'
                    : 'Aucune actualité publiée pour le moment'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          paginatedActualites.map((actualite) => {
            const isUnread = !actualite.vuesPar.includes(currentUserId);
            const isExpired = actualite.dateExpiration
              ? new Date(actualite.dateExpiration) < new Date()
              : false;

            return (
              <Card
                key={actualite.id}
                className={`transition-all hover:shadow-2xl cursor-pointer border-2 ${
                  isUnread ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50' : 'border-gray-200'
                } ${isExpired ? 'opacity-60' : ''}`}
                onClick={() => handleViewDetail(actualite)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image (si disponible) */}
                    {actualite.imageUrl && (
                      <div className="md:w-1/3 relative overflow-hidden">
                        <img
                          src={actualite.imageUrl}
                          alt={actualite.titre}
                          className="w-full h-full object-cover min-h-[200px]"
                        />
                        <div className={`absolute top-4 left-4 h-14 w-14 rounded-xl bg-gradient-to-br ${getTypeColor(actualite.type)} flex items-center justify-center text-white shadow-2xl`}>
                          {getTypeIcon(actualite.type)}
                        </div>
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {!actualite.imageUrl && (
                            <div
                              className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getTypeColor(
                                actualite.type
                              )} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                            >
                              {getTypeIcon(actualite.type)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                                {actualite.titre}
                              </h3>
                              {getTypeBadge(actualite.type)}
                              {isUnread && (
                                <Badge className="bg-blue-500 text-white">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Nouveau
                                </Badge>
                              )}
                              {isExpired && (
                                <Badge variant="outline" className="text-gray-500">
                                  Expirée
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-700 leading-relaxed line-clamp-2">{actualite.contenu}</p>

                            {/* Informations événement */}
                            {actualite.type === 'evenement' && actualite.dateEvenement && (
                              <div className="flex flex-wrap gap-4 text-sm p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                                <div className="flex items-center gap-2 text-green-700 font-medium">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(actualite.dateEvenement).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                                {actualite.heureDebut && (
                                  <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <Clock className="h-4 w-4" />
                                    {actualite.heureDebut} - {actualite.heureFin}
                                  </div>
                                )}
                                {actualite.lieuEvenement && (
                                  <div className="flex items-center gap-2 text-green-700 font-medium">
                                    <MapPinned className="h-4 w-4" />
                                    {actualite.lieuEvenement}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Liens et Documents */}
                            <div className="flex flex-wrap gap-2">
                              {actualite.liens && actualite.liens.length > 0 && (
                                <>
                                  {actualite.liens.map((lien) => (
                                    <Badge
                                      key={lien.id}
                                      variant="outline"
                                      className="bg-blue-50 border-blue-300 text-blue-800 px-3 py-1 cursor-pointer hover:bg-blue-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(lien.url, '_blank');
                                      }}
                                    >
                                      <LinkIcon className="h-3 w-3 mr-1" />
                                      {lien.titre}
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </Badge>
                                  ))}
                                </>
                              )}
                              {actualite.documents && actualite.documents.length > 0 && (
                                <>
                                  {actualite.documents.map((doc) => (
                                    <Badge
                                      key={doc.id}
                                      variant="outline"
                                      className="bg-cyan-50 border-cyan-300 text-cyan-800 px-3 py-1"
                                    >
                                      <Paperclip className="h-3 w-3 mr-1" />
                                      {doc.nom} ({doc.taille})
                                    </Badge>
                                  ))}
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap pt-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(actualite.dateCreation).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              {actualite.dateExpiration && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>
                                    Expire le{' '}
                                    {new Date(actualite.dateExpiration).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{actualite.vuesPar.length} vue(s)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {userRole === 'admin' && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xl:shrink-0 w-full xl:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditActualite(actualite);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto text-red-600 hover:bg-red-50 border-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActualite(actualite);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredActualites.length}
        onPageChange={setCurrentPage}
        itemLabel="actualité(s)"
      />

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Êtes-vous sûr de vouloir supprimer cette actualité ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-base">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActualite}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-base"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
