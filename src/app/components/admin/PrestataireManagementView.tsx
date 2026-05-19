import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Trash2,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import { AppUser, Location } from "./UserManagementView";
import { ROLE_PRESTATAIRE } from "@/app/utils/userRoles";

interface PrestataireManagementViewProps {
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  locations: Location[];
  createdByName?: string;
}

type ViewMode = "list" | "view" | "edit" | "create";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">{value}</p>
    </div>
  );
}

function PrestataireForm({
  user,
  locations,
  isEdit,
  onSave,
  onCancel,
}: {
  user: AppUser | null;
  locations: Location[];
  isEdit: boolean;
  onSave: (data: Partial<AppUser> & { password?: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    lastName: user?.lastName ?? "",
    firstName: user?.firstName ?? "",
    email: user?.email ?? "",
    position: user?.position ?? "",
    location: user?.location ?? "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lastName.trim() || !form.email.trim()) {
      toast.error("Nom d'établissement et email obligatoires");
      return;
    }
    if (!isEdit && !form.password.trim()) {
      toast.error("Mot de passe obligatoire pour un nouveau prestataire");
      return;
    }
    onSave({
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim() || "—",
      email: form.email.trim(),
      position: form.position.trim(),
      location: form.location,
      password: form.password.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto min-h-11">
          <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
          Retour
        </Button>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEdit ? "Modifier le prestataire" : "Nouveau prestataire"}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Compte de connexion pour valider les tickets repas (QR code)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lastName">Nom de l'établissement *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Restaurant Le Port"
                  className="min-h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Contact / responsable</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Nom du contact"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email de connexion *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="min-h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe {isEdit ? "(vide = inchangé)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="min-h-11"
                  required={!isEdit}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="position">Téléphone</Label>
                <Input
                  id="position"
                  type="tel"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="04 XX XX XX XX"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lieu *</Label>
                <Select
                  value={form.location}
                  onValueChange={(value) => setForm({ ...form, location: value })}
                  required
                >
                  <SelectTrigger className="bg-white border-2 border-slate-300 min-h-11 w-full">
                    <SelectValue placeholder="Sélectionnez un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.name}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 sm:pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto min-h-11"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto min-h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                {isEdit ? "Enregistrer" : "Créer le prestataire"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function PrestataireCard({
  prestataire,
  onView,
  onEdit,
  onDelete,
}: {
  prestataire: AppUser;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-l-4 border-l-teal-500 shadow-md hover:shadow-lg transition-shadow bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base sm:text-lg leading-tight break-words">
              {prestataire.lastName}
            </h4>
            {prestataire.firstName && prestataire.firstName !== "—" && (
              <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0" />
                {prestataire.firstName}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <p className="flex items-start gap-2 text-gray-700 min-w-0">
            <Mail className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <span className="break-all">{prestataire.email}</span>
          </p>
          <p className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="break-words">{prestataire.location}</span>
          </p>
          {prestataire.position && (
            <p className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-teal-600 shrink-0" />
              {prestataire.position}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <Button
            size="sm"
            onClick={onView}
            className="w-full min-h-10 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Eye className="h-4 w-4 mr-1.5 shrink-0" />
            Voir
          </Button>
          <Button
            size="sm"
            onClick={onEdit}
            className="w-full min-h-10 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="h-4 w-4 mr-1.5 shrink-0" />
            Modifier
          </Button>
          <Button
            size="sm"
            onClick={onDelete}
            className="w-full min-h-10 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PrestataireManagementView({
  users,
  setUsers,
  locations,
  createdByName = "Administrateur",
}: PrestataireManagementViewProps) {
  const prestataires = useMemo(
    () => users.filter((u) => u.role === ROLE_PRESTATAIRE),
    [users],
  );

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);

  const listTotalPages = Math.max(1, Math.ceil(prestataires.length / TABLE_LIST_PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (listPage - 1) * TABLE_LIST_PAGE_SIZE;
    return prestataires.slice(start, start + TABLE_LIST_PAGE_SIZE);
  }, [prestataires, listPage]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages, prestataires.length]);

  const handleBack = () => {
    setViewMode("list");
    setSelected(null);
  };

  const handleSave = (data: Partial<AppUser> & { password?: string }) => {
    if (viewMode === "create") {
      const newUser: AppUser = {
        id: crypto.randomUUID(),
        firstName: data.firstName || "—",
        lastName: data.lastName || "",
        email: data.email || "",
        position: data.position || "",
        service: "Prestataire",
        domain: "—",
        location: data.location || "",
        category: "Prestataire",
        role: ROLE_PRESTATAIRE,
        password: data.password,
        createdAt: new Date().toISOString(),
        createdBy: createdByName,
      };
      setUsers([...users, newUser]);
      toast.success("Prestataire créé — connexion possible avec email et mot de passe");
    } else if (viewMode === "edit" && selected) {
      setUsers(
        users.map((u) =>
          u.id === selected.id
            ? {
                ...u,
                ...data,
                role: ROLE_PRESTATAIRE,
                service: "Prestataire",
                category: "Prestataire",
                password: data.password?.trim() ? data.password : u.password,
              }
            : u,
        ),
      );
      toast.success("Prestataire modifié");
    }
    handleBack();
  };

  if (viewMode === "view" && selected) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto min-h-11 shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                {selected.lastName}
              </h3>
              <p className="text-sm text-gray-600">Fiche prestataire</p>
            </div>
          </div>
          <Button
            onClick={() => setViewMode("edit")}
            className="w-full sm:w-auto min-h-11 bg-gradient-to-r from-teal-600 to-emerald-600 shrink-0"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <DetailField label="Établissement" value={selected.lastName} />
            <DetailField label="Contact" value={selected.firstName} />
            <DetailField label="Email" value={selected.email} />
            <DetailField label="Téléphone" value={selected.position || "—"} />
            <DetailField label="Lieu" value={selected.location} />
            <DetailField
              label="Créé le"
              value={new Date(selected.createdAt).toLocaleDateString("fr-FR")}
            />
            <div className="sm:col-span-2">
              <DetailField label="Créé par" value={selected.createdBy} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === "create" || viewMode === "edit") {
    return (
      <PrestataireForm
        user={selected}
        locations={locations}
        isEdit={viewMode === "edit"}
        onSave={handleSave}
        onCancel={handleBack}
      />
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7 text-teal-600 shrink-0" />
              Prestataires repas
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Comptes autorisés à scanner et valider les tickets repas des agents
            </p>
            <Badge variant="outline" className="mt-2 border-teal-200 text-teal-800 bg-teal-50">
              {prestataires.length} prestataire{prestataires.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <Button
            onClick={() => {
              setSelected(null);
              setViewMode("create");
            }}
            className="w-full lg:w-auto min-h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg shrink-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau prestataire
          </Button>
        </div>

        {paginated.length === 0 ? (
          <Card className="border-2 border-dashed border-teal-200 bg-teal-50/50">
            <CardContent className="py-10 sm:py-14 px-4 text-center">
              <UtensilsCrossed className="h-12 w-12 text-teal-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Aucun prestataire enregistré</p>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Créez un compte pour permettre la validation des tickets repas par QR code.
              </p>
              <Button
                className="mt-6 w-full sm:w-auto min-h-11 bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  setSelected(null);
                  setViewMode("create");
                }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer le premier prestataire
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile / tablette : cartes */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {paginated.map((p) => (
                <PrestataireCard
                  key={p.id}
                  prestataire={p}
                  onView={() => {
                    setSelected(p);
                    setViewMode("view");
                  }}
                  onEdit={() => {
                    setSelected(p);
                    setViewMode("edit");
                  }}
                  onDelete={() => {
                    setUserToDelete(p.id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>

            {/* Desktop : tableau */}
            <Card className="hidden lg:block border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-teal-50 to-emerald-50">
                    <tr>
                      <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                        Établissement
                      </th>
                      <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                        Email
                      </th>
                      <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                        Lieu
                      </th>
                      <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                        Contact
                      </th>
                      <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-teal-50/40">
                        <td className="px-4 xl:px-6 py-4 font-medium max-w-[200px] break-words">
                          {p.lastName}
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-gray-600 max-w-[220px] break-all text-sm">
                          {p.email}
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {p.location}
                          </span>
                        </td>
                        <td className="px-4 xl:px-6 py-4 text-gray-600">{p.firstName}</td>
                        <td className="px-4 xl:px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelected(p);
                                setViewMode("view");
                              }}
                              className="bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelected(p);
                                setViewMode("edit");
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setUserToDelete(p.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
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
              </CardContent>
            </Card>
          </>
        )}

        {prestataires.length > 0 && (
          <ListPaginationBar
            currentPage={listPage}
            totalPages={listTotalPages}
            totalItems={prestataires.length}
            onPageChange={setListPage}
            itemLabel="prestataire(s)"
          />
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce prestataire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte ne pourra plus se connecter ni valider de tickets. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto mt-0">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  setUsers(users.filter((u) => u.id !== userToDelete));
                  toast.success("Prestataire supprimé");
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
