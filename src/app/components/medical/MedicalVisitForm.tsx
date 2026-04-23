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
  Briefcase,
  Calendar,
  Activity,
  Shield,
  Stethoscope,
  Users,
  Building2,
  Target
} from 'lucide-react';
import { MedicalVisit, Risk } from '../MedicalVisitsView';
import { toast } from 'sonner';

interface MedicalVisitFormProps {
  medicalVisit?: MedicalVisit;
  risks: Risk[];
  onSave: (visit: MedicalVisit) => void;
  onCancel: () => void;
}

export function MedicalVisitForm({ medicalVisit, risks, onSave, onCancel }: MedicalVisitFormProps) {
  // Informations personnelles
  const [sexe, setSexe] = useState<'M' | 'F'>(medicalVisit?.sexe || 'M');
  const [nom, setNom] = useState(medicalVisit?.nom || '');
  const [prenom, setPrenom] = useState(medicalVisit?.prenom || '');
  const [nombreEnfants, setNombreEnfants] = useState(medicalVisit?.nombreEnfants?.toString() || '');
  const [statutMilitaire, setStatutMilitaire] = useState<'Militaire' | 'Civil'>(medicalVisit?.statutMilitaire || 'Civil');

  // Informations administratives
  const [departement, setDepartement] = useState(medicalVisit?.departement || '');
  const [gradeNNE, setGradeNNE] = useState(medicalVisit?.gradeNNE || '');
  const [libellePoste, setLibellePoste] = useState(medicalVisit?.libellePoste || '');
  const [echelon, setEchelon] = useState(medicalVisit?.echelon || '');
  const [structureDetaillee, setStructureDetaillee] = useState(medicalVisit?.structureDetaillee || '');
  const [service, setService] = useState(medicalVisit?.service || '');
  const [inm, setInm] = useState(medicalVisit?.inm || '');
  const [nombreHeuresRemunerees, setNombreHeuresRemunerees] = useState(medicalVisit?.nombreHeuresRemunerees?.toString() || '');
  const [etpe, setEtpe] = useState(medicalVisit?.etpe?.toString() || '');

  // Visites médicales
  const [derniereVisiteMedicale, setDerniereVisiteMedicale] = useState(medicalVisit?.derniereVisiteMedicale || '');
  const [prochaineVisiteMedicale, setProchaineVisiteMedicale] = useState(medicalVisit?.prochaineVisiteMedicale || '');
  const [surveillanceMedicaleAnnee, setSurveillanceMedicaleAnnee] = useState(medicalVisit?.surveillanceMedicaleAnnee?.toString() || '');

  // Aménagements
  const [amenagementPoste, setAmenagementPoste] = useState(medicalVisit?.amenagementPoste || '');
  const [surveillanceParticuliere, setSurveillanceParticuliere] = useState(medicalVisit?.surveillanceParticuliere || '');
  
  // Risques - Selection multiple
  const [selectedRisks, setSelectedRisks] = useState<string[]>(medicalVisit?.risquesExposition || []);

  const handleSave = () => {
    // Validation
    if (!nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    if (!prenom.trim()) {
      toast.error('Le prénom est obligatoire');
      return;
    }
    if (!departement.trim()) {
      toast.error('Le département est obligatoire');
      return;
    }
    if (!gradeNNE.trim()) {
      toast.error('Le grade est obligatoire');
      return;
    }
    if (!libellePoste.trim()) {
      toast.error('Le libellé de poste est obligatoire');
      return;
    }
    if (!structureDetaillee.trim()) {
      toast.error('La structure détaillée est obligatoire');
      return;
    }

    const newVisit: MedicalVisit = {
      id: medicalVisit?.id || Date.now().toString(),
      
      // Informations personnelles
      sexe,
      nom,
      prenom,
      nombreEnfants: nombreEnfants ? parseInt(nombreEnfants) : undefined,
      statutMilitaire,
      
      // Informations administratives
      departement,
      gradeNNE,
      libellePoste,
      echelon: echelon || undefined,
      structureDetaillee,
      service: service || undefined,
      inm: inm || undefined,
      nombreHeuresRemunerees: nombreHeuresRemunerees ? parseInt(nombreHeuresRemunerees) : undefined,
      etpe: etpe ? parseFloat(etpe) : undefined,
      
      // Visites médicales
      derniereVisiteMedicale: derniereVisiteMedicale || undefined,
      prochaineVisiteMedicale: prochaineVisiteMedicale || undefined,
      surveillanceMedicaleAnnee: surveillanceMedicaleAnnee ? parseFloat(surveillanceMedicaleAnnee) : undefined,
      
      // Aménagements
      amenagementPoste: amenagementPoste || undefined,
      surveillanceParticuliere: surveillanceParticuliere || undefined,
      
      // Risques
      risquesExposition: selectedRisks,
      
      // Statut (sera recalculé automatiquement)
      statut: 'a_jour',
      
      // Métadonnées
      createdBy: medicalVisit?.createdBy || 'Utilisateur actuel',
      createdAt: medicalVisit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newVisit);
    toast.success(medicalVisit ? 'Suivi médical modifié avec succès' : 'Suivi médical créé avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {medicalVisit ? `Modifier ${medicalVisit.prenom} ${medicalVisit.nom}` : 'Nouvel Agent - Suivi Médical'}
            </h1>
            <p className="text-gray-600 mt-1">
              {medicalVisit ? 'Modifiez les informations du suivi médical' : 'Remplissez toutes les informations de l\'agent'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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

      {/* Section 1: Informations Personnelles */}
      <Card className="border-2 border-pink-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="flex items-center gap-2 text-pink-900">
            <User className="h-6 w-6" />
            Informations personnelles
          </CardTitle>
          <CardDescription className="text-pink-700">
            Identité et situation familiale de l'agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="sexe" className="text-base">Sexe *</Label>
              <Select value={sexe} onValueChange={(value) => setSexe(value as 'M' | 'F')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Homme</SelectItem>
                  <SelectItem value="F">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="nom" className="text-base">Nom *</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: MARTIN"
                className="mt-1 uppercase"
              />
            </div>

            <div>
              <Label htmlFor="prenom" className="text-base">Prénom *</Label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Sophie"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nombreEnfants" className="text-base">Nombre d'enfants</Label>
            <Input
              id="nombreEnfants"
              type="number"
              min="0"
              value={nombreEnfants}
              onChange={(e) => setNombreEnfants(e.target.value)}
              placeholder="0"
              className="mt-1 w-full sm:w-40"
            />
            <p className="text-xs text-gray-500 mt-1">Nombre d'enfants à charge</p>
          </div>

          <div>
            <Label htmlFor="statutMilitaire" className="text-base">Statut militaire</Label>
            <Select value={statutMilitaire} onValueChange={(value) => setStatutMilitaire(value as 'Militaire' | 'Civil')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Militaire">Militaire</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Statut militaire de l'agent</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Informations Administratives */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Briefcase className="h-6 w-6" />
            Informations administratives et poste
          </CardTitle>
          <CardDescription className="text-blue-700">
            Grade, poste, structure et données de paie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departement" className="text-base">Département *</Label>
              <Select value={departement} onValueChange={setDepartement}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bouches-du-Rhône (13)">Bouches-du-Rhône (13)</SelectItem>
                  <SelectItem value="Var (83)">Var (83)</SelectItem>
                  <SelectItem value="Alpes-Maritimes (06)">Alpes-Maritimes (06)</SelectItem>
                  <SelectItem value="Corse-du-Sud (2A)">Corse-du-Sud (2A)</SelectItem>
                  <SelectItem value="Haute-Corse (2B)">Haute-Corse (2B)</SelectItem>
                  <SelectItem value="Pyrénées-Orientales (66)">Pyrénées-Orientales (66)</SelectItem>
                  <SelectItem value="Aude (11)">Aude (11)</SelectItem>
                  <SelectItem value="Hérault (34)">Hérault (34)</SelectItem>
                  <SelectItem value="Gard (30)">Gard (30)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="structureDetaillee" className="text-base">Structure détaillée *</Label>
              <Input
                id="structureDetaillee"
                value={structureDetaillee}
                onChange={(e) => setStructureDetaillee(e.target.value)}
                placeholder="Ex: DIRM MED - Service Aménagement Littoral"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gradeNNE" className="text-base">Grade (Libellé NNE) *</Label>
            <Input
              id="gradeNNE"
              value={gradeNNE}
              onChange={(e) => setGradeNNE(e.target.value)}
              placeholder="Ex: Ingénieur des Ponts, des Eaux et des Forêts"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Libellé complet du grade selon nomenclature NNE</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="libellePoste" className="text-base">Libellé de poste *</Label>
              <Input
                id="libellePoste"
                value={libellePoste}
                onChange={(e) => setLibellePoste(e.target.value)}
                placeholder="Ex: Chef du service Aménagement Littoral"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="echelon" className="text-base">Échelon</Label>
              <Input
                id="echelon"
                value={echelon}
                onChange={(e) => setEchelon(e.target.value)}
                placeholder="Ex: HEA, Principal, 2ème classe..."
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="inm" className="text-base">INM</Label>
              <Input
                id="inm"
                value={inm}
                onChange={(e) => setInm(e.target.value)}
                placeholder="Ex: 821"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Indice de rémunération</p>
            </div>

            <div>
              <Label htmlFor="nombreHeuresRemunerees" className="text-base">Heures rémunérées</Label>
              <Input
                id="nombreHeuresRemunerees"
                type="number"
                min="0"
                value={nombreHeuresRemunerees}
                onChange={(e) => setNombreHeuresRemunerees(e.target.value)}
                placeholder="Ex: 1607"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Nombre annuel d'heures</p>
            </div>

            <div>
              <Label htmlFor="etpe" className="text-base">ETPE</Label>
              <Input
                id="etpe"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={etpe}
                onChange={(e) => setEtpe(e.target.value)}
                placeholder="Ex: 1.00"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Équivalent temps plein (0 à 1)</p>
            </div>
          </div>

          <div>
            <Label htmlFor="service" className="text-base">Service</Label>
            <Input
              id="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Ex: Service Aménagement Littoral"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Service auquel appartient l'agent</p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Visites médicales */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Stethoscope className="h-6 w-6" />
            Visites médicales et surveillance
          </CardTitle>
          <CardDescription className="text-green-700">
            Dates des visites et périodicité de la surveillance médicale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="derniereVisite" className="text-base">Dernière visite médicale</Label>
              <Input
                id="derniereVisite"
                type="date"
                value={derniereVisiteMedicale}
                onChange={(e) => setDerniereVisiteMedicale(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Date de la dernière visite effectuée</p>
            </div>

            <div>
              <Label htmlFor="prochaineVisite" className="text-base">Prochaine visite médicale</Label>
              <Input
                id="prochaineVisite"
                type="date"
                value={prochaineVisiteMedicale}
                onChange={(e) => setProchaineVisiteMedicale(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Date prévue de la prochaine visite</p>
            </div>
          </div>

          <div>
            <Label htmlFor="surveillance" className="text-base">Périodicité de la surveillance médicale</Label>
            <Select value={surveillanceMedicaleAnnee} onValueChange={setSurveillanceMedicaleAnnee}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une périodicité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">Semestrielle (6 mois)</SelectItem>
                <SelectItem value="1">Annuelle (1 an)</SelectItem>
                <SelectItem value="2">Biennale (2 ans)</SelectItem>
                <SelectItem value="3">Triennale (3 ans)</SelectItem>
                <SelectItem value="5">Quinquennale (5 ans)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Fréquence réglementaire des visites médicales</p>
          </div>

          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Information</p>
                <p className="text-sm text-blue-800 mt-1">
                  Le statut (À jour, À planifier, En retard, Urgent) est calculé automatiquement en fonction de la date de la prochaine visite médicale.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Aménagements et Surveillance Particulière */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Shield className="h-6 w-6" />
            Aménagements et surveillance particulière
          </CardTitle>
          <CardDescription className="text-purple-700">
            Aménagements de poste, restrictions et surveillance spécifique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label htmlFor="amenagement" className="text-base">Aménagement de poste</Label>
            <Textarea
              id="amenagement"
              value={amenagementPoste}
              onChange={(e) => setAmenagementPoste(e.target.value)}
              placeholder="Ex: Poste de travail ergonomique, télétravail, horaires aménagés, port de charges limité..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Décrivez les aménagements mis en place (saisissez &quot;Aucun&quot; si pas d'aménagement)</p>
          </div>

          <div>
            <Label htmlFor="surveillanceParticuliere" className="text-base">Surveillance particulière</Label>
            <Textarea
              id="surveillanceParticuliere"
              value={surveillanceParticuliere}
              onChange={(e) => setSurveillanceParticuliere(e.target.value)}
              placeholder="Ex: Surveillance renforcée suite à accident de travail, RQTH, invalidité, restriction médicale, temps partiel thérapeutique..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Indiquez toute surveillance particulière : suivi AT (Accident de Travail), invalidité, RQTH (Reconnaissance Qualité Travailleur Handicapé), restrictions médicales...
            </p>
          </div>

          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
            <div className="flex items-start gap-2">
              <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Attention</p>
                <p className="text-sm text-amber-800 mt-1">
                  Les agents avec aménagement de poste ou surveillance particulière doivent faire l'objet d'un suivi médical renforcé. 
                  Pensez à adapter la périodicité des visites médicales en conséquence.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Risques d'exposition */}
      <Card className="border-2 border-red-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <Target className="h-6 w-6" />
            Risques d'exposition
          </CardTitle>
          <CardDescription className="text-red-700">
            Risques auxquels l'agent est exposé dans son poste
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
            {risks.map((risk) => (
              <div key={risk.id} className="flex items-start gap-2 p-3 bg-white border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={`risk-${risk.id}`}
                  checked={selectedRisks.includes(risk.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRisks([...selectedRisks, risk.id]);
                    } else {
                      setSelectedRisks(selectedRisks.filter((r) => r !== risk.id));
                    }
                  }}
                  className="mt-1"
                />
                <Label htmlFor={`risk-${risk.id}`} className="text-sm cursor-pointer flex-1">
                  <span className="font-semibold">{risk.numeroRisque}</span> - {risk.title}
                  <br />
                  <span className="text-xs text-gray-500">{risk.category} • {risk.unite} • {risk.service}</span>
                </Label>
              </div>
            ))}
          </div>
          {selectedRisks.length > 0 && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm font-semibold text-red-900">
                {selectedRisks.length} risque{selectedRisks.length > 1 ? 's' : ''} sélectionné{selectedRisks.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer le suivi médical
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}