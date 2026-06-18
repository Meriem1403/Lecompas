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
import * as XLSX from 'xlsx';
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';
import { computeRiskValues, computeRiskWorkflowStatus, getPriorityBandFromGfm, getRiskWorkflowStatusLabel, type RiskWorkflowStatus } from '@/app/services/riskPriority';

export interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
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
}: RisksManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [listPage, setListPage] = useState(1);

  // Form state pour création/édition
  const [formData, setFormData] = useState<Partial<Risk>>({});

  const selectedRiskReferenceValue = riskReferences.some(
    (ref) =>
      ref.numeroRisque === (formData.numeroRisque || "") &&
      ref.title === (formData.title || ""),
  )
    ? `${formData.numeroRisque}::${formData.title}`
    : "__custom__";

  const splitCsv = (value?: string) =>
    (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const selectedServices = splitCsv(formData.service);
  const selectedDomains = splitCsv(formData.domain || formData.unite);
  const selectedLocations = splitCsv(formData.site);

  const matchesScope = (personValue: string, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const personValues = splitCsv(personValue).map((value) =>
      value.toLowerCase(),
    );
    return selectedValues.some((value) =>
      personValues.includes(value.toLowerCase()),
    );
  };

  const filteredResponsibleOptions = concernedPersons
    .filter(
      (person) =>
        matchesScope(person.service, selectedServices) &&
        matchesScope(person.domain, selectedDomains) &&
        matchesScope(person.location, selectedLocations),
    )
    .map((person) => person.fullName)
    .filter(Boolean);

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
      numeroRisque: `RISK-${new Date().getFullYear()}-${String(risks.length + 1).padStart(3, '0')}`,
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
      setRisks(risks.filter(r => String(r.id) !== targetId));
      toast.success('Risque supprimé avec succès');
      setDeleteDialogOpen(false);
      setRiskToDelete(null);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedRisk(null);
    setFormData({});
  };

  const handleSave = () => {
    if (viewMode === 'create') {
      const newRisk: Risk = {
        id: `risk-${Date.now()}`,
        numeroRisque: formData.numeroRisque || `R-${String(risks.length + 1).padStart(3, '0')}`,
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gestion des risques');

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

  const formatMoyenMaitrise = (value?: string) => {
    if (value === '0.75') return 'En cours (0,75)';
    if (value === '0.5') return 'Finalisé (0,5)';
    return 'Aucun (1)';
  };

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

  // Filtrer les risques
  const filteredRisks = risks.filter(risk => {
    const matchesSearch = 
      risk.numeroRisque.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.situation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || risk.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const listPageSize = TABLE_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(1, Math.ceil(filteredRisks.length / listPageSize));
  const paginatedRisks = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return filteredRisks.slice(start, start + listPageSize);
  }, [filteredRisks, listPage, listPageSize]);

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, filterStatus]);

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
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 break-words">Gestion des risques</h2>
                <p className="text-gray-600">{risks.length} risque{risks.length > 1 ? 's' : ''} répertorié{risks.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter Excel
              </Button>
              <Button
                onClick={handleCreate}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau risque
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="w-full md:flex-1">
                  <Input
                    placeholder="Rechercher par numéro, titre, service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[220px] bg-white border-2 border-slate-400 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="a_traiter">A traiter</SelectItem>
                    <SelectItem value="en_traitement">En traitement</SelectItem>
                    <SelectItem value="maitrise">Maitrise</SelectItem>
                    <SelectItem value="supprime">Supprime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

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
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[130px]">N° risque</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Risque</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">Unité</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[140px]">Domaine</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">Service</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">Site</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">Responsable</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]">Situation dangereuse</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]">Dommages associés</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">Gravité</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">Fréquence</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">Priorité initiale</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">Moyen de maîtrise</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">Niveau GFM</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[90px]">P1/P2/P3</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">Priorité finale</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Mesures existantes</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Actions planifiées</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[130px]">Avancement</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[110px]">Échéance</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Retour d'action</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">Observation</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">Statut</th>
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
                                <p className="text-sm font-medium text-gray-900 truncate">{risk.title}</p>
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
                Êtes-vous sûr de vouloir supprimer ce risque ? Cette action est irréversible.
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

  // Vue détail
  if (viewMode === 'view' && selectedRisk) {
    return (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{selectedRisk.numeroRisque}</h2>
              <p className="text-sm text-gray-600 break-words">{selectedRisk.title}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {getStatusBadge(selectedRisk.status)}
            <Button onClick={() => handleEdit(selectedRisk)} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="space-y-6">
            {/* Informations générales */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Numéro de risque</Label>
                    <p className="font-mono font-semibold text-gray-900">{selectedRisk.numeroRisque}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Services</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedRisk.service || '')
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((service) => (
                          <Badge key={service} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {service}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Lieux</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedRisk.site || '')
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((location) => (
                          <Badge key={location} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                            {location}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Domaines</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedRisk.domain || selectedRisk.unite || '')
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((domain) => (
                          <Badge key={domain} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {domain}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Responsable</Label>
                    <p className="font-semibold text-gray-900">{selectedRisk.responsable}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description du risque */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Description du risque</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-600 font-semibold">Risque</Label>
                    <p className="text-gray-900 mt-1 font-medium">{selectedRisk.title}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Situation dangereuse
                    </Label>
                    <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 mt-2">
                      <p className="text-gray-700">{selectedRisk.situation}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600 font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Dommages associés
                    </Label>
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 mt-2">
                      <p className="text-gray-700">{selectedRisk.associatedRisk}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Évaluation */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Évaluation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200 text-center">
                    <Label className="text-gray-600 text-xs font-semibold">Gravité</Label>
                    <p className="text-4xl font-bold text-red-600 mt-2">{selectedRisk.severity}/4</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200 text-center">
                    <Label className="text-gray-600 text-xs font-semibold">Probabilité</Label>
                    <p className="text-4xl font-bold text-yellow-600 mt-2">{selectedRisk.probability}/4</p>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-300 text-center">
                  <Label className="text-gray-600 text-xs font-semibold mb-1">Niveau de risque (calculé)</Label>
                  <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mt-2">{selectedRisk.riskLevel}</p>
                  <p className="text-sm font-semibold text-gray-600 mt-2">
                    {selectedRisk.riskLevel > 9 ? 'P1' : selectedRisk.riskLevel >= 4 ? 'P2' : 'P3'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statut */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Statut du risque
                </h3>
                <Badge className={`w-full justify-center font-bold text-base py-3 ${
                  selectedRisk.status === 'maitrise' ? 'bg-green-100 text-green-800 border-green-300' :
                  selectedRisk.status === 'en_traitement' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                  selectedRisk.status === 'supprime' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                  'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {getRiskWorkflowStatusLabel(selectedRisk.status)}
                </Badge>
              </CardContent>
            </Card>

            {/* Mesures existantes */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Mesures de prévention existantes</h3>
                {selectedRisk.existingMeasures && selectedRisk.existingMeasures.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedRisk.existingMeasures.map((measure, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {idx + 1}
                        </Badge>
                        <span className="text-gray-700">{measure}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">Aucune mesure existante</p>
                )}
              </CardContent>
            </Card>

            {/* Mesures planifiées */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Actions planifiées
                </h3>
                {selectedRisk.plannedMeasures && selectedRisk.plannedMeasures.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRisk.plannedMeasures.map((measure, idx) => (
                      <div key={idx} className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
                          <div className="flex-1">
                            <Badge className="bg-blue-500 text-white mb-2">Action {idx + 1}</Badge>
                            <p className="font-medium text-gray-900">{measure.description}</p>
                          </div>
                          <Badge className={
                            measure.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                            measure.status === 'in_progress' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }>
                            {measure.status === 'completed' ? 'Terminée' : measure.status === 'in_progress' ? 'En cours' : 'En attente'}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600 mt-2">
                          <span>{measure.responsible}</span>
                          <span>{measure.deadline ? new Date(measure.deadline).toLocaleDateString('fr-FR') : 'Pas de date'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Aucune action planifiée</p>
                )}
              </CardContent>
            </Card>

            {/* Évaluation Avancée */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-cyan-600" />
                  Évaluation avancée
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Moyen de maîtrise</Label>
                    <p className="text-gray-900 mt-1 font-semibold">{selectedRisk.moyenMaitrise || 'Non défini'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Priorité finale</Label>
                    <p className="text-gray-900 mt-1 font-semibold">{selectedRisk.prioriteFinale}</p>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Calcul de la priorité</p>
                  <p className="text-3xl font-bold text-yellow-800">{selectedRisk.calculPriorite || selectedRisk.riskLevel}</p>
                </div>
              </CardContent>
            </Card>

            {/* Suivi et échéances */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-600" />
                  Suivi et échéances
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600">Échéance globale</Label>
                    <p className="text-gray-900 mt-1 font-semibold">
                      {selectedRisk.echeance ? new Date(selectedRisk.echeance).toLocaleDateString('fr-FR') : 'Non définie'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Retour d&apos;action</Label>
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 mt-1">
                      <p className="text-gray-700">{selectedRisk.retourAction || 'Aucun retour'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Observation</Label>
                    <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500 mt-1">
                      <p className="text-gray-700">{selectedRisk.observation || 'Aucune observation'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    );
  }

  // Vue création/édition
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'create' ? 'Nouveau risque' : 'Modifier le risque'}
            </h2>
            <p className="text-sm text-gray-600 break-words">
              {viewMode === 'create' ? 'Créer un nouveau risque professionnel' : `Modification de ${formData.numeroRisque}`}
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
                          numeroRisque:
                            selectedReference.numeroRisque,
                          title: selectedReference.title,
                        });
                      }}
                    >
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="Sélectionner dans le référentiel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__custom__">
                          Saisie manuelle
                        </SelectItem>
                        {riskReferences.map((reference) => (
                          <SelectItem
                            key={reference.id}
                            value={`${reference.numeroRisque}::${reference.title}`}
                          >
                            {reference.numeroRisque} -{" "}
                            {reference.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    value={formData.numeroRisque || ''}
                    onChange={(e) => setFormData({ ...formData, numeroRisque: e.target.value })}
                    placeholder="R-001"
                  />
                </div>
                <div>
                  <Label>Service *</Label>
                  <div className="w-full min-h-[120px] rounded-md border border-gray-200 bg-white p-3 space-y-2">
                    {serviceOptions.map((service) => (
                      <label key={service} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service)}
                          onChange={(e) => handleServicesChange(service, e.target.checked)}
                        />
                        {service}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Lieux *</Label>
                  <div className="w-full min-h-[120px] rounded-md border border-gray-200 bg-white p-3 space-y-2">
                    {availableLocationsForSelection.map((location) => (
                      <label key={location} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location)}
                          onChange={(e) => handleLocationsChange(location, e.target.checked)}
                        />
                        {location}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Domaine</Label>
                  <div className="w-full min-h-[120px] rounded-md border border-gray-200 bg-white p-3 space-y-2">
                    {availableDomainsForSelection.map((domain) => (
                      <label key={domain} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedDomains.includes(domain)}
                          onChange={(e) => handleDomainsChange(domain, e.target.checked)}
                        />
                        {domain}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Responsable *</Label>
                  <Select
                    value={(formData.responsable as string) || "__empty__"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        responsable:
                          value === "__empty__" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">
                        Non renseigné
                      </SelectItem>
                      {filteredResponsibleOptions.map((person) => (
                        <SelectItem key={person} value={person}>
                          {person}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          numeroRisque:
                            selectedReference.numeroRisque,
                          title: selectedReference.title,
                        });
                      }}
                    >
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="Sélectionner dans le référentiel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__custom__">
                          Saisie manuelle
                        </SelectItem>
                        {riskReferences.map((reference) => (
                          <SelectItem
                            key={reference.id}
                            value={`${reference.numeroRisque}::${reference.title}`}
                          >
                            {reference.numeroRisque} -{" "}
                            {reference.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Risque de chute de hauteur"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gravité (1-4) *</Label>
                  <Select
                    value={formData.severity?.toString() || '1'}
                    onValueChange={(value) => setFormData({ ...formData, severity: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Mineure</SelectItem>
                      <SelectItem value="2">2 - Significative</SelectItem>
                      <SelectItem value="3">3 - Grave</SelectItem>
                      <SelectItem value="4">4 - Très grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Probabilité (1-4) *</Label>
                  <Select
                    value={formData.probability?.toString() || '1'}
                    onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Rare</SelectItem>
                      <SelectItem value="2">2 - Possible</SelectItem>
                      <SelectItem value="3">3 - Probable</SelectItem>
                      <SelectItem value="4">4 - Très probable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 mt-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Niveau de Risque (Calculé) :</strong>
                </p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
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
                    <SelectTrigger>
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
                          <div className="space-y-2 rounded-md border border-gray-200 bg-white p-3">
                            <div className="max-h-28 space-y-1 overflow-y-auto">
                              {filteredResponsibleOptions.map((person) => {
                                const selectedResponsible = splitCsv(measure.responsible);
                                const isChecked = selectedResponsible.includes(person);
                                return (
                                  <label key={person} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const nextValues = e.target.checked
                                          ? [...selectedResponsible, person]
                                          : selectedResponsible.filter((value) => value !== person);
                                        const newMeasures = [...(formData.plannedMeasures || [])];
                                        newMeasures[idx] = { ...newMeasures[idx], responsible: nextValues.join(", ") };
                                        setFormData({ ...formData, plannedMeasures: newMeasures });
                                      }}
                                    />
                                    {person}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a_traiter">A traiter</SelectItem>
                      <SelectItem value="en_traitement">En traitement</SelectItem>
                      <SelectItem value="maitrise">Maitrise</SelectItem>
                      <SelectItem value="supprime">Supprime</SelectItem>
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
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 whitespace-normal text-center h-auto py-2"
            >
              {viewMode === 'create' ? 'Créer le risque' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
    </div>
  );
}
