import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import {
  Calendar,
  MapPin,
  FileText,
  Sparkles,
  Plus,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { MercuryCampaign, Prelevement } from '../MercuryView';
import { toast } from 'sonner';

interface MercuryCampaignFormProps {
  campaign?: MercuryCampaign;
  onSave: (campaign: MercuryCampaign) => void;
  onCancel: () => void;
}

export function MercuryCampaignForm({ campaign, onSave, onCancel }: MercuryCampaignFormProps) {
  const [activePhase, setActivePhase] = useState(1);
  
  // Phase 1 - Planification
  const [titre, setTitre] = useState(campaign?.titre || '');
  const [programme, setProgramme] = useState(campaign?.programme || '');
  const [objectifs, setObjectifs] = useState(campaign?.objectifs || '');
  const [zones, setZones] = useState(campaign?.zones.join(', ') || '');
  const [datePrevue, setDatePrevue] = useState(campaign?.datePrevue || '');
  const [dateFinPrevue, setDateFinPrevue] = useState(campaign?.dateFinPrevue || '');
  const [typesPrelevements, setTypesPrelevements] = useState<Prelevement[]>(
    campaign?.typesPrelevements || [{ id: '1', type: '', quantite: 0, unite: '' }]
  );
  const [prestataire, setPrestataire] = useState(campaign?.prestataire || '');
  const [contactPrestataire, setContactPrestataire] = useState(campaign?.contactPrestataire || '');
  const [budgetEstime, setBudgetEstime] = useState(campaign?.budgetEstime?.toString() || '');

  // Phase 2 - Suivi Terrain
  const [dateReelle, setDateReelle] = useState(campaign?.dateReelle || '');
  const [dateFinReelle, setDateFinReelle] = useState(campaign?.dateFinReelle || '');
  const [prelevementsRealises, setPrelevementsRealises] = useState<Prelevement[]>(
    campaign?.prelevementsRealises || []
  );
  const [ecartsConstates, setEcartsConstates] = useState(campaign?.ecartsConstates || '');
  const [difficultes, setDifficultes] = useState(campaign?.difficultes || '');

  // Phase 3 - Rapport
  const [dateReceptionRapport, setDateReceptionRapport] = useState(campaign?.dateReceptionRapport || '');
  const [fichierRapport, setFichierRapport] = useState(campaign?.fichierRapport || '');
  const [verificationAdministrative, setVerificationAdministrative] = useState(campaign?.verificationAdministrative || false);
  const [verificationCoherence, setVerificationCoherence] = useState(campaign?.verificationCoherence || false);
  const [notesVerification, setNotesVerification] = useState(campaign?.notesVerification || '');

  // Phase 4 - Synthèse
  const [contexteIntervention, setContexteIntervention] = useState(campaign?.contexteIntervention || '');
  const [lieuEtDate, setLieuEtDate] = useState(campaign?.lieuEtDate || '');
  const [prelevementsEffectues, setPrelevementsEffectues] = useState(campaign?.prelevementsEffectues || '');
  const [resultatsMarquants, setResultatsMarquants] = useState(campaign?.resultatsMarquants || '');
  const [pointsAttention, setPointsAttention] = useState(campaign?.pointsAttention || '');
  const [anomalies, setAnomalies] = useState(campaign?.anomalies || '');
  const [conclusion, setConclusion] = useState(campaign?.conclusion || '');
  const [suitesADonner, setSuitesADonner] = useState(campaign?.suitesADonner || '');

  const addPrelevement = () => {
    setTypesPrelevements([...typesPrelevements, { id: Date.now().toString(), type: '', quantite: 0, unite: '' }]);
  };

  const removePrelevement = (id: string) => {
    setTypesPrelevements(typesPrelevements.filter(p => p.id !== id));
  };

  const updatePrelevement = (id: string, field: keyof Prelevement, value: any) => {
    setTypesPrelevements(typesPrelevements.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addPrelevementRealise = () => {
    setPrelevementsRealises([...prelevementsRealises, { id: Date.now().toString(), type: '', quantite: 0, unite: '', description: '' }]);
  };

  const removePrelevementRealise = (id: string) => {
    setPrelevementsRealises(prelevementsRealises.filter(p => p.id !== id));
  };

  const updatePrelevementRealise = (id: string, field: keyof Prelevement, value: any) => {
    setPrelevementsRealises(prelevementsRealises.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const copyPrelevementsPrevus = () => {
    setPrelevementsRealises(typesPrelevements.map(p => ({ ...p, id: Date.now().toString() + Math.random(), description: '' })));
    toast.success('Prélèvements prévus copiés');
  };

  const determineStatut = (): MercuryCampaign['statut'] => {
    if (dateReceptionRapport && (verificationAdministrative || verificationCoherence)) {
      if (conclusion || resultatsMarquants) {
        return 'synthese_produite';
      }
      return 'rapport_recu';
    }
    if (dateReelle) {
      return 'en_cours';
    }
    return 'planifiee';
  };

  const handleSave = () => {
    // Validation Phase 1
    if (!titre.trim()) {
      toast.error('Le titre est obligatoire');
      setActivePhase(1);
      return;
    }
    if (!programme.trim()) {
      toast.error('Le programme est obligatoire');
      setActivePhase(1);
      return;
    }
    if (!objectifs.trim()) {
      toast.error('Les objectifs sont obligatoires');
      setActivePhase(1);
      return;
    }
    if (!zones.trim()) {
      toast.error('Les zones sont obligatoires');
      setActivePhase(1);
      return;
    }
    if (!datePrevue) {
      toast.error('La date prévue est obligatoire');
      setActivePhase(1);
      return;
    }
    if (!prestataire.trim()) {
      toast.error('Le prestataire est obligatoire');
      setActivePhase(1);
      return;
    }
    if (typesPrelevements.length === 0 || !typesPrelevements[0].type) {
      toast.error('Au moins un type de prélèvement est obligatoire');
      setActivePhase(1);
      return;
    }

    const newCampaign: MercuryCampaign = {
      id: campaign?.id || Date.now().toString(),
      reference: campaign?.reference || `MERC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      titre,
      statut: determineStatut(),
      
      // Phase 1
      programme,
      zones: zones.split(',').map(z => z.trim()).filter(z => z),
      datePrevue,
      dateFinPrevue: dateFinPrevue || undefined,
      typesPrelevements: typesPrelevements.filter(p => p.type),
      prestataire,
      contactPrestataire,
      budgetEstime: budgetEstime ? parseFloat(budgetEstime) : undefined,
      objectifs,
      
      // Phase 2
      dateReelle: dateReelle || undefined,
      dateFinReelle: dateFinReelle || undefined,
      prelevementsRealises: prelevementsRealises.length > 0 ? prelevementsRealises : undefined,
      ecartsConstates: ecartsConstates || undefined,
      difficultes: difficultes || undefined,
      
      // Phase 3
      rapportRecu: !!dateReceptionRapport,
      dateReceptionRapport: dateReceptionRapport || undefined,
      fichierRapport: fichierRapport || undefined,
      verificationAdministrative: verificationAdministrative || undefined,
      verificationCoherence: verificationCoherence || undefined,
      notesVerification: notesVerification || undefined,
      
      // Phase 4
      syntheseProduite: !!(conclusion || resultatsMarquants),
      dateSynthese: (conclusion || resultatsMarquants) ? new Date().toISOString().split('T')[0] : undefined,
      contexteIntervention: contexteIntervention || undefined,
      lieuEtDate: lieuEtDate || undefined,
      prelevementsEffectues: prelevementsEffectues || undefined,
      resultatsMarquants: resultatsMarquants || undefined,
      pointsAttention: pointsAttention || undefined,
      anomalies: anomalies || undefined,
      conclusion: conclusion || undefined,
      suitesADonner: suitesADonner || undefined,
      
      createdBy: campaign?.createdBy || 'Utilisateur actuel',
      createdAt: campaign?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newCampaign);
    toast.success(campaign ? 'Campagne modifiée avec succès' : 'Campagne créée avec succès');
  };

  const getPhaseStatus = (phase: number): 'completed' | 'active' | 'pending' => {
    if (phase < activePhase) return 'completed';
    if (phase === activePhase) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {campaign ? `Modifier la campagne ${campaign.reference}` : 'Nouvelle campagne mercure'}
            </h1>
            <p className="text-gray-600 mt-1">
              {campaign ? 'Modifiez les informations de la campagne' : 'Remplissez les informations de planification'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Phase Stepper */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Planification', icon: Calendar },
              { num: 2, label: 'Suivi Terrain', icon: MapPin },
              { num: 3, label: 'Rapport', icon: FileText },
              { num: 4, label: 'Synthèse', icon: Sparkles },
            ].map((phase, idx) => {
              const status = getPhaseStatus(phase.num);
              const PhaseIcon = phase.icon;
              
              return (
                <div key={phase.num} className="flex items-center">
                  <button
                    onClick={() => setActivePhase(phase.num)}
                    className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activePhase === phase.num
                        ? 'bg-gradient-to-br from-cyan-50 to-blue-50 scale-105'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      status === 'completed'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : status === 'active'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        : 'bg-gray-300'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      ) : (
                        <PhaseIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${
                        activePhase === phase.num ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        Phase {phase.num}
                      </p>
                      <p className={`text-xs ${
                        activePhase === phase.num ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {phase.label}
                      </p>
                    </div>
                  </button>
                  {idx < 3 && (
                    <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase 1: Planification */}
      {activePhase === 1 && (
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-6 w-6" />
              Phase 1 : Planification
            </CardTitle>
            <CardDescription className="text-blue-700">
              Programme d'intervention, zones, dates prévisionnelles et choix du prestataire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titre" className="text-base">Titre de la campagne *</Label>
                <Input
                  id="titre"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Contrôle mercure - Port de Marseille"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reference" className="text-base">Référence</Label>
                <Input
                  id="reference"
                  value={campaign?.reference || 'Auto-générée'}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="programme" className="text-base">Programme d'intervention *</Label>
              <Input
                id="programme"
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                placeholder="Ex: Surveillance qualité eau portuaire 2025"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="objectifs" className="text-base">Objectifs de la campagne *</Label>
              <Textarea
                id="objectifs"
                value={objectifs}
                onChange={(e) => setObjectifs(e.target.value)}
                placeholder="Décrivez les objectifs et le contexte de cette campagne..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="zones" className="text-base">Zones concernées * (séparées par des virgules)</Label>
              <Textarea
                id="zones"
                value={zones}
                onChange={(e) => setZones(e.target.value)}
                placeholder="Ex: Bassin Est, Quai du Commerce, Zone industrielle"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="datePrevue" className="text-base">Date de début prévue *</Label>
                <Input
                  id="datePrevue"
                  type="date"
                  value={datePrevue}
                  onChange={(e) => setDatePrevue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateFinPrevue" className="text-base">Date de fin prévue</Label>
                <Input
                  id="dateFinPrevue"
                  type="date"
                  value={dateFinPrevue}
                  onChange={(e) => setDateFinPrevue(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Types de prélèvements prévus *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPrelevement}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un type
                </Button>
              </div>
              <div className="space-y-3">
                {typesPrelevements.map((prelevement, idx) => (
                  <div key={prelevement.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Type (ex: Eau de surface)"
                        value={prelevement.type}
                        onChange={(e) => updatePrelevement(prelevement.id, 'type', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Quantité"
                        value={prelevement.quantite || ''}
                        onChange={(e) => updatePrelevement(prelevement.id, 'quantite', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        placeholder="Unité (ex: échantillons)"
                        value={prelevement.unite}
                        onChange={(e) => updatePrelevement(prelevement.id, 'unite', e.target.value)}
                      />
                    </div>
                    {typesPrelevements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrelevement(prelevement.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prestataire" className="text-base">Prestataire *</Label>
                <Input
                  id="prestataire"
                  value={prestataire}
                  onChange={(e) => setPrestataire(e.target.value)}
                  placeholder="Nom du laboratoire ou organisme"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contact" className="text-base">Contact prestataire</Label>
                <Input
                  id="contact"
                  value={contactPrestataire}
                  onChange={(e) => setContactPrestataire(e.target.value)}
                  placeholder="Nom et coordonnées"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="budget" className="text-base">Budget estimé (€)</Label>
              <Input
                id="budget"
                type="number"
                value={budgetEstime}
                onChange={(e) => setBudgetEstime(e.target.value)}
                placeholder="15000"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 2: Suivi Terrain */}
      {activePhase === 2 && (
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <MapPin className="h-6 w-6" />
              Phase 2 : Suivi Terrain
            </CardTitle>
            <CardDescription className="text-orange-700">
              Dates effectives, prélèvements réalisés et difficultés rencontrées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateReelle" className="text-base">Date de début réelle</Label>
                <Input
                  id="dateReelle"
                  type="date"
                  value={dateReelle}
                  onChange={(e) => setDateReelle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateFinReelle" className="text-base">Date de fin réelle</Label>
                <Input
                  id="dateFinReelle"
                  type="date"
                  value={dateFinReelle}
                  onChange={(e) => setDateFinReelle(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Prélèvements réellement effectués</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={copyPrelevementsPrevus}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copier les prévus
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addPrelevementRealise}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {prelevementsRealises.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Aucun prélèvement réalisé enregistré</p>
                    <p className="text-sm text-gray-500 mt-1">Utilisez "Copier les prévus" ou ajoutez manuellement</p>
                  </div>
                ) : (
                  prelevementsRealises.map((prelevement) => (
                    <div key={prelevement.id} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Type"
                            value={prelevement.type}
                            onChange={(e) => updatePrelevementRealise(prelevement.id, 'type', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Quantité"
                            value={prelevement.quantite || ''}
                            onChange={(e) => updatePrelevementRealise(prelevement.id, 'quantite', parseInt(e.target.value) || 0)}
                          />
                          <Input
                            placeholder="Unité"
                            value={prelevement.unite}
                            onChange={(e) => updatePrelevementRealise(prelevement.id, 'unite', e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePrelevementRealise(prelevement.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Remarques ou écarts (optionnel)"
                        value={prelevement.description || ''}
                        onChange={(e) => updatePrelevementRealise(prelevement.id, 'description', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="ecarts" className="text-base">Écarts constatés par rapport au prévisionnel</Label>
              <Textarea
                id="ecarts"
                value={ecartsConstates}
                onChange={(e) => setEcartsConstates(e.target.value)}
                placeholder="Décrivez les différences entre le prévu et le réalisé..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="difficultes" className="text-base">Difficultés rencontrées</Label>
              <Textarea
                id="difficultes"
                value={difficultes}
                onChange={(e) => setDifficultes(e.target.value)}
                placeholder="Problèmes d'accès, conditions météo, incidents techniques..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-base">Photos terrain (optionnel)</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Cliquez pour ajouter des photos ou glissez-déposez</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG jusqu'à 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 3: Rapport */}
      {activePhase === 3 && (
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <FileText className="h-6 w-6" />
              Phase 3 : Réception et Vérification du Rapport
            </CardTitle>
            <CardDescription className="text-purple-700">
              Archivage du rapport prestataire et vérifications administrative et de cohérence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label htmlFor="dateReception" className="text-base">Date de réception du rapport</Label>
              <Input
                id="dateReception"
                type="date"
                value={dateReceptionRapport}
                onChange={(e) => setDateReceptionRapport(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-base">Fichier du rapport prestataire</Label>
              {fichierRapport ? (
                <div className="mt-2 p-4 bg-white border-2 border-purple-300 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-10 w-10 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{fichierRapport}</p>
                      <p className="text-xs text-gray-500">PDF - Document du prestataire</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFichierRapport('')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Cliquez pour importer le rapport ou glissez-déposez</p>
                  <p className="text-xs text-gray-500 mt-1">PDF jusqu'à 50MB</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setFichierRapport('rapport_exemple.pdf')}
                  >
                    Simuler un upload
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-semibold">Vérifications</Label>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    verificationAdministrative ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {verificationAdministrative ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Vérification administrative</p>
                    <p className="text-sm text-gray-600">Complétude du dossier, factures, conventions</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={verificationAdministrative}
                  onChange={(e) => setVerificationAdministrative(e.target.checked)}
                  className="h-6 w-6 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    verificationCoherence === true
                      ? 'bg-green-100'
                      : verificationCoherence === false
                      ? 'bg-red-100'
                      : 'bg-gray-100'
                  }`}>
                    {verificationCoherence === true ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : verificationCoherence === false ? (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    ) : (
                      <Clock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Vérification de cohérence</p>
                    <p className="text-sm text-gray-600">Données cohérentes, échantillons complets</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={verificationCoherence}
                  onChange={(e) => setVerificationCoherence(e.target.checked)}
                  className="h-6 w-6 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notesVerif" className="text-base">Notes de vérification</Label>
              <Textarea
                id="notesVerif"
                value={notesVerification}
                onChange={(e) => setNotesVerification(e.target.value)}
                placeholder="Remarques, points à clarifier, demandes au prestataire..."
                rows={4}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 4: Synthèse */}
      {activePhase === 4 && (
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Sparkles className="h-6 w-6" />
              Phase 4 : Synthèse de la Campagne
            </CardTitle>
            <CardDescription className="text-green-700">
              Production d'une synthèse claire et lisible pour rendre l'information exploitable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Objectif de la synthèse</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Extraire l'essentiel du rapport technique pour le rendre compréhensible et exploitable 
                    par des personnes qui ne liront jamais le rapport complet. Focus sur les éléments clés 
                    et les suites à donner.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="contexte" className="text-base">Contexte de l'intervention (Pourquoi ?)</Label>
              <Textarea
                id="contexte"
                value={contexteIntervention}
                onChange={(e) => setContexteIntervention(e.target.value)}
                placeholder="Ex: Campagne de surveillance réglementaire suite aux travaux de dragage..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lieuDate" className="text-base">Lieu et dates (Où et quand ?)</Label>
              <Textarea
                id="lieuDate"
                value={lieuEtDate}
                onChange={(e) => setLieuEtDate(e.target.value)}
                placeholder="Ex: Port de Marseille (Bassin Est et Quai du Commerce) - 16-17 janvier 2025"
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="prelevEffectues" className="text-base">Prélèvements effectués (Quoi ?)</Label>
              <Textarea
                id="prelevEffectues"
                value={prelevementsEffectues}
                onChange={(e) => setPrelevementsEffectues(e.target.value)}
                placeholder="Ex: 12 échantillons d'eau de surface et 6 carottes de sédiments..."
                rows={2}
                className="mt-1"
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="resultats" className="text-base font-semibold text-amber-900">
                Résultats marquants concernant le mercure ⭐
              </Label>
              <Textarea
                id="resultats"
                value={resultatsMarquants}
                onChange={(e) => setResultatsMarquants(e.target.value)}
                placeholder="Ex: Concentration moyenne en mercure : 0.08 µg/L (eau) et 0.12 mg/kg (sédiments)..."
                rows={3}
                className="mt-1 bg-amber-50 border-amber-300"
              />
            </div>

            <div>
              <Label htmlFor="attention" className="text-base">Points d'attention</Label>
              <Textarea
                id="attention"
                value={pointsAttention}
                onChange={(e) => setPointsAttention(e.target.value)}
                placeholder="Ex: Point de mesure S3 présente une valeur légèrement élevée..."
                rows={2}
                className="mt-1 bg-orange-50 border-orange-300"
              />
            </div>

            <div>
              <Label htmlFor="anomalies" className="text-base">Anomalies détectées</Label>
              <Textarea
                id="anomalies"
                value={anomalies}
                onChange={(e) => setAnomalies(e.target.value)}
                placeholder="Anomalies ou incidents significatifs, ou 'Aucune anomalie détectée'"
                rows={2}
                className="mt-1 bg-red-50 border-red-300"
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="conclusion" className="text-base font-semibold text-green-900">
                Conclusion simple ✓
              </Label>
              <Textarea
                id="conclusion"
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Ex: La qualité de l'eau et des sédiments est satisfaisante..."
                rows={3}
                className="mt-1 bg-green-50 border-green-300 font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="suites" className="text-base font-semibold text-blue-900">
                Suites à donner →
              </Label>
              <Textarea
                id="suites"
                value={suitesADonner}
                onChange={(e) => setSuitesADonner(e.target.value)}
                placeholder="Ex: Poursuivre la surveillance semestrielle. Programmer un nouveau contrôle..."
                rows={3}
                className="mt-1 bg-blue-50 border-blue-300 font-semibold"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <div className="flex gap-2">
              {activePhase > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setActivePhase(activePhase - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Phase précédente
                </Button>
              )}
              {activePhase < 4 ? (
                <Button
                  onClick={() => setActivePhase(activePhase + 1)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                >
                  Phase suivante
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer la campagne
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}