import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { ListPaginationBar } from "@/app/components/ui/list-pagination-bar";
import { useLeaveGuard } from "@/app/components/leaveGuard";
import type { AsbestosRegisterRow, AsbestosSiteDtaRow, RegisterAttachment } from "@/app/types/importedRegisters";
import {
  AMIANTE_MATERIAUX,
  AMIANTE_ZONES,
  displayMaterial,
  displayZone,
  formatMaybeExcelDate,
  kindLabel,
  matchesRegisterSearch,
  matchesSiteSearch,
  presenceTone,
  registerRowScore,
  registerRowTitle,
  scoreTone,
} from "@/app/utils/asbestosDisplayUtils";
import { downloadAsbestosSitePdf } from "./asbestosSitePdf";
import { StickyTableScroll } from "@/app/components/ui/StickyTableScroll";
import {
  Building2,
  Calendar,
  Download,
  Eye,
  FileText,
  Layers,
  LayoutGrid,
  MapPin,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Shield,
  Table2,
  Trash2,
  UserRound,
} from "lucide-react";

const PRESENCE = ["Oui", "Non", "Non mais 1997", "Non mais 1998", "Désamianté", "A vérifier", "A diagnostiquer"];

type FieldDef = { key: keyof AsbestosRegisterRow; label: string; multiline?: boolean; date?: boolean; choices?: readonly string[] };

const FIELDS: Record<AsbestosRegisterRow["kind"], FieldDef[]> = {
  synthese: [
    { key: "zone", label: "Zone", choices: AMIANTE_ZONES },
    { key: "materiau", label: "Matériau", choices: AMIANTE_MATERIAUX },
    { key: "localisation", label: "Localisation", multiline: true },
    { key: "description", label: "Description", multiline: true },
    { key: "score", label: "Niveau (EP / AC…)" },
  ],
  controle: [
    { key: "dateControle", label: "Date du contrôle", date: true },
    { key: "typeControle", label: "Type de contrôle", multiline: true },
    { key: "lieuZone", label: "Périmètre visité", multiline: true },
    { key: "zonesPresence", label: "Présence amiante", multiline: true },
    { key: "zonesNonAmiantees", label: "Zones non amiantées", multiline: true },
    { key: "score", label: "Scores / conservation", multiline: true },
    { key: "action", label: "Actions à mener", multiline: true },
    { key: "prochaineEcheance", label: "Prochaine échéance" },
  ],
  materiau: [
    { key: "zone", label: "Zone", choices: AMIANTE_ZONES },
    { key: "materiau", label: "Matériau", choices: AMIANTE_MATERIAUX },
    { key: "localisation", label: "Localisation précise", multiline: true },
    { key: "datePremierReperage", label: "Premier repérage", date: true },
    { key: "typeAnalyse", label: "Type d'analyse", multiline: true },
    { key: "dernierControle", label: "Dernier contrôle", date: true },
    { key: "scoreActuel", label: "Score actuel" },
    { key: "statutMateriau", label: "Statut réglementaire" },
    { key: "actionsRealisees", label: "Actions déjà réalisées", multiline: true },
    { key: "retraitRealise", label: "Retrait réalisé" },
    { key: "actionAPrevoir", label: "Action à prévoir", multiline: true },
  ],
  historique: [
    { key: "rawCol1", label: "Événement" },
    { key: "rawCol2", label: "Détail", multiline: true },
  ],
};

type Screen =
  | { kind: "browse" }
  | { kind: "site"; id: string }
  | { kind: "site-form"; draft: AsbestosSiteDtaRow; origin: string }
  | { kind: "record"; id: string }
  | { kind: "record-form"; draft: AsbestosRegisterRow; origin: string };

interface AsbestosStudioProps {
  sites: AsbestosSiteDtaRow[];
  register: AsbestosRegisterRow[];
  onSaveSite: (site: AsbestosSiteDtaRow) => void;
  onSaveRow: (row: AsbestosRegisterRow) => void;
  onDeleteSite: (id: string) => void;
  onDeleteRow: (id: string) => void;
}

type PendingDelete = { type: "site" | "row"; id: string; label: string };

function blankSite(): AsbestosSiteDtaRow {
  return {
    id: `amiante-site-${Date.now()}`,
    departement: "",
    personneEnCharge: "",
    site: "",
    acces: "",
    presenceAmiante: "",
    dateDernierControle: "",
    prochainControle: "",
    dateMaj: "",
    commentaires: "",
    dtaStatut: "",
    attachments: [],
  };
}

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex max-w-full items-center rounded-lg px-2 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

const fieldClass = "flex h-12 w-full min-w-0 items-center rounded-xl border border-slate-200 bg-white px-3 text-base leading-6 text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-100";
const primaryBtn = "rounded-xl bg-indigo-600 text-white hover:bg-indigo-700";

function FieldGlyph({ side, label, onClick, children }: { side: "left" | "right"; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`absolute top-0 flex h-12 w-10 items-center justify-center text-indigo-600 ${side === "left" ? "left-0" : "right-0"}`}>
      {children}
    </button>
  );
}

function focusField(id: string) {
  document.getElementById(id)?.focus();
}

function openPicker(id: string) {
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") input.showPicker();
}

function TextField({
  id, label, value, onChange, icon: Icon = FileText, placeholder, listId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: typeof Search;
  placeholder?: string;
  listId?: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} list={listId} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} pl-10`} />
        <FieldGlyph side="left" label={`Placer le curseur dans ${label}`} onClick={() => focusField(id)}><Icon className="h-4 w-4" /></FieldGlyph>
      </div>
    </div>
  );
}

function toDateInput(value: string): string {
  const raw = (value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  if (/^\d{4,5}$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 30_000 && serial < 60_000) {
      const utc = new Date((serial - 25_569) * 86_400_000);
      if (!Number.isNaN(utc.getTime())) return utc.toISOString().slice(0, 10);
    }
  }
  return "";
}

function addYears(iso: string, years: number): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setFullYear(date.getFullYear() + years);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function DateField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const iso = toDateInput(value);
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="date"
          value={iso}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass} pr-10 pl-3 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`}
        />
        <FieldGlyph side="right" label={`Ouvrir le calendrier pour ${label}`} onClick={() => openPicker(id)}>
          <Calendar className="h-4 w-4" />
        </FieldGlyph>
      </div>
      {value && !iso ? <p className="text-xs text-slate-500">Valeur actuelle : {value}</p> : null}
    </div>
  );
}

