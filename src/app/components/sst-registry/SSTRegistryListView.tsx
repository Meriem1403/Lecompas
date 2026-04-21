import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  FileText,
  Clock,
  Send,
  CheckCircle2,
  MapPin,
  User,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import { SSTRemark, RemarkStatus } from '../SSTRegistryView';
import { toast } from 'sonner';

interface SSTRegistryListViewProps {
  remarks: SSTRemark[];
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  onView: (remark: SSTRemark) => void;
  onEdit: (remark: SSTRemark) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function SSTRegistryListView({
  remarks,
  currentUserRole,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: SSTRegistryListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RemarkStatus | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const statusConfig = {
    nouvelle: { 
      label: 'Nouvelle', 
      color: 'bg-blue-100 text-blue-700 border-blue-300', 
      icon: FileText,
      gradient: 'from-blue-400 to-cyan-500'
    },
    transmise: { 
      label: 'Transmise', 
      color: 'bg-orange-100 text-orange-700 border-orange-300', 
      icon: Send,
      gradient: 'from-orange-400 to-amber-500'
    },
    en_cours: { 
      label: 'En cours', 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300', 
      icon: Clock,
      gradient: 'from-yellow-400 to-orange-400'
    },
    cloturee: { 
      label: 'Clôturée', 
      color: 'bg-green-100 text-green-700 border-green-300', 
      icon: CheckCircle2,
      gradient: 'from-green-400 to-emerald-500'
    },
  };

  // Extract unique services
  const uniqueServices = Array.from(new Set(remarks.map(r => r.service))).sort();

  // Filter remarks
  const filteredRemarks = remarks.filter((remark) => {
    const matchesSearch =
      searchTerm === '' ||
      remark.ficheNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remark.observation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remark.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remark.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remark.sitePrecisions.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || remark.status === statusFilter;
    const matchesService = serviceFilter === 'all' || remark.service === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  // Sort by date (most recent first)
  const sortedRemarks = [...filteredRemarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Statistics
  const stats = {
    total: remarks.length,
    nouvelle: remarks.filter(r => r.status === 'nouvelle').length,
    transmise: remarks.filter(r => r.status === 'transmise').length,
    en_cours: remarks.filter(r => r.status === 'en_cours').length,
    cloturee: remarks.filter(r => r.status === 'cloturee').length,
  };

  const domainLabels: Record<string, string> = {
    locaux_travail: 'Locaux',
    machines_outils: 'Machines',
    epc: 'EPC',
    epi: 'EPI',
    situations_risques: 'Risques',
    conditions_travail: 'Conditions',
    formation: 'Formation',
    evenements_dangereux: 'Événements',
    autre: 'Autre',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Registre SST
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-500" />
            Registre de santé et de sécurité au travail - DIRM Méditerranée
          </p>
        </div>
        <Button
          onClick={onCreate}
          className="w-full lg:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle remarque
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-gray-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.total}</p>
              <p className="text-sm font-semibold text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-blue-700 mb-1">{stats.nouvelle}</p>
              <p className="text-sm font-semibold text-blue-600">Nouvelles</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Send className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-orange-700 mb-1">{stats.transmise}</p>
              <p className="text-sm font-semibold text-orange-600">Transmises</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-yellow-700 mb-1">{stats.en_cours}</p>
              <p className="text-sm font-semibold text-yellow-600">En cours</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto flex items-center justify-center mb-3 shadow-lg">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <p className="text-4xl font-bold text-green-700 mb-1">{stats.cloturee}</p>
              <p className="text-sm font-semibold text-green-600">Clôturées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-900">Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="N° fiche, observation, agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 hover:border-purple-300 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Statut
              </label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="border-2 hover:border-purple-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="nouvelle">Nouvelles</SelectItem>
                  <SelectItem value="transmise">Transmises</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="cloturee">Clôturées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Service
              </label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="border-2 hover:border-purple-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {uniqueServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remarks Cards */}
      {sortedRemarks.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="text-center py-16">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 mx-auto flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-xl text-gray-600 mb-4">Aucune remarque trouvée</p>
            <Button onClick={onCreate} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Créer la première remarque
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-rose-600" />
            Remarques enregistrées ({sortedRemarks.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedRemarks.map((remark) => {
              const config = statusConfig[remark.status];
              const StatusIcon = config.icon;
              
              return (
                <Card
                  key={remark.id}
                  className={`border-2 ${config.color.split(' ').pop()} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-gray-50`}
                  onClick={() => onView(remark)}
                >
                  <CardHeader className={`bg-gradient-to-r ${config.gradient} text-white pb-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-white/20 text-white border-white/40 font-mono text-base px-3 py-1">
                            #{remark.ficheNumber}
                          </Badge>
                          <Badge className="bg-white text-gray-900 border-0">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-white text-lg line-clamp-2">
                          {remark.observation.substring(0, 80)}...
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4 space-y-3">
                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-rose-500" />
                        <span>{new Date(remark.submissionDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-rose-500" />
                        <span>{remark.submissionTime}</span>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium text-gray-700 line-clamp-2">{remark.service}</span>
                    </div>

                    {/* Agent */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        {remark.isAnonymous ? (
                          <span className="italic">Anonyme</span>
                        ) : (
                          remark.agentName
                        )}
                      </span>
                    </div>

                    {/* Sites */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPin className="h-4 w-4 text-green-500" />
                      {remark.geographicSites.map((site) => (
                        <Badge key={site} variant="outline" className="text-xs bg-green-50 border-green-300">
                          {site}
                        </Badge>
                      ))}
                    </div>

                    {/* Domaines */}
                    <div className="flex flex-wrap gap-1.5">
                      {remark.domains.slice(0, 3).map((domain) => (
                        <Badge key={domain} className="text-xs bg-purple-100 text-purple-700 border-0">
                          {domainLabels[domain]}
                        </Badge>
                      ))}
                      {remark.domains.length > 3 && (
                        <Badge className="text-xs bg-gray-100 text-gray-700 border-0">
                          +{remark.domains.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Observation preview */}
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed border-t pt-3">
                      {remark.observation}
                    </p>

                    {/* Follow-up actions count */}
                    {remark.followUpActions.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">
                          {remark.followUpActions.length} action{remark.followUpActions.length > 1 ? 's' : ''} de suivi
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(remark);
                        }}
                        className="w-full sm:flex-1 border-2 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(remark);
                        }}
                        className="w-full sm:flex-1 border-2 hover:bg-purple-50 hover:border-purple-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="border-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer la fiche #{remark.ficheNumber} ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(remark.id);
                                toast.success('Remarque supprimée');
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
