import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
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
import { AlertTriangle, PlusCircle, Edit, Trash2, Eye, ArrowLeft, Target, TrendingUp, Clock, AlertCircle, Calendar, Calculator, Shield, Tag, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  ChoicePills,
  DirectoryUserPills,
  DirectoryUserSelect,
  namesOutsideDirectory,
} from '@/app/components/risks/RiskFormControls';
import * as XLSX from 'xlsx';
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';
import { ColumnFilterPopover } from '@/app/components/ui/column-filter-popover';
import {
  buildColumnFilterOptions,
  columnFilterKind,
  compareRiskColumn,
  emptyRiskManagementColumnFilters,
  formatMoyenMaitriseLabel,
  hasActiveRiskManagementColumnFilters,
  matchesRiskManagementColumnFilters,
  RISK_MANAGEMENT_FILTERABLE_COLUMNS,
  type ColumnFilterState,
  type RiskManagementColumnKey,
  type RiskManagementColumnFilters,
} from '@/app/utils/riskManagementFilterLogic';
import { computeRiskValues, computeRiskWorkflowStatus, getPriorityBandFromGfm, getRiskWorkflowStatusLabel, type RiskWorkflowStatus } from '@/app/services/riskPriority';
import { nextRiskNumber } from '@/app/utils/riskSequence';
import { RiskEditView } from '@/app/components/RiskEditView';
import { RiskEvaluationFiltersPanel } from '@/app/components/RiskEvaluationFiltersPanel';
import {
  emptyRiskEvaluationFilters,
  matchesRiskEvaluationFilters,
  type RiskEvaluationFilters,
} from '@/app/utils/riskFilterLogic';
import { RiskConsultationDetail } from '@/app/components/risks/RiskConsultationDetail';
import type { ActionReturnFixture } from '@/app/fixtures/actionReturnFixtures';
import { RiskEvaluationFacts, RiskProgress } from '@/app/components/risks/RiskEvaluationFacts';

const fieldClass = "h-11 rounded-xl border-slate-200 bg-white shadow-sm data-[size=default]:h-11";
const severityWords = ["", "Faible", "Moyen", "Élevé", "Très élevé"];
const frequencyWords = ["", "Rare", "Peu probable", "Probable", "Très probable"];

export interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  detachedFromReference?: boolean;
  unite: string;
  domain?: string;
  service: string;
  site: string;
  situation: string;
  associatedRisk: string;
  category: string;
  responsable: string;
  severity: number;
  probability: number;
  riskLevel: number;
  existingMeasures: string[];
  moyenMaitrise: string;
  calculPriorite: number;
  prioriteFinale: number;
  plannedMeasures: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedDate?: string;
    effectiveness?: string;
  }>;
  status: RiskWorkflowStatus;
  echeance: string;
  retourAction: string;
  observation: string;
  createdAt: string;
  updatedAt: string;
}

interface RisksManagementViewProps {
  risks: Risk[];
  setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
  serviceOptions?: string[];
  domainOptions?: string[];
  locationOptions?: string[];
  serviceCatalog?: Array<{
    name: string;
    domains: string[];
    locations: string[];
  }>;
  riskReferences?: Array<{
    id: string;
    numeroRisque: string;
    title: string;
  }>;
  concernedPersons?: Array<{
    id: string;
    fullName: string;
    service: string;
    domain: string;
    location: string;
  }>;
  onDeleteRisk?: (id: string) => void;
  actionReturns?: ActionReturnFixture[];
  onManageActionReturns?: () => void;
  onProposeReturn?: (risk: Risk) => void;
  onLearnMore?: (risk: Risk) => void;
  getCategoryIcon: (category: string) => React.ComponentType<{ className?: string }>;
  getCategoryColor: (category: string) => string;
  riskLevelGradient: (level: number) => string;
  getRiskLevelLabel: (level: number) => string;
}

type ViewMode = 'list' | 'view' | 'edit' | 'create';

