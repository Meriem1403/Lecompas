import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLeaveGuard } from "@/app/components/leaveGuard";
import { isBackendApiEnabled } from "@/app/config/dataBackend";
import { isApiAccessToken } from "@/lib/apiClient";
import {
  APP_DATA_KEYS,
  fetchAppData,
  saveAppData,
} from "@/app/services/appDataApi";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { Activity, AlertTriangle, ArrowLeft, Building2, Calendar, CalendarDays, CheckCircle2, Download, Edit3, Eye, FileText, Layers, LayoutGrid, MapPin, PlusCircle, Search, Shield, Siren, SlidersHorizontal, Table2, Trash2, Upload, User } from "lucide-react";
import { ColumnFilterPopover } from "@/app/components/ui/column-filter-popover";
import { MultiSelectFilter } from "@/app/components/ui/multi-select-filter";
import { cn } from "@/lib/utils";
import {
  emptyColumnFilterState,
  type ColumnFilterKind,
  type ColumnFilterState,
} from "@/app/utils/riskManagementFilterLogic";
import { toast } from "sonner";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import {
  loadDeletedProtocols,
  loadSafetyProtocols,
  saveDeletedProtocols,
  saveSafetyProtocols,
  type ProtocolAttachment,
} from "@/app/utils/lecompasStorage";

type ProtocolStatus = "brouillon" | "valide" | "signe";

interface ProtocolRecord {
  id: string;
  title: string;
  operationType: string;
  service: string;
  domain: string;
  location: string;
  entreprise1: string;
  entreprise2: string;
  responsable: string;
  date: string;
  status: ProtocolStatus;
  risques: string;
  mesures: string;
  urgence: string;
  signatures: string;
  circulation: string;
  documents: string[];
  attachments?: ProtocolAttachment[];
  signatureDematerialiseeUrl?: string;
}

interface DeletedProtocolRecord {
  deletedAt: string;
  protocol: ProtocolRecord;
}

interface SafetyProtocolViewProps {
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
  currentUserService: string;
  currentUserDomain: string;
  currentUserLocation: string;
  serviceOptions: string[];
  domainOptions: string[];
  locationOptions: string[];
  accessToken?: string;
}

type ViewMode = "list" | "detail" | "create" | "edit";

const statusLabel: Record<ProtocolStatus, string> = {
  brouillon: "Brouillon",
  valide: "Valide",
  signe: "Signé",
};

function protocolProgress(protocol: Pick<ProtocolRecord, "risques" | "mesures" | "urgence" | "signatures" | "circulation">) {
  return [protocol.risques, protocol.mesures, protocol.urgence, protocol.signatures, protocol.circulation].filter((part) => part?.trim()).length;
}

function formatProtocolDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((value || "").trim());
  if (!match) return value || "Non renseignée";
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ProtocolDateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative w-full">
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="relative h-11 w-full rounded-xl border border-indigo-200 bg-white pl-3 pr-10 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" aria-hidden />
    </div>
  );
}

function withCurrentChoice(options: string[], current: string) {
  const value = current.trim();
  if (!value || options.includes(value)) return options;
  return [value, ...options];
}

const protocolSelectClass = "h-11 w-full rounded-xl border-indigo-200 bg-white py-0 shadow-sm data-[size=default]:h-11";
const protocolInputClass = "h-11 rounded-xl border-indigo-200 bg-white shadow-sm focus-visible:border-indigo-500 focus-visible:ring-indigo-100";
const protocolTextareaClass = "min-h-[96px] rounded-xl border-indigo-200 bg-white shadow-sm focus-visible:border-indigo-500 focus-visible:ring-indigo-100";

const statusClass: Record<ProtocolStatus, string> = {
  brouillon: "bg-amber-100 text-amber-800 border-amber-300",
  valide: "bg-blue-100 text-blue-800 border-blue-300",
  signe: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

type ProtocolColumnKey = "title" | "operation" | "service" | "domain" | "location" | "entreprises" | "responsable" | "date" | "status" | "progress";
type ProtocolColumnFacts = Record<ProtocolColumnKey, string>;
type ProtocolListFilters = {
  statuses: ProtocolStatus[];
  services: string[];
  domains: string[];
  locations: string[];
  operations: string[];
  responsables: string[];
  entreprises: string[];
};

const emptyProtocolListFilters = (): ProtocolListFilters => ({
  statuses: [],
  services: [],
  domains: [],
  locations: [],
  operations: [],
  responsables: [],
  entreprises: [],
});

const PROTOCOL_COLUMNS: Array<{ key: ProtocolColumnKey; label: string; kind: ColumnFilterKind }> = [
  { key: "title", label: "Protocole", kind: "text" },
  { key: "operation", label: "Opération", kind: "text" },
  { key: "service", label: "Service", kind: "text" },
  { key: "domain", label: "Domaine", kind: "text" },
  { key: "location", label: "Lieu", kind: "text" },
  { key: "entreprises", label: "Entreprises", kind: "text" },
  { key: "responsable", label: "Responsable", kind: "text" },
  { key: "date", label: "Date", kind: "date" },
  { key: "status", label: "Statut", kind: "text" },
  { key: "progress", label: "Avancement", kind: "number" },
];

function emptyProtocolColumnFilters(): Record<ProtocolColumnKey, ColumnFilterState> {
  return {
    title: emptyColumnFilterState(),
    operation: emptyColumnFilterState(),
    service: emptyColumnFilterState(),
    domain: emptyColumnFilterState(),
    location: emptyColumnFilterState(),
    entreprises: emptyColumnFilterState(),
    responsable: emptyColumnFilterState(),
    date: emptyColumnFilterState(),
    status: emptyColumnFilterState(),
    progress: emptyColumnFilterState(),
  };
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, "fr"));
}

function buildProtocolColumnFacts(protocol: ProtocolRecord): ProtocolColumnFacts {
  return {
    title: protocol.title.trim(),
    operation: protocol.operationType.trim(),
    service: protocol.service.trim() || "Non renseigné",
    domain: protocol.domain.trim() || "Non renseigné",
    location: protocol.location.trim() || "Non renseigné",
    entreprises: [protocol.entreprise1, protocol.entreprise2].map((value) => value.trim()).filter(Boolean).join(" · ") || "Non renseignée",
    responsable: protocol.responsable.trim() || "Non renseigné",
    date: /^(\d{4}-\d{2}-\d{2})/.exec(protocol.date.trim())?.[1] || "",
    status: statusLabel[protocol.status],
    progress: String(protocolProgress(protocol)),
  };
}

