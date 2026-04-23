import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Mail, 
  Bell, 
  Check, 
  AlertTriangle, 
  Activity,
  FileText,
  Send,
  Users,
  MapPin,
  Building2,
  Tag,
  Shield,
  Save,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export interface NotificationPreference {
  id: string;
  userId: string;
  email: string;
  
  // Canaux de notification
  enableEmail: boolean;
  enableInApp: boolean;
  
  // Types d'événements
  notifyNewRisk: boolean;
  notifyRiskUpdate: boolean;
  notifyNewAccident: boolean;
  notifyAccidentUpdate: boolean;
  notifyNewActuality: boolean;
  notifyActionReturn: boolean;
  notifyActionReturnValidation: boolean;
  notifyCerbereRequest: boolean;
  notifyCerbereValidation: boolean;
  notifyArriveesDeparts: boolean;
  
  // Filtres de ciblage
  filters: {
    roles: string[]; // admin, chef_service, agent
    services: string[];
    domaines: string[];
    lieux: string[];
    categories: string[];
  };
  
  // Fréquence
  frequency: 'immediate' | 'daily' | 'weekly';
  digestTime?: string; // Heure pour les résumés quotidiens/hebdomadaires
}

interface NotificationSettingsProps {
  preferences: NotificationPreference;
  onSave: (preferences: NotificationPreference) => void;
  availableServices: string[];
  availableDomaines: string[];
  availableLieux: string[];
  availableCategories: string[];
}

