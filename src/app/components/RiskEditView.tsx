import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  AlertCircle,
  Shield,
  CheckCircle,
  Calendar,
  Target,
  Tag,
  TrendingUp,
  PlusCircle,
  Trash2,
  X,
  Save,
  Building2,
  Calculator
} from 'lucide-react';

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
  status: 'identifié' | 'en_cours' | 'traité';
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
  risk: Risk;
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
  const [formData, setFormData] = useState<Risk>(risk || {
    id: '',
    numeroRisque: '',
    title: '',
    unite: '',
    domain: '',
    service: '',
    site: '',
    situation: '',
    associatedRisk: '',
    category: 'mécanique',
    responsable: '',
    severity: 1,
    probability: 1,
    riskLevel: 1,
    existingMeasures: [],
    moyenMaitrise: '',
    calculPriorite: 0,
    prioriteFinale: 1,
    plannedMeasures: [],
    status: 'identifié',
    echeance: new Date().toISOString().split('T')[0],
    retourAction: '',
    observation: '',
    createdAt: '',
    updatedAt: ''
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const predefinedCategories = ['mécanique', 'chimique', 'électrique', 'psychosocial', 'ergonomique'];

  // Obtenir la liste des titres uniques des risques existants
  const existingTitles = Array.from(new Set(existingRisks.map(r => r.title).filter(t => t && t.trim())));

  // Initialiser isCustomCategory si la catégorie n'est pas prédéfinie
  React.useEffect(() => {
    if (risk && risk.category && !predefinedCategories.includes(risk.category)) {
      setIsCustomCategory(true);
    }
  }, [risk]);

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
      unite: nextDomains.join(', '),
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

  // Initialiser isCustomTitle si le titre n'existe pas dans la liste
  React.useEffect(() => {
    if (risk && risk.title && !existingTitles.includes(risk.title)) {
      setIsCustomTitle(true);
    }
  }, [risk]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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

  // Calculer le niveau de risque
  React.useEffect(() => {
    const calculatedLevel = formData.severity * formData.probability;
    setFormData(prev => ({ ...prev, riskLevel: calculatedLevel }));
  }, [formData.severity, formData.probability]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button 
          type="button"
          variant="ghost" 
          onClick={onCancel}
          className="hover:bg-purple-50"
        >
          ← Annuler et retour
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
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
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(formData.category)} flex items-center justify-center shadow-lg`}>
                  {React.createElement(getCategoryIcon(formData.category), { className: 'h-8 w-8 text-white' })}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-600">Titre du risque</Label>
                    {existingTitles.length > 0 && !isCustomTitle && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsCustomTitle(true);
                          setFormData({ ...formData, title: '' });
                        }}
                        className="text-xs"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Nouveau
                      </Button>
                    )}
                    {isCustomTitle && existingTitles.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsCustomTitle(false)}
                        className="text-xs"
                      >
                        Sélectionner existant
                      </Button>
                    )}
                  </div>
                  {existingTitles.length > 0 && !isCustomTitle ? (
                    <Select
                      value={formData.title}
                      onValueChange={(value) => {
                        setFormData({ ...formData, title: value });
                      }}
                    >
                      <SelectTrigger className="text-base font-bold">
                        <SelectValue placeholder="Sélectionner un risque existant" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingTitles.map((title, idx) => (
                          <SelectItem key={idx} value={title}>{title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="text-xl font-bold"
                      placeholder="Ex: Risque de chute, Exposition chimique..."
                      required
                    />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Section Identification */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl space-y-4 border border-gray-200">
              <h4 className="font-bold text-lg text-gray-700 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Identification du risque
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroRisque" className="text-sm font-semibold">Numéro Risque</Label>
                  {riskReferences.length > 0 && (
                    <Select
                      value={
                        riskReferences.some(
                          (ref) =>
                            ref.numeroRisque ===
                              formData.numeroRisque &&
                            ref.title === formData.title,
                        )
                          ? formData.numeroRisque
                          : "__custom__"
                      }
                      onValueChange={(value) => {
                        if (value === "__custom__") return;
                        const selectedReference =
                          riskReferences.find(
                            (ref) => ref.numeroRisque === value,
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
                            value={reference.numeroRisque}
                          >
                            {reference.numeroRisque} -{" "}
                            {reference.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    id="numeroRisque"
                    value={formData.numeroRisque}
                    onChange={(e) => setFormData({ ...formData, numeroRisque: e.target.value })}
                    placeholder="Ex: RISK-2026-001"
                  />
                </div>
                <div>
                  <Label htmlFor="domain" className="text-sm font-semibold">Domaine *</Label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="service" className="text-sm font-semibold">Service *</Label>
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
                  <Label htmlFor="site" className="text-sm font-semibold">Lieux *</Label>
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
                  <Label htmlFor="responsable" className="text-sm font-semibold">Responsable *</Label>
                  <Select
                    value={formData.responsable || "__empty__"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        responsable:
                          value === "__empty__" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger id="responsable">
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
            </div>

            <Separator />

            {/* Situation dangereuse */}
            <div>
              <Label htmlFor="situation" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                Situation Dangereuse
              </Label>
              <Textarea
                id="situation"
                value={formData.situation}
                onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
                className="bg-orange-50 border-l-4 border-orange-500 min-h-[100px]"
                placeholder="Décrivez la situation dangereuse..."
                required
              />
            </div>

            <Separator />

            {/* Risques associés */}
            <div>
              <Label htmlFor="associatedRisk" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-red-500" />
                Risques Associés
              </Label>
              <Textarea
                id="associatedRisk"
                value={formData.associatedRisk}
                onChange={(e) => setFormData({ ...formData, associatedRisk: e.target.value })}
                className="bg-red-50 border-l-4 border-red-500 min-h-[80px]"
                placeholder="Décrivez les risques associés..."
                required
              />
            </div>

            <Separator />

            {/* Mesures existantes */}
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                <Label className="text-sm font-bold text-gray-700 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Mesures de Prévention Existantes
                </Label>
                <Button 
                  type="button"
                  size="sm"
                  onClick={addExistingMeasure}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.existingMeasures && formData.existingMeasures.length > 0 ? (
                  formData.existingMeasures.map((measure, idx) => (
                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {idx + 1}
                      </Badge>
                      <Input
                        value={measure}
                        onChange={(e) => updateExistingMeasure(idx, e.target.value)}
                        placeholder="Mesure de prévention..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeExistingMeasure(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-sm">Aucune mesure existante. Cliquez sur "Ajouter" pour en créer une.</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Mesures planifiées */}
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <Label className="text-sm font-bold text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  Actions Planifiées
                </Label>
                <Button 
                  type="button"
                  size="sm"
                  onClick={addPlannedMeasure}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-4">
                {formData.plannedMeasures && formData.plannedMeasures.length > 0 ? (
                  formData.plannedMeasures.map((measure, idx) => (
                    <Card key={idx} className="border-2 border-gray-300 bg-gray-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <Badge className="bg-blue-500 text-white">Action {idx + 1}</Badge>
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
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={measure.description}
                            onChange={(e) => updatePlannedMeasure(idx, 'description', e.target.value)}
                            placeholder="Description de l'action..."
                            className="min-h-[60px]"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Responsable</Label>
                            <Select
                              value={measure.responsible || "__empty__"}
                              onValueChange={(value) =>
                                updatePlannedMeasure(
                                  idx,
                                  "responsible",
                                  value === "__empty__"
                                    ? ""
                                    : value,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Responsable de l'action" />
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
                          <div>
                            <Label className="text-xs">Échéance</Label>
                            <Input
                              type="date"
                              value={measure.deadline}
                              onChange={(e) => updatePlannedMeasure(idx, 'deadline', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Statut</Label>
                          <Select
                            value={measure.status}
                            onValueChange={(value) => updatePlannedMeasure(idx, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="in_progress">En cours</SelectItem>
                              <SelectItem value="completed">Terminée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-sm">Aucune action planifiée. Cliquez sur "Ajouter" pour en créer une.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Evaluation & Metadata */}
        <div className="space-y-6">
          {/* Evaluation Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-500" />
                Évaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="severity" className="text-sm">Gravité</Label>
                <Select
                  value={formData.severity.toString()}
                  onValueChange={(value) => setFormData({ ...formData, severity: parseInt(value) })}
                >
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Faible</SelectItem>
                    <SelectItem value="2">2 - Moyen</SelectItem>
                    <SelectItem value="3">3 - Élevé</SelectItem>
                    <SelectItem value="4">4 - Très élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="probability" className="text-sm">Probabilité</Label>
                <Select
                  value={formData.probability.toString()}
                  onValueChange={(value) => setFormData({ ...formData, probability: parseInt(value) })}
                >
                  <SelectTrigger id="probability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Rare</SelectItem>
                    <SelectItem value="2">2 - Peu probable</SelectItem>
                    <SelectItem value="3">3 - Probable</SelectItem>
                    <SelectItem value="4">4 - Très probable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300">
                <p className="text-gray-600 text-xs font-semibold mb-1">Niveau de Risque (Calculé)</p>
                <p className="font-bold text-4xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {formData.riskLevel}
                </p>
                <p className="text-sm font-semibold text-gray-600 mt-1">
                  {getRiskLevelLabel(formData.riskLevel)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Tag className="h-5 w-5 mr-2 text-purple-500" />
                Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1">Sélectionner</Label>
                <Select
                  value={isCustomCategory ? 'custom' : formData.category}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setIsCustomCategory(true);
                      setFormData({ ...formData, category: '' });
                    } else {
                      setIsCustomCategory(false);
                      setFormData({ ...formData, category: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mécanique">Mécanique</SelectItem>
                    <SelectItem value="chimique">Chimique</SelectItem>
                    <SelectItem value="électrique">Électrique</SelectItem>
                    <SelectItem value="psychosocial">Psychosocial</SelectItem>
                    <SelectItem value="ergonomique">Ergonomique</SelectItem>
                    <SelectItem value="custom">Autre...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCustomCategory && (
                <div>
                  <Label className="text-xs text-gray-600 mb-1">Nouvelle catégorie</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                    }}
                    placeholder="Ex: Biologique, Radiologique..."
                    className="border-purple-300 focus:border-purple-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Statut du Risque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identifié">Identifié</SelectItem>
                  <SelectItem value="en_cours">En cours de traitement</SelectItem>
                  <SelectItem value="traité">Traité</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Évaluation Avancée Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-cyan-500" />
                Évaluation Avancée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="moyenMaitrise" className="text-sm font-semibold">Moyen de Maîtrise *</Label>
                <Input
                  id="moyenMaitrise"
                  value={formData.moyenMaitrise}
                  onChange={(e) => setFormData({ ...formData, moyenMaitrise: e.target.value })}
                  placeholder="Ex: EPI, ventilation, formation"
                  required
                />
              </div>
              <div>
                <Label htmlFor="prioriteFinale" className="text-sm font-semibold">Priorité Finale (1-16) *</Label>
                <Input
                  id="prioriteFinale"
                  type="number"
                  min="1"
                  max="16"
                  value={formData.prioriteFinale}
                  onChange={(e) => setFormData({ ...formData, prioriteFinale: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                <p className="text-xs text-gray-600 font-semibold mb-1">Calcul Priorité</p>
                <p className="font-bold text-2xl text-yellow-800">{formData.calculPriorite}</p>
              </div>
            </CardContent>
          </Card>

          {/* Suivi et Échéances Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-pink-500" />
                Suivi et Échéances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="echeance" className="text-sm font-semibold">Échéance Globale *</Label>
                <Input
                  id="echeance"
                  type="date"
                  value={formData.echeance}
                  onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="retourAction" className="text-sm font-semibold">Retour d'Action</Label>
                <Textarea
                  id="retourAction"
                  value={formData.retourAction}
                  onChange={(e) => setFormData({ ...formData, retourAction: e.target.value })}
                  placeholder="Décrivez l'avancement des actions..."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="observation" className="text-sm font-semibold">Observation</Label>
                <Textarea
                  id="observation"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Ajoutez des observations complémentaires..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
