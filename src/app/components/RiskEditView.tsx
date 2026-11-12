import React, { useEffect, useState } from 'react';
import { useLeaveGuard } from '@/app/components/leaveGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import {
  ChoicePills,
  DirectoryUserPills,
  DirectoryUserSelect,
  namesOutsideDirectory,
} from '@/app/components/risks/RiskFormControls';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  Shield,
  Calendar,
} from 'lucide-react';
import { computeRiskValues, computeRiskWorkflowStatus, getRiskWorkflowStatusLabel, inferMaitriseCoefficientFromMeasures, type RiskWorkflowStatus } from '@/app/services/riskPriority';
import { nextRiskNumber } from '@/app/utils/riskSequence';
import { RiskEvaluationFacts, RiskProgress } from '@/app/components/risks/RiskEvaluationFacts';

interface Risk {
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

interface ServiceCatalogItem {
  name: string;
  domains: string[];
  locations: string[];
}

interface RiskEditViewProps {
  risk: Risk | null;
  onSave: (risk: Risk) => void;
  onCancel: () => void;
  getCategoryIcon: (category: string) => any;
  getCategoryColor: (category: string) => string;
  getRiskLevelColor: (level: number) => string;
  getRiskLevelLabel: (level: number) => string;
  existingRisks?: Risk[];
  serviceOptions?: string[];
  domainOptions?: string[];
  locationOptions?: string[];
  serviceCatalog?: ServiceCatalogItem[];
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

function DateField({
  id,
  value,
  onChange,
  required,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative w-full">
      <input
        id={id}
        type="date"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="relative h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2.5 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
    </div>
  );
}

const selectFieldClass = "h-11 rounded-xl border-slate-200 bg-white py-0 shadow-sm data-[size=default]:h-11";

export function RiskEditView({
  risk,
  onSave,
  onCancel,
  getCategoryIcon,
  getCategoryColor,
  getRiskLevelColor,
  getRiskLevelLabel,
  existingRisks = [],
  serviceOptions = [],
  domainOptions = [],
  locationOptions = [],
  serviceCatalog = [],
  riskReferences = [],
  concernedPersons = [],
}: RiskEditViewProps) {
  const requestLeave = useLeaveGuard();
  const suggestedNumber = nextRiskNumber(existingRisks.map((item) => item.numeroRisque));
  const [formData, setFormData] = useState<Risk>(risk || {
    id: '',
    numeroRisque: suggestedNumber,
    title: '',
    unite: '',
    domain: '',
    service: '',
    site: '',
    situation: '',
    associatedRisk: '',
    category: 'risque',
    responsable: '',
    severity: 1,
    probability: 1,
    riskLevel: 1,
    existingMeasures: [],
    moyenMaitrise: '1',
    calculPriorite: 0,
    prioriteFinale: 1,
    plannedMeasures: [],
    status: 'a_traiter',
    echeance: new Date().toISOString().split('T')[0],
    retourAction: '',
    observation: '',
    createdAt: '',
    updatedAt: ''
  });

  useEffect(() => {
    if (risk) return;
    setFormData((prev) =>
      prev.numeroRisque === suggestedNumber ? prev : { ...prev, numeroRisque: suggestedNumber },
    );
  }, [risk, suggestedNumber]);

  const splitCsv = (value?: string) =>
    (value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const selectedServices = splitCsv(formData.service);
  const selectedDomains = splitCsv(formData.domain);
  const selectedLocations = splitCsv(formData.site);

  const availableDomainsForSelection = React.useMemo(() => {
    if (selectedServices.length === 0) return domainOptions;
    return Array.from(
      new Set(
        serviceCatalog
          .filter((service) => selectedServices.includes(service.name))
          .flatMap((service) => service.domains),
      ),
    );
  }, [selectedServices, serviceCatalog, domainOptions]);

  const availableLocationsForSelection = React.useMemo(() => {
    if (selectedServices.length === 0) return locationOptions;
    return Array.from(
      new Set(
        serviceCatalog
          .filter((service) => selectedServices.includes(service.name))
          .flatMap((service) => service.locations),
      ),
    );
  }, [selectedServices, serviceCatalog, locationOptions]);

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

    const nextDomains = selectedDomains.filter((domain) =>
      scopedDomains.includes(domain),
    );
    const nextLocations = selectedLocations.filter((location) =>
      scopedLocations.includes(location),
    );

    setFormData({
      ...formData,
      service: nextServices.join(', '),
      domain: nextDomains.join(', '),
      site: nextLocations.join(', '),
    });
  };

  const handleDomainsChange = (domainName: string, checked: boolean) => {
    const values = checked
      ? [...selectedDomains, domainName]
      : selectedDomains.filter((domain) => domain !== domainName);
    setFormData({
      ...formData,
      domain: values.join(', '),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const measureNames = (formData.plannedMeasures || []).flatMap((measure) =>
      String(measure.responsible || "").split(",").map((name) => name.trim()).filter(Boolean),
    );
    const unknownNames = namesOutsideDirectory(
      [formData.responsable, ...measureNames],
      concernedPersons,
    );
    if (!formData.responsable.trim() || unknownNames.length > 0) {
      toast.error(
        unknownNames.length > 0
          ? `Ces responsables ne sont pas dans Utilisateurs : ${unknownNames.join(", ")}`
          : "Choisissez un responsable dans Utilisateurs",
      );
      return;
    }
    const inferredMaitrise = inferMaitriseCoefficientFromMeasures(
      formData.plannedMeasures || [],
    );
    const computed = computeRiskValues(
      formData.severity,
      formData.probability,
      inferredMaitrise,
    );
    onSave({
      ...formData,
      numeroRisque: risk ? risk.numeroRisque : suggestedNumber,
      moyenMaitrise: inferredMaitrise,
      category: formData.category || risk?.category || "risque",
      riskLevel: computed.riskLevel,
      calculPriorite: computed.calculPriorite,
      prioriteFinale: computed.prioriteFinale,
      status: computeRiskWorkflowStatus(
        computed.riskLevel,
        formData.plannedMeasures || [],
      ),
    });
  };

  const addExistingMeasure = () => {
    setFormData({
      ...formData,
      existingMeasures: [...(formData.existingMeasures || []), '']
    });
  };

  const updateExistingMeasure = (index: number, value: string) => {
    const newMeasures = [...(formData.existingMeasures || [])];
    newMeasures[index] = value;
    setFormData({ ...formData, existingMeasures: newMeasures });
  };

  const removeExistingMeasure = (index: number) => {
    setFormData({
      ...formData,
      existingMeasures: formData.existingMeasures.filter((_, i) => i !== index)
    });
  };

  const addPlannedMeasure = () => {
    setFormData({
      ...formData,
      plannedMeasures: [
        ...(formData.plannedMeasures || []),
        {
          description: '',
          responsible: '',
          deadline: new Date().toISOString().split('T')[0],
          status: 'pending'
        }
      ]
    });
  };

  const updatePlannedMeasure = (index: number, field: string, value: any) => {
    const newMeasures = [...(formData.plannedMeasures || [])];
    newMeasures[index] = { ...newMeasures[index], [field]: value };
    setFormData({ ...formData, plannedMeasures: newMeasures });
  };

  const removePlannedMeasure = (index: number) => {
    setFormData({
      ...formData,
      plannedMeasures: formData.plannedMeasures.filter((_, i) => i !== index)
    });
  };

  // Calcul automatique: priorite initiale puis priorite finale residuelle.
  React.useEffect(() => {
    const inferredMaitrise = inferMaitriseCoefficientFromMeasures(
      formData.plannedMeasures || [],
    );
    const computed = computeRiskValues(
      formData.severity,
      formData.probability,
      inferredMaitrise,
    );
    setFormData((prev) => ({
      ...prev,
      moyenMaitrise: inferredMaitrise,
      riskLevel: computed.riskLevel,
      calculPriorite: computed.calculPriorite,
      prioriteFinale: computed.prioriteFinale,
      status: computeRiskWorkflowStatus(
        computed.riskLevel,
        prev.plannedMeasures || [],
      ),
    }));
  }, [formData.severity, formData.probability, formData.plannedMeasures]);

  const priorityGradient = getRiskLevelColor(formData.riskLevel);
  const riskNumber = risk ? risk.numeroRisque : suggestedNumber;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="gap-4 overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur">
          <div className={`h-2 bg-gradient-to-r ${priorityGradient}`} />
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-11 border-slate-200 bg-white text-base shadow-sm"
                placeholder="Nom du risque"
                required
              />
            </div>
            {riskReferences.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Label>Intitulé du référentiel</Label>
                <Select
                  value={
                    riskReferences.find((ref) => ref.title === formData.title)?.id ?? "__custom__"
                  }
                  onValueChange={(value) => {
                    if (value === "__custom__") return;
                    const selectedReference = riskReferences.find((ref) => ref.id === value);
                    if (!selectedReference) return;
                    setFormData({ ...formData, title: selectedReference.title });
                  }}
                >
                  <SelectTrigger className={selectFieldClass}>
                    <SelectValue placeholder="Choisir pour remplir le titre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__custom__">Saisie libre</SelectItem>
                    {riskReferences.map((reference) => (
                      <SelectItem key={reference.id} value={reference.id}>
                        {reference.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="severity">Gravité</Label>
                <Select
                  value={formData.severity.toString()}
                  onValueChange={(value) => setFormData({ ...formData, severity: parseInt(value) })}
                >
                  <SelectTrigger id="severity" className={selectFieldClass}>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="probability">Fréquence</Label>
                <Select
                  value={formData.probability.toString()}
                  onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                >
                  <SelectTrigger id="probability" className={selectFieldClass}>
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
            <RiskEvaluationFacts
              calculPriorite={formData.calculPriorite}
              moyenMaitrise={formData.moyenMaitrise}
              riskLevel={formData.riskLevel}
              prioriteFinale={formData.prioriteFinale}
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <h2 className="text-base font-bold text-slate-800">Identification</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[11rem_1fr]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numeroRisque">Numéro</Label>
                  <p
                    id="numeroRisque"
                    className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-800"
                  >
                    {riskNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    {risk
                      ? "Numéro déjà attribué à cette fiche. L'intitulé du référentiel ne le change pas."
                      : "Prochain numéro, à la suite des fiches déjà enregistrées."}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="responsable">Responsable</Label>
                <DirectoryUserSelect
                  id="responsable"
                  value={formData.responsable}
                  users={concernedPersons}
                  onChange={(fullName) => setFormData({ ...formData, responsable: fullName })}
                />
                </div>
              </div>
              <ChoicePills
                legend="Service"
                tone="blue"
                options={serviceOptions}
                selected={selectedServices}
                onToggle={handleServicesChange}
                emptyHint="Aucun service n'est configuré."
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor="unite">Unité</Label>
                <Input
                  id="unite"
                  value={formData.unite}
                  onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                  className="h-11 rounded-xl border-slate-200 bg-white shadow-sm"
                  placeholder="Unité"
                />
              </div>
              <ChoicePills
                legend="Domaine"
                tone="indigo"
                options={availableDomainsForSelection}
                selected={selectedDomains}
                onToggle={handleDomainsChange}
                emptyHint="Aucun domaine pour le service choisi."
              />
              <ChoicePills
                legend="Lieu"
                tone="emerald"
                options={availableLocationsForSelection}
                selected={selectedLocations}
                onToggle={handleLocationsChange}
                emptyHint="Aucun lieu pour le service choisi."
              />
            </section>

            <section className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Situation dangereuse
              </h2>
              <Textarea
                id="situation"
                value={formData.situation}
                onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                className="min-h-28 border-orange-200 bg-white"
                placeholder="Décrivez la situation"
                required
              />
            </section>

            <section className="space-y-4 rounded-2xl border border-red-100 bg-red-50/40 p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Shield className="h-4 w-4 text-red-500" />
                Dommages associés
              </h2>
              <Textarea
                id="associatedRisk"
                value={formData.associatedRisk}
                onChange={(e) => setFormData({ ...formData, associatedRisk: e.target.value })}
                className="min-h-24 border-red-200 bg-white"
                placeholder="Décrivez les dommages"
                required
              />
            </section>

            <section className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-slate-800">Mesures de prévention existantes</h2>
                <Button
                  type="button"
                  size="sm"
                  onClick={addExistingMeasure}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm hover:from-emerald-600 hover:to-green-600"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.existingMeasures && formData.existingMeasures.length > 0 ? (
                  formData.existingMeasures.map((measure, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={measure}
                        onChange={(e) => updateExistingMeasure(idx, e.target.value)}
                        placeholder="Mesure de prévention"
                        className="h-11 flex-1 rounded-xl border-emerald-200 bg-white"
                        aria-label={`Mesure ${idx + 1}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeExistingMeasure(idx)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Retirer la mesure ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-emerald-200 bg-white px-3 py-3 text-sm text-slate-500">Aucune mesure pour le moment.</p>
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/40 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-slate-800">Actions planifiées</h2>
                <Button
                  type="button"
                  size="sm"
                  onClick={addPlannedMeasure}
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm hover:from-sky-600 hover:to-cyan-600"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <RiskProgress
                completed={(formData.plannedMeasures || []).filter((measure) => measure.status === "completed").length}
                total={(formData.plannedMeasures || []).length}
              />
              <div className="space-y-4">
                {formData.plannedMeasures && formData.plannedMeasures.length > 0 ? (
                  formData.plannedMeasures.map((measure, idx) => (
                    <div key={idx} className="space-y-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800">Action {idx + 1}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removePlannedMeasure(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Description</Label>
                          <Textarea
                            value={measure.description}
                            onChange={(e) => updatePlannedMeasure(idx, 'description', e.target.value)}
                            placeholder="Description de l'action"
                            className="min-h-24 border-slate-200 bg-slate-50"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Responsables</Label>
                          <DirectoryUserPills
                            users={concernedPersons}
                            selected={splitCsv(measure.responsible)}
                            onChange={(next) => updatePlannedMeasure(idx, "responsible", next.join(", "))}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <Label>Échéance</Label>
                              <DateField
                                value={measure.deadline}
                                onChange={(value) => updatePlannedMeasure(idx, 'deadline', value)}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label>Statut</Label>
                              <Select
                                value={measure.status}
                                onValueChange={(value) => updatePlannedMeasure(idx, 'status', value)}
                              >
                                <SelectTrigger className={selectFieldClass}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">En attente</SelectItem>
                                  <SelectItem value="in_progress">En cours</SelectItem>
                                  <SelectItem value="completed">Terminée</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-sky-200 bg-white px-3 py-3 text-sm text-slate-500">Aucune action pour le moment.</p>
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
              <h2 className="text-base font-bold text-slate-800">Suivi</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="echeance">Échéance</Label>
                  <DateField
                    id="echeance"
                    value={formData.echeance}
                    onChange={(value) => setFormData({ ...formData, echeance: value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Statut</Label>
                  <p className="flex h-11 w-full items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-800">
                    {getRiskWorkflowStatusLabel(formData.status)}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100">
                <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
                  <label htmlFor="retourAction" className="text-sm font-semibold text-slate-800">Retour d'action</label>
                  <p className="mt-0.5 text-xs text-slate-500">Avancement conservé sur la fiche</p>
                </div>
                <textarea
                  id="retourAction"
                  value={formData.retourAction}
                  onChange={(e) => setFormData({ ...formData, retourAction: e.target.value })}
                  placeholder="Écrivez ici l'avancement des actions"
                  className="min-h-40 w-full resize-y bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
                <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-4 py-3">
                  <label htmlFor="observation" className="text-sm font-semibold text-slate-800">Observation</label>
                  <p className="mt-0.5 text-xs text-slate-500">Complément utile au suivi</p>
                </div>
                <textarea
                  id="observation"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Ajoutez une observation"
                  className="min-h-40 w-full resize-y bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </section>
          </CardContent>
          <div className="sticky bottom-3 z-20 mx-4 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
            <Button type="button" variant="outline" onClick={() => requestLeave(onCancel)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-700 hover:to-indigo-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </Card>
    </form>
  );
}
