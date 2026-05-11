import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Activity, MapPin, AlertCircle, AlertTriangle, Calendar, User, Users, Check, Edit, Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { AccidentEditView } from './AccidentEditView';
import { AccidentCreateView } from './AccidentCreateView';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from './ui/list-pagination-bar';

interface Accident {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: 'bénin' | 'modéré' | 'grave' | 'très_grave';
  type: 'travail' | 'trajet' | 'maladie_pro';
  victim: string;
  location: string;
  witnesses: string[];
  measures: string;
  lesionSites?: string[];
  lesionNatures?: string[];
  correctiveActions?: string[];
  createdAt: string;
  service?: string;
  domain?: string;
}

interface AccidentsViewProps {
  accidents: Accident[];
  onAdd: (accident: Omit<Accident, 'id' | 'createdAt'>) => void;
  onUpdate: (accident: Omit<Accident, 'createdAt'> & { id: string }) => void;
  onDelete: (id: string) => void;
  agents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    service: string;
    domain: string;
    location: string;
  }>;
  serviceOptions: string[];
  domainOptions: string[];
  locationOptions: string[];
}

export function AccidentsView({
  accidents,
  onAdd,
  onUpdate,
  onDelete,
  agents,
  serviceOptions,
  domainOptions,
  locationOptions
}: AccidentsViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAccident, setEditingAccident] = useState<Accident | null>(null);
  const [viewingAccident, setViewingAccident] = useState<Accident | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Accident['type']>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Accident['severity']>('all');
  const [dateFilter, setDateFilter] = useState('');

  const listPageSize = DEFAULT_LIST_PAGE_SIZE;
  const filteredAccidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return accidents.filter((accident) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        accident.title.toLowerCase().includes(normalizedSearch) ||
        accident.victim.toLowerCase().includes(normalizedSearch) ||
        accident.location.toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === 'all' || accident.type === typeFilter;
      const matchesSeverity = severityFilter === 'all' || accident.severity === severityFilter;
      const matchesDate = !dateFilter || accident.date === dateFilter;
      return matchesSearch && matchesType && matchesSeverity && matchesDate;
    });
  }, [accidents, searchTerm, typeFilter, severityFilter, dateFilter]);
  const listTotalPages = Math.max(1, Math.ceil(filteredAccidents.length / listPageSize));
  const paginatedAccidents = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return filteredAccidents.slice(start, start + listPageSize);
  }, [filteredAccidents, listPage, listPageSize]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages, filteredAccidents.length]);

  useEffect(() => {
    setListPage(1);
  }, [searchTerm, typeFilter, severityFilter, dateFilter]);

  const handleAdd = () => {
    setIsCreating(true);
  };

  const handleSaveCreate = (accidentData: any) => {
    onAdd(accidentData);
    toast.success('Accident déclaré avec succès ✅');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleEdit = (accident: Accident) => {
    setEditingAccident(accident);
  };

  const handleSaveEdit = (updatedAccident: Accident) => {
    onUpdate(updatedAccident);
    toast.success('Accident modifié avec succès ✅');
    setEditingAccident(null);
  };

  const handleCancelEdit = () => {
    setEditingAccident(null);
  };

  const handleDeleteClick = (id: string) => {
    setAccidentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (accidentToDelete) {
      onDelete(accidentToDelete);
      toast.success('Accident supprimé avec succès ✅');
      setDeleteDialogOpen(false);
      setAccidentToDelete(null);
    }
  };

  // Si on est en mode création, afficher uniquement la page de création
  if (isCreating) {
    return (
      <AccidentCreateView
        onSave={handleSaveCreate}
        onCancel={handleCancelCreate}
        agents={agents}
        serviceOptions={serviceOptions}
        domainOptions={domainOptions}
        locationOptions={locationOptions}
      />
    );
  }

  // Si on est en mode édition, afficher uniquement la page d'édition
  if (editingAccident) {
    return (
      <AccidentEditView
        accident={editingAccident}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        agents={agents}
        serviceOptions={serviceOptions}
        domainOptions={domainOptions}
        locationOptions={locationOptions}
      />
    );
  }

  // Si on est en mode consultation, afficher uniquement la page de détail
  if (viewingAccident) {
    const severityGradient =
      viewingAccident.severity === 'très_grave' ? 'from-red-500 to-rose-600' :
      viewingAccident.severity === 'grave' ? 'from-orange-500 to-red-500' :
      viewingAccident.severity === 'modéré' ? 'from-yellow-400 to-orange-400' : 'from-green-400 to-emerald-500';
    const typeIcon = viewingAccident.type === 'travail' ? Activity : viewingAccident.type === 'trajet' ? MapPin : AlertCircle;
    const TypeIcon = typeIcon;

    return (
      <>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">Détail de la déclaration</h2>
                <p className="text-gray-600 mt-1">Visualisez le détail complet de la déclaration.</p>
              </div>
              <div className="flex justify-end shrink-0">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setViewingAccident(null)}
                  className="w-full sm:w-auto font-semibold shadow-sm border-2 border-gray-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  setEditingAccident(viewingAccident);
                  setViewingAccident(null);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                onClick={() => handleDeleteClick(viewingAccident.id)}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${severityGradient}`}></div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${severityGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <TypeIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900">{viewingAccident.title}</h3>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="font-semibold text-gray-700">
                          {new Date(viewingAccident.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <Badge variant="outline" className={`capitalize font-bold bg-gradient-to-r ${severityGradient} text-white border-0`}>
                        {viewingAccident.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Badge className={`bg-gradient-to-r ${severityGradient} text-white border-0 shadow-lg text-base px-4 py-2 capitalize`}>
                  {viewingAccident.severity}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Identifiant</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 mt-1">{viewingAccident.id}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{viewingAccident.type.replace('_', ' ')}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Date de l'accident</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(viewingAccident.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Date de déclaration</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(viewingAccident.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Victime
                  </p>
                  <p className="font-bold text-lg text-purple-700">{viewingAccident.victim}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Lieu
                  </p>
                  <p className="font-bold text-lg text-blue-700">{viewingAccident.location}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-xl mb-4 border-l-4 border-orange-500">
                <p className="text-sm font-bold text-orange-900 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Description des faits
                </p>
                <p className="text-gray-700 leading-relaxed">{viewingAccident.description}</p>
              </div>

              <div className="mb-4 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-sm font-bold text-amber-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Témoins présents
                </p>
                {viewingAccident.witnesses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingAccident.witnesses.map((witness, idx) => (
                      <Badge key={idx} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                        {witness}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-900/80 text-sm">Aucun témoin renseigné.</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
                <p className="text-sm font-bold text-green-900 mb-3 flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  Mesures prises et suivi
                </p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {viewingAccident.measures || 'Aucune mesure renseignée.'}
                </p>
              </div>

              {((viewingAccident.lesionSites && viewingAccident.lesionSites.length > 0) ||
                (viewingAccident.lesionNatures && viewingAccident.lesionNatures.length > 0) ||
                (viewingAccident.correctiveActions && viewingAccident.correctiveActions.length > 0)) && (
                <div className="mt-4 space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-bold text-rose-900">Lésions et actions correctives</p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Siège(s) de lésion : </span>
                    {(viewingAccident.lesionSites || []).join(', ') || '—'}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Nature(s) de lésion : </span>
                    {(viewingAccident.lesionNatures || []).join(', ') || '—'}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Action(s) corrective(s) : </span>
                    {(viewingAccident.correctiveActions || []).join(', ') || '—'}
                  </p>
                </div>
              )}

              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-800 mb-2">Synthèse consultation</p>
                <p className="text-sm text-slate-700">
                  Accident de type <span className="font-semibold capitalize">{viewingAccident.type.replace('_', ' ')}</span>,
                  gravité <span className="font-semibold capitalize">{viewingAccident.severity}</span>, déclaré le{" "}
                  <span className="font-semibold">{new Date(viewingAccident.createdAt).toLocaleDateString('fr-FR')}</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer cet accident ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Liste des accidents</h3>
            <p className="text-gray-600">Gérez les déclarations d'accidents du travail</p>
          </div>
          <Button
            onClick={handleAdd}
            className="w-full lg:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Déclarer un accident
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, victime ou lieu"
            className="bg-white"
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white"
          />
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | Accident['type'])}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="travail">Travail</SelectItem>
              <SelectItem value="trajet">Trajet</SelectItem>
              <SelectItem value="maladie_pro">Maladie pro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as 'all' | Accident['severity'])}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Gravité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les gravités</SelectItem>
              <SelectItem value="bénin">Bénin</SelectItem>
              <SelectItem value="modéré">Modéré</SelectItem>
              <SelectItem value="grave">Grave</SelectItem>
              <SelectItem value="très_grave">Très grave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredAccidents.length === 0 ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-4">Aucun accident ne correspond aux filtres</p>
                <Button onClick={handleAdd} className="bg-gradient-to-r from-red-600 to-orange-600">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Déclarer le premier accident
                </Button>
              </CardContent>
            </Card>
          ) : (
            paginatedAccidents.map((accident) => {
              const severityGradient = 
                accident.severity === 'très_grave' ? 'from-red-500 to-rose-600' :
                accident.severity === 'grave' ? 'from-orange-500 to-red-500' :
                accident.severity === 'modéré' ? 'from-yellow-400 to-orange-400' : 'from-green-400 to-emerald-500';
              
              const typeIcon = accident.type === 'travail' ? Activity : accident.type === 'trajet' ? MapPin : AlertCircle;
              const TypeIcon = typeIcon;

              return (
                <Card
                  key={accident.id}
                  onClick={() => setViewingAccident(accident)}
                  className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur overflow-hidden group cursor-pointer"
                >
                  <div className={`h-2 bg-gradient-to-r ${severityGradient}`}></div>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${severityGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <TypeIcon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900">{accident.title}</h3>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span className="font-semibold text-gray-700">
                                {new Date(accident.date).toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <Badge variant="outline" className={`capitalize font-bold bg-gradient-to-r ${severityGradient} text-white border-0`}>
                              {accident.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(accident);
                            }} 
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(accident.id);
                            }} 
                            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                        <Badge className={`bg-gradient-to-r ${severityGradient} text-white border-0 shadow-lg text-base px-4 py-2 capitalize`}>
                          {accident.severity}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
                        <p className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Victime
                        </p>
                        <p className="font-bold text-lg text-purple-700">{accident.victim}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                        <p className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Lieu
                        </p>
                        <p className="font-bold text-lg text-blue-700">{accident.location}</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-xl mb-4 border-l-4 border-orange-500">
                      <p className="text-sm font-bold text-orange-900 mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Description des faits
                      </p>
                      <p className="text-gray-700 leading-relaxed">{accident.description}</p>
                    </div>

                    {accident.witnesses.length > 0 && (
                      <div className="mb-4 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl">
                        <p className="text-sm font-bold text-amber-900 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Témoins présents
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {accident.witnesses.map((witness, idx) => (
                            <Badge key={idx} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                              {witness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
                      <p className="text-sm font-bold text-green-900 mb-3 flex items-center">
                        <Check className="h-5 w-5 mr-2" />
                        Mesures prises et suivi
                      </p>
                      <p className="text-gray-700 leading-relaxed">{accident.measures}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <ListPaginationBar
        currentPage={listPage}
        totalPages={listTotalPages}
        totalItems={filteredAccidents.length}
        onPageChange={setListPage}
        itemLabel="accident(s)"
        className="mt-6"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet accident ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}