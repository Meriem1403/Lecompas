import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Ship,
  Lock,
  Save,
  Edit,
  FileText,
  Shield,
  Fish,
  CheckCircle2,
} from 'lucide-react';
import { FishingZone } from '../FishermanView';
import { toast } from 'sonner';

interface AccountManagementProps {
  currentUserName: string;
  onBack: () => void;
}

export function AccountManagement({ currentUserName, onBack }: AccountManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Account info
  const [firstName, setFirstName] = useState('Jean');
  const [lastName, setLastName] = useState('Dupont');
  const [email, setEmail] = useState('jean.dupont@email.fr');
  const [birthDate, setBirthDate] = useState('1985-06-15');
  const [address, setAddress] = useState('123 Avenue de la Mer');
  const [zipCode, setZipCode] = useState('13008');
  const [city, setCity] = useState('Marseille');
  const [phone, setPhone] = useState('06 12 34 56 78');
  
  // Fishing preferences
  const [role, setRole] = useState<'fisher' | 'scientist' | 'manager'>('fisher');
  const [favoriteZone, setFavoriteZone] = useState<FishingZone>('calanques');
  const [fishingType, setFishingType] = useState('Pêche récréative');
  const [federationMember, setFederationMember] = useState(true);
  const [federationName, setFederationName] = useState('Fédération de Pêche des Bouches-du-Rhône');
  
  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const zoneNames: Record<FishingZone, string> = {
    golfe_lion: 'Golfe du Lion',
    calanques: 'Parc des Calanques',
    bonifacio: 'Bouches de Bonifacio',
    cap_corse: 'Cap Corse et Agriate',
    cerbere_banyuls: 'Cerbère-Banyuls',
    mediterranee: 'Méditerranée',
  };

  const handleSaveProfile = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('Les champs nom, prénom et email sont obligatoires');
      return;
    }
    
    toast.success('Profil mis à jour avec succès');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    toast.success('Mot de passe modifié avec succès');
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <User className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent break-words">
                Mon compte
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos informations personnelles et vos préférences
              </p>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600">Autorisations</p>
                  <p className="text-2xl font-bold text-green-900">3 actives</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <Fish className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600">Captures déclarées</p>
                  <p className="text-2xl font-bold text-blue-900">127</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Ship className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600">Sorties</p>
                  <p className="text-2xl font-bold text-purple-900">42 cette année</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information */}
        <Card className="shadow-xl border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 border-b-2 border-blue-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-blue-900">
                  <User className="h-7 w-7" />
                  Informations personnelles
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Vos coordonnées et informations de contact
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Nom
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birthDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Date de naissance
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={!isEditing}
                className="mt-1.5 border-2 hover:border-blue-300"
              />
            </div>

            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Adresse
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isEditing}
                placeholder="N° et nom de rue"
                className="mt-1.5 border-2 hover:border-blue-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">Code postal</Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1.5 border-2 hover:border-blue-300"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fishing Preferences */}
        <Card className="shadow-xl border-2 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-100 to-teal-100 border-b-2 border-cyan-200">
            <CardTitle className="flex items-center gap-3 text-cyan-900">
              <Fish className="h-7 w-7" />
              Préférences de pêche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <Label className="mb-3 block">Rôle</Label>
              <RadioGroup
                value={role}
                onValueChange={(value: any) => setRole(value)}
                className="space-y-3"
              >
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === 'fisher'
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-600 text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-cyan-300'
                }`}>
                  <RadioGroupItem value="fisher" id="fisher" className="sr-only" />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    role === 'fisher' ? 'border-white' : 'border-gray-400'
                  }`}>
                    {role === 'fisher' && <div className="h-3 w-3 rounded-full bg-white" />}
                  </div>
                  <Fish className="h-5 w-5" />
                  <span className="font-semibold">Pêcheur</span>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === 'scientist'
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-600 text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-cyan-300'
                }`}>
                  <RadioGroupItem value="scientist" id="scientist" className="sr-only" />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    role === 'scientist' ? 'border-white' : 'border-gray-400'
                  }`}>
                    {role === 'scientist' && <div className="h-3 w-3 rounded-full bg-white" />}
                  </div>
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">Scientifique</span>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  role === 'manager'
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-600 border-cyan-600 text-white shadow-lg'
                    : 'bg-white border-gray-300 hover:border-cyan-300'
                }`}>
                  <RadioGroupItem value="manager" id="manager" className="sr-only" />
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    role === 'manager' ? 'border-white' : 'border-gray-400'
                  }`}>
                    {role === 'manager' && <div className="h-3 w-3 rounded-full bg-white" />}
                  </div>
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">Gestionnaire</span>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="favoriteZone">Zone favorite</Label>
              <select
                id="favoriteZone"
                value={favoriteZone}
                onChange={(e) => setFavoriteZone(e.target.value as FishingZone)}
                className="w-full mt-1.5 p-2 border-2 rounded-md hover:border-cyan-300"
              >
                {Object.entries(zoneNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="fishingType">Type de pêche pratiquée</Label>
              <Input
                id="fishingType"
                value={fishingType}
                onChange={(e) => setFishingType(e.target.value)}
                className="mt-1.5 border-2 hover:border-cyan-300"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="federationMember"
                  checked={federationMember}
                  onCheckedChange={(checked: boolean) => setFederationMember(checked)}
                />
                <Label htmlFor="federationMember" className="cursor-pointer">
                  Adhérent à une fédération
                </Label>
              </div>

              {federationMember && (
                <div>
                  <Label htmlFor="federationName">Nom de la fédération</Label>
                  <Input
                    id="federationName"
                    value={federationName}
                    onChange={(e) => setFederationName(e.target.value)}
                    className="mt-1.5 border-2 hover:border-cyan-300"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => toast.success('Préférences enregistrées')}
                className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les préférences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="shadow-xl border-2 border-amber-200">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-amber-900">
                  <Lock className="h-7 w-7" />
                  Sécurité
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Modifier votre mot de passe
                </CardDescription>
              </div>
              {!isChangingPassword && (
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </Button>
              )}
            </div>
          </CardHeader>
          {isChangingPassword && (
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 border-2 hover:border-amber-300"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 border-2 hover:border-amber-300"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 border-2 hover:border-amber-300"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                <Button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleChangePassword}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Modifier le mot de passe
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* RGPD */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-100 to-slate-100 border-b-2 border-gray-200">
            <CardTitle className="flex items-center gap-3 text-gray-900">
              <Shield className="h-7 w-7" />
              Données personnelles (RGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-gray-600">
              Vos données personnelles sont protégées conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="border-2">
                <FileText className="h-4 w-4 mr-2" />
                Télécharger mes données
              </Button>
              <Button variant="outline" className="border-2">
                <FileText className="h-4 w-4 mr-2" />
                Politique de confidentialité
              </Button>
              <Button variant="outline" className="border-2 hover:border-red-300 hover:bg-red-50">
                Supprimer mon compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
