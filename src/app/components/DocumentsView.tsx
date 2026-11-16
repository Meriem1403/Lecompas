import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Send,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { MultiSelectFilter } from '@/app/components/ui/multi-select-filter';
import { generateDuerpPdf } from '@/app/utils/duerpPdfExport';
import { downloadDocumentExcel, downloadDocumentPdf, readLibraryFile, loadDocumentLibrary, saveDocumentLibrary } from '@/app/utils/documentLibraryExport';
import { getDocumentLibraryFixtures } from '@/app/fixtures/documentLibraryFixtures';
import { DuerpEditionPage } from '@/app/components/DuerpEditionPage';
import type { DocumentDraft } from '@/app/components/DocumentFormFields';
import { duerpTableFile, risksToDuerpRows, duerpMention } from '@/app/utils/duerpTableExport';
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
import { DocumentCreateView } from './DocumentCreateView';
import { DocumentDetailView } from './DocumentDetailView';
import { DocumentEditView } from './DocumentEditView';
import { toast } from 'sonner';
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';
import { APP_DATA_KEYS } from '@/app/services/appDataApi';
import { useAppDataDocumentStore } from '@/app/hooks/useAppDataDocumentStore';

export interface Document {
  id: string;
  title: string;
  description: string;
  type: 'DUERP' | 'Registre' | 'Procédure' | 'Compte-rendu' | 'Audit' | 'Formation';
  version: string;
  status: 'Brouillon' | 'En validation' | 'Validé' | 'Obsolète' | 'Envoyé pour signature' | 'Signé' | 'Refusé';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validatedBy?: string;
  validatedAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileDataUrl?: string;
  fileSize?: number;
  tags?: string[];
  purpose?: 'bibliotheque' | 'signature';
  editionKind?: 'instantanee' | 'annuelle';
  editionYear?: number;
  snapshotAt?: string;
  directorName?: string;
  directorEmail?: string;
  sentByName?: string;
  sentByEmail?: string;
  signatureImage?: string;
  signatureMode?: "fichier" | "pad" | "texte";
  signedAt?: string;
  signedBy?: string;
  refusalReason?: string;
  signatureComment?: string;
  fixture?: boolean;
  documentDate?: string;
  badgeColor?: string;
  tagColors?: Record<string, string>;
  riskRows?: import('@/app/utils/duerpTableExport').DuerpTableRow[];
}

const DEMO_LIBRARY_TITLES = new Set([
  "Document Unique d'Évaluation des Risques Professionnels 2026",
  "Registre des accidents du travail 2026",
  "Procédure d'intervention en hauteur",
  "Compte-rendu CSSCT - Janvier 2026",
  "Audit sécurité incendie",
  "Attestation formation gestes et postures",
  "Projet DUERP 2027",
]);

export { readLibraryFile };

export function withoutDemoLibraryDocuments(documents: Document[]) {
  return documents.filter((document) => !DEMO_LIBRARY_TITLES.has(document.title));
}

export function dueYearlyDuerpYear(now: Date, documents: Document[]) {
  const year = now.getMonth() === 11 && now.getDate() === 31
    ? now.getFullYear()
    : now.getMonth() === 0
      ? now.getFullYear() - 1
      : null;
  if (year === null) return null;
  const alreadyKept = documents.some(
    (document) => document.editionKind === "annuelle" && document.editionYear === year,
  );
  return alreadyKept ? null : year;
}


interface DocumentsViewProps {
  documents?: Document[];
  risks?: import('@/app/components/admin/RisksManagementView').Risk[];
  actions?: import('@/app/types/action').Action[];
  accessToken?: string;
  senderName?: string;
  senderEmail?: string;
  directorName?: string;
  directorEmail?: string;
  canSendForSignature?: boolean;
  onSendForSignature?: (edition: Document) => void;
}

