import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Activity, MapPin, AlertCircle, AlertTriangle, Calendar, Clock, User, Users, Check, Edit, Trash2, PlusCircle, ArrowLeft, Stethoscope, Bandage, ClipboardList, CalendarRange, HeartPulse, Scale, BookOpen, FileText, Download } from 'lucide-react';
import {
  exportAccidentDeclarationPdf,
  exportAccidentsListPdf,
  type AccidentPdfSource,
} from '@/app/utils/accidentPdfExport';
import { getLegalTypeLabel } from '@/app/utils/accidentRecord';
import type { AccidentDuerpRiskRef } from '@/app/utils/accidentRecord';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AccidentDeclaratifTable,
  AccidentSuiviIndicateursPanel,
} from '@/app/components/accidents/AccidentSuiviPanels';
import {
  getRegulatoryGravityBadgeClass,
  normalizeAccidentStoppageFields,
  REGULATORY_GRAVITY_LABELS,
  REGULATORY_GRAVITY_SHORT,
  formatStoppagePeriodFr,
} from '@/app/utils/accidentRegulatoryGravity';
import {
  formatAccidentDateFr,
  formatAccidentDateTimeFr,
  normalizeAccidentTime,
} from '@/app/utils/accidentDateTime';

interface Accident {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  accidentCategory?: string;
  accidentEventType?: string;
  severity: 'bénin' | 'modéré' | 'grave' | 'très_grave';
  hasWorkStoppage?: boolean;
  workStoppageStartDate?: string;
  workStoppageEndDate?: string;
  workStoppageDays?: number;
  hasReturnToWorkMedicalConditions?: boolean;
  returnToWorkMedicalConditions?: string;
  regulatoryGravity?: 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
  type: 'travail' | 'trajet' | 'maladie_pro';
  victim: string;
  victimFirstName?: string;
  victimLastName?: string;
  location: string;
  circumstances?: string;
  accidentCauses?: string;
  causeAnalysis?: string;
  comments?: string;
  duerpRiskId?: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
  duerpRiskFreeText?: string;
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
  risks: AccidentDuerpRiskRef[];
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
  accessToken?: string;
}

function toAccidentPdfSource(accident: Accident): AccidentPdfSource {
  return {
    id: accident.id,
    title: accident.title,
    date: accident.date,
    time: accident.time,
    createdAt: accident.createdAt,
    type: accident.type,
    accidentCategory: accident.accidentCategory,
    accidentEventType: accident.accidentEventType,
    victim: accident.victim,
    victimFirstName: accident.victimFirstName,
    victimLastName: accident.victimLastName,
    location: accident.location,
    service: accident.service,
    domain: accident.domain,
    description: accident.description,
    circumstances: accident.circumstances,
    accidentCauses: accident.accidentCauses,
    causeAnalysis: accident.causeAnalysis,
    comments: accident.comments,
    measures: accident.measures,
    severity: accident.severity,
    witnesses: accident.witnesses ?? [],
    lesionSites: accident.lesionSites,
    lesionNatures: accident.lesionNatures,
    correctiveActions: accident.correctiveActions,
    duerpRiskNumber: accident.duerpRiskNumber,
    duerpRiskLabel: accident.duerpRiskLabel,
    duerpRiskFreeText: accident.duerpRiskFreeText,
    hasWorkStoppage: accident.hasWorkStoppage,
    workStoppageStartDate: accident.workStoppageStartDate,
    workStoppageEndDate: accident.workStoppageEndDate,
    workStoppageDays: accident.workStoppageDays,
    hasReturnToWorkMedicalConditions: accident.hasReturnToWorkMedicalConditions,
    returnToWorkMedicalConditions: accident.returnToWorkMedicalConditions,
    regulatoryGravity: accident.regulatoryGravity,
  };
}

