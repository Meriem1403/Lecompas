import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
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
import { PlusCircle, Edit, Trash2, ArrowLeft, Building2, Layers, MapPin, Tag, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleEntity {
  id: string;
  name: string;
  services?: string[];
}

interface SimpleEntityManagementViewProps {
  title: string;
  description: string;
  items: SimpleEntity[];
  setItems: React.Dispatch<React.SetStateAction<SimpleEntity[]>>;
  icon: LucideIcon;
  color: string;
  gradient: string;
  hasServices?: boolean;
  availableServices?: string[];
  protectedNames?: string[];
  protectedLabel?: string;
}

type ViewMode = 'list' | 'edit' | 'create';

export function SimpleEntityManagementView({ 
  title,
  description,
  items, 
  setItems,
  icon: Icon,
  color,
  gradient,
  hasServices = false,
  availableServices = [],
  protectedNames = [],
  protectedLabel = 'service',
}: SimpleEntityManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<SimpleEntity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleEdit = (item: SimpleEntity) => {
    setSelectedItem(item);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setViewMode('create');
  };

  const handleDelete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (protectedNames.includes(item.name)) {
      toast.error(
        `Impossible de supprimer "${item.name}" : cet élément est déjà utilisé par au moins un ${protectedLabel}.`,
      );
      return;
    }

    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(i => i.id !== itemToDelete));
      toast.success(`${title.split(' ')[2]} supprimé avec succès`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  const handleSave = (itemData: Partial<SimpleEntity>) => {
    if (viewMode === 'create') {
      const newItem: SimpleEntity = {
        id: (Math.max(...items.map(i => parseInt(i.id)), 0) + 1).toString(),
        name: itemData.name || '',
        ...(hasServices ? { services: itemData.services || [] } : {})
      };
      setItems([...items, newItem]);
      toast.success(`${title.split(' ')[2]} créé avec succès`);
    } else if (viewMode === 'edit' && selectedItem) {
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ...itemData } : i));
      toast.success(`${title.split(' ')[2]} modifié avec succès`);
    }
    handleBack();
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
            <Button 
              onClick={handleCreate} 
              className={`bg-gradient-to-r ${gradient} shadow-lg`}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur group">
                <CardHeader>
                  <div className="flex flex-col items-center text-center">
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradient.split(' ').slice(1).join(' ')} flex items-center justify-center shadow-lg mb-3`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {hasServices && item.services && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Services ({item.services.length})</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {item.services.slice(0, 2).map((service, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {item.services.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.services.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(item)} 
                      className={`flex-1 bg-gradient-to-r ${gradient} text-white shadow-md hover:shadow-lg transition-all`}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> 
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDelete(item.id)} 
                      disabled={protectedNames.includes(item.name)}
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
                Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
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
    return <EntityFormView 
      item={selectedItem} 
      onSave={handleSave} 
      onCancel={handleBack}
      isEdit={viewMode === 'edit'}
      title={title}
      gradient={gradient}
      hasServices={hasServices}
      availableServices={availableServices}
    />;
  }

  return null;
}

function EntityFormView({ 
  item, 
  onSave, 
  onCancel,
  isEdit,
  title,
  gradient,
  hasServices,
  availableServices,
}: { 
  item: SimpleEntity | null; 
  onSave: (item: Partial<SimpleEntity>) => void; 
  onCancel: () => void;
  isEdit: boolean;
  title: string;
  gradient: string;
  hasServices: boolean;
  availableServices: string[];
}) {
  const [formData, setFormData] = useState<Partial<SimpleEntity>>(item || { services: [] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleService = (serviceName: string) => {
    const selectedServices = formData.services || [];
    const nextServices = selectedServices.includes(serviceName)
      ? selectedServices.filter((service) => service !== serviceName)
      : [...selectedServices, serviceName];
    setFormData({ ...formData, services: nextServices });
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
            {isEdit ? `Modifier - ${title}` : `Nouveau - ${title}`}
          </h3>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les informations' : 'Créez un nouvel élément'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {hasServices && (
              <div className="space-y-2">
                <Label>Services concernés</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableServices.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Crée d'abord au moins un service dans l'onglet Services.
                    </p>
                  )}
                  {availableServices.map((serviceName) => {
                    const selected = (formData.services || []).includes(serviceName);
                    return (
                      <Button
                        key={serviceName}
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => toggleService(serviceName)}
                        className={selected ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : ""}
                      >
                        {serviceName}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button 
                type="submit"
                className={`bg-gradient-to-r ${gradient}`}
              >
                {isEdit ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