export function RisksManagementView({
  risks,
  setRisks,
  serviceOptions = [],
  domainOptions = [],
  locationOptions = [],
  serviceCatalog = [],
  riskReferences = [],
  concernedPersons = [],
  onDeleteRisk,
  actionReturns = [],
  onManageActionReturns,
  onProposeReturn,
  onLearnMore,
  getCategoryIcon,
  getCategoryColor,
  riskLevelGradient,
  getRiskLevelLabel,
}: RisksManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [evaluationFilters, setEvaluationFilters] = useState<RiskEvaluationFilters>(
    emptyRiskEvaluationFilters(),
  );
  const [columnFilters, setColumnFilters] = useState<RiskManagementColumnFilters>(
    emptyRiskManagementColumnFilters,
  );
  const [columnSort, setColumnSort] = useState<{
    key: RiskManagementColumnKey;
    direction: "asc" | "desc";
  } | null>(null);
  const [listPage, setListPage] = useState(1);

  // Form state pour création/édition
  const [formData, setFormData] = useState<Partial<Risk>>({});

  const matchedRiskReference = riskReferences.find(
    (ref) => ref.title === (formData.title || ""),
  );
  const selectedRiskReferenceValue = matchedRiskReference
    ? `${matchedRiskReference.numeroRisque}::${matchedRiskReference.title}`
    : "__custom__";

  const splitCsv = (value?: string) =>
    (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const selectedServices = splitCsv(formData.service);
  const selectedDomains = splitCsv(formData.domain || formData.unite);
  const selectedLocations = splitCsv(formData.site);

  const availableDomainsForSelection =
    selectedServices.length === 0
      ? domainOptions
      : Array.from(
          new Set(
            serviceCatalog
              .filter((service) => selectedServices.includes(service.name))
              .flatMap((service) => service.domains),
          ),
        );

  const availableLocationsForSelection =
    selectedServices.length === 0
      ? locationOptions
      : Array.from(
          new Set(
            serviceCatalog
              .filter((service) => selectedServices.includes(service.name))
              .flatMap((service) => service.locations),
          ),
        );

  const handleServicesChange = (serviceName: string, checked: boolean) => {
    const nextServices = checked
      ? [...selectedServices, serviceName]
      : selectedServices.filter((service) => service !== serviceName);

    const scopedDomains =
      nextServices.length === 0
        ? domainOptions
        : Array.from(
            new Set(
              serviceCatalog
                .filter((service) => nextServices.includes(service.name))
                .flatMap((service) => service.domains),
            ),
          );
    const scopedLocations =
      nextServices.length === 0
        ? locationOptions
        : Array.from(
            new Set(
              serviceCatalog
                .filter((service) => nextServices.includes(service.name))
                .flatMap((service) => service.locations),
            ),
          );

    setFormData({
      ...formData,
      service: nextServices.join(', '),
      domain: selectedDomains.filter((domain) => scopedDomains.includes(domain)).join(', '),
      unite: selectedDomains.filter((domain) => scopedDomains.includes(domain)).join(', '),
      site: selectedLocations.filter((location) => scopedLocations.includes(location)).join(', '),
    });
  };

  const handleDomainsChange = (domainName: string, checked: boolean) => {
    const values = checked
      ? [...selectedDomains, domainName]
      : selectedDomains.filter((domain) => domain !== domainName);
    setFormData({
      ...formData,
      domain: values.join(', '),
      unite: values.join(', '),
    });
  };

  const handleLocationsChange = (locationName: string, checked: boolean) => {
    const values = checked
      ? [...selectedLocations, locationName]
      : selectedLocations.filter((location) => location !== locationName);
    setFormData({
      ...formData,
      site: values.join(', '),
    });
  };

  // Calcul automatique: priorite initiale puis priorite finale residuelle.
  useEffect(() => {
    if (formData.severity && formData.probability) {
      const computed = computeRiskValues(
        formData.severity,
        formData.probability,
        formData.moyenMaitrise || '',
      );
      setFormData(prev => ({
        ...prev,
        riskLevel: computed.riskLevel,
        calculPriorite: computed.calculPriorite,
        prioriteFinale: computed.prioriteFinale,
        status: computeRiskWorkflowStatus(
          computed.riskLevel,
          prev.plannedMeasures || [],
        ),
      }));
    }
  }, [formData.severity, formData.probability, formData.moyenMaitrise, formData.plannedMeasures]);

  const handleView = (risk: Risk) => {
    setSelectedRisk(risk);
    setViewMode('view');
  };

  const handleEdit = (risk: Risk) => {
    setSelectedRisk(risk);
    setFormData(risk);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setSelectedRisk(null);
    setFormData({
      numeroRisque: nextRiskNumber(risks.map((risk) => risk.numeroRisque)),
      severity: 1,
      probability: 1,
      riskLevel: 1,
      calculPriorite: 1,
      prioriteFinale: 1,
      moyenMaitrise: '1',
      existingMeasures: [],
      plannedMeasures: [],
      status: 'a_traiter',
      category: 'risque'
    });
    setViewMode('create');
  };

  const handleDelete = (id: string) => {
    setRiskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (riskToDelete) {
      const targetId = String(riskToDelete);
      if (onDeleteRisk) {
        onDeleteRisk(targetId);
      } else {
        setRisks(risks.filter((risk) => String(risk.id) !== targetId));
        toast.success('Risque supprimé avec succès');
      }
      setDeleteDialogOpen(false);
      setRiskToDelete(null);
      if (String(selectedRisk?.id) === targetId) {
        setViewMode('list');
        setSelectedRisk(null);
      }
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedRisk(null);
    setFormData({});
  };

  const handleSave = () => {
    const measureNames = (formData.plannedMeasures || []).flatMap((measure) =>
      String(measure.responsible || "").split(",").map((name) => name.trim()).filter(Boolean),
    );
    const unknownNames = namesOutsideDirectory(
      [String(formData.responsable || ""), ...measureNames],
      concernedPersons,
    );
    if (!String(formData.responsable || "").trim() || unknownNames.length > 0) {
      toast.error(
        unknownNames.length > 0
          ? `Ces responsables ne sont pas dans Utilisateurs : ${unknownNames.join(", ")}`
          : "Choisissez un responsable dans Utilisateurs",
      );
      return;
    }
    if (viewMode === 'create') {
      const newRisk: Risk = {
        id: `risk-${Date.now()}`,
        numeroRisque: nextRiskNumber(risks.map((risk) => risk.numeroRisque)),
        title: formData.title || '',
        unite: formData.unite || '',
        service: formData.service || '',
        site: formData.site || '',
        domain: formData.domain || formData.unite || '',
        situation: formData.situation || '',
        associatedRisk: formData.associatedRisk || '',
        category: formData.category || 'risque',
        responsable: formData.responsable || '',
        severity: formData.severity || 1,
        probability: formData.probability || 1,
        riskLevel: computeRiskValues(
          formData.severity || 1,
          formData.probability || 1,
          formData.moyenMaitrise || '',
        ).riskLevel,
        existingMeasures: formData.existingMeasures || [],
        moyenMaitrise: formData.moyenMaitrise || '',
        calculPriorite: computeRiskValues(
          formData.severity || 1,
          formData.probability || 1,
          formData.moyenMaitrise || '',
        ).calculPriorite,
        prioriteFinale: computeRiskValues(
          formData.severity || 1,
          formData.probability || 1,
          formData.moyenMaitrise || '',
        ).prioriteFinale,
        plannedMeasures: formData.plannedMeasures || [],
        status: computeRiskWorkflowStatus(
          computeRiskValues(
            formData.severity || 1,
            formData.probability || 1,
            formData.moyenMaitrise || '',
          ).riskLevel,
          formData.plannedMeasures || [],
        ),
        echeance: formData.echeance || '',
        retourAction: formData.retourAction || '',
        observation: formData.observation || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRisks([...risks, newRisk]);
      toast.success('Risque créé avec succès');
    } else if (viewMode === 'edit' && selectedRisk) {
      const updatedRisk = {
        ...selectedRisk,
        ...formData,
        numeroRisque: selectedRisk.numeroRisque,
        category: formData.category || selectedRisk.category,
        riskLevel: computeRiskValues(
          formData.severity || selectedRisk.severity,
          formData.probability || selectedRisk.probability,
          formData.moyenMaitrise || selectedRisk.moyenMaitrise || '',
        ).riskLevel,
        calculPriorite: computeRiskValues(
          formData.severity || selectedRisk.severity,
          formData.probability || selectedRisk.probability,
          formData.moyenMaitrise || selectedRisk.moyenMaitrise || '',
        ).calculPriorite,
        prioriteFinale: computeRiskValues(
          formData.severity || selectedRisk.severity,
          formData.probability || selectedRisk.probability,
          formData.moyenMaitrise || selectedRisk.moyenMaitrise || '',
        ).prioriteFinale,
        updatedAt: new Date().toISOString()
      };
      setRisks(risks.map(r => r.id === selectedRisk.id ? updatedRisk as Risk : r));
      toast.success('Risque modifié avec succès');
    }
    handleBack();
  };

  const handleExportExcel = () => {
    try {
      // Préparer les données pour Excel
      const excelData = filteredRisks.map(risk => {
        const completedActions = risk.plannedMeasures?.filter(m => m.status === 'completed').length || 0;
        const totalActions = risk.plannedMeasures?.length || 0;
        const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

        return {
          'N° risque': risk.numeroRisque,
          'Risque': risk.title,
          'Unité': risk.unite || '-',
          'Domaine': risk.domain || risk.unite || '-',
          'Service': risk.service,
          'Site': risk.site,
          'Responsable': risk.responsable,
          'Situation dangereuse': risk.situation,
          'Dommages associés': risk.associatedRisk,
          'Gravité': risk.severity,
          'Fréquence': risk.probability,
          'Priorité initiale': risk.calculPriorite,
          'Moyen de maîtrise': formatMoyenMaitrise(risk.moyenMaitrise),
          'Niveau GFM': risk.riskLevel,
          'Priorité P1/P2/P3': getPriorityBandFromGfm(risk.riskLevel),
          'Priorité finale': risk.prioriteFinale,
          'Mesures existantes': risk.existingMeasures?.join('; ') || 'Aucune',
          'Actions planifiées': risk.plannedMeasures?.map(m => `${m.description} (${m.responsible})`).join('; ') || 'Aucune',
          'Avancement': `${completedActions}/${totalActions} (${progress}%)`,
          'Échéance': risk.echeance ? new Date(risk.echeance).toLocaleDateString('fr-FR') : '-',
          'Retour d\'action': risk.retourAction || '-',
          'Observation': risk.observation || '-',
          'Statut': getRiskWorkflowStatusLabel(risk.status)
        };
      });

      // Créer le fichier Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mise à jour des risques');

      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 15 }, // N° risque
        { wch: 30 }, // Risque
        { wch: 15 }, // Unité
        { wch: 20 }, // Service
        { wch: 15 }, // Site
        { wch: 20 }, // Responsable
        { wch: 40 }, // Situation dangereuse
        { wch: 40 }, // Dommages associés
        { wch: 10 }, // Gravité
        { wch: 12 }, // Probabilité
        { wch: 15 }, // Niveau de risque
        { wch: 15 }, // Priorité finale
        { wch: 40 }, // Mesures existantes
        { wch: 40 }, // Actions planifiées
        { wch: 20 }, // Avancement
        { wch: 12 }, // Échéance
        { wch: 40 }, // Retour d'action
        { wch: 40 }, // Observation
        { wch: 15 }  // Statut
      ];
      worksheet['!cols'] = colWidths;

      // Télécharger le fichier
      const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      XLSX.writeFile(workbook, `Gestion_Risques_${date}.xlsx`);

      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const getRiskLevelColor = (level: number) => {
    if (level > 9) return 'bg-red-100 text-red-800 border-red-300';
    if (level >= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const formatMoyenMaitrise = (value?: string) => formatMoyenMaitriseLabel(value);

  const getPriorityBandBadge = (level: number) => {
    const band = getPriorityBandFromGfm(level);
    const colors = {
      P1: 'bg-red-100 text-red-800 border-red-300',
      P2: 'bg-orange-100 text-orange-800 border-orange-300',
      P3: 'bg-green-100 text-green-800 border-green-300',
    };
    return <Badge className={`${colors[band]} font-bold`}>{band}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'a_traiter': { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'A traiter' },
      'en_traitement': { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'En traitement' },
      'maitrise': { color: 'bg-green-100 text-green-800 border-green-300', label: 'Maitrise' },
      'supprime': { color: 'bg-slate-200 text-slate-800 border-slate-300', label: 'Supprime' }
    };
    const c = config[status as keyof typeof config] || config['a_traiter'];
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const columnOptionsByKey = useMemo(() => {
    return Object.fromEntries(
      RISK_MANAGEMENT_FILTERABLE_COLUMNS.map((col) => [
        col.key,
        buildColumnFilterOptions(risks, col.key),
      ]),
    ) as Record<RiskManagementColumnKey, ReturnType<typeof buildColumnFilterOptions>>;
  }, [risks]);

  const patchColumnFilter = (key: RiskManagementColumnKey, filter: ColumnFilterState) => {
    setColumnFilters((previous) => ({ ...previous, [key]: filter }));
  };

  const renderFilterableTh = (
    key: RiskManagementColumnKey,
    label: string,
    minWidth: string,
    extraClassName = '',
  ) => (
    <th
      key={key}
      className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${extraClassName}`}
      style={{ minWidth }}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className="truncate">{label}</span>
        {columnSort?.key === key ? (
          <span className="text-[10px] font-bold text-sky-700" aria-hidden>
            {columnSort.direction === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
        <ColumnFilterPopover
          options={columnOptionsByKey[key]}
          filter={columnFilters[key]}
          kind={columnFilterKind(key)}
          sorted={columnSort?.key === key ? columnSort.direction : null}
          onApply={(filter) => patchColumnFilter(key, filter)}
          onSort={(direction) => setColumnSort({ key, direction })}
          ariaLabel={`Filtrer la colonne ${label}`}
        />
      </div>
    </th>
  );

  // Filtrer les risques
  const filteredRisks = risks.filter((risk) =>
    matchesRiskEvaluationFilters(risk, evaluationFilters, searchQuery) &&
    matchesRiskManagementColumnFilters(risk, columnFilters),
  );

  const sortedRisks = useMemo(() => {
    if (!columnSort) return filteredRisks;
    return [...filteredRisks].sort((left, right) =>
      compareRiskColumn(left, right, columnSort.key, columnSort.direction),
    );
  }, [filteredRisks, columnSort]);

  const listPageSize = TABLE_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(1, Math.ceil(sortedRisks.length / listPageSize));
  const paginatedRisks = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return sortedRisks.slice(start, start + listPageSize);
  }, [sortedRisks, listPage, listPageSize]);

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, columnFilters, evaluationFilters]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  // Vue liste
  if (viewMode === 'list') {
    return (
      <>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-3xl font-bold text-gray-900 break-words">Mise à jour des risques</h2>
                <p className="text-gray-600 mt-1">
                  Création et modification, réservées à l'administration. Même liste que Évaluation des risques.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="h-11 w-full rounded-xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
              <Button
                onClick={handleCreate}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg hover:from-purple-700 hover:to-indigo-700 sm:w-auto"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau risque
              </Button>
            </div>
          </div>

          <RiskEvaluationFiltersPanel
            filters={evaluationFilters}
            onChange={setEvaluationFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            visibleRisks={risks}
            resultCount={filteredRisks.length}
          />
          {hasActiveRiskManagementColumnFilters(columnFilters) ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 bg-white px-4 py-2">
              <p className="text-xs font-medium text-purple-700">
                Des filtres de colonnes sont actifs dans le tableau.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl text-slate-600"
                onClick={() => setColumnFilters(emptyRiskManagementColumnFilters())}
              >
                Réinitialiser les colonnes
              </Button>
            </div>
          ) : null}

          {/* Tableau des risques */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0 min-w-0">
              <div
                className="w-full overflow-x-scroll overflow-y-visible"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <table className="w-full" style={{ minWidth: '4400px' }}>
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50 sticky top-0 z-10">
                      <tr>
                        {renderFilterableTh('numeroRisque', 'N° risque', '130px')}
                        {renderFilterableTh('title', 'Risque', '200px')}
                        {renderFilterableTh('unite', 'Unité', '120px')}
                        {renderFilterableTh('domain', 'Domaine', '140px')}
                        {renderFilterableTh('service', 'Service', '150px')}
                        {renderFilterableTh('site', 'Site', '120px')}
                        {renderFilterableTh('responsable', 'Responsable', '150px')}
                        {renderFilterableTh('situation', 'Situation dangereuse', '250px')}
                        {renderFilterableTh('associatedRisk', 'Dommages associés', '250px')}
                        {renderFilterableTh('severity', 'Gravité', '80px')}
                        {renderFilterableTh('probability', 'Fréquence', '100px')}
                        {renderFilterableTh('calculPriorite', 'Priorité initiale', '120px')}
                        {renderFilterableTh('moyenMaitrise', 'Moyen de maîtrise', '150px')}
                        {renderFilterableTh('riskLevel', 'Niveau GFM', '120px')}
                        {renderFilterableTh('priorityBand', 'P1/P2/P3', '90px')}
                        {renderFilterableTh('prioriteFinale', 'Priorité finale', '120px')}
                        {renderFilterableTh('existingMeasures', 'Mesures existantes', '200px')}
                        {renderFilterableTh('plannedMeasures', 'Actions planifiées', '200px')}
                        {renderFilterableTh('progress', 'Avancement', '130px')}
                        {renderFilterableTh('echeance', 'Échéance', '110px')}
                        {renderFilterableTh('retourAction', 'Retour d\'action', '200px')}
                        {renderFilterableTh('observation', 'Observation', '200px')}
                        {renderFilterableTh('status', 'Statut', '100px')}
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gradient-to-r from-gray-50 to-slate-50 min-w-[150px] shadow-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRisks.map((risk, index) => {
                        const completedActions = risk.plannedMeasures?.filter(m => m.status === 'completed').length || 0;
                        const totalActions = risk.plannedMeasures?.length || 0;
                        const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

                        return (
                          <tr
                            key={risk.id}
                            className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-mono text-sm font-semibold text-gray-900">{risk.numeroRisque}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[200px]">
                                <p className={`text-sm font-medium truncate ${risk.detachedFromReference ? "text-amber-800" : "text-gray-900"}`}>
                                  {risk.detachedFromReference ? "Lié à aucun risque" : risk.title}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">{risk.unite || '-'}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">{risk.domain || risk.unite || '-'}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                {risk.service}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">{risk.site}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">{risk.responsable}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[250px] bg-orange-50 p-2 rounded border-l-2 border-orange-500">
                                <p className="text-xs text-gray-700 line-clamp-2">{risk.situation}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[250px] bg-red-50 p-2 rounded border-l-2 border-red-500">
                                <p className="text-xs text-gray-700 line-clamp-2">{risk.associatedRisk}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className="bg-red-100 text-red-800 border-red-300 font-bold">
                                {risk.severity}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 font-bold">
                                {risk.probability}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                                {risk.calculPriorite}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-xs text-gray-700">{formatMoyenMaitrise(risk.moyenMaitrise)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className={`${getRiskLevelColor(risk.riskLevel)} font-bold`}>
                                {risk.riskLevel}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              {getPriorityBandBadge(risk.riskLevel)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-bold">
                                {risk.prioriteFinale}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[200px]">
                                {risk.existingMeasures && risk.existingMeasures.length > 0 ? (
                                  <ul className="text-xs space-y-1">
                                    {risk.existingMeasures.slice(0, 3).map((measure, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-1">
                                          {idx + 1}
                                        </Badge>
                                        <span className="text-gray-700 line-clamp-1">{measure}</span>
                                      </li>
                                    ))}
                                    {risk.existingMeasures.length > 3 && (
                                      <li className="text-gray-500 italic">+{risk.existingMeasures.length - 3} autre(s)</li>
                                    )}
                                  </ul>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Aucune</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[200px]">
                                {risk.plannedMeasures && risk.plannedMeasures.length > 0 ? (
                                  <div className="text-xs space-y-1">
                                    {risk.plannedMeasures.slice(0, 2).map((measure, idx) => (
                                      <div key={idx} className="bg-gray-50 p-1 rounded border-l-2 border-blue-500">
                                        <p className="font-semibold text-gray-900 line-clamp-1">{measure.description}</p>
                                        <p className="text-gray-600">{measure.responsible}</p>
                                      </div>
                                    ))}
                                    {risk.plannedMeasures.length > 2 && (
                                      <p className="text-gray-500 italic">+{risk.plannedMeasures.length - 2} autre(s)</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Aucune</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 min-w-[120px]">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-gray-700">{completedActions}/{totalActions}</span>
                                  <span className="text-gray-500">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">
                                {risk.echeance ? new Date(risk.echeance).toLocaleDateString('fr-FR') : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[200px] bg-blue-50 p-2 rounded border-l-2 border-blue-500">
                                <p className="text-xs text-gray-700 line-clamp-2">{risk.retourAction || '-'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="max-w-[200px] bg-purple-50 p-2 rounded border-l-2 border-purple-500">
                                <p className="text-xs text-gray-700 line-clamp-2">{risk.observation || '-'}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getStatusBadge(risk.status)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap sticky right-0 bg-white">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleView(risk)}
                                  className="border-blue-300 hover:bg-blue-50"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(risk)}
                                  className="border-orange-300 hover:bg-orange-50"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(risk.id)}
                                  className="border-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredRisks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Aucun risque trouvé</p>
                    </div>
                  )}
              </div>
              <p className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100 bg-slate-50">
                Faites défiler horizontalement pour afficher toutes les colonnes du tableau.
              </p>
            </CardContent>
          </Card>

          <ListPaginationBar
            currentPage={listPage}
            totalPages={listTotalPages}
            totalItems={filteredRisks.length}
            onPageChange={setListPage}
            itemLabel="risque(s)"
          />
        </div>

        {/* Dialog de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce risque ? La fiche reste dans le référentiel, avec la mention « Lié à aucun risque ».
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  const openedRisk = selectedRisk
    ? risks.find((risk) => String(risk.id) === String(selectedRisk.id)) ?? null
    : null;

  if (viewMode === 'view' && openedRisk) {
    return (
      <>
        <RiskConsultationDetail
          risk={openedRisk}
          riskLevelGradient={riskLevelGradient}
          riskLevelLabel={getRiskLevelLabel}
          onBack={handleBack}
          onEdit={() => handleEdit(openedRisk)}
          onDelete={() => handleDelete(openedRisk.id)}
          canManage
          canProposeReturn={Boolean(onProposeReturn)}
          onProposeReturn={onProposeReturn ? () => onProposeReturn(openedRisk) : undefined}
          actionReturns={actionReturns.filter((item) => item.riskId === openedRisk.id)}
          userRole="admin"
          onManageActionReturns={onManageActionReturns}
          onLearnMore={onLearnMore ? () => onLearnMore(openedRisk) : undefined}
        />
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce risque ? La fiche reste dans le référentiel, avec la mention « Lié à aucun risque ».
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Même fiche que Consultation des risques : une modification est visible dans les deux onglets.
  const editingRisk = viewMode === 'edit' ? openedRisk : null;
  if (viewMode === 'edit' && !editingRisk) {
    return null;
  }

  return (
    <RiskEditView
      risk={editingRisk}
      existingRisks={risks}
      serviceOptions={serviceOptions}
      domainOptions={domainOptions}
      locationOptions={locationOptions}
      serviceCatalog={serviceCatalog}
      riskReferences={riskReferences}
      concernedPersons={concernedPersons}
      getCategoryIcon={getCategoryIcon}
      getCategoryColor={getCategoryColor}
      getRiskLevelColor={riskLevelGradient}
      getRiskLevelLabel={getRiskLevelLabel}
      onCancel={handleBack}
      onSave={(saved) => {
        if (editingRisk) {
          const updatedRisk: Risk = {
            ...editingRisk,
            ...saved,
            id: editingRisk.id,
            numeroRisque: editingRisk.numeroRisque,
            createdAt: editingRisk.createdAt,
            updatedAt: new Date().toISOString(),
          };
          setRisks((previous) =>
            previous.map((risk) => (String(risk.id) === String(editingRisk.id) ? updatedRisk : risk)),
          );
          toast.success('Risque modifié avec succès');
        } else {
          const newRisk: Risk = {
            ...saved,
            id: `risk-${Date.now()}`,
            numeroRisque: nextRiskNumber(risks.map((risk) => risk.numeroRisque)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setRisks((previous) => [...previous, newRisk]);
          toast.success('Risque créé avec succès');
        }
        handleBack();
      }}
    />
  );

  return (
    <div className="space-y-6 [&_label]:mb-2.5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" onClick={handleBack} className="h-11 shrink-0 rounded-xl border-slate-200 bg-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'create' ? 'Nouveau risque' : 'Modifier le risque'}
            </h2>
            <p className="text-sm text-gray-600 break-words">
              {viewMode === 'create' ? 'Créer un nouveau risque professionnel' : `N° ${formData.numeroRisque}`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
          {/* Informations générales */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Numéro de risque *</Label>
                  {riskReferences.length > 0 && (
                    <Select
                      value={selectedRiskReferenceValue}
                      onValueChange={(value) => {
                        if (value === "__custom__") return;
                        const selectedReference = riskReferences.find(
                          (ref) =>
                            `${ref.numeroRisque}::${ref.title}` ===
                            value,
                        );
                        if (!selectedReference) return;
                        setFormData({
                          ...formData,
                          title: selectedReference.title,
                        });
                      }}
                    >
                      <SelectTrigger className={`mb-2 ${fieldClass}`}>
                        <SelectValue placeholder="Intitulé du référentiel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__custom__">
                          Saisie libre
                        </SelectItem>
                        {riskReferences.map((reference) => (
                          <SelectItem
                            key={reference.id}
                            value={`${reference.numeroRisque}::${reference.title}`}
                          >
                            {`N° ${reference.numeroRisque} · ${reference.title}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    value={formData.numeroRisque || ''}
                    readOnly
                    placeholder="R-001"
                    className={fieldClass}
                  />
                </div>
                <ChoicePills
                  legend="Service *"
                  options={serviceOptions}
                  selected={selectedServices}
                  onToggle={handleServicesChange}
                  emptyHint="Aucun service n'est configuré."
                />
                <ChoicePills
                  legend="Lieux *"
                  options={availableLocationsForSelection}
                  selected={selectedLocations}
                  onToggle={handleLocationsChange}
                  emptyHint="Aucun lieu pour le service choisi."
                />
                <ChoicePills
                  legend="Domaine"
                  options={availableDomainsForSelection}
                  selected={selectedDomains}
                  onToggle={handleDomainsChange}
                  emptyHint="Aucun domaine pour le service choisi."
                />
                <div>
                  <Label>Responsable *</Label>
                  <DirectoryUserSelect
                    id="gestion-responsable"
                    value={String(formData.responsable || "")}
                    users={concernedPersons}
                    onChange={(fullName) => setFormData({ ...formData, responsable: fullName })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Description du risque</h3>
              <div className="space-y-4">
                <div>
                  <Label>Risque *</Label>
                  {riskReferences.length > 0 && (
                    <Select
                      value={selectedRiskReferenceValue}
                      onValueChange={(value) => {
                        if (value === "__custom__") return;
                        const selectedReference = riskReferences.find(
                          (ref) =>
                            `${ref.numeroRisque}::${ref.title}` ===
                            value,
                        );
                        if (!selectedReference) return;
                        setFormData({
                          ...formData,
                          title: selectedReference.title,
                        });
                      }}
                    >
                      <SelectTrigger className={`mb-2 ${fieldClass}`}>
                        <SelectValue placeholder="Intitulé du référentiel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__custom__">
                          Saisie libre
                        </SelectItem>
                        {riskReferences.map((reference) => (
                          <SelectItem
                            key={reference.id}
                            value={`${reference.numeroRisque}::${reference.title}`}
                          >
                            {`N° ${reference.numeroRisque} · ${reference.title}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Risque de chute de hauteur"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label>Situation dangereuse *</Label>
                  <Textarea
                    value={formData.situation || ''}
                    onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                    placeholder="Décrivez la situation dangereuse..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Dommage associé *</Label>
                  <Textarea
                    value={formData.associatedRisk || ''}
                    onChange={(e) => setFormData({ ...formData, associatedRisk: e.target.value })}
                    placeholder="Décrivez le dommage potentiel..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Évaluation */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Évaluation du risque</h3>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                  <Label className="text-sm font-bold text-orange-950">Gravité *</Label>
                  <Select
                    value={formData.severity?.toString() || '1'}
                    onValueChange={(value) => setFormData({ ...formData, severity: parseInt(value) })}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1. Faible</SelectItem>
                      <SelectItem value="2">2. Moyen</SelectItem>
                      <SelectItem value="3">3. Élevé</SelectItem>
                      <SelectItem value="4">4. Très élevé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
                  <Label className="text-sm font-bold text-sky-950">Fréquence *</Label>
                  <Select
                    value={formData.probability?.toString() || '1'}
                    onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1. Rare</SelectItem>
                      <SelectItem value="2">2. Peu probable</SelectItem>
                      <SelectItem value="3">3. Probable</SelectItem>
                      <SelectItem value="4">4. Très probable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <p className="text-sm font-bold text-violet-950">Niveau</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {(formData.severity || 1) * (formData.probability || 1)}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Niveau de maîtrise *</Label>
                  <Select
                    value={(formData.moyenMaitrise as string) || "1"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, moyenMaitrise: value })
                    }
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Aucun (coefficient 1)</SelectItem>
                      <SelectItem value="0.75">En cours (coefficient 0,75)</SelectItem>
                      <SelectItem value="0.5">Finalisé (coefficient 0,5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorité finale (1 à 16) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="16"
                    value={formData.prioriteFinale || 1}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 mt-4">
                <p className="text-xs text-gray-600 font-semibold mb-1">Calcul de la priorité</p>
                <p className="text-2xl font-bold text-yellow-800">{formData.calculPriorite || 1}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Priorité finale = priorité initiale × coefficient de maîtrise
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mesures existantes */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mesures de prévention existantes</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      existingMeasures: [...(formData.existingMeasures || []), '']
                    });
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.existingMeasures || []).map((measure, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {idx + 1}
                    </Badge>
                    <Input
                      value={measure}
                      onChange={(e) => {
                        const newMeasures = [...(formData.existingMeasures || [])];
                        newMeasures[idx] = e.target.value;
                        setFormData({ ...formData, existingMeasures: newMeasures });
                      }}
                      placeholder="Mesure de prévention..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          existingMeasures: (formData.existingMeasures || []).filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!formData.existingMeasures || formData.existingMeasures.length === 0) && (
                  <p className="text-gray-500 italic text-sm">Aucune mesure existante. Cliquez sur "Ajouter" pour en créer une.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mesures planifiées */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Actions planifiées
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      plannedMeasures: [
                        ...(formData.plannedMeasures || []),
                        {
                          description: '',
                          responsible: '',
                          deadline: '',
                          status: 'pending'
                        }
                      ]
                    });
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {(formData.plannedMeasures || []).map((measure, idx) => (
                  <Card key={idx} className="border-2 border-gray-300 bg-gray-50">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-blue-500 text-white">Action {idx + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              plannedMeasures: (formData.plannedMeasures || []).filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={measure.description}
                          onChange={(e) => {
                            const newMeasures = [...(formData.plannedMeasures || [])];
                            newMeasures[idx] = { ...newMeasures[idx], description: e.target.value };
                            setFormData({ ...formData, plannedMeasures: newMeasures });
                          }}
                          placeholder="Description de l'action..."
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Responsables</Label>
                          <DirectoryUserPills
                            users={concernedPersons}
                            selected={splitCsv(measure.responsible)}
                            onChange={(next) => {
                              const newMeasures = [...(formData.plannedMeasures || [])];
                              newMeasures[idx] = { ...newMeasures[idx], responsible: next.join(", ") };
                              setFormData({ ...formData, plannedMeasures: newMeasures });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Échéance</Label>
                          <Input
                            type="date"
                            value={measure.deadline}
                            onChange={(e) => {
                              const newMeasures = [...(formData.plannedMeasures || [])];
                              newMeasures[idx] = { ...newMeasures[idx], deadline: e.target.value };
                              setFormData({ ...formData, plannedMeasures: newMeasures });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Statut</Label>
                        <Select
                          value={measure.status}
                          onValueChange={(value: any) => {
                            const newMeasures = [...(formData.plannedMeasures || [])];
                            newMeasures[idx] = { ...newMeasures[idx], status: value };
                            setFormData({ ...formData, plannedMeasures: newMeasures });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">À faire</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!formData.plannedMeasures || formData.plannedMeasures.length === 0) && (
                  <p className="text-gray-500 italic text-sm">Aucune mesure planifiée. Cliquez sur "Ajouter" pour en créer une.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suivi */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Suivi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Statut *</Label>
                  <Select
                    value={formData.status || 'a_traiter'}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_traiter">À traiter</SelectItem>
                      <SelectItem value="en_traitement">En traitement</SelectItem>
                      <SelectItem value="maitrise">Maîtrisé</SelectItem>
                      <SelectItem value="supprime">Supprimé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Échéance</Label>
                  <Input
                    type="date"
                    value={formData.echeance || ''}
                    onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Retour d'action</Label>
                <Textarea
                  value={formData.retourAction || ''}
                  onChange={(e) => setFormData({ ...formData, retourAction: e.target.value })}
                  placeholder="Retour d'action..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Observations</Label>
                <Textarea
                  value={formData.observation || ''}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Observations complémentaires..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pb-6">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 sm:w-auto"
            >
              {viewMode === 'create' ? 'Créer le risque' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
    </div>
  );
}
