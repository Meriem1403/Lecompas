import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLeaveGuard } from "@/app/components/leaveGuard";
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
import { Plus, PlusCircle, Edit, Trash2, ArrowLeft, Search, Paperclip, Download, Upload, ExternalLink, Eye, FileText, Shield, AlertTriangle, HeartPulse, Sparkles, LayoutGrid, Table2, SlidersHorizontal } from "lucide-react";
import type { RiskAwarenessRecord } from "@/app/components/RiskAwarenessView";
import { toast } from "sonner";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import type { RegisterAttachment } from "@/app/types/importedRegisters";
import { resolveRiskReferenceFicheUrl } from "@/app/fixtures/riskReferenceFixtures";
import { attachmentPreviewKind, displayRiskSheet } from "@/app/fixtures/riskReferenceSheets";
import { getBlockedExternalLinkMessage, isAllowedExternalUrl } from "@/app/services/externalLinkGuard";
import { normalizeRiskTitle } from "@/app/utils/lecompasStorage";
import { nextRiskNumber } from "@/app/utils/riskSequence";
import { ColumnFilterPopover } from "@/app/components/ui/column-filter-popover";
import { MultiSelectFilter } from "@/app/components/ui/multi-select-filter";
import {
  emptyColumnFilterState,
  type ColumnFilterKind,
  type ColumnFilterState,
} from "@/app/utils/riskManagementFilterLogic";

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
  /** Vrai quand la dernière fiche d'évaluation liée à ce titre a été supprimée ou renommée. */
  orphaned?: boolean;
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

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

function linesOf(value: string): string[] {
  const lines = value.split("\n");
  return lines.length > 0 ? lines : [""];
}

function compactLines(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

const ENTRY_TONES = {
  amber: {
    index: "bg-amber-100 text-amber-800",
    add: "border-amber-300/80 text-amber-950 hover:bg-white",
    plus: "bg-amber-500",
  },
  orange: {
    index: "bg-orange-100 text-orange-800",
    add: "border-orange-300/80 text-orange-950 hover:bg-white",
    plus: "bg-orange-500",
  },
  rose: {
    index: "bg-rose-100 text-rose-800",
    add: "border-rose-300/80 text-rose-950 hover:bg-white",
    plus: "bg-rose-500",
  },
  emerald: {
    index: "bg-emerald-100 text-emerald-800",
    add: "border-emerald-300/80 text-emerald-950 hover:bg-white",
    plus: "bg-emerald-600",
  },
} as const;

function EntryListField({
  id,
  value,
  onChange,
  placeholder,
  addLabel,
  tone,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  addLabel: string;
  tone: keyof typeof ENTRY_TONES;
}) {
  const lines = value ? linesOf(value) : [""];
  const write = (next: string[]) => onChange(next.join("\n"));
  const colors = ENTRY_TONES[tone];

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const canRemove = lines.length > 1 || Boolean(line.trim());
        return (
          <div
            key={`${id}-${index}`}
            className="flex items-center gap-2 rounded-2xl border border-white bg-white/95 px-2 py-1.5 shadow-sm"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tabular-nums ${colors.index}`}
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <Input
              id={index === 0 ? id : undefined}
              value={line}
              placeholder={placeholder}
              aria-label={`${placeholder} ${index + 1}`}
              onChange={(event) => {
                const next = [...lines];
                next[index] = event.target.value;
                write(next);
              }}
              className="h-10 flex-1 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const next = lines.filter((_, itemIndex) => itemIndex !== index);
                write(next.length > 0 ? next : [""]);
              }}
              className="h-8 w-8 shrink-0 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Retirer ${placeholder.toLowerCase()} ${index + 1}`}
              disabled={!canRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => write([...lines, ""])}
        className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed bg-white/40 text-sm font-medium transition-colors ${colors.add}`}
      >
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${colors.plus}`}>
          <Plus className="h-3.5 w-3.5" />
        </span>
        {addLabel}
      </button>
    </div>
  );
}

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
  awarenessRecords?: RiskAwarenessRecord[];
  setAwarenessRecords?: React.Dispatch<React.SetStateAction<RiskAwarenessRecord[]>>;
  onAwarenessDeleted?: (record: RiskAwarenessRecord) => void;
  onAwarenessSaved?: (riskKey: string) => void;
  canManage?: boolean;
  openSheetFor?: { numeroRisque: string; title: string } | null;
  onOpenSheetHandled?: () => void;
  onRenameLinkedRisks?: (previousTitle: string, nextTitle: string) => void;
  onReferenceRemoved?: (title: string) => void;
}

const AWARENESS_PREFIX = "awareness:";