function formatDuerpRiskLine(accident: Accident): string {
  if (accident.duerpRiskNumber && accident.duerpRiskLabel) {
    return `${accident.duerpRiskNumber} — ${accident.duerpRiskLabel}`;
  }
  return accident.duerpRiskFreeText?.trim() || '';
}

export function AccidentsView({
  accidents,
  risks,
  onAdd,
  onUpdate,
  onDelete,
  agents,
  serviceOptions,
  domainOptions,
  locationOptions,
  accessToken = '',
}: AccidentsViewProps) {
  const [suiviTab, setSuiviTab] = useState<'indicateurs' | 'declaratif' | 'fiches'>(
    'declaratif',
  );
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
      const victimSearch = [
        accident.victim,
        accident.victimFirstName,
        accident.victimLastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        accident.title.toLowerCase().includes(normalizedSearch) ||
        victimSearch.includes(normalizedSearch) ||
        accident.location.toLowerCase().includes(normalizedSearch) ||
        (accident.accidentCategory ?? '').toLowerCase().includes(normalizedSearch) ||
        (accident.accidentEventType ?? '').toLowerCase().includes(normalizedSearch);
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

  const handleExportListPdf = () => {
    try {
      if (filteredAccidents.length === 0) {
        toast.error('Aucun accident à exporter pour les filtres actuels.');
        return;
      }
      exportAccidentsListPdf(filteredAccidents.map(toAccidentPdfSource));
      toast.success('Export PDF généré avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleExportDetailPdf = (accident: Accident) => {
    try {
      exportAccidentDeclarationPdf(toAccidentPdfSource(accident));
      toast.success('Déclaration téléchargée en PDF');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du téléchargement de la déclaration');
    }
  };

  // Si on est en mode création, afficher uniquement la page de création
  if (isCreating) {
    return (
      <AccidentCreateView
        onSave={handleSaveCreate}
        onCancel={handleCancelCreate}
        agents={agents}
        risks={risks}
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
        risks={risks}
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
                type="button"
                variant="outline"
                onClick={() => handleExportDetailPdf(viewingAccident)}
                className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger la déclaration
              </Button>
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
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-gray-700">
                            {formatAccidentDateFr(viewingAccident.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-gray-700">
                            {normalizeAccidentTime(viewingAccident.time, viewingAccident.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`capitalize font-bold bg-gradient-to-r ${severityGradient} text-white border-0`}>
                        {viewingAccident.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {(() => {
                    const g = normalizeAccidentStoppageFields(viewingAccident).regulatoryGravity;
                    return (
                      <Badge className={`${getRegulatoryGravityBadgeClass(g)} border-0 shadow-lg text-base px-4 py-2`}>
                        {g} — {REGULATORY_GRAVITY_SHORT[g]}
                      </Badge>
                    );
                  })()}
                  <Badge className={`bg-gradient-to-r ${severityGradient} text-white border-0 shadow-lg text-base px-4 py-2 capitalize`}>
                    Dashboard : {viewingAccident.severity}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Identifiant</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 mt-1">{viewingAccident.id}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Type légal</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{getLegalTypeLabel(viewingAccident.type)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Date et heure</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {formatAccidentDateTimeFr(
                      viewingAccident.date,
                      viewingAccident.time ?? normalizeAccidentTime(undefined, viewingAccident.createdAt),
                    )}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Date de déclaration</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {new Date(viewingAccident.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {(() => {
                  const stoppage = normalizeAccidentStoppageFields(viewingAccident);
                  return (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 md:col-span-2 xl:col-span-4 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-teal-700 flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5" aria-hidden />
                        Arrêt de travail et gravité réglementaire
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getRegulatoryGravityBadgeClass(stoppage.regulatoryGravity)}>
                          {stoppage.regulatoryGravity}
                        </Badge>
                        <span className="text-sm font-semibold text-teal-950">
                          {REGULATORY_GRAVITY_LABELS[stoppage.regulatoryGravity]}
                        </span>
                      </div>
                      <p className="text-sm text-teal-900 flex items-start gap-2">
                        <CalendarRange className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                        <span>
                          {formatStoppagePeriodFr(
                            stoppage.hasWorkStoppage,
                            stoppage.workStoppageStartDate,
                            stoppage.workStoppageEndDate,
                          )}
                          {stoppage.hasWorkStoppage && stoppage.workStoppageDays != null && (
                            <>
                              {" "}
                              — {stoppage.workStoppageDays} jour
                              {stoppage.workStoppageDays > 1 ? "s" : ""} calendaire
                              {stoppage.workStoppageDays > 1 ? "s" : ""}
                            </>
                          )}
                        </span>
                      </p>
                      <p className="text-sm text-teal-900 flex items-start gap-2">
                        <HeartPulse className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                        {stoppage.hasReturnToWorkMedicalConditions ? (
                          <span>
                            <span className="font-semibold">Reprise — médecine du travail : </span>
                            {stoppage.returnToWorkMedicalConditions || "Oui (non détaillé)"}
                          </span>
                        ) : (
                          <span>Aucune condition médicale de reprise renseignée</span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {(viewingAccident.accidentCategory || viewingAccident.accidentEventType) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {viewingAccident.accidentCategory && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wide text-indigo-700">Catégorie</p>
                      <p className="text-sm font-semibold text-indigo-950 mt-1">{viewingAccident.accidentCategory}</p>
                    </div>
                  )}
                  {viewingAccident.accidentEventType && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wide text-indigo-700">Type (nature)</p>
                      <p className="text-sm font-semibold text-indigo-950 mt-1">{viewingAccident.accidentEventType}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Victime
                  </p>
                  <p className="font-bold text-lg text-purple-700">{viewingAccident.victim}</p>
                  {(viewingAccident.victimFirstName || viewingAccident.victimLastName) && (
                    <p className="text-sm text-purple-800 mt-1">
                      Prénom : <span className="font-medium">{viewingAccident.victimFirstName || '—'}</span>
                      {' · '}
                      Nom : <span className="font-medium">{viewingAccident.victimLastName || '—'}</span>
                    </p>
                  )}
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

              {viewingAccident.circumstances && (
                <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-5 mb-4">
                  <p className="text-sm font-bold text-orange-950 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Circonstances
                  </p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingAccident.circumstances}</p>
                </div>
              )}

              {(viewingAccident.accidentCauses || viewingAccident.causeAnalysis) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4 space-y-4">
                  {viewingAccident.accidentCauses && (
                    <div>
                      <p className="text-sm font-bold text-amber-950 mb-2">Causes de l&apos;accident</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingAccident.accidentCauses}</p>
                    </div>
                  )}
                  {viewingAccident.causeAnalysis && (
                    <div>
                      <p className="text-sm font-bold text-amber-950 mb-2">Analyse des causes</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingAccident.causeAnalysis}</p>
                    </div>
                  )}
                </div>
              )}

              {formatDuerpRiskLine(viewingAccident) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold text-blue-950 mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" aria-hidden />
                    Risque DUERP
                  </p>
                  <p className="text-sm text-blue-900 font-medium">{formatDuerpRiskLine(viewingAccident)}</p>
                </div>
              )}

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

              {viewingAccident.comments && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 mt-4">
                  <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" aria-hidden />
                    Commentaires
                  </p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewingAccident.comments}</p>
                </div>
              )}

              <section className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-4" aria-labelledby="consult-lesions-heading">
                <h4 id="consult-lesions-heading" className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-rose-700" aria-hidden />
                  Lésions et actions correctives
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                      <Bandage className="h-3.5 w-3.5" aria-hidden />
                      Siège(s) de lésion
                    </p>
                    {(viewingAccident.lesionSites || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(viewingAccident.lesionSites || []).map((site) => (
                          <Badge key={site} variant="outline" className="bg-white border-rose-300 text-rose-950">
                            {site}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Non renseigné</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                      <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                      Nature(s) de lésion
                    </p>
                    {(viewingAccident.lesionNatures || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(viewingAccident.lesionNatures || []).map((nature) => (
                          <Badge key={nature} variant="outline" className="bg-white border-rose-300 text-rose-950">
                            {nature}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Non renseigné</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                      <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                      Action(s) corrective(s)
                    </p>
                    {(viewingAccident.correctiveActions || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(viewingAccident.correctiveActions || []).map((action) => (
                          <Badge key={action} variant="outline" className="bg-white border-rose-300 text-rose-950">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Non renseigné</p>
                    )}
                  </div>
                </div>
              </section>

              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-800 mb-2">Synthèse consultation</p>
                <p className="text-sm text-slate-700">
                  Survenu le{" "}
                  <span className="font-semibold">
                    {formatAccidentDateTimeFr(viewingAccident.date, viewingAccident.time)}
                  </span>
                  , type <span className="font-semibold capitalize">{viewingAccident.type.replace('_', ' ')}</span>,
                  gravité dashboard <span className="font-semibold capitalize">{viewingAccident.severity}</span>,{" "}
                  classement réglementaire{" "}
                  <span className="font-semibold">
                    {normalizeAccidentStoppageFields(viewingAccident).regulatoryGravity}
                  </span>
                  , déclaré le{" "}
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
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportListPdf}
              className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
            <Button
              onClick={handleAdd}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Déclarer un accident
            </Button>
          </div>
        </div>

        <Tabs
          value={suiviTab}
          onValueChange={(v) =>
            setSuiviTab(v as 'indicateurs' | 'declaratif' | 'fiches')
          }
        >
          <TabsList className="mb-4">
            <TabsTrigger value="indicateurs">Indicateurs / an</TabsTrigger>
            <TabsTrigger value="declaratif">Déclaratif (tableau)</TabsTrigger>
            <TabsTrigger value="fiches">Fiches détaillées</TabsTrigger>
          </TabsList>

          <TabsContent value="indicateurs">
            <AccidentSuiviIndicateursPanel accessToken={accessToken} />
          </TabsContent>

          <TabsContent value="declaratif">
            <AccidentDeclaratifTable
              accidents={paginatedAccidents}
              onSelect={(id) => {
                const acc = accidents.find((a) => a.id === id);
                if (acc) setViewingAccident(acc);
              }}
            />
            <ListPaginationBar
              className="mt-4"
              currentPage={listPage}
              totalPages={listTotalPages}
              totalItems={filteredAccidents.length}
              onPageChange={setListPage}
              itemLabel="ligne(s)"
            />
          </TabsContent>

          <TabsContent value="fiches">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, victime, catégorie ou lieu"
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
                              <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
                              <span className="font-semibold text-gray-700">
                                {formatAccidentDateTimeFr(
                                  accident.date,
                                  accident.time ?? normalizeAccidentTime(undefined, accident.createdAt),
                                )}
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
                        <div className="flex flex-col gap-1 items-end">
                          <Badge className={`${getRegulatoryGravityBadgeClass(normalizeAccidentStoppageFields(accident).regulatoryGravity)} border-0 text-sm px-3 py-1`}>
                            {normalizeAccidentStoppageFields(accident).regulatoryGravity}
                          </Badge>
                          <Badge className={`bg-gradient-to-r ${severityGradient} text-white border-0 shadow-lg text-sm px-3 py-1 capitalize`}>
                            {accident.severity}
                          </Badge>
                        </div>
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
        <ListPaginationBar
          currentPage={listPage}
          totalPages={listTotalPages}
          totalItems={filteredAccidents.length}
          onPageChange={setListPage}
          itemLabel="accident(s)"
          className="mt-6"
        />
          </TabsContent>
        </Tabs>
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