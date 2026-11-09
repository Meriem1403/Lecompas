import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { PlusCircle, Edit, Trash2, ArrowLeft, Search, X, Paperclip, Download, Upload, ExternalLink, Eye, FileText, Shield, AlertTriangle, HeartPulse, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import { Textarea } from "@/app/components/ui/textarea";
import type { RegisterAttachment } from "@/app/types/importedRegisters";
import { resolveRiskReferenceFicheUrl } from "@/app/fixtures/riskReferenceFixtures";
import { attachmentPreviewKind, displayRiskSheet } from "@/app/fixtures/riskReferenceSheets";
import { getBlockedExternalLinkMessage, isAllowedExternalUrl } from "@/app/services/externalLinkGuard";
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
  /** Lien vers la fiche INRS ou un document officiel. Vide si aucun dossier ne correspond. */
  ficheUrl?: string;
  description?: string;
  situations?: string;
  dommages?: string;
  prevention?: string;
  attachments?: RegisterAttachment[];
}

type RiskReferenceForm = {
  numeroRisque: string;
  title: string;
  ficheUrl: string;
  description: string;
  situations: string;
  dommages: string;
  prevention: string;
  attachments: RegisterAttachment[];
};

const EMPTY_FORM: RiskReferenceForm = {
  numeroRisque: "",
  title: "",
  ficheUrl: "",
  description: "",
  situations: "",
  dommages: "",
  prevention: "",
  attachments: [],
};

function formFromReference(reference: RiskReference): RiskReferenceForm {
  return {
    numeroRisque: reference.numeroRisque,
    title: reference.title,
    ficheUrl: resolveRiskReferenceFicheUrl(reference),
    description: reference.description ?? "",
    situations: reference.situations ?? "",
    dommages: reference.dommages ?? "",
    prevention: reference.prevention ?? "",
    attachments: reference.attachments ?? [],
  };
}

const fieldClass =
  "bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1";

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function filesToAttachments(files: File[]): Promise<RegisterAttachment[]> {
  const accepted: RegisterAttachment[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      rejected.push(file.name);
      continue;
    }
    const dataUrl = await readFileAsDataUrl(file);
    accepted.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      dataUrl,
      uploadedAt: new Date().toISOString(),
    });
  }
  if (rejected.length > 0) {
    toast.error(
      `Fichier trop volumineux (8 Mo max) : ${rejected.join(", ")}`,
    );
  }
  return accepted;
}

function downloadAttachment(attachment: RegisterAttachment) {
  const link = document.createElement("a");
  link.href = attachment.dataUrl;
  link.download = attachment.fileName;
  link.click();
}

interface RiskReferencesManagementViewProps {
  references: RiskReference[];
  setReferences: React.Dispatch<React.SetStateAction<RiskReference[]>>;
  canManage?: boolean;
}

function AttachmentPreview({ attachment }: { attachment: RegisterAttachment }) {
  const kind = attachmentPreviewKind(attachment.fileName, attachment.mimeType);
  if (!attachment.dataUrl) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        Le fichier est enregistré sans contenu lisible. Téléchargez-le pour le consulter.
      </p>
    );
  }
  if (kind === "pdf") {
    return (
      <iframe
        title={`Aperçu de ${attachment.fileName}`}
        src={attachment.dataUrl}
        className="mt-3 h-[70vh] w-full rounded-xl border border-slate-200 bg-white"
      />
    );
  }
  if (kind === "image") {
    return (
      <img
        src={attachment.dataUrl}
        alt={attachment.fileName}
        className="mt-3 max-h-[70vh] w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
      />
    );
  }
  return (
    <p className="mt-3 text-sm text-slate-500">
      Aperçu indisponible pour ce format. Téléchargez la pièce pour la lire.
    </p>
  );
}

