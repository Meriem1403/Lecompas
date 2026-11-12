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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { ColumnFilterPopover } from "@/app/components/ui/column-filter-popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  ClipboardList,
  Download,
  Edit,
  Eye,
  FileText,
  Info,
  LayoutGrid,
  MapPin,
  Paperclip,
  PhoneCall,
  PlusCircle,
  Route,
  Search,
  Send,
  Shield,
  Signature,
  SlidersHorizontal,
  Table2,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "@/app/components/ui/list-pagination-bar";
import { emptyColumnFilterState, type ColumnFilterKind, type ColumnFilterState } from "@/app/utils/riskManagementFilterLogic";
import { loadPreventionPlans, savePreventionPlans } from "@/app/utils/lecompasStorage";
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

export type {
  RiskMeasure,
  PlanRiskEvaluationRow,
  PlanCoIntervenantRow,
  PlanAnnexAttachment,
  RiskInput,
  PlanProtocolFields,
  PlanStatus,
  PlanRecord,
} from "@/app/types/preventionPlan";

import type {
  PlanAnnexAttachment,
  PlanProtocolFields,
  PlanRecord,
  PlanStatus,
  RiskInput,
} from "@/app/types/preventionPlan";

const PLAN_ANNEX_MAX_BYTES = 12 * 1024 * 1024;
const PLAN_ANNEX_MAX_COUNT = 40;
/** Image de signature (scan, photo) injectée dans le PDF */
const SIGNATURE_DEMAT_MAX_BYTES = 800 * 1024;

function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function migrateAnnexAttachments(protocol: Partial<PlanProtocolFields> & Record<string, unknown>): PlanAnnexAttachment[] {
  const raw = protocol.annexAttachments;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw
    .map((item, i) => {
      const o = item as { id?: string; fileName?: string; mimeType?: string; dataUrl?: string; sizeBytes?: unknown };
      let id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `annex-${i}-${Math.random().toString(36).slice(2, 9)}`;
      let dup = 0;
      while (seen.has(id)) id = `${o.id ?? "annex"}-${i}-${dup++}`;
      seen.add(id);
      const fileName = typeof o.fileName === "string" && o.fileName.trim() ? o.fileName.trim() : "document";
      const mimeType = typeof o.mimeType === "string" && o.mimeType.trim() ? o.mimeType.trim() : "application/octet-stream";
      const dataUrl = typeof o.dataUrl === "string" ? o.dataUrl : "";
      const sizeBytes =
        typeof o.sizeBytes === "number" && Number.isFinite(o.sizeBytes) ? Math.max(0, Math.floor(o.sizeBytes)) : 0;
      return { id, fileName, mimeType, dataUrl, sizeBytes };
    })
    .filter((a) => a.dataUrl.length > 0);
}

function readFileAsDataUrlCapped(file: File, maxBytes: number): Promise<{ dataUrl: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error("fichier_trop_volumineux"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ dataUrl: String(reader.result || ""), sizeBytes: file.size });
    };
    reader.onerror = () => reject(reader.error ?? new Error("echec lecture"));
    reader.readAsDataURL(file);
  });
}

type ViewMode = "list" | "detail" | "create" | "edit";

interface PreventionPlanViewProps {
  risks: RiskInput[];
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
  accessToken?: string;
}

const statusLabel: Record<PlanStatus, string> = {
  a_lancer: "À lancer",
  en_cours: "En cours",
  termine: "Terminé",
};

const statusTone: Record<PlanStatus, { chip: string; dot: string }> = {
  a_lancer: { chip: "bg-amber-50 text-amber-950 ring-amber-300", dot: "bg-amber-500" },
  en_cours: { chip: "bg-sky-50 text-sky-950 ring-sky-300", dot: "bg-sky-600" },
  termine: { chip: "bg-emerald-50 text-emerald-950 ring-emerald-300", dot: "bg-emerald-600" },
};

function PlanStatusMark({ status }: { status: PlanStatus }) {
  const tone = statusTone[status];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tone.chip)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} aria-hidden />
      {statusLabel[status]}
    </span>
  );
}

function PlanDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full">
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="relative h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm text-stone-900 shadow-sm outline-none focus:border-rose-900 focus:ring-4 focus:ring-rose-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden />
    </div>
  );
}

const planSelectClass = "h-11 w-full rounded-xl border-slate-200 bg-white py-0 shadow-sm data-[size=default]:h-11";
const planFileClass = "h-11 rounded-xl border-slate-200 bg-white px-3 py-1 text-sm shadow-sm file:mr-3 file:inline-flex file:h-8 file:items-center file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:text-sm file:font-medium file:text-stone-800";

function formatPlanDate(value: string | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value?.trim() || "");
  if (!match) return value?.trim() || "Non définie";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const priorityLabelUi: Record<"haute" | "moyenne" | "basse", string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

function newRiskEvaluationRow(): PlanRiskEvaluationRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    linkedEvaluationRiskId: "",
    evaluationRiskFreeText: "",
    domaine: "",
    natureRisques: "",
    mesuresPrevention: "",
  };
}

/** Mesures de prévention existantes (champ `existingMeasures` de la fiche risque). */
function existingPreventionMeasuresFromRisk(risk: RiskInput): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];
  (risk.existingMeasures ?? []).forEach((m, i) => {
    const t = m.trim();
    if (t) out.push({ key: `ex-${i}`, text: t });
  });
  return out;
}