function sheetKey(sheet: { numeroRisque: string; title: string }) {
  return `${sheet.numeroRisque}::${sheet.title}`;
}

function awarenessToSheet(record: RiskAwarenessRecord): RiskReference {
  const link = (record.links ?? []).find((item) => /^https?:\/\//i.test(item)) ?? "";
  return {
    id: `${AWARENESS_PREFIX}${record.id}`,
    numeroRisque: record.riskNumber,
    title: record.riskTitle,
    ficheUrl: link,
    description: record.summary || "",
    situations: record.situations || "",
    dommages: record.dommages || "",
    prevention: record.content || "",
    attachments: (record.documents ?? [])
      .filter((document) => document.dataUrl)
      .map((document, index) => ({
        id: `awareness-doc-${record.id}-${index}`,
        fileName: document.name,
        mimeType: document.mimeType || "application/octet-stream",
        dataUrl: document.dataUrl || "",
        uploadedAt: record.updatedAt || "",
      })),
  };
}

function uniqueAwarenessSheets(
  references: RiskReference[],
  records: RiskAwarenessRecord[],
): RiskReference[] {
  const catalogKeys = new Set(references.map(sheetKey));
  const catalogTitles = new Set(references.map((reference) => normalizeRiskTitle(reference.title)));
  const richest = new Map<string, RiskAwarenessRecord>();
  records.forEach((record) => {
    if (!record.riskKey || catalogKeys.has(record.riskKey)) return;
    if (catalogTitles.has(normalizeRiskTitle(record.riskTitle))) return;
    const current = richest.get(record.riskKey);
    const weight =
      (record.summary?.trim().length ?? 0) +
      (record.content?.trim().length ?? 0) +
      (record.documents?.length ?? 0) * 20;
    const currentWeight = current
      ? (current.summary?.trim().length ?? 0) +
        (current.content?.trim().length ?? 0) +
        (current.documents?.length ?? 0) * 20
      : -1;
    if (!current || weight > currentWeight) richest.set(record.riskKey, record);
  });
  return [...richest.values()].map(awarenessToSheet);
}

function pieceLabel(count: number) {
  if (count === 0) return "Aucune";
  if (count === 1) return "1 pièce jointe";
  return `${count} pièces jointes`;
}

function sheetExcerpt(reference: RiskReference) {
  if (reference.id.startsWith(AWARENESS_PREFIX)) {
    return reference.description?.trim() || reference.prevention?.trim() || "Contenu à compléter";
  }
  return reference.description?.trim() || displayRiskSheet(reference).description;
}

function SheetInrs({ url, presentation = "inline" }: { url: string; presentation?: "inline" | "card" }) {
  const allowed = Boolean(url) && isAllowedExternalUrl(url);
  const status = (
    <div className="min-w-0">
      {presentation === "card" ? (
        <p className="text-xs font-medium text-sky-800/70">Fiche INRS</p>
      ) : null}
      <p className={`text-sm font-semibold ${allowed ? "text-slate-900" : "text-slate-500"}`}>
        {allowed ? "Disponible" : "Non renseignée"}
      </p>
      {allowed ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="text-xs font-medium text-sky-700 underline-offset-2 hover:underline"
        >
          Ouvrir la fiche
        </a>
      ) : null}
    </div>
  );
  if (presentation === "card") {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-sky-100 bg-white px-3 py-2.5 shadow-sm">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${allowed ? "bg-sky-500" : "bg-slate-300"}`}>
          <ExternalLink className="h-4 w-4" aria-hidden />
        </span>
        {status}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          allowed ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-400"
        }`}
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
      </span>
      {status}
    </div>
  );
}

function SheetPieces({
  attachments,
  presentation = "inline",
}: {
  attachments?: RegisterAttachment[];
  presentation?: "inline" | "card";
}) {
  const files = attachments ?? [];
  const count = files.length;
  const extra = count - 1;
  const copy = (
    <div className="min-w-0">
      {presentation === "card" ? (
        <p className="text-xs font-medium text-violet-800/70">Pièces jointes</p>
      ) : null}
      <p className={`text-sm font-semibold ${count > 0 ? "text-slate-900" : "text-slate-500"}`}>
        {pieceLabel(count)}
      </p>
      {count > 0 ? (
        <p className="truncate text-xs text-slate-500">
          {files[0].fileName}
          {extra > 0 ? ` et ${extra} autre${extra > 1 ? "s" : ""}` : ""}
        </p>
      ) : null}
    </div>
  );
  if (presentation === "card") {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-violet-100 bg-white px-3 py-2.5 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-sm">
          <Paperclip className="h-4 w-4" aria-hidden />
        </span>
        {copy}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Paperclip className="h-4 w-4" aria-hidden />
      </span>
      {copy}
    </div>
  );
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
type ReferenceColumnKey = "numero" | "title" | "inrs" | "pieces";

const REFERENCE_COLUMNS: Array<{ key: ReferenceColumnKey; label: string; kind: ColumnFilterKind }> = [
  { key: "numero", label: "N°", kind: "number" },
  { key: "title", label: "Risque", kind: "text" },
  { key: "inrs", label: "Fiche INRS", kind: "text" },
  { key: "pieces", label: "Pièces jointes", kind: "number" },
];

type CatalogFilters = {
  numbers: string[];
  inrs: string[];
  pieces: string[];
};

const emptyCatalogFilters = (): CatalogFilters => ({
  numbers: [],
  inrs: [],
  pieces: [],
});

function emptyReferenceColumnFilters(): Record<ReferenceColumnKey, ColumnFilterState> {
  return {
    numero: emptyColumnFilterState(),
    title: emptyColumnFilterState(),
    inrs: emptyColumnFilterState(),
    pieces: emptyColumnFilterState(),
  };
}

function compareNumero(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, "fr", { numeric: true });
}

function referenceColumnValue(reference: RiskReference, key: ReferenceColumnKey): string {
  if (key === "numero") return reference.numeroRisque || "";
  if (key === "title") return reference.title || "";
  if (key === "inrs") return resolveRiskReferenceFicheUrl(reference) ? "Disponible" : "Non renseignée";
  return String(reference.attachments?.length ?? 0);
}

function referenceColumnLabel(key: ReferenceColumnKey, value: string): string {
  if (key === "pieces") return pieceLabel(Number(value) || 0);
  return value || "(vide)";
}

function matchesReferenceColumn(
  reference: RiskReference,
  key: ReferenceColumnKey,
  filter: ColumnFilterState,
): boolean {
  const value = referenceColumnValue(reference, key);
  if (filter.values !== null && !filter.values.includes(value)) return false;
  if (filter.operator === "none" || !filter.query.trim()) return true;
  const kind = REFERENCE_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  const displayed = referenceColumnLabel(key, value).toLocaleLowerCase("fr");
  const query = filter.query.trim().toLocaleLowerCase("fr");
  if (kind === "number") {
    const current = Number(value.replace(",", "."));
    const min = Number(filter.query.trim().replace(",", "."));
    const max = Number(filter.queryTo.trim().replace(",", "."));
    if (!Number.isFinite(current) || !Number.isFinite(min)) return false;
    switch (filter.operator) {
      case "equals":
        return current === min;
      case "notEquals":
        return current !== min;
      case "gt":
        return current > min;
      case "gte":
        return current >= min;
      case "lt":
        return current < min;
      case "lte":
        return current <= min;
      case "between":
        return Number.isFinite(max) && current >= Math.min(min, max) && current <= Math.max(min, max);
      default:
        return displayed.includes(query);
    }
  }
  switch (filter.operator) {
    case "equals":
      return displayed === query;
    case "notEquals":
      return displayed !== query;
    case "startsWith":
      return displayed.startsWith(query);
    case "endsWith":
      return displayed.endsWith(query);
    case "notContains":
      return !displayed.includes(query);
    case "contains":
      return displayed.includes(query);
    default:
      return true;
  }
}

function columnFilterIsActive(filter: ColumnFilterState) {
  return filter.values !== null || (filter.operator !== "none" && filter.query.trim().length > 0);
}

export function RiskReferencesManagementView({
  references,
  setReferences,
  awarenessRecords = [],
  setAwarenessRecords,
  onAwarenessDeleted,
  onAwarenessSaved,
  canManage = true,
  openSheetFor = null,
  onOpenSheetHandled,
  onRenameLinkedRisks,
  onReferenceRemoved,
}: RiskReferencesManagementViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const requestLeave = useLeaveGuard(viewMode === "create" || viewMode === "edit");
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
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(emptyCatalogFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState(emptyReferenceColumnFilters);
  const [columnSort, setColumnSort] = useState<{
    key: ReferenceColumnKey;
    direction: "asc" | "desc";
  } | null>(null);
  const [displayMode, setDisplayMode] = useState<"table" | "cards">("table");

  const sheets = useMemo(
    () => [...references, ...uniqueAwarenessSheets(references, awarenessRecords)],
    [references, awarenessRecords],
  );
  useEffect(() => {
    if (!openSheetFor || sheets.length === 0) return;
    const title = openSheetFor.title.trim().toLocaleLowerCase("fr");
    const sheet =
      sheets.find((item) => item.title.trim().toLocaleLowerCase("fr") === title) ??
      sheets.find((item) => sheetKey(item) === `${openSheetFor.numeroRisque}::${openSheetFor.title}`);
    if (!sheet) {
      toast.error("Aucune fiche du référentiel ne correspond à ce risque");
      onOpenSheetHandled?.();
      return;
    }
    setSelectedReference(sheet);
    setPreviewAttachmentId(sheet.attachments?.[0]?.id ?? null);
    setViewMode("consult");
    onOpenSheetHandled?.();
  }, [openSheetFor, sheets]);

  const numberOptions = useMemo(() => {
    const groups = new Map<string, string[]>();
    sheets.forEach((sheet) => {
      const titles = groups.get(sheet.numeroRisque) ?? [];
      if (sheet.title && !titles.includes(sheet.title)) titles.push(sheet.title);
      groups.set(sheet.numeroRisque, titles);
    });
    return [...groups.entries()]
      .sort(([left], [right]) => compareNumero(left, right))
      .map(([value, titles]) => ({
        value,
        label: titles.length > 0 ? `N° ${value} · ${titles.join(", ")}` : `N° ${value}`,
      }));
  }, [sheets]);

  const columnOptions = useMemo(() => {
    return Object.fromEntries(
      REFERENCE_COLUMNS.map((column) => {
        const seen = new Map<string, string>();
        sheets.forEach((sheet) => {
          const value = referenceColumnValue(sheet, column.key);
          if (!seen.has(value)) seen.set(value, referenceColumnLabel(column.key, value));
        });
        return [
          column.key,
          [...seen.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((left, right) => left.label.localeCompare(right.label, "fr", { numeric: true })),
        ];
      }),
    ) as Record<ReferenceColumnKey, Array<{ value: string; label: string }>>;
  }, [sheets]);

  const filteredReferences = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = sheets.filter((ref) => {
      const matchesSearch =
        !query ||
        ref.numeroRisque.toLowerCase().includes(query) ||
        ref.title.toLowerCase().includes(query) ||
        (ref.description ?? "").toLowerCase().includes(query) ||
        (ref.situations ?? "").toLowerCase().includes(query) ||
        (ref.dommages ?? "").toLowerCase().includes(query) ||
        (ref.prevention ?? "").toLowerCase().includes(query) ||
        resolveRiskReferenceFicheUrl(ref).toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (catalogFilters.numbers.length > 0 && !catalogFilters.numbers.includes(ref.numeroRisque)) {
        return false;
      }
      if (catalogFilters.inrs.length > 0) {
        const state = resolveRiskReferenceFicheUrl(ref) ? "disponible" : "absente";
        if (!catalogFilters.inrs.includes(state)) return false;
      }
      if (catalogFilters.pieces.length > 0) {
        const state = (ref.attachments?.length ?? 0) > 0 ? "avec" : "sans";
        if (!catalogFilters.pieces.includes(state)) return false;
      }
      return REFERENCE_COLUMNS.every((column) =>
        matchesReferenceColumn(ref, column.key, columnFilters[column.key]),
      );
    });

    const sortKey = columnSort?.key ?? "numero";
    const direction = columnSort?.direction ?? "asc";
    return [...result].sort((left, right) => {
      const leftValue = referenceColumnValue(left, sortKey);
      const rightValue = referenceColumnValue(right, sortKey);
      const kind = REFERENCE_COLUMNS.find((column) => column.key === sortKey)?.kind;
      const compared =
        kind === "number"
          ? (Number(leftValue) || 0) - (Number(rightValue) || 0)
          : referenceColumnLabel(sortKey, leftValue).localeCompare(
              referenceColumnLabel(sortKey, rightValue),
              "fr",
              { numeric: true, sensitivity: "base" },
            );
      return direction === "asc" ? compared : -compared;
    });
  }, [sheets, searchQuery, catalogFilters, columnFilters, columnSort]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    catalogFilters.numbers.length > 0 ||
    catalogFilters.inrs.length > 0 ||
    catalogFilters.pieces.length > 0;

  const hasActiveColumnFilters = REFERENCE_COLUMNS.some((column) =>
    columnFilterIsActive(columnFilters[column.key]),
  );

  const resetFilters = () => {
    setSearchQuery("");
    setCatalogFilters(emptyCatalogFilters());
    setListPage(1);
  };

  const patchCatalog = (partial: Partial<CatalogFilters>) => {
    setCatalogFilters((current) => ({ ...current, ...partial }));
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
  }, [searchQuery, catalogFilters, columnFilters]);

  const handleCreate = () => {
    setSelectedReference(null);
    setFormData({
      ...EMPTY_FORM,
      numeroRisque: nextRiskNumber(sheets.map((sheet) => sheet.numeroRisque)),
    });
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
    if (!referenceToDelete) return;

    if (referenceToDelete.startsWith(AWARENESS_PREFIX)) {
      const awarenessId = referenceToDelete.slice(AWARENESS_PREFIX.length);
      const record = awarenessRecords.find((item) => item.id === awarenessId);
      if (record) onReferenceRemoved?.(record.riskTitle);
      if (record && onAwarenessDeleted) onAwarenessDeleted(record);
      else {
        setAwarenessRecords?.((prev) => prev.filter((item) => item.id !== awarenessId));
      }
      toast.success("Fiche supprimée");
    } else {
      const removed = references.find((ref) => ref.id === referenceToDelete);
      if (removed) onReferenceRemoved?.(removed.title);
      setReferences(references.filter((ref) => ref.id !== referenceToDelete));
      if (removed) {
        const key = sheetKey(removed);
        awarenessRecords
          .filter((record) => record.riskKey === key)
          .forEach((record) => onAwarenessDeleted?.(record));
      }
      toast.success("Référence de risque supprimée");
    }

    setDeleteDialogOpen(false);
    setReferenceToDelete(null);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Veuillez renseigner le risque");
      return;
    }

    const editingAwareness = Boolean(selectedReference?.id.startsWith(AWARENESS_PREFIX));
    const nextNumber = viewMode === "create"
      ? nextRiskNumber(sheets.map((sheet) => sheet.numeroRisque))
      : (selectedReference?.numeroRisque ?? "").trim();
    if (!nextNumber) {
      toast.error("Le numéro de risque n'a pas pu être attribué");
      return;
    }
    const nextTitle = formData.title.trim();
    const numberAlreadyUsed = sheets.some(
      (sheet) =>
        sheet.numeroRisque.trim().toLowerCase() === nextNumber.toLowerCase() &&
        sheet.id !== selectedReference?.id,
    );
    if (numberAlreadyUsed) {
      toast.error("Ce numéro de risque existe déjà");
      return;
    }
    const duplicatesCatalog = references.some(
      (ref) => sheetKey(ref) === `${nextNumber}::${nextTitle}`,
    );
    if (editingAwareness && duplicatesCatalog) {
      toast.error("Cette fiche existe déjà dans le référentiel");
      return;
    }

    const ficheUrl = formData.ficheUrl.trim();
    if (ficheUrl && !isAllowedExternalUrl(ficheUrl)) {
      toast.error(getBlockedExternalLinkMessage(ficheUrl));
      return;
    }

    if (
      viewMode === "edit" &&
      selectedReference &&
      normalizeRiskTitle(selectedReference.title) !== normalizeRiskTitle(nextTitle)
    ) {
      onRenameLinkedRisks?.(selectedReference.title, nextTitle);
    }

    const sheet: Pick<
      RiskReference,
      "ficheUrl" | "description" | "situations" | "dommages" | "prevention" | "attachments"
    > = {
      ficheUrl,
      description: compactLines(formData.description),
      situations: compactLines(formData.situations),
      dommages: compactLines(formData.dommages),
      prevention: compactLines(formData.prevention),
      attachments: formData.attachments,
    };

    if (editingAwareness && selectedReference) {
      const awarenessId = selectedReference.id.slice(AWARENESS_PREFIX.length);
      const nextKey = `${nextNumber}::${nextTitle}`;
      const previousUrl = selectedReference.ficheUrl?.trim() || "";
      const hasContent = Boolean(
        sheet.description || sheet.situations || sheet.dommages || sheet.prevention || ficheUrl,
      );
      setAwarenessRecords?.((prev) =>
        prev.map((record) =>
          record.id === awarenessId
            ? {
                ...record,
                riskKey: nextKey,
                riskNumber: nextNumber,
                riskTitle: nextTitle,
                summary: sheet.description,
                situations: sheet.situations,
                dommages: sheet.dommages,
                content: sheet.prevention,
                links: [
                  ...(ficheUrl ? [ficheUrl] : []),
                  ...(record.links ?? []).filter(
                    (link) => link && link !== ficheUrl && link !== previousUrl,
                  ),
                ],
                documents: sheet.attachments.map((attachment) => ({
                  name: attachment.fileName,
                  dataUrl: attachment.dataUrl,
                  mimeType: attachment.mimeType,
                })),
                status: hasContent ? "complete" : "a_completer",
                updatedAt: new Date().toISOString(),
              }
            : record,
        ),
      );
      onAwarenessSaved?.(nextKey);
      toast.success("Fiche modifiée");
      setViewMode("list");
      setSelectedReference(null);
      return;
    }

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

  const renderFilterableTh = (key: ReferenceColumnKey) => {
    const column = REFERENCE_COLUMNS.find((item) => item.key === key);
    if (!column) return null;
    return (
      <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
        <div className="flex items-center gap-1">
          <span>{column.label}</span>
          {columnSort?.key === key ? (
            <span className="text-xs font-bold text-sky-700" aria-hidden>
              {columnSort.direction === "asc" ? "↑" : "↓"}
            </span>
          ) : null}
          <ColumnFilterPopover
            options={columnOptions[key]}
            filter={columnFilters[key]}
            kind={column.kind}
            sorted={columnSort?.key === key ? columnSort.direction : null}
            onApply={(filter) =>
              setColumnFilters((current) => ({ ...current, [key]: filter }))
            }
            onSort={(direction) => setColumnSort({ key, direction })}
            ariaLabel={`Filtrer la colonne ${column.label}`}
          />
        </div>
      </th>
    );
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
                Une fiche par risque, avec le lien INRS et les pièces jointes
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div
                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
                role="group"
                aria-label="Mode d'affichage"
              >
                <button
                  type="button"
                  aria-pressed={displayMode === "cards"}
                  onClick={() => setDisplayMode("cards")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    displayMode === "cards"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Cartes
                </button>
                <button
                  type="button"
                  aria-pressed={displayMode === "table"}
                  onClick={() => setDisplayMode("table")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    displayMode === "table"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  <Table2 className="h-4 w-4" aria-hidden />
                  Tableau
                </button>
              </div>
              {canManage ? (
              <Button
                onClick={handleCreate}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouvelle référence
              </Button>
              ) : null}
            </div>
          </div>

          <Card className="border-0 bg-white/80 shadow-xl backdrop-blur" role="region" aria-label="Filtres du référentiel">
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm"
                    placeholder="Rechercher (numéro, intitulé, contenu, lien...)"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-600">
                  {filteredReferences.length} fiche(s)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className="h-11 rounded-xl border-purple-200 bg-white px-4 text-purple-700 hover:bg-purple-50"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {filtersOpen ? "Masquer les filtres" : "Filtres"}
                </Button>
                {hasActiveFilters ? (
                  <Button type="button" variant="ghost" onClick={resetFilters} className="h-11 rounded-xl text-slate-600">
                    Réinitialiser
                  </Button>
                ) : null}
              </div>
              {filtersOpen ? (
                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 lg:grid-cols-3">
                  <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                    <MultiSelectFilter
                      label="N° risque"
                      wrapOptions
                      selected={catalogFilters.numbers}
                      onChange={(numbers) => patchCatalog({ numbers })}
                      options={numberOptions}
                      className="[&>p]:text-sm [&>p]:font-bold [&>p]:text-amber-950"
                    />
                  </section>
                  <section className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
                    <p className="text-sm font-bold text-sky-950">Fiche INRS</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "disponible", label: "Disponible" },
                        { value: "absente", label: "Non renseignée" },
                      ].map((option) => {
                        const active = catalogFilters.inrs.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              patchCatalog({
                                inrs: active
                                  ? catalogFilters.inrs.filter((item) => item !== option.value)
                                  : [...catalogFilters.inrs, option.value],
                              })
                            }
                            className={`h-11 rounded-xl border text-sm font-semibold ${
                              active
                                ? "border-sky-700 bg-sky-700 text-white"
                                : "border-white bg-white text-slate-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
                    <p className="text-sm font-bold text-violet-950">Pièces jointes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "avec", label: "Avec pièce" },
                        { value: "sans", label: "Aucune" },
                      ].map((option) => {
                        const active = catalogFilters.pieces.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              patchCatalog({
                                pieces: active
                                  ? catalogFilters.pieces.filter((item) => item !== option.value)
                                  : [...catalogFilters.pieces, option.value],
                              })
                            }
                            className={`h-11 rounded-xl border text-sm font-semibold ${
                              active
                                ? "border-violet-700 bg-violet-700 text-white"
                                : "border-white bg-white text-slate-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              ) : null}
            </CardContent>
          </Card>
          {hasActiveColumnFilters ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-purple-100 bg-white px-4 py-2">
              <p className="text-sm font-medium text-purple-700">
                Des filtres de colonnes sont actifs dans le tableau.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl text-slate-600"
                onClick={() => setColumnFilters(emptyReferenceColumnFilters())}
              >
                Réinitialiser les colonnes
              </Button>
            </div>
          ) : null}

          {displayMode === "cards" ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {paginatedReferences.map((reference) => {
                const ficheUrl = resolveRiskReferenceFicheUrl(reference);
                return (
                  <article
                    key={reference.id}
                    className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:shadow-md"
                    onClick={() => handleConsult(reference)}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500" />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-white px-2 text-lg font-bold tabular-nums text-slate-800 shadow-sm ring-1 ring-orange-100">
                          {reference.numeroRisque}
                        </span>
                        <h4 className="min-w-0 pt-1 text-lg font-semibold leading-snug text-slate-900">
                          {reference.title}
                        </h4>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {sheetExcerpt(reference)}
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <SheetInrs url={ficheUrl} presentation="card" />
                        <SheetPieces attachments={reference.attachments} presentation="card" />
                      </div>
                      <div
                        className={`mt-auto grid gap-2 pt-4 ${canManage ? "grid-cols-3" : "grid-cols-1"}`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleConsult(reference)}
                          className="h-10 w-full rounded-xl border-slate-200 bg-white px-2 text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="mr-2 h-4 w-4 shrink-0" />
                          Consulter
                        </Button>
                        {canManage ? (
                          <Button
                            type="button"
                            onClick={() => handleEdit(reference)}
                            className="h-10 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-2 text-white hover:from-purple-700 hover:to-indigo-700"
                          >
                            <Edit className="mr-2 h-4 w-4 shrink-0" />
                            Modifier
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDelete(reference.id)}
                            className="h-10 w-full rounded-xl border-rose-200 bg-rose-50 px-2 text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                            Supprimer
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
              {paginatedReferences.length === 0 ? (
                <p className="text-sm text-slate-500 xl:col-span-2">
                  {sheets.length === 0
                    ? "Aucune fiche enregistrée"
                    : "Aucune fiche ne correspond aux filtres"}
                </p>
              ) : null}
            </div>
          ) : null}

          {displayMode === "table" ? (
          <Card className="overflow-hidden border border-orange-100 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="border-b border-orange-100 bg-orange-50/50">
                    <tr>
                      {renderFilterableTh("numero")}
                      {renderFilterableTh("title")}
                      {renderFilterableTh("inrs")}
                      {renderFilterableTh("pieces")}
                      <th className="w-36 px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50">
                    {paginatedReferences.map((reference) => (
                      <tr
                        key={reference.id}
                        className="cursor-pointer align-middle transition-colors hover:bg-orange-50/40"
                        onClick={() => handleConsult(reference)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleConsult(reference);
                        }}
                        tabIndex={0}
                        aria-label={`Consulter ${reference.title}`}
                      >
                        <td className="px-4 py-4">
                          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-white px-2 text-base font-bold tabular-nums text-slate-800 shadow-sm ring-1 ring-orange-100">
                            {reference.numeroRisque}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold leading-snug text-slate-900">
                            {reference.title}
                          </p>
                          <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-5 text-slate-500">
                            {sheetExcerpt(reference)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <SheetInrs url={resolveRiskReferenceFicheUrl(reference)} presentation="card" />
                        </td>
                        <td className="px-4 py-4">
                          <SheetPieces attachments={reference.attachments} presentation="card" />
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className="flex flex-nowrap items-center gap-1.5"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              aria-label="Consulter"
                              title="Consulter"
                              onClick={() => handleConsult(reference)}
                              className="h-9 w-9 shrink-0 rounded-xl border-slate-200 bg-white p-0 text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManage ? (
                            <Button
                              type="button"
                              aria-label="Modifier"
                              title="Modifier"
                              onClick={() => handleEdit(reference)}
                              className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-0 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            ) : null}
                            {canManage ? (
                            <Button
                              type="button"
                              variant="outline"
                              aria-label="Supprimer"
                              title="Supprimer"
                              onClick={() => handleDelete(reference.id)}
                              className="h-9 w-9 shrink-0 rounded-xl border-rose-200 bg-rose-50 p-0 text-rose-700 shadow-sm hover:bg-rose-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedReferences.length === 0 && (
                      <tr>
                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                          {sheets.length === 0
                            ? "Aucune fiche enregistrée"
                            : "Aucune fiche ne correspond aux filtres"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          ) : null}

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
                La fiche disparaît du référentiel. Les risques liés restent dans l'évaluation, sans titre, avec la mention « Lié à aucun risque ».
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
    const linkedAwareness = awarenessRecords.find((record) =>
      reference.id.startsWith(AWARENESS_PREFIX)
        ? record.id === reference.id.slice(AWARENESS_PREFIX.length)
        : record.riskKey === sheetKey(reference),
    );
    const ownSheet = reference.id.startsWith(AWARENESS_PREFIX);
    const sheet = ownSheet
      ? {
          description: reference.description?.trim() || "",
          situations: reference.situations?.trim() || linkedAwareness?.location?.trim() || "",
          dommages: reference.dommages?.trim() || "",
          prevention: reference.prevention?.trim() || "",
        }
      : displayRiskSheet(reference);
    const extraLinks = (linkedAwareness?.links ?? []).filter(
      (link) => link.trim() && link.trim() !== ficheUrl,
    );
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
    ].filter((card) => card.value.trim());
    const attachments = reference.attachments ?? [];
    const attachmentCount = attachments.length;
    const preview =
      attachments.find((item) => item.id === previewAttachmentId) ?? attachments[0] ?? null;

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => requestLeave(() => setViewMode("list"))} className="w-full sm:w-auto">
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
          </div>
        </section>

        {cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
            Contenu à compléter.
          </p>
        ) : (
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
        )}

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

        {extraLinks.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700">Autres liens</h4>
            <ul className="mt-3 space-y-2">
              {extraLinks.map((link) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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

  const shownNumber = viewMode === "create"
    ? nextRiskNumber(sheets.map((sheet) => sheet.numeroRisque))
    : selectedReference?.numeroRisque ?? "";
  const inputClass = "h-11 rounded-xl border-slate-200 bg-white text-base shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => requestLeave(() => setViewMode("list"))} className="h-11 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              {viewMode === "create" ? "Nouvelle fiche" : "Modifier la fiche"}
            </h3>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur">
        <div className="h-2 bg-gradient-to-r from-orange-400 to-amber-500" />
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="inline-flex h-14 min-w-14 items-center justify-center rounded-xl bg-white px-3 text-2xl font-bold tabular-nums text-slate-800 shadow-sm">
              {shownNumber}
            </span>
            <p className="text-sm font-semibold text-slate-900">Numéro de risque</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Risque</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="Nom du risque"
              className={inputClass}
              required
            />
          </div>

          <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <h2 className="flex items-center gap-3 text-sm font-bold text-amber-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <FileText className="h-4 w-4" />
              </span>
              De quoi s'agit-il
            </h2>
            <EntryListField
              id="description"
              value={formData.description}
              onChange={(description) => setFormData((prev) => ({ ...prev, description }))}
              placeholder="Point"
              addLabel="Ajouter un point"
              tone="amber"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
            <h2 className="flex items-center gap-3 text-sm font-bold text-orange-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Où ça se présente
            </h2>
            <EntryListField
              id="situations"
              value={formData.situations}
              onChange={(situations) => setFormData((prev) => ({ ...prev, situations }))}
              placeholder="Situation"
              addLabel="Ajouter une situation"
              tone="orange"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
            <h2 className="flex items-center gap-3 text-sm font-bold text-rose-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
                <HeartPulse className="h-4 w-4" />
              </span>
              Ce qui peut arriver
            </h2>
            <EntryListField
              id="dommages"
              value={formData.dommages}
              onChange={(dommages) => setFormData((prev) => ({ ...prev, dommages }))}
              placeholder="Dommage"
              addLabel="Ajouter un dommage"
              tone="rose"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <h2 className="flex items-center gap-3 text-sm font-bold text-emerald-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Shield className="h-4 w-4" />
              </span>
              Comment s'en protéger
            </h2>
            <EntryListField
              id="prevention"
              value={formData.prevention}
              onChange={(prevention) => setFormData((prev) => ({ ...prev, prevention }))}
              placeholder="Mesure"
              addLabel="Ajouter une mesure"
              tone="emerald"
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-sky-950">
              <ExternalLink className="h-4 w-4" />
              Fiche INRS
            </h2>
            <Input
              id="ficheUrl"
              type="url"
              value={formData.ficheUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ficheUrl: e.target.value }))
              }
              placeholder="https://www.inrs.fr/risques/..."
              className={inputClass}
            />
            {formData.ficheUrl.trim() && isAllowedExternalUrl(formData.ficheUrl.trim()) ? (
              <a
                href={formData.ficheUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-sky-800 underline-offset-2 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Ouvrir la fiche
              </a>
            ) : (
              <p className="text-sm text-sky-900/70">
                Adresse du dossier INRS. Laissez vide s'il n'en existe pas.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-violet-950">
              <Paperclip className="h-4 w-4" />
              Pièces jointes
            </h2>
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
              <p className="text-sm text-violet-900/70">Aucune pièce jointe pour cette fiche.</p>
            )}
          </section>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => requestLeave(() => setViewMode("list"))}
              className="h-11 w-full rounded-xl sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 sm:w-auto"
            >
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
