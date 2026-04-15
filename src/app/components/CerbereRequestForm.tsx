import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  ArrowLeft,
  Send,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface CerbereApplication {
  id: string;
  code: string;
  nom: string;
  description: string;
  profils: CerbereProfil[];
}

interface CerbereProfil {
  id: string;
  applicationId: string;
  identifiant: string;
  description: string;
}

interface CerbereRequestFormProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
  applications: CerbereApplication[];
  userRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
}

export function CerbereRequestForm({
  onBack,
  onSubmit,
  applications,
  userRole,
  currentUserName,
}: CerbereRequestFormProps) {
  const [agentConcerne, setAgentConcerne] = useState(
    userRole === 'admin' ? '' : currentUserName
  );
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedProfils, setSelectedProfils] = useState<{
    [key: string]: string[];
  }>({});
  const [reglePortee, setReglePortee] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [justification, setJustification] = useState('');

  const handleApplicationToggle = (appId: string) => {
    if (selectedApplications.includes(appId)) {
      setSelectedApplications(selectedApplications.filter((id) => id !== appId));
      const newProfils = { ...selectedProfils };
      delete newProfils[appId];
      setSelectedProfils(newProfils);
    } else {
      setSelectedApplications([...selectedApplications, appId]);
    }
  };

  const handleProfilToggle = (appId: string, profilId: string) => {
    const currentProfils = selectedProfils[appId] || [];
    if (currentProfils.includes(profilId)) {
      setSelectedProfils({
        ...selectedProfils,
        [appId]: currentProfils.filter((id) => id !== profilId),
      });
    } else {
      setSelectedProfils({
        ...selectedProfils,
        [appId]: [...currentProfils, profilId],
      });
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!agentConcerne.trim()) {
      toast.error('Veuillez indiquer l\'agent concerné');
      return;
    }

    if (selectedApplications.length === 0) {
      toast.error('Veuillez sélectionner au moins une application');
      return;
    }

    const hasAtLeastOneProfil = Object.values(selectedProfils).some(
      (profils) => profils.length > 0
    );
    if (!hasAtLeastOneProfil) {
      toast.error('Veuillez sélectionner au moins un profil');
      return;
    }

    if (!reglePortee.trim()) {
      toast.error('Veuillez indiquer la règle de portée');
      return;
    }

    if (!justification.trim()) {
      toast.error('Veuillez justifier votre demande');
      return;
    }

    // Préparer les données
    const selectedApps = applications.filter((app) =>
      selectedApplications.includes(app.id)
    );
    const appNames = selectedApps.map((app) => app.code);

    const allSelectedProfils: string[] = [];
    Object.entries(selectedProfils).forEach(([appId, profilIds]) => {
      const app = applications.find((a) => a.id === appId);
      if (app) {
        profilIds.forEach((profilId) => {
          const profil = app.profils.find((p) => p.id === profilId);
          if (profil) {
            allSelectedProfils.push(profil.identifiant);
          }
        });
      }
    });

    const requestData = {
      agentConcerne,
      demandeur: currentUserName,
      applications: appNames,
      profils: allSelectedProfils,
      reglePortee,
      restrictions: restrictions || 'Aucune',
      justification,
      soumiseLe: new Date().toISOString().split('T')[0],
      statut: 'en_attente',
    };

    onSubmit(requestData);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="hover:bg-blue-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 px-4 py-2">
          Nouvelle demande d'habilitation
        </Badge>
      </div>

      {/* Formulaire */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Demande d'habilitation Cerbère</CardTitle>
              <CardDescription className="text-base mt-1">
                Formulaire de demande d'accès aux applications
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de l'agent */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Informations de l'agent
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentConcerne">
                  Agent concerné par la demande *
                </Label>
                {userRole === 'admin' ? (
                  <Input
                    id="agentConcerne"
                    placeholder="Nom et prénom de l'agent"
                    value={agentConcerne}
                    onChange={(e) => setAgentConcerne(e.target.value)}
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <p className="font-medium text-gray-900">{agentConcerne}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Demande pour votre propre compte
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Demandeur</Label>
                <div className="p-3 rounded-lg bg-white border border-gray-200">
                  <p className="font-medium text-gray-900">{currentUserName}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sélection des applications et profils */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-indigo-600" />
              Applications et profils demandés *
            </h3>

            {applications.map((app) => (
              <Card
                key={app.id}
                className={`border-2 transition-all ${
                  selectedApplications.includes(app.id)
                    ? 'border-blue-400 bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`app-${app.id}`}
                      checked={selectedApplications.includes(app.id)}
                      onCheckedChange={() => handleApplicationToggle(app.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`app-${app.id}`}
                        className="font-semibold text-gray-900 cursor-pointer"
                      >
                        {app.nom}
                      </label>
                      <Badge variant="outline" className="ml-2">
                        {app.code}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{app.description}</p>

                      {selectedApplications.includes(app.id) && (
                        <div className="mt-4 space-y-2 pl-4 border-l-2 border-blue-300">
                          <p className="text-sm font-semibold text-gray-700">
                            Sélectionnez les profils :
                          </p>
                          {app.profils.map((profil) => (
                            <div key={profil.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`profil-${profil.id}`}
                                checked={
                                  selectedProfils[app.id]?.includes(profil.id) || false
                                }
                                onCheckedChange={() =>
                                  handleProfilToggle(app.id, profil.id)
                                }
                                className="mt-1"
                              />
                              <label
                                htmlFor={`profil-${profil.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                <span className="font-medium text-gray-900">
                                  {profil.identifiant}
                                </span>
                                <p className="text-gray-600">{profil.description}</p>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {selectedApplications.length === 0 && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Sélectionnez au moins une application ci-dessus
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Règles et restrictions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reglePortee">Règle de portée *</Label>
              <Select value={reglePortee} onValueChange={setReglePortee}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la portée des droits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mon service uniquement">
                    Mon service uniquement
                  </SelectItem>
                  <SelectItem value="Tous les services">Tous les services</SelectItem>
                  <SelectItem value="Direction">Direction</SelectItem>
                  <SelectItem value="Service Affaires Maritimes">
                    Service Affaires Maritimes
                  </SelectItem>
                  <SelectItem value="Service Formation">Service Formation</SelectItem>
                  <SelectItem value="Service Administratif">
                    Service Administratif
                  </SelectItem>
                  <SelectItem value="Service Technique">Service Technique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrictions">Restrictions éventuelles</Label>
              <Textarea
                id="restrictions"
                placeholder="Indiquez les restrictions d'accès (optionnel)"
                rows={3}
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Par exemple : accès temporaire, lecture seule, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justification de la demande *</Label>
              <Textarea
                id="justification"
                placeholder="Expliquez pourquoi vous avez besoin de ces accès..."
                rows={4}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Décrivez les missions qui nécessitent ces habilitations
              </p>
            </div>
          </div>

          <Separator />

          {/* Récapitulatif */}
          {selectedApplications.length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                Récapitulatif de votre demande
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Agent concerné :</strong> {agentConcerne || 'Non renseigné'}
                </p>
                <p>
                  <strong>Applications :</strong>{' '}
                  {selectedApplications
                    .map((id) => applications.find((a) => a.id === id)?.code)
                    .join(', ')}
                </p>
                <p>
                  <strong>Nombre de profils :</strong>{' '}
                  {Object.values(selectedProfils).reduce(
                    (acc, profils) => acc + profils.length,
                    0
                  )}
                </p>
                {reglePortee && (
                  <p>
                    <strong>Portée :</strong> {reglePortee}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Soumettre la demande
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