function protocolColumnLabel(key: ProtocolColumnKey, value: string) {
  if (key === "date") return formatProtocolDate(value);
  if (key === "progress") return `${value || "0"}/5`;
  return value.trim() || "(vide)";
}

function protocolColumnFilterActive(filter: ColumnFilterState) {
  return filter.values !== null || (filter.operator !== "none" && filter.query.trim().length > 0);
}

function parseProtocolFilterDate(value: string) {
  const french = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (french) return `${french[3]}-${french[2].padStart(2, "0")}-${french[1].padStart(2, "0")}`;
  return value.trim().slice(0, 10);
}

function matchesProtocolColumn(facts: ProtocolColumnFacts, key: ProtocolColumnKey, filter: ColumnFilterState) {
  const value = facts[key];
  if (filter.values !== null && !filter.values.includes(value)) return false;
  if (filter.operator === "none" || !filter.query.trim()) return true;
  const kind = PROTOCOL_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  const displayed = protocolColumnLabel(key, value).toLocaleLowerCase("fr");
  const query = filter.query.trim().toLocaleLowerCase("fr");
  if (kind === "number") {
    const current = Number(value.replace(",", "."));
    const min = Number(filter.query.trim().replace(",", "."));
    const max = Number(filter.queryTo.trim().replace(",", "."));
    if (!Number.isFinite(current) || !Number.isFinite(min)) return false;
    if (filter.operator === "equals") return current === min;
    if (filter.operator === "notEquals") return current !== min;
    if (filter.operator === "gt") return current > min;
    if (filter.operator === "gte") return current >= min;
    if (filter.operator === "lt") return current < min;
    if (filter.operator === "lte") return current <= min;
    if (filter.operator === "between") return Number.isFinite(max) && current >= Math.min(min, max) && current <= Math.max(min, max);
    return displayed.includes(query);
  }
  if (kind === "date") {
    const current = parseProtocolFilterDate(value);
    const min = parseProtocolFilterDate(filter.query);
    const max = parseProtocolFilterDate(filter.queryTo);
    if (!current || !min) return false;
    if (filter.operator === "equals") return current === min;
    if (filter.operator === "notEquals") return current !== min;
    if (filter.operator === "gt") return current > min;
    if (filter.operator === "lt") return current < min;
    if (filter.operator === "between") return Boolean(max) && current >= (min < max ? min : max) && current <= (min < max ? max : min);
    return displayed.includes(query);
  }
  if (filter.operator === "equals") return displayed === query;
  if (filter.operator === "notEquals") return displayed !== query;
  if (filter.operator === "startsWith") return displayed.startsWith(query);
  if (filter.operator === "endsWith") return displayed.endsWith(query);
  if (filter.operator === "notContains") return !displayed.includes(query);
  return displayed.includes(query);
}

function compareProtocolColumn(left: string, right: string, key: ProtocolColumnKey) {
  const kind = PROTOCOL_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  if (kind === "number") {
    const delta = Number(left) - Number(right);
    if (Number.isFinite(delta) && delta !== 0) return delta;
  }
  if (kind === "date") return parseProtocolFilterDate(left).localeCompare(parseProtocolFilterDate(right));
  return protocolColumnLabel(key, left).localeCompare(protocolColumnLabel(key, right), "fr", { numeric: true, sensitivity: "base" });
}

const defaultProtocols: ProtocolRecord[] = [
  {
    id: "proto-2024-03-19",
    title: "Protocole de sécurité - Manutention cabestan 700 kg",
    operationType: "Chargement / déchargement",
    service: "Sécurité",
    domain: "Phares et balises",
    location: "Quai du commerce - Ajaccio",
    entreprise1: "Armement des Phares et Balises (APB)",
    entreprise2: "Société Insulaire Pétrolière (SIP)",
    responsable: "M. Vincent Crumiere",
    date: "2024-03-19",
    status: "signe",
    risques: "Risque manutention mécanique et au levage",
    mesures: "Port des EPI, suivi des élingues, CACES et vérifications périodiques des appareils de levage.",
    urgence: "SAMU 15, Pompiers 18, Police/Gendarmerie 17, numéro unique 112.",
    signatures: "DIRM Med / SPBM / COB Ajaccio, APB, SIP",
    circulation: "Zone de manutention quai du commerce (cf plan de circulation).",
    documents: [],
    attachments: [],
  },
];

