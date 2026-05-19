import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
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
import { MapPin, PlusCircle, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import { Location } from "./UserManagementView";

interface LocationManagementViewProps {
  locations: Location[];
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  protectedNames?: string[];
}

type ViewMode = "list" | "edit" | "create";

export function LocationManagementView({
  locations,
  setLocations,
  protectedNames = [],
}: LocationManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Location | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(locations.length / DEFAULT_LIST_PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (listPage - 1) * DEFAULT_LIST_PAGE_SIZE;
    return locations.slice(start, start + DEFAULT_LIST_PAGE_SIZE);
  }, [locations, listPage]);

  useEffect(() => {
    if (listPage > totalPages) setListPage(totalPages);
  }, [listPage, totalPages, locations.length]);

  if (viewMode === "edit" || viewMode === "create") {
    return (
      <LocationForm
        location={selected}
        isEdit={viewMode === "edit"}
        onCancel={() => {
          setViewMode("list");
          setSelected(null);
        }}
        onSave={(data) => {
          if (viewMode === "create") {
            setLocations((prev) => [...prev, { ...data, id: crypto.randomUUID() }]);
            toast.success("Lieu créé");
          } else if (selected) {
            setLocations((prev) =>
              prev.map((l) => (l.id === selected.id ? { ...l, ...data } : l)),
            );
            toast.success("Lieu mis à jour");
          }
          setViewMode("list");
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Gestion des lieux</h3>
          <p className="text-gray-600">
            Sites et localisations — le code région sert au calcul de la subvention ministérielle.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelected(null);
            setViewMode("create");
          }}
          className="w-full lg:w-auto bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nouveau lieu
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((loc) => (
          <Card key={loc.id} className="border shadow-md bg-white/90">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-cyan-700" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg break-words">{loc.name}</CardTitle>
                  {loc.regionCode ? (
                    <Badge className="mt-1 bg-cyan-100 text-cyan-900">
                      Région {loc.regionCode}
                    </Badge>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1">Région non renseignée</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                onClick={() => {
                  setSelected(loc);
                  setViewMode("edit");
                }}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={protectedNames.includes(loc.name)}
                onClick={() => {
                  if (protectedNames.includes(loc.name)) {
                    toast.error("Lieu utilisé par un service");
                    return;
                  }
                  setToDelete(loc.id);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ListPaginationBar
        currentPage={listPage}
        totalPages={totalPages}
        totalItems={locations.length}
        onPageChange={setListPage}
        itemLabel="lieu(x)"
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lieu ?</AlertDialogTitle>
            <AlertDialogDescription>Action irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (toDelete) {
                  setLocations((prev) => prev.filter((l) => l.id !== toDelete));
                  toast.success("Lieu supprimé");
                }
                setDeleteOpen(false);
                setToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LocationForm({
  location,
  isEdit,
  onSave,
  onCancel,
}: {
  location: Location | null;
  isEdit: boolean;
  onSave: (data: Omit<Location, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(location?.name ?? "");
  const [regionCode, setRegionCode] = useState(location?.regionCode ?? "");

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <Button variant="outline" onClick={onCancel} className="w-fit">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-bold">{isEdit ? "Modifier le lieu" : "Nouveau lieu"}</h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              onSave({
                name: name.trim(),
                regionCode: regionCode.trim() || undefined,
                services: location?.services,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="loc-name">Nom du lieu *</Label>
              <Input
                id="loc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-2 border-slate-300"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-region">Code région / département</Label>
              <Input
                id="loc-region"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                placeholder="Ex. 2A, 2B, 13, 34"
                className="bg-white border-2 border-slate-300"
              />
              <p className="text-xs text-gray-500">
                Utilisé pour la subvention ministérielle (barème par zone géographique).
              </p>
            </div>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
