import React, { useState, useMemo, useEffect } from 'react';
import { useLeaveGuard } from '@/app/components/leaveGuard';
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
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';
import { AccessPermissionRow } from '@/app/components/access-management/AccessPermissionRow';
import { ACCESS_MODULES, CRUD_LABELS } from '@/app/components/access-management/constants';
import {
  accessExtentSummary,
  normalizeModulePermissions,
  permissionsForPreset,
  presetForRoleCode,
  type ModulePermissions,
} from '@/app/components/access-management/roleAccess';
import { blankActions, seatLabel, workflowActionsFor } from '@/app/components/access-management/workflowActions';

export interface Role {
  id: number;
  code: string;
  displayName: string;
  /** Même matrice que Gestion des accès : visibilité, CRUD et actions de circuit. */
  modulePermissions?: ModulePermissions;
}

interface RoleManagementViewProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  /** Recopie la matrice du rôle sur les agents qui portent ce code. */
  onApplyRoleAccess?: (role: Role) => void;
}

function withAccess(role: Role): Role & { modulePermissions: ModulePermissions } {
  return {
    ...role,
    modulePermissions: normalizeModulePermissions(role.code, role.modulePermissions),
  };
}

type ViewMode = 'list' | 'view' | 'edit' | 'create';

export function RoleManagementView({ roles, setRoles, onApplyRoleAccess }: RoleManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [listPage, setListPage] = useState(1);

  const listPageSize = TABLE_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(1, Math.ceil(roles.length / listPageSize));
  const paginatedRoles = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return roles.slice(start, start + listPageSize);
  }, [roles, listPage, listPageSize]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages, roles.length]);

  useEffect(() => {
    const incomplete = roles.some(
      (role) =>
        !role.modulePermissions ||
        ACCESS_MODULES.some((moduleItem) => {
          const permission = role.modulePermissions?.[moduleItem.id];
          if (!permission) return true;
          return workflowActionsFor(moduleItem.id).some((action) => permission.actions?.[action.id] == null);
        }),
    );
    if (!incomplete) return;
    setRoles(roles.map((role) => withAccess(role)));
  }, [roles, setRoles]);

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
    const code = roleData.code || selectedRole?.code || '';
    const saved: Role = withAccess({
      id: selectedRole?.id ?? Math.max(...roles.map((role) => role.id), 0) + 1,
      code,
      displayName: roleData.displayName || selectedRole?.displayName || '',
      modulePermissions: roleData.modulePermissions,
    });
    if (viewMode === 'create') {
      setRoles([...roles, saved]);
      toast.success('Rôle créé. Ses droits sont ceux de la gestion des accès.');
    } else if (viewMode === 'edit' && selectedRole) {
      setRoles(roles.map((role) => (role.id === selectedRole.id ? saved : role)));
      toast.success('Rôle enregistré. Les agents qui ont ce rôle reprennent ces droits.');
    }
    onApplyRoleAccess?.(saved);
    handleBack();
  };

  // Vue liste
  if (viewMode === 'list') {
    return (
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-gray-900">Gestion des rôles</h3>
              <p className="text-gray-600">
                Chaque rôle porte la matrice de Gestion des accès : visibilité, CRUD et actions de circuit. Les personnes désignées se choisissent dans Gestion des accès.
              </p>
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Étendue des accès</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="font-mono bg-gray-100 text-gray-800 border-0">{role.code}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{role.displayName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-violet-800 font-medium">
                          {accessExtentSummary(withAccess(role).modulePermissions)}
                        </td>
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

          <ListPaginationBar
            currentPage={listPage}
            totalPages={listTotalPages}
            totalItems={roles.length}
            onPageChange={setListPage}
            itemLabel="rôle(s)"
          />
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
          <CardContent className="p-8 space-y-6">
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
            <RoleAccessSummary role={withAccess(selectedRole)} />
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
function RoleAccessSummary({ role }: { role: Role & { modulePermissions: ModulePermissions } }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-500">Étendue des accès</p>
        <p className="text-base font-semibold text-violet-800">
          {accessExtentSummary(role.modulePermissions)}
        </p>
        <p className="text-sm text-gray-500">
          Ces cases sont la source de Gestion des accès pour les agents qui ont le rôle {role.displayName}.
        </p>
      </div>
      <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
        {ACCESS_MODULES.map((moduleItem) => {
          const permission = role.modulePermissions[moduleItem.id];
          const crudOn = (Object.keys(CRUD_LABELS) as Array<keyof typeof CRUD_LABELS>).filter(
            (action) => permission?.crud?.[action],
          );
          const circuitOn = workflowActionsFor(moduleItem.id).filter(
            (action) => permission?.actions?.[action.id],
          );
          return (
            <div key={moduleItem.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700">{moduleItem.section}</p>
                  <p className="text-sm font-semibold text-slate-900">{moduleItem.label}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={permission?.canView ? "bg-emerald-100 text-emerald-800 border-0" : "bg-slate-100 text-slate-600 border-0"}>
                    {permission?.canView ? "Visible" : "Masqué"}
                  </Badge>
                  {crudOn.length > 0 ? (
                    crudOn.map((action) => (
                      <Badge key={action} className="bg-violet-100 text-violet-800 border-0">
                        {CRUD_LABELS[action]}
                      </Badge>
                    ))
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600 border-0">Aucun droit CRUD</Badge>
                  )}
                  {circuitOn.map((action) => (
                    <Badge key={action.id} className="bg-amber-100 text-amber-900 border-0">
                      {action.label}
                      {action.seats > 0 ? ` · ${seatLabel(action.seats)}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const requestLeave = useLeaveGuard();
  const [formData, setFormData] = useState<Partial<Role>>(() => {
    if (role) return withAccess(role);
    return {
      code: "",
      displayName: "",
      modulePermissions: permissionsForPreset("agent"),
    };
  });
  const permissions = formData.modulePermissions || permissionsForPreset(presetForRoleCode(formData.code || ""));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" onClick={() => requestLeave(onCancel)} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}
          </h3>
          <p className="text-gray-600">
            {isEdit
              ? 'Le nom et la matrice de modules sont ceux repris dans Gestion des accès.'
              : 'Définissez le nom et l’étendue des modules, identique à Gestion des accès.'}
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
                <p className="text-sm text-gray-500">Nom qui sera affiché dans l'interface et dans Gestion des accès</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Étendue des accès</Label>
                  <p className="text-sm text-gray-500">
                    Même liste que Gestion des accès. Les pastilles ambre sont les actions hors CRUD. Le nombre indique combien de personnes pourront être désignées.
                  </p>
                </div>
                {ACCESS_MODULES.map((moduleItem) => {
                  const permission = permissions[moduleItem.id];
                  return (
                    <AccessPermissionRow
                      key={moduleItem.id}
                      moduleLabel={moduleItem.label}
                      moduleDescription={moduleItem.description}
                      moduleSection={moduleItem.section}
                      canView={permission?.canView ?? false}
                      crud={
                        permission?.crud ?? {
                          create: false,
                          read: false,
                          update: false,
                          delete: false,
                        }
                      }
                      workflowActions={workflowActionsFor(moduleItem.id).map((action) => ({
                        id: action.id,
                        label: action.seats > 0 ? `${action.label} · ${seatLabel(action.seats)}` : action.label,
                        active: Boolean(permission?.actions?.[action.id]),
                      }))}
                      onToggleWorkflow={(actionId) =>
                        setFormData((current) => {
                          const next = current.modulePermissions || permissions;
                          const currentPermission = next[moduleItem.id];
                          return {
                            ...current,
                            modulePermissions: {
                              ...next,
                              [moduleItem.id]: {
                                ...currentPermission,
                                canView: true,
                                actions: {
                                  ...(currentPermission.actions ?? blankActions(moduleItem.id)),
                                  [actionId]: !currentPermission.actions?.[actionId],
                                },
                              },
                            },
                          };
                        })
                      }
                      onToggleView={(checked) =>
                        setFormData((current) => {
                          const next = current.modulePermissions || permissions;
                          const currentPermission = next[moduleItem.id];
                          return {
                            ...current,
                            modulePermissions: {
                              ...next,
                              [moduleItem.id]: {
                                ...currentPermission,
                                canView: checked,
                                crud: checked
                                  ? currentPermission.crud
                                  : { create: false, read: false, update: false, delete: false },
                                actions: checked
                                  ? currentPermission.actions ?? blankActions(moduleItem.id)
                                  : blankActions(moduleItem.id),
                              },
                            },
                          };
                        })
                      }
                      onToggleCrud={(action) =>
                        setFormData((current) => {
                          const next = current.modulePermissions || permissions;
                          const currentPermission = next[moduleItem.id];
                          return {
                            ...current,
                            modulePermissions: {
                              ...next,
                              [moduleItem.id]: {
                                ...currentPermission,
                                canView: true,
                                crud: {
                                  ...currentPermission.crud,
                                  [action]: !currentPermission.crud[action],
                                },
                              },
                            },
                          };
                        })
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => requestLeave(onCancel)} className="w-full sm:w-auto">
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
