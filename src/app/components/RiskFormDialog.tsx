import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { PlusCircle, X, Save, Edit, FileText, BarChart3, Calendar, Droplet, Zap, Bug, Brain, Armchair, Cog, Search, Clock, CheckCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

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

interface RiskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: Risk | null;
  onSave: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
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

export function RiskFormDialog({
  open,
  onOpenChange,
  risk,
  onSave,
  serviceOptions = [],
  domainOptions = [],
  locationOptions = [],
  serviceCatalog = [],
  riskReferences = [],
  concernedPersons = [],
}: RiskFormDialogProps) {
  const [formData, setFormData] = useState({
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
    moyenMaitrise: '',
    prioriteFinale: 1,
    status: 'identifié' as 'identifié' | 'en_cours' | 'traité',
    echeance: '',
    retourAction: '',
    observation: '',
    existingMeasures: [''],
    plannedMeasures: [{
      description: '',
      responsible: '',
      deadline: '',
      status: 'pending' as 'pending' | 'in_progress' | 'completed'
    }]
  });

  useEffect(() => {
    if (risk) {
      setFormData({
        numeroRisque: risk.numeroRisque,
        title: risk.title,
        unite: risk.unite,
        domain: risk.domain || risk.unite || '',
        service: risk.service,
        site: risk.site,
        situation: risk.situation,
        associatedRisk: risk.associatedRisk,
        category: risk.category,
        responsable: risk.responsable,
        severity: risk.severity,
        probability: risk.probability,
        moyenMaitrise: risk.moyenMaitrise,
        prioriteFinale: risk.prioriteFinale,
        status: risk.status,
        echeance: risk.echeance,
        retourAction: risk.retourAction,
        observation: risk.observation,
        existingMeasures: risk.existingMeasures.length > 0 ? risk.existingMeasures : [''],
        plannedMeasures: risk.plannedMeasures.length > 0 ? risk.plannedMeasures : [{
          description: '',
          responsible: '',
          deadline: '',
          status: 'pending'
        }]
      });
    } else {
      setFormData({
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
        moyenMaitrise: '',
        prioriteFinale: 1,
        status: 'identifié',
        echeance: '',
        retourAction: '',
        observation: '',
        existingMeasures: [''],
        plannedMeasures: [{
          description: '',
          responsible: '',
          deadline: '',
          status: 'pending'
        }]
      });
    }
  }, [risk, open]);

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

    setFormData((prev) => ({
      ...prev,
      service: nextServices.join(', '),
      domain: selectedDomains.filter((domain) => scopedDomains.includes(domain)).join(', '),
      unite: selectedDomains.filter((domain) => scopedDomains.includes(domain)).join(', '),
      site: selectedLocations.filter((location) => scopedLocations.includes(location)).join(', '),
    }));
  };

  const handleDomainsChange = (domainName: string, checked: boolean) => {
    const values = checked
      ? [...selectedDomains, domainName]
      : selectedDomains.filter((domain) => domain !== domainName);
    setFormData((prev) => ({
      ...prev,
      domain: values.join(', '),
      unite: values.join(', '),
    }));
  };

  const handleLocationsChange = (locationName: string, checked: boolean) => {
    const values = checked
      ? [...selectedLocations, locationName]
      : selectedLocations.filter((location) => location !== locationName);
    setFormData((prev) => ({
      ...prev,
      site: values.join(', '),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.situation || !formData.associatedRisk) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const riskLevel = formData.severity * formData.probability;
    const calculPriorite = formData.severity * formData.probability;
    
    const riskData = {
      ...(risk && { id: risk.id }),
      numeroRisque: formData.numeroRisque || `RISK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      title: formData.title,
      unite: formData.domain || formData.unite,
      domain: formData.domain || formData.unite,
      service: formData.service,
      site: formData.site,
      situation: formData.situation,
      associatedRisk: formData.associatedRisk,
      category: formData.category,
      responsable: formData.responsable,
      severity: formData.severity,
      probability: formData.probability,
      riskLevel,
      moyenMaitrise: formData.moyenMaitrise,
      calculPriorite,
      prioriteFinale: formData.prioriteFinale,
      status: formData.status,
      echeance: formData.echeance,
      retourAction: formData.retourAction,
      observation: formData.observation,
      existingMeasures: formData.existingMeasures.filter(m => m.trim() !== ''),
      plannedMeasures: formData.plannedMeasures.filter(m => m.description.trim() !== '')
    };

    onSave(riskData);
    onOpenChange(false);
    toast.success(risk ? 'Risque modifié avec succès' : 'Risque créé avec succès');
  };

  const addExistingMeasure = () => {
    setFormData(prev => ({
      ...prev,
      existingMeasures: [...prev.existingMeasures, '']
    }));
  };

  const removeExistingMeasure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existingMeasures: prev.existingMeasures.filter((_, i) => i !== index)
    }));
  };

  const updateExistingMeasure = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      existingMeasures: prev.existingMeasures.map((m, i) => i === index ? value : m)
    }));
  };

  const addPlannedMeasure = () => {
    setFormData(prev => ({
      ...prev,
      plannedMeasures: [...prev.plannedMeasures, {
        description: '',
        responsible: '',
        deadline: '',
        status: 'pending'
      }]
    }));
  };

  const removePlannedMeasure = (index: number) => {
    setFormData(prev => ({
      ...prev,
      plannedMeasures: prev.plannedMeasures.filter((_, i) => i !== index)
    }));
  };

  const updatePlannedMeasure = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      plannedMeasures: prev.plannedMeasures.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            {risk ? <><Edit className="h-6 w-6 text-purple-600" /> Modifier le risque</> : <><PlusCircle className="h-6 w-6 text-purple-600" /> Nouveau risque</>}
          </DialogTitle>
          <DialogDescription>
            Remplissez tous les champs pour {risk ? 'modifier' : 'créer'} une fiche de risque professionnelle
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Identification */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-purple-700 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Identification du Risque
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroRisque">Numéro de risque</Label>
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
                        setFormData((prev) => ({
                          ...prev,
                          numeroRisque:
                            selectedReference.numeroRisque,
                          title: selectedReference.title,
                        }));
                      }}
                    >
                      <SelectTrigger>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroRisque: e.target.value }))}
                    placeholder="Ex: RISK-2026-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unite">Domaine *</Label>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="site">Lieux *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="responsable">Responsable *</Label>
                  <Select
                    value={formData.responsable || "__empty__"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        responsable:
                          value === "__empty__" ? "" : value,
                      }))
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

              <div className="space-y-2">
                <Label htmlFor="title">Titre du risque *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Risque de chute sur sol glissant"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="situation">Situation dangereuse *</Label>
                <Textarea
                  id="situation"
                  value={formData.situation}
                  onChange={(e) => setFormData(prev => ({ ...prev, situation: e.target.value }))}
                  placeholder="Décrivez la situation dangereuse observée..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="associatedRisk">Risque associé *</Label>
                <Textarea
                  id="associatedRisk"
                  value={formData.associatedRisk}
                  onChange={(e) => setFormData(prev => ({ ...prev, associatedRisk: e.target.value }))}
                  placeholder="Décrivez les conséquences potentielles..."
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mécanique" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Cog className="h-4 w-4 inline" /> Mécanique</span>
                      </SelectItem>
                      <SelectItem value="chimique" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Droplet className="h-4 w-4 inline" /> Chimique</span>
                      </SelectItem>
                      <SelectItem value="électrique" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Zap className="h-4 w-4 inline" /> Électrique</span>
                      </SelectItem>
                      <SelectItem value="biologique" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Bug className="h-4 w-4 inline" /> Biologique</span>
                      </SelectItem>
                      <SelectItem value="psychosocial" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Brain className="h-4 w-4 inline" /> Psychosocial</span>
                      </SelectItem>
                      <SelectItem value="ergonomique" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Armchair className="h-4 w-4 inline" /> Ergonomique</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identifié" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Search className="h-4 w-4 inline" /> Identifié</span>
                      </SelectItem>
                      <SelectItem value="en_cours" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><Clock className="h-4 w-4 inline" /> En cours</span>
                      </SelectItem>
                      <SelectItem value="traité" className="flex items-center gap-2">
                        <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 inline" /> Traité</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section Évaluation */}
            <div className="space-y-4 bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl">
              <h3 className="font-bold text-lg text-orange-700 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Évaluation du Risque
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Gravité (1-4) *</Label>
                  <Select value={formData.severity.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: parseInt(value) }))}>
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

                <div className="space-y-2">
                  <Label htmlFor="probability">Probabilité (1-4) *</Label>
                  <Select value={formData.probability.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, probability: parseInt(value) }))}>
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

              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Criticité calculée :</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {formData.severity * formData.probability} / 16
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="moyenMaitrise">Moyen de maîtrise *</Label>
                  <Input
                    id="moyenMaitrise"
                    value={formData.moyenMaitrise}
                    onChange={(e) => setFormData(prev => ({ ...prev, moyenMaitrise: e.target.value }))}
                    placeholder="Ex: EPI, ventilation, formation"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioriteFinale">Priorité finale (1 à 16) *</Label>
                  <Input
                    id="prioriteFinale"
                    type="number"
                    min="1"
                    max="16"
                    value={formData.prioriteFinale}
                    onChange={(e) => setFormData(prev => ({ ...prev, prioriteFinale: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Suivi */}
            <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
              <h3 className="font-bold text-lg text-blue-700 flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Suivi et Échéances
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="echeance">Échéance globale *</Label>
                <Input
                  id="echeance"
                  type="date"
                  value={formData.echeance}
                  onChange={(e) => setFormData(prev => ({ ...prev, echeance: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retourAction">Retour d'Action</Label>
                <Textarea
                  id="retourAction"
                  value={formData.retourAction}
                  onChange={(e) => setFormData(prev => ({ ...prev, retourAction: e.target.value }))}
                  placeholder="Décrivez l'avancement des actions..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observation">Observation</Label>
                <Textarea
                  id="observation"
                  value={formData.observation}
                  onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
                  placeholder="Ajoutez des observations complémentaires..."
                  rows={2}
                />
              </div>
            </div>

            {/* Section Mesures Existantes */}
            <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Mesures de Prévention Existantes
                </h3>
                <Button type="button" size="sm" onClick={addExistingMeasure} className="bg-gradient-to-r from-green-500 to-emerald-500">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {formData.existingMeasures.map((measure, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={measure}
                    onChange={(e) => updateExistingMeasure(index, e.target.value)}
                    placeholder="Décrivez une mesure existante..."
                  />
                  {formData.existingMeasures.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeExistingMeasure(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Section Mesures Planifiées */}
            <div className="space-y-4 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-blue-700 flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Mesures Planifiées
                </h3>
                <Button type="button" size="sm" onClick={addPlannedMeasure} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {formData.plannedMeasures.map((measure, index) => (
                <div key={index} className="space-y-3 bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Action #{index + 1}</Label>
                    {formData.plannedMeasures.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removePlannedMeasure(index)}>
                        <X className="h-4 w-4 mr-1" />
                        Retirer
                      </Button>
                    )}
                  </div>

                  <Textarea
                    value={measure.description}
                    onChange={(e) => updatePlannedMeasure(index, 'description', e.target.value)}
                    placeholder="Description de l'action..."
                    rows={2}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={measure.responsible || "__empty__"}
                      onValueChange={(value) =>
                        updatePlannedMeasure(
                          index,
                          "responsible",
                          value === "__empty__" ? "" : value,
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
                    <Input
                      type="date"
                      value={measure.deadline}
                      onChange={(e) => updatePlannedMeasure(index, 'deadline', e.target.value)}
                    />
                  </div>

                  <Select value={measure.status} onValueChange={(value) => updatePlannedMeasure(index, 'status', value)}>
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
              ))}
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-indigo-600">
            <Save className="h-4 w-4 mr-2" />
            {risk ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}