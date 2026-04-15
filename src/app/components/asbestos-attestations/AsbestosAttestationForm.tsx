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
  Plus,
  Trash2,
  FileSignature,
  User,
  Briefcase,
  Calendar,
  Shield,
  AlertTriangle,
  Building2,
  Send
} from 'lucide-react';
import { AsbestosAttestation, AttestationType, PosteOccupe, ProduitProcede, PeriodePresence } from '../AsbestosAttestationsView';
import { toast } from 'sonner';

interface AsbestosAttestationFormProps {
  attestation?: AsbestosAttestation;
  currentUserName: string;
  onSave: (attestation: AsbestosAttestation) => void;
  onCancel: () => void;
}

export function AsbestosAttestationForm({ attestation, currentUserName, onSave, onCancel }: AsbestosAttestationFormProps) {
  // Type d'attestation
  const [type, setType] = useState<AttestationType>(attestation?.type || 'intermediaire');
  
  // Informations agent
  const [nom, setNom] = useState(attestation?.nom || '');
  const [prenom, setPrenom] = useState(attestation?.prenom || '');
  const [dateNaissance, setDateNaissance] = useState(attestation?.dateNaissance || '');
  const [numeroSecu, setNumeroSecu] = useState(attestation?.numeroSecu || '');
  const [service, setService] = useState(attestation?.service || 'DIRM Méditerranée');
  const [medecinPrevention, setMedecinPrevention] = useState(attestation?.medecinPrevention || 'Dr. BERNARD');
  
  // Spécifique attestation intermédiaire
  const [postesOccupes, setPostesOccupes] = useState<PosteOccupe[]>(
    attestation?.postesOccupes || [{
      id: `poste-${Date.now()}`,
      intitulePoste: '',
      dateDebut: '',
      dateFin: '',
    }]
  );
  const [produitsProcessus, setProduitsProcessus] = useState<ProduitProcede[]>(
    attestation?.produitsProcessus || [{
      id: `produit-${Date.now()}`,
      produitProcede: '',
      compositionProduits: '',
      mesuresPrevention: '',
      evaluationExposition: '',
    }]
  );
  
  // Spécifique attestation de présence
  const [intitulePoste, setIntitulePoste] = useState(attestation?.intitulePoste || '');
  const [periodesPresence, setPeriodesPresence] = useState<PeriodePresence[]>(
    attestation?.periodesPresence || [{
      id: `periode-${Date.now()}`,
      batimentsLocaux: '',
      dateDebut: '',
      dateFin: '',
      origineSuspicion: '',
    }]
  );

  const handleSave = (asBrouillon: boolean = false) => {
    // Validation commune
    if (!nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    if (!prenom.trim()) {
      toast.error('Le prénom est obligatoire');
      return;
    }
    if (!dateNaissance) {
      toast.error('La date de naissance est obligatoire');
      return;
    }
    if (!numeroSecu || numeroSecu.length !== 5) {
      toast.error('Les 5 premiers chiffres du numéro de sécurité sociale sont obligatoires');
      return;
    }

    // Validation spécifique au type
    if (type === 'intermediaire') {
      const hasValidPoste = postesOccupes.some(p => p.intitulePoste.trim() && p.dateDebut && p.dateFin);
      if (!hasValidPoste) {
        toast.error('Au moins un poste occupé complet est obligatoire');
        return;
      }
      const hasValidProduit = produitsProcessus.some(p => p.produitProcede.trim());
      if (!hasValidProduit) {
        toast.error('Au moins un produit/procédé est obligatoire');
        return;
      }
    } else {
      if (!intitulePoste.trim()) {
        toast.error('L\'intitulé de poste est obligatoire');
        return;
      }
      const hasValidPeriode = periodesPresence.some(p => p.batimentsLocaux.trim() && p.dateDebut && p.dateFin);
      if (!hasValidPeriode) {
        toast.error('Au moins une période de présence complète est obligatoire');
        return;
      }
    }

    const now = new Date().toISOString();
    const newAttestation: AsbestosAttestation = {
      id: attestation?.id || `att-${Date.now()}`,
      type,
      status: asBrouillon ? 'brouillon' : 'en_attente_admin',
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateNaissance,
      numeroSecu,
      service: service.trim(),
      medecinPrevention: medecinPrevention.trim(),
      dateCreation: attestation?.dateCreation || new Date().toISOString().split('T')[0],
      createdBy: attestation?.createdBy || currentUserName,
      createdAt: attestation?.createdAt || now,
      updatedAt: now,
    };

    if (type === 'intermediaire') {
      newAttestation.postesOccupes = postesOccupes.filter(p => p.intitulePoste.trim());
      newAttestation.produitsProcessus = produitsProcessus.filter(p => p.produitProcede.trim());
    } else {
      newAttestation.intitulePoste = intitulePoste.trim();
      newAttestation.periodesPresence = periodesPresence.filter(p => p.batimentsLocaux.trim());
    }

    onSave(newAttestation);
    toast.success(attestation ? 'Attestation modifiée avec succès' : 'Attestation créée avec succès');
  };

  // Gestion des postes occupés
  const addPoste = () => {
    setPostesOccupes([...postesOccupes, {
      id: `poste-${Date.now()}`,
      intitulePoste: '',
      dateDebut: '',
      dateFin: '',
    }]);
  };

  const removePoste = (id: string) => {
    if (postesOccupes.length > 1) {
      setPostesOccupes(postesOccupes.filter(p => p.id !== id));
    }
  };

  const updatePoste = (id: string, field: keyof PosteOccupe, value: string) => {
    setPostesOccupes(postesOccupes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Gestion des produits/procédés
  const addProduit = () => {
    setProduitsProcessus([...produitsProcessus, {
      id: `produit-${Date.now()}`,
      produitProcede: '',
      compositionProduits: '',
      mesuresPrevention: '',
      evaluationExposition: '',
    }]);
  };

  const removeProduit = (id: string) => {
    if (produitsProcessus.length > 1) {
      setProduitsProcessus(produitsProcessus.filter(p => p.id !== id));
    }
  };

  const updateProduit = (id: string, field: keyof ProduitProcede, value: string) => {
    setProduitsProcessus(produitsProcessus.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Gestion des périodes de présence
  const addPeriode = () => {
    setPeriodesPresence([...periodesPresence, {
      id: `periode-${Date.now()}`,
      batimentsLocaux: '',
      dateDebut: '',
      dateFin: '',
      origineSuspicion: '',
    }]);
  };

  const removePeriode = (id: string) => {
    if (periodesPresence.length > 1) {
      setPeriodesPresence(periodesPresence.filter(p => p.id !== id));
    }
  };

  const updatePeriode = (id: string, field: keyof PeriodePresence, value: string) => {
    setPeriodesPresence(periodesPresence.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {attestation ? 'Modifier l\'attestation' : 'Nouvelle attestation d\'exposition à l\'amiante'}
            </h1>
            <p className="text-gray-600 mt-1">
              Complétez tous les champs obligatoires
            </p>
          </div>
        </div>
      </div>

      {/* Type selection */}
      {!attestation && (
        <Card className="border-2 border-amber-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <FileSignature className="h-6 w-6" />
              Type d'attestation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setType('intermediaire')}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  type === 'intermediaire'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    type === 'intermediaire' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                  }`} />
                  <h3 className="font-bold text-gray-900">Attestation intermédiaire</h3>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Exposition antérieure au 31 janvier 2012 ouvrant droit à un suivi post-professionnel
                </p>
              </button>

              <button
                onClick={() => setType('presence')}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  type === 'presence'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-4 w-4 rounded-full border-2 ${
                    type === 'presence' ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                  }`} />
                  <h3 className="font-bold text-gray-900">Attestation de présence</h3>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Présence dans les lieux de travail susceptibles d'avoir été contaminés par de l'amiante
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations agent */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <User className="h-6 w-6" />
            Éléments d'identification de l'agent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value.toUpperCase())}
                placeholder="MARTIN"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Jean"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="dateNaissance">Date de naissance *</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="numeroSecu">N° sécu (5 premiers chiffres) *</Label>
              <Input
                id="numeroSecu"
                value={numeroSecu}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setNumeroSecu(value);
                }}
                placeholder="17503"
                maxLength={5}
                className="mt-1.5"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="service">Service *</Label>
              <Input
                id="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="DIRM Méditerranée"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="medecinPrevention">Médecin de prévention *</Label>
              <Input
                id="medecinPrevention"
                value={medecinPrevention}
                onChange={(e) => setMedecinPrevention(e.target.value)}
                placeholder="Dr. BERNARD"
                className="mt-1.5"
              />
            </div>
          </div>

          {type === 'presence' && (
            <div>
              <Label htmlFor="intitulePoste">Intitulé du poste *</Label>
              <Input
                id="intitulePoste"
                value={intitulePoste}
                onChange={(e) => setIntitulePoste(e.target.value)}
                placeholder="Inspecteur de la navigation"
                className="mt-1.5"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Postes occupés (attestation intermédiaire) */}
      {type === 'intermediaire' && (
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Briefcase className="h-6 w-6" />
              Poste(s) occupé(s)
            </CardTitle>
            <CardDescription>
              Les expositions ont pu être multiples, parfois saisonnières, voire ponctuelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {postesOccupes.map((poste, index) => (
              <div key={poste.id} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Poste #{index + 1}</h4>
                  {postesOccupes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePoste(poste.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Intitulé du poste *</Label>
                    <Input
                      value={poste.intitulePoste}
                      onChange={(e) => updatePoste(poste.id, 'intitulePoste', e.target.value)}
                      placeholder="Technicien maintenance navale"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Du *</Label>
                      <Input
                        type="date"
                        value={poste.dateDebut}
                        onChange={(e) => updatePoste(poste.id, 'dateDebut', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Au *</Label>
                      <Input
                        type="date"
                        value={poste.dateFin}
                        onChange={(e) => updatePoste(poste.id, 'dateFin', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addPoste}
              className="w-full border-2 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un poste
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Produits/procédés (attestation intermédiaire) */}
      {type === 'intermediaire' && (
        <Card className="border-2 border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-6 w-6" />
              Produits ou procédés potentiellement utilisés pour l'Amiante
            </CardTitle>
            <CardDescription>
              Produits ou procédés susceptibles d'avoir été utilisés à ce(s) poste(s) de travail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {produitsProcessus.map((produit, index) => (
              <div key={produit.id} className="p-4 bg-white border-2 border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-red-900">Produit/Procédé #{index + 1}</h4>
                  {produitsProcessus.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduit(produit.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Produit ou procédé *</Label>
                    <Select
                      value={produit.produitProcede}
                      onValueChange={(value) => updateProduit(produit.id, 'produitProcede', value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entretien bâtiments / ouvrages / navires / feux-phares">Entretien bâtiments / ouvrages / navires / feux-phares</SelectItem>
                        <SelectItem value="Fibrociment">Fibrociment</SelectItem>
                        <SelectItem value="Peintures amiantées">Peintures amiantées</SelectItem>
                        <SelectItem value="Mécanique automobile / marine">Mécanique automobile / marine (garnitures de friction)</SelectItem>
                        <SelectItem value="Travail sur / dans locaux floqués">Travail sur / dans locaux floqués</SelectItem>
                        <SelectItem value="Essais de laboratoire sur matériaux amiantés">Essais de laboratoire sur matériaux amiantés</SelectItem>
                        <SelectItem value="Contrôles techniques de véhicules / navires">Contrôles techniques de véhicules / navires</SelectItem>
                        <SelectItem value="Autre">Autre (à préciser)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Composition des produits susceptibles d'avoir été utilisés</Label>
                    <Textarea
                      value={produit.compositionProduits}
                      onChange={(e) => updateProduit(produit.id, 'compositionProduits', e.target.value)}
                      placeholder="Fibrociment, peintures amiantées..."
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Mesures de prévention mises en oeuvre (Collective, EPI)</Label>
                    <Textarea
                      value={produit.mesuresPrevention}
                      onChange={(e) => updateProduit(produit.id, 'mesuresPrevention', e.target.value)}
                      placeholder="EPI : masque FFP3, combinaison jetable, gants..."
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Évaluation et mesures des niveaux d'exposition</Label>
                    <Select
                      value={produit.evaluationExposition}
                      onValueChange={(value) => updateProduit(produit.id, 'evaluationExposition', value)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Fréquence d'exposition..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Occasionnelle : 1 à plusieurs fois par an">Occasionnelle : 1 à plusieurs fois par an</SelectItem>
                        <SelectItem value="Intermittente : 1 à plusieurs fois par mois">Intermittente : 1 à plusieurs fois par mois</SelectItem>
                        <SelectItem value="Fréquente : 1 à plusieurs fois par semaine">Fréquente : 1 à plusieurs fois par semaine</SelectItem>
                        <SelectItem value="Permanente : 1 à plusieurs fois par jour">Permanente : 1 à plusieurs fois par jour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addProduit}
              className="w-full border-2 border-dashed border-red-300 text-red-700 hover:bg-red-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit/procédé
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Périodes de présence (attestation de présence) */}
      {type === 'presence' && (
        <Card className="border-2 border-teal-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <Building2 className="h-6 w-6" />
              Périodes de présence dans les locaux
            </CardTitle>
            <CardDescription>
              Périodes pendant lesquelles l'agent était présent dans des lieux de travail contenant ou ayant contenu de l'amiante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {periodesPresence.map((periode, index) => (
              <div key={periode.id} className="p-4 bg-white border-2 border-teal-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-teal-900">Période #{index + 1}</h4>
                  {periodesPresence.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePeriode(periode.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Bâtiments / Locaux *</Label>
                    <Input
                      value={periode.batimentsLocaux}
                      onChange={(e) => updatePeriode(periode.id, 'batimentsLocaux', e.target.value)}
                      placeholder="Navires étrangers et du pavillon, atelier et chantier naval"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Du *</Label>
                      <Input
                        type="date"
                        value={periode.dateDebut}
                        onChange={(e) => updatePeriode(periode.id, 'dateDebut', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Au *</Label>
                      <Input
                        type="date"
                        value={periode.dateFin}
                        onChange={(e) => updatePeriode(periode.id, 'dateFin', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Origine de la suspicion de contamination des espaces de travail par de l'amiante *</Label>
                    <Textarea
                      value={periode.origineSuspicion}
                      onChange={(e) => updatePeriode(periode.id, 'origineSuspicion', e.target.value)}
                      placeholder="Ex : Présence possible et avérée dans les locaux des navires du pavillon dans le cadre des inspections..."
                      rows={3}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Éléments évocateurs d'une possible contamination : mention de dégradation de matériaux amiantés dans le DTA, libération accidentelle de poussières lors de travaux...
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addPeriode}
              className="w-full border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une période
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              className="border-gray-400"
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer brouillon
            </Button>
            <Button
              onClick={() => handleSave(false)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Soumettre pour validation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}