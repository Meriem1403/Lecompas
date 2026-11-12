import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLeaveGuard } from "@/app/components/leaveGuard";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
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
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Hash,
  Link2,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  MapPin,
  Pencil,
  Phone,
  Plus,
  PlusCircle,
  Search,
  Shield,
  SlidersHorizontal,
  Siren,
  Table2,
  Target,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ColumnFilterPopover } from "@/app/components/ui/column-filter-popover";
import { MultiSelectFilter } from "@/app/components/ui/multi-select-filter";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import {
  emptyColumnFilterState,
  type ColumnFilterKind,
  type ColumnFilterState,
} from "@/app/utils/riskManagementFilterLogic";
import { getBlockedExternalLinkMessage, isAllowedExternalUrl } from "@/app/services/externalLinkGuard";

export interface ControleRow {
  id: string;
  action: string;
  site: string;
  dateRapport: string;
  reference: string;
  observation: string;
  datePassage?: string;
  nomInspecteur?: string;
}

export interface SecuritySheetRecord {
  id: string;
  duerpTitre: string;
  referentielAnnee: string;
  titreFiche: string;
  nomSite: string;
  lieuElementsControles: string;
  dateCreation: string;
  dateMiseAJour: string;
  effectif: string;
  adresse: string;
  telephoneBureau: string;
  telephoneAstreinte: string;
  activitesPrincipales: string;
  cyclesHoraires: string;
  correspondantPrevention: string;
  registreSst: string;
  lienIntranet: string;
  protocoleAccueil: string;
  registreControlesLieu: string;
  personnelHabilitationElectrique: string;
  procedureEvacuationIncendie: string;
  controleAmiante: ControleRow[];
  controlePlomb: ControleRow[];
  controleEquipementPression: ControleRow[];
  controleElectricite: ControleRow[];
  controleEquipements: ControleRow[];
  controleEpi: ControleRow[];
  controleLevage: ControleRow[];
  controleCvc: ControleRow[];
  controlePortes: ControleRow[];
  autresComplement: string;
  updatedBy?: string;
  updatedAt?: string;
}

const emptyRow = (): ControleRow => ({
  id: crypto.randomUUID(),
  action: "",
  site: "",
  dateRapport: "",
  reference: "",
  observation: "",
  datePassage: "",
  nomInspecteur: "",
});

export function newSecuritySheet(overrides?: Partial<SecuritySheetRecord>): SecuritySheetRecord {
  return {
    id: crypto.randomUUID(),
    duerpTitre: "DUERP de l'unité 2 : Services des Phares & Balises",
    referentielAnnee: "DIRM Méditerranée 2023",
    titreFiche: "Fiche sécurité secteur des Bouches du Rhône",
    nomSite: "COB Marseille",
    lieuElementsControles: "",
    dateCreation: new Date().toISOString().slice(0, 10),
    dateMiseAJour: new Date().toISOString().slice(0, 10),
    effectif: "",
    adresse: "",
    telephoneBureau: "",
    telephoneAstreinte: "",
    activitesPrincipales: "",
    cyclesHoraires: "",
    correspondantPrevention: "",
    registreSst: "",
    lienIntranet: "",
    protocoleAccueil: "",
    registreControlesLieu: "",
    personnelHabilitationElectrique: "",
    procedureEvacuationIncendie: "",
    controleAmiante: [emptyRow()],
    controlePlomb: [emptyRow()],
    controleEquipementPression: [emptyRow()],
    controleElectricite: [emptyRow()],
    controleEquipements: [emptyRow()],
    controleEpi: [emptyRow()],
    controleLevage: [emptyRow()],
    controleCvc: [emptyRow()],
    controlePortes: [emptyRow()],
    autresComplement: "",
    ...overrides,
  };
}

export const defaultSecuritySheetsState: SecuritySheetRecord[] = [
  newSecuritySheet({
    id: "fiche-demo-cob-marseille",
    lieuElementsControles: "Bâtiments techniques, ateliers et zones de stockage",
    dateCreation: "2021-05-07",
    dateMiseAJour: "2024-05-07",
    effectif: "11 (COB) + 3 (BPST) + 1 (BAAF) + 1 (adj SPB) + marins (~13)",
    adresse: "Dirm-Med/Phares et Balises - Quai 123 de la digue du large – 13002 Marseille",
    telephoneBureau: "+33 4 13 94 89 40",
    telephoneAstreinte: "+33 6 24 91 62 00",
    activitesPrincipales:
      "Exploitation des Aides à la Navigation Maritime avec astreintes. Travaux technico-administratifs, de bureau, sur écran, archivage, mécaniques, tôlerie, soudure, peintures, électricité, électronique, maintenance du génie civil, des espaces verts…",
    cyclesHoraires:
      "Parc : 07h/12h et 13h/16h (1 vendredi sur 2 non travaillé). Encadrement, CEI, BAAF, BPST : horaires variables.",
    correspondantPrevention: "Maxime Suroy depuis 20/05/2019",
    registreSst: "n°15",
    lienIntranet:
      "https://enqueteur.dirm-mediterranee.e2.rie.gouv.fr/index.php?r=survey/index&sid=73544&lang=fr",
    protocoleAccueil: "À créer",
    registreControlesLieu: "Bureau Chef de centre – Armoire",
    personnelHabilitationElectrique: "Maxime Suroy\nDavid Violette",
    procedureEvacuationIncendie: "Oui",
    controleAmiante: [
      {
        id: "r1",
        action: "maj DTA",
        site: "COB Marseille",
        dateRapport: "06/07/22",
        reference: "7234948-001-1",
        observation: "EP 5 ans - AC1 sur toitures",
        datePassage: "",
        nomInspecteur: "",
      },
    ],
  }),
];

type ViewMode = "list" | "detail" | "create" | "edit";

const SECTIONS: { key: keyof SecuritySheetRecord; label: string; withInspector: boolean; hint?: string }[] = [
  { key: "controleAmiante", label: "Amiante", withInspector: false },
  { key: "controlePlomb", label: "Plomb", withInspector: false },
  { key: "controleEquipementPression", label: "Équipement sous pression", withInspector: false },
  { key: "controleElectricite", label: "Conformité électrique", withInspector: true, hint: "Champs optionnels : date de passage, inspecteur" },
  { key: "controleEquipements", label: "Équipements (machines)", withInspector: false },
  { key: "controleEpi", label: "EPI", withInspector: false },
  { key: "controleLevage", label: "Levage", withInspector: false },
  { key: "controleCvc", label: "Climatisation – Ventilation – Chauffage", withInspector: false },
  { key: "controlePortes", label: "Portes et portails", withInspector: true, hint: "Ex. vérification réglementaire" },
];

