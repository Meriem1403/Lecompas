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
  availableDomains?: string[];
  availableLocations?: string[];
}

type ViewMode = 'list' | 'edit' | 'create';

export function ServiceManagementView({
  services,
  setServices,
  availableDomains = [],
  availableLocations = [],
}: ServiceManagementViewProps) {
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-gray-900">Gestion des Services</h3>
              <p className="text-gray-600">Gérez les services de votre organisation</p>
            </div>
            <Button 
              onClick={handleCreate} 
              className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
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
                      <div className="min-w-0">
                        <CardTitle className="text-lg break-words">{service.name}</CardTitle>
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(service)} 
                      className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> 
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDelete(service.id)} 
                      className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
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
      availableDomains={availableDomains}
      availableLocations={availableLocations}
    />;
  }

  return null;
}

function ServiceFormView({ 
  service, 
  onSave, 
  onCancel,
  isEdit,
  availableDomains,
  availableLocations,
}: { 
  service: Service | null; 
  onSave: (service: Partial<Service>) => void; 
  onCancel: () => void;
  isEdit: boolean;
  availableDomains: string[];
  availableLocations: string[];
}) {
  const [formData, setFormData] = useState<Partial<Service>>(service || { active: true, domains: [], locations: [] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleDomain = (domain: string) => {
    const selectedDomains = formData.domains || [];
    const nextDomains = selectedDomains.includes(domain)
      ? selectedDomains.filter((item) => item !== domain)
      : [...selectedDomains, domain];
    setFormData({ ...formData, domains: nextDomains });
  };

  const toggleLocation = (location: string) => {
    const selectedLocations = formData.locations || [];
    const nextLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((item) => item !== location)
      : [...selectedLocations, location];
    setFormData({ ...formData, locations: nextLocations });
  };

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
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
          <CardContent className="p-4 sm:p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du service *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Service actif</Label>
            </div>

            <div className="space-y-2">
              <Label>Domaines</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableDomains.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Crée d'abord au moins un domaine dans l'onglet Domaines.
                  </p>
                )}
                {availableDomains.map((domain) => {
                  const selected = (formData.domains || []).includes(domain);
                  return (
                    <Button
                      key={domain}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleDomain(domain)}
                      className={`w-full sm:w-auto whitespace-normal h-auto py-2 ${selected ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : ""}`}
                    >
                      {domain}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lieux</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableLocations.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Crée d'abord au moins un lieu dans l'onglet Lieux.
                  </p>
                )}
                {availableLocations.map((location) => {
                  const selected = (formData.locations || []).includes(location);
                  return (
                    <Button
                      key={location}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleLocation(location)}
                      className={`w-full sm:w-auto whitespace-normal h-auto py-2 ${selected ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white" : ""}`}
                    >
                      {location}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 whitespace-normal text-center h-auto py-2"
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
