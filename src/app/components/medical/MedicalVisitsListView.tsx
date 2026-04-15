import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import {
  Plus,
  Calendar,
  Search,
  Edit,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Activity,
  Users,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Shield,
  Target
} from 'lucide-react';
import { MedicalVisit } from '../MedicalVisitsView';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';

interface MedicalVisitsListViewProps {
  medicalVisits: MedicalVisit[];
  onCreateNew: () => void;
  onViewDetail: (visit: MedicalVisit) => void;
  onEdit: (visit: MedicalVisit) => void;
  onDelete: (id: string) => void;
}

export function MedicalVisitsListView({ medicalVisits, onCreateNew, onViewDetail, onEdit, onDelete }: MedicalVisitsListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatutMilitaire, setFilterStatutMilitaire] = useState<string>('all');
  const [filterAmenagement, setFilterAmenagement] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<MedicalVisit | null>(null);
  
  // États pour l'affichage/masquage des sections
  const [showAJour, setShowAJour] = useState(true);
  const [showAPlanifier, setShowAPlanifier] = useState(true);
  const [showEnRetard, setShowEnRetard] = useState(true);
  const [showUrgent, setShowUrgent] = useState(true);

  const statusConfig = {
    a_jour: {
      label: 'À jour',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      icon: CheckCircle2,
    },
    a_planifier: {
      label: 'À planifier (< 90 jours)',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      icon: Clock,
    },
    en_retard: {
      label: 'En retard (< 30 jours)',
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-900',
      icon: AlertCircle,
    },
    urgent: {
      label: 'URGENT - Date dépassée',
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      icon: AlertTriangle,
    },
  };

  // Calculer le statut automatiquement basé sur les dates
  const calculateStatus = (visit: MedicalVisit): typeof visit.statut => {
    if (!visit.prochaineVisiteMedicale) return 'a_planifier';
    
    const today = new Date();
    const nextVisit = new Date(visit.prochaineVisiteMedicale);
    const diffDays = Math.floor((nextVisit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'urgent';
    if (diffDays < 30) return 'en_retard';
    if (diffDays < 90) return 'a_planifier';
    return 'a_jour';
  };

  const visitsWithCalculatedStatus = medicalVisits.map(visit => ({
    ...visit,
    statut: calculateStatus(visit)
  }));

  // Extraction des listes pour les filtres
  const services = Array.from(new Set(medicalVisits.map(v => v.service))).sort();

  const filteredVisits = visitsWithCalculatedStatus.filter(visit => {
    const matchesSearch = visit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.libellePoste.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.structureDetaillee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.gradeNNE.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = filterService === 'all' || visit.service === filterService;
    const matchesStatutMilitaire = filterStatutMilitaire === 'all' || visit.statutMilitaire === filterStatutMilitaire;
    
    const matchesAmenagement = 
      filterAmenagement === 'all' ||
      (filterAmenagement === 'avec_amenagement' && visit.amenagementPoste && visit.amenagementPoste !== 'Aucun') ||
      (filterAmenagement === 'avec_surveillance' && visit.surveillanceParticuliere) ||
      (filterAmenagement === 'sans_amenagement' && (!visit.amenagementPoste || visit.amenagementPoste === 'Aucun') && !visit.surveillanceParticuliere);
    
    return matchesSearch && matchesService && matchesStatutMilitaire && matchesAmenagement;
  });

  // Grouper par statut
  const visitsByStatus = {
    urgent: filteredVisits.filter(v => v.statut === 'urgent'),
    en_retard: filteredVisits.filter(v => v.statut === 'en_retard'),
    a_planifier: filteredVisits.filter(v => v.statut === 'a_planifier'),
    a_jour: filteredVisits.filter(v => v.statut === 'a_jour'),
  };

  const handleDeleteClick = (visit: MedicalVisit) => {
    setVisitToDelete(visit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (visitToDelete) {
      onDelete(visitToDelete.id);
      toast.success(`Suivi médical de ${visitToDelete.prenom} ${visitToDelete.nom} supprimé avec succès`);
      setDeleteDialogOpen(false);
      setVisitToDelete(null);
    }
  };

  const getDaysUntilNextVisit = (date?: string): number | null => {
    if (!date) return null;
    const nextVisit = new Date(date);
    const today = new Date();
    return Math.floor((nextVisit.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Composant pour afficher une carte d'agent
  const VisitCard = ({ visit }: { visit: MedicalVisit }) => {
    const config = statusConfig[visit.statut];
    const IconComponent = config.icon;
    const daysUntilNext = getDaysUntilNextVisit(visit.prochaineVisiteMedicale);

    return (
      <Card className={`border-l-4 ${config.borderColor} shadow-md hover:shadow-lg transition-all bg-white`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}>
                  <User className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {visit.prenom} {visit.nom}
                </h3>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                  {visit.sexe === 'M' ? 'Homme' : 'Femme'}
                </Badge>
                <Badge className={visit.statutMilitaire === 'Militaire' ? 'bg-blue-900 text-white' : 'bg-gray-600 text-white'}>
                  {visit.statutMilitaire}
                </Badge>
                {visit.amenagementPoste && visit.amenagementPoste !== 'Aucun' && (
                  <Badge className="bg-purple-600 text-white text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Aménagement
                  </Badge>
                )}
                {visit.surveillanceParticuliere && (
                  <Badge className="bg-amber-600 text-white text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Surveillance
                  </Badge>
                )}
                {visit.risquesExposition && visit.risquesExposition.length > 0 && (
                  <Badge className="bg-red-600 text-white text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    {visit.risquesExposition.length} risque{visit.risquesExposition.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="font-semibold text-gray-900">{visit.service}</p>
                    <p className="text-xs text-gray-600">{visit.libellePoste}</p>
                  </div>
                </div>

                {visit.prochaineVisiteMedicale && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Prochaine visite</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(visit.prochaineVisiteMedicale).toLocaleDateString('fr-FR')}
                      </p>
                      {daysUntilNext !== null && (
                        <p className={`text-xs font-semibold mt-0.5 ${
                          daysUntilNext < 0 ? 'text-red-600' : 
                          daysUntilNext < 30 ? 'text-orange-600' : 
                          daysUntilNext < 90 ? 'text-blue-600' : 
                          'text-green-600'
                        }`}>
                          {daysUntilNext < 0 
                            ? `⚠️ En retard de ${Math.abs(daysUntilNext)} jours` 
                            : `Dans ${daysUntilNext} jours`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {visit.surveillanceMedicaleAnnee !== undefined && (
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Périodicité</p>
                      <p className="font-semibold text-gray-900">
                        {visit.surveillanceMedicaleAnnee === 0.5 
                          ? 'Semestrielle' 
                          : visit.surveillanceMedicaleAnnee === 1 
                          ? 'Annuelle' 
                          : `${visit.surveillanceMedicaleAnnee} ans`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(visit)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(visit)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleDeleteClick(visit)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suivi des visites médicales</h1>
            <p className="text-gray-600 mt-1">
              Gestion des visites médicales et exposition aux risques
            </p>
          </div>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvel Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setShowUrgent(!showUrgent)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">🚨 URGENT</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {visitsByStatus.urgent.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Date dépassée</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setShowEnRetard(!showEnRetard)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">⚠️ En retard</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {visitsByStatus.en_retard.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Moins de 30 jours</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setShowAPlanifier(!showAPlanifier)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">📅 À planifier</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {visitsByStatus.a_planifier.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">30 à 90 jours</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setShowAJour(!showAJour)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">✅ À jour</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {visitsByStatus.a_jour.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Plus de 90 jours</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="font-semibold text-gray-900">Filtres avancés</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏢 Tous les services</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatutMilitaire} onValueChange={setFilterStatutMilitaire}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">👥 Tous les statuts</SelectItem>
                  <SelectItem value="Militaire">⚓ Militaires</SelectItem>
                  <SelectItem value="Civil">👔 Civils</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAmenagement} onValueChange={setFilterAmenagement}>
                <SelectTrigger>
                  <SelectValue placeholder="Aménagement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🔧 Tous</SelectItem>
                  <SelectItem value="avec_amenagement">✅ Avec aménagement</SelectItem>
                  <SelectItem value="avec_surveillance">⚠️ Avec surveillance</SelectItem>
                  <SelectItem value="sans_amenagement">❌ Sans aménagement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || filterService !== 'all' || filterStatutMilitaire !== 'all' || filterAmenagement !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">{filteredVisits.length}</span> résultat{filteredVisits.length > 1 ? 's' : ''}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterService('all');
                    setFilterStatutMilitaire('all');
                    setFilterAmenagement('all');
                  }}
                  className="text-xs"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* URGENT Section */}
      {visitsByStatus.urgent.length > 0 && (
        <Card className="border-2 border-red-400 shadow-xl bg-gradient-to-r from-red-50 to-rose-50">
          <CardContent className="pt-4 pb-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowUrgent(!showUrgent)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">
                    🚨 URGENT - Date dépassée
                  </h2>
                  <p className="text-sm text-red-700">
                    {visitsByStatus.urgent.length} agent{visitsByStatus.urgent.length > 1 ? 's' : ''} - Action immédiate requise
                  </p>
                </div>
              </div>
              {showUrgent ? <ChevronUp className="h-5 w-5 text-red-600" /> : <ChevronDown className="h-5 w-5 text-red-600" />}
            </div>

            {showUrgent && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {visitsByStatus.urgent.map(visit => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* En Retard Section */}
      {visitsByStatus.en_retard.length > 0 && (
        <Card className="border-2 border-orange-300 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="pt-4 pb-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowEnRetard(!showEnRetard)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-900">
                    ⚠️ En retard - Moins de 30 jours
                  </h2>
                  <p className="text-sm text-orange-700">
                    {visitsByStatus.en_retard.length} agent{visitsByStatus.en_retard.length > 1 ? 's' : ''} - Planifier rapidement
                  </p>
                </div>
              </div>
              {showEnRetard ? <ChevronUp className="h-5 w-5 text-orange-600" /> : <ChevronDown className="h-5 w-5 text-orange-600" />}
            </div>

            {showEnRetard && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {visitsByStatus.en_retard.map(visit => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* À Planifier Section */}
      {visitsByStatus.a_planifier.length > 0 && (
        <Card className="border-2 border-blue-300 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardContent className="pt-4 pb-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAPlanifier(!showAPlanifier)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    📅 À planifier - 30 à 90 jours
                  </h2>
                  <p className="text-sm text-blue-700">
                    {visitsByStatus.a_planifier.length} agent{visitsByStatus.a_planifier.length > 1 ? 's' : ''} - Anticiper les rendez-vous
                  </p>
                </div>
              </div>
              {showAPlanifier ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
            </div>

            {showAPlanifier && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {visitsByStatus.a_planifier.map(visit => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* À Jour Section */}
      {visitsByStatus.a_jour.length > 0 && (
        <Card className="border-2 border-green-300 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-4 pb-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAJour(!showAJour)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-900">
                    ✅ À jour - Plus de 90 jours
                  </h2>
                  <p className="text-sm text-green-700">
                    {visitsByStatus.a_jour.length} agent{visitsByStatus.a_jour.length > 1 ? 's' : ''} - Situation normale
                  </p>
                </div>
              </div>
              {showAJour ? <ChevronUp className="h-5 w-5 text-green-600" /> : <ChevronDown className="h-5 w-5 text-green-600" />}
            </div>

            {showAJour && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {visitsByStatus.a_jour.map(visit => (
                    <VisitCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredVisits.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="pt-12 pb-12 text-center">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun agent trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterService !== 'all' || filterStatutMilitaire !== 'all' || filterAmenagement !== 'all'
                ? 'Aucun agent ne correspond à vos critères de recherche.'
                : 'Commencez par ajouter votre premier agent au suivi médical.'}
            </p>
            {!searchTerm && filterService === 'all' && filterStatutMilitaire === 'all' && filterAmenagement === 'all' && (
              <Button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un agent
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le suivi médical de <strong>{visitToDelete?.prenom} {visitToDelete?.nom}</strong> ?
              <br /><br />
              Cette action est irréversible et supprimera toutes les données associées (visites, aménagements, surveillance).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
