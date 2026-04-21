import React, { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
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
import { PlusCircle, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export interface Role {
  id: number;
  code: string;
  displayName: string;
}

interface RoleManagementViewProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
}

type ViewMode = 'list' | 'view' | 'edit' | 'create';

export function RoleManagementView({ roles, setRoles }: RoleManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setViewMode('view');
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setViewMode('create');
  };

  const handleDelete = (id: number) => {
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete !== null) {
      setRoles(roles.filter(r => r.id !== roleToDelete));
      toast.success('Rôle supprimé avec succès');
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedRole(null);
  };

  const handleSave = (roleData: Partial<Role>) => {
    if (viewMode === 'create') {
      const newRole: Role = {
        id: Math.max(...roles.map(r => r.id), 0) + 1,
        code: roleData.code || '',
        displayName: roleData.displayName || ''
      };
      setRoles([...roles, newRole]);
      toast.success('Rôle créé avec succès');
    } else if (viewMode === 'edit' && selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...roleData } : r));
      toast.success('Rôle modifié avec succès');
    }
    handleBack();
  };

  // Vue liste
  if (viewMode === 'list') {
    return (
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-gray-900">Gestion des Rôles</h3>
              <p className="text-gray-600">Gérez les rôles et permissions</p>
            </div>
            <Button 
              onClick={handleCreate} 
              className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau Rôle
            </Button>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nom affiché</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="font-mono bg-gray-100 text-gray-800 border-0">{role.code}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{role.displayName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleView(role)} 
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Voir
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleEdit(role)} 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Modifier
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleDelete(role.id)} 
                              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.
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

  // Vue détail
  if (viewMode === 'view' && selectedRole) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Détail du rôle</h3>
              <p className="text-gray-600">{selectedRole.displayName}</p>
            </div>
          </div>
          <Button 
            onClick={() => handleEdit(selectedRole)}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">ID</p>
                <p className="text-lg font-semibold text-gray-900">{selectedRole.id}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Code</p>
                <Badge className="font-mono bg-gray-100 text-gray-800 border-0 text-base px-3 py-1">
                  {selectedRole.code}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-500 mb-2">Nom affiché</p>
                <p className="text-2xl font-bold text-gray-900">{selectedRole.displayName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue édition/création
  if ((viewMode === 'edit' || viewMode === 'create')) {
    return <RoleFormView 
      role={selectedRole} 
      onSave={handleSave} 
      onCancel={handleBack}
      isEdit={viewMode === 'edit'}
    />;
  }

  return null;
}

// Formulaire d'édition/création
function RoleFormView({ 
  role, 
  onSave, 
  onCancel,
  isEdit 
}: { 
  role: Role | null; 
  onSave: (role: Partial<Role>) => void; 
  onCancel: () => void;
  isEdit: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Role>>(role || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
            {isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}
          </h3>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les informations du rôle' : 'Remplissez les informations du nouveau rôle'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-4 sm:p-8 space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Code du rôle *</Label>
                <Input
                  id="code"
                  className="font-mono bg-white border-2 border-slate-300"
                  placeholder="ROLE_EXEMPLE"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500">Format: ROLE_NOM (en majuscules)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nom affiché *</Label>
                <Input
                  id="displayName"
                  className="bg-white border-2 border-slate-300"
                  placeholder="Exemple"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-500">Nom qui sera affiché dans l'interface</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 whitespace-normal text-center h-auto py-2"
              >
                {isEdit ? 'Enregistrer les modifications' : 'Créer le rôle'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
