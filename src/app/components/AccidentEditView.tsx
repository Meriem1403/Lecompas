import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Activity,
  MapPin,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Users,
  Check,
  X,
  Save,
  PlusCircle,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { AccidentFormSidebar, isAccidentStoppageFormValid } from './AccidentFormSidebar';
import { enrichAccidentWithRegulatoryGravity, normalizeAccidentStoppageFields } from '@/app/utils/accidentRegulatoryGravity';
import { normalizeAccidentTime } from '@/app/utils/accidentDateTime';
import { AccidentLesionsFields } from './AccidentLesionsFields';
import { AccidentExtendedFields } from './AccidentExtendedFields';
import {
  normalizeAccidentRecord,
  splitVictimName,
  validateAccidentCore,
  type AccidentDuerpRiskRef,
} from '@/app/utils/accidentRecord';
import { toast } from 'sonner';

interface Accident {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: 'bénin' | 'modéré' | 'grave' | 'très_grave';
  hasWorkStoppage?: boolean;
  workStoppageStartDate?: string;
  workStoppageEndDate?: string;
  workStoppageDays?: number;
  hasReturnToWorkMedicalConditions?: boolean;
  returnToWorkMedicalConditions?: string;
  regulatoryGravity?: 'G1' | 'G2' | 'G3' | 'G4' | 'G5';
  time?: string;
  type: 'travail' | 'trajet' | 'maladie_pro';
  victim: string;
  victimFirstName?: string;
  victimLastName?: string;
  accidentCategory?: string;
  accidentEventType?: string;
  circumstances?: string;
  accidentCauses?: string;
  causeAnalysis?: string;
  comments?: string;
  duerpRiskId?: string;
  duerpRiskFreeText?: string;
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

interface AccidentEditViewProps {
  accident: Accident;
  onSave: (accident: Accident) => void;
  onCancel: () => void;
  risks: AccidentDuerpRiskRef[];
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

export function AccidentEditView({ 
  accident, 
  onSave, 
  onCancel,
  risks,
  agents,
  serviceOptions,
  domainOptions,
  locationOptions
}: AccidentEditViewProps) {
  const victimSplit = splitVictimName(accident.victim);
  const stoppageInit = normalizeAccidentStoppageFields(accident);
  const [formData, setFormData] = useState<Accident>({
    ...accident,
    victimFirstName: accident.victimFirstName ?? victimSplit.firstName,
    victimLastName: accident.victimLastName ?? victimSplit.lastName,
    accidentCategory: accident.accidentCategory ?? '',
    accidentEventType: accident.accidentEventType ?? '',
    circumstances: accident.circumstances ?? '',
    accidentCauses: accident.accidentCauses ?? '',
    causeAnalysis: accident.causeAnalysis ?? '',
    comments: accident.comments ?? '',
    duerpRiskId: accident.duerpRiskId ?? '',
    duerpRiskFreeText: accident.duerpRiskFreeText ?? '',
    ...stoppageInit,
    time: normalizeAccidentTime(accident.time, accident.createdAt),
    workStoppageStartDate:
      stoppageInit.workStoppageStartDate ??
      (stoppageInit.hasWorkStoppage ? accident.date : ''),
    workStoppageEndDate: stoppageInit.workStoppageEndDate ?? '',
    hasReturnToWorkMedicalConditions: stoppageInit.hasReturnToWorkMedicalConditions,
    returnToWorkMedicalConditions: stoppageInit.returnToWorkMedicalConditions ?? '',
    lesionSites: accident.lesionSites || [],
    lesionNatures: accident.lesionNatures || [],
    correctiveActions: accident.correctiveActions || [],
    service: accident.service && serviceOptions.includes(accident.service) ? accident.service : '',
    domain: accident.domain && domainOptions.includes(accident.domain) ? accident.domain : '',
    location: locationOptions.includes(accident.location) ? accident.location : ''
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coreError = validateAccidentCore(formData);
    if (coreError) {
      toast.error(coreError);
      return;
    }
    const sidebarState = {
      severity: formData.severity,
      hasWorkStoppage: Boolean(formData.hasWorkStoppage),
      workStoppageStartDate: formData.workStoppageStartDate ?? '',
      workStoppageEndDate: formData.workStoppageEndDate ?? '',
      hasReturnToWorkMedicalConditions: Boolean(formData.hasReturnToWorkMedicalConditions),
      returnToWorkMedicalConditions: formData.returnToWorkMedicalConditions ?? '',
    };
    const stoppageError = isAccidentStoppageFormValid(sidebarState);
    if (stoppageError) {
      toast.error(stoppageError);
      return;
    }
    onSave(
      enrichAccidentWithRegulatoryGravity(
        normalizeAccidentRecord(formData, risks),
      ) as Accident,
    );
  };

  const addWitness = () => {
    setFormData({
      ...formData,
      witnesses: [...(formData.witnesses || []), '']
    });
  };

  const updateWitness = (index: number, value: string) => {
    const newWitnesses = [...(formData.witnesses || [])];
    newWitnesses[index] = value;
    setFormData({ ...formData, witnesses: newWitnesses });
  };

  const removeWitness = (index: number) => {
    setFormData({
      ...formData,
      witnesses: formData.witnesses.filter((_, i) => i !== index)
    });
  };

  const addOption = (
    value: string,
    options: string[],
    setOptions: React.Dispatch<React.SetStateAction<string[]>>,
    reset: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
    }
    reset();
  };

  const getSeverityGradient = (severity: string) => {
    switch (severity) {
      case 'très_grave':
        return 'from-red-500 to-rose-600';
      case 'grave':
        return 'from-orange-500 to-red-500';
      case 'modéré':
        return 'from-yellow-400 to-orange-400';
      default:
        return 'from-green-400 to-emerald-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'travail':
        return Activity;
      case 'trajet':
        return MapPin;
      default:
        return AlertCircle;
    }
  };
  const getSeverityLabel = (severity: 'bénin' | 'modéré' | 'grave' | 'très_grave') => {
    switch (severity) {
      case 'bénin':
        return 'Bénin';
      case 'modéré':
        return 'Modéré';
      case 'grave':
        return 'Grave';
      default:
        return 'Très grave';
    }
  };

  const TypeIcon = getTypeIcon(formData.type);
  const severityGradient = getSeverityGradient(formData.severity);
  const severityTextClass = 'text-white';
  const filteredAgents = useMemo(
    () =>
      agents.filter(
        (agent) =>
          (!formData.service || agent.service === formData.service) &&
          (!formData.domain || agent.domain === formData.domain) &&
          (!formData.location || agent.location === formData.location)
      ),
    [agents, formData.service, formData.domain, formData.location]
  );
  const witnessSuggestions = useMemo(() => {
    const sourceAgents = filteredAgents.length > 0 ? filteredAgents : agents;
    return Array.from(
      new Set(sourceAgents.map((agent) => `${agent.firstName} ${agent.lastName}`))
    );
  }, [agents, filteredAgents]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900">Modifier l'accident</h2>
            <p className="text-gray-600 mt-1">Mettez à jour les informations de la déclaration.</p>
          </div>
          <div className="flex justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onCancel}
              className="w-full sm:w-auto font-semibold shadow-sm border-2 border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="w-full">
              <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${severityGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <TypeIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 w-full">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-600">Titre de l'accident</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xl font-bold mt-1"
                    required
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date, heure et type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                  Date de l'accident
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-purple-500" />
                  Heure de l'accident
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-500" />
                  Type d'accident
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travail">Travail</SelectItem>
                    <SelectItem value="trajet">Trajet</SelectItem>
                    <SelectItem value="maladie_pro">Maladie professionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <AccidentLesionsFields
              value={{
                lesionSites: formData.lesionSites || [],
                lesionNatures: formData.lesionNatures || [],
                correctiveActions: formData.correctiveActions || [],
              }}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            />

            <Separator />

            {/* Service, domaine et lieu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
                <Label className="text-sm font-bold text-purple-900 mb-2">Service</Label>
                <Select
                  value={formData.service || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, service: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger className="bg-white border-purple-200">
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non sélectionné</SelectItem>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                <Label className="text-sm font-bold text-blue-900 mb-2">Domaine</Label>
                <Select
                  value={formData.domain || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, domain: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger className="bg-white border-blue-200">
                    <SelectValue placeholder="Sélectionner un domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non sélectionné</SelectItem>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-sky-50 p-4 rounded-xl">
                <Label className="text-sm font-bold text-cyan-900 mb-2">Lieu</Label>
                <Select
                  value={formData.location || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, location: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger className="bg-white border-cyan-200">
                    <SelectValue placeholder="Sélectionner un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non sélectionné</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <AccidentExtendedFields
              value={{
                accidentCategory: formData.accidentCategory ?? '',
                accidentEventType: formData.accidentEventType ?? '',
                victimFirstName: formData.victimFirstName ?? '',
                victimLastName: formData.victimLastName ?? '',
                circumstances: formData.circumstances ?? '',
                accidentCauses: formData.accidentCauses ?? '',
                causeAnalysis: formData.causeAnalysis ?? '',
                comments: formData.comments ?? '',
                duerpRiskId: formData.duerpRiskId ?? '',
                duerpRiskFreeText: formData.duerpRiskFreeText ?? '',
              }}
              onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
              risks={risks}
              agents={agents}
              filteredAgents={filteredAgents}
              location={formData.location}
              accidentDate={formData.date}
              accidentTime={formData.time ?? ''}
            />

            <Separator />

            {/* Description */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-xl border-l-4 border-orange-500">
              <Label htmlFor="description" className="text-sm font-bold text-orange-900 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Description des faits
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-orange-200 min-h-[120px]"
                placeholder="Résumé factuel de l'accident (constat immédiat)…"
                required
              />
            </div>

            <Separator />

            {/* Témoins */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <Label className="text-sm font-bold text-amber-900 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Témoins présents
                </Label>
                <Button 
                  type="button"
                  size="sm"
                  onClick={addWitness}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.witnesses && formData.witnesses.length > 0 ? (
                  formData.witnesses.map((witness, idx) => (
                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        {idx + 1}
                      </Badge>
                      <Input
                        value={witness}
                        onChange={(e) => updateWitness(idx, e.target.value)}
                        placeholder="Nom du témoin..."
                        list="witness-agents-edit"
                        className="flex-1 bg-white border-amber-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeWitness(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-amber-700 italic text-sm">Aucun témoin. Cliquez sur "Ajouter" pour en créer un.</p>
                )}
              </div>
              <datalist id="witness-agents-edit">
                {witnessSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className="text-xs text-amber-800 mt-2">
                Suggestions d'agents disponibles, avec saisie manuelle possible.
              </p>
            </div>

            <Separator />

            {/* Mesures prises */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
              <Label htmlFor="measures" className="text-sm font-bold text-green-900 mb-3 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Mesures prises et suivi
              </Label>
              <Textarea
                id="measures"
                value={formData.measures}
                onChange={(e) => setFormData({ ...formData, measures: e.target.value })}
                className="bg-white border-green-200 min-h-[100px]"
                placeholder="Décrivez les mesures prises suite à l'accident..."
                required
              />
            </div>
          </CardContent>
        </Card>

        <AccidentFormSidebar
          isEdit
          formData={{
            severity: formData.severity,
            hasWorkStoppage: Boolean(formData.hasWorkStoppage),
            workStoppageStartDate: formData.workStoppageStartDate ?? '',
            workStoppageEndDate: formData.workStoppageEndDate ?? '',
            hasReturnToWorkMedicalConditions: Boolean(formData.hasReturnToWorkMedicalConditions),
            returnToWorkMedicalConditions: formData.returnToWorkMedicalConditions ?? '',
          }}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        />
      </div>
    </form>
  );
}
