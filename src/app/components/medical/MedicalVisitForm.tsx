import React, { useMemo, useRef, useState } from 'react';
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
  Target,
  Upload,
  FileText,
  Bell,
} from 'lucide-react';
import { MedicalVisit, Risk } from '../MedicalVisitsView';
import { AppUser } from '@/app/components/admin/UserManagementView';
import { resolveEmployeeForVisit, sortUsersForSelect } from './medicalVisitUserMatch';
import { readFileAsVisitReport, type MedicalVisitReportFile } from './medicalVisitReportFile';
import { toast } from 'sonner';

const SELECT_NONE = '__none__';

interface MedicalVisitFormProps {
  medicalVisit?: MedicalVisit;
  users: AppUser[];
  risks: Risk[];
  onSave: (visit: MedicalVisit) => void;
  onCancel: () => void;
}

export function MedicalVisitForm({ medicalVisit, users, risks, onSave, onCancel }: MedicalVisitFormProps) {
  const sortedUsers = useMemo(() => sortUsersForSelect(users), [users]);
  const initialEmployee = useMemo(
    () => resolveEmployeeForVisit(users, medicalVisit),
    [users, medicalVisit],
  );

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    () => initialEmployee?.id ?? '',
  );

  const [sexe, setSexe] = useState<'M' | 'F'>(medicalVisit?.sexe || 'M');
  const [nom, setNom] = useState(initialEmployee?.lastName ?? medicalVisit?.nom ?? '');
  const [prenom, setPrenom] = useState(initialEmployee?.firstName ?? medicalVisit?.prenom ?? '');
  const [statutMilitaire, setStatutMilitaire] = useState<'Militaire' | 'Civil'>(medicalVisit?.statutMilitaire || 'Civil');

  const [domaine, setDomaine] = useState(
    initialEmployee?.domain ?? medicalVisit?.domaine ?? '',
  );
  const [lieu, setLieu] = useState(
    initialEmployee?.location ?? medicalVisit?.lieu ?? '',
  );
  const [service, setService] = useState(
    initialEmployee?.service ?? medicalVisit?.service ?? '',
  );

  const applyEmployee = (emp: AppUser) => {
    setSelectedEmployeeId(emp.id);
    setNom(emp.lastName);
    setPrenom(emp.firstName);
    setService(emp.service || '');
    setDomaine(emp.domain || '');
    setLieu(emp.location || '');
  };

  const clearEmployeeFields = () => {
    setSelectedEmployeeId('');
    setNom('');
    setPrenom('');
    setService('');
    setDomaine('');
    setLieu('');
  };

  const onAgentSelect = (value: string) => {
    if (value === SELECT_NONE) {
      clearEmployeeFields();
      return;
    }
    const emp = users.find((u) => u.id === value);
    if (emp) applyEmployee(emp);
  };

  // Visites médicales
  const [derniereVisiteMedicale, setDerniereVisiteMedicale] = useState(medicalVisit?.derniereVisiteMedicale || '');
  const [prochaineVisiteMedicale, setProchaineVisiteMedicale] = useState(medicalVisit?.prochaineVisiteMedicale || '');
  const [surveillanceMedicaleAnnee, setSurveillanceMedicaleAnnee] = useState(medicalVisit?.surveillanceMedicaleAnnee?.toString() || '');

  // Aménagements
  const [amenagementPoste, setAmenagementPoste] = useState(medicalVisit?.amenagementPoste || '');
  const [surveillanceParticuliere, setSurveillanceParticuliere] = useState(medicalVisit?.surveillanceParticuliere || '');
  
  // Risques - Selection multiple
  const [selectedRisks, setSelectedRisks] = useState<string[]>(medicalVisit?.risquesExposition || []);

  const [compteRenduVisite, setCompteRenduVisite] = useState<MedicalVisitReportFile | undefined>(
    () => medicalVisit?.compteRenduVisite,
  );
  const compteRenduInputRef = useRef<HTMLInputElement | null>(null);

  const [prevenirConseillerPrevention, setPrevenirConseillerPrevention] = useState(
    () => Boolean(medicalVisit?.prevenirConseillerPrevention),
  );
  const [prevenirSecretaireGeneral, setPrevenirSecretaireGeneral] = useState(
    () => Boolean(medicalVisit?.prevenirSecretaireGeneral),
  );

  const handleSave = () => {
    if (!selectedEmployeeId) {
      toast.error('Sélectionnez un agent dans la liste (annuaire Utilisateurs).');
      return;
    }
    const employee = users.find((u) => u.id === selectedEmployeeId);
    if (!employee) {
      toast.error('Agent introuvable dans l\'annuaire.');
      return;
    }
    const nomValue = employee.lastName.trim();
    const prenomValue = employee.firstName.trim();
    if (!nomValue || !prenomValue) {
      toast.error('L\'agent sélectionné doit avoir un nom et un prénom dans l\'annuaire.');
      return;
    }

    const newVisit: MedicalVisit = {
      id: medicalVisit?.id || Date.now().toString(),
      
      // Informations personnelles
      sexe,
      nom: nomValue,
      prenom: prenomValue,
      statutMilitaire,
      
      employeeId: selectedEmployeeId,

      // Informations administratives (calées sur l'annuaire)
      domaine: (employee.domain || '').trim() || undefined,
      lieu: (employee.location || '').trim() || undefined,
      service: (employee.service || '').trim() || undefined,
      
      // Visites médicales
      derniereVisiteMedicale: derniereVisiteMedicale || undefined,
      prochaineVisiteMedicale: prochaineVisiteMedicale || undefined,
      surveillanceMedicaleAnnee: surveillanceMedicaleAnnee ? parseFloat(surveillanceMedicaleAnnee) : undefined,
      compteRenduVisite: compteRenduVisite?.dataUrl ? compteRenduVisite : undefined,
      prevenirConseillerPrevention,
      prevenirSecretaireGeneral,
      
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
  };

  const onCompteRenduFiles = (files: FileList | null) => {
    if (!files?.length) return;
    readFileAsVisitReport(files[0]).then((doc) => {
      if (!doc.dataUrl) {
        toast.error('Impossible de lire le fichier.');
        return;
      }
      setCompteRenduVisite(doc);
      toast.success('Compte rendu joint.');
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">
              {medicalVisit ? `Modifier ${medicalVisit.prenom} ${medicalVisit.nom}` : 'Nouvel Agent - Suivi Médical'}
            </h1>
            <p className="text-gray-600 mt-1">
              {medicalVisit ? 'Modifiez les informations du suivi médical' : 'Remplissez toutes les informations de l\'agent'}
            </p>
          </div>
          <div className="flex justify-end shrink-0">
            <Button variant="outline" size="default" onClick={onCancel} className="w-full sm:w-auto font-semibold shadow-sm border-2 border-gray-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:flex-wrap pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
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
            Choisissez un agent dans l&apos;annuaire (Administration → Utilisateurs). Le nom, le prénom et l&apos;affectation se remplissent automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="agentSelect" className="text-base">Agent *</Label>
            <Select
              value={selectedEmployeeId || SELECT_NONE}
              onValueChange={onAgentSelect}
              disabled={sortedUsers.length === 0}
            >
              <SelectTrigger id="agentSelect" className="mt-1">
                <SelectValue placeholder="Sélectionner un agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_NONE}>— Choisir un agent —</SelectItem>
                {sortedUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {`${u.lastName.toUpperCase()} ${u.firstName}`} · {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sortedUsers.length === 0 ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Aucun utilisateur dans l&apos;annuaire. Ajoutez des utilisateurs dans <strong>Administration</strong> → <strong>Utilisateurs</strong>.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Source : liste des utilisateurs (champs service, domaine, lieu renseignés sur la fiche utilisateur).
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom" className="text-base">Nom</Label>
              <Input
                id="nom"
                readOnly
                value={nom}
                placeholder="—"
                className="mt-1 bg-slate-50 uppercase"
              />
            </div>
            <div>
              <Label htmlFor="prenom" className="text-base">Prénom</Label>
              <Input
                id="prenom"
                readOnly
                value={prenom}
                placeholder="—"
                className="mt-1 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <p className="text-xs text-gray-500 mt-1">À titre indicatif pour le suivi médical</p>
            </div>
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
            Ces champs proviennent de la fiche utilisateur sélectionnée (non modifiables ici).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="domaine" className="text-base">Domaine</Label>
              <Input
                id="domaine"
                readOnly
                value={domaine}
                placeholder="—"
                className="mt-1 bg-slate-50"
              />
            </div>
            <div>
              <Label htmlFor="lieu" className="text-base">Lieu</Label>
              <Input
                id="lieu"
                readOnly
                value={lieu}
                placeholder="—"
                className="mt-1 bg-slate-50"
              />
            </div>
            <div>
              <Label htmlFor="service" className="text-base">Service</Label>
              <Input
                id="service"
                readOnly
                value={service}
                placeholder="—"
                className="mt-1 bg-slate-50"
              />
            </div>
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

          <div className="space-y-3 rounded-lg border border-green-200 bg-green-50/60 p-4">
            <div>
              <Label className="text-base">Joindre le compte rendu de la visite</Label>
              <p className="text-xs text-green-900/80 mt-1">
                Document issu de la visite médicale (compte rendu, avis du médecin, PDF ou scan).
              </p>
            </div>
            <input
              ref={compteRenduInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.PDF,image/jpeg,image/png,image/webp,.doc,.docx,application/msword"
              onChange={(e) => {
                onCompteRenduFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-green-300 bg-white"
                onClick={() => compteRenduInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {compteRenduVisite?.dataUrl ? "Remplacer le fichier" : "Joindre le compte rendu"}
              </Button>
              {compteRenduVisite?.name ? (
                <div className="flex flex-1 flex-wrap items-center gap-2 text-sm text-gray-800 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-green-700" />
                  <span className="truncate font-medium">{compteRenduVisite.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setCompteRenduVisite(undefined);
                      toast.success("Fichier retiré.");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Retirer
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Bell className="h-5 w-5 text-teal-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-teal-950">Transmission — interlocuteurs</p>
                <p className="text-xs text-teal-900/85 mt-1">
                  Cochez les destinataires à prévenir. Le choix est enregistré sur la fiche (envoi réel selon vos process internes).
                </p>
              </div>
            </div>
            <div className="space-y-3 pl-0 sm:pl-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="prevenir-conseiller-prevention"
                  checked={prevenirConseillerPrevention}
                  onCheckedChange={(c) => setPrevenirConseillerPrevention(c === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="prevenir-conseiller-prevention" className="text-sm font-normal cursor-pointer leading-snug">
                  Prévenir le <span className="font-semibold">conseiller de prévention</span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="prevenir-secretaire-general"
                  checked={prevenirSecretaireGeneral}
                  onCheckedChange={(c) => setPrevenirSecretaireGeneral(c === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="prevenir-secretaire-general" className="text-sm font-normal cursor-pointer leading-snug">
                  Prévenir le <span className="font-semibold">secrétaire général</span>
                </Label>
              </div>
            </div>
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