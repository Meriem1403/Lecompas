import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  ArrowLeft,
  Save,
  X,
  User,
  FileText,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { AsbestosDeclaration, PosteOccupe, PeriodePresence, DeclarationType } from '../AsbestosDeclarationView';
import { toast } from 'sonner';

interface AsbestosDeclarationFormProps {
  declaration?: AsbestosDeclaration;
  currentUser: {
    name: string;
    role: 'admin' | 'chef_service' | 'agent';
  };
  onSave: (declaration: AsbestosDeclaration) => void;
  onCancel: () => void;
}

export function AsbestosDeclarationForm({ declaration, currentUser, onSave, onCancel }: AsbestosDeclarationFormProps) {
  // Type de déclaration
  const [type, setType] = useState<DeclarationType>(declaration?.type || 'intermediaire');
  
  // Informations agent
  const [nom, setNom] = useState(declaration?.nom || '');
  const [prenom, setPrenom] = useState(declaration?.prenom || '');
  const [dateNaissance, setDateNaissance] = useState(declaration?.dateNaissance || '');
  const [numeroSecurite, setNumeroSecurite] = useState(declaration?.numeroSecurite || '');
  const [service, setService] = useState(declaration?.service || '');
  const [medecinPrevention, setMedecinPrevention] = useState(declaration?.medecinPrevention || '');
  const [intitulePosteActuel, setIntitulePosteActuel] = useState(declaration?.intitulePosteActuel || '');
  
  // Postes occupés
  const [postesOccupes, setPostesOccupes] = useState<PosteOccupe[]>(
    declaration?.postesOccupes || [{ intitule: '', dateDebut: '', dateFin: '' }]
  );
  
  // Pour attestation intermédiaire
  const [produitsUtilises, setProduitsUtilises] = useState<string[]>(
    declaration?.expositionDetails?.produitsUtilises || []
  );
  const [autresProduits, setAutresProduits] = useState(declaration?.expositionDetails?.autresProduits || '');
  const [compositionProduits, setCompositionProduits] = useState(declaration?.expositionDetails?.compositionProduits || '');
  const [mesuresPrevention, setMesuresPrevention] = useState(declaration?.expositionDetails?.mesuresPrevention || '');
  const [evaluationExposition, setEvaluationExposition] = useState(declaration?.expositionDetails?.evaluationExposition || '');
  
  // Pour attestation de présence
  const [periodesPresence, setPeriodesPresence] = useState<PeriodePresence[]>(
    declaration?.periodesPresence || [{ batiments: '', dateDebut: '', dateFin: '', origineContamination: '' }]
  );

  const produitsDisponibles = [
    'Entretien bâtiments/ouvrages/navires/feux-phares',
    'Fibrociment',
    'Peintures amiantées',
    'Mécanique automobile/marine (garnitures de friction)',
    'Travail sur/dans locaux floqués',
    'Essais de laboratoire sur matériaux amiantés',
    'Contrôles techniques de véhicules/navires',
  ];

  const handleAddPoste = () => {
    setPostesOccupes([...postesOccupes, { intitule: '', dateDebut: '', dateFin: '' }]);
  };

  const handleRemovePoste = (index: number) => {
    setPostesOccupes(postesOccupes.filter((_, i) => i !== index));
  };

  const handlePosteChange = (index: number, field: keyof PosteOccupe, value: string) => {
    const updated = [...postesOccupes];
    updated[index] = { ...updated[index], [field]: value };
    setPostesOccupes(updated);
  };

  const handleAddPeriode = () => {
    setPeriodesPresence([...periodesPresence, { batiments: '', dateDebut: '', dateFin: '', origineContamination: '' }]);
  };

  const handleRemovePeriode = (index: number) => {
    setPeriodesPresence(periodesPresence.filter((_, i) => i !== index));
  };

  const handlePeriodeChange = (index: number, field: keyof PeriodePresence, value: string) => {
    const updated = [...periodesPresence];
    updated[index] = { ...updated[index], [field]: value };
    setPeriodesPresence(updated);
  };

  const handleSave = () => {
    // Validation
    if (!nom.trim() || !prenom.trim()) {
      toast.error('Le nom et le prénom sont obligatoires');
      return;
    }
    if (!dateNaissance) {
      toast.error('La date de naissance est obligatoire');
      return;
    }
    if (!service.trim()) {
      toast.error('Le service est obligatoire');
      return;
    }
    if (!intitulePosteActuel.trim()) {
      toast.error('L\'intitulé du poste actuel est obligatoire');
      return;
    }
    if (postesOccupes.length === 0 || !postesOccupes[0].intitule.trim()) {
      toast.error('Au moins un poste occupé est obligatoire');
      return;
    }

    // Validation spécifique selon le type
    if (type === 'intermediaire') {
      if (!numeroSecurite) {
        toast.error('Le numéro de sécurité sociale est obligatoire pour l\'attestation intermédiaire');
        return;
      }
      if (produitsUtilises.length === 0) {
        toast.error('Sélectionnez au moins un produit/procédé');
        return;
      }
      if (!compositionProduits.trim()) {
        toast.error('La composition des produits est obligatoire');
        return;
      }
    } else {
      if (periodesPresence.length === 0 || !periodesPresence[0].batiments.trim()) {
        toast.error('Au moins une période de présence est obligatoire');
        return;
      }
    }

    const newDeclaration: AsbestosDeclaration = {
      id: declaration?.id || `decl-${Date.now()}`,
      type,
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateNaissance,
      numeroSecurite: type === 'intermediaire' ? numeroSecurite : undefined,
      service: service.trim(),
      medecinPrevention: medecinPrevention.trim(),
      intitulePosteActuel: intitulePosteActuel.trim(),
      postesOccupes: postesOccupes.filter(p => p.intitule.trim()),
      expositionDetails: type === 'intermediaire' ? {
        produitsUtilises,
        autresProduits: autresProduits.trim(),
        compositionProduits: compositionProduits.trim(),
        mesuresPrevention: mesuresPrevention.trim(),
        evaluationExposition: evaluationExposition.trim(),
      } : undefined,
      periodesPresence: type === 'presence' ? periodesPresence.filter(p => p.batiments.trim()) : undefined,
      status: declaration?.status || 'pending',
      createdBy: declaration?.createdBy || currentUser.name,
      createdAt: declaration?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Conserver les validations existantes
      validatedByAdmin: declaration?.validatedByAdmin,
      validatedByAdminDate: declaration?.validatedByAdminDate,
      adminComment: declaration?.adminComment,
      validatedBySG: declaration?.validatedBySG,
      validatedBySGDate: declaration?.validatedBySGDate,
      sgComment: declaration?.sgComment,
      sentToAgentDate: declaration?.sentToAgentDate,
      deliveredDate: declaration?.deliveredDate,
    };

    onSave(newDeclaration);
    toast.success(declaration ? 'Déclaration modifiée avec succès' : 'Déclaration créée avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {declaration ? 'Modifier la déclaration' : 'Nouvelle déclaration d\'exposition amiante'}
            </h1>
            <p className="text-gray-600 mt-1">Complétez tous les champs obligatoires</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Type de déclaration */}
      <Card className="border-2 border-amber-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <FileText className="h-6 w-6" />
            Type d'attestation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setType('intermediaire')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                type === 'intermediaire'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-4 w-4 rounded-full border-2 ${
                  type === 'intermediaire' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                }`} />
                <h3 className="font-bold text-gray-900">Attestation d'Exposition Intermédiaire</h3>
              </div>
              <p className="text-sm text-gray-600">
                Exposition antérieure au 31 janvier 2012 ouvrant droit à un suivi post-professionnel
              </p>
            </div>

            <div
              onClick={() => setType('presence')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                type === 'presence'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-4 w-4 rounded-full border-2 ${
                  type === 'presence' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                }`} />
                <h3 className="font-bold text-gray-900">Attestation de Présence</h3>
              </div>
              <p className="text-sm text-gray-600">
                Présence dans des lieux de travail susceptibles d'avoir été contaminés par de l'amiante
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Informations de l'agent */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <User className="h-6 w-6" />
            Informations de l'agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="MARTIN"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Jean-Pierre"
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateNaissance">Date de naissance *</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="mt-2"
              />
            </div>

            {type === 'intermediaire' && (
              <div>
                <Label htmlFor="numeroSecurite">N° Sécurité Sociale (5 premiers chiffres) *</Label>
                <Input
                  id="numeroSecurite"
                  value={numeroSecurite}
                  onChange={(e) => setNumeroSecurite(e.target.value.slice(0, 5))}
                  placeholder="17505"
                  maxLength={5}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service">Service *</Label>
              <Input
                id="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="DIRM Méditerranée - Service..."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="medecinPrevention">Médecin de prévention</Label>
              <Input
                id="medecinPrevention"
                value={medecinPrevention}
                onChange={(e) => setMedecinPrevention(e.target.value)}
                placeholder="Dr. Sophie BERNARD"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="intitulePosteActuel">Intitulé du poste actuel *</Label>
            <Input
              id="intitulePosteActuel"
              value={intitulePosteActuel}
              onChange={(e) => setIntitulePosteActuel(e.target.value)}
              placeholder="Technicien Sécurité Maritime"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Postes occupés */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <FileText className="h-6 w-6" />
            Postes occupés *
          </CardTitle>
          <CardDescription>
            Listez tous les postes occupés en lien avec l'exposition à l'amiante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {postesOccupes.map((poste, index) => (
            <div key={index} className="p-4 bg-white border-2 border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">Poste #{index + 1}</span>
                {postesOccupes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePoste(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`poste-intitule-${index}`}>Intitulé du poste *</Label>
                  <Input
                    id={`poste-intitule-${index}`}
                    value={poste.intitule}
                    onChange={(e) => handlePosteChange(index, 'intitule', e.target.value)}
                    placeholder="Agent d'entretien bâtiments"
                    className="mt-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`poste-debut-${index}`}>Du *</Label>
                    <Input
                      id={`poste-debut-${index}`}
                      type="date"
                      value={poste.dateDebut}
                      onChange={(e) => handlePosteChange(index, 'dateDebut', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`poste-fin-${index}`}>Au *</Label>
                    <Input
                      id={`poste-fin-${index}`}
                      value={poste.dateFin}
                      onChange={(e) => handlePosteChange(index, 'dateFin', e.target.value)}
                      placeholder="2012-01-31 ou 'En poste'"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={handleAddPoste}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un poste
          </Button>
        </CardContent>
      </Card>

      {/* Section spécifique: Attestation Intermédiaire */}
      {type === 'intermediaire' && (
        <Card className="border-2 border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-6 w-6" />
              Détails de l'exposition
            </CardTitle>
            <CardDescription>
              Informations spécifiques à l'attestation d'exposition intermédiaire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label className="mb-3 block">Produits ou procédés potentiellement utilisés *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {produitsDisponibles.map((produit) => (
                  <div key={produit} className="flex items-start gap-2 p-3 bg-white border rounded-lg">
                    <Checkbox
                      id={`produit-${produit}`}
                      checked={produitsUtilises.includes(produit)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProduitsUtilises([...produitsUtilises, produit]);
                        } else {
                          setProduitsUtilises(produitsUtilises.filter(p => p !== produit));
                        }
                      }}
                      className="mt-1"
                    />
                    <Label htmlFor={`produit-${produit}`} className="text-sm cursor-pointer flex-1">
                      {produit}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Label htmlFor="autresProduits">Autres (à préciser)</Label>
                <Input
                  id="autresProduits"
                  value={autresProduits}
                  onChange={(e) => setAutresProduits(e.target.value)}
                  placeholder="Précisez d'autres produits ou procédés..."
                  className="mt-2"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="compositionProduits">Composition des produits susceptibles d'avoir été utilisés *</Label>
              <Textarea
                id="compositionProduits"
                value={compositionProduits}
                onChange={(e) => setCompositionProduits(e.target.value)}
                placeholder="Ex: Fibrociment (plaques ondulées, canalisations), peintures contenant des fibres d'amiante..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="mesuresPrevention">Mesures de prévention mises en œuvre (Collective, EPI)</Label>
              <Textarea
                id="mesuresPrevention"
                value={mesuresPrevention}
                onChange={(e) => setMesuresPrevention(e.target.value)}
                placeholder="Ex: Port d'équipements de protection individuelle (masques FFP3, combinaisons jetables), ventilation des locaux..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="evaluationExposition">Évaluation et mesures des niveaux d'exposition</Label>
              <Textarea
                id="evaluationExposition"
                value={evaluationExposition}
                onChange={(e) => setEvaluationExposition(e.target.value)}
                placeholder="Ex: Exposition intermittente : 1 à plusieurs fois par mois. Durée d'exposition estimée : 4-6 heures par mois..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                <strong>Fréquences :</strong> occasionnelle (1x/an), intermittente (1x/mois), fréquente (1x/semaine), permanente (1x/jour)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section spécifique: Attestation de Présence */}
      {type === 'presence' && (
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-6 w-6" />
              Périodes de présence *
            </CardTitle>
            <CardDescription>
              Périodes pendant lesquelles l'agent était présent dans des lieux contenant ou ayant contenu de l'amiante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {periodesPresence.map((periode, index) => (
              <div key={index} className="p-4 bg-white border-2 border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">Période #{index + 1}</span>
                  {periodesPresence.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePeriode(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`periode-batiments-${index}`}>Bâtiments/Locaux *</Label>
                    <Input
                      id={`periode-batiments-${index}`}
                      value={periode.batiments}
                      onChange={(e) => handlePeriodeChange(index, 'batiments', e.target.value)}
                      placeholder="Navires étrangers et du pavillon, atelier et chantier naval"
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`periode-debut-${index}`}>Du (MM/AAAA) *</Label>
                      <Input
                        id={`periode-debut-${index}`}
                        value={periode.dateDebut}
                        onChange={(e) => handlePeriodeChange(index, 'dateDebut', e.target.value)}
                        placeholder="01/02/2012"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`periode-fin-${index}`}>Au (MM/AAAA) *</Label>
                      <Input
                        id={`periode-fin-${index}`}
                        value={periode.dateFin}
                        onChange={(e) => handlePeriodeChange(index, 'dateFin', e.target.value)}
                        placeholder="En poste à ce jour"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`periode-origine-${index}`}>Origine de la suspicion de contamination *</Label>
                    <Textarea
                      id={`periode-origine-${index}`}
                      value={periode.origineContamination}
                      onChange={(e) => handlePeriodeChange(index, 'origineContamination', e.target.value)}
                      placeholder="Ex: DTA mentionnant la présence de faux-plafonds amiantés en cours de dégradation..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={handleAddPeriode}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une période
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer la déclaration
        </Button>
      </div>
    </div>
  );
}