export function DocumentsView({
  documents: propDocuments,
  risks = [],
  actions = [],
  accessToken = '',
  senderName = "Prévention",
  senderEmail = "",
  directorName = "",
  directorEmail = "",
  canSendForSignature = true,
  onSendForSignature,
}: DocumentsViewProps) {
  const [documents, setDocuments] = useAppDataDocumentStore<Document[]>(
    APP_DATA_KEYS.documentsLibrary,
    accessToken,
    { seed: propDocuments ?? [], loadLocal: loadDocumentLibrary, saveLocal: saveDocumentLibrary },
  );
  const [isCreating, setIsCreating] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [hiddenFixtureIds, setHiddenFixtureIds] = useState<string[]>([]);
  const [isEditingDuerp, setIsEditingDuerp] = useState(false);
  const yearlyLock = useRef(false);
  const [listPage, setListPage] = useState(1);
  const fixtures = useMemo(() => getDocumentLibraryFixtures(), []);

  const handleAdd = () => {
    setIsCreating(true);
  };

  const handleSaveCreate = (draft: DocumentDraft) => {
    const today = new Date().toISOString().split('T')[0];
    const table = draft.type === 'DUERP' && draft.includeRiskTable ? duerpTableFile(risksToDuerpRows(risks)) : null;
    const description = table && !draft.description.includes('Mise à jour des risques')
      ? `${draft.description.trim()}\n\n${duerpMention()}`.trim()
      : draft.description;
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      title: draft.title,
      description,
      type: draft.type,
      version: draft.version,
      status: draft.status,
      createdBy: draft.createdBy,
      createdAt: today,
      updatedAt: today,
      documentDate: draft.documentDate,
      badgeColor: draft.badgeColor,
      tags: draft.tags,
      tagColors: draft.tagColors,
      validatedBy: draft.status === 'Validé' ? draft.validatedBy : undefined,
      validatedAt: draft.status === 'Validé' ? draft.validatedAt : undefined,
      fileName: table?.fileName || draft.fileName,
      fileDataUrl: table?.fileDataUrl || draft.fileDataUrl,
      fileSize: table?.fileSize || draft.fileSize,
      riskRows: table?.riskRows,
    };
    setDocuments([...documents, newDocument]);
    toast.success('Document créé avec succès ✅');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleView = (document: Document) => {
    setViewingDocument(document);
  };

  const handleBackFromView = () => {
    setViewingDocument(null);
  };

  const handleEditFromView = (document: Document) => {
    setViewingDocument(null);
    setEditingDocument(document);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
  };

  const handleSaveEdit = (draft: DocumentDraft, source: Document) => {
    const today = new Date().toISOString().split('T')[0];
    const table = draft.type === 'DUERP' && draft.includeRiskTable ? duerpTableFile(risksToDuerpRows(risks)) : null;
    const description = table && !draft.description.includes('Mise à jour des risques')
      ? `${draft.description.trim()}\n\n${duerpMention()}`.trim()
      : draft.description;
    const saved: Document = {
      ...source,
      title: draft.title,
      description,
      type: draft.type,
      version: draft.version,
      status: draft.status,
      createdBy: draft.createdBy,
      updatedAt: today,
      documentDate: draft.documentDate,
      badgeColor: draft.badgeColor,
      tags: draft.tags,
      tagColors: draft.tagColors,
      validatedBy: draft.status === 'Validé' ? draft.validatedBy : undefined,
      validatedAt: draft.status === 'Validé' ? draft.validatedAt : undefined,
      fileName: table?.fileName || draft.fileName,
      fileDataUrl: table?.fileDataUrl || draft.fileDataUrl,
      fileSize: table?.fileSize || draft.fileSize,
      riskRows: table?.riskRows,
      fixture: undefined,
    };
    if (source.fixture) {
      setDocuments([{ ...saved, id: `doc-${Date.now()}` }, ...documents]);
      setHiddenFixtureIds((current) => [...current, source.id]);
    } else {
      setDocuments(documents.map((item) => item.id === source.id ? { ...saved, id: source.id } : item));
    }
    toast.success('Document modifié avec succès ✅');
    setEditingDocument(null);
  };

  const handleCancelEdit = () => {
    setEditingDocument(null);
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      const target = [...documents, ...fixtures].find((item) => item.id === documentToDelete);
      if (target?.fixture) {
        setHiddenFixtureIds((current) => [...current, target.id]);
      } else {
        setDocuments(documents.filter(d => d.id !== documentToDelete));
      }
      toast.success('Document supprimé avec succès ✅');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownloadPdf = (document: Document) => {
    downloadDocumentPdf(document);
    toast.success("PDF téléchargé.");
  };

  const handleDownloadExcel = (document: Document) => {
    downloadDocumentExcel(document);
    toast.success("Classeur Excel téléchargé.");
  };

  const library = useMemo(() => {
    const storedIds = new Set(documents.map((item) => item.id));
    const examples = fixtures.filter((item) => !storedIds.has(item.id) && !hiddenFixtureIds.includes(item.id));
    return [...documents, ...examples];
  }, [documents, fixtures, hiddenFixtureIds]);

  const includes = (selected: string[], value: string) => selected.length === 0 || selected.includes(value);
  const filteredDocuments = library.filter(doc => {
    const purpose = doc.purpose === "signature" ? "signature" : "bibliotheque";
    const needle = search.trim().toLowerCase();
    const searchMatch = !needle || [doc.title, doc.description, doc.createdBy, doc.fileName, ...(doc.tags ?? [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
    return includes(selectedTypes, doc.type)
      && includes(selectedStatuses, doc.status)
      && includes(selectedAuthors, doc.createdBy)
      && includes(selectedPurposes, purpose)
      && searchMatch;
  });
  const filtersActive = Boolean(search.trim()) || selectedTypes.length + selectedStatuses.length + selectedAuthors.length + selectedPurposes.length > 0;
  const authors = Array.from(new Set(library.map((item) => item.createdBy))).sort((a, b) => a.localeCompare(b, "fr"));

  const listPageSize = DEFAULT_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(1, Math.ceil(filteredDocuments.length / listPageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return filteredDocuments.slice(start, start + listPageSize);
  }, [filteredDocuments, listPage, listPageSize]);

  useEffect(() => {
    setListPage(1);
  }, [selectedTypes, selectedStatuses, selectedAuthors, selectedPurposes, search]);

  useEffect(() => {
    const cleaned = withoutDemoLibraryDocuments(documents);
    if (cleaned.length !== documents.length) setDocuments(cleaned);
  }, [documents, setDocuments]);

  useEffect(() => {
    const year = dueYearlyDuerpYear(new Date(), documents);
    if (!year || yearlyLock.current || risks.length === 0) return;
    yearlyLock.current = true;
    try {
      const pdf = generateDuerpPdf(
        risks,
        actions,
        {
          entreprise: "DIRM Méditerranée",
          adresse: "16 Quai de Rive Neuve, 13007 Marseille",
          responsable: "Directeur Interrégional",
          version: String(year),
          dateDebut: `${year}-01-01`,
          dateFin: `${year}-12-31`,
          methodologie: "Évaluation gravité (G) × fréquence (F) = risque initial. Risque résiduel (GFM) = risque initial × coefficient de maîtrise.",
        },
        "synthese",
      );
      const fileDataUrl = pdf.output("datauristring");
      const today = new Date().toISOString().split("T")[0];
      const edition: Document = {
        id: `duerp-annuel-${year}`,
        title: `DUERP ${year}, extrait du 31 décembre`,
        description: `Version arrêtée au 31 décembre ${year}, préparée pour la signature du directeur.`,
        type: "DUERP",
        version: String(year),
        status: "Envoyé pour signature",
        createdBy: "Préparation automatique",
        createdAt: today,
        updatedAt: today,
        fileName: `DUERP_${year}_31-decembre.pdf`,
        fileDataUrl,
        fileSize: Math.round((fileDataUrl.length * 3) / 4),
        purpose: "signature",
        editionKind: "annuelle",
        editionYear: year,
        snapshotAt: today,
        directorName: "Directeur Interrégional",
        tags: ["signature", String(year)],
      };
      setDocuments((current) =>
        current.some((item) => item.editionKind === "annuelle" && item.editionYear === year)
          ? current
          : [edition, ...current],
      );
      toast.success(`Extrait du 31 décembre ${year} préparé pour la signature du directeur.`);
    } catch (error) {
      yearlyLock.current = false;
      console.error(error);
    }
  }, [actions, documents, risks, setDocuments]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  if (isEditingDuerp) {
    return (
      <DuerpEditionPage
        risks={risks}
        canSendForSignature={canSendForSignature}
        directorName={directorName}
        onBack={() => setIsEditingDuerp(false)}
        onCreate={(edition) => {
          setDocuments((current) => [edition, ...current]);
          setIsEditingDuerp(false);
          toast.success("Le DUERP est créé dans la bibliothèque, avec le tableau en PDF.");
        }}
        onSend={(edition) => {
          const sent: Document = {
            ...edition,
            status: "Envoyé pour signature",
            purpose: "signature",
            createdBy: senderName,
            sentByName: senderName,
            sentByEmail: senderEmail,
            directorName: directorName || "Directeur",
            directorEmail: directorEmail || senderEmail,
          };
          setDocuments((current) => [sent, ...current]);
          setIsEditingDuerp(false);
          onSendForSignature?.(sent);
          toast.success(directorName
            ? `Version envoyée à ${directorName}. Une notification lui est destinée.`
            : "Version envoyée. Aucun directeur n'est encore désigné : la notification arrive sur ce compte pour l'essai du rôle Directeur.");
        }}
      />
    );
  }

  // Si on est en mode création, afficher uniquement la page de création
  if (isCreating) {
    return (
      <DocumentCreateView
        riskCount={risks.length}
        onSave={handleSaveCreate}
        onCancel={handleCancelCreate}
      />
    );
  }

  // Si on est en mode consultation, afficher uniquement la page de détail
  if (viewingDocument) {
    return (
      <DocumentDetailView
        document={viewingDocument}
        onBack={handleBackFromView}
        onEdit={handleEditFromView}
        onDownload={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
      />
    );
  }

  // Si on est en mode édition, afficher uniquement la page d'édition
  if (editingDocument) {
    return (
      <DocumentEditView
        document={editingDocument}
        riskCount={risks.length}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  const getTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'DUERP':
        return 'from-purple-500 to-indigo-500';
      case 'Registre':
        return 'from-blue-500 to-cyan-500';
      case 'Procédure':
        return 'from-green-500 to-emerald-500';
      case 'Compte-rendu':
        return 'from-orange-500 to-amber-500';
      case 'Audit':
        return 'from-red-500 to-rose-500';
      case 'Formation':
        return 'from-pink-500 to-fuchsia-500';
    }
  };

  const getStatusConfig = (status: Document['status']) => {
    switch (status) {
      case 'Validé':
        return { icon: CheckCircle2, bgColor: 'bg-green-50', textColor: 'text-green-700' };
      case 'En validation':
        return { icon: Clock, bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
      case 'Brouillon':
        return { icon: Edit, bgColor: 'bg-gray-50', textColor: 'text-gray-700' };
      case 'Obsolète':
        return { icon: AlertCircle, bgColor: 'bg-red-50', textColor: 'text-red-700' };
      case 'Envoyé pour signature':
        return { icon: Send, bgColor: 'bg-violet-50', textColor: 'text-violet-800' };
      case 'Signé':
        return { icon: CheckCircle2, bgColor: 'bg-emerald-50', textColor: 'text-emerald-800' };
      case 'Refusé':
        return { icon: AlertCircle, bgColor: 'bg-rose-50', textColor: 'text-rose-800' };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Documents SST</h3>
          <p className="text-gray-600">Bibliothèque des documents. Le DUERP reprend le tableau de la mise à jour des risques.</p>
          <p className="mt-1 text-sm text-slate-600">
            {library.filter((item) => item.status === "Validé").length} validés, {library.filter((item) => item.status === "En validation").length} en validation, {library.filter((item) => item.status === "Brouillon").length} brouillons, {library.length} au total.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button 
            onClick={() => setIsEditingDuerp(true)}
            className="w-full rounded-lg bg-indigo-950 text-white hover:bg-indigo-900 sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Générer le DUERP
          </Button>
          <Button className="w-full rounded-lg bg-violet-700 text-white hover:bg-violet-800 sm:w-auto" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Ajouter un document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white/80 shadow-xl backdrop-blur" role="region" aria-label="Filtres des documents">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un titre, un auteur, un fichier"
                className="h-11 rounded-xl border-violet-200 bg-white pl-10 shadow-sm"
              />
            </div>
            <p className="shrink-0 text-sm font-semibold text-violet-950">{filteredDocuments.length} document(s)</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-11 rounded-xl border-violet-200 bg-white px-4 text-violet-800 hover:bg-violet-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filtersOpen ? "Masquer les filtres" : "Filtres"}
            </Button>
            {filtersActive ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setSelectedTypes([]);
                  setSelectedStatuses([]);
                  setSelectedAuthors([]);
                  setSelectedPurposes([]);
                }}
                className="h-11 rounded-xl text-slate-600"
              >
                Réinitialiser
              </Button>
            ) : null}
          </div>
          {filtersOpen ? (
            <div className="grid grid-cols-1 gap-4 border-t border-violet-100 pt-4 xl:grid-cols-3">
              <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
                <h2 className="text-sm font-bold text-violet-950">Identification</h2>
                <MultiSelectFilter
                  label="Type"
                  selected={selectedTypes}
                  onChange={setSelectedTypes}
                  options={["DUERP", "Registre", "Procédure", "Compte-rendu", "Audit", "Formation"].map((value) => ({ value, label: value }))}
                />
                <MultiSelectFilter
                  label="Auteur"
                  selected={selectedAuthors}
                  onChange={setSelectedAuthors}
                  options={authors.map((value) => ({ value, label: value }))}
                />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Origine</p>
                  <div className="grid grid-cols-1 gap-2">
                    {([
                      ["bibliotheque", "Bibliothèque"],
                      ["signature", "Version à signer"],
                    ] as const).map(([value, label]) => {
                      const active = selectedPurposes.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedPurposes((current) => active ? current.filter((item) => item !== value) : [...current, value])}
                          className={`flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${active ? "border-violet-400 bg-violet-100 text-violet-950" : "border-white bg-white text-slate-700"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:col-span-2">
                <h2 className="text-sm font-bold text-slate-900">Suivi</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {["Brouillon", "En validation", "Validé", "Envoyé pour signature", "Signé", "Obsolète"].map((status) => {
                    const active = selectedStatuses.includes(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedStatuses((current) => active ? current.filter((item) => item !== status) : [...current, status])}
                        className={`flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${active ? "border-slate-700 bg-slate-800 text-white" : "border-white bg-white text-slate-700"}`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {paginatedDocuments.length === 0 ? (
          <Card className="border-0 bg-white/80 shadow-xl">
            <CardContent className="py-12 text-center text-slate-600">
              {filtersActive
                ? "Aucun document ne correspond à ces filtres."
                : "La bibliothèque est vide. Ajoutez un fichier, ou générez le DUERP."}
            </CardContent>
          </Card>
        ) : null}
        {paginatedDocuments.map((document) => {
          const statusConfig = getStatusConfig(document.status);
          const StatusIcon = statusConfig.icon;
          return (
            <Card key={document.id} className="border-0 bg-white/80 shadow-xl backdrop-blur transition-all hover:shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getTypeColor(document.type)} shadow-lg`}>
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 text-xl font-bold text-gray-900">{document.title}</h4>
                    <p className="mb-3 text-sm text-gray-600">{document.description}</p>
                    {document.purpose === "signature" ? (
                      <p className="mb-3 text-sm text-violet-800">
                        Version du {new Date(document.snapshotAt || document.createdAt).toLocaleDateString("fr-FR")}
                        {document.editionKind === "annuelle" ? ", extrait du 31 décembre" : ", arrêtée à cet instant"}
                        {document.directorName ? `, pour ${document.directorName}` : ""}.
                      </p>
                    ) : null}
                    {document.fileName ? (
                      <p className="mb-3 text-sm text-slate-600">Fichier : {document.fileName}</p>
                    ) : null}
                    {document.fixture ? (
                      <p className="mb-3 text-sm font-medium text-amber-800">Exemple d'affichage. Il n'est pas enregistré dans la base.</p>
                    ) : null}
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-500">Version</p>
                          <p className="text-sm font-semibold text-gray-800">v{document.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Créé par</p>
                          <p className="text-sm font-semibold text-gray-800">{document.createdBy}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-gray-500">Dernière màj</p>
                          <p className="text-sm font-semibold text-gray-800">{new Date(document.updatedAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                      {document.fileSize ? (
                        <div className="flex items-center space-x-2">
                          <Download className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-gray-500">Taille</p>
                            <p className="text-sm font-semibold text-gray-800">{formatFileSize(document.fileSize)}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge className={`border-0 bg-gradient-to-r ${getTypeColor(document.type)} text-white shadow-md`}>
                        {document.type}
                      </Badge>
                      <Badge className={`border-0 ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {document.status}
                      </Badge>
                      {document.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-gray-50 text-gray-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(document)} className="h-9 rounded-lg border-violet-200 bg-white text-violet-950 hover:bg-violet-50">
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Consulter
                      </Button>
                      <Button size="sm" onClick={() => handleEdit(document)} className="h-9 rounded-lg bg-violet-700 text-white hover:bg-violet-800">
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(document)} className="h-9 rounded-lg border-slate-200 bg-white text-slate-800 hover:bg-slate-50">
                        <Download className="mr-1 h-3.5 w-3.5" />
                        PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadExcel(document)} className="h-9 rounded-lg border-slate-200 bg-white text-slate-800 hover:bg-slate-50">
                        <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteClick(document.id)} className="h-9 rounded-lg border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ListPaginationBar
        currentPage={listPage}
        totalPages={listTotalPages}
        totalItems={filteredDocuments.length}
        onPageChange={setListPage}
        itemLabel="document(s)"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}