type SheetArrayKey = (typeof SECTIONS)[number]["key"];

function isRowArrayKey(k: string): k is SheetArrayKey {
  return SECTIONS.some((s) => s.key === k);
}

function countFilledControlRows(r: SecuritySheetRecord): number {
  let n = 0;
  for (const s of SECTIONS) {
    const arr = r[s.key] as ControleRow[];
    n += arr.filter(
      (row) => row.action || row.site || row.dateRapport || row.reference || row.observation || row.datePassage || row.nomInspecteur,
    ).length;
  }
  return n;
}

function filledControlSections(record: SecuritySheetRecord) {
  return SECTIONS.filter((section) => {
    const rows = record[section.key] as ControleRow[];
    return rows.some(
      (row) => row.action || row.site || row.dateRapport || row.reference || row.observation || row.datePassage || row.nomInspecteur,
    );
  }).length;
}

function formatSheetDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return value.trim() || "Non renseignée";
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type SheetColumnKey = "titre" | "site" | "lieu" | "referentiel" | "correspondant" | "maj" | "controles";
type SheetColumnFacts = Record<SheetColumnKey, string>;
type SheetListFilters = { sites: string[]; referentiels: string[]; prevention: string[]; controles: string[] };

const SHEET_COLUMNS: { key: SheetColumnKey; label: string; kind: ColumnFilterKind }[] = [
  { key: "titre", label: "Fiche", kind: "text" },
  { key: "site", label: "Site", kind: "text" },
  { key: "lieu", label: "Lieu", kind: "text" },
  { key: "referentiel", label: "Référentiel", kind: "text" },
  { key: "correspondant", label: "Correspondant", kind: "text" },
  { key: "maj", label: "Mise à jour", kind: "date" },
  { key: "controles", label: "Contrôles", kind: "number" },
];

function emptySheetListFilters(): SheetListFilters {
  return { sites: [], referentiels: [], prevention: [], controles: [] };
}

function emptySheetColumnFilters() {
  return Object.fromEntries(SHEET_COLUMNS.map((column) => [column.key, emptyColumnFilterState()])) as Record<SheetColumnKey, ColumnFilterState>;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, "fr"));
}

function sheetFacts(record: SecuritySheetRecord): SheetColumnFacts {
  return {
    titre: record.titreFiche.trim(),
    site: record.nomSite.trim(),
    lieu: record.lieuElementsControles.trim(),
    referentiel: record.referentielAnnee.trim(),
    correspondant: record.correspondantPrevention.trim(),
    maj: /^(\d{4}-\d{2}-\d{2})/.exec(record.dateMiseAJour.trim())?.[1] || "",
    controles: String(countFilledControlRows(record)),
  };
}

function sheetColumnLabel(key: SheetColumnKey, value: string) {
  if (key === "maj") return formatSheetDate(value);
  if (key === "controles") return value || "0";
  return value.trim() || "(vide)";
}

function sheetColumnActive(filter: ColumnFilterState) {
  return filter.values !== null || (filter.operator !== "none" && filter.query.trim().length > 0);
}

function parseSheetFilterDate(value: string) {
  const french = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (french) return `${french[3]}-${french[2].padStart(2, "0")}-${french[1].padStart(2, "0")}`;
  return value.trim().slice(0, 10);
}