function SelectField({ label, icon: Icon, value, onChange, children }: { label: string; icon: typeof Search; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const ref = useRef<HTMLSelectElement>(null);
  const id = `select-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative min-w-0">
        <select ref={ref} id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} min-w-0 max-w-full appearance-none truncate pl-10 pr-10`}>
          {children}
        </select>
        <FieldGlyph side="left" label={`Placer le curseur dans ${label}`} onClick={() => ref.current?.focus()}><Icon className="h-4 w-4" /></FieldGlyph>
        <span className="pointer-events-none absolute top-0 right-0 flex h-12 w-10 items-center justify-center text-indigo-600">
          <ChevronDown className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}

function AreaField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="min-w-0 space-y-1.5 sm:col-span-2">
      <Label htmlFor={id} className="inline-flex items-center gap-2">
        <FileText className="h-4 w-4 text-indigo-700" />
        {label}
      </Label>
      <Textarea id={id} rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-28 rounded-xl border-slate-200 bg-white text-base leading-6 text-slate-800 shadow-sm focus-visible:border-indigo-300 focus-visible:ring-indigo-100" />
    </div>
  );
}

function readFiles(files: FileList | null, current: RegisterAttachment[], onChange: (next: RegisterAttachment[]) => void) {
  if (!files?.length) return;
  const next = [...current];
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      next.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
        uploadedAt: new Date().toISOString(),
      });
      onChange([...next]);
    };
    reader.readAsDataURL(file);
  });
}