export function SafetyProtocolView({
  currentUserRole,
  currentUserName,
  currentUserService,
  currentUserDomain,
  currentUserLocation,
  serviceOptions,
  domainOptions,
  locationOptions,
  accessToken = "",
}: SafetyProtocolViewProps) {
  const protocolsSkipRef = useRef(false);
  const deletedProtocolsSkipRef = useRef(false);
  const [protocols, setProtocols] = useState<ProtocolRecord[]>(
    () => loadSafetyProtocols() ?? defaultProtocols,
  );
  const [deletedProtocols, setDeletedProtocols] = useState<DeletedProtocolRecord[]>(
    () => loadDeletedProtocols() ?? [],
  );

  useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      return;
    }
    protocolsSkipRef.current = true;
    deletedProtocolsSkipRef.current = true;
    void (async () => {
      try {
        const [fromApiProtocols, fromApiDeleted] = await Promise.all([
          fetchAppData<ProtocolRecord[]>(
            APP_DATA_KEYS.safetyProtocols,
            accessToken,
          ),
          fetchAppData<DeletedProtocolRecord[]>(
            APP_DATA_KEYS.deletedProtocols,
            accessToken,
          ),
        ]);
        if (fromApiProtocols && fromApiProtocols.length > 0) {
          setProtocols(fromApiProtocols);
        } else {
          const local = loadSafetyProtocols() ?? defaultProtocols;
          setProtocols(local);
          protocolsSkipRef.current = false;
          await saveAppData(APP_DATA_KEYS.safetyProtocols, local, accessToken);
          protocolsSkipRef.current = true;
        }
        if (fromApiDeleted) {
          setDeletedProtocols(fromApiDeleted);
        }
      } catch (error) {
        console.warn("[Lecompas] chargement protocoles API", error);
      }
    })();
  }, [accessToken]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const requestLeave = useLeaveGuard(viewMode === "create" || viewMode === "edit");
  const [query, setQuery] = useState("");
  const [listFilters, setListFilters] = useState<ProtocolListFilters>(emptyProtocolListFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState(emptyProtocolColumnFilters);
  const [columnSort, setColumnSort] = useState<{ key: ProtocolColumnKey; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ProtocolRecord | null>(null);
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");
  const pageSize = displayMode === "table" ? TABLE_LIST_PAGE_SIZE : 6;
  const [form, setForm] = useState({
    title: "",
    operationType: "Chargement / déchargement",
    service: currentUserService || serviceOptions[0] || "",
    domain: currentUserDomain || domainOptions[0] || "",
    location: currentUserLocation || locationOptions[0] || "",
    entreprise1: "Armement des Phares et Balises (APB)",
    entreprise2: "",
    responsable: currentUserName,
    date: new Date().toISOString().slice(0, 10),
    status: "brouillon" as ProtocolStatus,
    risques: "",
    mesures: "",
    urgence: "SAMU 15, Pompiers 18, Police/Gendarmerie 17, numéro unique 112.",
    signatures: "",
    circulation: "",
    docsText: "",
  });
  const [docDraft, setDocDraft] = useState("");
  const [formAttachments, setFormAttachments] = useState<ProtocolAttachment[]>([]);
  const [signatureDematerialiseeUrl, setSignatureDematerialiseeUrl] = useState("");
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUserRole !== "agent";

  const protocolFacts = useMemo(() => {
    const facts = new Map<string, ProtocolColumnFacts>();
    protocols.forEach((protocol) => facts.set(protocol.id, buildProtocolColumnFacts(protocol)));
    return facts;
  }, [protocols]);

  const columnOptions = useMemo(() => {
    return Object.fromEntries(
      PROTOCOL_COLUMNS.map((column) => {
        const seen = new Map<string, string>();
        protocols.forEach((protocol) => {
          const value = protocolFacts.get(protocol.id)?.[column.key] ?? "";
          if (!seen.has(value)) seen.set(value, protocolColumnLabel(column.key, value));
        });
        return [column.key, [...seen.entries()].map(([value, label]) => ({ value, label })).sort((left, right) => left.label.localeCompare(right.label, "fr", { numeric: true }))];
      }),
    ) as Record<ProtocolColumnKey, Array<{ value: string; label: string }>>;
  }, [protocols, protocolFacts]);

  const visibleProtocols = useMemo(() => {
    const filtered = protocols.filter((protocol) => {
      const facts = protocolFacts.get(protocol.id);
      if (listFilters.statuses.length > 0 && !listFilters.statuses.includes(protocol.status)) return false;
      if (listFilters.services.length > 0 && !listFilters.services.includes(protocol.service)) return false;
      if (listFilters.domains.length > 0 && !listFilters.domains.includes(protocol.domain)) return false;
      if (listFilters.locations.length > 0 && !listFilters.locations.includes(protocol.location)) return false;
      if (listFilters.operations.length > 0 && !listFilters.operations.includes(protocol.operationType)) return false;
      if (listFilters.responsables.length > 0 && !listFilters.responsables.includes(protocol.responsable)) return false;
      if (listFilters.entreprises.length > 0 && !listFilters.entreprises.some((name) => name === protocol.entreprise1 || name === protocol.entreprise2)) return false;
      if (facts && !PROTOCOL_COLUMNS.every((column) => matchesProtocolColumn(facts, column.key, columnFilters[column.key]))) return false;
      const lower = query.trim().toLowerCase();
      if (!lower) return true;
      return [protocol.title, protocol.operationType, protocol.location, protocol.service, protocol.domain, protocol.entreprise1, protocol.entreprise2, protocol.responsable]
        .join(" ")
        .toLowerCase()
        .includes(lower);
    });
    if (!columnSort) return filtered;
    return [...filtered].sort((left, right) => {
      const compared = compareProtocolColumn(protocolFacts.get(left.id)?.[columnSort.key] ?? "", protocolFacts.get(right.id)?.[columnSort.key] ?? "", columnSort.key);
      return columnSort.direction === "asc" ? compared : -compared;
    });
  }, [protocols, protocolFacts, query, listFilters, columnFilters, columnSort]);

  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedId) || null;
  const signedCount = visibleProtocols.filter((protocol) => protocol.status === "signe").length;
  const draftCount = visibleProtocols.filter((protocol) => protocol.status === "brouillon").length;
  const listFiltersActive = Boolean(query.trim()) || Object.values(listFilters).some((values) => values.length > 0);
  const columnFiltersActive = PROTOCOL_COLUMNS.some((column) => protocolColumnFilterActive(columnFilters[column.key]));
  const formCompletion = [form.title, form.service, form.domain, form.location, form.entreprise1, form.entreprise2, form.risques, form.mesures, form.urgence, form.signatures, form.circulation].filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(visibleProtocols.length / pageSize));
  const paginatedProtocols = useMemo(
    () => visibleProtocols.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visibleProtocols, currentPage],
  );

  const resetForm = () => {
    setForm({
      title: "",
      operationType: "Chargement / déchargement",
      service: currentUserService || serviceOptions[0] || "",
      domain: currentUserDomain || domainOptions[0] || "",
      location: currentUserLocation || locationOptions[0] || "",
      entreprise1: "Armement des Phares et Balises (APB)",
      entreprise2: "",
      responsable: currentUserName,
      date: new Date().toISOString().slice(0, 10),
      status: "brouillon",
      risques: "",
      mesures: "",
      urgence: "SAMU 15, Pompiers 18, Police/Gendarmerie 17, numéro unique 112.",
      signatures: "",
      circulation: "",
      docsText: "",
    });
    setDocDraft("");
    setFormAttachments([]);
    setSignatureDematerialiseeUrl("");
  };

  const openCreate = () => {
    resetForm();
    setSelectedId(null);
    setViewMode("create");
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setViewMode("detail");
  };

  const openEdit = (protocol: ProtocolRecord) => {
    setSelectedId(protocol.id);
    setForm({
      title: protocol.title,
      operationType: protocol.operationType,
      service: protocol.service,
      domain: protocol.domain,
      location: protocol.location,
      entreprise1: protocol.entreprise1,
      entreprise2: protocol.entreprise2,
      responsable: currentUserName,
      date: protocol.date,
      status: protocol.status,
      risques: protocol.risques,
      mesures: protocol.mesures,
      urgence: protocol.urgence,
      signatures: protocol.signatures,
      circulation: protocol.circulation,
      docsText: (protocol.documents || []).join("\n"),
    });
    setFormAttachments(protocol.attachments || []);
    setSignatureDematerialiseeUrl(protocol.signatureDematerialiseeUrl || "");
    setDocDraft("");
    setViewMode("edit");
  };

  const saveForm = () => {
    if (!form.title.trim()) return;
    const documents = form.docsText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);

    if (viewMode === "edit" && selectedId) {
      setProtocols((prev) =>
        prev.map((protocol) =>
          protocol.id === selectedId
            ? {
                ...protocol,
                ...form,
                documents,
                attachments: formAttachments,
                signatureDematerialiseeUrl,
                responsable: currentUserName,
              }
            : protocol,
        ),
      );
      toast.success("Protocole modifié.");
    } else {
      setProtocols((prev) => [
        {
          id: `proto-custom-${Date.now()}`,
          ...form,
          documents,
          attachments: formAttachments,
          signatureDematerialiseeUrl,
          responsable: currentUserName,
        },
        ...prev,
      ]);
      toast.success("Protocole créé.");
    }

    setViewMode("list");
    setSelectedId(null);
    resetForm();
  };

  const deleteProtocol = (id: string) => {
    const protocol = protocols.find((item) => item.id === id) ?? (pendingDelete?.id === id ? pendingDelete : null);
    if (!protocol) return;
    setDeletedProtocols((prev) => [
      { deletedAt: new Date().toISOString(), protocol },
      ...prev,
    ]);
    setProtocols((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setViewMode("list");
    }
    setPendingDelete(null);
    toast.success("Protocole supprimé.");
  };

  const protocolDeleteDialog = (
    <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce protocole ?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {pendingDelete ? <span className="mb-2 block font-medium text-slate-900">{pendingDelete.title}</span> : null}
            Il sera placé dans la corbeille pendant 7 jours. Vous pourrez le restaurer avant cette échéance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              if (!pendingDelete) return;
              deleteProtocol(pendingDelete.id);
            }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const restoreProtocol = (id: string) => {
    const deleted = deletedProtocols.find((item) => item.protocol.id === id);
    if (!deleted) return;
    setProtocols((prev) => [deleted.protocol, ...prev]);
    setDeletedProtocols((prev) => prev.filter((item) => item.protocol.id !== id));
    toast.success("Protocole restauré.");
  };

  const handleDownloadProtocol = async (protocol: ProtocolRecord) => {
    try {
      const { downloadSafetyProtocolVisualPdf } = await import("./safetyProtocolVisualPdf");
      await downloadSafetyProtocolVisualPdf(protocol);
      toast.success("PDF téléchargé.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de générer le PDF.");
    }
  };

  useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, [viewMode, selectedId]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, listFilters, columnFilters, columnSort, displayMode]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveSafetyProtocols(protocols);
      return;
    }
    if (protocolsSkipRef.current) {
      protocolsSkipRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(
        APP_DATA_KEYS.safetyProtocols,
        protocols,
        accessToken,
      ).catch((error) => {
        console.error("[Lecompas] sync protocoles API", error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [protocols, accessToken]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveDeletedProtocols(deletedProtocols);
      return;
    }
    if (deletedProtocolsSkipRef.current) {
      deletedProtocolsSkipRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(
        APP_DATA_KEYS.deletedProtocols,
        deletedProtocols,
        accessToken,
      ).catch((error) => {
        console.error("[Lecompas] sync corbeille protocoles API", error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [deletedProtocols, accessToken]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      setDeletedProtocols((prev) =>
        prev.filter((item) => now - new Date(item.deletedAt).getTime() < ONE_WEEK_MS),
      );
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const renderFilterableTh = (key: ProtocolColumnKey) => {
    const column = PROTOCOL_COLUMNS.find((item) => item.key === key);
    if (!column) return null;
    return (
      <th key={key} className="px-3 py-3 text-left align-bottom">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide">{column.label}</span>
          {columnSort?.key === key ? <span className="text-xs font-bold text-purple-700" aria-hidden>{columnSort.direction === "asc" ? "↑" : "↓"}</span> : null}
          <ColumnFilterPopover
            options={columnOptions[key]}
            filter={columnFilters[key]}
            kind={column.kind}
            sorted={columnSort?.key === key ? columnSort.direction : null}
            onApply={(filter) => setColumnFilters((current) => ({ ...current, [key]: filter }))}
            onSort={(direction) => setColumnSort({ key, direction })}
            ariaLabel={`Filtrer la colonne ${column.label}`}
          />
        </div>
      </th>
    );
  };

  if ((viewMode === "create" || viewMode === "edit") && canEdit) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {viewMode === "create" ? "Nouveau protocole de sécurité" : "Modifier le protocole de sécurité"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">Chargement, déchargement et opérations de levage.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {viewMode === "create" ? "Création du protocole" : "Édition du protocole"}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{form.operationType || "Type d'opération non renseigné"}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl shadow-lg border border-gray-200 text-gray-800 space-y-4">
                <h3 className="text-xl font-bold flex items-center mb-2 text-gray-700">
                  <Building2 className="h-5 w-5 mr-2" />
                  Identification du protocole
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Titre du protocole *</Label>
                    <Input className={protocolInputClass} placeholder="Ex: Manutention cabestan 700kg" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type d'opération</Label>
                    <Input className={protocolInputClass} placeholder="Chargement / Déchargement / Héliportage" value={form.operationType} onChange={(e) => setForm((prev) => ({ ...prev, operationType: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsable (utilisateur connecté)</Label>
                    <Input className="h-11 rounded-xl border-indigo-200 bg-indigo-50 text-slate-700 shadow-sm" value={form.responsable} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <ProtocolDateField value={form.date} onChange={(value) => setForm((prev) => ({ ...prev, date: value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={form.service} onValueChange={(value) => setForm((prev) => ({ ...prev, service: value }))}>
                      <SelectTrigger className={protocolSelectClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {withCurrentChoice(serviceOptions, form.service).map((service) => (
                          <SelectItem key={service} value={service}>{service}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Domaine</Label>
                    <Select value={form.domain} onValueChange={(value) => setForm((prev) => ({ ...prev, domain: value }))}>
                      <SelectTrigger className={protocolSelectClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {withCurrentChoice(domainOptions, form.domain).map((domain) => (
                          <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lieux</Label>
                    <Select value={form.location} onValueChange={(value) => setForm((prev) => ({ ...prev, location: value }))}>
                      <SelectTrigger className={protocolSelectClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {withCurrentChoice(locationOptions, form.location).map((location) => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={form.status} onValueChange={(value: ProtocolStatus) => setForm((prev) => ({ ...prev, status: value }))}>
                      <SelectTrigger className={protocolSelectClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="signe">Signé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                  Entreprises concernées (Sections 1 et 2)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entreprise APB</Label>
                    <Input className={protocolInputClass} value={form.entreprise1} onChange={(e) => setForm((prev) => ({ ...prev, entreprise1: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Société intervenante</Label>
                    <Input className={protocolInputClass} value={form.entreprise2} onChange={(e) => setForm((prev) => ({ ...prev, entreprise2: e.target.value }))} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                  Évaluation des risques (Section 4)
                </h4>
                <Textarea className={protocolTextareaClass} placeholder="Domaine, nature des risques, circonstances..." value={form.risques} onChange={(e) => setForm((prev) => ({ ...prev, risques: e.target.value }))} />
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Mesures de prévention
                </h4>
                <Textarea className={protocolTextareaClass} placeholder="EPI, consignes, habilitations, vérifications périodiques..." value={form.mesures} onChange={(e) => setForm((prev) => ({ ...prev, mesures: e.target.value }))} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Siren className="h-4 w-4 mr-2 text-red-500" />
                    Premiers secours (Section 5)
                  </h4>
                  <Textarea className={protocolTextareaClass} value={form.urgence} onChange={(e) => setForm((prev) => ({ ...prev, urgence: e.target.value }))} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-violet-500" />
                    Signatures (Section 8)
                  </h4>
                  <Textarea className={protocolTextareaClass} value={form.signatures} onChange={(e) => setForm((prev) => ({ ...prev, signatures: e.target.value }))} />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 800 * 1024) {
                          toast.error("Image de signature trop volumineuse (max. 800 Ko).");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setSignatureDematerialiseeUrl(String(reader.result || ""));
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => signatureInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Joindre une signature (image)
                    </Button>
                    {signatureDematerialiseeUrl ? (
                      <Button type="button" variant="ghost" className="text-red-600" onClick={() => setSignatureDematerialiseeUrl("")}>
                        Retirer la signature
                      </Button>
                    ) : null}
                  </div>
                  {signatureDematerialiseeUrl ? (
                    <img src={signatureDematerialiseeUrl} alt="Aperçu signature" className="mt-2 max-h-24 rounded border border-slate-200" />
                  ) : null}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                    Plan de circulation / déchargement (Section 10)
                  </h4>
                  <Textarea className={protocolTextareaClass} value={form.circulation} onChange={(e) => setForm((prev) => ({ ...prev, circulation: e.target.value }))} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-violet-500" />
                    Documents associés
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                    <Input
                      className={protocolInputClass}
                      placeholder="Nom du document / lien partagé"
                      value={docDraft}
                      onChange={(e) => setDocDraft(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const value = docDraft.trim();
                        if (!value) return;
                        const current = form.docsText
                          .split("\n")
                          .map((v) => v.trim())
                          .filter(Boolean);
                        if (current.includes(value)) return;
                        setForm((prev) => ({
                          ...prev,
                          docsText: [...current, value].join("\n"),
                        }));
                        setDocDraft("");
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {form.docsText
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .map((doc) => (
                        <div key={doc} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                          <span className="truncate">{doc}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                docsText: prev.docsText
                                  .split("\n")
                                  .map((v) => v.trim())
                                  .filter(Boolean)
                                  .filter((v) => v !== doc)
                                  .join("\n"),
                              }))
                            }
                          >
                            Retirer
                          </Button>
                        </div>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files?.length) return;
                        Array.from(files).forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setFormAttachments((prev) => [
                              ...prev,
                              {
                                id: crypto.randomUUID(),
                                fileName: file.name,
                                mimeType: file.type || "application/octet-stream",
                                dataUrl: String(reader.result || ""),
                                sizeBytes: file.size,
                              },
                            ]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => attachmentInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Joindre un fichier
                    </Button>
                  </div>
                  {formAttachments.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {formAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50 p-2 text-sm">
                          <span className="truncate">{att.fileName}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              setFormAttachments((prev) => prev.filter((item) => item.id !== att.id))
                            }
                          >
                            Retirer
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                  Avancement formulaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${(formCompletion / 11) * 100}%` }} />
                </div>
                <p className="text-sm text-gray-600">{formCompletion}/11 champs principaux renseignés</p>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {statusLabel[form.status]}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Résumé rapide</CardTitle>
                <CardDescription className="text-slate-300">Prévisualisation proche de la vue consultation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Titre</p>
                  <p className="font-semibold mt-1">{form.title || "Non renseigné"}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Responsable</p>
                  <p className="font-semibold mt-1">{form.responsable || "-"}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Site</p>
                  <p className="font-semibold mt-1">{form.location || "-"}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Service / Domaine</p>
                  <p className="font-semibold mt-1">{form.service || "-"}</p>
                  <p className="font-semibold mt-1">{form.domain || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => requestLeave(() => setViewMode("list"))}
            className="h-11 w-full rounded-xl border-indigo-200 bg-white text-indigo-950 hover:bg-indigo-50 sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
          <Button onClick={saveForm} className="h-11 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 sm:w-auto">
            {viewMode === "create" ? "Enregistrer le protocole" : "Mettre à jour le protocole"}
          </Button>
        </div>
      </div>
    );
  }

  if (viewMode === "detail" && selectedProtocol) {
    return (
      <div className="space-y-5 p-3 sm:p-6">
        <div>
          <h1 className="break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Consultation du protocole</h1>
          <p className="mt-1 text-sm text-slate-500">Code du travail, articles R4515-4 à R4515-11</p>
        </div>
        <article className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="flex flex-col gap-3 border-b border-indigo-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Button
              variant="outline"
              onClick={() => requestLeave(() => setViewMode("list"))}
              className="h-10 w-full rounded-xl border-indigo-200 bg-white text-indigo-950 hover:bg-indigo-50 sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="grid w-full grid-cols-1 gap-2 min-[520px]:grid-cols-3 sm:flex sm:w-auto sm:justify-end">
              <Button
                variant="outline"
                onClick={() => handleDownloadProtocol(selectedProtocol)}
                className="h-10 rounded-xl border-indigo-200 bg-white text-indigo-950 hover:bg-indigo-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
              {canEdit ? (
                <Button
                  onClick={() => openEdit(selectedProtocol)}
                  className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              ) : null}
              {canEdit ? (
                <Button
                  variant="outline"
                  onClick={() => setPendingDelete(selectedProtocol)}
                  className="h-10 rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md">
                  <Shield className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{selectedProtocol.operationType || "Opération non renseignée"}</p>
                  <h2 className="mt-1 break-words text-xl font-semibold leading-snug text-slate-950 sm:text-2xl">{selectedProtocol.title}</h2>
                </div>
              </div>
              <Badge className={`w-fit shrink-0 rounded-lg ${statusClass[selectedProtocol.status]}`}>{statusLabel[selectedProtocol.status]}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Service", value: selectedProtocol.service, icon: Building2, box: "border-blue-200 bg-blue-50", ink: "text-blue-700", valueInk: "text-blue-950" },
                { label: "Domaine", value: selectedProtocol.domain, icon: Layers, box: "border-indigo-200 bg-indigo-50", ink: "text-indigo-700", valueInk: "text-indigo-950" },
                { label: "Lieu", value: selectedProtocol.location, icon: MapPin, box: "border-emerald-200 bg-emerald-50", ink: "text-emerald-700", valueInk: "text-emerald-950" },
                { label: "Responsable", value: selectedProtocol.responsable, icon: User, box: "border-violet-200 bg-violet-50", ink: "text-violet-700", valueInk: "text-violet-950" },
                { label: "Date", value: formatProtocolDate(selectedProtocol.date), icon: CalendarDays, box: "border-fuchsia-200 bg-fuchsia-50", ink: "text-fuchsia-700", valueInk: "text-fuchsia-950" },
                { label: "Référence", value: selectedProtocol.id, icon: FileText, box: "border-purple-200 bg-purple-50", ink: "text-purple-700", valueInk: "text-purple-950" },
              ].map((fact) => (
                <div key={fact.label} className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3 ${fact.box}`}>
                  <fact.icon className={`mt-0.5 h-4 w-4 shrink-0 ${fact.ink}`} aria-hidden />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${fact.ink}`}>{fact.label}</p>
                    <p className={`mt-1 break-words text-sm font-semibold ${fact.valueInk}`}>{fact.value || "Non renseigné"}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-indigo-950">Avancement des sections</p>
                <p className="text-sm font-bold text-purple-700">{protocolProgress(selectedProtocol)}/5</p>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${(protocolProgress(selectedProtocol) / 5) * 100}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  ["Risques", selectedProtocol.risques],
                  ["Mesures", selectedProtocol.mesures],
                  ["Secours", selectedProtocol.urgence],
                  ["Signatures", selectedProtocol.signatures || selectedProtocol.signatureDematerialiseeUrl || ""],
                  ["Circulation", selectedProtocol.circulation],
                ].map(([label, value]) => {
                  const filled = Boolean(value.trim());
                  return (
                    <div key={label} className={`rounded-xl px-3 py-2 ${filled ? "bg-white text-indigo-950" : "bg-white/60 text-slate-500"}`}>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="mt-0.5 text-xs">{filled ? "Renseigné" : "À compléter"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-violet-50 px-4 py-3 text-violet-950 sm:px-5">
              <Building2 className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">1) Entreprise APB</h2>
            </div>
            <p className="break-words whitespace-pre-wrap p-4 text-sm leading-relaxed text-slate-800 sm:p-5">{selectedProtocol.entreprise1 || "Non renseignée"}</p>
          </section>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-fuchsia-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-fuchsia-50 px-4 py-3 text-fuchsia-950 sm:px-5">
              <Building2 className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">2) Société intervenante</h2>
            </div>
            <p className="break-words whitespace-pre-wrap p-4 text-sm leading-relaxed text-slate-800 sm:p-5">{selectedProtocol.entreprise2 || "Non renseignée"}</p>
          </section>
        </div>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-3 text-indigo-950 sm:px-5">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            <h2 className="text-base font-semibold">4) Évaluation des risques et mesures (CT R4515-5)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="min-w-0 bg-indigo-50/40 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Nature des risques</p>
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selectedProtocol.risques || "Non renseignée"}</p>
            </div>
            <div className="min-w-0 border-t border-indigo-100 bg-violet-50/40 p-4 sm:p-5 md:border-l md:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Mesures de prévention</p>
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selectedProtocol.mesures || "Non renseignées"}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-fuchsia-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-fuchsia-50 px-4 py-3 text-fuchsia-950 sm:px-5">
              <Siren className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">5) Premiers secours (CT R4515-6)</h2>
            </div>
            <p className="break-words whitespace-pre-wrap p-4 text-sm leading-relaxed text-slate-800 sm:p-5">{selectedProtocol.urgence || "Non renseignées"}</p>
          </section>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-purple-50 px-4 py-3 text-purple-950 sm:px-5">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">8) Signatures</h2>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{selectedProtocol.signatures || "Non renseignées"}</p>
              {selectedProtocol.signatureDematerialiseeUrl ? (
                <img src={selectedProtocol.signatureDematerialiseeUrl} alt="Signature dématérialisée" className="max-h-32 max-w-full rounded-xl border border-purple-100 bg-purple-50 object-contain p-2" />
              ) : null}
            </div>
          </section>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-3 text-indigo-950 sm:px-5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">10) Plan de circulation et de déchargement</h2>
            </div>
            <p className="break-words whitespace-pre-wrap p-4 text-sm leading-relaxed text-slate-800 sm:p-5">{selectedProtocol.circulation || "Non renseigné"}</p>
          </section>
          <section className="min-w-0 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-violet-50 px-4 py-3 text-violet-950 sm:px-5">
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
              <h2 className="text-base font-semibold">Documents associés</h2>
            </div>
            <ul className="space-y-2 p-4 sm:p-5">
              {(selectedProtocol.documents || []).length === 0 && (selectedProtocol.attachments || []).length === 0 ? (
                <li className="text-sm text-slate-500">Aucun document associé.</li>
              ) : null}
              {(selectedProtocol.documents || []).map((doc) => (
                <li key={doc} className="break-words rounded-xl bg-violet-50 px-3 py-2 text-sm text-slate-800">{doc}</li>
              ))}
              {(selectedProtocol.attachments || []).map((attachment) => (
                <li key={attachment.id}>
                  <a href={attachment.dataUrl} download={attachment.fileName} className="flex min-w-0 items-center gap-2 break-all rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100">
                    <FileText className="h-4 w-4 shrink-0" aria-hidden />
                    {attachment.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
        {protocolDeleteDialog}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Protocoles de sécurité</h1>
            <p className="text-gray-600 mt-1">Pilotage des protocoles opérationnels de chargement, déchargement et levage.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl bg-indigo-100/80 p-1" role="group" aria-label="Mode d'affichage">
            <button
              type="button"
              aria-pressed={displayMode === "cards"}
              onClick={() => setDisplayMode("cards")}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${displayMode === "cards" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-700"}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Cartes
            </button>
            <button
              type="button"
              aria-pressed={displayMode === "table"}
              onClick={() => setDisplayMode("table")}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${displayMode === "table" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-700"}`}
            >
              <Table2 className="h-4 w-4" aria-hidden />
              Tableau
            </button>
          </div>
          {canEdit ? (
            <Button onClick={openCreate} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau protocole
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-indigo-50"><CardContent className="p-4"><p className="text-xs text-violet-700 uppercase font-semibold">Protocoles visibles</p><p className="text-2xl font-bold text-violet-900 mt-1">{visibleProtocols.length}</p></CardContent></Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50"><CardContent className="p-4"><p className="text-xs text-emerald-700 uppercase font-semibold">Signés</p><p className="text-2xl font-bold text-emerald-900 mt-1">{signedCount}</p></CardContent></Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4"><p className="text-xs text-amber-700 uppercase font-semibold">Brouillons</p><p className="text-2xl font-bold text-amber-900 mt-1">{draftCount}</p></CardContent></Card>
      </div>

      <Card className="border-0 bg-white/80 shadow-xl backdrop-blur" role="region" aria-label="Filtres des protocoles">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher (titre, service, domaine, lieu, entreprise...)"
                className="h-11 rounded-xl border-indigo-200 bg-white pl-10 shadow-sm"
              />
            </div>
            <p className="shrink-0 text-sm font-semibold text-indigo-950">{visibleProtocols.length} protocole(s)</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-11 rounded-xl border-indigo-200 bg-white px-4 text-indigo-800 hover:bg-indigo-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filtersOpen ? "Masquer les filtres" : "Filtres"}
            </Button>
            {listFiltersActive ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setListFilters(emptyProtocolListFilters());
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl text-slate-600"
              >
                Réinitialiser
              </Button>
            ) : null}
          </div>
          {filtersOpen ? (
            <div className="grid grid-cols-1 gap-4 border-t border-indigo-100 pt-4 xl:grid-cols-3">
              <section className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4">
                <h2 className="text-sm font-bold text-indigo-950">Identification</h2>
                <MultiSelectFilter label="Service" selected={listFilters.services} onChange={(services) => setListFilters((current) => ({ ...current, services }))} options={uniqueSorted(protocols.map((protocol) => protocol.service)).map((value) => ({ value, label: value }))} />
                <MultiSelectFilter label="Domaine" selected={listFilters.domains} onChange={(domains) => setListFilters((current) => ({ ...current, domains }))} options={uniqueSorted(protocols.map((protocol) => protocol.domain)).map((value) => ({ value, label: value }))} />
                <MultiSelectFilter label="Lieu" selected={listFilters.locations} onChange={(locations) => setListFilters((current) => ({ ...current, locations }))} options={uniqueSorted(protocols.map((protocol) => protocol.location)).map((value) => ({ value, label: value }))} />
                <MultiSelectFilter label="Responsable" selected={listFilters.responsables} onChange={(responsables) => setListFilters((current) => ({ ...current, responsables }))} options={uniqueSorted(protocols.map((protocol) => protocol.responsable)).map((value) => ({ value, label: value }))} />
              </section>
              <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
                <h2 className="text-sm font-bold text-violet-950">Opération</h2>
                <MultiSelectFilter label="Type d'opération" selected={listFilters.operations} onChange={(operations) => setListFilters((current) => ({ ...current, operations }))} options={uniqueSorted(protocols.map((protocol) => protocol.operationType)).map((value) => ({ value, label: value }))} />
                <MultiSelectFilter label="Entreprise" selected={listFilters.entreprises} onChange={(entreprises) => setListFilters((current) => ({ ...current, entreprises }))} options={uniqueSorted(protocols.flatMap((protocol) => [protocol.entreprise1, protocol.entreprise2])).map((value) => ({ value, label: value }))} />
              </section>
              <section className="space-y-3 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/70 p-4">
                <h2 className="text-sm font-bold text-fuchsia-950">Suivi</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  {([
                    ["brouillon", "Brouillon", "border-amber-300 bg-amber-50 text-amber-800"],
                    ["valide", "Valide", "border-blue-300 bg-blue-50 text-blue-800"],
                    ["signe", "Signé", "border-emerald-300 bg-emerald-50 text-emerald-800"],
                  ] as const).map(([value, label, activeClass]) => {
                    const active = listFilters.statuses.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setListFilters((current) => ({
                          ...current,
                          statuses: active ? current.statuses.filter((status) => status !== value) : [...current.statuses, value],
                        }))}
                        className={cn("flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-semibold", active ? activeClass : "border-white bg-white text-slate-700 hover:bg-fuchsia-50")}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {columnFiltersActive ? (
        <div className="flex flex-col gap-2 rounded-xl border border-indigo-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-indigo-950">Des filtres de colonnes sont actifs dans le tableau.</p>
          <Button type="button" variant="ghost" className="h-9 rounded-xl text-indigo-800" onClick={() => setColumnFilters(emptyProtocolColumnFilters())}>
            Réinitialiser les colonnes
          </Button>
        </div>
      ) : null}

      {displayMode === "cards" && visibleProtocols.length > 0 ? (
      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        {paginatedProtocols.map((protocol) => {
          const progress = protocolProgress(protocol);
          return (
          <Card key={protocol.id} className="h-full border-0 bg-white/90 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{protocol.operationType}</p>
                    <p className="text-lg font-semibold leading-snug text-slate-900">{protocol.title}</p>
                  </div>
                </div>
                <Badge className={`shrink-0 rounded-lg ${statusClass[protocol.status]}`}>{statusLabel[protocol.status]}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex min-w-0 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="min-w-0 truncate text-sm font-semibold text-blue-800">{protocol.service || "Service non renseigné"}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <Layers className="h-4 w-4 shrink-0 text-indigo-600" />
                  <span className="min-w-0 truncate text-sm font-semibold text-indigo-800">{protocol.domain || "Domaine non renseigné"}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="min-w-0 text-sm font-semibold text-emerald-800">{protocol.location || "Lieu non renseigné"}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-700">
                <p className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><span><span className="font-semibold">Entreprise APB :</span> {protocol.entreprise1 || "Non renseignée"}</span></p>
                <p className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600" /><span><span className="font-semibold">Société intervenante :</span> {protocol.entreprise2 || "Non renseignée"}</span></p>
                <p className="flex items-start gap-2"><User className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span><span className="font-semibold">Responsable :</span> {protocol.responsable || "Non renseigné"}</span></p>
                <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" /><span><span className="font-semibold">Date :</span> {formatProtocolDate(protocol.date)}</span></p>
              </div>
              <div className="mt-auto">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Avancement des sections
                  </span>
                  <span className="font-bold text-purple-700">{progress}/5</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-indigo-50">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${(progress / 5) * 100}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="w-full border-indigo-200 text-indigo-900 hover:bg-indigo-50 sm:flex-1" onClick={() => openDetail(protocol.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Consulter
                </Button>
                {canEdit ? (
                  <>
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 sm:flex-1" onClick={() => openEdit(protocol)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 sm:w-auto" onClick={() => setPendingDelete(protocol)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
      ) : null}

      {displayMode === "table" && visibleProtocols.length > 0 ? (
        <Card className="overflow-hidden border border-indigo-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-indigo-50 text-indigo-950">
                <tr>
                  {PROTOCOL_COLUMNS.map((column) => renderFilterableTh(column.key))}
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProtocols.map((protocol) => {
                  const progress = protocolProgress(protocol);
                  return (
                    <tr key={protocol.id} className="cursor-pointer hover:bg-indigo-50/50" onClick={() => openDetail(protocol.id)}>
                      <td className="max-w-[240px] border-t border-indigo-100 px-3 py-3 align-top font-semibold leading-snug text-slate-950">{protocol.title}</td>
                      <td className="max-w-[180px] border-t border-indigo-100 px-3 py-3 align-top text-indigo-800">{protocol.operationType}</td>
                      <td className="border-t border-indigo-100 px-3 py-3 align-top">{protocol.service || "—"}</td>
                      <td className="border-t border-indigo-100 px-3 py-3 align-top">{protocol.domain || "—"}</td>
                      <td className="max-w-[180px] border-t border-indigo-100 px-3 py-3 align-top leading-snug">{protocol.location || "—"}</td>
                      <td className="max-w-[220px] border-t border-indigo-100 px-3 py-3 align-top leading-snug">
                        <p>{protocol.entreprise1 || "—"}</p>
                        {protocol.entreprise2 ? <p className="mt-1 text-slate-500">{protocol.entreprise2}</p> : null}
                      </td>
                      <td className="border-t border-indigo-100 px-3 py-3 align-top">{protocol.responsable || "—"}</td>
                      <td className="whitespace-nowrap border-t border-indigo-100 px-3 py-3 align-top">{formatProtocolDate(protocol.date)}</td>
                      <td className="border-t border-indigo-100 px-3 py-3 align-top"><Badge className={`rounded-lg ${statusClass[protocol.status]}`}>{statusLabel[protocol.status]}</Badge></td>
                      <td className="border-t border-indigo-100 px-3 py-3 align-top">
                        <div className="flex min-w-[92px] items-center gap-2">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-indigo-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${(progress / 5) * 100}%` }} />
                          </div>
                          <span className="font-semibold text-purple-800">{progress}/5</span>
                        </div>
                      </td>
                      <td className="border-t border-indigo-100 bg-white px-3 py-3 align-top" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-9 w-9 border-indigo-200" onClick={() => openDetail(protocol.id)} aria-label="Consulter"><Eye className="h-4 w-4" /></Button>
                          {canEdit ? <Button size="icon" className="h-9 w-9 bg-gradient-to-r from-violet-600 to-fuchsia-600" onClick={() => openEdit(protocol)} aria-label="Modifier"><Edit3 className="h-4 w-4" /></Button> : null}
                          {canEdit ? <Button variant="outline" size="icon" className="h-9 w-9 border-rose-200 text-rose-700" onClick={() => setPendingDelete(protocol)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={visibleProtocols.length}
        onPageChange={setCurrentPage}
        itemLabel="protocole(s)"
      />

      {deletedProtocols.length > 0 ? (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Corbeille protocoles (7 jours)</CardTitle>
            <CardDescription>
              Les protocoles supprimés sont conservés 7 jours puis purgés automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {deletedProtocols.map((item) => (
              <div key={item.protocol.id} className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.protocol.title}</p>
                  <p className="text-xs text-slate-500">Supprimé le {new Date(item.deletedAt).toLocaleString("fr-FR")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => restoreProtocol(item.protocol.id)}>
                  Restaurer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {visibleProtocols.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-white/80">
          <CardContent className="py-14 text-center">
            <Shield className="h-10 w-10 text-cyan-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">Aucun protocole trouvé</p>
            <p className="text-slate-500 text-sm mt-1">Ajuste les filtres ou crée un nouveau protocole.</p>
          </CardContent>
        </Card>
      ) : null}
      {protocolDeleteDialog}
    </div>
  );
}