/** Filtre sur numéro, intitulé, situation, dommage, domaine… */
function filterCatalogRisks(risks: RiskInput[], query: string): RiskInput[] {
  const q = query.trim().toLowerCase();
  if (!q) return risks;
  return risks.filter((r) => {
    const blob = [
      r.numeroRisque,
      r.title,
      r.situation ?? "",
      r.associatedRisk ?? "",
      r.domain ?? "",
      r.service,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

function newCoIntervenantRow(): PlanCoIntervenantRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    qualite: "",
    denomination: "",
    adresse: "",
    contactNom: "",
    contactEmail: "",
    complements: "",
  };
}

function coIntervenantRowHasContent(r: PlanCoIntervenantRow): boolean {
  return [r.qualite, r.denomination, r.adresse, r.contactNom, r.contactEmail, r.complements].some((s) => s.trim().length > 0);
}

/** Anciens champs APB + société → lignes de co-intervenants. */
function migrateCoIntervenantRows(protocol: Partial<PlanProtocolFields> & Record<string, unknown>): PlanCoIntervenantRow[] {
  const normalize = (r: PlanCoIntervenantRow | Record<string, unknown>, i: number): PlanCoIntervenantRow => ({
    id: typeof r?.id === "string" && r.id ? r.id : `co-${i}`,
    qualite: typeof r?.qualite === "string" ? r.qualite : "",
    denomination: typeof r?.denomination === "string" ? r.denomination : "",
    adresse: typeof r?.adresse === "string" ? r.adresse : "",
    contactNom: typeof r?.contactNom === "string" ? r.contactNom : "",
    contactEmail: typeof r?.contactEmail === "string" ? r.contactEmail : "",
    complements: typeof r?.complements === "string" ? r.complements : "",
  });

  const raw = protocol.coIntervenantRows as PlanCoIntervenantRow[] | undefined;
  const fromArray = Array.isArray(raw) ? raw.map(normalize) : [];

  if (fromArray.some(coIntervenantRowHasContent)) {
    return fromArray.length > 0 ? fromArray : [newCoIntervenantRow()];
  }

  const legacy: PlanCoIntervenantRow[] = [];
  const e1n = String(protocol.entreprise1Name ?? "").trim();
  const e1a = String(protocol.entreprise1Address ?? "").trim();
  const navire = String(protocol.navireName ?? "").trim();
  const capitaine = String(protocol.capitaineName ?? "").trim();
  const comp1: string[] = [];
  if (navire) comp1.push(`Navire : ${navire}`);
  if (capitaine) comp1.push(`Capitaine : ${capitaine}`);
  if (e1n || e1a || comp1.length > 0) {
    const row = newCoIntervenantRow();
    legacy.push({
      ...row,
      denomination: e1n,
      adresse: e1a,
      complements: comp1.join("\n"),
    });
  }

  const e2n = String(protocol.entreprise2Name ?? "").trim();
  const e2a = String(protocol.entreprise2Address ?? "").trim();
  const resp = String(protocol.responsableName ?? "").trim();
  const mail = String(protocol.responsableEmail ?? "").trim();
  if (e2n || e2a || resp || mail) {
    const row = newCoIntervenantRow();
    legacy.push({
      ...row,
      denomination: e2n,
      adresse: e2a,
      contactNom: resp,
      contactEmail: mail,
    });
  }

  if (legacy.length > 0) return legacy;
  if (fromArray.length > 0) return fromArray;
  return [newCoIntervenantRow()];
}

/** Garantit des ids distincts pour chaque ligne §4 ; des doublons font que plusieurs éditeurs partagent une même mise à jour d’état (saisie « qui ne reste pas »). */
function dedupeRiskEvaluationRowIds(rows: PlanRiskEvaluationRow[]): PlanRiskEvaluationRow[] {
  const used = new Set<string>();
  return rows.map((r, index) => {
    let base = typeof r.id === "string" ? r.id.trim() : "";
    if (!base) base = `row-${index}`;
    let candidate = base;
    let n = 0;
    while (used.has(candidate)) {
      candidate = `${base}__${n++}`;
    }
    used.add(candidate);
    return candidate === r.id ? r : { ...r, id: candidate };
  });
}

/** Anciens champs monolithiques (compat : une seule ligne) si le tableau était vide ou placeholder. */
function migrateRiskEvaluationRows(protocol: Partial<PlanProtocolFields> & Record<string, unknown>): PlanRiskEvaluationRow[] {
  const normalizeRow = (r: PlanRiskEvaluationRow | Record<string, unknown>, i: number): PlanRiskEvaluationRow => ({
    id: typeof r?.id === "string" && r.id ? r.id : `row-${i}`,
    linkedEvaluationRiskId:
      typeof r?.linkedEvaluationRiskId === "string"
        ? r.linkedEvaluationRiskId
        : typeof (r as { linkedRiskId?: string }).linkedRiskId === "string"
          ? (r as { linkedRiskId: string }).linkedRiskId
          : "",
    evaluationRiskFreeText:
      typeof (r as { evaluationRiskFreeText?: string }).evaluationRiskFreeText === "string"
        ? (r as { evaluationRiskFreeText: string }).evaluationRiskFreeText
        : "",
    domaine: typeof r?.domaine === "string" ? r.domaine : "",
    natureRisques:
      typeof r?.natureRisques === "string"
        ? r.natureRisques
        : typeof (r as { nature?: string })?.nature === "string"
          ? (r as { nature: string }).nature
          : "",
    mesuresPrevention: typeof r?.mesuresPrevention === "string" ? r.mesuresPrevention : "",
  });

  const rawRows = protocol.riskEvaluationRows as PlanRiskEvaluationRow[] | undefined;
  const rows = Array.isArray(rawRows) ? rawRows.map(normalizeRow) : [];
  const rowHasContent = (r: PlanRiskEvaluationRow) =>
    r.linkedEvaluationRiskId.trim().length > 0 ||
    r.evaluationRiskFreeText.trim().length > 0 ||
    r.domaine.trim().length > 0 ||
    r.natureRisques.trim().length > 0 ||
    r.mesuresPrevention.trim().length > 0;

  const dom = String(protocol.evaluationDomaineRisques ?? "").trim();
  const nat = String(protocol.evaluationNatureRisques ?? "").trim();
  const mes = String(protocol.evaluationMesuresPrevention ?? "").trim();
  const legacyHas = !!(dom || nat || mes);

  if (rows.some(rowHasContent)) return dedupeRiskEvaluationRowIds(rows.length > 0 ? rows : [newRiskEvaluationRow()]);
  if (legacyHas) {
    const row = newRiskEvaluationRow();
    return dedupeRiskEvaluationRowIds([{ ...row, domaine: dom, natureRisques: nat, mesuresPrevention: mes }]);
  }
  if (rows.length > 0) return dedupeRiskEvaluationRowIds(rows);
  return dedupeRiskEvaluationRowIds([newRiskEvaluationRow()]);
}

/** Anciens enregistrements utilisaient encore « protocole de sécurité » comme titre : on affiche désormais le plan de prévention. */
function normalizeDocumentTitle(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  const t = raw.trim().replace(/\s+/g, " ");
  if (/^protocole\s+de\s+s[ée]curit[ée]$/i.test(t)) return fallback;
  if (/^protocole\s+de\s+securite$/i.test(t)) return fallback;
  if (/^PROTOCOLE\s+DE\s+SECURITE$/i.test(t)) return fallback;
  return raw.trim();
}

function mergePlanProtocol(
  partial: Partial<PlanProtocolFields> | undefined,
  risk: RiskInput | undefined,
  currentUserName: string | undefined,
): PlanProtocolFields {
  const base = defaultProtocolFields(risk, currentUserName);
  if (!partial || Object.keys(partial).length === 0) return base;
  const merged = { ...base, ...partial } as PlanProtocolFields & Record<string, unknown>;
  merged.riskEvaluationRows = migrateRiskEvaluationRows({ ...merged });
  merged.coIntervenantRows = migrateCoIntervenantRows({ ...merged });
  merged.annexAttachments = migrateAnnexAttachments({ ...merged });
  const sigM = merged as Record<string, unknown>;
  merged.signatureDematerialiseeUrl1 =
    typeof sigM.signatureDematerialiseeUrl1 === "string" ? sigM.signatureDematerialiseeUrl1 : "";
  merged.signatureDematerialiseeUrl2 =
    typeof sigM.signatureDematerialiseeUrl2 === "string" ? sigM.signatureDematerialiseeUrl2 : "";
  merged.signatureDematerialiseeUrl3 =
    typeof sigM.signatureDematerialiseeUrl3 === "string" ? sigM.signatureDematerialiseeUrl3 : "";
  merged.protocoleTitle = normalizeDocumentTitle(merged.protocoleTitle as string, base.protocoleTitle);
  return merged as PlanProtocolFields;
}

const defaultProtocolFields = (risk?: RiskInput, currentUserName?: string): PlanProtocolFields => ({
  protocoleTitle: "PLAN DE PREVENTION",
  codeTravailReference: "Code du Travail — articles R4515-4 à R4515-11 (plan de prévention — coactivité)",
  operationType: "OPERATION DE CHARGEMENT / DECHARGEMENT",
  coIntervenantRows: [newCoIntervenantRow()],
  prestationNature: risk ? `Prevention du risque ${risk.numeroRisque} - ${risk.title}` : "",
  lieuLivraison: risk?.site || "",
  materielsSpecifiques: "",
  consignesSite: "",
  consignesOperation: "",
  evaluationRisques: "",
  riskEvaluationRows: [newRiskEvaluationRow()],
  personnesAPrevenir: "",
  mesuresUrgence: "SAMU : 15 - Pompiers : 18 - Police : 17 - Numero unique : 112",
  planTransmis: "",
  transmissionCelluleSecurite: "",
  transmissionCorrespondantSite: "",
  transmissionCorrespondantAPB: "",
  transmissionCelluleSecuriteStatus: "non_renseigne",
  transmissionCorrespondantSiteStatus: "non_renseigne",
  transmissionCorrespondantAPBStatus: "non_renseigne",
  transmissionCelluleSecuriteNom: "",
  transmissionCorrespondantSiteNom: "",
  transmissionCorrespondantAPBNom: "",
  transmissionCelluleSecuriteObs: "",
  transmissionCorrespondantSiteObs: "",
  transmissionCorrespondantAPBObs: "",
  observationsTransmission: "",
  observationsRemarques: "",
  signatureEntite1: "",
  signatureNom1: "",
  signaturePrenom1: "",
  signatureDate1: "",
  signatureEntite2: "",
  signatureNom2: "",
  signaturePrenom2: "",
  signatureDate2: "",
  signatureEntite3: "",
  signatureNom3: "",
  signaturePrenom3: "",
  signatureDate3: "",
  signatureDematerialiseeUrl1: "",
  signatureDematerialiseeUrl2: "",
  signatureDematerialiseeUrl3: "",
  planCirculation: "",
  materielRemplacer: "",
  annexAttachments: [],
  annexesDocuments: "",
});

function toPriority(level: number): "haute" | "moyenne" | "basse" {
  if (level > 9) return "haute";
  if (level >= 4) return "moyenne";
  return "basse";
}

function toStatus(measures: RiskMeasure[]): PlanStatus {
  if (measures.some((measure) => measure.status === "in_progress")) return "en_cours";
  if (measures.length > 0 && measures.every((measure) => measure.status === "completed")) return "termine";
  return "a_lancer";
}

const SELECT_EVAL_NONE = "__eval_aucune__";

interface RiskEvaluationLineEditorProps {
  row: PlanRiskEvaluationRow;
  risks: RiskInput[];
  onPatch: (patch: Partial<PlanRiskEvaluationRow>) => void;
}

/** Ligne §4 : recherche risque catalogue + listes déroulantes si liaison. */
function RiskEvaluationLineEditor({ row, risks, onPatch }: RiskEvaluationLineEditorProps) {
  const [riskSearchOpen, setRiskSearchOpen] = useState(false);
  const [riskSearch, setRiskSearch] = useState("");
  React.useEffect(() => {
    if (riskSearchOpen) setRiskSearch("");
  }, [riskSearchOpen]);

  const linked = row.linkedEvaluationRiskId ? risks.find((r) => r.id === row.linkedEvaluationRiskId) : undefined;
  const situationStr = (linked?.situation ?? "").trim();
  const dommageStr = (linked?.associatedRisk ?? "").trim();
  const measureChoices = linked ? existingPreventionMeasuresFromRisk(linked) : [];

  const filteredRisks = useMemo(() => filterCatalogRisks(risks, riskSearch), [risks, riskSearch]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Risque de l’évaluation interne (facultatif)</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {linked ? (
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
              <span className="min-w-0 flex-1 truncate text-left text-slate-900">
                {linked.numeroRisque} — {linked.title}
              </span>
            </div>
          ) : (
            <Input
              className="h-11 flex-1 rounded-xl border-slate-200 bg-white shadow-sm"
              placeholder="Saisie libre : référence, intitulé ou mention hors liste du référentiel"
              value={row.evaluationRiskFreeText ?? ""}
              onChange={(e) => onPatch({ evaluationRiskFreeText: e.target.value })}
              aria-label="Mention libre risque d’évaluation interne"
            />
          )}
          <Popover open={riskSearchOpen} onOpenChange={setRiskSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={riskSearchOpen}
                className="h-11 w-full shrink-0 justify-center gap-2 rounded-xl border-violet-200 bg-violet-50 font-normal text-violet-900 hover:bg-violet-100 sm:w-auto sm:min-w-[10rem]"
              >
                <Search className="h-4 w-4 opacity-70" aria-hidden />
                Référentiel
                <ChevronsUpDown className="h-4 w-4 opacity-50" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[min(100vw-2rem,380px)] p-0 z-[120]" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Filtrer le référentiel (n°, intitulé, situation…)" value={riskSearch} onValueChange={setRiskSearch} />
              <CommandList>
                <CommandEmpty>Aucun risque correspondant.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onPatch({ linkedEvaluationRiskId: "" });
                      setRiskSearchOpen(false);
                    }}
                  >
                    <span className="text-slate-600">Pas de liaison — uniquement la mention libre ci-dessus</span>
                  </CommandItem>
                  {filteredRisks.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={`${r.numeroRisque} ${r.title}`}
                      onSelect={() => {
                        onPatch({ linkedEvaluationRiskId: r.id, evaluationRiskFreeText: "" });
                        setRiskSearchOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4 shrink-0", row.linkedEvaluationRiskId === r.id ? "opacity-100" : "opacity-0")} />
                      <div className="min-w-0 flex flex-col">
                        <span className="font-medium truncate">
                          {r.numeroRisque} — {r.title}
                        </span>
                        {(r.situation ?? "").trim() ? (
                          <span className="text-xs text-slate-500 line-clamp-2">{(r.situation ?? "").trim()}</span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-muted-foreground">
          {linked
            ? "Pour revenir à une mention hors liste uniquement, ouvrez le référentiel puis choisissez « Pas de liaison »."
            : "Utilisez le champ pour la saisie libre visible immédiatement ; « Référentiel » sert uniquement à lier une fiche risque catalogue."}
        </p>
      </div>

      {linked ? (
        <div className="space-y-4 rounded-lg bg-violet-50/90 border border-violet-200 p-4">
          <p className="text-xs text-violet-900 font-medium">
            Propositions depuis la fiche risque (évaluation) : vous pouvez les insérer colonne par colonne. En dessous, les trois zones restent modifiables : saisissez aussi du texte libre qui ne figure pas sur la liste.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-violet-900">Situation dangereuse</Label>
              {!situationStr ? (
                <p className="text-xs text-slate-600">Non renseignée sur cette fiche risque.</p>
              ) : (
                <Select
                  value={SELECT_EVAL_NONE}
                  onValueChange={(v) => {
                    if (v === "apply-sit") {
                      const base = row.domaine.trim();
                      onPatch({ domaine: base ? `${base}\n\n${situationStr}` : situationStr });
                    }
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-violet-200 bg-white py-0 shadow-sm data-[size=default]:h-11">
                    <SelectValue placeholder="Insérer dans « Situation dangereuse »" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_EVAL_NONE}>— Choisir —</SelectItem>
                    <SelectItem value="apply-sit">Insérer le texte de la situation dangereuse</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {situationStr ? <p className="text-xs text-slate-700 whitespace-pre-wrap border border-violet-100 rounded-md bg-white/80 p-2">{situationStr}</p> : null}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-violet-900">Dommages associés</Label>
              {!dommageStr ? (
                <p className="text-xs text-slate-600">Non renseignés sur cette fiche risque.</p>
              ) : (
                <Select
                  value={SELECT_EVAL_NONE}
                  onValueChange={(v) => {
                    if (v === "apply-dom") {
                      const base = row.natureRisques.trim();
                      onPatch({ natureRisques: base ? `${base}\n\n${dommageStr}` : dommageStr });
                    }
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-violet-200 bg-white py-0 shadow-sm data-[size=default]:h-11">
                    <SelectValue placeholder="Insérer dans « Dommages associés »" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_EVAL_NONE}>— Choisir —</SelectItem>
                    <SelectItem value="apply-dom">Insérer le texte des dommages associés</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {dommageStr ? (
                <p className="text-xs text-slate-700 whitespace-pre-wrap border border-violet-100 rounded-md bg-white/80 p-2">{dommageStr}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-violet-900">
              Mesures de prévention existantes ({measureChoices.length} sur la fiche)
            </Label>
            {measureChoices.length === 0 ? (
              <p className="text-xs text-slate-600">Aucune mesure existante renseignée sur ce risque.</p>
            ) : (
              <Select
                value={SELECT_EVAL_NONE}
                onValueChange={(v) => {
                  if (v === SELECT_EVAL_NONE) return;
                  if (v === "__all_existing__") {
                    const lines = measureChoices.map((o) => o.text.trim()).filter(Boolean);
                    if (lines.length === 0) return;
                    const block = [`Mesures de prévention existantes :`, "", ...lines].join("\n");
                    const cur = row.mesuresPrevention.trim();
                    onPatch({ mesuresPrevention: cur ? `${cur}\n\n${block}` : block });
                    return;
                  }
                  const opt = measureChoices.find((o) => o.key === v);
                  if (!opt) return;
                  const cur = row.mesuresPrevention.trim();
                  const line = opt.text.trim();
                  onPatch({ mesuresPrevention: cur ? `${cur}\n${line}` : line });
                }}
              >
                <SelectTrigger className="h-11 w-full max-w-full rounded-xl border-violet-200 bg-white py-0 shadow-sm data-[size=default]:h-11">
                  <SelectValue placeholder="Insérer dans « Mesures de prévention »" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_EVAL_NONE}>— Choisir —</SelectItem>
                  {measureChoices.length > 1 ? (
                    <SelectItem value="__all_existing__">Insérer toutes les mesures existantes (liste)</SelectItem>
                  ) : null}
                  {measureChoices.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.text.length > 120 ? `${o.text.slice(0, 120)}…` : o.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 space-y-2">
        <p className="text-xs text-slate-600">
          <strong className="text-slate-800">Saisie libre :</strong> complétez ou remplacez le texte dans chaque zone, y compris des informations absentes du référentiel ou des listes ci-dessus.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Situation dangereuse</Label>
          <Textarea
            rows={4}
            value={row.domaine ?? ""}
            onChange={(e) => onPatch({ domaine: e.target.value })}
            placeholder="Description de la situation dangereuse (ou texte hors référentiel)…"
            className="field-sizing-fixed min-h-[96px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <Label>Dommages associés</Label>
          <Textarea
            rows={4}
            value={row.natureRisques ?? ""}
            onChange={(e) => onPatch({ natureRisques: e.target.value })}
            placeholder="Dommages / conséquences possibles (ou texte libre)…"
            className="field-sizing-fixed min-h-[96px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <Label>Mesures de prévention</Label>
          <Textarea
            rows={4}
            value={row.mesuresPrevention ?? ""}
            onChange={(e) => onPatch({ mesuresPrevention: e.target.value })}
            placeholder="Mesures existantes, compléments ou toute précision hors liste…"
            className="field-sizing-fixed min-h-[96px] resize-y rounded-xl border-slate-200 bg-white shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

type PlanColumnKey = "numero" | "title" | "service" | "status" | "priority" | "due" | "lieu" | "structures" | "owner";

const PLAN_COLUMNS: Array<{ key: PlanColumnKey; label: string; kind: ColumnFilterKind }> = [
  { key: "numero", label: "N°", kind: "number" },
  { key: "title", label: "Plan", kind: "text" },
  { key: "service", label: "Service", kind: "text" },
  { key: "status", label: "Statut", kind: "text" },
  { key: "priority", label: "Priorité", kind: "text" },
  { key: "due", label: "Échéance", kind: "date" },
  { key: "lieu", label: "Lieu", kind: "text" },
  { key: "structures", label: "Structures", kind: "number" },
  { key: "owner", label: "Responsable", kind: "text" },
];

type PlanColumnFacts = Record<PlanColumnKey, string>;

function emptyPlanColumnFilters(): Record<PlanColumnKey, ColumnFilterState> {
  return {
    numero: emptyColumnFilterState(),
    title: emptyColumnFilterState(),
    service: emptyColumnFilterState(),
    status: emptyColumnFilterState(),
    priority: emptyColumnFilterState(),
    due: emptyColumnFilterState(),
    lieu: emptyColumnFilterState(),
    structures: emptyColumnFilterState(),
    owner: emptyColumnFilterState(),
  };
}

function structuresLabel(count: number): string {
  if (count <= 0) return "Aucune";
  return `${count} co-intervenant${count > 1 ? "s" : ""}`;
}

function buildPlanColumnFacts(plan: PlanRecord, risks: RiskInput[], currentUserName: string): PlanColumnFacts {
  const protocol = mergePlanProtocol(plan.protocol, risks.find((risk) => risk.id === plan.riskId), currentUserName);
  const structures = protocol.coIntervenantRows.filter(coIntervenantRowHasContent).length;
  return {
    numero: plan.riskNumber?.trim() || "",
    title: plan.riskTitle?.trim() || normalizeDocumentTitle(protocol.protocoleTitle, "Plan de prévention"),
    service: plan.service?.trim() || "Service non renseigné",
    status: statusLabel[plan.status],
    priority: priorityLabelUi[plan.priority],
    due: /^(\d{4})-(\d{2})-(\d{2})/.exec(plan.dueDate?.trim() || "")?.[0] || "",
    lieu: protocol.lieuLivraison?.trim() || plan.location?.trim() || "Non renseigné",
    structures: String(structures),
    owner: plan.owner?.trim() || "non renseigné",
  };
}

function planColumnLabel(key: PlanColumnKey, value: string): string {
  if (key === "structures") return structuresLabel(Number(value) || 0);
  if (key === "due") return formatPlanDate(value);
  return value.trim() || "(vide)";
}

function parsePlanFilterDate(value: string): string {
  const trimmed = value.trim();
  const french = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (french) {
    const [, day, month, year] = french;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed.slice(0, 10);
}

function planColumnFilterActive(filter: ColumnFilterState): boolean {
  return filter.values !== null || (filter.operator !== "none" && filter.query.trim().length > 0);
}

function matchesPlanColumn(facts: PlanColumnFacts, key: PlanColumnKey, filter: ColumnFilterState): boolean {
  const value = facts[key];
  if (filter.values !== null && !filter.values.includes(value)) return false;
  if (filter.operator === "none" || !filter.query.trim()) return true;
  const kind = PLAN_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  const displayed = planColumnLabel(key, value).toLocaleLowerCase("fr");
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
  if (kind === "date") {
    const current = parsePlanFilterDate(value);
    const min = parsePlanFilterDate(filter.query);
    const max = parsePlanFilterDate(filter.queryTo);
    if (!current || !min) return false;
    switch (filter.operator) {
      case "equals":
        return current === min;
      case "notEquals":
        return current !== min;
      case "gt":
        return current > min;
      case "lt":
        return current < min;
      case "between":
        return Boolean(max) && current >= (min < max ? min : max) && current <= (min < max ? max : min);
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

function comparePlanColumn(left: string, right: string, key: PlanColumnKey): number {
  const kind = PLAN_COLUMNS.find((column) => column.key === key)?.kind ?? "text";
  if (kind === "number") {
    const leftNumber = Number(left.replace(",", "."));
    const rightNumber = Number(right.replace(",", "."));
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }
  }
  if (kind === "date") return parsePlanFilterDate(left).localeCompare(parsePlanFilterDate(right));
  return planColumnLabel(key, left).localeCompare(planColumnLabel(key, right), "fr", { numeric: true, sensitivity: "base" });
}

export function PreventionPlanView({
  risks,
  currentUserRole,
  currentUserName,
  accessToken = "",
}: PreventionPlanViewProps) {
  const plansSkipRef = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlanSnapshot, setSelectedPlanSnapshot] = useState<PlanRecord | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "haute" | "moyenne" | "basse">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");
  const [columnFilters, setColumnFilters] = useState(emptyPlanColumnFilters);
  const [columnSort, setColumnSort] = useState<{ key: PlanColumnKey; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = displayMode === "table" ? TABLE_LIST_PAGE_SIZE : 6;
  const [planPendingDelete, setPlanPendingDelete] = useState<PlanRecord | null>(null);
  const [form, setForm] = useState({
    owner: "",
    dueDate: "",
    priority: "moyenne" as "haute" | "moyenne" | "basse",
    status: "a_lancer" as PlanStatus,
    objective: "",
    actionsText: "",
    protocol: defaultProtocolFields(undefined, currentUserName),
  });

  const canEdit = currentUserRole !== "agent";

  const initialPlans = useMemo<PlanRecord[]>(() => {
    const filteredRisks = risks;

    return filteredRisks.slice(0, 24).map((risk) => {
      const firstMeasure = risk.plannedMeasures[0];
      return {
        id: `plan-${risk.id}`,
        riskId: risk.id,
        riskNumber: risk.numeroRisque,
        riskTitle: risk.title,
        service: risk.service || "Non renseigne",
        domain: risk.domain || "Non renseigne",
        location: risk.site || "Non renseigne",
        owner: firstMeasure?.responsible || risk.responsable || "A affecter",
        dueDate: firstMeasure?.deadline || new Date().toISOString().slice(0, 10),
        priority: toPriority(risk.riskLevel),
        status: toStatus(risk.plannedMeasures),
        objective:
          firstMeasure?.description ||
          "Renforcer la prevention sur ce risque avec un plan d'action structure.",
        actions:
          risk.plannedMeasures.length > 0
            ? risk.plannedMeasures.map((measure) => measure.description)
            : ["Analyser les causes", "Definir les mesures de prevention", "Suivre l'efficacite"],
        protocol: {
          ...defaultProtocolFields(risk, firstMeasure?.responsible || risk.responsable || currentUserName),
          evaluationRisques: risk.plannedMeasures
            .map((measure, index) => `${index + 1}. ${measure.description}`)
            .join("\n"),
          riskEvaluationRows:
            risk.plannedMeasures.length > 0
              ? risk.plannedMeasures.map((measure, index) => ({
                  id: `plan-${risk.id}-r${index}`,
                  linkedEvaluationRiskId: risk.id,
                  evaluationRiskFreeText: "",
                  domaine: (risk.situation ?? "").trim() || "À compléter — situation dangereuse.",
                  natureRisques: (risk.associatedRisk ?? "").trim(),
                  mesuresPrevention: measure.description,
                }))
              : [
                  {
                    id: `plan-${risk.id}-r0`,
                    linkedEvaluationRiskId: risk.id,
                    evaluationRiskFreeText: "",
                    domaine: (risk.situation ?? "").trim() || "À compléter — situation dangereuse.",
                    natureRisques:
                      (risk.associatedRisk ?? "").trim() ||
                      "À compléter — dommages ou conséquences possibles.",
                    mesuresPrevention:
                      (risk.existingMeasures ?? []).filter((m) => m.trim()).length > 0
                        ? (risk.existingMeasures ?? []).filter((m) => m.trim()).join("\n")
                        : "À détailler : mesures de prévention (existantes ou nouvelles).",
                  },
                ],
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [currentUserName, risks]);

  const [plans, setPlans] = useState<PlanRecord[]>(() => {
    const stored = loadPreventionPlans<PlanRecord>();
    return stored && stored.length > 0 ? stored : [];
  });

  useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      return;
    }
    plansSkipRef.current = true;
    void (async () => {
      try {
        const fromApi = await fetchAppData<PlanRecord[]>(
          APP_DATA_KEYS.preventionPlans,
          accessToken,
        );
        if (fromApi && fromApi.length > 0) {
          setPlans(fromApi);
          return;
        }
        const local = loadPreventionPlans<PlanRecord>();
        const seed =
          local && local.length > 0 ? local : initialPlans.length > 0 ? initialPlans : [];
        if (seed.length > 0) {
          setPlans(seed);
          plansSkipRef.current = false;
          await saveAppData(APP_DATA_KEYS.preventionPlans, seed, accessToken);
          plansSkipRef.current = true;
        }
      } catch (error) {
        console.warn("[Lecompas] chargement plans de prévention API", error);
      }
    })();
  }, [accessToken, initialPlans]);

  React.useEffect(() => {
    if (plans.length === 0 && initialPlans.length > 0) {
      if (
        isBackendApiEnabled() &&
        accessToken &&
        isApiAccessToken(accessToken)
      ) {
        return;
      }
      setPlans(initialPlans);
    }
  }, [initialPlans, plans.length, accessToken]);

  React.useEffect(() => {
    if (plans.length === 0) return;
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      const saved = savePreventionPlans(plans);
      if (!saved) {
        toast.error(
          "Impossible d'enregistrer le plan (stockage saturé). Réduisez la taille des pièces jointes.",
        );
      }
      return;
    }
    if (plansSkipRef.current) {
      plansSkipRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(APP_DATA_KEYS.preventionPlans, plans, accessToken).catch(
        (error) => {
          console.error("[Lecompas] sync plans de prévention API", error);
          toast.error("Synchronisation des plans de prévention impossible");
        },
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [plans, accessToken]);

  const serviceOptions = useMemo(
    () => Array.from(new Set(plans.map((plan) => plan.service))).sort((a, b) => a.localeCompare(b)),
    [plans],
  );

  const planFacts = useMemo(() => {
    const facts = new Map<string, PlanColumnFacts>();
    plans.forEach((plan) => {
      facts.set(plan.id, buildPlanColumnFacts(plan, risks, currentUserName));
    });
    return facts;
  }, [plans, risks, currentUserName]);

  const columnOptions = useMemo(() => {
    return Object.fromEntries(
      PLAN_COLUMNS.map((column) => {
        const seen = new Map<string, string>();
        plans.forEach((plan) => {
          const value = planFacts.get(plan.id)?.[column.key] ?? "";
          if (!seen.has(value)) seen.set(value, planColumnLabel(column.key, value));
        });
        return [
          column.key,
          [...seen.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((left, right) => left.label.localeCompare(right.label, "fr", { numeric: true })),
        ];
      }),
    ) as Record<PlanColumnKey, Array<{ value: string; label: string }>>;
  }, [plans, planFacts]);

  const visiblePlans = useMemo(() => {
    const filtered = plans.filter((plan) => {
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      if (priorityFilter !== "all" && plan.priority !== priorityFilter) return false;
      if (serviceFilter !== "all" && plan.service !== serviceFilter) return false;
      const facts = planFacts.get(plan.id);
      if (facts && !PLAN_COLUMNS.every((column) => matchesPlanColumn(facts, column.key, columnFilters[column.key]))) {
        return false;
      }
      const lower = query.trim().toLowerCase();
      if (!lower) return true;
      const annexBlob = Array.isArray(plan.protocol.annexAttachments)
        ? plan.protocol.annexAttachments.map((a) => (a.fileName ?? "").toLowerCase()).join(" ")
        : "";
      return (
        plan.riskNumber.toLowerCase().includes(lower) ||
        plan.riskTitle.toLowerCase().includes(lower) ||
        plan.owner.toLowerCase().includes(lower) ||
        plan.objective.toLowerCase().includes(lower) ||
        (facts?.lieu ?? "").toLowerCase().includes(lower) ||
        annexBlob.includes(lower)
      );
    });
    if (!columnSort) return filtered;
    return [...filtered].sort((left, right) => {
      const leftValue = planFacts.get(left.id)?.[columnSort.key] ?? "";
      const rightValue = planFacts.get(right.id)?.[columnSort.key] ?? "";
      const compared = comparePlanColumn(leftValue, rightValue, columnSort.key);
      return columnSort.direction === "asc" ? compared : -compared;
    });
  }, [plans, planFacts, query, priorityFilter, serviceFilter, statusFilter, columnFilters, columnSort]);

  const columnFiltersActive = PLAN_COLUMNS.some((column) => planColumnFilterActive(columnFilters[column.key]));
  const totalPages = Math.max(1, Math.ceil(visiblePlans.length / pageSize));
  const paginatedPlans = useMemo(
    () => visiblePlans.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visiblePlans, currentPage],
  );

  const selectedPlan =
    selectedPlanSnapshot ||
    plans.find((plan) => plan.id === selectedId) ||
    null;
  const selectedProtocol = selectedPlan
    ? mergePlanProtocol(selectedPlan.protocol, risks.find((r) => r.id === selectedPlan.riskId), currentUserName)
    : null;

  const resetForm = () => {
    setForm({
      owner: currentUserName,
      dueDate: "",
      priority: "moyenne",
      status: "a_lancer",
      objective: "",
      actionsText: "",
      protocol: defaultProtocolFields(undefined, currentUserName),
    });
  };

  const openCreate = () => {
    resetForm();
    setSelectedId(null);
    setSelectedPlanSnapshot(null);
    setViewMode("create");
  };

  const openDetail = (plan: PlanRecord) => {
    setSelectedId(plan.id);
    setSelectedPlanSnapshot(plan);
    setViewMode("detail");
  };

  const executeDeletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    setSelectedPlanSnapshot((snapshot) => (snapshot?.id === planId ? null : snapshot));
    setSelectedId((currentId) => (currentId === planId ? null : currentId));
    setViewMode((mode) => (mode === "detail" || mode === "edit" ? "list" : mode));
    setPlanPendingDelete(null);
    toast.success("Plan de prévention supprimé.");
  };

  const planDeleteConfirmDialog = (
    <AlertDialog open={planPendingDelete !== null} onOpenChange={(open) => !open && setPlanPendingDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce plan de prévention ?</AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-1">
            {planPendingDelete ? (
              <span className="block font-medium text-slate-900">
                {planPendingDelete.riskNumber} — {planPendingDelete.riskTitle}
              </span>
            ) : null}
            <span className="block">
              Ce plan sera retiré de la liste. Dans cette démo tout est conservé uniquement dans le navigateur (pas de serveur) : après rechargement de la page, les plans factices peuvent réapparaître.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className="border-0 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 sm:mt-0"
            onClick={() => {
              if (!planPendingDelete) return;
              executeDeletePlan(planPendingDelete.id);
            }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const openEdit = (plan: PlanRecord) => {
    setSelectedId(plan.id);
    setSelectedPlanSnapshot(plan);
    setForm({
      owner: plan.owner,
      dueDate: plan.dueDate,
      priority: plan.priority,
      status: plan.status,
      objective: plan.objective,
      actionsText: plan.actions.join("\n"),
      protocol: mergePlanProtocol(plan.protocol, risks.find((r) => r.id === plan.riskId), currentUserName),
    });
    setViewMode("edit");
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const normalizeProtocolForSave = (protocol: PlanProtocolFields, risk: RiskInput | undefined): PlanProtocolFields =>
    mergePlanProtocol(protocol, risk, form.owner || currentUserName);

  const saveForm = () => {
    if (!form.objective.trim()) {
      toast.error("L'objectif est obligatoire.");
      return;
    }
    const catalogRisk =
      viewMode === "edit" && selectedPlan?.riskId?.trim()
        ? risks.find((riskItem) => riskItem.id === selectedPlan.riskId)
        : undefined;
    const horsRefTitle =
      form.objective
        .trim()
        .split("\n")
        .find((line) => line.trim())
        ?.trim()
        .slice(0, 120) ||
      form.protocol.prestationNature.trim().slice(0, 120) ||
      "Plan de prévention — coactivité";
    const listMeta =
      catalogRisk !== undefined
        ? {
            riskId: catalogRisk.id,
            riskNumber: catalogRisk.numeroRisque,
            riskTitle: catalogRisk.title,
            service: catalogRisk.service || "Non renseigne",
            domain: catalogRisk.domain || "Non renseigne",
            location: catalogRisk.site || "Non renseigne",
          }
        : viewMode === "edit" && selectedPlan && selectedPlan.riskId.trim()
          ? {
              riskId: selectedPlan.riskId,
              riskNumber: selectedPlan.riskNumber,
              riskTitle: selectedPlan.riskTitle,
              service: selectedPlan.service,
              domain: selectedPlan.domain,
              location: selectedPlan.location,
            }
          : {
              riskId: "",
              riskNumber: "Hors référentiel",
              riskTitle: horsRefTitle,
              service: "Non renseigné",
              domain: "Non renseigné",
              location: form.protocol.lieuLivraison.trim() || "Non renseigné",
            };

    const actions = form.actionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (viewMode === "edit" && selectedPlan) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === selectedPlan.id
            ? {
                ...plan,
                ...listMeta,
                owner: form.owner || currentUserName,
                dueDate: form.dueDate,
                priority: form.priority,
                status: form.status,
                objective: form.objective,
                actions,
                protocol: normalizeProtocolForSave(form.protocol, catalogRisk),
                updatedAt: new Date().toISOString(),
              }
            : plan,
        ),
      );
      toast.success("Plan de prevention modifie.");
    } else {
      setPlans((prev) => [
        {
          id: `plan-custom-${Date.now()}`,
          ...listMeta,
          owner: form.owner || currentUserName,
          dueDate: form.dueDate,
          priority: form.priority,
          status: form.status,
          objective: form.objective,
          actions,
          protocol: normalizeProtocolForSave(form.protocol, catalogRisk ?? undefined),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Plan de prevention cree.");
    }
    setViewMode("list");
    setSelectedPlanSnapshot(null);
  };

  const updateProtocol = <K extends keyof PlanProtocolFields>(key: K, value: PlanProtocolFields[K]) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        [key]: value,
      },
    }));
  };

  const addRiskEvaluationRow = () => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        riskEvaluationRows: [...prev.protocol.riskEvaluationRows, newRiskEvaluationRow()],
      },
    }));
  };

  const removeRiskEvaluationRow = (rowId: string) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        riskEvaluationRows:
          prev.protocol.riskEvaluationRows.filter((row) => row.id !== rowId).length === 0
            ? [newRiskEvaluationRow()]
            : prev.protocol.riskEvaluationRows.filter((row) => row.id !== rowId),
      },
    }));
  };

  const patchRiskEvaluationRow = (rowId: string, patch: Partial<PlanRiskEvaluationRow>) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        riskEvaluationRows: prev.protocol.riskEvaluationRows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      },
    }));
  };

  const updateCoIntervenantRow = (rowId: string, field: keyof Omit<PlanCoIntervenantRow, "id">, value: string) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        coIntervenantRows: prev.protocol.coIntervenantRows.map((row) =>
          row.id === rowId ? { ...row, [field]: value } : row,
        ),
      },
    }));
  };

  const addCoIntervenantRow = () => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        coIntervenantRows: [...prev.protocol.coIntervenantRows, newCoIntervenantRow()],
      },
    }));
  };

  const removeCoIntervenantRow = (rowId: string) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        coIntervenantRows:
          prev.protocol.coIntervenantRows.filter((row) => row.id !== rowId).length === 0
            ? [newCoIntervenantRow()]
            : prev.protocol.coIntervenantRows.filter((row) => row.id !== rowId),
      },
    }));
  };

  const removeAnnexAttachment = (attId: string) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        annexAttachments: prev.protocol.annexAttachments.filter((a) => a.id !== attId),
      },
    }));
  };

  const applySignatureDematerialisee = async (slot: 1 | 2 | 3, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const keys: Record<1 | 2 | 3, keyof PlanProtocolFields> = {
      1: "signatureDematerialiseeUrl1",
      2: "signatureDematerialiseeUrl2",
      3: "signatureDematerialiseeUrl3",
    };
    try {
      const { dataUrl } = await readFileAsDataUrlCapped(file, SIGNATURE_DEMAT_MAX_BYTES);
      if (!/^data:image\//i.test(dataUrl)) {
        toast.error("Utilisez une image (PNG, JPEG, WEBP…).");
        return;
      }
      updateProtocol(keys[slot], dataUrl);
      toast.success(`Image de signature enregistrée (signataire ${slot}).`);
    } catch {
      toast.error(`Image trop volumineuse (maximum ${formatByteSize(SIGNATURE_DEMAT_MAX_BYTES)}).`);
    }
  };

  const appendAnnexFilesFromInput = (files: FileList | null) => {
    if (!files?.length) return;
    void (async () => {
      const parsed: PlanAnnexAttachment[] = [];
      for (const file of Array.from(files)) {
        try {
          const { dataUrl, sizeBytes } = await readFileAsDataUrlCapped(file, PLAN_ANNEX_MAX_BYTES);
          parsed.push({
            id: `annex-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            dataUrl,
            sizeBytes,
          });
        } catch {
          toast.error(
            `Fichier trop volumineux ou illisible : ${file.name} (max. ${formatByteSize(PLAN_ANNEX_MAX_BYTES)}).`,
          );
        }
      }
      let mergedCount = 0;
      setForm((prev) => {
        const room = PLAN_ANNEX_MAX_COUNT - prev.protocol.annexAttachments.length;
        if (room <= 0) {
          toast.error(`Maximum ${PLAN_ANNEX_MAX_COUNT} pièces jointes par plan.`);
          return prev;
        }
        const slice = parsed.slice(0, room);
        if (slice.length < parsed.length) {
          toast.error(`Seules ${slice.length} pièce(s) ajoutées (limite ${PLAN_ANNEX_MAX_COUNT}).`);
        }
        mergedCount = slice.length;
        if (!slice.length) return prev;
        return {
          ...prev,
          protocol: {
            ...prev.protocol,
            annexAttachments: [...prev.protocol.annexAttachments, ...slice],
          },
        };
      });
      if (mergedCount > 0) toast.success(`${mergedCount} pièce(s) jointe(s) ajoutée(s).`);
      if (annexFilesInputRef.current) annexFilesInputRef.current.value = "";
    })();
  };

  React.useEffect(() => {
    if ((viewMode === "detail" || viewMode === "edit") && selectedId && !selectedPlan) {
      setViewMode("list");
      setSelectedId(null);
      setSelectedPlanSnapshot(null);
      toast.error("Impossible d'ouvrir cette fiche. Elle a ete rechargee.");
    }
  }, [selectedId, selectedPlan, viewMode]);

  const handleDownloadPlan = async (plan: PlanRecord) => {
    const mergedProtocol = mergePlanProtocol(plan.protocol, risks.find((r) => r.id === plan.riskId), currentUserName);
    try {
      const { downloadPreventionPlanVisualPdf } = await import("./preventionPlanVisualPdf");
      await downloadPreventionPlanVisualPdf(plan, mergedProtocol, risks);
      toast.success("PDF téléchargé.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de générer le PDF.");
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, priorityFilter, serviceFilter, columnFilters, displayMode]);
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (viewMode === "detail" && selectedPlan && selectedProtocol) {
    return (
      <>
      <div className="space-y-6 p-3 sm:p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation du plan de prévention</h1>
          <p className="mt-1 text-sm text-slate-500">Même fiche pour la lecture, la modification et l'export.</p>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => requestLeave(() => {
                  setViewMode("list");
                  setSelectedPlanSnapshot(null);
                })}
                className="h-10 w-full rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:w-fit"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPlan(selectedPlan)}
                  className="h-10 rounded-lg border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
                {canEdit ? (
                  <Button
                    onClick={() => openEdit(selectedPlan)}
                    className="h-10 rounded-lg bg-rose-900 text-white hover:bg-rose-950"
                  >
                    Modifier
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button
                    variant="outline"
                    onClick={() => setPlanPendingDelete(selectedPlan)}
                    className="h-10 rounded-lg border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Risque n° {selectedPlan.riskNumber || "—"}</p>
                <h2 className="mt-1 text-xl font-semibold leading-snug text-slate-950">{selectedPlan.riskTitle}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{selectedProtocol.codeTravailReference || "Référence non renseignée"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PlanStatusMark status={selectedPlan.status} />
                <span className="text-sm text-slate-600">Priorité {priorityLabelUi[selectedPlan.priority].toLowerCase()}</span>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Service</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{selectedPlan.service || "Non renseigné"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Domaine</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{selectedPlan.domain || "Non renseigné"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Lieu de l'opération</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{selectedPlan.location || "Non renseigné"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Responsable</dt>
                <dd className="mt-1 break-words text-sm font-medium text-slate-900">{selectedPlan.owner || "Non renseigné"}</dd>
              </div>
            </dl>
          </div>
        </article>

        <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Actions de prévention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPlan.actions.map((action, index) => (
              <div key={`${action}-${index}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Action {index + 1} :</span> {action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-indigo-900">1) Co-intervenants (entreprises, administrations, organismes)</CardTitle>
            <CardDescription>Ajoutez autant de structures que nécessaire.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProtocol.coIntervenantRows.filter(coIntervenantRowHasContent).length === 0 ? (
              <p className="text-sm text-slate-600 px-1">Aucune structure renseignée pour l’instant.</p>
            ) : (
              <>
                {selectedProtocol.coIntervenantRows.filter(coIntervenantRowHasContent).map((row, idx) => (
                  <div key={row.id} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2 text-sm">
                    <p className="text-xs font-bold uppercase text-indigo-800">Structure {idx + 1}</p>
                    {row.qualite.trim() ? (
                      <p>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Qualité / rôle</span>
                        <span className="block text-slate-900 mt-0.5">{row.qualite}</span>
                      </p>
                    ) : null}
                    <p>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Dénomination</span>
                      <span className="block text-slate-900 mt-0.5">{row.denomination.trim() ? row.denomination : "—"}</span>
                    </p>
                    <p>
                      <span className="text-xs font-semibold text-slate-500 uppercase">Adresse</span>
                      <span className="block text-slate-900 mt-0.5 whitespace-pre-wrap">{row.adresse.trim() ? row.adresse : "—"}</span>
                    </p>
                    {(row.contactNom.trim() || row.contactEmail.trim()) ? (
                      <p>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Contact</span>
                        <span className="block text-slate-900 mt-0.5">
                          {[row.contactNom.trim(), row.contactEmail.trim()].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </p>
                    ) : null}
                    {row.complements.trim() ? (
                      <p>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Précisions</span>
                        <span className="block text-slate-900 mt-0.5 whitespace-pre-wrap">{row.complements}</span>
                      </p>
                    ) : null}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">2) Nature de la prestation</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedProtocol.prestationNature || "-"}</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">3) Organisation du chargement ou déchargement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Lieu de livraison ou prise en charge</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.lieuLivraison || "-"}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Matériel(s) spécifique(s) utilisé(s)</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.materielsSpecifiques || "-"}</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs text-amber-700 font-semibold uppercase">Consignes de sécurité particulières sur le site</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.consignesSite || "-"}</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs text-amber-700 font-semibold uppercase">Consignes particulières concernant l'opération</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.consignesOperation || "-"}</p></div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-violet-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">4) Évaluation des risques (CT R4515-5)</CardTitle>
            <CardDescription>
              Colonnes : situation dangereuse, dommages associés, mesures de prévention — lignes multiples possibles ; contenu libre ou issu du référentiel selon vos saisies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-3 text-xs font-bold uppercase text-slate-700 border-b border-slate-200 w-[28%]">Situation dangereuse</th>
                    <th className="text-left p-3 text-xs font-bold uppercase text-slate-700 border-l border-b border-slate-200 w-[34%]">Dommages associés</th>
                    <th className="text-left p-3 text-xs font-bold uppercase text-slate-700 border-l border-b border-slate-200 w-[38%]">Mesures de prévention</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProtocol.riskEvaluationRows.map((row) => {
                    const evalRisk = row.linkedEvaluationRiskId
                      ? risks.find((r) => r.id === row.linkedEvaluationRiskId)
                      : undefined;
                    return (
                      <tr key={row.id} className="border-t border-slate-200 align-top bg-white">
                        <td className="p-3 whitespace-pre-wrap text-slate-800">
                          {evalRisk ? (
                            <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wide border-violet-300 text-violet-800">
                              Réf. évaluation {evalRisk.numeroRisque}
                            </Badge>
                          ) : (row.evaluationRiskFreeText ?? "").trim() ? (
                            <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wide border-slate-400 text-slate-800">
                              Mention hors référentiel
                            </Badge>
                          ) : null}
                          {evalRisk ? null : (row.evaluationRiskFreeText ?? "").trim() ? (
                            <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{(row.evaluationRiskFreeText ?? "").trim()}</p>
                          ) : null}
                          <div>{row.domaine.trim() ? row.domaine : "—"}</div>
                        </td>
                        <td className="p-3 border-l border-slate-200 whitespace-pre-wrap text-slate-800">
                          {row.natureRisques.trim() ? row.natureRisques : "—"}
                        </td>
                        <td className="p-3 border-l border-slate-200 whitespace-pre-wrap text-slate-800">
                          {row.mesuresPrevention.trim() ? row.mesuresPrevention : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 font-semibold uppercase">Complément libre</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap mt-1">{selectedProtocol.evaluationRisques || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="overflow-hidden rounded-2xl border border-emerald-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-emerald-900">5) Premiers secours (CT R4515-6)</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700 font-semibold uppercase">Personne(s) à prévenir</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.personnesAPrevenir || "-"}</p></div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-3"><p className="text-xs text-red-700 font-semibold uppercase">Mesure(s) en cas d'accident ou incendie</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.mesuresUrgence || "-"}</p></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-orange-900">6) Plan transmis + 7) Observations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-orange-50 p-3 text-sm"><p className="text-xs text-orange-700 font-semibold uppercase">Plan de prévention transmis à</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.planTransmis || "-"}</p></div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Destinataire</th>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Oui/Non</th>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Nom</th>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t"><td className="p-2">Cellule Sécurité Prévention DIRM MED</td><td className="p-2">{selectedProtocol.transmissionCelluleSecuriteStatus}</td><td className="p-2">{selectedProtocol.transmissionCelluleSecuriteNom || "-"}</td><td className="p-2">{selectedProtocol.transmissionCelluleSecuriteObs || "-"}</td></tr>
                    <tr className="border-t"><td className="p-2">Correspondant Hygiène et Sécurité du site</td><td className="p-2">{selectedProtocol.transmissionCorrespondantSiteStatus}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantSiteNom || "-"}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantSiteObs || "-"}</td></tr>
                    <tr className="border-t"><td className="p-2">Correspondant Hygiène et Sécurité APB</td><td className="p-2">{selectedProtocol.transmissionCorrespondantAPBStatus}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantAPBNom || "-"}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantAPBObs || "-"}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500 font-semibold uppercase">Observations de transmission</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.observationsTransmission || "-"}</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500 font-semibold uppercase">Observations / remarques</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.observationsRemarques || "-"}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-rose-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-rose-900">8) Signatures</CardTitle>
            <CardDescription>
              Mentions complétées sous chaque bloc ; une image peut compléter l’empreinte visuelle dans l’export PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 xl:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-rose-200 p-3 bg-rose-50/60 space-y-2">
              <p className="font-semibold text-slate-900 mb-2">{selectedProtocol.signatureEntite1 || "Entité 1"}</p>
              <p><span className="font-medium">Nom:</span> {selectedProtocol.signatureNom1 || "-"}</p><p><span className="font-medium">Prénom:</span> {selectedProtocol.signaturePrenom1 || "-"}</p><p><span className="font-medium">Date:</span> {selectedProtocol.signatureDate1 || "-"}</p>
              {selectedProtocol.signatureDematerialiseeUrl1 ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-white p-2">
                  <p className="text-[10px] font-semibold uppercase text-rose-800 mb-1">Signature (image)</p>
                  <img src={selectedProtocol.signatureDematerialiseeUrl1} alt="" className="max-h-28 w-full object-contain object-left" />
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-rose-200 p-3 bg-rose-50/60 space-y-2">
              <p className="font-semibold text-slate-900 mb-2">{selectedProtocol.signatureEntite2 || "Entité 2"}</p>
              <p><span className="font-medium">Nom:</span> {selectedProtocol.signatureNom2 || "-"}</p><p><span className="font-medium">Prénom:</span> {selectedProtocol.signaturePrenom2 || "-"}</p><p><span className="font-medium">Date:</span> {selectedProtocol.signatureDate2 || "-"}</p>
              {selectedProtocol.signatureDematerialiseeUrl2 ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-white p-2">
                  <p className="text-[10px] font-semibold uppercase text-rose-800 mb-1">Signature (image)</p>
                  <img src={selectedProtocol.signatureDematerialiseeUrl2} alt="" className="max-h-28 w-full object-contain object-left" />
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-rose-200 p-3 bg-rose-50/60 space-y-2">
              <p className="font-semibold text-slate-900 mb-2">{selectedProtocol.signatureEntite3 || "Entité 3"}</p>
              <p><span className="font-medium">Nom:</span> {selectedProtocol.signatureNom3 || "-"}</p><p><span className="font-medium">Prénom:</span> {selectedProtocol.signaturePrenom3 || "-"}</p><p><span className="font-medium">Date:</span> {selectedProtocol.signatureDate3 || "-"}</p>
              {selectedProtocol.signatureDematerialiseeUrl3 ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-white p-2">
                  <p className="text-[10px] font-semibold uppercase text-rose-800 mb-1">Signature (image)</p>
                  <img src={selectedProtocol.signatureDematerialiseeUrl3} alt="" className="max-h-28 w-full object-contain object-left" />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-sky-900">10) Plan de circulation et de déchargement</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.planCirculation || "-"}</p></CardContent>
          </Card>
          <Card className="overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-sky-900">Matériel à remplacer</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.materielRemplacer || "-"}</p></CardContent>
          </Card>
        </div>
        <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">Annexes et documents joints</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selectedProtocol.annexAttachments.length > 0 ? (
              <ul className="space-y-2">
                {selectedProtocol.annexAttachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <FileText className="h-5 w-5 shrink-0 text-slate-600" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 break-all">{att.fileName}</p>
                        <p className="text-xs text-slate-500">{formatByteSize(att.sizeBytes)}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 w-full sm:w-auto" asChild>
                      <a href={att.dataUrl} download={att.fileName}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Aucun fichier joint pour ce plan.</p>
            )}
            {selectedProtocol.annexesDocuments.trim() ? (
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Complément rédactionnel</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedProtocol.annexesDocuments}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      </div>
      {planDeleteConfirmDialog}
    </>
    );
  }

  if ((viewMode === "create" || viewMode === "edit") && canEdit) {
    return (
      <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">
            {viewMode === "create" ? "Nouveau plan de prévention" : "Modifier le plan de prévention"}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-500">
            {form.protocol.protocoleTitle || "Plan de prévention"}
            {form.protocol.codeTravailReference ? ` · ${form.protocol.codeTravailReference}` : ""}
          </p>
        </div>

        <Card className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <CardContent className="space-y-5 p-4 sm:p-8">

            <section className="space-y-4 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-stone-800">Pilotage</h2>
              <PlanStatusMark status={form.status} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} className="h-11 rounded-xl border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label>Échéance</Label>
                <PlanDateField value={form.dueDate} onChange={(value) => setForm((prev) => ({ ...prev, dueDate: value }))} />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(value: PlanStatus) => setForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger className={planSelectClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_lancer">À lancer</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(value: "haute" | "moyenne" | "basse") => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger className={planSelectClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objectif de prévention *</Label>
              <Textarea rows={4} value={form.objective} onChange={(e) => setForm((prev) => ({ ...prev, objective: e.target.value }))} className="rounded-xl border-slate-200 bg-white shadow-sm" />
            </div>

            <div className="space-y-2">
              <Label>Actions (une par ligne)</Label>
              <Textarea rows={6} value={form.actionsText} onChange={(e) => setForm((prev) => ({ ...prev, actionsText: e.target.value }))} className="rounded-xl border-slate-200 bg-white shadow-sm" />
            </div>
            </section>

            <Separator />

            <div className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
              <p className="text-sm text-slate-800">
                Vous éditez un <strong className="font-semibold">plan de prévention</strong> (coactivité, art. R4515-4 à R4515-11). Le document dédié au{" "}
                <strong className="font-semibold">chargement / déchargement</strong> se saisit dans l’autre onglet de l’application.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-900">Champs du plan de prévention</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre du plan de prévention</Label>
                <Input value={form.protocol.protocoleTitle} onChange={(e) => updateProtocol("protocoleTitle", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
              </div>
              <div className="space-y-2"><Label>Référence (code du Travail)</Label><Input value={form.protocol.codeTravailReference} onChange={(e) => updateProtocol("codeTravailReference", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Type d'opération</Label><Input value={form.protocol.operationType} onChange={(e) => updateProtocol("operationType", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
            </div>

            <Card className="overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    1) Co-intervenants (entreprises / administrations)
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCoIntervenantRow}
                    className="w-full sm:w-auto shrink-0 border-indigo-300 text-indigo-800 hover:bg-indigo-50"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter une structure
                  </Button>
                </div>
                <CardDescription>Renseignez chaque organisme concerné.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.protocol.coIntervenantRows.map((row, idx) => (
                  <div key={row.id} className="space-y-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-xl bg-indigo-50 px-2 text-xs font-semibold text-indigo-800">{String(idx + 1).padStart(2, "0")}</span>
                        Structure
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-700 hover:text-red-800 hover:bg-red-50"
                        onClick={() => removeCoIntervenantRow(row.id)}
                        aria-label={`Supprimer la structure ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Qualité / rôle (facultatif)</Label>
                        <Input
                          placeholder="ex. APB, société intervenante, administration…"
                          value={row.qualite}
                          onChange={(e) => updateCoIntervenantRow(row.id, "qualite", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Dénomination</Label>
                        <Input value={row.denomination} onChange={(e) => updateCoIntervenantRow(row.id, "denomination", e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Adresse</Label>
                        <Textarea rows={2} value={row.adresse} onChange={(e) => updateCoIntervenantRow(row.id, "adresse", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom du contact</Label>
                        <Input value={row.contactNom} onChange={(e) => updateCoIntervenantRow(row.id, "contactNom", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email du contact</Label>
                        <Input value={row.contactEmail} onChange={(e) => updateCoIntervenantRow(row.id, "contactEmail", e.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Précisions (navire, capitaine, téléphone…)</Label>
                        <Textarea rows={2} value={row.complements} onChange={(e) => updateCoIntervenantRow(row.id, "complements", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">2) Nature de la prestation</CardTitle>
                <CardDescription>Objet de l’opération pour l’ensemble des co-intervenants.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea rows={3} value={form.protocol.prestationNature} onChange={(e) => updateProtocol("prestationNature", e.target.value)} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-cyan-100 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Route className="h-4 w-4 text-cyan-600" />3) Organisation du chargement ou déchargement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Lieu de livraison ou prise en charge</Label><Textarea rows={2} value={form.protocol.lieuLivraison} onChange={(e) => updateProtocol("lieuLivraison", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
                <div className="space-y-2"><Label>Matériels spécifiques utilisés</Label><Textarea rows={2} value={form.protocol.materielsSpecifiques} onChange={(e) => updateProtocol("materielsSpecifiques", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
                <div className="space-y-2"><Label>Consignes de sécurité sur le site</Label><Textarea rows={2} value={form.protocol.consignesSite} onChange={(e) => updateProtocol("consignesSite", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
                <div className="space-y-2"><Label>Consignes concernant l'opération</Label><Textarea rows={2} value={form.protocol.consignesOperation} onChange={(e) => updateProtocol("consignesOperation", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-violet-100 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-purple-600" />4) Évaluation des risques (CT R4515-5)
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addRiskEvaluationRow} className="w-full sm:w-auto shrink-0 border-purple-300 text-purple-800 hover:bg-purple-50">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Ajouter un risque (ligne)
                  </Button>
                </div>
                <CardDescription>
                  Colonnes du tableau : <strong>Situation dangereuse</strong>, <strong>Dommages associés</strong>, <strong>Mesures de prévention</strong>. Liez éventuellement un risque du référentiel pour préremplir, et complétez en texte libre à tout moment (y compris hors liste).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {form.protocol.riskEvaluationRows.map((row, idx) => (
                    <div key={row.id} className="space-y-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-xl bg-violet-50 px-2 text-xs font-semibold text-violet-800">{String(idx + 1).padStart(2, "0")}</span>
                          Risque
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-700 hover:text-red-800 hover:bg-red-50"
                          onClick={() => removeRiskEvaluationRow(row.id)}
                          aria-label={`Supprimer la ligne ${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                      <RiskEvaluationLineEditor row={row} risks={risks} onPatch={(patch) => patchRiskEvaluationRow(row.id, patch)} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Complément libre (texte hors tableau)</Label>
                  <Textarea rows={4} value={form.protocol.evaluationRisques} onChange={(e) => updateProtocol("evaluationRisques", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-emerald-100 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><PhoneCall className="h-4 w-4 text-emerald-600" />5) Premiers secours (CT R4515-6)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Personne(s) à prévenir</Label><Textarea rows={2} value={form.protocol.personnesAPrevenir} onChange={(e) => updateProtocol("personnesAPrevenir", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mesure(s) à suivre en cas d'accident ou incendie</Label><Textarea rows={2} value={form.protocol.mesuresUrgence} onChange={(e) => updateProtocol("mesuresUrgence", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-orange-100 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-orange-600" />6) Plan de prévention transmis à (CT R4515-11)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Liste de diffusion</Label><Textarea rows={2} value={form.protocol.planTransmis} onChange={(e) => updateProtocol("planTransmis", e.target.value)} /></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Cellule Sécurité Prévention DIRM MED</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCelluleSecuriteNom} onChange={(e) => updateProtocol("transmissionCelluleSecuriteNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCelluleSecuriteStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCelluleSecuriteStatus", value)}>
                        <SelectTrigger className={planSelectClass}><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigné</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCelluleSecuriteObs} onChange={(e) => updateProtocol("transmissionCelluleSecuriteObs", e.target.value)} />
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Correspondant Hygiène et Sécurité du site</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCorrespondantSiteNom} onChange={(e) => updateProtocol("transmissionCorrespondantSiteNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCorrespondantSiteStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCorrespondantSiteStatus", value)}>
                        <SelectTrigger className={planSelectClass}><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigné</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCorrespondantSiteObs} onChange={(e) => updateProtocol("transmissionCorrespondantSiteObs", e.target.value)} />
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Correspondant Hygiène et Sécurité APB</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCorrespondantAPBNom} onChange={(e) => updateProtocol("transmissionCorrespondantAPBNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCorrespondantAPBStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCorrespondantAPBStatus", value)}>
                        <SelectTrigger className={planSelectClass}><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigné</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCorrespondantAPBObs} onChange={(e) => updateProtocol("transmissionCorrespondantAPBObs", e.target.value)} />
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Texte libre, cellule sécurité</Label><Input value={form.protocol.transmissionCelluleSecurite} onChange={(e) => updateProtocol("transmissionCelluleSecurite", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
                  <div className="space-y-2"><Label>Texte libre correspondant site</Label><Input value={form.protocol.transmissionCorrespondantSite} onChange={(e) => updateProtocol("transmissionCorrespondantSite", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Texte libre correspondant APB</Label><Input value={form.protocol.transmissionCorrespondantAPB} onChange={(e) => updateProtocol("transmissionCorrespondantAPB", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Observations de transmission</Label><Textarea rows={2} value={form.protocol.observationsTransmission} onChange={(e) => updateProtocol("observationsTransmission", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base">7) Observations et remarques</CardTitle></CardHeader>
              <CardContent><Textarea rows={3} value={form.protocol.observationsRemarques} onChange={(e) => updateProtocol("observationsRemarques", e.target.value)} /></CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-rose-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Signature className="h-4 w-4 text-rose-600" />
                  8) Signatures
                </CardTitle>
                <CardDescription>
                  Joignez une <strong className="font-semibold text-slate-800">image</strong> de signature (photo, scan PNG/JPEG) par signataire : elle sera intégrée au PDF exporté. Pour une signature électronique qualifiée (certificat), ouvrez le PDF dans Acrobat Reader après téléchargement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-rose-900">Signataire 1</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input placeholder="Entité 1" value={form.protocol.signatureEntite1} onChange={(e) => updateProtocol("signatureEntite1", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <Input placeholder="Nom" value={form.protocol.signatureNom1} onChange={(e) => updateProtocol("signatureNom1", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <Input placeholder="Prénom" value={form.protocol.signaturePrenom1} onChange={(e) => updateProtocol("signaturePrenom1", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <PlanDateField value={form.protocol.signatureDate1} onChange={(value) => updateProtocol("signatureDate1", value)} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Signature dématérialisée (image)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className={planFileClass}
                        onChange={(e) => void applySignatureDematerialisee(1, e.target.files)}
                      />
                    </div>
                    {form.protocol.signatureDematerialiseeUrl1 ? (
                      <div className="flex items-center gap-2">
                        <img src={form.protocol.signatureDematerialiseeUrl1} alt="" className="h-14 max-w-[180px] object-contain border rounded bg-white p-1" />
                        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => updateProtocol("signatureDematerialiseeUrl1", "")}>
                          Retirer l’image
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-rose-900">Signataire 2</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input placeholder="Entité 2" value={form.protocol.signatureEntite2} onChange={(e) => updateProtocol("signatureEntite2", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <Input placeholder="Nom" value={form.protocol.signatureNom2} onChange={(e) => updateProtocol("signatureNom2", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <Input placeholder="Prénom" value={form.protocol.signaturePrenom2} onChange={(e) => updateProtocol("signaturePrenom2", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <PlanDateField value={form.protocol.signatureDate2} onChange={(value) => updateProtocol("signatureDate2", value)} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Signature dématérialisée (image)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className={planFileClass}
                        onChange={(e) => void applySignatureDematerialisee(2, e.target.files)}
                      />
                    </div>
                    {form.protocol.signatureDematerialiseeUrl2 ? (
                      <div className="flex items-center gap-2">
                        <img src={form.protocol.signatureDematerialiseeUrl2} alt="" className="h-14 max-w-[180px] object-contain border rounded bg-white p-1" />
                        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => updateProtocol("signatureDematerialiseeUrl2", "")}>
                          Retirer l’image
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-rose-900">Signataire 3</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input placeholder="Entité 3" value={form.protocol.signatureEntite3} onChange={(e) => updateProtocol("signatureEntite3", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <Input placeholder="Nom" value={form.protocol.signatureNom3} onChange={(e) => updateProtocol("signatureNom3", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <Input placeholder="Prénom" value={form.protocol.signaturePrenom3} onChange={(e) => updateProtocol("signaturePrenom3", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" />
                    <PlanDateField value={form.protocol.signatureDate3} onChange={(value) => updateProtocol("signatureDate3", value)} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Signature dématérialisée (image)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className={planFileClass}
                        onChange={(e) => void applySignatureDematerialisee(3, e.target.files)}
                      />
                    </div>
                    {form.protocol.signatureDematerialiseeUrl3 ? (
                      <div className="flex items-center gap-2">
                        <img src={form.protocol.signatureDematerialiseeUrl3} alt="" className="h-14 max-w-[180px] object-contain border rounded bg-white p-1" />
                        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => updateProtocol("signatureDematerialiseeUrl3", "")}>
                          Retirer l’image
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Route className="h-4 w-4 text-sky-600" />10) Plan de circulation et de déchargement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Plan de circulation et de déchargement</Label><Textarea rows={3} value={form.protocol.planCirculation} onChange={(e) => updateProtocol("planCirculation", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
                <div className="space-y-2"><Label>Matériel à remplacer</Label><Textarea rows={2} value={form.protocol.materielRemplacer} onChange={(e) => updateProtocol("materielRemplacer", e.target.value)} className="rounded-xl border-slate-200 bg-white shadow-sm" /></div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-violet-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-violet-700" aria-hidden />
                  Annexes et documents joints
                </CardTitle>
                <CardDescription>
                  Joignez des fichiers (PDF, images, bureautique). Limite {formatByteSize(PLAN_ANNEX_MAX_BYTES)} par fichier, {PLAN_ANNEX_MAX_COUNT} fichiers maximum — enregistrés avec le plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={annexFilesInputRef}
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".pdf,.doc,.docx,.odt,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={(e) => appendAnnexFilesFromInput(e.target.files)}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-slate-200 bg-white shadow-sm"
                    onClick={() => annexFilesInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter des fichiers
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {form.protocol.annexAttachments.length} / {PLAN_ANNEX_MAX_COUNT} fichier(s)
                  </p>
                </div>
                {form.protocol.annexAttachments.length > 0 ? (
                  <ul className="space-y-2">
                    {form.protocol.annexAttachments.map((att) => (
                      <li
                        key={att.id}
                        className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-5 w-5 shrink-0 text-slate-600" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 break-all">{att.fileName}</p>
                            <p className="text-xs text-slate-500">{formatByteSize(att.sizeBytes)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <a href={att.dataUrl} download={att.fileName}>
                              <Download className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Télécharger</span>
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:text-red-800 hover:bg-red-50"
                            onClick={() => removeAnnexAttachment(att.id)}
                            aria-label={`Retirer ${att.fileName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="space-y-2">
                  <Label>Complément rédactionnel (facultatif)</Label>
                  <Textarea
                    rows={3}
                    placeholder="Précisions sur les pièces jointes, références internes, liens, etc."
                    value={form.protocol.annexesDocuments}
                    onChange={(e) => updateProtocol("annexesDocuments", e.target.value)}
                    className="rounded-xl border-slate-200 bg-white shadow-sm"
                  />
                </div>
              </CardContent>
            </Card>

          </CardContent>
          <div className="flex flex-col gap-3 border-t border-stone-200 bg-stone-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => requestLeave(() => {
                setViewMode("list");
                setSelectedPlanSnapshot(null);
              })}
              className="h-11 w-full rounded-xl border-stone-300 bg-white text-stone-800 hover:bg-stone-50 sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {viewMode === "edit" && selectedPlan ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlanPendingDelete(selectedPlan)}
                  className="h-11 w-full rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-900 sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le plan
                </Button>
              ) : null}
              <Button
                onClick={saveForm}
                className="h-11 w-full rounded-lg bg-rose-900 text-white hover:bg-rose-950 sm:w-auto"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </Card>
      </div>
      {planDeleteConfirmDialog}
      </>
    );
  }

  const doneCount = visiblePlans.filter((plan) => plan.status === "termine").length;
  const inProgressCount = visiblePlans.filter((plan) => plan.status === "en_cours").length;

  const filtersActive =
    Boolean(query.trim()) || statusFilter !== "all" || priorityFilter !== "all" || serviceFilter !== "all";

  const renderFilterableTh = (key: PlanColumnKey) => {
    const column = PLAN_COLUMNS.find((item) => item.key === key);
    if (!column) return null;
    return (
      <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-stone-600">
        <div className="flex items-center gap-1">
          <span>{column.label}</span>
          {columnSort?.key === key ? (
            <span className="text-xs font-bold text-rose-900" aria-hidden>
              {columnSort.direction === "asc" ? "↑" : "↓"}
            </span>
          ) : null}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Plan de prévention</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            {visiblePlans.length} plan(s), {inProgressCount} en cours, {doneCount} terminé(s).
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div
            className="inline-flex w-full rounded-xl border border-stone-200 bg-stone-50 p-1 sm:w-auto"
            role="group"
            aria-label="Mode d'affichage"
          >
            <button
              type="button"
              aria-pressed={displayMode === "cards"}
              onClick={() => setDisplayMode("cards")}
              className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium sm:flex-none ${
                displayMode === "cards" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Cartes
            </button>
            <button
              type="button"
              aria-pressed={displayMode === "table"}
              onClick={() => setDisplayMode("table")}
              className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium sm:flex-none ${
                displayMode === "table" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              }`}
            >
              <Table2 className="h-4 w-4" aria-hidden />
              Tableau
            </button>
          </div>
          {canEdit ? (
            <Button
              onClick={openCreate}
              className="h-11 w-full rounded-lg bg-rose-900 text-white hover:bg-rose-950 sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouveau plan
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden />
        <p className="text-sm text-slate-700">
          Cet onglet concerne le <strong className="font-semibold">plan de prévention</strong> (coactivité, modèle type héliportage / opérations). Le document{" "}
          <strong className="font-semibold">chargement / déchargement</strong> est saisi à part, dans l’onglet correspondant.
        </p>
      </div>

      <Card className="border-0 bg-white/80 shadow-xl backdrop-blur" role="region" aria-label="Filtres plan de prévention">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPagination();
                }}
                placeholder="Rechercher (plan, lieu, responsable, co-intervenant...)"
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm"
              />
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-600">{visiblePlans.length} plan(s)</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-11 w-full rounded-lg border-slate-300 bg-white px-4 text-slate-800 hover:bg-slate-50 sm:w-auto"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filtersOpen ? "Masquer les filtres" : "Filtres"}
            </Button>
            {filtersActive ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setServiceFilter("all");
                  resetPagination();
                }}
                className="h-11 rounded-xl text-slate-600"
              >
                Réinitialiser
              </Button>
            ) : null}
          </div>

          {filtersOpen ? (
            <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 lg:grid-cols-3">
              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-800">Statut</h2>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["all", "Tous"],
                    ["a_lancer", "À lancer"],
                    ["en_cours", "En cours"],
                    ["termine", "Terminé"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={statusFilter === value}
                      onClick={() => {
                        setStatusFilter(value);
                        resetPagination();
                      }}
                      className={cn(
                        "flex min-h-11 items-center justify-center rounded-lg border px-2 text-center text-sm font-medium",
                        statusFilter === value
                          ? "border-rose-900 bg-rose-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>
              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-800">Priorité</h2>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["all", "Toutes"],
                    ["haute", "Haute"],
                    ["moyenne", "Moyenne"],
                    ["basse", "Basse"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={priorityFilter === value}
                      onClick={() => {
                        setPriorityFilter(value);
                        resetPagination();
                      }}
                      className={cn(
                        "flex min-h-11 items-center justify-center rounded-lg border px-2 text-center text-sm font-medium",
                        priorityFilter === value
                          ? "border-rose-900 bg-rose-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>
              <section className="space-y-3 rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-800">Service</h2>
                <Select
                  value={serviceFilter}
                  onValueChange={(value) => {
                    setServiceFilter(value);
                    resetPagination();
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les services</SelectItem>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </section>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {columnFiltersActive ? (
        <div className="flex flex-col gap-2 rounded-xl border border-rose-100 bg-white px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-rose-900">Des filtres de colonnes sont actifs dans le tableau.</p>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-xl text-stone-600"
            onClick={() => setColumnFilters(emptyPlanColumnFilters())}
          >
            Réinitialiser les colonnes
          </Button>
        </div>
      ) : null}

      {displayMode === "cards" && visiblePlans.length > 0 ? (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {paginatedPlans.map((plan) => {
          const listProtocol = mergePlanProtocol(plan.protocol, risks.find((r) => r.id === plan.riskId), currentUserName);
          const orgsCount = listProtocol.coIntervenantRows.filter(coIntervenantRowHasContent).length;
          const lieu = listProtocol.lieuLivraison || plan.location || "Non renseigné";
          return (
            <article
              key={plan.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-stone-50 px-5 py-3">
                <PlanStatusMark status={plan.status} />
                <p className="text-xs font-medium text-stone-600">Priorité {priorityLabelUi[plan.priority].toLowerCase()}</p>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p className="text-xs text-stone-500">Risque n° {plan.riskNumber || "—"} · {plan.service || "Service non renseigné"}</p>
                  <h2 className="mt-1 text-xl font-semibold leading-snug text-stone-950">
                    {plan.riskTitle || normalizeDocumentTitle(listProtocol.protocoleTitle, "Plan de prévention")}
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Échéance</p>
                    <p className="mt-1 text-sm font-medium leading-snug text-stone-900">{formatPlanDate(plan.dueDate)}</p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Lieu</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-stone-900">{lieu}</p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Structures</p>
                    <p className="mt-1 text-sm font-medium leading-snug text-stone-900">{orgsCount === 0 ? "Aucune" : `${orgsCount} co-intervenant${orgsCount > 1 ? "s" : ""}`}</p>
                  </div>
                </div>
                <p className="text-sm text-stone-600">
                  Responsable <span className="font-medium text-stone-900">{plan.owner?.trim() || "non renseigné"}</span>
                </p>
                <div className="mt-auto grid grid-cols-1 gap-2 border-t border-stone-100 pt-4 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full rounded-lg border-stone-300 text-stone-800 hover:bg-stone-50"
                    onClick={() => openDetail(plan)}
                  >
                    <FileText className="h-4 w-4" />
                    Consulter
                  </Button>
                  {canEdit ? (
                    <Button
                      type="button"
                      className="h-10 w-full rounded-lg bg-rose-900 text-white hover:bg-rose-950"
                      onClick={() => openEdit(plan)}
                    >
                      Modifier
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-lg border-rose-200 text-rose-800 hover:bg-rose-50"
                      onClick={() => setPlanPendingDelete(plan)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      ) : null}

      {displayMode === "table" && visiblePlans.length > 0 ? (
        <Card className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="h-1 bg-rose-900" />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead className="border-b border-rose-100 bg-rose-50/70">
                  <tr>
                    {PLAN_COLUMNS.map((column) => renderFilterableTh(column.key))}
                    <th className="w-36 px-4 py-3 text-left text-sm font-semibold text-stone-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedPlans.map((plan) => {
                    const facts = planFacts.get(plan.id);
                    if (!facts) return null;
                    return (
                      <tr
                        key={plan.id}
                        className="cursor-pointer align-middle transition-colors hover:bg-rose-50/40"
                        onClick={() => openDetail(plan)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") openDetail(plan);
                        }}
                        tabIndex={0}
                        aria-label={`Consulter ${facts.title}`}
                      >
                        <td className="px-4 py-4 text-sm font-semibold tabular-nums text-stone-900">{facts.numero || "—"}</td>
                        <td className="px-4 py-4">
                          <p className="max-w-xs text-sm font-semibold leading-snug text-stone-950">{facts.title}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-stone-700">{facts.service}</td>
                        <td className="px-4 py-4"><PlanStatusMark status={plan.status} /></td>
                        <td className="px-4 py-4 text-sm text-stone-700">{facts.priority}</td>
                        <td className="px-4 py-4 text-sm text-stone-700">{formatPlanDate(facts.due)}</td>
                        <td className="px-4 py-4">
                          <p className="line-clamp-2 max-w-xs text-sm leading-snug text-stone-700">{facts.lieu}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-stone-700">{structuresLabel(Number(facts.structures) || 0)}</td>
                        <td className="px-4 py-4 text-sm text-stone-700">{facts.owner}</td>
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
                              onClick={() => openDetail(plan)}
                              className="h-9 w-9 shrink-0 rounded-xl border-stone-300 bg-white p-0 text-stone-800 shadow-sm hover:bg-stone-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEdit ? (
                              <Button
                                type="button"
                                aria-label="Modifier"
                                title="Modifier"
                                onClick={() => openEdit(plan)}
                                className="h-9 w-9 shrink-0 rounded-xl bg-rose-900 p-0 text-white shadow-sm hover:bg-rose-950"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {canEdit ? (
                              <Button
                                type="button"
                                variant="outline"
                                aria-label="Supprimer"
                                title="Supprimer"
                                onClick={() => setPlanPendingDelete(plan)}
                                className="h-9 w-9 shrink-0 rounded-xl border-rose-200 bg-white p-0 text-rose-800 shadow-sm hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={visiblePlans.length}
        onPageChange={setCurrentPage}
        itemLabel="plan(s)"
      />

      {visiblePlans.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white/80">
          <CardContent className="py-14 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Aucun plan de prévention</p>
            <p className="text-gray-500 text-sm mt-1">Ajustez les filtres ou créez un nouveau plan.</p>
          </CardContent>
        </Card>
      ) : null}
      {planDeleteConfirmDialog}
    </div>
  );
}