type ViewMode = "list" | "consult" | "create" | "edit";
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
  canManage = true,
}: RiskReferencesManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedReference, setSelectedReference] =
    useState<RiskReference | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [referenceToDelete, setReferenceToDelete] = useState<
    string | null
  >(null);

  const [formData, setFormData] = useState<RiskReferenceForm>(EMPTY_FORM);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        ref.title.toLowerCase().includes(query) ||
        (ref.description ?? "").toLowerCase().includes(query) ||
        (ref.situations ?? "").toLowerCase().includes(query) ||
        (ref.dommages ?? "").toLowerCase().includes(query) ||
        (ref.prevention ?? "").toLowerCase().includes(query) ||
        resolveRiskReferenceFicheUrl(ref).toLowerCase().includes(query);
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
    setFormData(EMPTY_FORM);
    setViewMode("create");
  };

  const handleConsult = (reference: RiskReference) => {
    setSelectedReference(reference);
    setPreviewAttachmentId(reference.attachments?.[0]?.id ?? null);
    setViewMode("consult");
  };

  const handleEdit = (reference: RiskReference) => {
    setSelectedReference(reference);
    setFormData(formFromReference(reference));
    setViewMode("edit");
  };

  const addAttachments = async (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const created = await filesToAttachments(files);
    if (created.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...created],
    }));
    toast.success(
      created.length > 1
        ? `${created.length} pièces jointes ajoutées`
        : "Pièce jointe ajoutée",
    );
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

    const ficheUrl = formData.ficheUrl.trim();
    if (ficheUrl && !isAllowedExternalUrl(ficheUrl)) {
      toast.error(getBlockedExternalLinkMessage(ficheUrl));
      return;
    }

    const sheet: Pick<
      RiskReference,
      "ficheUrl" | "description" | "situations" | "dommages" | "prevention" | "attachments"
    > = {
      ficheUrl,
      description: formData.description.trim(),
      situations: formData.situations.trim(),
      dommages: formData.dommages.trim(),
      prevention: formData.prevention.trim(),
      attachments: formData.attachments,
    };

    if (viewMode === "create") {
      const newReference: RiskReference = {
        id: crypto.randomUUID(),
        numeroRisque: formData.numeroRisque.trim(),
        title: formData.title.trim(),
        ...sheet,
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
                ...sheet,
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
                  ? `${references.length} fiche${references.length > 1 ? "s" : ""}`
                  : `${filteredReferences.length} fiche${filteredReferences.length > 1 ? "s" : ""} sur ${references.length}`}
                {" "}
                — lien INRS, contenu et pièces jointes
              </p>
            </div>
            {canManage ? (
            <Button
              onClick={handleCreate}
              className="w-full lg:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvelle référence
            </Button>
            ) : null}
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
                <table className="w-full min-w-[860px]">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Numéro de risque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Risque
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Fiche INRS
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
                          <button
                            type="button"
                            onClick={() => handleConsult(reference)}
                            className="text-left font-medium text-slate-900 underline-offset-2 hover:text-sky-800 hover:underline"
                          >
                            {reference.title}
                          </button>
                          {reference.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{reference.description}</p>
                          ) : null}
                          {(reference.attachments?.length ?? 0) > 0 ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Paperclip className="h-3.5 w-3.5" aria-hidden />
                              {reference.attachments!.length} pièce
                              {reference.attachments!.length > 1 ? "s" : ""} jointe
                              {reference.attachments!.length > 1 ? "s" : ""}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {resolveRiskReferenceFicheUrl(reference) ? (
                            <a
                              href={resolveRiskReferenceFicheUrl(reference)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-sky-700 underline-offset-2 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                              Ouvrir
                            </a>
                          ) : (
                            <span className="text-slate-400">À renseigner</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConsult(reference)}
                              className="w-full sm:w-auto border-sky-200 text-sky-800"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Consulter
                            </Button>
                            {canManage ? (
                            <Button
                              size="sm"
                              onClick={() => handleEdit(reference)}
                              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Modifier
                            </Button>
                            ) : null}
                            {canManage ? (
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
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedReferences.length === 0 && (
                      <tr>
                        <td
                          className="px-6 py-8 text-center text-sm text-gray-500"
                          colSpan={4}
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

  if (viewMode === "consult" && selectedReference) {
    const reference =
      references.find((item) => item.id === selectedReference.id) ?? selectedReference;
    const ficheUrl = resolveRiskReferenceFicheUrl(reference);
    const ficheAllowed = Boolean(ficheUrl) && isAllowedExternalUrl(ficheUrl);
    const sheet = displayRiskSheet(reference);
    const cards = [
      {
        label: "De quoi s'agit-il",
        value: sheet.description,
        icon: Sparkles,
        className: "border-orange-100 bg-orange-50/70",
        iconClass: "bg-orange-500",
      },
      {
        label: "Où ça se présente",
        value: sheet.situations,
        icon: AlertTriangle,
        className: "border-amber-100 bg-amber-50/80",
        iconClass: "bg-amber-500",
      },
      {
        label: "Ce qui peut arriver",
        value: sheet.dommages,
        icon: HeartPulse,
        className: "border-rose-100 bg-rose-50/70",
        iconClass: "bg-rose-500",
      },
      {
        label: "Comment s'en protéger",
        value: sheet.prevention,
        icon: Shield,
        className: "border-emerald-100 bg-emerald-50/80",
        iconClass: "bg-emerald-600",
      },
    ];
    const attachments = reference.attachments ?? [];
    const attachmentCount = attachments.length;
    const preview =
      attachments.find((item) => item.id === previewAttachmentId) ?? attachments[0] ?? null;

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => setViewMode("list")} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
          {canManage ? (
          <Button
            onClick={() => handleEdit(reference)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 sm:w-auto"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-md">
          <div className="bg-gradient-to-r from-red-600 to-orange-500 px-5 py-6 text-white sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-100">
              Fiche du référentiel
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <span className="rounded-xl bg-white/15 px-3 py-1 text-2xl font-bold tabular-nums">
                {reference.numeroRisque}
              </span>
              <h3 className="text-2xl font-bold leading-tight">{reference.title}</h3>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-orange-50">{sheet.description}</p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.className}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${card.iconClass}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h4 className="text-base font-semibold text-slate-900">{card.label}</h4>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">{card.value}</p>
              </article>
            );
          })}
        </div>

        <section className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-800">
                <ExternalLink className="h-4 w-4" aria-hidden />
                Fiche INRS
              </h4>
              {ficheAllowed ? (
                <p className="mt-2 truncate text-sm text-sky-900">{ficheUrl}</p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Aucun dossier INRS n’est associé à cette fiche.
                </p>
              )}
            </div>
            {ficheAllowed ? (
              <a
                href={ficheUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-sky-700 px-4 text-sm font-medium text-white hover:bg-sky-800"
              >
                Ouvrir la fiche
              </a>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Paperclip className="h-4 w-4" aria-hidden />
            Pièces jointes
          </h4>
          {attachmentCount === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Aucune pièce jointe pour cette fiche.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {attachments.map((attachment) => {
                  const selected = preview?.id === attachment.id;
                  return (
                    <button
                      key={attachment.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPreviewAttachmentId(attachment.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left text-sm ${
                        selected
                          ? "border-sky-600 bg-sky-50 font-medium text-sky-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="max-w-[16rem] truncate">{attachment.fileName}</span>
                    </button>
                  );
                })}
              </div>
              {preview ? (
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{preview.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {preview.uploadedAt
                          ? new Date(preview.uploadedAt).toLocaleDateString("fr-FR")
                          : "Date inconnue"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAttachment(preview)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </Button>
                  </div>
                  <AttachmentPreview attachment={preview} />
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
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
              ? "Nouvelle fiche risque"
              : "Modifier la fiche risque"}
          </h3>
          <p className="text-gray-600">
            Numéro, contenu de la fiche, lien INRS et pièces jointes
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
              className={fieldClass}
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
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="De quoi s'agit-il, dans le contexte du service"
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="situations">Situations dangereuses</Label>
            <Textarea
              id="situations"
              rows={3}
              value={formData.situations}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, situations: e.target.value }))
              }
              placeholder="Circonstances dans lesquelles le risque se présente"
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dommages">Dommages possibles</Label>
            <Textarea
              id="dommages"
              rows={3}
              value={formData.dommages}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dommages: e.target.value }))
              }
              placeholder="Blessures, maladies, atteintes à la santé"
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prevention">Mesures de prévention</Label>
            <Textarea
              id="prevention"
              rows={3}
              value={formData.prevention}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, prevention: e.target.value }))
              }
              placeholder="Mesures de prévention associées à cette fiche"
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ficheUrl">Lien vers la fiche INRS</Label>
            <Input
              id="ficheUrl"
              type="url"
              value={formData.ficheUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ficheUrl: e.target.value }))
              }
              placeholder="https://www.inrs.fr/risques/..."
              className={fieldClass}
            />
            {formData.ficheUrl.trim() && isAllowedExternalUrl(formData.ficheUrl.trim()) ? (
              <a
                href={formData.ficheUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Ouvrir la fiche
              </a>
            ) : (
              <p className="text-xs text-slate-500">
                Adresse du dossier INRS correspondant. Laissez vide s'il n'en existe pas.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk-reference-files">Pièces jointes</Label>
            <input
              id="risk-reference-files"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void addAttachments(event.target.files);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDraggingFiles(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingFiles(false);
                void addAttachments(event.dataTransfer.files);
              }}
              className={`flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                isDraggingFiles
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-300 bg-white hover:border-orange-400 hover:bg-orange-50/40"
              }`}
            >
              <Upload className="h-8 w-8 text-orange-600" aria-hidden />
              <span className="text-sm font-semibold text-slate-900">
                Glissez une ou plusieurs pièces jointes ici
              </span>
              <span className="text-xs text-slate-500">
                ou cliquez pour parcourir. 8 Mo maximum par fichier.
              </span>
            </button>
            {formData.attachments.length > 0 ? (
              <ul className="space-y-2">
                {formData.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                      <Paperclip className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      <span className="truncate">{attachment.fileName}</span>
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Télécharger
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (item) => item.id !== attachment.id,
                            ),
                          }))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Retirer
                      </Button>
                    </span>
                    </div>
                    <AttachmentPreview attachment={attachment} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Aucune pièce jointe pour cette référence.</p>
            )}
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
