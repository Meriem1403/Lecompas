import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import { PlusCircle, Edit, Trash2, ArrowLeft, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

export interface RiskReference {
  id: string;
  numeroRisque: string;
  title: string;
}

interface RiskReferencesManagementViewProps {
  references: RiskReference[];
  setReferences: React.Dispatch<React.SetStateAction<RiskReference[]>>;
}

type ViewMode = "list" | "create" | "edit";
type SortOption = "numero-asc" | "numero-desc" | "title-asc" | "title-desc";

function compareNumero(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, "fr", { numeric: true });
}

export function RiskReferencesManagementView({
  references,
  setReferences,
}: RiskReferencesManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReference, setSelectedReference] =
    useState<RiskReference | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [referenceToDelete, setReferenceToDelete] = useState<
    string | null
  >(null);

  const [formData, setFormData] = useState({
    numeroRisque: "",
    title: "",
  });
  const [listPage, setListPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [numeroFilter, setNumeroFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("numero-asc");

  const numeroOptions = useMemo(
    () =>
      [...new Set(references.map((ref) => ref.numeroRisque))].sort(compareNumero),
    [references],
  );

  const filteredReferences = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = references.filter((ref) => {
      const matchesSearch =
        !query ||
        ref.numeroRisque.toLowerCase().includes(query) ||
        ref.title.toLowerCase().includes(query);
      const matchesNumero =
        numeroFilter === "all" || ref.numeroRisque === numeroFilter;
      return matchesSearch && matchesNumero;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "numero-desc":
          return compareNumero(b.numeroRisque, a.numeroRisque);
        case "title-asc":
          return a.title.localeCompare(b.title, "fr");
        case "title-desc":
          return b.title.localeCompare(a.title, "fr");
        default:
          return compareNumero(a.numeroRisque, b.numeroRisque);
      }
    });
  }, [references, searchQuery, numeroFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || numeroFilter !== "all" || sortBy !== "numero-asc";

  const resetFilters = () => {
    setSearchQuery("");
    setNumeroFilter("all");
    setSortBy("numero-asc");
    setListPage(1);
  };

  const listPageSize = TABLE_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(
    1,
    Math.ceil(filteredReferences.length / listPageSize),
  );
  const paginatedReferences = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return filteredReferences.slice(start, start + listPageSize);
  }, [filteredReferences, listPage, listPageSize]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages, filteredReferences.length]);

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, numeroFilter, sortBy]);

  const handleCreate = () => {
    setSelectedReference(null);
    setFormData({ numeroRisque: "", title: "" });
    setViewMode("create");
  };

  const handleEdit = (reference: RiskReference) => {
    setSelectedReference(reference);
    setFormData({
      numeroRisque: reference.numeroRisque,
      title: reference.title,
    });
    setViewMode("edit");
  };

  const handleDelete = (id: string) => {
    setReferenceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (referenceToDelete) {
      setReferences(
        references.filter((ref) => ref.id !== referenceToDelete),
      );
      toast.success("Référence de risque supprimée");
      setDeleteDialogOpen(false);
      setReferenceToDelete(null);
    }
  };

  const handleSave = () => {
    if (!formData.numeroRisque.trim() || !formData.title.trim()) {
      toast.error(
        "Veuillez renseigner le numéro de risque et le risque",
      );
      return;
    }

    const alreadyExists = references.some(
      (ref) =>
        ref.numeroRisque.trim().toLowerCase() ===
          formData.numeroRisque.trim().toLowerCase() &&
        ref.id !== selectedReference?.id,
    );
    if (alreadyExists) {
      toast.error("Ce numéro de risque existe déjà");
      return;
    }

    if (viewMode === "create") {
      const newReference: RiskReference = {
        id: crypto.randomUUID(),
        numeroRisque: formData.numeroRisque.trim(),
        title: formData.title.trim(),
      };
      setReferences([newReference, ...references]);
      toast.success("Référence de risque créée");
    } else if (viewMode === "edit" && selectedReference) {
      setReferences(
        references.map((ref) =>
          ref.id === selectedReference.id
            ? {
                ...ref,
                numeroRisque: formData.numeroRisque.trim(),
                title: formData.title.trim(),
              }
            : ref,
        ),
      );
      toast.success("Référence de risque modifiée");
    }

    setViewMode("list");
    setSelectedReference(null);
  };

  if (viewMode === "list") {
    return (
      <>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-gray-900">
                Référentiel des risques
              </h3>
              <p className="text-gray-600">
                {filteredReferences.length === references.length
                  ? `${references.length} référence${references.length > 1 ? "s" : ""}`
                  : `${filteredReferences.length} référence${filteredReferences.length > 1 ? "s" : ""} sur ${references.length}`}
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="w-full lg:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle référence
            </Button>
          </div>

          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative w-full lg:flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher par numéro ou intitulé du risque..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-slate-400 pl-9 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                  />
                </div>
                <Select value={numeroFilter} onValueChange={setNumeroFilter}>
                  <SelectTrigger className="w-full lg:w-[200px] bg-white border-2 border-slate-400 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
                    <SelectValue placeholder="N° risque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les numéros</SelectItem>
                    {numeroOptions.map((numero) => (
                      <SelectItem key={numero} value={numero}>
                        N° {numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="w-full lg:w-[220px] bg-white border-2 border-slate-400 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
                    <SelectValue placeholder="Tri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numero-asc">N° croissant</SelectItem>
                    <SelectItem value="numero-desc">N° décroissant</SelectItem>
                    <SelectItem value="title-asc">Intitulé A → Z</SelectItem>
                    <SelectItem value="title-desc">Intitulé Z → A</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full lg:w-auto border-slate-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Numéro de risque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Risque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedReferences.map((reference) => (
                      <tr
                        key={reference.id}
                        className="hover:bg-red-50/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {reference.numeroRisque}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 break-words">
                          {reference.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEdit(reference)}
                              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDelete(reference.id)
                              }
                              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedReferences.length === 0 && (
                      <tr>
                        <td
                          className="px-6 py-8 text-center text-sm text-gray-500"
                          colSpan={3}
                        >
                          {references.length === 0
                            ? "Aucune référence enregistrée"
                            : "Aucune référence ne correspond aux filtres"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <ListPaginationBar
            currentPage={listPage}
            totalPages={listTotalPages}
            totalItems={filteredReferences.length}
            onPageChange={setListPage}
            itemLabel="référence(s)"
          />
        </div>

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Confirmer la suppression
              </AlertDialogTitle>
              <AlertDialogDescription>
                Cette suppression est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" onClick={() => setViewMode("list")} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {viewMode === "create"
              ? "Nouvelle référence de risque"
              : "Modifier la référence"}
          </h3>
          <p className="text-gray-600">
            Définissez le numéro et l'intitulé du risque
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardContent className="p-4 sm:p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="numeroRisque">Numéro de risque *</Label>
            <Input
              id="numeroRisque"
              value={formData.numeroRisque}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  numeroRisque: e.target.value,
                }))
              }
              placeholder="Ex: RISK-2026-010"
              className="bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Risque *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="Ex: Risque de chute de hauteur"
              className="bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
