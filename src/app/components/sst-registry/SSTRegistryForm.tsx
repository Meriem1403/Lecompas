import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ArrowLeft, Save, HelpCircle, AlertCircle, Building2, MapPin, User, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { SSTRemark, GeographicSite, Domain } from '../SSTRegistryView';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { Badge } from '../ui/badge';

interface SSTRegistryFormProps {
  remark?: SSTRemark;
  currentUserName: string;
  onSave: (remark: SSTRemark) => void;
  onCancel: () => void;
}

export function SSTRegistryForm({
  remark,
  currentUserName,
  onSave,
  onCancel,
}: SSTRegistryFormProps) {
  const [service, setService] = useState(remark?.service || '');
  const [otherService, setOtherService] = useState('');
  const [geographicSites, setGeographicSites] = useState<GeographicSite[]>(remark?.geographicSites || []);
  const [siteComments, setSiteComments] = useState(remark?.siteComments || '');
  const [isAnonymous, setIsAnonymous] = useState(remark?.isAnonymous ?? false);
  const [agentName, setAgentName] = useState(remark?.agentName || currentUserName);
  const [domains, setDomains] = useState<Domain[]>(remark?.domains || []);
  const [otherDomain, setOtherDomain] = useState(remark?.otherDomain || '');
  const [observation, setObservation] = useState(remark?.observation || '');
  const [sitePrecisions, setSitePrecisions] = useState(remark?.sitePrecisions || '');
  const [helpOpen, setHelpOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const services = [
    'DIRM Méditerranée - Direction',
    'DIRM Méditerranée - Service Technique',
    'DIRM Méditerranée - Service Infrastructure',
    'DIRM Méditerranée - Service Logistique',
    'DIRM MED / CSN PACA CORSE',
    'SSGM',
    'Autre',
  ];

  const domainOptions: { value: Domain; label: string; description: string; icon: string }[] = [
    {
      value: 'locaux_travail',
      label: 'Locaux de travail',
      description: 'Aménagement, stockages, propreté…',
      icon: '🏢',
    },
    {
      value: 'machines_outils',
      label: 'Machines ou outils',
      description: 'Pas ou plus adaptés, sécurité shuntée, dysfonctionnements, difficultés d\'usage...',
      icon: '🔧',
    },
    {
      value: 'epc',
      label: 'Équipements de protection collective',
      description: 'Garde corps usagé, armoire électrique ouverte...',
      icon: '🛡️',
    },
    {
      value: 'epi',
      label: 'Équipements de protection individuelle',
      description: 'Non adapté, modèle présentant un défaut...',
      icon: '🦺',
    },
    {
      value: 'situations_risques',
      label: 'Situations à risques',
      description: 'Risques liés aux installations électriques, produits dangereux (CMR, ACD), conduite des engins, conditions de circulation, travaux en cours…',
      icon: '⚠️',
    },
    {
      value: 'conditions_travail',
      label: 'Conditions de travail',
      description: 'Bruit, éclairage, ventilation des locaux, espaces de travail, manutentions manuelles, travail sur écran…',
      icon: '💡',
    },
    {
      value: 'formation',
      label: 'Formation dans le domaine de la prévention des risques professionnels',
      description: '',
      icon: '📚',
    },
    {
      value: 'evenements_dangereux',
      label: 'Événements dangereux',
      description: 'Accidents matériel, bénins, corporel, presqu\'accident',
      icon: '🚨',
    },
    {
      value: 'autre',
      label: 'Autre',
      description: '',
      icon: '➕',
    },
  ];

  const handleGeographicSiteToggle = (site: GeographicSite) => {
    if (geographicSites.includes(site)) {
      setGeographicSites(geographicSites.filter(s => s !== site));
    } else {
      setGeographicSites([...geographicSites, site]);
    }
  };

  const handleDomainToggle = (domain: Domain) => {
    if (domains.includes(domain)) {
      setDomains(domains.filter(d => d !== domain));
    } else {
      setDomains([...domains, domain]);
    }
  };

  const handleSubmit = () => {
    // Validation
    const finalService = service === 'Autre' ? otherService : service;
    
    if (!finalService.trim()) {
      toast.error('Le service est obligatoire');
      setCurrentStep(1);
      return;
    }

    if (domains.length === 0) {
      toast.error('Veuillez sélectionner au moins un domaine');
      setCurrentStep(2);
      return;
    }

    if (domains.includes('autre') && !otherDomain.trim()) {
      toast.error('Veuillez préciser le domaine "Autre"');
      setCurrentStep(2);
      return;
    }

    if (!observation.trim()) {
      toast.error('L\'observation est obligatoire');
      setCurrentStep(3);
      return;
    }

    if (observation.length > 800) {
      toast.error('L\'observation ne peut pas dépasser 800 caractères');
      setCurrentStep(3);
      return;
    }

    if (!sitePrecisions.trim()) {
      toast.error('Les précisions sur le site sont obligatoires');
      setCurrentStep(3);
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const newRemark: SSTRemark = {
      id: remark?.id || `rsst-${Date.now()}`,
      ficheNumber: remark?.ficheNumber || String(Math.floor(Math.random() * 900) + 100),
      service: finalService,
      geographicSites,
      siteComments: siteComments.trim() || undefined,
      isAnonymous,
      agentName: isAnonymous ? undefined : agentName,
      domains,
      otherDomain: domains.includes('autre') ? otherDomain : undefined,
      observation,
      sitePrecisions,
      submissionDate: remark?.submissionDate || dateStr,
      submissionTime: remark?.submissionTime || timeStr,
      submittedBy: remark?.submittedBy || (isAnonymous ? 'Anonyme' : currentUserName),
      status: remark?.status || 'nouvelle',
      registryKeeperName: remark?.registryKeeperName || 'LAPAZ',
      transmittedTo: remark?.transmittedTo,
      managerObservations: remark?.managerObservations,
      followUpActions: remark?.followUpActions || [],
      chsctExam: remark?.chsctExam,
      createdAt: remark?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onSave(newRemark);
    toast.success(remark ? 'Remarque mise à jour' : 'Remarque créée');
  };

  const steps = [
    { number: 1, title: 'Service et localisation', icon: Building2 },
    { number: 2, title: 'Domaines concernés', icon: FileText },
    { number: 3, title: 'Description détaillée', icon: MessageSquare },
    { number: 4, title: 'Vérification', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            {remark ? 'Modifier une remarque' : 'Nouvelle remarque RSST'}
          </h1>
          <p className="text-gray-600 mt-1">
            Registre de santé et de sécurité au travail - DIRM Méditerranée
          </p>
        </div>
      </div>

      {/* Information Card */}
      <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 shadow-xl">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg mb-2">💡 À quoi sert ce registre ?</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Ce registre vous permet de consigner vos observations et suggestions relatives à la <strong>prévention des risques professionnels</strong> et à l'<strong>amélioration des conditions de travail</strong>.
              </p>
              <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="text-blue-700 p-0 h-auto font-semibold text-base">
                    <HelpCircle className="h-5 w-5 mr-2" />
                    {helpOpen ? 'Masquer les exemples' : 'Voir des exemples de remarques'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-2 bg-white/60 p-4 rounded-lg border-2 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex gap-2">
                      <span className="text-lg">⚠️</span>
                      <p className="text-sm"><strong>Un risque</strong> observé ou encouru</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-lg">🚑</span>
                      <p className="text-sm"><strong>Un accident ou incident</strong> vu ou vécu</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-lg">🔧</span>
                      <p className="text-sm"><strong>Un dysfonctionnement</strong> d'installation ou de dispositif de sécurité</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-lg">💡</span>
                      <p className="text-sm"><strong>Des suggestions</strong> d'amélioration (éclairage, bruit, environnement...)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 italic border-t pt-3 border-blue-200">
                    📝 Pour tout fait, incident ou accident : détaillez les circonstances et les facteurs ayant concouru à leur réalisation.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex justify-between items-center px-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <button
                  onClick={() => setCurrentStep(step.number)}
                  className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white scale-110 ring-4 ring-pink-200'
                      : isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-7 w-7" /> : <StepIcon className="h-7 w-7" />}
                </button>
                <p className={`text-xs font-semibold text-center max-w-[100px] ${
                  isActive ? 'text-rose-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                  isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Service et localisation */}
      {currentStep === 1 && (
        <Card className="shadow-xl border-2 border-rose-200 bg-gradient-to-br from-white to-rose-50">
          <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 border-b-2 border-rose-200">
            <CardTitle className="flex items-center gap-3 text-rose-900">
              <Building2 className="h-7 w-7" />
              Étape 1 : Service et localisation
            </CardTitle>
            <CardDescription className="text-rose-700">
              Identifiez votre service et le site géographique concerné
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Service */}
            <div className="bg-white p-5 rounded-xl border-2 border-rose-100 shadow-sm">
              <Label htmlFor="service" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-600" />
                Votre service <Badge className="bg-red-500 ml-2">Obligatoire</Badge>
              </Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="mt-2 border-2 hover:border-rose-300 transition-colors">
                  <SelectValue placeholder="Veuillez choisir votre service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {service === 'Autre' && (
                <Input
                  value={otherService}
                  onChange={(e) => setOtherService(e.target.value)}
                  placeholder="Précisez votre service..."
                  className="mt-3 border-2 hover:border-rose-300 transition-colors"
                />
              )}
            </div>

            {/* Sites géographiques */}
            <div className="bg-white p-5 rounded-xl border-2 border-rose-100 shadow-sm">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-rose-600" />
                Site(s) géographique(s) concerné(s)
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {(['PACA', 'Occitanie', 'Corse'] as GeographicSite[]).map((site) => (
                  <label
                    key={site}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      geographicSites.includes(site)
                        ? 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-600 text-white shadow-lg scale-105'
                        : 'bg-white border-gray-300 hover:border-rose-300 hover:shadow-md'
                    }`}
                  >
                    <Checkbox
                      id={`site-${site}`}
                      checked={geographicSites.includes(site)}
                      onCheckedChange={() => handleGeographicSiteToggle(site)}
                      className="sr-only"
                    />
                    <MapPin className="h-5 w-5" />
                    <span className="font-semibold">{site}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="siteComments" className="text-sm text-gray-700">
                  Commentaires sur le site géographique (optionnel)
                </Label>
                <Input
                  id="siteComments"
                  value={siteComments}
                  onChange={(e) => setSiteComments(e.target.value)}
                  placeholder="Ex: Concerne les deux zones portuaires..."
                  className="mt-1.5 border-2 hover:border-rose-300 transition-colors"
                />
              </div>
            </div>

            {/* Coordonnées */}
            <div className="bg-white p-5 rounded-xl border-2 border-rose-100 shadow-sm">
              <Label className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-rose-600" />
                Vos coordonnées <Badge className="bg-red-500 ml-2">Obligatoire</Badge>
              </Label>
              <RadioGroup
                value={isAnonymous ? 'anonymous' : 'not-anonymous'}
                onValueChange={(value) => setIsAnonymous(value === 'anonymous')}
                className="space-y-3"
              >
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isAnonymous
                      ? 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-600 text-white shadow-lg'
                      : 'bg-white border-gray-300 hover:border-rose-300'
                  }`}
                >
                  <RadioGroupItem value="anonymous" id="anonymous" className="sr-only" />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    isAnonymous ? 'border-white' : 'border-gray-400'
                  }`}>
                    {isAnonymous && <div className="h-3 w-3 rounded-full bg-white" />}
                  </div>
                  <span className="font-semibold">🔒 Anonyme</span>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    !isAnonymous
                      ? 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-600 text-white shadow-lg'
                      : 'bg-white border-gray-300 hover:border-rose-300'
                  }`}
                >
                  <RadioGroupItem value="not-anonymous" id="not-anonymous" className="sr-only" />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    !isAnonymous ? 'border-white' : 'border-gray-400'
                  }`}>
                    {!isAnonymous && <div className="h-3 w-3 rounded-full bg-white" />}
                  </div>
                  <span className="font-semibold">👤 Pas anonyme</span>
                </label>
              </RadioGroup>
              {!isAnonymous && (
                <div className="mt-4">
                  <Label htmlFor="agentName" className="text-sm text-gray-700">Nom et prénom</Label>
                  <Input
                    id="agentName"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="mt-1.5 border-2 hover:border-rose-300 transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg"
                size="lg"
              >
                Continuer
                <span className="ml-2">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Domaines */}
      {currentStep === 2 && (
        <Card className="shadow-xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 border-b-2 border-purple-200">
            <CardTitle className="flex items-center gap-3 text-purple-900">
              <FileText className="h-7 w-7" />
              Étape 2 : Domaines concernés
            </CardTitle>
            <CardDescription className="text-purple-700">
              Sélectionnez un ou plusieurs domaines liés à votre remarque
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domainOptions.map((option) => (
                <label
                  key={option.value}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    domains.includes(option.value)
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-600 text-white shadow-xl scale-105'
                      : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`domain-${option.value}`}
                      checked={domains.includes(option.value)}
                      onCheckedChange={() => handleDomainToggle(option.value)}
                      className="sr-only"
                    />
                    <span className="text-3xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-base mb-1">{option.label}</p>
                      {option.description && (
                        <p className={`text-sm ${domains.includes(option.value) ? 'text-white/90' : 'text-gray-600'}`}>
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {option.value === 'autre' && domains.includes('autre') && (
                    <Input
                      value={otherDomain}
                      onChange={(e) => setOtherDomain(e.target.value)}
                      placeholder="Précisez le domaine..."
                      className="mt-3 bg-white/20 border-white/40 text-white placeholder:text-white/60"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                size="lg"
                className="border-2"
              >
                <span className="mr-2">←</span>
                Retour
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
                size="lg"
              >
                Continuer
                <span className="ml-2">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Description */}
      {currentStep === 3 && (
        <Card className="shadow-xl border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-200">
            <CardTitle className="flex items-center gap-3 text-amber-900">
              <MessageSquare className="h-7 w-7" />
              Étape 3 : Description détaillée
            </CardTitle>
            <CardDescription className="text-amber-700">
              Décrivez votre observation ou suggestion en détail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Observation */}
            <div className="bg-white p-5 rounded-xl border-2 border-amber-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="observation" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                  Observation ou suggestion <Badge className="bg-red-500 ml-2">Obligatoire</Badge>
                </Label>
                <span className={`text-sm font-semibold ${
                  observation.length > 700 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {observation.length}/800
                </span>
              </div>
              <Textarea
                id="observation"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Décrivez en détail votre observation, les circonstances, les facteurs matériels et humains..."
                rows={8}
                maxLength={800}
                className="mt-1.5 border-2 hover:border-amber-300 transition-colors resize-none"
              />
              <p className="text-xs text-gray-600 mt-2 italic">
                💡 Soyez précis : décrivez les circonstances et les facteurs ayant contribué à la situation
              </p>
            </div>

            {/* Précisions sur le site */}
            <div className="bg-white p-5 rounded-xl border-2 border-amber-100 shadow-sm">
              <Label htmlFor="sitePrecisions" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-600" />
                Localisation précise <Badge className="bg-red-500 ml-2">Obligatoire</Badge>
              </Label>
              <p className="text-sm text-gray-600 mt-1 mb-2">
                Indiquez le lieu, le bâtiment, l'étage, le bureau ou la zone concernée
              </p>
              <Input
                id="sitePrecisions"
                value={sitePrecisions}
                onChange={(e) => setSitePrecisions(e.target.value)}
                placeholder="Ex: Bâtiment Zattara 1er étage - Bureau 203 - Salle de réunion"
                className="mt-1.5 border-2 hover:border-amber-300 transition-colors"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                size="lg"
                className="border-2"
              >
                <span className="mr-2">←</span>
                Retour
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                size="lg"
              >
                Vérifier
                <span className="ml-2">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Vérification */}
      {currentStep === 4 && (
        <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 border-b-2 border-green-200">
            <CardTitle className="flex items-center gap-3 text-green-900">
              <CheckCircle2 className="h-7 w-7" />
              Étape 4 : Vérification avant envoi
            </CardTitle>
            <CardDescription className="text-green-700">
              Relisez votre remarque avant de l'enregistrer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Résumé */}
            <div className="bg-white p-5 rounded-xl border-2 border-green-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Service et localisation
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Service :</strong> {service === 'Autre' ? otherService : service}</p>
                <p><strong>Sites :</strong> {geographicSites.length > 0 ? geographicSites.join(', ') : 'Non spécifié'}</p>
                {siteComments && <p><strong>Commentaire :</strong> {siteComments}</p>}
                <p><strong>Identité :</strong> {isAnonymous ? '🔒 Anonyme' : `👤 ${agentName}`}</p>
                <p><strong>Localisation :</strong> {sitePrecisions}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-green-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Domaines concernés
              </h3>
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => {
                  const option = domainOptions.find(d => d.value === domain);
                  return (
                    <Badge key={domain} className="bg-purple-600 text-white px-3 py-1">
                      {option?.icon} {option?.label}
                      {domain === 'autre' && otherDomain && `: ${otherDomain}`}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border-2 border-green-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Observation
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {observation}
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
                size="lg"
                className="border-2"
              >
                <span className="mr-2">←</span>
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Enregistrer la remarque
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}