function matchesSheetColumn(facts: SheetColumnFacts, key: SheetColumnKey, filter: ColumnFilterState) {
  const value = facts[key];
  if (filter.values !== null && !filter.values.includes(value)) return false;
  if (filter.operator === "none" || !filter.query.trim()) return true;
  const kind = SHEET_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  const displayed = sheetColumnLabel(key, value).toLocaleLowerCase("fr");
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
    const current = parseSheetFilterDate(value);
    const min = parseSheetFilterDate(filter.query);
    const max = parseSheetFilterDate(filter.queryTo);
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

function compareSheetColumn(left: string, right: string, key: SheetColumnKey) {
  const kind = SHEET_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  if (kind === "number") {
    const delta = Number(left) - Number(right);
    if (Number.isFinite(delta) && delta !== 0) return delta;
  }
  if (kind === "date") return parseSheetFilterDate(left).localeCompare(parseSheetFilterDate(right));
  return sheetColumnLabel(key, left).localeCompare(sheetColumnLabel(key, right), "fr", { numeric: true, sensitivity: "base" });
}

export async function downloadFicheSecuritePdf(record: SecuritySheetRecord) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const contentW = 182;
  let y = 20;
  const pageH = 297;
  const ensure = (h = 12) => {
    if (y + h > pageH - 14) {
      doc.addPage();
      y = 16;
    }
  };
  const addT = (t: string) => {
    ensure(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t, margin, y);
    y += 6;
  };
  const addB = (label: string, val: string) => {
    ensure(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(val || "—", contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  };
  const addSectionTitle = (title: string) => {
    ensure(10);
    doc.setFillColor(244, 63, 94);
    doc.rect(margin, y, contentW, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, margin + 2, y + 4.2);
    doc.setTextColor(0, 0, 0);
    y += 8;
  };
  const addControlRow = (
    row: ControleRow,
    withInspector: boolean,
    index: number,
  ) => {
    const lines: string[] = [
      `Ligne ${index + 1}`,
      `Action: ${row.action || "—"}`,
      `Site: ${row.site || "—"}`,
      `Date rapport: ${row.dateRapport || "—"}`,
      `Référence: ${row.reference || "—"}`,
      `Observation: ${row.observation || "—"}`,
    ];
    if (withInspector) {
      lines.push(`Date de passage: ${row.datePassage || "—"}`);
      lines.push(`Inspecteur: ${row.nomInspecteur || "—"}`);
    }
    const blockLines = doc.splitTextToSize(lines.join(" | "), contentW - 4);
    ensure(blockLines.length * 4 + 6);
    doc.setDrawColor(251, 113, 133);
    doc.setFillColor(255, 241, 242);
    doc.rect(margin, y, contentW, blockLines.length * 4 + 4, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(blockLines, margin + 2, y + 3.5);
    y += blockLines.length * 4 + 6;
  };

  doc.setFillColor(190, 24, 93);
  doc.rect(0, 0, 210, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FICHE SECURITE", margin, 8);
  doc.setTextColor(0, 0, 0);
  y = 18;
  addT(`${record.nomSite} — ${record.titreFiche}`);
  addB("Lieu ou elements controles", record.lieuElementsControles);
  addB("Referentiel", record.referentielAnnee);
  addB("Dates", `Creation: ${record.dateCreation} | MAJ: ${record.dateMiseAJour}`);
  addB("Effectif", record.effectif);
  addB("Adresse", record.adresse);
  addB("Telephones", `Bureau: ${record.telephoneBureau} | Astreinte: ${record.telephoneAstreinte}`);
  addB("Activites", record.activitesPrincipales);
  addB("Horaires", record.cyclesHoraires);
  addB("Correspondant prevention", record.correspondantPrevention);
  addB("Registre SST", record.registreSst);
  addB("Protocole d'accueil", record.protocoleAccueil);
  addB("Registre des controles / emplacement", record.registreControlesLieu);
  addB("Personnel habilite electrique", record.personnelHabilitationElectrique);
  addB("Procedure evacuation incendie", record.procedureEvacuationIncendie);
  addB("Autres complement", record.autresComplement);

  for (const section of SECTIONS) {
    const rows = (record[section.key] as ControleRow[]).filter(
      (row) =>
        row.action ||
        row.site ||
        row.dateRapport ||
        row.reference ||
        row.observation ||
        row.datePassage ||
        row.nomInspecteur,
    );
    if (!rows.length) continue;
    addSectionTitle(`Controles — ${section.label}`);
    rows.forEach((row, idx) => addControlRow(row, section.withInspector, idx));
  }

  doc.save(`fiche-securite-${record.nomSite.replace(/\s+/g, "-") || record.id}.pdf`);
}

export interface SecuritySheetViewProps {
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
  records: SecuritySheetRecord[];
  setRecords: React.Dispatch<React.SetStateAction<SecuritySheetRecord[]>>;
}

export function SecuritySheetView({
  currentUserRole,
  currentUserName,
  records,
  setRecords,
}: SecuritySheetViewProps) {
  const canEdit = currentUserRole !== "agent";
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listFilters, setListFilters] = useState<SheetListFilters>(emptySheetListFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");
  const [columnFilters, setColumnFilters] = useState(emptySheetColumnFilters);
  const [columnSort, setColumnSort] = useState<{ key: SheetColumnKey; direction: "asc" | "desc" } | null>(null);
  const pageSize = displayMode === "table" ? TABLE_LIST_PAGE_SIZE : 6;
  const [form, setForm] = useState<SecuritySheetRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? records.find((r) => r.id === selectedId) ?? null : null),
    [records, selectedId],
  );

  const filtered = useMemo(() => {
    const rows = Array.isArray(records) ? records : [];
    const q = query.trim().toLowerCase();
    const matched = rows.filter((record) => {
      if (listFilters.sites.length > 0 && !listFilters.sites.includes(record.nomSite.trim())) return false;
      if (listFilters.referentiels.length > 0 && !listFilters.referentiels.includes(record.referentielAnnee.trim())) return false;
      const hasPrevention = Boolean(record.correspondantPrevention.trim());
      if (listFilters.prevention.length === 1 && listFilters.prevention[0] === "avec" && !hasPrevention) return false;
      if (listFilters.prevention.length === 1 && listFilters.prevention[0] === "sans" && hasPrevention) return false;
      const hasControls = countFilledControlRows(record) > 0;
      if (listFilters.controles.length === 1 && listFilters.controles[0] === "avec" && !hasControls) return false;
      if (listFilters.controles.length === 1 && listFilters.controles[0] === "sans" && hasControls) return false;
      if (!q) return true;
      const pack = [
        record.duerpTitre,
        record.titreFiche,
        record.nomSite,
        record.lieuElementsControles,
        record.referentielAnnee,
        record.adresse,
        record.activitesPrincipales,
        record.correspondantPrevention,
      ]
        .join(" ")
        .toLowerCase();
      return pack.includes(q);
    });
    const columnMatched = matched.filter((record) => {
      const facts = sheetFacts(record);
      return SHEET_COLUMNS.every((column) => matchesSheetColumn(facts, column.key, columnFilters[column.key]));
    });
    if (!columnSort) return columnMatched;
    return [...columnMatched].sort((left, right) => {
      const delta = compareSheetColumn(sheetFacts(left)[columnSort.key], sheetFacts(right)[columnSort.key], columnSort.key);
      return columnSort.direction === "asc" ? delta : -delta;
    });
  }, [records, query, listFilters, columnFilters, columnSort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, listFilters, columnFilters, columnSort, displayMode]);

  useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, [viewMode, selectedId]);

  const listFiltersActive =
    listFilters.sites.length > 0 ||
    listFilters.referentiels.length > 0 ||
    listFilters.prevention.length > 0 ||
    listFilters.controles.length > 0 ||
    query.trim().length > 0;
  const columnFiltersActive = SHEET_COLUMNS.some((column) => sheetColumnActive(columnFilters[column.key]));
  const pendingDelete = records.find((record) => record.id === deleteId) ?? null;

  const downloadSheet = async (record: SecuritySheetRecord) => {
    try {
      const { downloadSecuritySheetVisualPdf } = await import("./securitySheetVisualPdf");
      await downloadSecuritySheetVisualPdf(record);
      toast.success("Fiche téléchargée en PDF.");
    } catch {
      toast.error("Impossible de générer le PDF.");
    }
  };

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startCreate = useCallback(() => {
    if (!canEdit) return;
    setForm(newSecuritySheet());
    setSelectedId(null);
    setViewMode("create");
  }, [canEdit]);

  const startEdit = (rec: SecuritySheetRecord) => {
    if (!canEdit) return;
    const next: SecuritySheetRecord = { ...rec };
    SECTIONS.forEach(({ key }) => {
      const arr = rec[key] as ControleRow[];
      (next as Record<string, ControleRow[]>)[key] =
        arr.length > 0 ? arr.map((r) => ({ ...r, id: r.id || crypto.randomUUID() })) : [emptyRow()];
    });
    setForm(next);
    setSelectedId(rec.id);
    setViewMode("edit");
  };

  const openDetail = (rec: SecuritySheetRecord) => {
    setSelectedId(rec.id);
    setViewMode("detail");
  };

  const saveForm = () => {
    if (!form) return;
    if (!form.nomSite.trim() || !form.titreFiche.trim()) {
      toast.error("Renseignez au minimum l'intitulé de fiche et le site.");
      return;
    }
    const stamp = { updatedBy: currentUserName, updatedAt: new Date().toISOString() };
    if (viewMode === "create") {
      setRecords((prev) => [
        { ...form, id: form.id || crypto.randomUUID(), dateMiseAJour: new Date().toISOString().slice(0, 10), ...stamp },
        ...prev,
      ]);
      toast.success("Fiche sécurité créée.");
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === form.id ? { ...form, dateMiseAJour: new Date().toISOString().slice(0, 10), ...stamp } : r)),
      );
      toast.success("Fiche sécurité enregistrée.");
    }
    setViewMode("list");
    setForm(null);
  };

  const removeRecord = (id: string) => {
    if (!canEdit) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
    if (selectedId === id) {
      setSelectedId(null);
      setViewMode("list");
    }
    toast.success("Fiche supprimée.");
  };

  const patchForm = (patch: Partial<SecuritySheetRecord>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
  };

  const patchRow = (section: SheetArrayKey, rowId: string, patch: Partial<ControleRow>) => {
    setForm((f) => {
      if (!f) return f;
      const rows = f[section] as ControleRow[];
      return {
        ...f,
        [section]: rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      };
    });
  };

  const addRow = (section: SheetArrayKey) => {
    setForm((f) => {
      if (!f) return f;
      const rows = f[section] as ControleRow[];
      return { ...f, [section]: [...rows, emptyRow()] };
    });
  };

  const removeRow = (section: SheetArrayKey, rowId: string) => {
    setForm((f) => {
      if (!f) return f;
      const rows = f[section] as ControleRow[];
      if (rows.length <= 1) return f;
      return { ...f, [section]: rows.filter((r) => r.id !== rowId) };
    });
  };

  const readSection = (rec: SecuritySheetRecord, key: SheetArrayKey) => {
    const arr = rec[key] as ControleRow[];
    return arr.filter((r) => r.action || r.site || r.dateRapport || r.reference || r.observation);
  };

  const statAvecPrevention = useMemo(
    () => filtered.filter((r) => r.correspondantPrevention?.trim()).length,
    [filtered],
  );
  const statAvecControles = useMemo(
    () => filtered.filter((r) => countFilledControlRows(r) > 0).length,
    [filtered],
  );

  const renderFilterableTh = (key: SheetColumnKey) => {
    const column = SHEET_COLUMNS.find((item) => item.key === key);
    if (!column) return null;
    const options = uniqueSorted(records.map((record) => sheetFacts(record)[key])).map((value) => ({
      value,
      label: sheetColumnLabel(key, value),
    }));
    return (
      <th key={key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
        <div className="flex items-center gap-1">
          <span>{column.label}</span>
          <ColumnFilterPopover
            options={options}
            filter={columnFilters[key]}
            kind={column.kind}
            sorted={columnSort?.key === key ? columnSort.direction : null}
            onApply={(filter) => setColumnFilters((current) => ({ ...current, [key]: filter }))}
            onSort={(direction) => setColumnSort({ key, direction })}
            ariaLabel={`Filtrer ${column.label}`}
          />
        </div>
      </th>
    );
  };

  const deleteDialog = (
    <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette fiche ?</AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {pendingDelete ? <span className="mb-2 block font-medium text-slate-900">{pendingDelete.titreFiche}</span> : null}
            La suppression est définitive. La fiche ne pourra pas être restaurée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              if (deleteId) removeRecord(deleteId);
            }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (viewMode === "create" && form && canEdit) {
    return (
      <EditBody
        form={form}
        isCreate
        onBack={() => {
          setViewMode("list");
          setForm(null);
        }}
        onSave={saveForm}
        patchForm={patchForm}
        patchRow={patchRow}
        addRow={addRow}
        removeRow={removeRow}
      />
    );
  }

  if (viewMode === "edit" && form && canEdit) {
    return (
      <EditBody
        form={form}
        isCreate={false}
        onBack={() => {
          setViewMode("list");
          setForm(null);
        }}
        onSave={saveForm}
        patchForm={patchForm}
        patchRow={patchRow}
        addRow={addRow}
        removeRow={removeRow}
      />
    );
  }

  if (viewMode === "detail" && selected) {
    return (
      <>
        <DetailBody
          record={selected}
          canEdit={canEdit}
          onBack={() => setViewMode("list")}
          onEdit={() => startEdit(selected)}
          onDownload={() => void downloadSheet(selected)}
          onDelete={() => setDeleteId(selected.id)}
          readSection={readSection}
        />
        {deleteDialog}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 text-white overflow-hidden">
        <CardHeader className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl sm:text-4xl font-bold">Fiches de sécurité</CardTitle>
                <p className="text-pink-100 text-lg mt-1">
                  Identification du site, prévention et contrôles réglementaires.
                </p>
              </div>
            </div>
            <Badge className="w-full lg:w-auto justify-center bg-white text-slate-900 border border-slate-200 text-lg px-5 py-2">
              {filtered.length} fiche(s)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
          <CardContent className="p-4">
            <p className="text-xs text-rose-800 uppercase font-semibold">Fiches visibles</p>
            <p className="text-2xl font-bold text-rose-950 mt-1">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs text-pink-800 uppercase font-semibold">Avec correspondant prévention</p>
            <p className="text-2xl font-bold text-pink-950 mt-1">{statAvecPrevention}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-stone-300 bg-gradient-to-br from-stone-100 to-stone-50">
          <CardContent className="p-4">
            <p className="text-xs text-stone-600 uppercase font-semibold">Avec contrôles saisis</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{statAvecControles}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-rose-100 bg-white/95" role="region" aria-label="Filtres des fiches">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une fiche (site, titre, adresse, activités...)"
                className="h-11 rounded-xl border-rose-200 bg-white pl-10 shadow-sm"
              />
            </div>
            <p className="shrink-0 text-sm font-semibold text-rose-950">{filtered.length} fiche(s)</p>
            <div className="inline-flex rounded-xl bg-rose-100/80 p-1" role="group" aria-label="Mode d'affichage">
              <button
                type="button"
                aria-pressed={displayMode === "cards"}
                onClick={() => setDisplayMode("cards")}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${displayMode === "cards" ? "bg-white text-rose-950 shadow-sm" : "text-rose-700"}`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Cartes
              </button>
              <button
                type="button"
                aria-pressed={displayMode === "table"}
                onClick={() => setDisplayMode("table")}
                className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${displayMode === "table" ? "bg-white text-rose-950 shadow-sm" : "text-rose-700"}`}
              >
                <Table2 className="h-4 w-4" aria-hidden />
                Tableau
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-11 rounded-xl border-rose-200 bg-white px-4 text-rose-800 hover:bg-rose-50"
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
                  setListFilters(emptySheetListFilters());
                  setCurrentPage(1);
                }}
                className="h-11 rounded-xl text-slate-600"
              >
                Réinitialiser
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                onClick={startCreate}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 sm:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle fiche
              </Button>
            ) : null}
          </div>
          {filtersOpen ? (
            <div className="grid grid-cols-1 gap-4 border-t border-rose-100 pt-4 xl:grid-cols-3">
              <section className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                <h2 className="text-sm font-bold text-rose-950">Site</h2>
                <MultiSelectFilter label="Site" selected={listFilters.sites} onChange={(sites) => setListFilters((current) => ({ ...current, sites }))} options={uniqueSorted(records.map((record) => record.nomSite)).map((value) => ({ value, label: value }))} />
                <MultiSelectFilter label="Référentiel" selected={listFilters.referentiels} onChange={(referentiels) => setListFilters((current) => ({ ...current, referentiels }))} options={uniqueSorted(records.map((record) => record.referentielAnnee)).map((value) => ({ value, label: value }))} />
              </section>
              <section className="space-y-3 rounded-2xl border border-pink-200 bg-pink-50/80 p-4">
                <h2 className="text-sm font-bold text-pink-950">Prévention</h2>
                <MultiSelectFilter
                  label="Correspondant prévention"
                  selected={listFilters.prevention}
                  onChange={(prevention) => setListFilters((current) => ({ ...current, prevention }))}
                  options={[{ value: "avec", label: "Renseigné" }, { value: "sans", label: "À compléter" }]}
                />
              </section>
              <section className="space-y-3 rounded-2xl border border-stone-300 bg-stone-50 p-4">
                <h2 className="text-sm font-bold text-stone-800">Contrôles</h2>
                <MultiSelectFilter
                  label="Lignes de contrôle"
                  selected={listFilters.controles}
                  onChange={(controles) => setListFilters((current) => ({ ...current, controles }))}
                  options={[{ value: "avec", label: "Au moins une ligne" }, { value: "sans", label: "Aucune ligne" }]}
                />
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {columnFiltersActive ? (
        <div className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 sm:flex-row sm:items-center sm:justify-between">
          <p>Des filtres de colonnes sont actifs.</p>
          <Button type="button" variant="ghost" className="h-9 rounded-xl text-rose-800" onClick={() => setColumnFilters(emptySheetColumnFilters())}>
            Réinitialiser les colonnes
          </Button>
        </div>
      ) : null}

      {displayMode === "cards" && filtered.length > 0 ? (
      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        {pageRows.map((record) => {
          const sections = filledControlSections(record);
          return (
          <Card key={record.id} className="flex h-full flex-col overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur transition-all hover:shadow-2xl">
            <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500" />
            <CardContent className="flex flex-1 flex-col space-y-4 p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-pink-800">{record.nomSite || "Site non renseigné"}</p>
                  <p className="break-words text-lg font-semibold leading-snug text-slate-900">{record.titreFiche || "Titre à renseigner"}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-slate-700">{record.duerpTitre || "Unité non renseignée"}</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-950"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{record.lieuElementsControles || "Lieu non renseigné"}</span></p>
                <p className="flex items-start gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-pink-950"><FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{record.referentielAnnee || "Référentiel non renseigné"}</span></p>
                <p className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-stone-800"><User className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span className="min-w-0 break-words">{record.correspondantPrevention || "Correspondant non renseigné"}</span></p>
                <p className="flex items-start gap-2 rounded-lg border border-stone-300 bg-stone-100 px-3 py-2 text-stone-900"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>Mise à jour le {formatSheetDate(record.dateMiseAJour)}</span></p>
              </div>
              <div className="mt-auto">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">Rubriques de contrôle</span>
                  <span className="font-bold text-rose-700">{sections}/9</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-rose-50">
                  <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: `${(sections / 9) * 100}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="w-full border-rose-200 sm:flex-1" onClick={() => openDetail(record)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Consulter
                </Button>
                <Button variant="outline" className="w-full border-rose-200 sm:flex-1" onClick={() => void downloadSheet(record)}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                {canEdit ? (
                  <>
                    <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 sm:flex-1" onClick={() => startEdit(record)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button variant="outline" className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 sm:w-auto" onClick={() => setDeleteId(record.id)}>
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

      {displayMode === "table" && filtered.length > 0 ? (
        <Card className="overflow-hidden border border-rose-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-500" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-rose-50 text-rose-950">
                <tr>
                  {SHEET_COLUMNS.map((column) => renderFilterableTh(column.key))}
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((record) => (
                  <tr key={record.id} className="cursor-pointer hover:bg-rose-50/60" onClick={() => openDetail(record)}>
                    <td className="max-w-[240px] border-t border-rose-100 px-3 py-3 align-top font-semibold leading-snug text-slate-950">{record.titreFiche || "Titre à renseigner"}</td>
                    <td className="border-t border-rose-100 px-3 py-3 align-top">{record.nomSite || "Non renseigné"}</td>
                    <td className="max-w-[200px] border-t border-rose-100 px-3 py-3 align-top leading-snug">{record.lieuElementsControles || "Non renseigné"}</td>
                    <td className="max-w-[180px] border-t border-rose-100 px-3 py-3 align-top leading-snug">{record.referentielAnnee || "Non renseigné"}</td>
                    <td className="max-w-[200px] border-t border-rose-100 px-3 py-3 align-top leading-snug">{record.correspondantPrevention || "Non renseigné"}</td>
                    <td className="whitespace-nowrap border-t border-rose-100 px-3 py-3 align-top">{formatSheetDate(record.dateMiseAJour)}</td>
                    <td className="border-t border-rose-100 px-3 py-3 align-top">
                      <div className="flex min-w-[92px] items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-rose-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" style={{ width: `${(filledControlSections(record) / 9) * 100}%` }} />
                        </div>
                        <span className="font-semibold text-rose-800">{filledControlSections(record)}/9</span>
                      </div>
                    </td>
                    <td className="border-t border-rose-100 bg-white px-3 py-3 align-top" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-9 w-9 border-rose-200" onClick={() => openDetail(record)} aria-label="Consulter"><Eye className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 border-rose-200" onClick={() => void downloadSheet(record)} aria-label="Télécharger le PDF"><Download className="h-4 w-4" /></Button>
                        {canEdit ? <Button size="icon" className="h-9 w-9 bg-gradient-to-r from-pink-600 to-rose-600" onClick={() => startEdit(record)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button> : null}
                        {canEdit ? <Button variant="outline" size="icon" className="h-9 w-9 border-rose-200 text-rose-700" onClick={() => setDeleteId(record.id)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
        itemLabel="fiche(s)"
      />

      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-rose-200 bg-white/80">
          <CardContent className="py-14 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-pink-500" />
            <p className="font-semibold text-slate-700">Aucune fiche de sécurité</p>
            <p className="mt-1 text-sm text-slate-500">Ajuste les filtres{canEdit ? " ou crée une nouvelle fiche." : "."}</p>
          </CardContent>
        </Card>
      ) : null}
      {deleteDialog}
    </div>
  );
}

const sheetInputClass = "h-11 w-full rounded-xl border-rose-200 bg-white pl-10 text-sm shadow-sm focus-visible:border-rose-400 focus-visible:ring-4 focus-visible:ring-rose-100";
const sheetTextareaClass = "min-h-[96px] w-full rounded-xl border-rose-200 bg-white px-3 py-2.5 text-sm leading-relaxed shadow-sm focus-visible:border-rose-400 focus-visible:ring-4 focus-visible:ring-rose-100";
const evacuationChoices = ["Oui", "Non", "À créer"];

function SheetLineField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" aria-hidden />
        {children}
      </div>
    </div>
  );
}

function SheetTextBlock({
  label,
  icon: Icon,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
        {label}
      </Label>
      <Textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className={sheetTextareaClass} />
    </div>
  );
}

function SheetDateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-rose-200 bg-white pl-3 pr-10 text-sm text-slate-900 shadow-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" aria-hidden />
      </div>
    </div>
  );
}

function IdentityFields({ form, patch }: { form: SecuritySheetRecord; patch: (p: Partial<SecuritySheetRecord>) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <SheetTextBlock label="DUERP, titre de l'unité" icon={FileText} value={form.duerpTitre} onChange={(duerpTitre) => patch({ duerpTitre })} rows={2} />
      </div>
      <SheetLineField label="Référentiel / année" icon={FileText}>
        <Input value={form.referentielAnnee} onChange={(event) => patch({ referentielAnnee: event.target.value })} className={sheetInputClass} />
      </SheetLineField>
      <div className="md:col-span-2">
        <SheetLineField label="Titre de la fiche" icon={FileText}>
          <Input value={form.titreFiche} onChange={(event) => patch({ titreFiche: event.target.value })} className={sheetInputClass} />
        </SheetLineField>
      </div>
      <SheetLineField label="Site" icon={Building2}>
        <Input value={form.nomSite} onChange={(event) => patch({ nomSite: event.target.value })} className={sheetInputClass} placeholder="Ex. COB Marseille" />
      </SheetLineField>
      <SheetLineField label="Lieu ou éléments contrôlés" icon={MapPin}>
        <Input value={form.lieuElementsControles} onChange={(event) => patch({ lieuElementsControles: event.target.value })} className={sheetInputClass} placeholder="Atelier, local technique, toiture, quai" />
      </SheetLineField>
      <SheetDateField label="Date de création" value={form.dateCreation} onChange={(dateCreation) => patch({ dateCreation })} />
      <SheetDateField label="Date de mise à jour" value={form.dateMiseAJour} onChange={(dateMiseAJour) => patch({ dateMiseAJour })} />
      <SheetTextBlock label="Effectif" icon={Users} value={form.effectif} onChange={(effectif) => patch({ effectif })} rows={2} />
      <SheetTextBlock label="Adresse" icon={MapPin} value={form.adresse} onChange={(adresse) => patch({ adresse })} rows={2} />
      <SheetLineField label="Téléphone bureau" icon={Phone}>
        <Input type="tel" value={form.telephoneBureau} onChange={(event) => patch({ telephoneBureau: event.target.value })} className={sheetInputClass} />
      </SheetLineField>
      <SheetLineField label="Astreinte" icon={Phone}>
        <Input type="tel" value={form.telephoneAstreinte} onChange={(event) => patch({ telephoneAstreinte: event.target.value })} className={sheetInputClass} />
      </SheetLineField>
    </div>
  );
}

function ActFields({ form, patch }: { form: SecuritySheetRecord; patch: (p: Partial<SecuritySheetRecord>) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <SheetTextBlock label="Activités principales" icon={FileText} value={form.activitesPrincipales} onChange={(activitesPrincipales) => patch({ activitesPrincipales })} />
      <SheetTextBlock label="Cycles et horaires de fonctionnement" icon={Clock} value={form.cyclesHoraires} onChange={(cyclesHoraires) => patch({ cyclesHoraires })} rows={3} />
    </div>
  );
}

function PrevFields({ form, patch }: { form: SecuritySheetRecord; patch: (p: Partial<SecuritySheetRecord>) => void }) {
  const evacuationOptions = form.procedureEvacuationIncendie && !evacuationChoices.includes(form.procedureEvacuationIncendie)
    ? [form.procedureEvacuationIncendie, ...evacuationChoices]
    : evacuationChoices;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <SheetTextBlock label="Correspondant sécurité / prévention" icon={User} value={form.correspondantPrevention} onChange={(correspondantPrevention) => patch({ correspondantPrevention })} rows={2} />
      </div>
      <SheetLineField label="Registre SST" icon={Hash}>
        <Input value={form.registreSst} onChange={(event) => patch({ registreSst: event.target.value })} className={sheetInputClass} placeholder="Numéro du registre" />
      </SheetLineField>
      <SheetLineField label="Lien intranet" icon={Link2}>
        <Input type="url" value={form.lienIntranet} onChange={(event) => patch({ lienIntranet: event.target.value })} className={sheetInputClass} placeholder="https://" />
      </SheetLineField>
      <div className="md:col-span-2">
        <SheetTextBlock label="Protocole d'accueil et de prévention des risques" icon={Shield} value={form.protocoleAccueil} onChange={(protocoleAccueil) => patch({ protocoleAccueil })} rows={2} />
      </div>
      <div className="md:col-span-2">
        <SheetTextBlock label="Registre des contrôles, emplacement" icon={MapPin} value={form.registreControlesLieu} onChange={(registreControlesLieu) => patch({ registreControlesLieu })} rows={2} />
      </div>
      <div className="md:col-span-2">
        <SheetTextBlock label="Personnel habilité électrique, un nom par ligne" icon={Users} value={form.personnelHabilitationElectrique} onChange={(personnelHabilitationElectrique) => patch({ personnelHabilitationElectrique })} rows={3} />
      </div>
      <div className="min-w-0 space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium text-slate-700">Procédure d'évacuation incendie</Label>
        <div className="relative">
          <Siren className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-rose-500" aria-hidden />
          <Select value={form.procedureEvacuationIncendie || undefined} onValueChange={(procedureEvacuationIncendie) => patch({ procedureEvacuationIncendie })}>
            <SelectTrigger className="h-11 w-full rounded-xl border-rose-200 bg-white pl-10 shadow-sm data-[size=default]:h-11">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {evacuationOptions.map((choice) => (
                <SelectItem key={choice} value={choice}>{choice}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function TableEditor({
  title,
  hint,
  withInspector,
  rows,
  onPatch,
  onAdd,
  onRemove,
}: {
  title: string;
  hint?: string;
  withInspector: boolean;
  rows: ControleRow[];
  onPatch: (id: string, p: Partial<ControleRow>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const lineInput = "h-11 rounded-xl border-rose-200 bg-white text-sm shadow-sm focus-visible:border-rose-400 focus-visible:ring-4 focus-visible:ring-rose-100";
  return (
    <div className="space-y-3">
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {rows.map((row, index) => (
        <div key={row.id} className="overflow-hidden rounded-2xl border border-rose-200 bg-white">
          <div className="flex items-center justify-between gap-3 bg-rose-50 px-3 py-2">
            <p className="text-sm font-semibold text-rose-950">Ligne {index + 1}</p>
            {rows.length > 1 ? (
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg border-rose-200 bg-white text-rose-700 hover:bg-rose-50" onClick={() => onRemove(row.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Retirer
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Action</Label>
              <Textarea value={row.action} onChange={(event) => onPatch(row.id, { action: event.target.value })} className="min-h-[72px] rounded-xl border-rose-200 bg-white text-sm shadow-sm focus-visible:border-rose-400 focus-visible:ring-4 focus-visible:ring-rose-100" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Site</Label>
              <Input value={row.site} onChange={(event) => onPatch(row.id, { site: event.target.value })} className={lineInput} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Date du rapport</Label>
              <Input value={row.dateRapport} onChange={(event) => onPatch(row.id, { dateRapport: event.target.value })} className={lineInput} placeholder="06/07/2022" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Référence</Label>
              <Input value={row.reference} onChange={(event) => onPatch(row.id, { reference: event.target.value })} className={lineInput} />
            </div>
            {withInspector ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Date de passage</Label>
                  <Input value={row.datePassage || ""} onChange={(event) => onPatch(row.id, { datePassage: event.target.value })} className={lineInput} placeholder="Optionnel" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Nom de l'inspecteur</Label>
                  <Input value={row.nomInspecteur || ""} onChange={(event) => onPatch(row.id, { nomInspecteur: event.target.value })} className={lineInput} placeholder="Optionnel" />
                </div>
              </>
            ) : null}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Observation</Label>
              <Textarea value={row.observation} onChange={(event) => onPatch(row.id, { observation: event.target.value })} className="min-h-[72px] rounded-xl border-rose-200 bg-white text-sm shadow-sm focus-visible:border-rose-400 focus-visible:ring-4 focus-visible:ring-rose-100" />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-full rounded-xl border-dashed border-rose-300 text-rose-800 hover:bg-rose-50 sm:w-auto" onClick={onAdd}>
        <Plus className="mr-1.5 h-4 w-4" />
        Ajouter une ligne, {title}
      </Button>
    </div>
  );
}

function TableRead({ title, rows, withInspector }: { title: string; rows: ControleRow[]; withInspector: boolean }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Aucune ligne.</p>;
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm">
          <p className="font-medium text-slate-900">Ligne {i + 1}</p>
          <div className="grid sm:grid-cols-2 gap-1 mt-1 text-slate-700 text-xs sm:text-sm">
            <p>
              <span className="text-slate-500">Action :</span> {row.action || "—"}
            </p>
            <p>
              <span className="text-slate-500">Site :</span> {row.site || "—"}
            </p>
            <p>
              <span className="text-slate-500">Date rapport :</span> {row.dateRapport || "—"}
            </p>
            <p>
              <span className="text-slate-500">Réf. :</span> {row.reference || "—"}
            </p>
            {withInspector && (row.datePassage || row.nomInspecteur) ? (
              <>
                <p>
                  <span className="text-slate-500">Date passage :</span> {row.datePassage || "—"}
                </p>
                <p>
                  <span className="text-slate-500">Inspecteur :</span> {row.nomInspecteur || "—"}
                </p>
              </>
            ) : null}
            <p className="sm:col-span-2">
              <span className="text-slate-500">Obs. :</span> {row.observation || "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditBody({
  form,
  isCreate,
  onBack,
  onSave,
  patchForm,
  patchRow,
  addRow,
  removeRow,
}: {
  form: SecuritySheetRecord;
  isCreate: boolean;
  onBack: () => void;
  onSave: () => void;
  patchForm: (p: Partial<SecuritySheetRecord>) => void;
  patchRow: (s: SheetArrayKey, id: string, p: Partial<ControleRow>) => void;
  addRow: (s: SheetArrayKey) => void;
  removeRow: (s: SheetArrayKey, id: string) => void;
}) {
  const requestLeave = useLeaveGuard();
  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
          {isCreate ? "Nouvelle fiche de sécurité" : "Modifier la fiche de sécurité"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Identification du site, prévention et contrôles réglementaires.</p>
      </div>

      <Card className="border-0 shadow-2xl bg-white">
        <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600" />
        <CardContent className="p-5 sm:p-8 space-y-5">
          <Card className="border-0 bg-gradient-to-r from-slate-900 via-rose-900 to-pink-900 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-pink-100">Fiche de sécurité</p>
                  <p className="text-lg font-semibold mt-1">{form.titreFiche || "Fiche à compléter"}</p>
                  <p className="text-pink-100 text-sm mt-1">{form.referentielAnnee || "Référentiel"}</p>
                </div>
                <Badge className="bg-white text-slate-900 border-white/20">{isCreate ? "Création" : "Modification"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <Shield className="h-4 w-4 text-pink-600" />
                Identification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IdentityFields form={form} patch={patchForm} />
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Activités et horaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ActFields form={form} patch={patchForm} />
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Dispositif de prévention</CardTitle>
              <CardDescription>Registres, protocole, habilitations, évacuation</CardDescription>
            </CardHeader>
            <CardContent>
              <PrevFields form={form} patch={patchForm} />
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Table2 className="h-4 w-4 text-pink-600" />
                Contrôles réglementaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full" defaultValue={["controleAmiante"]}>
                {SECTIONS.map((sec) => {
                  const key = sec.key;
                  if (!isRowArrayKey(key)) return null;
                  return (
                    <AccordionItem value={key} key={key}>
                      <AccordionTrigger className="text-left font-medium">{sec.label}</AccordionTrigger>
                      <AccordionContent>
                        <TableEditor
                          title={sec.label}
                          hint={sec.hint}
                          withInspector={sec.withInspector}
                          rows={form[key] as ControleRow[]}
                          onPatch={(id, p) => patchRow(key, id, p)}
                          onAdd={() => addRow(key)}
                          onRemove={(id) => removeRow(key, id)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Autres compléments</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.autresComplement}
                onChange={(e) => patchForm({ autresComplement: e.target.value })}
                placeholder="Aération, assainissement, extincteurs, contrôles spécifiques..."
                className="min-h-[100px] rounded-xl border-rose-200 bg-white shadow-sm"
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 border-t border-rose-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={() => requestLeave(onBack)} className="h-11 w-full rounded-xl border-rose-200 sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Button>
            <Button
              onClick={onSave}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 sm:w-auto"
            >
              {isCreate ? "Enregistrer" : "Mettre à jour"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailBody({
  record,
  onBack,
  onEdit,
  onDownload,
  onDelete,
  canEdit,
  readSection,
}: {
  record: SecuritySheetRecord;
  onBack: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
  canEdit: boolean;
  readSection: (r: SecuritySheetRecord, k: SheetArrayKey) => ControleRow[];
}) {
  const openSafeLink = (url: string) => {
    if (!isAllowedExternalUrl(url)) {
      toast.error(getBlockedExternalLinkMessage(url));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filledSections = SECTIONS.filter((section) => readSection(record, section.key).length > 0);
  const emptySections = SECTIONS.filter((section) => readSection(record, section.key).length === 0);

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <div>
        <h1 className="break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Consultation de la fiche</h1>
        <p className="mt-1 text-sm text-slate-500">Identification, prévention et contrôles réglementaires du site.</p>
      </div>
      <article className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-pink-500 to-rose-500" />
        <div className="flex flex-col gap-3 border-b border-rose-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Button variant="outline" onClick={onBack} className="h-10 w-full rounded-xl border-rose-200 bg-white text-rose-950 hover:bg-rose-50 sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div className="grid w-full grid-cols-1 gap-2 min-[520px]:grid-cols-3 sm:flex sm:w-auto sm:justify-end">
            <Button variant="outline" onClick={onDownload} className="h-10 rounded-xl border-rose-200 bg-white text-rose-950 hover:bg-rose-50">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
            {canEdit ? (
              <Button onClick={onEdit} className="h-10 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700">
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            ) : null}
            {canEdit ? (
              <Button variant="outline" onClick={onDelete} className="h-10 rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            ) : null}
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 px-4 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                <Shield className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-100">{record.nomSite || "Site non renseigné"}</p>
                <h2 className="mt-1 break-words text-xl font-semibold leading-snug sm:text-2xl">{record.titreFiche}</h2>
                <p className="mt-2 break-words text-sm text-pink-100">{record.duerpTitre}</p>
              </div>
            </div>
            <Badge className="w-fit shrink-0 border border-white/30 bg-white/15 text-white">Mise à jour le {formatSheetDate(record.dateMiseAJour)}</Badge>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-2 border-rose-200 bg-rose-50/80">
          <CardContent className="p-4">
            <p className="text-xs text-rose-800 font-semibold uppercase">Référentiel</p>
            <p className="font-semibold text-rose-950 mt-1 break-words">{record.referentielAnnee}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-pink-200 bg-pink-50/80">
          <CardContent className="p-4">
            <p className="text-xs text-pink-800 font-semibold uppercase">Création</p>
            <p className="font-semibold text-pink-950 mt-1">{formatSheetDate(record.dateCreation)}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-stone-300 bg-stone-100/80">
          <CardContent className="p-4">
            <p className="text-xs text-stone-600 font-semibold uppercase">Effectif (indicatif)</p>
            <p className="font-semibold text-stone-900 mt-1 line-clamp-3">{record.effectif || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-stone-200 bg-stone-50/90">
          <CardContent className="p-4">
            <p className="text-xs text-stone-600 font-semibold uppercase">Rubriques renseignées</p>
            <p className="font-semibold text-stone-900 mt-1">{filledSections.length}/9</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Adresse &amp; contacts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-800 space-y-2">
          <p className="whitespace-pre-wrap">{record.adresse || "—"}</p>
          <p>
            <span className="text-slate-500">Bureau :</span> {record.telephoneBureau || "—"}{" "}
            <span className="text-slate-500">· Astreinte :</span> {record.telephoneAstreinte || "—"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Activités et horaires</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-slate-800">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 font-semibold uppercase">Principales</p>
              <p className="whitespace-pre-wrap mt-1">{record.activitesPrincipales || "—"}</p>
            </div>
            <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
              <p className="text-xs text-pink-900 font-semibold uppercase">Horaires</p>
              <p className="whitespace-pre-wrap mt-1">{record.cyclesHoraires || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-pink-900">Dispositif de prévention</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-slate-800">
            <div className="rounded-lg bg-rose-50 p-3 border border-rose-100">
              <p className="text-xs text-rose-900 font-semibold">Correspondant</p>
              <p className="mt-1 whitespace-pre-wrap">{record.correspondantPrevention || "—"}</p>
            </div>
            <p>
              <span className="text-slate-500">Registre SST :</span> {record.registreSst || "—"}
            </p>
            <p>
              <span className="text-slate-500">Lien :</span>{" "}
              {record.lienIntranet ? (
                <a
                  className="text-pink-700 underline"
                  href={record.lienIntranet}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    event.preventDefault();
                    openSafeLink(record.lienIntranet);
                  }}
                >
                  Accès intranet
                </a>
              ) : (
                "—"
              )}
            </p>
            <p>
              <span className="text-slate-500">Protocole :</span> {record.protocoleAccueil || "—"}
            </p>
            <p>
              <span className="text-slate-500">Lieu / éléments contrôlés :</span> {record.lieuElementsControles || "—"}
            </p>
            <p>
              <span className="text-slate-500">Registre des contrôles :</span> {record.registreControlesLieu || "Non renseigné"}
            </p>
            <p className="whitespace-pre-wrap">
              <span className="text-slate-500">Habilitation électrique :</span> {record.personnelHabilitationElectrique || "Non renseignée"}
            </p>
            <p>
              <span className="text-slate-500">Évacuation :</span> {record.procedureEvacuationIncendie || "Non renseignée"}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 bg-rose-50 px-4 py-3 text-rose-950 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="text-base font-semibold">Contrôles réglementaires</h2>
          <p className="text-sm font-semibold">{filledSections.length}/9 rubriques</p>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          {filledSections.map((section) => (
            <div key={section.key} className="min-w-0 rounded-xl border border-rose-100 bg-rose-50/40 p-3 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold text-rose-950">{section.label}</h3>
              <TableRead title={section.label} rows={readSection(record, section.key)} withInspector={section.withInspector} />
            </div>
          ))}
          {emptySections.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">À compléter</p>
              <div className="flex flex-wrap gap-2">
                {emptySections.map((section) => (
                  <span key={section.key} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700">
                    {section.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {record.autresComplement ? (
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-slate-800">{record.autresComplement}</p>
          </CardContent>
        </Card>
      ) : null}

      {record.updatedBy ? <p className="text-xs text-slate-500">Dernière saisie : {record.updatedBy}</p> : null}
    </div>
  );
}
