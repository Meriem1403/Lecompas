import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Building2, PlusCircle, Edit, Trash2, ArrowLeft, Check, X, Layers, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/app/components/ui/separator';

export interface Service {
  id: string;
  name: string;
  active: boolean;
  domains: string[];
  locations: string[];
}

interface ServiceManagementViewProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

type ViewMode = 'list' | 'edit' | 'create';

export function ServiceManagementView({ services, setServices }: ServiceManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setSelectedService(null);
    setViewMode('create');
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      setServices(services.filter(s => s.id !== serviceToDelete));
      toast.success('Service supprimé avec succès');
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedService(null);
  };

  const handleSave = (serviceData: Partial<Service>) => {
    if (viewMode === 'create') {
      const newService: Service = {
        id: (Math.max(...services.map(s => parseInt(s.id)), 0) + 1).toString(),
        name: serviceData.name || '',
        active: serviceData.active ?? true,
        domains: serviceData.domains || [],
        locations: serviceData.locations || []
      };
      setServices([...services, newService]);
      toast.success('Service créé avec succès');
    } else if (viewMode === 'edit' && selectedService) {
      setServices(services.map(s => s.id === selectedService.id ? { ...s, ...serviceData } : s));
      toast.success('Service modifié avec succès');
    }
    handleBack();
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Gestion des Services</h3>
              <p className="text-gray-600">Gérez les services de votre organisation</p>
            </div>
            <Button 
              onClick={handleCreate} 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-12 w-12 rounded-xl ${service.active ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-400'} flex items-center justify-center shadow-lg`}>
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <Badge variant={service.active ? "default" : "secondary"} className={service.active ? "bg-green-500" : ""}>
                          {service.active ? <><Check className="h-3 w-3 mr-1" /> Actif</> : <><X className="h-3 w-3 mr-1" /> Inactif</>}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center">
                        <Layers className="h-3 w-3 mr-1" /> Domaines ({service.domains.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.domains.slice(0, 3).map((domain, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {domain}
                          </Badge>
                        ))}
                        {service.domains.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.domains.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" /> Lieux ({service.locations.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.locations.slice(0, 3).map((location, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {location}
                          </Badge>
                        ))}
                        {service.locations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.locations.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(service)} 
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> 
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDelete(service.id)} 
                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (viewMode === 'edit' || viewMode === 'create') {
    return <ServiceFormView 
      service={selectedService} 
      onSave={handleSave} 
      onCancel={handleBack}
      isEdit={viewMode === 'edit'}
    />;
  }

  return null;
}

function ServiceFormView({ 
  service, 
  onSave, 
  onCancel,
  isEdit 
}: { 
  service: Service | null; 
  onSave: (service: Partial<Service>) => void; 
  onCancel: () => void;
  isEdit: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Service>>(service || { active: true, domains: [], locations: [] });
  const [domainInput, setDomainInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addDomain = () => {
    if (domainInput.trim()) {
      setFormData({ ...formData, domains: [...(formData.domains || []), domainInput.trim()] });
      setDomainInput('');
    }
  };

  const removeDomain = (index: number) => {
    setFormData({ ...formData, domains: (formData.domains || []).filter((_, i) => i !== index) });
  };

  const addLocation = () => {
    if (locationInput.trim()) {
      setFormData({ ...formData, locations: [...(formData.locations || []), locationInput.trim()] });
      setLocationInput('');
    }
  };

  const removeLocation = (index: number) => {
    setFormData({ ...formData, locations: (formData.locations || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier le service' : 'Nouveau service'}
          </h3>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les informations du service' : 'Créez un nouveau service'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du service *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Service actif</Label>
            </div>

            <div className="space-y-2">
              <Label>Domaines</Label>
              <div className="flex space-x-2">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="Ajouter un domaine"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                />
                <Button type="button" onClick={addDomain} variant="outline">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.domains || []).map((domain, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {domain}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeDomain(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lieux</Label>
              <div className="flex space-x-2">
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Ajouter un lieu"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                />
                <Button type="button" onClick={addLocation} variant="outline">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(formData.locations || []).map((location, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {location}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeLocation(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isEdit ? 'Enregistrer les modifications' : 'Créer le service'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
