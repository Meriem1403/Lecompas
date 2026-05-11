import React, { useEffect, useMemo, useState } from 'react';
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
  User,
  Users,
  Check,
  X,
  Save,
  PlusCircle,
  Trash2,
  ArrowLeft
} from 'lucide-react';

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

interface AccidentEditViewProps {
  accident: Accident;
  onSave: (accident: Accident) => void;
  onCancel: () => void;
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
  agents,
  serviceOptions,
  domainOptions,
  locationOptions
}: AccidentEditViewProps) {
  const DEFAULT_LESION_SITE_OPTIONS = ['Tête', 'Cou', 'Dos', 'Membre supérieur', 'Membre inférieur', 'Main', 'Pied', 'Yeux', 'Voies respiratoires'];
  const DEFAULT_LESION_NATURE_OPTIONS = ['Contusion', 'Coupure', 'Brûlure', 'Fracture', 'Entorse', 'Irritation', 'Lombalgie', 'Plaie', 'Traumatisme'];
  const DEFAULT_CORRECTIVE_ACTION_OPTIONS = ['Analyse des causes', 'Mise à jour consigne sécurité', 'Formation complémentaire', 'Ajout EPI', 'Balisage de zone', 'Maintenance corrective', 'Contrôle périodique renforcé'];

  const [formData, setFormData] = useState<Accident>({
    ...accident,
    lesionSites: accident.lesionSites || [],
    lesionNatures: accident.lesionNatures || [],
    correctiveActions: accident.correctiveActions || [],
    service: accident.service && serviceOptions.includes(accident.service) ? accident.service : '',
    domain: accident.domain && domainOptions.includes(accident.domain) ? accident.domain : '',
    location: locationOptions.includes(accident.location) ? accident.location : ''
  });
  const [lesionSiteOptions, setLesionSiteOptions] = useState(DEFAULT_LESION_SITE_OPTIONS);
  const [lesionNatureOptions, setLesionNatureOptions] = useState(DEFAULT_LESION_NATURE_OPTIONS);
  const [correctiveActionOptions, setCorrectiveActionOptions] = useState(DEFAULT_CORRECTIVE_ACTION_OPTIONS);
  const [newLesionSiteOption, setNewLesionSiteOption] = useState('');
  const [newLesionNatureOption, setNewLesionNatureOption] = useState('');
  const [newCorrectiveActionOption, setNewCorrectiveActionOption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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

  useEffect(() => {
    if (
      formData.victim &&
      !filteredAgents.some((agent) => `${agent.firstName} ${agent.lastName}` === formData.victim)
    ) {
      setFormData((prev) => ({ ...prev, victim: '' }));
    }
  }, [filteredAgents, formData.victim]);

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
            {/* Date et Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl space-y-4">
              <h3 className="font-bold text-lg text-red-700">🩺 Lésions et actions correctives</h3>
              <div className="space-y-3">
                <Label className="text-sm font-bold text-red-900">Siège(s) de lésion</Label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                  <Input value={newLesionSiteOption} onChange={(e) => setNewLesionSiteOption(e.target.value)} placeholder="Ajouter un siège de lésion" />
                  <Button type="button" variant="outline" onClick={() => addOption(newLesionSiteOption, lesionSiteOptions, setLesionSiteOptions, () => setNewLesionSiteOption(''))}>
                    Ajouter à la liste
                  </Button>
                </div>
                {(formData.lesionSites || []).map((value, idx) => (
                  <div key={`lesion-site-${idx}`} className="flex gap-2">
                    <Select
                      value={value}
                      onValueChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          lesionSites: (prev.lesionSites || []).map((item, i) => (i === idx ? selected : item)),
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner un siège de lésion" />
                      </SelectTrigger>
                      <SelectContent>
                        {lesionSiteOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" className="text-red-600" onClick={() => setFormData((prev) => ({ ...prev, lesionSites: (prev.lesionSites || []).filter((_, i) => i !== idx) }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" onClick={() => setFormData((prev) => ({ ...prev, lesionSites: [...(prev.lesionSites || []), lesionSiteOptions[0] || ''] }))}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter un siège
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-red-900">Nature(s) de lésion</Label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                  <Input value={newLesionNatureOption} onChange={(e) => setNewLesionNatureOption(e.target.value)} placeholder="Ajouter une nature de lésion" />
                  <Button type="button" variant="outline" onClick={() => addOption(newLesionNatureOption, lesionNatureOptions, setLesionNatureOptions, () => setNewLesionNatureOption(''))}>
                    Ajouter à la liste
                  </Button>
                </div>
                {(formData.lesionNatures || []).map((value, idx) => (
                  <div key={`lesion-nature-${idx}`} className="flex gap-2">
                    <Select
                      value={value}
                      onValueChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          lesionNatures: (prev.lesionNatures || []).map((item, i) => (i === idx ? selected : item)),
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner une nature de lésion" />
                      </SelectTrigger>
                      <SelectContent>
                        {lesionNatureOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" className="text-red-600" onClick={() => setFormData((prev) => ({ ...prev, lesionNatures: (prev.lesionNatures || []).filter((_, i) => i !== idx) }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" onClick={() => setFormData((prev) => ({ ...prev, lesionNatures: [...(prev.lesionNatures || []), lesionNatureOptions[0] || ''] }))}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter une nature
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-red-900">Action(s) corrective(s)</Label>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                  <Input value={newCorrectiveActionOption} onChange={(e) => setNewCorrectiveActionOption(e.target.value)} placeholder="Ajouter une action corrective" />
                  <Button type="button" variant="outline" onClick={() => addOption(newCorrectiveActionOption, correctiveActionOptions, setCorrectiveActionOptions, () => setNewCorrectiveActionOption(''))}>
                    Ajouter à la liste
                  </Button>
                </div>
                {(formData.correctiveActions || []).map((value, idx) => (
                  <div key={`corrective-action-${idx}`} className="flex gap-2">
                    <Select
                      value={value}
                      onValueChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          correctiveActions: (prev.correctiveActions || []).map((item, i) => (i === idx ? selected : item)),
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sélectionner une action corrective" />
                      </SelectTrigger>
                      <SelectContent>
                        {correctiveActionOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" className="text-red-600" onClick={() => setFormData((prev) => ({ ...prev, correctiveActions: (prev.correctiveActions || []).filter((_, i) => i !== idx) }))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" onClick={() => setFormData((prev) => ({ ...prev, correctiveActions: [...(prev.correctiveActions || []), correctiveActionOptions[0] || ''] }))}>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter une action corrective
                </Button>
              </div>
            </div>

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

            {/* Victime */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
                <Label htmlFor="victim" className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Victime (agents filtrés)
                </Label>
                <Select
                  value={formData.victim}
                  onValueChange={(value) => setFormData({ ...formData, victim: value })}
                  disabled={filteredAgents.length === 0}
                >
                  <SelectTrigger id="victim" className="bg-white border-purple-200">
                    <SelectValue placeholder={filteredAgents.length === 0 ? "Aucun agent pour ce filtre" : "Sélectionner un agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAgents.map((agent) => {
                      const fullName = `${agent.firstName} ${agent.lastName}`;
                      return (
                        <SelectItem key={agent.id} value={fullName}>
                          {fullName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-purple-700 mt-2">
                  Service : {formData.service || "Non défini"} · Domaine : {formData.domain || "Non défini"} · Lieu : {formData.location || "Non défini"}
                </p>
              </div>
            </div>

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
                placeholder="Décrivez les circonstances de l'accident..."
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

        {/* Sidebar - Severity */}
        <div className="space-y-6">
          {/* Severity Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Gravité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bénin">Bénin</SelectItem>
                  <SelectItem value="modéré">Modéré</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="très_grave">Très grave</SelectItem>
                </SelectContent>
              </Select>
              
              <div className={`text-center p-4 rounded-xl bg-gradient-to-br ${severityGradient} bg-opacity-10 border-2`}>
                <p className={`${severityTextClass} text-xs font-semibold mb-1`}>Niveau de gravité sélectionné</p>
                <p className={`${severityTextClass} font-bold text-2xl`}>
                  {getSeverityLabel(formData.severity)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-bold mb-2">Informations importantes</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Vérifiez tous les champs</li>
                    <li>• Ajoutez les témoins si présents</li>
                    <li>• Décrivez les mesures prises</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
