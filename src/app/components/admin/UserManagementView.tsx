import React, { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
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
import { User, PlusCircle, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  service: string;
  domain: string;
  location: string;
  category: string;
  role: string;
  createdAt: string;
  createdBy: string;
}

export interface Role {
  id: number;
  code: string;
  displayName: string;
}

export interface Service {
  id: string;
  name: string;
}

export interface Domain {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

interface UserManagementViewProps {
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  roles: Role[];
  services: Service[];
  domains: Domain[];
  locations: Location[];
  categories: Category[];
}

type ViewMode = 'list' | 'view' | 'edit' | 'create';

export function UserManagementView({ 
  users, 
  setUsers, 
  roles, 
  services, 
  domains, 
  locations, 
  categories 
}: UserManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleView = (user: AppUser) => {
    setSelectedUser(user);
    setViewMode('view');
  };

  const handleEdit = (user: AppUser) => {
    setSelectedUser(user);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setViewMode('create');
  };

  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete));
      toast.success('Utilisateur supprimé avec succès');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedUser(null);
  };

  const handleSave = (userData: Partial<AppUser>) => {
    if (viewMode === 'create') {
      const newUser: AppUser = {
        id: (Math.max(...users.map(u => parseInt(u.id)), 0) + 1).toString(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        position: userData.position || '',
        service: userData.service || '',
        domain: userData.domain || '',
        location: userData.location || '',
        category: userData.category || '',
        role: userData.role || '',
        createdAt: new Date().toISOString(),
        createdBy: 'Système'
      };
      setUsers([...users, newUser]);
      toast.success('Utilisateur créé avec succès');
    } else if (viewMode === 'edit' && selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...userData } : u));
      toast.success('Utilisateur modifié avec succès');
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
              <h3 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h3>
              <p className="text-gray-600">Gérez les utilisateurs et leurs accès</p>
            </div>
            <Button 
              onClick={handleCreate} 
              className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1450px]">
                  <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prénom</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Poste</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Domaine</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lieu</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rôle</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Créé le</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Créé par</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.service}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.domain}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                            {roles.find(r => r.code === user.role)?.displayName || user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.createdBy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleView(user)} 
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Voir
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleEdit(user)} 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Modifier
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleDelete(user.id)} 
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
                Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
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
  if (viewMode === 'view' && selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Détail de l'utilisateur</h3>
              <p className="text-gray-600">{selectedUser.firstName} {selectedUser.lastName}</p>
            </div>
          </div>
          <Button 
            onClick={() => handleEdit(selectedUser)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Prénom</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.firstName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Nom</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Email</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Poste</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.position}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Service</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.service}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Domaine</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.domain}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Lieu</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.location}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Catégorie</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.category}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Rôle</p>
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-base px-4 py-2">
                  {roles.find(r => r.code === selectedUser.role)?.displayName || selectedUser.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">Date de création</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-500 mb-2">Créé par</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.createdBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue édition/création
  if ((viewMode === 'edit' || viewMode === 'create')) {
    return <UserFormView 
      user={selectedUser} 
      onSave={handleSave} 
      onCancel={handleBack}
      roles={roles}
      services={services}
      domains={domains}
      locations={locations}
      categories={categories}
      isEdit={viewMode === 'edit'}
    />;
  }

  return null;
}

// Formulaire d'édition/création
function UserFormView({ 
  user, 
  onSave, 
  onCancel, 
  roles, 
  services, 
  domains, 
  locations, 
  categories,
  isEdit 
}: { 
  user: AppUser | null; 
  onSave: (user: Partial<AppUser>) => void; 
  onCancel: () => void;
  roles: Role[];
  services: Service[];
  domains: Domain[];
  locations: Location[];
  categories: Category[];
  isEdit: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AppUser>>(user || {});

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
            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <p className="text-gray-600">
            {isEdit ? 'Modifiez les informations de l\'utilisateur' : 'Remplissez les informations du nouvel utilisateur'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-4 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Poste *</Label>
                <Input
                  id="position"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={formData.service || ''}
                  onValueChange={(value) => setFormData({ ...formData, service: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Sélectionnez un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.name}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domaine *</Label>
                <Select
                  value={formData.domain || ''}
                  onValueChange={(value) => setFormData({ ...formData, domain: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Sélectionnez un domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(domain => (
                      <SelectItem key={domain.id} value={domain.name}>{domain.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lieu *</Label>
                <Select
                  value={formData.location || ''}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Sélectionnez un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.name}>{location.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select
                  value={formData.role || ''}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-2 border-slate-300">
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.code}>{role.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button 
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 whitespace-normal text-center h-auto py-2"
              >
                {isEdit ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