function AttachmentBoard({ attachments, onChange }: { attachments: RegisterAttachment[]; onChange: (next: RegisterAttachment[]) => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
      <p className="text-sm font-medium text-slate-800">Pièces jointes</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Glissez un DTA, un rapport ou une photo, ou cliquez pour choisir un fichier.</p>
      <label
        className="mt-3 flex min-h-24 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-center text-sm text-slate-600 hover:border-indigo-300"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); readFiles(event.dataTransfer.files, attachments, onChange); }}
      >
        Déposer ou parcourir
        <input type="file" multiple className="sr-only" onClick={(event) => event.stopPropagation()} onChange={(event) => { readFiles(event.target.files, attachments, onChange); event.target.value = ""; }} />
      </label>
      <ul className="mt-3 space-y-2">
        {attachments.length === 0 ? <li className="text-sm text-stone-500">Aucun document.</li> : attachments.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
            <a className="min-w-0 truncate text-indigo-800 underline" href={file.dataUrl} download={file.fileName}>{file.fileName}</a>
            <button type="button" className="shrink-0 text-rose-700" onClick={() => onChange(attachments.filter((item) => item.id !== file.id))}>Retirer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowActions({ label, onOpen, onEdit, onDelete }: { label: string; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <Button type="button" variant="outline" aria-label={`Ouvrir ${label}`} title="Ouvrir" onClick={onOpen} className="h-9 w-9 shrink-0 rounded-xl border-slate-200 bg-white p-0 text-slate-700 shadow-sm hover:bg-slate-50">
        <Eye className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" aria-label={`Modifier ${label}`} title="Modifier" onClick={onEdit} className="h-9 w-9 shrink-0 rounded-xl border-indigo-200 bg-indigo-50 p-0 text-indigo-800 shadow-sm hover:bg-indigo-100">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" aria-label={`Supprimer ${label}`} title="Supprimer" onClick={onDelete} className="h-9 w-9 shrink-0 rounded-xl border-rose-200 bg-rose-50 p-0 text-rose-700 shadow-sm hover:bg-rose-100">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PageBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-medium text-indigo-800 hover:underline">
      {label}
    </button>
  );
}

export function AsbestosStudio({ sites, register, onSaveSite, onSaveRow, onDeleteSite, onDeleteRow }: AsbestosStudioProps) {
  const [screen, setScreen] = useState<Screen>({ kind: "browse" });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [section, setSection] = useState<"sites" | "materiaux" | "synthese" | "controles">("sites");
  const [search, setSearch] = useState("");
  const [service, setService] = useState("all");
  const [presence, setPresence] = useState("all");
  const [dta, setDta] = useState("all");
  const [score, setScore] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [layout, setLayout] = useState<"cartes" | "tableau">("cartes");

  const services = useMemo(() => Array.from(new Set(sites.map((site) => site.departement).filter(Boolean))).sort(), [sites]);
  const zonesOf = (siteId: string) => register.filter((row) => row.kind === "materiau" && row.siteId === siteId);

  const filteredSites = sites.filter((site) => {
    if (!matchesSiteSearch(site, search)) return false;
    if (service !== "all" && site.departement !== service) return false;
    if (presence !== "all" && (site.presenceAmiante || "") !== presence) return false;
    const dtaValue = (site.dtaStatut || "").toLowerCase();
    if (dta === "oui" && !dtaValue.startsWith("oui")) return false;
    if (dta === "non" && !dtaValue.startsWith("non")) return false;
    return true;
  });
  const filteredRows = register.filter((row) => {
    if (section === "materiaux" && row.kind !== "materiau") return false;
    if (section === "synthese" && row.kind !== "synthese") return false;
    if (section === "controles" && row.kind !== "controle") return false;
    if (!matchesRegisterSearch(row, search)) return false;
    const current = registerRowScore(row).toUpperCase();
    if (score === "ep" && !current.includes("EP")) return false;
    if (score === "ac1" && !current.includes("AC1")) return false;
    if (score === "ac2" && !current.includes("AC2")) return false;
    if (service !== "all" && row.kind === "materiau") {
      const linked = sites.find((site) => site.id === row.siteId);
      if (linked?.departement !== service) return false;
    }
    return true;
  });
  const active = section === "sites" ? filteredSites : filteredRows;
  const pages = Math.max(1, Math.ceil(active.length / pageSize));
  const slice = active.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, service, presence, dta, score, section, pageSize]);

  const openSite = (id: string) => setScreen({ kind: "site", id });
  const editSite = (site: AsbestosSiteDtaRow) => setScreen({ kind: "site-form", draft: { ...site }, origin: JSON.stringify(site) });
  const editRow = (row: AsbestosRegisterRow) => {
    const zone = displayZone(row);
    const material = displayMaterial(row);
    const draft = row.kind === "materiau" || row.kind === "synthese"
      ? {
          ...row,
          zone: (AMIANTE_ZONES as readonly string[]).includes(zone) ? zone : "",
          materiau: (AMIANTE_MATERIAUX as readonly string[]).includes(material) ? material : "",
        }
      : { ...row };
    setScreen({ kind: "record-form", draft, origin: JSON.stringify(draft) });
  };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    if (target.type === "site") {
      onDeleteSite(target.id);
      setScreen((current) => (current.kind === "site" && current.id === target.id) || (current.kind === "site-form" && current.draft.id === target.id) ? { kind: "browse" } : current);
      return;
    }
    const row = register.find((item) => item.id === target.id);
    onDeleteRow(target.id);
    setScreen((current) => {
      const leaving = (current.kind === "record" && current.id === target.id) || (current.kind === "record-form" && current.draft.id === target.id);
      if (!leaving) return current;
      return row?.siteId ? { kind: "site", id: row.siteId } : { kind: "browse" };
    });
  };
  const deleteDialog = (
    <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{pendingDelete?.type === "site" ? "Supprimer ce site ?" : "Supprimer cette fiche ?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDelete?.label ? `« ${pendingDelete.label} » sera retiré du suivi.` : "Cet élément sera retiré du suivi."}
            {pendingDelete?.type === "site" ? " Les zones rattachées à ce site seront aussi retirées." : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
          <Button type="button" className="rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={confirmDelete}>Supprimer</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  const counts = {
    sites: sites.length,
    oui: sites.filter((site) => (site.presenceAmiante || "").toLowerCase().startsWith("oui")).length,
    aFaire: sites.filter((site) => /diagnost|vérif|verif/i.test(site.presenceAmiante || "")).length,
    zones: register.filter((row) => row.kind === "materiau" && row.siteId).length,
  };

  if (screen.kind === "site-form") {
    return (<><SiteForm draft={screen.draft} services={services} onBack={(next) => setScreen(next)} onSave={(site) => { onSaveSite(site); setScreen({ kind: "site", id: site.id }); }} />{deleteDialog}</>);
  }
  if (screen.kind === "record-form") {
    return (<><RecordForm draft={screen.draft} sites={sites} onBack={(next) => setScreen(next)} onSave={(row) => { onSaveRow(row); setScreen({ kind: "record", id: row.id }); }} />{deleteDialog}</>);
  }
  if (screen.kind === "site") {
    const site = sites.find((item) => item.id === screen.id);
    if (!site) return (<><BrowseFallback onBack={() => setScreen({ kind: "browse" })} />{deleteDialog}</>);
    const zones = zonesOf(site.id);
    return (
      <>
      <article className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <PageBack label="Retour aux sites" onClick={() => setScreen({ kind: "browse" })} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">{site.departement || "Service"}</p>
              <h1 className="mt-1 break-words text-2xl font-semibold text-stone-900 sm:text-3xl">{site.site}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip className={presenceTone(site.presenceAmiante).className}>{presenceTone(site.presenceAmiante).label}</Chip>
                <Chip className="bg-stone-50 text-stone-700 ring-1 ring-stone-200">DTA {site.dtaStatut || "—"}</Chip>
                <Chip className="bg-indigo-50 text-indigo-950 ring-1 ring-indigo-200">{zones.length} zone{zones.length > 1 ? "s" : ""}</Chip>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="rounded-xl border-indigo-200 text-indigo-800" onClick={() => downloadAsbestosSitePdf(site, zones)}>
                <Download className="mr-2 h-4 w-4" />Dossier PDF
              </Button>
              <Button type="button" className={primaryBtn} onClick={() => editSite(site)}>
                <Pencil className="mr-2 h-4 w-4" />Modifier
              </Button>
              <Button type="button" variant="outline" className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => setPendingDelete({ type: "site", id: site.id, label: site.site })}>
                <Trash2 className="mr-2 h-4 w-4" />Supprimer
              </Button>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Fact label="Personne en charge" value={site.personneEnCharge || "—"} />
            <Fact label="Type d'accès" value={site.acces || "—"} />
            <Fact label="Dernier contrôle" value={formatMaybeExcelDate(site.dateDernierControle)} />
            <Fact label="Prochain contrôle" value={formatMaybeExcelDate(site.prochainControle)} />
            <Fact label="Mise à jour" value={formatMaybeExcelDate(site.dateMaj)} />
          </dl>
          {site.commentaires ? <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">{site.commentaires}</p> : null}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Matériaux et zones amiantés</h2>
            <Button type="button" className={primaryBtn} onClick={() => setScreen({ kind: "record-form", origin: "", draft: { id: `amiante-mat-${Date.now()}`, kind: "materiau", siteId: site.id, localisation: "", zone: "", materiau: "", zoneMateriau: "", attachments: [] } })}>
              <Plus className="mr-2 h-4 w-4" />Ajouter une zone
            </Button>
          </div>
          {zones.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">Aucune zone n&apos;est encore rattachée à ce site.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {zones.map((zone) => {
                const tone = scoreTone(registerRowScore(zone));
                return (
                  <article key={zone.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm">
                    <button type="button" onClick={() => setScreen({ kind: "record", id: zone.id })} className="w-full text-left">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words font-semibold text-stone-900">{displayMaterial(zone)}</p>
                        <Chip className={tone.className}>{tone.label}</Chip>
                      </div>
                      <p className="mt-2 text-sm text-stone-700"><span className="text-stone-500">Zone · </span>{displayZone(zone)}</p>
                      <p className="mt-1 text-sm text-stone-600">{zone.localisation || "Localisation à préciser"}</p>
                      <p className="mt-2 text-xs text-stone-500">Dernier contrôle {formatMaybeExcelDate(zone.dernierControle)}</p>
                    </button>
                    <div className="mt-3">
                      <RowActions label={registerRowTitle(zone)} onOpen={() => setScreen({ kind: "record", id: zone.id })} onEdit={() => editRow(zone)} onDelete={() => setPendingDelete({ type: "row", id: zone.id, label: registerRowTitle(zone) })} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </article>
      {deleteDialog}
      </>
    );
  }

  if (screen.kind === "record") {
    const row = register.find((item) => item.id === screen.id);
    if (!row) return (<><BrowseFallback onBack={() => setScreen({ kind: "browse" })} />{deleteDialog}</>);
    const linked = sites.find((site) => site.id === row.siteId);
    const tone = scoreTone(registerRowScore(row));
    return (
      <>
      <article className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <PageBack label={linked ? "Retour au site" : "Retour à la liste"} onClick={() => setScreen(linked ? { kind: "site", id: linked.id } : { kind: "browse" })} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">{kindLabel(row.kind)}</p>
              <h1 className="mt-1 break-words text-2xl font-semibold text-stone-900">{registerRowTitle(row)}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip className={tone.className}>{tone.label}</Chip>
                {linked ? <Chip className="bg-stone-50 text-stone-700 ring-1 ring-stone-200">{linked.site}</Chip> : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className={primaryBtn} onClick={() => editRow(row)}>
                <Pencil className="mr-2 h-4 w-4" />Modifier
              </Button>
              <Button type="button" variant="outline" className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => setPendingDelete({ type: "row", id: row.id, label: registerRowTitle(row) })}>
                <Trash2 className="mr-2 h-4 w-4" />Supprimer
              </Button>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS[row.kind].map((field) => (
              <Fact key={String(field.key)} label={field.label} value={field.key === "zone" ? displayZone(row) : field.key === "materiau" ? displayMaterial(row) : field.date ? formatMaybeExcelDate(String(row[field.key] || "")) : String(row[field.key] || "—")} wide={field.multiline} />
            ))}
          </dl>
          {(row.attachments?.length ?? 0) > 0 ? (
            <ul className="mt-4 space-y-2">
              {row.attachments!.map((file) => (
                <li key={file.id}><a className="text-sm text-indigo-800 underline" href={file.dataUrl} download={file.fileName}>{file.fileName}</a></li>
              ))}
            </ul>
          ) : null}
        </section>
      </article>
      {deleteDialog}
      </>
    );
  }

  return (
    <>
    <div className="min-w-0 space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Environnement</p>
          <h1 className="mt-1 break-words text-2xl font-semibold text-stone-900 sm:text-3xl">Suivi amiante</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">Chaque site a son dossier, ses zones amiantées et son PDF.</p>
        </div>
        <Button type="button" className={`h-12 ${primaryBtn}`} onClick={() => setScreen({ kind: "site-form", draft: blankSite(), origin: "" })}>
          <Plus className="mr-2 h-4 w-4" />Ajouter un site
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat icon={Building2} label="Sites" value={counts.sites} tone="bg-indigo-50 text-indigo-900" />
        <Stat icon={Shield} label="Présence confirmée" value={counts.oui} tone="bg-rose-50 text-rose-900" />
        <Stat icon={Search} label="À diagnostiquer" value={counts.aFaire} tone="bg-stone-100 text-stone-800" />
        <Stat icon={Layers} label="Zones rattachées" value={counts.zones} tone="bg-emerald-50 text-emerald-900" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["sites", `Sites (${sites.length})`],
          ["materiaux", "Matériaux et zones"],
          ["synthese", "Synthèse"],
          ["controles", "Contrôles"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setSection(id)} className={`shrink-0 rounded-xl px-3 py-2 text-sm ring-1 ${section === id ? "bg-indigo-50 text-indigo-950 ring-indigo-200" : "bg-white text-slate-700 ring-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-1">
            <TextField id="amiante-search" label="Recherche" icon={Search} value={search} onChange={setSearch} placeholder="Site, service, zone, commentaire" />
          </div>
          <SelectField label="Service" icon={Building2} value={service} onChange={setService}>
            <option value="all">Tous les services</option>
            {services.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          {section === "sites" ? (
            <>
              <SelectField label="Présence amiante" icon={Shield} value={presence} onChange={setPresence}>
                <option value="all">Toute présence</option>
                {PRESENCE.map((item) => <option key={item} value={item}>{item}</option>)}
              </SelectField>
              <SelectField label="DTA" icon={FileText} value={dta} onChange={setDta}>
                <option value="all">DTA : tous</option>
                <option value="oui">DTA disponible</option>
                <option value="non">DTA absent</option>
              </SelectField>
            </>
          ) : (
            <SelectField label="Score" icon={Layers} value={score} onChange={setScore}>
              <option value="all">Tous les scores</option>
              <option value="ep">EP</option>
              <option value="ac1">AC1</option>
              <option value="ac2">AC2</option>
            </SelectField>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-600">{active.length} élément(s)</p>
          <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto" role="group" aria-label="Mode d'affichage">
            <button type="button" aria-pressed={layout === "cartes"} onClick={() => setLayout("cartes")} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium sm:flex-none ${layout === "cartes" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
              <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
              Cartes
            </button>
            <button type="button" aria-pressed={layout === "tableau"} onClick={() => setLayout("tableau")} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium sm:flex-none ${layout === "tableau" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
              <Table2 className="h-4 w-4 shrink-0" aria-hidden />
              Tableau
            </button>
          </div>
        </div>
      </section>

      {layout === "tableau" ? (
        <Card className="overflow-visible border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-500" />
          <CardContent className="p-0">
            <StickyTableScroll hint="Faites défiler horizontalement pour afficher toutes les colonnes du tableau.">
              {section === "sites" ? (
                <table className="w-full min-w-[1280px]">
                  <thead className="border-b border-slate-100 bg-slate-50/70">
                    <tr>
                      {["Service", "Personne", "Site", "Accès", "Présence", "Dernier contrôle", "Prochain contrôle", "Mise à jour", "DTA"].map((head) => (
                        <th key={head} className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-slate-600">{head}</th>
                      ))}
                      <th className="bg-slate-50 px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-slate-600 lg:sticky lg:right-0 lg:shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {slice.length === 0 ? (
                      <tr><td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={10}>Aucun résultat pour ces filtres.</td></tr>
                    ) : (slice as AsbestosSiteDtaRow[]).map((site, index) => {
                      const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                      return (
                        <tr key={site.id} className={`${rowBg} align-middle transition-colors hover:bg-indigo-50/60`}>
                          <td className="px-4 py-4 text-sm text-slate-700">{site.departement || "—"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{site.personneEnCharge || "—"}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{site.site}</td>
                          <td className="max-w-[240px] px-4 py-4 text-sm text-slate-600"><p className="line-clamp-2">{site.acces || "—"}</p></td>
                          <td className="px-4 py-4"><Chip className={presenceTone(site.presenceAmiante).className}>{presenceTone(site.presenceAmiante).label}</Chip></td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-700">{formatMaybeExcelDate(site.dateDernierControle)}</td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-700">{formatMaybeExcelDate(site.prochainControle)}</td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-700">{formatMaybeExcelDate(site.dateMaj)}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{site.dtaStatut || "—"}</td>
                          <td className={`px-4 py-3 ${rowBg} lg:sticky lg:right-0 lg:shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]`}>
                            <RowActions label={site.site} onOpen={() => openSite(site.id)} onEdit={() => editSite(site)} onDelete={() => setPendingDelete({ type: "site", id: site.id, label: site.site })} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-slate-100 bg-slate-50/70">
                    <tr>
                      {(section === "materiaux"
                        ? ["Site", "Zone", "Matériau", "Localisation", "Dernier contrôle", "Score", "Statut"]
                        : section === "controles"
                          ? ["Date", "Type de contrôle", "Périmètre", "Score", "Échéance"]
                          : ["Zone", "Matériau", "Localisation", "Score"]
                      ).map((head) => (
                        <th key={head} className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-slate-600">{head}</th>
                      ))}
                      <th className="bg-slate-50 px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-slate-600 lg:sticky lg:right-0 lg:shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {slice.length === 0 ? (
                      <tr><td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={7}>Aucun résultat pour ces filtres.</td></tr>
                    ) : (slice as AsbestosRegisterRow[]).map((row, index) => {
                      const tone = scoreTone(registerRowScore(row));
                      const linked = sites.find((site) => site.id === row.siteId);
                      const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                      return (
                        <tr key={row.id} className={`${rowBg} align-middle transition-colors hover:bg-indigo-50/60`}>
                          {section === "materiaux" ? (
                            <>
                              <td className="px-4 py-4 text-sm text-slate-700">{linked?.site || "—"}</td>
                              <td className="px-4 py-4 text-sm text-slate-800">{displayZone(row)}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-900">{displayMaterial(row)}</td>
                              <td className="max-w-[260px] px-4 py-4 text-sm text-slate-600"><p className="line-clamp-2">{row.localisation || "—"}</p></td>
                              <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-700">{formatMaybeExcelDate(row.dernierControle)}</td>
                            </>
                          ) : section === "controles" ? (
                            <>
                              <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-700">{row.dateControle || "—"}</td>
                              <td className="max-w-[240px] px-4 py-4 text-sm text-slate-700"><p className="line-clamp-2">{row.typeControle || "—"}</p></td>
                              <td className="max-w-[260px] px-4 py-4 text-sm text-slate-600"><p className="line-clamp-2">{row.lieuZone || "—"}</p></td>
                            </>
                          ) : (
                            <>
                            <td className="px-4 py-4 text-sm text-slate-800">{displayZone(row)}</td>
                            <td className="px-4 py-4 text-sm font-semibold text-slate-900">{displayMaterial(row)}</td>
                            <td className="max-w-[280px] px-4 py-4 text-sm text-slate-600"><p className="line-clamp-2">{row.localisation || "—"}</p></td>
                            </>
                          )}
                          <td className="px-4 py-4"><Chip className={tone.className}>{tone.label}</Chip></td>
                          {section === "materiaux" ? <td className="px-4 py-4 text-sm text-slate-700">{row.statutMateriau || "—"}</td> : null}
                          {section === "controles" ? <td className="px-4 py-4 text-sm text-slate-700">{row.prochaineEcheance || "—"}</td> : null}
                          <td className={`px-4 py-3 ${rowBg} lg:sticky lg:right-0 lg:shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]`}>
                            <RowActions label={registerRowTitle(row)} onOpen={() => setScreen({ kind: "record", id: row.id })} onEdit={() => editRow(row)} onDelete={() => setPendingDelete({ type: "row", id: row.id, label: registerRowTitle(row) })} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </StickyTableScroll>
          </CardContent>
        </Card>
      ) : slice.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">Aucun résultat pour ces filtres.</p>
      ) : section === "sites" ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {(slice as AsbestosSiteDtaRow[]).map((site) => (
            <article key={site.id} className="flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{site.departement}</p>
                <Chip className={presenceTone(site.presenceAmiante).className}>{presenceTone(site.presenceAmiante).label}</Chip>
              </div>
              <h2 className="mt-2 break-words text-lg font-semibold text-stone-900">{site.site}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-stone-600">{site.acces || site.commentaires || "Accès non précisé"}</p>
              <p className="mt-3 text-xs text-stone-500">{zonesOf(site.id).length} zone(s) · prochain contrôle {formatMaybeExcelDate(site.prochainControle)}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" className={primaryBtn} onClick={() => openSite(site.id)}>Ouvrir le dossier</Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => editSite(site)}>Modifier</Button>
                <Button type="button" variant="outline" className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => setPendingDelete({ type: "site", id: site.id, label: site.site })}>Supprimer</Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {(slice as AsbestosRegisterRow[]).map((row) => {
            const tone = scoreTone(registerRowScore(row));
            const linked = sites.find((site) => site.id === row.siteId);
            return (
              <article key={row.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm">
                <button type="button" onClick={() => setScreen({ kind: "record", id: row.id })} className="w-full text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip className="bg-stone-50 text-stone-700 ring-1 ring-stone-200">{kindLabel(row.kind)}</Chip>
                    <Chip className={tone.className}>{tone.label}</Chip>
                  </div>
                  <p className="mt-2 break-words font-semibold text-stone-900">{row.kind === "materiau" || row.kind === "synthese" ? displayMaterial(row) : registerRowTitle(row)}</p>
                  {row.kind === "materiau" || row.kind === "synthese" ? <p className="mt-1 text-sm text-stone-700"><span className="text-stone-500">Zone · </span>{displayZone(row)}</p> : null}
                  <p className="mt-1 flex items-start gap-2 text-sm text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{linked?.site || row.localisation || row.lieuZone || "—"}</p>
                </button>
                <div className="mt-3">
                  <RowActions label={registerRowTitle(row)} onOpen={() => setScreen({ kind: "record", id: row.id })} onEdit={() => editRow(row)} onDelete={() => setPendingDelete({ type: "row", id: row.id, label: registerRowTitle(row) })} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ListPaginationBar
        currentPage={page}
        totalPages={pages}
        totalItems={active.length}
        onPageChange={setPage}
        itemLabel="élément(s)"
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </div>
    {deleteDialog}
    </>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Building2; label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <Icon className="h-4 w-4" />
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl bg-stone-50 px-3 py-2 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-stone-900">{value || "—"}</dd>
    </div>
  );
}

function BrowseFallback({ onBack }: { onBack: () => void }) {
  return <button type="button" className="text-sm text-indigo-800" onClick={onBack}>Retour à la liste</button>;
}

const PRESENCE_OPTIONS = [
  { value: "Oui", hint: "Amiante confirmé sur le site" },
  { value: "Non", hint: "Aucun matériau recensé" },
  { value: "Non mais 1997", hint: "Permis de construire en 1997" },
  { value: "Non mais 1998", hint: "Permis de construire en 1998" },
  { value: "Désamianté", hint: "Retrait déjà réalisé" },
  { value: "A vérifier", hint: "Le dossier doit être relu" },
  { value: "A diagnostiquer", hint: "Le repérage n'est pas fait" },
];

const DTA_OPTIONS = [
  { value: "Oui", hint: "Le dossier technique est disponible" },
  { value: "Non", hint: "Aucun dossier n'est joint" },
  { value: "À constituer", hint: "Les pièces sont encore à rassembler" },
];

const ACCESS_MODES = [
  { id: "vehicule", label: "Véhicule", hint: "Route ou parking", test: /voiture|véhicule|vehicule|parking|route/i },
  { id: "pied", label: "À pied", hint: "Marche d'approche", test: /pied|marcher|marche|sentier/i },
  { id: "maritime", label: "Maritime", hint: "Bateau ou annexe", test: /bateau|maritime|annexe|\bmer\b/i },
  { id: "reglemente", label: "Réglementé", hint: "Interdit ou sur autorisation", test: /interdit|autoris|réglement|reglement|badge/i },
];

const SCORE_FAMILIES = [
  { id: "EP", hint: "Suivi périodique, état correct", test: /\bEP\b/ },
  { id: "AC1", hint: "Dégradation ponctuelle", test: /\bAC1\b/ },
  { id: "AC2", hint: "Action corrective urgente", test: /\bAC2\b/ },
];

const STATUT_FAMILIES = [
  { id: "Confirmé", hint: "Amiante reconnu", test: /confirm/i },
  { id: "Suspect", hint: "Analyse encore à faire", test: /suspect/i },
  { id: "Retiré", hint: "Matériau déjà déposé", test: /retir/i },
  { id: "Non amianté", hint: "Analyse négative", test: /non amiant/i },
  { id: "Non contrôlé", hint: "Réserve de diagnostic", test: /non contrôl|non control|réserve|reserve/i },
];

const ANALYSE_FAMILIES = [
  { id: "Examen visuel", hint: "Sans prélèvement", test: /visuel/i },
  { id: "Prélèvement", hint: "Échantillon prélevé", test: /prélèvement|prelevement/i },
  { id: "Laboratoire", hint: "META, MOLP ou compte rendu", test: /laboratoire|meta|molp/i },
  { id: "Avant travaux", hint: "Repérage avant intervention", test: /avant travaux|\bRAT\b/i },
  { id: "Empoussièrement", hint: "Mesure dans l'air", test: /empoussi/i },
];

const CONTROLE_FAMILIES = [
  { id: "Contrôle périodique", hint: "Listes A et B", test: /périodique|periodique/i },
  { id: "Retrait", hint: "Travaux de désamiantage", test: /retrait|désamiant|desamiant/i },
  { id: "Repérage", hint: "Diagnostic ou avant travaux", test: /repérage|reperage|recensement|diagnostic/i },
  { id: "Empoussièrement", hint: "Mesure dans l'air", test: /empoussi/i },
];

const RETRAIT_OPTIONS = [
  { value: "Oui", hint: "Le matériau a été retiré" },
  { value: "Partiel", hint: "Une partie reste en place" },
  { value: "Non", hint: "Aucun retrait réalisé" },
];

function stripAccessMode(text: string): string {
  let next = text.trim();
  for (const mode of ACCESS_MODES) {
    const prefix = `${mode.label}. `;
    if (next.startsWith(prefix)) next = next.slice(prefix.length).trim();
    if (next === mode.hint) next = "";
  }
  return next;
}

function applyAccessMode(modeId: string, text: string): string {
  const mode = ACCESS_MODES.find((item) => item.id === modeId);
  const body = stripAccessMode(text);
  if (!mode) return body;
  if (!body) return mode.hint;
  if (mode.test.test(body)) return body;
  return `${mode.label}. ${body}`;
}

function FormBlock({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {hint ? <p className="mt-1 text-sm leading-6 text-slate-500">{hint}</p> : null}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ChoiceGrid({ label, value, options, onChange }: { label: string; value: string; options: { value: string; hint: string }[]; onChange: (value: string) => void }) {
  const known = options.some((option) => option.value === value);
  const items = !value || known ? options : [{ value, hint: "Valeur déjà enregistrée" }, ...options];
  return (
    <fieldset className="min-w-0 space-y-2 sm:col-span-2">
      <legend className="text-sm font-medium text-slate-800">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : option.value)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${selected ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-slate-50/50 hover:border-indigo-200 hover:bg-white"}`}
            >
              <span className="block text-sm font-semibold text-slate-900">{option.value}</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FamilyEditor({ id, label, detailLabel, value, families, onChange }: { id: string; label: string; detailLabel: string; value: string; families: { id: string; hint: string; test: RegExp }[]; onChange: (value: string) => void }) {
  const active = families.filter((family) => family.test.test(value)).map((family) => family.id);
  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {families.map((family) => {
            const on = active.includes(family.id);
            return (
              <button
                key={family.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const trimmed = value.trim();
                  const short = families.some((item) => item.id.toLowerCase() === trimmed.toLowerCase());
                  if (!trimmed || short) { onChange(family.id); return; }
                  if (!on) onChange(`${trimmed}\n${family.id}`);
                }}
                className={`rounded-2xl border px-3 py-3 text-left ${on ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-200"}`}
              >
                <span className="block text-sm font-semibold text-slate-900">{family.id}</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">{family.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
      <AreaField id={id} label={detailLabel} value={value} onChange={onChange} />
    </div>
  );
}

function SitePicker({ sites, value, onChange }: { sites: AsbestosSiteDtaRow[]; value: string; onChange: (id: string) => void }) {
  const selected = sites.find((site) => site.id === value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const label = selected ? [selected.departement, selected.site].filter(Boolean).join(" — ") : "";
  const matches = sites.filter((site) => `${site.departement} ${site.site}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8);
  return (
    <div className="relative min-w-0 space-y-1.5 sm:col-span-2">
      <Label htmlFor="site-picker">Site</Label>
      <div className="relative">
        <Input
          id="site-picker"
          value={open ? query : label}
          placeholder="Rechercher par nom ou service"
          autoComplete="off"
          onFocus={() => { setOpen(true); setQuery(""); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          className={`${fieldClass} pl-10`}
        />
        <FieldGlyph side="left" label="Placer le curseur dans Site" onClick={() => focusField("site-picker")}><Search className="h-4 w-4" /></FieldGlyph>
      </div>
      {open ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {matches.length === 0 ? <li className="px-3 py-2 text-sm text-slate-500">Aucun site ne correspond.</li> : matches.map((site) => (
            <li key={site.id}>
              <button type="button" className="flex w-full flex-col px-3 py-2 text-left hover:bg-indigo-50" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(site.id); setOpen(false); }}>
                <span className="text-sm font-medium text-slate-900">{site.site}</span>
                <span className="text-xs text-slate-500">{site.departement || "Service non renseigné"}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs leading-5 text-slate-500">
        {selected
          ? `${selected.presenceAmiante ? `Présence : ${selected.presenceAmiante}` : "Présence non renseignée"}${selected.acces ? ` · ${selected.acces}` : ""}`
          : "Saisissez quelques lettres. Seuls les sites déjà créés peuvent être choisis."}
      </p>
    </div>
  );
}

function FormFooter({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="rounded-xl border-slate-200" onClick={onBack}>Retour à la liste</Button>
        <Button type="submit" className={primaryBtn}>Enregistrer</Button>
      </div>
    </>
  );
}

function SiteForm({
  draft: initial, services, onBack, onSave,
}: {
  draft: AsbestosSiteDtaRow;
  services: string[];
  onBack: (screen: Screen) => void;
  onSave: (site: AsbestosSiteDtaRow) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [accessMode, setAccessMode] = useState(() => ACCESS_MODES.find((item) => item.test.test(initial.acces))?.id || "");
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const requestLeave = useLeaveGuard(dirty);
  const patch = (partial: Partial<AsbestosSiteDtaRow>) => setDraft((current) => ({ ...current, ...partial }));
  const back = () => requestLeave(() => onBack(initial.site ? { kind: "site", id: initial.id } : { kind: "browse" }));
  const serviceOptions = draft.departement && !services.includes(draft.departement) ? [draft.departement, ...services] : services;
  const lastIso = toDateInput(draft.dateDernierControle);
  const suggested = lastIso ? addYears(lastIso, 3) : "";
  const needsDiagnosis = draft.presenceAmiante === "A diagnostiquer" || draft.presenceAmiante === "A vérifier";
  const needsDta = draft.dtaStatut === "Non" || draft.dtaStatut === "À constituer";

  return (
    <form className="min-w-0 space-y-5" onSubmit={(event) => {
      event.preventDefault();
      if (!draft.site.trim()) { setError("Indiquez le nom du site."); return; }
      if (!draft.departement.trim()) { setError("Choisissez le service dans la liste."); return; }
      onSave({ ...draft, site: draft.site.trim(), departement: draft.departement.trim(), acces: applyAccessMode(accessMode, draft.acces) });
    }}>
      <div>
        <h1 className="break-words text-2xl font-semibold text-slate-900">{initial.site ? "Modifier le site" : "Nouveau site"}</h1>
        <p className="mt-1 text-sm text-slate-500">Le service, la présence et le DTA se choisissent. L'accès et les commentaires restent précisables.</p>
      </div>
      <FormBlock title="Identité" hint="Le service reprend les services déjà présents dans le suivi.">
        <SelectField label="Service" icon={Building2} value={draft.departement} onChange={(value) => patch({ departement: value })}>
          <option value="">Choisir un service</option>
          {serviceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </SelectField>
        <TextField id="site-person" label="Personne en charge" value={draft.personneEnCharge || ""} onChange={(value) => patch({ personneEnCharge: value })} icon={UserRound} placeholder="Nom et prénom" />
        <div className="sm:col-span-2"><TextField id="site-name" label="Site" value={draft.site} onChange={(value) => patch({ site: value })} icon={Building2} placeholder="Phare, feu, centre ou local" /></div>
      </FormBlock>
      <FormBlock title="Accès" hint="Choisissez le mode, puis décrivez le chemin réel : distance, interdiction, badge, annexe.">
        <ChoiceGrid
          label="Mode d'accès"
          value={ACCESS_MODES.find((item) => item.id === accessMode)?.label || ""}
          options={ACCESS_MODES.map((item) => ({ value: item.label, hint: item.hint }))}
          onChange={(label) => {
            const mode = ACCESS_MODES.find((item) => item.label === label);
            setAccessMode(mode?.id || "");
            patch({ acces: applyAccessMode(mode?.id || "", draft.acces) });
          }}
        />
        <AreaField id="site-access" label="Précision d'accès" value={draft.acces} onChange={(value) => { patch({ acces: value }); setAccessMode(ACCESS_MODES.find((item) => item.test.test(value))?.id || accessMode); }} />
      </FormBlock>
      <FormBlock title="Présence et dossier technique">
        <ChoiceGrid label="Présence amiante" value={draft.presenceAmiante || ""} options={PRESENCE_OPTIONS} onChange={(value) => patch({ presenceAmiante: value })} />
        <ChoiceGrid label="Dossier technique amiante" value={draft.dtaStatut || ""} options={DTA_OPTIONS} onChange={(value) => patch({ dtaStatut: value })} />
      </FormBlock>
      <FormBlock title="Calendrier" hint="Pour les matériaux de la liste A, le contrôle périodique est en général tous les trois ans.">
        <DateField id="site-last" label="Dernier contrôle" value={draft.dateDernierControle} onChange={(value) => patch({ dateDernierControle: value })} />
        <DateField id="site-next" label="Prochain contrôle" value={draft.prochainControle || ""} onChange={(value) => patch({ prochainControle: value })} />
        <div className="flex items-end">
          <Button type="button" variant="outline" className="h-12 rounded-xl border-indigo-200 text-indigo-800" disabled={!suggested} onClick={() => suggested && patch({ prochainControle: suggested })}>
            Proposer +3 ans
          </Button>
        </div>
        <DateField id="site-maj" label="Date de mise à jour" value={draft.dateMaj || ""} onChange={(value) => patch({ dateMaj: value })} />
        {needsDiagnosis ? <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm leading-6 text-sky-950 sm:col-span-2">Ce site n'a pas de diagnostic abouti. Indiquez la date prévue pour le prochain contrôle.</p> : null}
        {draft.presenceAmiante === "Désamianté" ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950 sm:col-span-2">Le site est marqué désamianté. Les zones restantes peuvent être notées comme retirées dans leur fiche.</p> : null}
      </FormBlock>
      <FormBlock title="Notes et pièces" hint={needsDta ? "Le DTA n'est pas disponible. Joignez-le dès qu'il est constitué." : "Rapport, photo d'accès ou dossier technique."}>
        <AreaField id="site-notes" label="Commentaires" value={draft.commentaires} onChange={(value) => patch({ commentaires: value })} />
        <div className="sm:col-span-2">
          <AttachmentBoard attachments={draft.attachments || []} onChange={(attachments) => patch({ attachments })} />
        </div>
      </FormBlock>
      <FormFooter error={error} onBack={back} />
    </form>
  );
}

function RecordForm({
  draft: initial, sites, onBack, onSave,
}: {
  draft: AsbestosRegisterRow;
  sites: AsbestosSiteDtaRow[];
  onBack: (screen: Screen) => void;
  onSave: (row: AsbestosRegisterRow) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const requestLeave = useLeaveGuard(dirty);
  const back = () => requestLeave(() => onBack(draft.siteId && initial.zoneMateriau ? { kind: "record", id: initial.id } : draft.siteId ? { kind: "site", id: draft.siteId } : { kind: "browse" }));
  const set = (key: keyof AsbestosRegisterRow, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const existing = Boolean(initial.zoneMateriau || initial.materiau || initial.typeControle || initial.rawCol1);
  const title = draft.kind === "materiau"
    ? (existing ? "Modifier la zone" : "Nouvelle zone")
    : draft.kind === "synthese"
      ? (existing ? "Modifier la synthèse" : "Nouvelle synthèse")
      : draft.kind === "controle"
        ? (existing ? "Modifier le contrôle" : "Nouveau contrôle")
        : (existing ? "Modifier la fiche" : "Nouvelle fiche");

  return (
    <form className="min-w-0 space-y-5" onSubmit={(event) => {
      event.preventDefault();
      if (draft.kind === "materiau" && !draft.siteId) { setError("Choisissez le site de cette zone."); return; }
      if ((draft.kind === "materiau" || draft.kind === "synthese") && !draft.zone) { setError("Choisissez une zone dans la liste."); return; }
      if ((draft.kind === "materiau" || draft.kind === "synthese") && !draft.materiau) { setError("Choisissez un matériau dans la liste."); return; }
      onSave({ ...draft, zoneMateriau: draft.zone && draft.materiau ? `${draft.zone} — ${draft.materiau}` : draft.zoneMateriau });
    }}>
      <div>
        <h1 className="break-words text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Zone et matériau viennent de listes fermées. Le constat détaillé déjà saisi est conservé.</p>
      </div>
      {draft.kind === "materiau" || draft.kind === "synthese" ? (
        <FormBlock title="Identification" hint="Un site se recherche. La zone et le matériau ne se saisissent pas librement.">
          {draft.kind === "materiau" ? <SitePicker sites={sites} value={draft.siteId || ""} onChange={(value) => set("siteId", value)} /> : null}
          <SelectField label="Zone" icon={MapPin} value={draft.zone || ""} onChange={(value) => set("zone", value)}>
            <option value="">Choisir une zone</option>
            {AMIANTE_ZONES.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Matériau" icon={Layers} value={draft.materiau || ""} onChange={(value) => set("materiau", value)}>
            <option value="">Choisir un matériau</option>
            {AMIANTE_MATERIAUX.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          {draft.zone && draft.materiau ? (
            <p className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-950 sm:col-span-2">
              <span className="font-semibold">{draft.zone}</span>
              <span className="text-indigo-300"> · </span>
              {draft.materiau}
            </p>
          ) : null}
        </FormBlock>
      ) : null}
      {draft.kind === "materiau" || draft.kind === "synthese" ? (
        <FormBlock title="Localisation" hint="Bâtiment, niveau, pièce ou repère du diagnostic.">
          <AreaField id="f-localisation" label="Localisation précise" value={draft.localisation || ""} onChange={(value) => set("localisation", value)} />
          {draft.kind === "synthese" ? <AreaField id="f-description" label="Description" value={draft.description || ""} onChange={(value) => set("description", value)} /> : null}
        </FormBlock>
      ) : null}
      {draft.kind === "materiau" ? (
        <FormBlock title="Diagnostic" hint="Le score et le statut se classent d'abord. Le texte long du rapport reste en dessous.">
          <FamilyEditor id="f-analyse" label="Type d'analyse" detailLabel="Compte rendu d'analyse" value={draft.typeAnalyse || ""} families={ANALYSE_FAMILIES} onChange={(value) => set("typeAnalyse", value)} />
          <DateField id="f-premier" label="Premier repérage" value={draft.datePremierReperage || ""} onChange={(value) => set("datePremierReperage", value)} />
          <DateField id="f-dernier" label="Dernier contrôle" value={draft.dernierControle || ""} onChange={(value) => set("dernierControle", value)} />
          <FamilyEditor id="f-score" label="Score de conservation" detailLabel="Constat détaillé" value={draft.scoreActuel || ""} families={SCORE_FAMILIES} onChange={(value) => set("scoreActuel", value)} />
          <FamilyEditor id="f-statut" label="Statut réglementaire" detailLabel="Formulation du statut" value={draft.statutMateriau || ""} families={STATUT_FAMILIES} onChange={(value) => set("statutMateriau", value)} />
        </FormBlock>
      ) : null}
      {draft.kind === "synthese" || draft.kind === "controle" ? (
        <FormBlock title="Conservation" hint="EP pour le suivi, AC1 pour une dégradation ponctuelle, AC2 pour une action urgente.">
          <FamilyEditor id="f-score-libre" label="Score" detailLabel="Constat détaillé" value={draft.score || ""} families={SCORE_FAMILIES} onChange={(value) => set("score", value)} />
        </FormBlock>
      ) : null}
      {draft.kind === "materiau" ? (
        <FormBlock title="Actions" hint="Indiquez si le retrait est fait, puis ce qui a déjà été mené et ce qui reste à prévoir.">
          <ChoiceGrid label="Retrait réalisé" value={draft.retraitRealise || ""} options={RETRAIT_OPTIONS} onChange={(value) => set("retraitRealise", value)} />
          <AreaField id="f-fait" label="Actions déjà réalisées" value={draft.actionsRealisees || ""} onChange={(value) => set("actionsRealisees", value)} />
          <AreaField id="f-prevoir" label="Action à prévoir" value={draft.actionAPrevoir || ""} onChange={(value) => set("actionAPrevoir", value)} />
        </FormBlock>
      ) : null}
      {draft.kind === "controle" ? (
        <FormBlock title="Périmètre du contrôle" hint="Le type se classe. Le libellé complet du rapport reste modifiable.">
          <DateField id="f-date-controle" label="Date du contrôle" value={draft.dateControle || ""} onChange={(value) => set("dateControle", value)} />
          <DateField id="f-echeance" label="Prochaine échéance" value={draft.prochaineEcheance || ""} onChange={(value) => set("prochaineEcheance", value)} />
          <FamilyEditor id="f-type-controle" label="Type de contrôle" detailLabel="Libellé complet" value={draft.typeControle || ""} families={CONTROLE_FAMILIES} onChange={(value) => set("typeControle", value)} />
          <AreaField id="f-lieu" label="Périmètre visité" value={draft.lieuZone || ""} onChange={(value) => set("lieuZone", value)} />
          <AreaField id="f-presence" label="Présence amiante" value={draft.zonesPresence || ""} onChange={(value) => set("zonesPresence", value)} />
          <AreaField id="f-sans" label="Zones non amiantées" value={draft.zonesNonAmiantees || ""} onChange={(value) => set("zonesNonAmiantees", value)} />
          <AreaField id="f-action" label="Actions à mener" value={draft.action || ""} onChange={(value) => set("action", value)} />
        </FormBlock>
      ) : null}
      {draft.kind === "historique" ? (
        <FormBlock title="Événement">
          <TextField id="f-event" label="Événement" value={draft.rawCol1 || ""} onChange={(value) => set("rawCol1", value)} />
          <AreaField id="f-detail" label="Détail" value={draft.rawCol2 || ""} onChange={(value) => set("rawCol2", value)} />
        </FormBlock>
      ) : null}
      <FormBlock title="Pièces jointes" hint="Rapport, photo ou résultat de laboratoire.">
        <div className="sm:col-span-2">
          <AttachmentBoard attachments={draft.attachments || []} onChange={(attachments) => setDraft((current) => ({ ...current, attachments }))} />
        </div>
      </FormBlock>
      <FormFooter error={error} onBack={back} />
    </form>
  );
}
