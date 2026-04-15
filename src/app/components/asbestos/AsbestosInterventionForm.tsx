import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  ArrowLeft,
  Save,
  X,
  MapPin,
  Calendar,
  Activity,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  Shield,
  Building2,
  FileText,
  Upload
} from 'lucide-react';
import { AsbestosIntervention } from '../AsbestosView';
import { toast } from 'sonner';

interface AsbestosInterventionFormProps {
  intervention?: AsbestosIntervention;
  onSave: (intervention: AsbestosIntervention) => void;
  onCancel: () => void;
}

export function AsbestosInterventionForm({ intervention, onSave, onCancel }: AsbestosInterventionFormProps) {
  // Identification
  const [zoneMateriau, setZoneMateriau] = useState(intervention?.zoneMateriau || '');
  const [localisationPrecise, setLocalisationPrecise] = useState(intervention?.localisationPrecise || '');
  const [batiment, setBatiment] = useState(intervention?.batiment || '');
  const [etage, setEtage] = useState(intervention?.etage || '');

  // Diagnostic
  const [datePremiereReperage, setDatePremiereReperage] = useState(intervention?.datePremiereReperage || '');
  const [typeAnalyseInitiale, setTypeAnalyseInitiale] = useState<'Type A' | 'Type B' | 'Type C'>(intervention?.typeAnalyseInitiale || 'Type A');
  const [resultatAnalyse, setResultatAnalyse] = useState(intervention?.resultatAnalyse || '');

  // Suivi
  const [dernierControle, setDernierControle] = useState(intervention?.dernierControle || '');
  const [scoreActuel, setScoreActuel] = useState<string>(intervention?.scoreActuel?.toString() || 'none');
  const [evolutionScore, setEvolutionScore] = useState(intervention?.evolutionScore || '');

  // Actions
  const [actionsRealisees, setActionsRealisees] = useState(intervention?.actionsRealisees || '');
  const [retraitRealise, setRetraitRealise] = useState(intervention?.retraitRealise || false);
  const [dateRetrait, setDateRetrait] = useState(intervention?.dateRetrait || '');
  const [entrepriseRetrait, setEntrepriseRetrait] = useState(intervention?.entrepriseRetrait || '');

  // Gestion
  const [actionAPrevoir, setActionAPrevoir] = useState(intervention?.actionAPrevoir || '');
  const [echeanceAction, setEcheanceAction] = useState(intervention?.echeanceAction || '');
  const [priorite, setPriorite] = useState<string>(intervention?.priorite || 'none');
  const [statut, setStatut] = useState<string>(intervention?.statut || 'surveiller');

  // Documents
  const [fichierDiagnostic, setFichierDiagnostic] = useState(intervention?.fichierDiagnostic || '');
  
  // Métadonnées
  const [responsable, setResponsable] = useState(intervention?.responsable || '');

  const handleSave = () => {
    // Validation
    if (!zoneMateriau.trim()) {
      toast.error('La zone/matériau est obligatoire');
      return;
    }
    if (!localisationPrecise.trim()) {
      toast.error('La localisation précise est obligatoire');
      return;
    }
    if (!datePremiereReperage) {
      toast.error('La date du 1er repérage est obligatoire');
      return;
    }
    if (!resultatAnalyse.trim()) {
      toast.error('Le résultat d\'analyse est obligatoire');
      return;
    }
    if (!responsable.trim()) {
      toast.error('Le responsable est obligatoire');
      return;
    }

    const newIntervention: AsbestosIntervention = {
      id: intervention?.id || Date.now().toString(),
      reference: intervention?.reference || `AMI-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      
      // Identification
      zoneMateriau,
      localisationPrecise,
      batiment: batiment || undefined,
      etage: etage || undefined,
      
      // Diagnostic
      datePremiereReperage,
      typeAnalyseInitiale,
      resultatAnalyse,
      
      // Suivi
      dernierControle: dernierControle || undefined,
      scoreActuel: scoreActuel !== 'none' ? parseInt(scoreActuel) as 1 | 2 | 3 : null,
      evolutionScore: evolutionScore || undefined,
      
      // Actions
      actionsRealisees: actionsRealisees || undefined,
      retraitRealise,
      dateRetrait: dateRetrait || undefined,
      entrepriseRetrait: entrepriseRetrait || undefined,
      
      // Gestion
      actionAPrevoir: actionAPrevoir || undefined,
      echeanceAction: echeanceAction || undefined,
      priorite: priorite !== 'none' ? priorite as 'Faible' | 'Moyenne' | 'Élevée' | 'Urgente' : undefined,
      statut: statut as AsbestosIntervention['statut'],
      
      // Documents
      fichierDiagnostic: fichierDiagnostic || undefined,
      
      // Métadonnées
      responsable,
      createdBy: intervention?.createdBy || 'Utilisateur actuel',
      createdAt: intervention?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newIntervention);
    toast.success(intervention ? 'Intervention modifiée avec succès' : 'Intervention créée avec succès');
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
              {intervention ? `Modifier l'intervention ${intervention.reference}` : 'Nouvelle Intervention Diagnostic Amiante'}
            </h1>
            <p className="text-gray-600 mt-1">
              {intervention ? 'Modifiez les informations de l\'intervention' : 'Remplissez toutes les informations du diagnostic'}
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

      {/* Section 1: Identification */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <MapPin className="h-6 w-6" />
            Identification du matériau et localisation
          </CardTitle>
          <CardDescription className="text-purple-700">
            Zone concernée et localisation précise dans le bâtiment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label htmlFor="zoneMateriau" className="text-base">Zone / Matériau *</Label>
            <Input
              id="zoneMateriau"
              value={zoneMateriau}
              onChange={(e) => setZoneMateriau(e.target.value)}
              placeholder="Ex: Faux-plafond - Dalles fibrociment"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Type de matériau et zone concernée</p>
          </div>

          <div>
            <Label htmlFor="localisationPrecise" className="text-base">Localisation précise *</Label>
            <Textarea
              id="localisationPrecise"
              value={localisationPrecise}
              onChange={(e) => setLocalisationPrecise(e.target.value)}
              placeholder="Ex: Bureau 201, aile Est, 2ème étage"
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Description précise de l'emplacement</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batiment" className="text-base">Bâtiment</Label>
              <Input
                id="batiment"
                value={batiment}
                onChange={(e) => setBatiment(e.target.value)}
                placeholder="Ex: Bâtiment administratif principal"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="etage" className="text-base">Étage / Niveau</Label>
              <Input
                id="etage"
                value={etage}
                onChange={(e) => setEtage(e.target.value)}
                placeholder="Ex: 2ème étage, RDC, Sous-sol"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Diagnostic Initial */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-6 w-6" />
            Diagnostic initial
          </CardTitle>
          <CardDescription className="text-blue-700">
            Premier repérage et résultats de l'analyse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateReperage" className="text-base">Date du 1er repérage *</Label>
              <Input
                id="dateReperage"
                type="date"
                value={datePremiereReperage}
                onChange={(e) => setDatePremiereReperage(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="typeAnalyse" className="text-base">Type d'analyse initiale *</Label>
              <Select value={typeAnalyseInitiale} onValueChange={(value) => setTypeAnalyseInitiale(value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Type A">Type A - Repérage visuel</SelectItem>
                  <SelectItem value="Type B">Type B - Prélèvements et analyses</SelectItem>
                  <SelectItem value="Type C">Type C - Investigations destructives</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selon norme NF X 46-020</p>
            </div>
          </div>

          <div>
            <Label htmlFor="resultatAnalyse" className="text-base">Résultat de l'analyse *</Label>
            <Textarea
              id="resultatAnalyse"
              value={resultatAnalyse}
              onChange={(e) => setResultatAnalyse(e.target.value)}
              placeholder="Ex: Présence d'amiante chrysotile confirmée (15% masse) ou Absence d'amiante confirmée"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Indiquez le type d'amiante détecté et le pourcentage massique si applicable</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Suivi et Évaluation */}
      <Card className="border-2 border-orange-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Activity className="h-6 w-6" />
            Suivi et évaluation de l'état
          </CardTitle>
          <CardDescription className="text-orange-700">
            Contrôles périodiques et score d'évaluation de l'état de conservation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dernierControle" className="text-base">Date du dernier contrôle</Label>
              <Input
                id="dernierControle"
                type="date"
                value={dernierControle}
                onChange={(e) => setDernierControle(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Date du dernier contrôle visuel ou technique</p>
            </div>
            <div>
              <Label htmlFor="scoreActuel" className="text-base">Score actuel</Label>
              <Select value={scoreActuel} onValueChange={setScoreActuel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non applicable</SelectItem>
                  <SelectItem value="1">Score 1 - État correct (faible risque)</SelectItem>
                  <SelectItem value="2">Score 2 - État intermédiaire (risque moyen)</SelectItem>
                  <SelectItem value="3">Score 3 - État dégradé (risque élevé)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Score d'évaluation de l'état de conservation (1 à 3)</p>
            </div>
          </div>

          <div>
            <Label htmlFor="evolutionScore" className="text-base">Évolution du score</Label>
            <Textarea
              id="evolutionScore"
              value={evolutionScore}
              onChange={(e) => setEvolutionScore(e.target.value)}
              placeholder="Ex: Score stable depuis 2022, ou Dégradation constatée - passage du score 2 au score 3 en septembre 2024"
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Historique et évolution du score dans le temps</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Actions Réalisées */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <ClipboardCheck className="h-6 w-6" />
            Actions réalisées
          </CardTitle>
          <CardDescription className="text-green-700">
            Mesures de gestion et opérations de retrait effectuées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label htmlFor="actionsRealisees" className="text-base">Actions réalisées</Label>
            <Textarea
              id="actionsRealisees"
              value={actionsRealisees}
              onChange={(e) => setActionsRealisees(e.target.value)}
              placeholder="Ex: Confinement temporaire réalisé le 15/04/2023. Signalétique apposée. Formation du personnel en contact."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Listez toutes les actions de gestion déjà effectuées</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Retrait réalisé</p>
                  <p className="text-sm text-gray-600">Le matériau amianté a-t-il été retiré ?</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={retraitRealise}
                onChange={(e) => setRetraitRealise(e.target.checked)}
                className="h-6 w-6 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>

            {retraitRealise && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <Label htmlFor="dateRetrait" className="text-base">Date du retrait</Label>
                  <Input
                    id="dateRetrait"
                    type="date"
                    value={dateRetrait}
                    onChange={(e) => setDateRetrait(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="entrepriseRetrait" className="text-base">Entreprise de désamiantage</Label>
                  <Input
                    id="entrepriseRetrait"
                    value={entrepriseRetrait}
                    onChange={(e) => setEntrepriseRetrait(e.target.value)}
                    placeholder="Ex: Désamiantage Pro - Certification SS4"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Gestion et Statut */}
      <Card className="border-2 border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <TrendingUp className="h-6 w-6" />
            Action à prévoir et gestion future
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Planification des actions et statut réglementaire du matériau
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label htmlFor="actionAPrevoir" className="text-base">Action à prévoir / Gestion</Label>
            <Textarea
              id="actionAPrevoir"
              value={actionAPrevoir}
              onChange={(e) => setActionAPrevoir(e.target.value)}
              placeholder="Ex: Retrait complet prévu lors de la rénovation du bâtiment programmée en 2025"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Décrivez les actions futures prévues pour la gestion de ce matériau</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="echeanceAction" className="text-base">Échéance de l'action</Label>
              <Input
                id="echeanceAction"
                type="date"
                value={echeanceAction}
                onChange={(e) => setEcheanceAction(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Date limite pour réaliser l'action prévue</p>
            </div>
            <div>
              <Label htmlFor="priorite" className="text-base">Priorité</Label>
              <Select value={priorite} onValueChange={setPriorite}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non définie</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                  <SelectItem value="Moyenne">Moyenne</SelectItem>
                  <SelectItem value="Élevée">Élevée</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="statut" className="text-base">Statut du matériau *</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non_amiante">Non amianté - Absence d'amiante confirmée</SelectItem>
                <SelectItem value="surveiller">Amiante détecté - À surveiller</SelectItem>
                <SelectItem value="action_requise">Action requise - Intervention nécessaire</SelectItem>
                <SelectItem value="retrait_effectue">Retrait effectué - Matériau retiré</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Statut réglementaire actuel du matériau</p>
          </div>

          <div>
            <Label htmlFor="responsable" className="text-base">Responsable du suivi *</Label>
            <Input
              id="responsable"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Nom du responsable"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Documents */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="h-6 w-6" />
            Documents et pièces jointes
          </CardTitle>
          <CardDescription className="text-gray-700">
            Rapports de diagnostic et documents techniques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label className="text-base">Fichier du diagnostic</Label>
            {fichierDiagnostic ? (
              <div className="mt-2 p-4 bg-white border-2 border-purple-300 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{fichierDiagnostic}</p>
                    <p className="text-xs text-gray-500">PDF - Rapport de diagnostic</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFichierDiagnostic('')}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Cliquez pour importer le diagnostic ou glissez-déposez</p>
                <p className="text-xs text-gray-500 mt-1">PDF jusqu'à 50MB</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setFichierDiagnostic('diagnostic_exemple.pdf')}
                >
                  Simuler un upload
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer l'intervention
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
