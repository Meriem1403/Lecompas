import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Separator } from '@/app/components/ui/separator';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  ArrowLeft,
  FileText,
  Users,
  Building2,
  MapPin,
  Paperclip,
  X,
  Upload,
  CalendarCheck,
  CheckCircle,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  nom: string;
  type: string;
  url: string;
  taille: string;
}

interface Lien {
  id: string;
  titre: string;
  url: string;
}

interface Actualite {
  id: string;
  titre: string;
  contenu: string;
  type: 'info' | 'alerte' | 'urgent' | 'maintenance' | 'evenement' | 'document';
  auteur: string;
  dateCreation: string;
  dateExpiration?: string;
  dateEvenement?: string;
  heureDebut?: string;
  heureFin?: string;
  lieuEvenement?: string;
  imageUrl?: string;
  documents?: Document[];
  liens?: Lien[];
  destinataires: {
    roles: string[];
    services: string[];
    domaines: string[];
    lieux: string[];
    categories: string[];
  };
  estPublie: boolean;
  vuesPar: string[];
}

interface ActualiteFormPageProps {
  actualite?: Actualite;
  onBack: () => void;
  onSubmit: (actualite: Actualite) => void;
}

const mockServices = ['Direction', 'Service Affaires Maritimes', 'Service Formation', 'Service Administratif', 'Service Technique'];
const mockDomaines = ['Maritime', 'Administratif', 'Technique', 'Formation'];
const mockLieux = ['Siège Marseille', 'Port de Marseille', 'Port de Toulon', 'Antenne Nice'];
const mockCategories = ['Risques physiques', 'Risques chimiques', 'Risques biologiques', 'Risques psychosociaux'];

