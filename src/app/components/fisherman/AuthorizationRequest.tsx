import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Calendar,
  MapPin,
  Ship,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Fish,
  ChevronRight,
} from 'lucide-react';
import { FishingZone, FishingAuthorization } from '../FishermanView';
import { toast } from 'sonner';

interface AuthorizationRequestProps {
  zone: FishingZone;
  currentUserName: string;
  onSave: (authorization: FishingAuthorization) => void;
  onBack: () => void;
  onGoToCapture: () => void;
}

export function AuthorizationRequest({
  zone,
  currentUserName,
  onSave,
  onBack,
  onGoToCapture,
}: AuthorizationRequestProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  
  // Fishing info
  const [boatName, setBoatName] = useState('');
  const [boatRegistration, setBoatRegistration] = useState('');
  const [estimatedTrips, setEstimatedTrips] = useState('');
  const [hasPreviousDeclaration, setHasPreviousDeclaration] = useState<'yes' | 'no' | null>(null);
  const [isNewFisher, setIsNewFisher] = useState(false);
  
  // Consent
  const [regulationAccepted, setRegulationAccepted] = useState(false);

  const zoneNames: Record<FishingZone, string> = {
    golfe_lion: 'Parc naturel marin du Golfe du Lion',
    calanques: 'Parc national des Calanques',
    bonifacio: 'Réserve Naturelle des Bouches de Bonifacio',
    cap_corse: 'Parc naturel marin du Cap Corse et de l\'Agriate',
    cerbere_banyuls: 'RNN Marine de Cerbère-Banyuls',
    mediterranee: 'Méditerranée (hors parc marin réglementé)',
  };

  const handleSubmit = () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Le nom et le prénom sont obligatoires');
      setCurrentStep(1);
      return;
    }

    if (!email.trim() || !emailConfirm.trim()) {
      toast.error('L\'email et sa confirmation sont obligatoires');
      setCurrentStep(1);
      return;
    }

    if (email !== emailConfirm) {
      toast.error('Les emails ne correspondent pas');
      setCurrentStep(1);
      return;
    }

    if (!birthDate) {
      toast.error('La date de naissance est obligatoire');
      setCurrentStep(1);
      return;
    }

    if (!address.trim() || !zipCode.trim() || !city.trim()) {
      toast.error('L\'adresse complète est obligatoire');
      setCurrentStep(1);
      return;
    }

    if (!estimatedTrips || parseInt(estimatedTrips) < 1) {
      toast.error('Le nombre estimé de sorties est obligatoire');
      setCurrentStep(2);
      return;
    }

    if (hasPreviousDeclaration === null) {
      toast.error('Veuillez indiquer si vous avez une déclaration précédente');
      setCurrentStep(2);
      return;
    }

    if (!regulationAccepted) {
      toast.error('Vous devez accepter la réglementation');
      setCurrentStep(3);
      return;
    }

    const newAuthorization: FishingAuthorization = {
      id: `auth-${Date.now()}`,
      userId: currentUserName,
      zone,
      status: 'pending',
      firstName,
      lastName,
      email,
      birthDate,
      address,
      zipCode,
      city,
      boatName: boatName || undefined,
      boatRegistration: boatRegistration || undefined,
      estimatedTrips: parseInt(estimatedTrips),
      hasPreviousDeclaration: hasPreviousDeclaration === 'yes',
      isNewFisher,
      regulationAccepted,
      submittedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newAuthorization);
    toast.success('Demande d\'autorisation envoyée avec succès');
    setCurrentStep(4);
  };

  const steps = [
    { number: 1, title: 'Informations personnelles', icon: User },
    { number: 2, title: 'Informations de pêche', icon: Ship },
    { number: 3, title: 'Réglementation', icon: FileText },
    { number: 4, title: 'Confirmation', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux zones
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Fish className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Demande d'autorisation de pêche
              </h1>
              <p className="text-gray-600 mt-1">
                {zoneNames[zone]}
              </p>
            </div>
          </div>
        </div>

        {/* Zone Badge */}
        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 text-base px-4 py-2">
          <MapPin className="h-4 w-4 mr-2" />
          Zone sélectionnée : {zoneNames[zone]}
        </Badge>

        {/* Progress Steps */}
        <div className="hidden lg:flex justify-between items-center px-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <button
                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                    disabled={step.number > currentStep}
                    className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-lg ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white scale-110 ring-4 ring-cyan-200'
                        : isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-7 w-7" /> : <StepIcon className="h-7 w-7" />}
                  </button>
                  <p className={`text-xs font-semibold text-center max-w-[100px] ${
                    isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
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

        {/* Step 1: Personal Info */}
        {currentStep === 1 && (
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b-2 border-blue-200">
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <User className="h-7 w-7" />
                Étape 1 : Informations personnelles
              </CardTitle>
              <CardDescription className="text-blue-700">
                Toutes les informations sont obligatoires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Prénom <Badge className="bg-red-500 ml-1">*</Badge>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1.5 border-2 hover:border-blue-300"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Nom <Badge className="bg-red-500 ml-1">*</Badge>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1.5 border-2 hover:border-blue-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Email <Badge className="bg-red-500 ml-1">*</Badge>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 border-2 hover:border-blue-300"
                  />
                </div>
                <div>
                  <Label htmlFor="emailConfirm" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Confirmation email <Badge className="bg-red-500 ml-1">*</Badge>
                  </Label>
                  <Input
                    id="emailConfirm"
                    type="email"
                    value={emailConfirm}
                    onChange={(e) => setEmailConfirm(e.target.value)}
                    className="mt-1.5 border-2 hover:border-blue-300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Date de naissance <Badge className="bg-red-500 ml-1">*</Badge>
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Adresse <Badge className="bg-red-500 ml-1">*</Badge>
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="N° et nom de rue"
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">
                    Code postal <Badge className="bg-red-500 ml-1">*</Badge>
                  </Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="mt-1.5 border-2 hover:border-blue-300"
                  />
                </div>
                <div>
                  <Label htmlFor="city">
                    Ville <Badge className="bg-red-500 ml-1">*</Badge>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1.5 border-2 hover:border-blue-300"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                  size="lg"
                >
                  Continuer
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Fishing Info */}
        {currentStep === 2 && (
          <Card className="shadow-xl border-2 border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-100 to-teal-100 border-b-2 border-cyan-200">
              <CardTitle className="flex items-center gap-3 text-cyan-900">
                <Ship className="h-7 w-7" />
                Étape 2 : Informations de pêche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boatName" className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-cyan-600" />
                    Nom du bateau (optionnel)
                  </Label>
                  <Input
                    id="boatName"
                    value={boatName}
                    onChange={(e) => setBoatName(e.target.value)}
                    className="mt-1.5 border-2 hover:border-cyan-300"
                  />
                </div>
                <div>
                  <Label htmlFor="boatRegistration">
                    Immatriculation du bateau (optionnel)
                  </Label>
                  <Input
                    id="boatRegistration"
                    value={boatRegistration}
                    onChange={(e) => setBoatRegistration(e.target.value)}
                    className="mt-1.5 border-2 hover:border-cyan-300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedTrips">
                  Nombre estimé de sorties annuelles <Badge className="bg-red-500 ml-1">*</Badge>
                </Label>
                <Input
                  id="estimatedTrips"
                  type="number"
                  min="1"
                  value={estimatedTrips}
                  onChange={(e) => setEstimatedTrips(e.target.value)}
                  className="mt-1.5 border-2 hover:border-cyan-300"
                />
              </div>

              <div>
                <Label className="mb-3 block">
                  Déclaration de captures de l'année précédente <Badge className="bg-red-500 ml-1">*</Badge>
                </Label>
                <RadioGroup
                  value={hasPreviousDeclaration || ''}
                  onValueChange={(value: any) => setHasPreviousDeclaration(value)}
                  className="space-y-3"
                >
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      hasPreviousDeclaration === 'yes'
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-600 text-white shadow-lg'
                        : 'bg-white border-gray-300 hover:border-cyan-300'
                    }`}
                  >
                    <RadioGroupItem value="yes" id="yes" className="sr-only" />
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      hasPreviousDeclaration === 'yes' ? 'border-white' : 'border-gray-400'
                    }`}>
                      {hasPreviousDeclaration === 'yes' && <div className="h-3 w-3 rounded-full bg-white" />}
                    </div>
                    <span className="font-semibold">Oui, j'ai une déclaration précédente</span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      hasPreviousDeclaration === 'no'
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-600 text-white shadow-lg'
                        : 'bg-white border-gray-300 hover:border-cyan-300'
                    }`}
                  >
                    <RadioGroupItem value="no" id="no" className="sr-only" />
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      hasPreviousDeclaration === 'no' ? 'border-white' : 'border-gray-400'
                    }`}>
                      {hasPreviousDeclaration === 'no' && <div className="h-3 w-3 rounded-full bg-white" />}
                    </div>
                    <span className="font-semibold">Non</span>
                  </label>
                </RadioGroup>

                {hasPreviousDeclaration === 'yes' && (
                  <div className="mt-4">
                    <Button variant="outline" className="w-full border-2 hover:bg-cyan-50">
                      <Upload className="h-4 w-4 mr-2" />
                      Importer la déclaration précédente
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newFisher"
                  checked={isNewFisher}
                  onCheckedChange={(checked: boolean) => setIsNewFisher(checked)}
                />
                <Label htmlFor="newFisher" className="cursor-pointer">
                  Je suis nouveau pêcheur (première demande)
                </Label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
                  size="lg"
                >
                  Continuer
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Regulation */}
        {currentStep === 3 && (
          <Card className="shadow-xl border-2 border-amber-200">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-200">
              <CardTitle className="flex items-center gap-3 text-amber-900">
                <FileText className="h-7 w-7" />
                Étape 3 : Réglementation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Card className="border-2 border-amber-300 bg-amber-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Réglementation de la zone : {zoneNames[zone]}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• La pêche est strictement réglementée dans cette zone protégée</p>
                    <p>• Vous devez déclarer toutes vos captures avant de changer de lieu de pêche</p>
                    <p>• Les espèces protégées ne doivent pas être capturées</p>
                    <p>• Les tailles minimales de capture doivent être respectées</p>
                    <p>• Les quotas de pêche par espèce sont applicables</p>
                    <p>• L'autorisation est personnelle et incessible</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-start space-x-3 p-4 bg-white border-2 border-amber-300 rounded-lg">
                <Checkbox
                  id="regulation"
                  checked={regulationAccepted}
                  onCheckedChange={(checked: boolean) => setRegulationAccepted(checked)}
                />
                <Label htmlFor="regulation" className="cursor-pointer leading-relaxed">
                  <span className="font-semibold">J'ai pris connaissance de la réglementation en vigueur</span>
                  <span className="text-red-600"> *</span> et je m'engage à la respecter. Je comprends que le 
                  non-respect de ces règles peut entraîner des sanctions et le retrait de mon autorisation.
                </Label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!regulationAccepted}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50"
                  size="lg"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Soumettre la demande
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <Card className="shadow-xl border-2 border-green-200">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto flex items-center justify-center shadow-2xl">
                <CheckCircle2 className="h-14 w-14 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-green-900 mb-2">
                  Demande envoyée avec succès !
                </h2>
                <p className="text-gray-600 text-lg">
                  Votre demande d'autorisation a été transmise aux gestionnaires de la zone.
                </p>
              </div>
              
              <Card className="border-2 border-blue-200 bg-blue-50 max-w-md mx-auto">
                <CardContent className="pt-6 text-left">
                  <h3 className="font-bold text-blue-900 mb-3">Prochaines étapes</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>1. Votre demande sera examinée sous 5 à 10 jours ouvrés</p>
                    <p>2. Vous recevrez un email de confirmation à : <strong>{email}</strong></p>
                    <p>3. Une fois approuvée, vous pourrez déclarer vos captures</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full sm:w-auto border-2"
                  size="lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour à l'accueil
                </Button>
                <Button
                  onClick={onGoToCapture}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                  size="lg"
                >
                  <Fish className="h-5 w-5 mr-2" />
                  Déclarer une capture
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}