export function NotificationSettings({
  preferences,
  onSave,
  availableServices,
  availableDomaines,
  availableLieux,
  availableCategories
}: NotificationSettingsProps) {
  const [localPrefs, setLocalPrefs] = useState<NotificationPreference>(preferences);

  const handleSave = () => {
    onSave(localPrefs);
    toast.success('Préférences de notification enregistrées avec succès');
  };

  const toggleFilter = (filterType: keyof NotificationPreference['filters'], value: string) => {
    setLocalPrefs(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: prev.filters[filterType].includes(value)
          ? prev.filters[filterType].filter(v => v !== value)
          : [...prev.filters[filterType], value]
      }
    }));
  };

  const roles = [
    { value: 'admin', label: 'Administrateur', color: 'from-red-500 to-pink-500' },
    { value: 'chef_service', label: 'Chef de Service', color: 'from-blue-500 to-cyan-500' },
    { value: 'agent', label: 'Agent', color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications par Email</h2>
          <p className="text-gray-600">Configurez vos préférences de notification</p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-6 pr-4">
          {/* Email Configuration */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Adresse Email
              </CardTitle>
              <CardDescription>
                L'adresse email où vous recevrez les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Input
                type="email"
                value={localPrefs.email}
                onChange={(e) => setLocalPrefs(prev => ({ ...prev, email: e.target.value }))}
                placeholder="votre.email@mer.gouv.fr"
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Canaux de notification */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Canaux de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enable-email" className="text-base font-semibold">
                    Notifications par Email
                  </Label>
                  <p className="text-sm text-gray-500">
                    Recevoir des emails pour les événements importants
                  </p>
                </div>
                <Switch
                  id="enable-email"
                  checked={localPrefs.enableEmail}
                  onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, enableEmail: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enable-inapp" className="text-base font-semibold">
                    Notifications In-App
                  </Label>
                  <p className="text-sm text-gray-500">
                    Afficher les notifications dans l'application
                  </p>
                </div>
                <Switch
                  id="enable-inapp"
                  checked={localPrefs.enableInApp}
                  onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, enableInApp: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fréquence */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-600" />
                Fréquence des Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant={localPrefs.frequency === 'immediate' ? 'default' : 'outline'}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, frequency: 'immediate' }))}
                  className={`w-full justify-center ${localPrefs.frequency === 'immediate' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Immédiate
                </Button>
                <Button
                  variant={localPrefs.frequency === 'daily' ? 'default' : 'outline'}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, frequency: 'daily' }))}
                  className={`w-full justify-center ${localPrefs.frequency === 'daily' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}`}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Quotidien
                </Button>
                <Button
                  variant={localPrefs.frequency === 'weekly' ? 'default' : 'outline'}
                  onClick={() => setLocalPrefs(prev => ({ ...prev, frequency: 'weekly' }))}
                  className={`w-full justify-center ${localPrefs.frequency === 'weekly' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Hebdomadaire
                </Button>
              </div>

              {(localPrefs.frequency === 'daily' || localPrefs.frequency === 'weekly') && (
                <div className="mt-4">
                  <Label htmlFor="digest-time" className="text-sm font-semibold mb-2 block">
                    Heure d'envoi du résumé
                  </Label>
                  <Input
                    id="digest-time"
                    type="time"
                    value={localPrefs.digestTime || '09:00'}
                    onChange={(e) => setLocalPrefs(prev => ({ ...prev, digestTime: e.target.value }))}
                    className="max-w-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Types d'événements */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Types d'Événements
              </CardTitle>
              <CardDescription>
                Choisissez les événements pour lesquels vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Risques */}
              <div className="space-y-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-bold text-gray-900">Gestion des risques</h4>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-new-risk" className="text-sm">Nouveau risque identifié</Label>
                    <Switch
                      id="notify-new-risk"
                      checked={localPrefs.notifyNewRisk}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyNewRisk: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-risk-update" className="text-sm">Mise à jour d'un risque</Label>
                    <Switch
                      id="notify-risk-update"
                      checked={localPrefs.notifyRiskUpdate}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyRiskUpdate: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-action-return" className="text-sm">Nouveau retour d'action</Label>
                    <Switch
                      id="notify-action-return"
                      checked={localPrefs.notifyActionReturn}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyActionReturn: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-action-validation" className="text-sm">Validation d'un retour d'action</Label>
                    <Switch
                      id="notify-action-validation"
                      checked={localPrefs.notifyActionReturnValidation}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyActionReturnValidation: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Accidents */}
              <div className="space-y-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <h4 className="font-bold text-gray-900">Accidentologie</h4>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-new-accident" className="text-sm">Nouvel accident déclaré</Label>
                    <Switch
                      id="notify-new-accident"
                      checked={localPrefs.notifyNewAccident}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyNewAccident: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-accident-update" className="text-sm">Mise à jour d'un accident</Label>
                    <Switch
                      id="notify-accident-update"
                      checked={localPrefs.notifyAccidentUpdate}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyAccidentUpdate: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Actualités */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h4 className="font-bold text-gray-900">Actualités</h4>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-actuality" className="text-sm">Nouvelle actualité publiée</Label>
                    <Switch
                      id="notify-actuality"
                      checked={localPrefs.notifyNewActuality}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyNewActuality: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Cerbère */}
              <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <h4 className="font-bold text-gray-900">Applications Cerbère</h4>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-cerbere-request" className="text-sm">Nouvelle demande d'habilitation</Label>
                    <Switch
                      id="notify-cerbere-request"
                      checked={localPrefs.notifyCerbereRequest}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyCerbereRequest: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-cerbere-validation" className="text-sm">Validation d'une demande</Label>
                    <Switch
                      id="notify-cerbere-validation"
                      checked={localPrefs.notifyCerbereValidation}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyCerbereValidation: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Arrivées/Départs */}
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <h4 className="font-bold text-gray-900">Arrivées et départs</h4>
                </div>
                <div className="space-y-2 ml-7">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-arrivees-departs" className="text-sm">Nouvelle arrivée ou départ</Label>
                    <Switch
                      id="notify-arrivees-departs"
                      checked={localPrefs.notifyArriveesDeparts}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, notifyArriveesDeparts: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtres de ciblage */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-teal-600" />
                Filtres de Ciblage
              </CardTitle>
              <CardDescription>
                Ne recevoir que les notifications correspondant à certains critères
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Rôles */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-bold">Rôles concernés</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles.map(role => (
                    <Badge
                      key={role.value}
                      onClick={() => toggleFilter('roles', role.value)}
                      className={`cursor-pointer transition-all ${
                        localPrefs.filters.roles.includes(role.value)
                          ? `bg-gradient-to-r ${role.color} text-white border-0`
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {localPrefs.filters.roles.includes(role.value) && <Check className="h-3 w-3 mr-1" />}
                      {role.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Services */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-bold">Services</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableServices.map(service => (
                    <Badge
                      key={service}
                      onClick={() => toggleFilter('services', service)}
                      className={`cursor-pointer transition-all ${
                        localPrefs.filters.services.includes(service)
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {localPrefs.filters.services.includes(service) && <Check className="h-3 w-3 mr-1" />}
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Domaines */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-bold">Domaines</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableDomaines.map(domaine => (
                    <Badge
                      key={domaine}
                      onClick={() => toggleFilter('domaines', domaine)}
                      className={`cursor-pointer transition-all ${
                        localPrefs.filters.domaines.includes(domaine)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {localPrefs.filters.domaines.includes(domaine) && <Check className="h-3 w-3 mr-1" />}
                      {domaine}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Lieux */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-bold">Lieux</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLieux.map(lieu => (
                    <Badge
                      key={lieu}
                      onClick={() => toggleFilter('lieux', lieu)}
                      className={`cursor-pointer transition-all ${
                        localPrefs.filters.lieux.includes(lieu)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {localPrefs.filters.lieux.includes(lieu) && <Check className="h-3 w-3 mr-1" />}
                      {lieu}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Catégories */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-bold">Catégories de Risques</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(category => (
                    <Badge
                      key={category}
                      onClick={() => toggleFilter('categories', category)}
                      className={`cursor-pointer transition-all ${
                        localPrefs.filters.categories.includes(category)
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {localPrefs.filters.categories.includes(category) && <Check className="h-3 w-3 mr-1" />}
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info importante */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Note importante</p>
                  <p>
                    Si aucun filtre n'est sélectionné dans une catégorie, vous recevrez les notifications pour tous les éléments de cette catégorie.
                    Les filtres sont cumulatifs : vous recevrez les notifications correspondant à au moins un des critères sélectionnés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Bouton de sauvegarde fixe */}
      <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 pt-4 pb-2 -mx-6 px-6">
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg"
          size="lg"
        >
          <Save className="h-5 w-5 mr-2" />
          Enregistrer les Préférences
        </Button>
      </div>
    </div>
  );
}