export function ActualiteFormPage({ actualite, onBack, onSubmit }: ActualiteFormPageProps) {
  const isEdit = !!actualite;

  const [formData, setFormData] = useState({
    titre: actualite?.titre || '',
    contenu: actualite?.contenu || '',
    type: actualite?.type || ('info' as 'info' | 'alerte' | 'urgent' | 'maintenance' | 'evenement' | 'document'),
    dateExpiration: actualite?.dateExpiration || '',
    dateEvenement: actualite?.dateEvenement || '',
    heureDebut: actualite?.heureDebut || '',
    heureFin: actualite?.heureFin || '',
    lieuEvenement: actualite?.lieuEvenement || '',
    imageUrl: actualite?.imageUrl || '',
  });

  const [documents, setDocuments] = useState<Document[]>(actualite?.documents || []);
  const [newDocument, setNewDocument] = useState({ nom: '', type: '', taille: '' });

  const [liens, setLiens] = useState<Lien[]>(actualite?.liens || []);
  const [newLien, setNewLien] = useState({ titre: '', url: '' });

  const [destinataires, setDestinataires] = useState({
    roles: actualite?.destinataires.roles || ([] as string[]),
    services: actualite?.destinataires.services || ([] as string[]),
    domaines: actualite?.destinataires.domaines || ([] as string[]),
    lieux: actualite?.destinataires.lieux || ([] as string[]),
    categories: actualite?.destinataires.categories || ([] as string[]),
  });

  const handleToggleRole = (role: string) => {
    setDestinataires((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleToggleService = (service: string) => {
    setDestinataires((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleToggleLieu = (lieu: string) => {
    setDestinataires((prev) => ({
      ...prev,
      lieux: prev.lieux.includes(lieu)
        ? prev.lieux.filter((l) => l !== lieu)
        : [...prev.lieux, lieu],
    }));
  };

  const handleAddDocument = () => {
    if (!newDocument.nom.trim()) {
      toast.error('Veuillez saisir un nom de document');
      return;
    }
    const doc: Document = {
      id: `doc${Date.now()}`,
      nom: newDocument.nom,
      type: newDocument.type || 'pdf',
      url: '#',
      taille: newDocument.taille || '0 KB',
    };
    setDocuments([...documents, doc]);
    setNewDocument({ nom: '', type: '', taille: '' });
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const handleAddLien = () => {
    if (!newLien.titre.trim() || !newLien.url.trim()) {
      toast.error('Veuillez remplir le titre et l\'URL du lien');
      return;
    }
    const lien: Lien = {
      id: `lien${Date.now()}`,
      titre: newLien.titre,
      url: newLien.url,
    };
    setLiens([...liens, lien]);
    setNewLien({ titre: '', url: '' });
  };

  const handleRemoveLien = (id: string) => {
    setLiens(liens.filter((l) => l.id !== id));
  };

  const handleSubmit = () => {
    if (!formData.titre.trim() || !formData.contenu.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (destinataires.roles.length === 0) {
      toast.error('Veuillez sélectionner au moins un rôle destinataire');
      return;
    }

    const newActualite: Actualite = {
      id: actualite?.id || `a${Date.now()}`,
      ...formData,
      auteur: actualite?.auteur || 'Admin Système',
      dateCreation: actualite?.dateCreation || new Date().toISOString().split('T')[0],
      dateExpiration: formData.dateExpiration || undefined,
      dateEvenement: formData.dateEvenement || undefined,
      heureDebut: formData.heureDebut || undefined,
      heureFin: formData.heureFin || undefined,
      lieuEvenement: formData.lieuEvenement || undefined,
      imageUrl: formData.imageUrl || undefined,
      documents: documents.length > 0 ? documents : undefined,
      liens: liens.length > 0 ? liens : undefined,
      destinataires,
      estPublie: true,
      vuesPar: actualite?.vuesPar || [],
    };

    onSubmit(newActualite);
    toast.success(isEdit ? 'Actualité modifiée avec succès' : 'Actualité publiée avec succès');
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Modifier l\'actualité' : 'Nouvelle actualité'}</h1>
          <p className="text-gray-600 mt-1">
            Publiez une information, un événement ou un document à destination des utilisateurs
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-base font-semibold">Type d'actualité *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="h-12 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Information</SelectItem>
                  <SelectItem value="alerte">⚠️ Alerte</SelectItem>
                  <SelectItem value="urgent">🚨 Urgent</SelectItem>
                  <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                  <SelectItem value="evenement">📅 Événement</SelectItem>
                  <SelectItem value="document">📄 Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Informations générales */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Informations générales
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="titre">Titre *</Label>
                  <Input
                    id="titre"
                    placeholder="Titre de l'actualité"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="contenu">Contenu *</Label>
                  <Textarea
                    id="contenu"
                    placeholder="Décrivez l'actualité en détail..."
                    rows={6}
                    value={formData.contenu}
                    onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateExpiration">Date d'expiration (optionnel)</Label>
                  <Input
                    id="dateExpiration"
                    type="date"
                    value={formData.dateExpiration}
                    onChange={(e) =>
                      setFormData({ ...formData, dateExpiration: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL de l'image (optionnel)</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://exemple.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Champs spécifiques aux événements */}
            {formData.type === 'evenement' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-green-600" />
                    Informations de l'événement
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateEvenement">Date de l'événement</Label>
                      <Input
                        id="dateEvenement"
                        type="date"
                        value={formData.dateEvenement}
                        onChange={(e) =>
                          setFormData({ ...formData, dateEvenement: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heureDebut">Heure de début</Label>
                      <Input
                        id="heureDebut"
                        type="time"
                        value={formData.heureDebut}
                        onChange={(e) =>
                          setFormData({ ...formData, heureDebut: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heureFin">Heure de fin</Label>
                      <Input
                        id="heureFin"
                        type="time"
                        value={formData.heureFin}
                        onChange={(e) =>
                          setFormData({ ...formData, heureFin: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2 col-span-3">
                      <Label htmlFor="lieuEvenement">Lieu</Label>
                      <Input
                        id="lieuEvenement"
                        placeholder="Ex: Salle de conférence - Bâtiment A"
                        value={formData.lieuEvenement}
                        onChange={(e) =>
                          setFormData({ ...formData, lieuEvenement: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Liens */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                Liens utiles
              </h4>

              {liens.length > 0 && (
                <div className="space-y-2">
                  {liens.map((lien) => (
                    <div
                      key={lien.id}
                      className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{lien.titre}</p>
                          <p className="text-sm text-blue-600 hover:underline">
                            <a href={lien.url} target="_blank" rel="noopener noreferrer">
                              {lien.url}
                            </a>
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleRemoveLien(lien.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Titre du lien"
                  value={newLien.titre}
                  onChange={(e) =>
                    setNewLien({ ...newLien, titre: e.target.value })
                  }
                />
                <Input
                  placeholder="URL (https://...)"
                  value={newLien.url}
                  onChange={(e) =>
                    setNewLien({ ...newLien, url: e.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddLien}
                className="w-full border-2 border-dashed border-blue-300 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un lien
              </Button>
            </div>

            {/* Documents */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-cyan-600" />
                Documents joints
              </h4>

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-cyan-50 border-2 border-cyan-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-cyan-600" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.nom}</p>
                          <p className="text-sm text-gray-500">
                            {doc.type.toUpperCase()} • {doc.taille}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleRemoveDocument(doc.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Input
                    placeholder="Nom du document"
                    value={newDocument.nom}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, nom: e.target.value })
                    }
                  />
                </div>
                <Input
                  placeholder="Type (pdf, doc...)"
                  value={newDocument.type}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, type: e.target.value })
                  }
                />
                <Input
                  placeholder="Taille (ex: 2 MB)"
                  value={newDocument.taille}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, taille: e.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDocument}
                className="w-full border-2 border-dashed"
              >
                <Upload className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </div>

            <Separator />

            {/* Destinataires */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Destinataires *
              </h4>

              {/* Rôles */}
              <div className="space-y-2">
                <Label className="font-medium">Rôles</Label>
                <div className="flex flex-wrap gap-3">
                  {['admin', 'chef_service', 'agent'].map((role) => (
                    <div key={role} className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={destinataires.roles.includes(role)}
                        onCheckedChange={() => handleToggleRole(role)}
                      />
                      <Label htmlFor={`role-${role}`} className="cursor-pointer font-medium">
                        {role === 'admin'
                          ? 'Administrateurs'
                          : role === 'chef_service'
                          ? 'Chefs de service'
                          : 'Agents'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Services (optionnel)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {mockServices.map((service) => (
                    <div key={service} className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg border">
                      <Checkbox
                        id={`service-${service}`}
                        checked={destinataires.services.includes(service)}
                        onCheckedChange={() => handleToggleService(service)}
                      />
                      <Label htmlFor={`service-${service}`} className="cursor-pointer text-sm">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lieux */}
              <div className="space-y-2">
                <Label className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lieux (optionnel)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {mockLieux.map((lieu) => (
                    <div key={lieu} className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-lg border">
                      <Checkbox
                        id={`lieu-${lieu}`}
                        checked={destinataires.lieux.includes(lieu)}
                        onCheckedChange={() => handleToggleLieu(lieu)}
                      />
                      <Label htmlFor={`lieu-${lieu}`} className="cursor-pointer text-sm">
                        {lieu}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isEdit ? 'Enregistrer' : 'Publier'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
