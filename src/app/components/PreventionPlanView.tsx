import React, { useMemo, useRef, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  ChevronsUpDown,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Info,
  Paperclip,
  PhoneCall,
  PlusCircle,
  Route,
  Search,
  Send,
  Shield,
  Signature,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar } from "@/app/components/ui/list-pagination-bar";
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

export interface RiskMeasure {
  description: string;
  responsible: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
}

/** Ligne du tableau §4 : stockage colonne 1 = situation dangereuse, colonne 2 = dommages associés, colonne 3 = mesures (clés `domaine` / `natureRisques` conservées pour compatibilité données). */
export interface PlanRiskEvaluationRow {
  id: string;
  /** Risque de l’onglet « Évaluation des risques » — liaison facultative ; saisie libre possible sans liaison. */
  linkedEvaluationRiskId: string;
  /** Mention / référence saisie à la main hors référentiel ; affichée dans le champ quand aucune liaison catalogue. */
  evaluationRiskFreeText: string;
  /** Contenu affiché sous « Situation dangereuse » */
  domaine: string;
  /** Contenu affiché sous « Dommages associés » */
  natureRisques: string;
  mesuresPrevention: string;
}

/** Entreprise, administration ou organisme partie au plan (aucun bloc imposé : pas d’APB obligatoire), liste illimitée. */
export interface PlanCoIntervenantRow {
  id: string;
  /** Qualité / rôle facultatif — ex. « APB », « Société intervenante », « Administration »… */
  qualite: string;
  denomination: string;
  adresse: string;
  contactNom: string;
  contactEmail: string;
  /** Navire, capitaine, téléphone complémentaire, etc. */
  complements: string;
}

export interface PlanAnnexAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  /** data:image/... ou data:application/pdf;base64,... */
  dataUrl: string;
  sizeBytes: number;
}

export interface RiskInput {
  id: string;
  numeroRisque: string;
  title: string;
  service: string;
  domain?: string;
  site: string;
  responsable: string;
  riskLevel: number;
  plannedMeasures: RiskMeasure[];
  situation?: string;
  associatedRisk?: string;
  existingMeasures?: string[];
}

export interface PlanProtocolFields {
  protocoleTitle: string;
  codeTravailReference: string;
  operationType: string;
  coIntervenantRows: PlanCoIntervenantRow[];
  prestationNature: string;
  lieuLivraison: string;
  materielsSpecifiques: string;
  consignesSite: string;
  consignesOperation: string;
  /** Complément libre sous le tableau d’évaluation des risques */
  evaluationRisques: string;
  riskEvaluationRows: PlanRiskEvaluationRow[];
  personnesAPrevenir: string;
  mesuresUrgence: string;
  planTransmis: string;
  transmissionCelluleSecurite: string;
  transmissionCorrespondantSite: string;
  transmissionCorrespondantAPB: string;
  transmissionCelluleSecuriteStatus: "non_renseigne" | "oui" | "non";
  transmissionCorrespondantSiteStatus: "non_renseigne" | "oui" | "non";
  transmissionCorrespondantAPBStatus: "non_renseigne" | "oui" | "non";
  transmissionCelluleSecuriteNom: string;
  transmissionCorrespondantSiteNom: string;
  transmissionCorrespondantAPBNom: string;
  transmissionCelluleSecuriteObs: string;
  transmissionCorrespondantSiteObs: string;
  transmissionCorrespondantAPBObs: string;
  observationsTransmission: string;
  observationsRemarques: string;
  signatureEntite1: string;
  signatureNom1: string;
  signaturePrenom1: string;
  signatureDate1: string;
  signatureEntite2: string;
  signatureNom2: string;
  signaturePrenom2: string;
  signatureDate2: string;
  signatureEntite3: string;
  signatureNom3: string;
  signaturePrenom3: string;
  signatureDate3: string;
  /** Signature dématérialisée (scan / photo / image) pour le PDF — data URL */
  signatureDematerialiseeUrl1: string;
  signatureDematerialiseeUrl2: string;
  signatureDematerialiseeUrl3: string;
  planCirculation: string;
  materielRemplacer: string;
  /** Fichiers joints (stockés en local : data URL) */
  annexAttachments: PlanAnnexAttachment[];
  /** Complément rédactionnel hors pièces jointes */
  annexesDocuments: string;
}

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

export type PlanStatus = "a_lancer" | "en_cours" | "termine";
type ViewMode = "list" | "detail" | "create" | "edit";

export interface PlanRecord {
  id: string;
  riskId: string;
  riskNumber: string;
  riskTitle: string;
  service: string;
  domain: string;
  location: string;
  owner: string;
  dueDate: string;
  priority: "haute" | "moyenne" | "basse";
  status: PlanStatus;
  objective: string;
  actions: string[];
  protocol: PlanProtocolFields;
  updatedAt: string;
}

interface PreventionPlanViewProps {
  risks: RiskInput[];
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
}

const statusLabel: Record<PlanStatus, string> = {
  a_lancer: "A lancer",
  en_cours: "En cours",
  termine: "Termine",
};

const statusClass: Record<PlanStatus, string> = {
  a_lancer: "bg-amber-100 text-amber-800 border-amber-300",
  en_cours: "bg-teal-100 text-teal-800 border-teal-300",
  termine: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const priorityLabelUi: Record<"haute" | "moyenne" | "basse", string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

/** Sous-titre carte liste : évite la répétition du type d’opération (déjà dans le titre / nature). */
function planCardSubtitle(plan: Pick<PlanRecord, "service" | "dueDate" | "priority" | "riskNumber">): string {
  const parts: string[] = [];
  if (plan.service?.trim()) parts.push(`Service : ${plan.service.trim()}`);
  if (plan.dueDate?.trim()) parts.push(`Échéance : ${plan.dueDate.trim()}`);
  if (parts.length > 0) return parts.join(" · ");
  if (plan.riskNumber?.trim()) return plan.riskNumber.trim();
  return `Priorité : ${priorityLabelUi[plan.priority]}`;
}

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

function formatCoIntervenantsForPdf(rows: PlanCoIntervenantRow[]): string {
  const filled = rows.filter(coIntervenantRowHasContent);
  if (filled.length === 0) return "Aucun co-intervenant renseigne.";
  return filled
    .map((r, idx) => {
      const parts: string[] = [];
      const title = r.qualite.trim()
        ? `${idx + 1}. [${r.qualite.trim()}] ${r.denomination.trim() || "—"}`
        : `${idx + 1}. ${r.denomination.trim() || "—"}`;
      parts.push(title);
      if (r.adresse.trim()) parts.push(`Adresse : ${r.adresse.trim()}`);
      const c = [r.contactNom.trim(), r.contactEmail.trim()].filter(Boolean).join(" — ");
      if (c) parts.push(`Contact : ${c}`);
      if (r.complements.trim()) parts.push(r.complements.trim());
      return parts.join("\n");
    })
    .join("\n\n");
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
            <div className="flex min-h-9 flex-1 items-center gap-2 rounded-md border-2 border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-left text-slate-900">
                {linked.numeroRisque} — {linked.title}
              </span>
            </div>
          ) : (
            <Input
              className="flex-1 border-2 border-slate-300 min-h-9"
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
                className="w-full shrink-0 justify-center gap-2 border-2 border-slate-300 font-normal sm:w-auto sm:min-w-[10rem]"
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
                  <SelectTrigger className="bg-white border-violet-200">
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
                  <SelectTrigger className="bg-white border-violet-200">
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
                <SelectTrigger className="bg-white border-violet-200 max-w-full">
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
            className="field-sizing-fixed min-h-[96px] resize-y border-2 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label>Dommages associés</Label>
          <Textarea
            rows={4}
            value={row.natureRisques ?? ""}
            onChange={(e) => onPatch({ natureRisques: e.target.value })}
            placeholder="Dommages / conséquences possibles (ou texte libre)…"
            className="field-sizing-fixed min-h-[96px] resize-y border-2 border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label>Mesures de prévention</Label>
          <Textarea
            rows={4}
            value={row.mesuresPrevention ?? ""}
            onChange={(e) => onPatch({ mesuresPrevention: e.target.value })}
            placeholder="Mesures existantes, compléments ou toute précision hors liste…"
            className="field-sizing-fixed min-h-[96px] resize-y border-2 border-slate-200"
          />
        </div>
      </div>
    </div>
  );
}

export function PreventionPlanView({ risks, currentUserRole, currentUserName }: PreventionPlanViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlanSnapshot, setSelectedPlanSnapshot] = useState<PlanRecord | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "haute" | "moyenne" | "basse">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const annexFilesInputRef = useRef<HTMLInputElement>(null);
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

  const [plans, setPlans] = useState<PlanRecord[]>(initialPlans);

  const serviceOptions = useMemo(
    () => Array.from(new Set(plans.map((plan) => plan.service))).sort((a, b) => a.localeCompare(b)),
    [plans],
  );

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      if (priorityFilter !== "all" && plan.priority !== priorityFilter) return false;
      if (serviceFilter !== "all" && plan.service !== serviceFilter) return false;
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
        annexBlob.includes(lower)
      );
    });
  }, [plans, query, priorityFilter, serviceFilter, statusFilter]);

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
      const visualOk = await downloadPreventionPlanVisualPdf(plan, mergedProtocol, risks);
      if (visualOk) {
        toast.success("PDF téléchargé (mise en page proche de la fiche à l’écran).");
        return;
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageHeight = 297;
      const margin = 14;
      const contentWidth = 182;
      let y = 16;

      const ensureSpace = (needed = 14) => {
        if (y + needed > pageHeight - 14) {
          doc.addPage();
          y = 16;
        }
      };

      const addTitle = (title: string) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(title, margin, y);
        y += 7;
      };

      const addBlock = (label: string, value: string) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value || "-", contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      };

      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, 210, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PLAN DE PREVENTION", margin, 9);
      doc.setTextColor(0, 0, 0);
      y = 20;

      addTitle(`${plan.riskNumber} - ${plan.riskTitle}`);
      addBlock("Reference", mergedProtocol.codeTravailReference);
      addBlock("Objectif", plan.objective);
      addBlock(
        "1) Co-intervenants (entreprises / administrations / organismes)",
        formatCoIntervenantsForPdf(mergedProtocol.coIntervenantRows),
      );
      addBlock("2) Nature de la prestation (ensemble de l'operation)", mergedProtocol.prestationNature);
      addBlock("3) Organisation du chargement/dechargement", `Lieu: ${mergedProtocol.lieuLivraison}\nMateriels: ${mergedProtocol.materielsSpecifiques}\nConsignes site: ${mergedProtocol.consignesSite}\nConsignes operation: ${mergedProtocol.consignesOperation}`);
      const riskLines = mergedProtocol.riskEvaluationRows
        .map((r, idx) => {
          const refRisk = r.linkedEvaluationRiskId
            ? risks.find((x) => x.id === r.linkedEvaluationRiskId)
            : undefined;
          const refNote = refRisk ? `\nReference evaluation interne : ${refRisk.numeroRisque}` : "";
          const freeNote =
            !refRisk && (r.evaluationRiskFreeText ?? "").trim().length > 0
              ? `\nRisque (mention hors référentiel) : ${(r.evaluationRiskFreeText ?? "").trim()}`
              : "";
          return `Ligne ${idx + 1} — Situation dangereuse: ${r.domaine || "-"}\nDommages associés: ${r.natureRisques || "-"}\nMesures de prevention: ${r.mesuresPrevention || "-"}${refNote}${freeNote}`;
        })
        .join("\n\n");
      addBlock(
        "4) Evaluation des risques (CT R4515-5)",
        `${riskLines || "Aucune ligne renseignee."}\n\nComplement libre:\n${mergedProtocol.evaluationRisques || "-"}`,
      );
      addBlock("5) Premiers secours (CT R4515-6)", `Personnes a prevenir: ${mergedProtocol.personnesAPrevenir}\nMesures urgence: ${mergedProtocol.mesuresUrgence}`);
      addBlock("6) Plan de prevention transmis a (CT R4515-11)", `${mergedProtocol.planTransmis}\nCellule securite: ${mergedProtocol.transmissionCelluleSecuriteStatus} - ${mergedProtocol.transmissionCelluleSecuriteNom} (${mergedProtocol.transmissionCelluleSecuriteObs})\nCorrespondant site: ${mergedProtocol.transmissionCorrespondantSiteStatus} - ${mergedProtocol.transmissionCorrespondantSiteNom} (${mergedProtocol.transmissionCorrespondantSiteObs})\nCorrespondant APB: ${mergedProtocol.transmissionCorrespondantAPBStatus} - ${mergedProtocol.transmissionCorrespondantAPBNom} (${mergedProtocol.transmissionCorrespondantAPBObs})`);
      addBlock("7) Observations / remarques", mergedProtocol.observationsRemarques);
      addBlock("8) Signatures", `${mergedProtocol.signatureEntite1} - ${mergedProtocol.signatureNom1} ${mergedProtocol.signaturePrenom1} - ${mergedProtocol.signatureDate1}\n${mergedProtocol.signatureEntite2} - ${mergedProtocol.signatureNom2} ${mergedProtocol.signaturePrenom2} - ${mergedProtocol.signatureDate2}\n${mergedProtocol.signatureEntite3} - ${mergedProtocol.signatureNom3} ${mergedProtocol.signaturePrenom3} - ${mergedProtocol.signatureDate3}`);
      addBlock("10) Plan de circulation et de dechargement", mergedProtocol.planCirculation);
      addBlock("Materiel a remplacer", mergedProtocol.materielRemplacer);
      const annexFilesBlock =
        mergedProtocol.annexAttachments.length > 0
          ? mergedProtocol.annexAttachments
              .map((a, idx) => `${idx + 1}. ${a.fileName} (${formatByteSize(a.sizeBytes)})`)
              .join("\n")
          : "";
      const annexComplement =
        mergedProtocol.annexesDocuments.trim().length > 0 ? mergedProtocol.annexesDocuments.trim() : "";
      addBlock(
        "Annexes et documents joints",
        [annexFilesBlock && `Fichiers (${mergedProtocol.annexAttachments.length}) :\n${annexFilesBlock}`, annexComplement]
          .filter(Boolean)
          .join("\n\n") || "-",
      );

      doc.save(`plan-prevention-${plan.riskNumber || plan.id}.pdf`);
      toast.success("PDF téléchargé (version texte simplifiée, fallback).");
    } catch (error) {
      toast.error("Impossible de generer le PDF.");
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, priorityFilter, serviceFilter]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (viewMode === "detail" && selectedPlan && selectedProtocol) {
    return (
      <>
      <div className="space-y-6 p-3 sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleDownloadPlan(selectedPlan)}
              className="w-full sm:w-auto border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            {canEdit ? (
              <Button
                onClick={() => openEdit(selectedPlan)}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                Modifier
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="outline"
                onClick={() => setPlanPendingDelete(selectedPlan)}
                className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setViewMode("list");
                setSelectedPlanSnapshot(null);
              }}
              className="w-full sm:w-auto font-semibold shadow-sm border-2 border-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Plan de prevention</p>
                  <CardTitle className="text-2xl mt-1">{selectedPlan.riskNumber} — {selectedPlan.riskTitle}</CardTitle>
                  <CardDescription className="text-emerald-100 mt-2">{selectedProtocol.codeTravailReference}</CardDescription>
                </div>
              </div>
              <Badge className={statusClass[selectedPlan.status]}>{statusLabel[selectedPlan.status]}</Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-2 border-indigo-100 bg-indigo-50/70"><CardContent className="p-4"><p className="text-xs text-indigo-700 font-semibold uppercase">Service</p><p className="font-semibold text-indigo-900 mt-1">{selectedPlan.service}</p></CardContent></Card>
          <Card className="border-2 border-teal-100 bg-teal-50/70"><CardContent className="p-4"><p className="text-xs text-teal-700 font-semibold uppercase">Domaine</p><p className="font-semibold text-teal-900 mt-1">{selectedPlan.domain}</p></CardContent></Card>
          <Card className="border-2 border-cyan-100 bg-cyan-50/70"><CardContent className="p-4"><p className="text-xs text-cyan-700 font-semibold uppercase">Lieu</p><p className="font-semibold text-cyan-900 mt-1">{selectedPlan.location}</p></CardContent></Card>
          <Card className="border-2 border-emerald-100 bg-emerald-50/70"><CardContent className="p-4"><p className="text-xs text-emerald-700 font-semibold uppercase">Responsable</p><p className="font-semibold text-emerald-900 mt-1">{selectedPlan.owner}</p></CardContent></Card>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Actions de prevention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPlan.actions.map((action, index) => (
              <div key={`${action}-${index}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Action {index + 1} :</span> {action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-100 shadow-sm">
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

        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">2) Nature de la prestation</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{selectedProtocol.prestationNature || "-"}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">3) Organisation du chargement ou déchargement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Lieu de livraison ou prise en charge</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.lieuLivraison || "-"}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Matériel(s) spécifique(s) utilisé(s)</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.materielsSpecifiques || "-"}</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs text-amber-700 font-semibold uppercase">Consignes de sécurité particulières sur le site</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.consignesSite || "-"}</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs text-amber-700 font-semibold uppercase">Consignes particulières concernant l'opération</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.consignesOperation || "-"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
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
          <Card className="border-2 border-emerald-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-emerald-900">5) Premiers secours (CT R4515-6)</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700 font-semibold uppercase">Personne(s) à prévenir</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.personnesAPrevenir || "-"}</p></div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-3"><p className="text-xs text-red-700 font-semibold uppercase">Mesure(s) en cas d'accident ou incendie</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.mesuresUrgence || "-"}</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-100 shadow-sm">
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

        <Card className="border-2 border-rose-100 shadow-sm">
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
          <Card className="border-2 border-sky-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-sky-900">10) Plan de circulation et de déchargement</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.planCirculation || "-"}</p></CardContent>
          </Card>
          <Card className="border-2 border-sky-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-sky-900">Matériel à remplacer</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.materielRemplacer || "-"}</p></CardContent>
          </Card>
        </div>
        <Card className="border-2 border-slate-200 shadow-sm">
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
      {planDeleteConfirmDialog}
    </>
    );
  }

  if ((viewMode === "create" || viewMode === "edit") && canEdit) {
    return (
      <>
      <div className="space-y-6 p-3 sm:p-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {viewMode === "create" ? "Nouveau plan de prevention" : "Modifier le plan de prevention"}
            </h2>
            <p className="text-slate-600 mt-1">Edition en page complete, style premium.</p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setViewMode("list");
                setSelectedPlanSnapshot(null);
              }}
              className="w-full sm:w-auto font-semibold shadow-sm border-2 border-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white">
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardContent className="p-5 sm:p-8 space-y-5">
            <Card className="border-0 bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 text-white">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Plan de prévention</p>
                    <p className="text-lg font-semibold mt-1">{form.protocol.protocoleTitle}</p>
                    <p className="text-emerald-100 text-sm mt-1">{form.protocol.codeTravailReference}</p>
                  </div>
                  <Badge className="bg-white text-slate-900 border-white/20">
                    {viewMode === "create" ? "Création du plan" : "Modification du plan"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} className="border-2 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label>Echeance</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="border-2 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label>Priorite</Label>
                <Select value={form.priority} onValueChange={(value: "haute" | "moyenne" | "basse") => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="border-2 border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objectif de prevention *</Label>
              <Textarea rows={4} value={form.objective} onChange={(e) => setForm((prev) => ({ ...prev, objective: e.target.value }))} className="border-2 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label>Actions (une par ligne)</Label>
              <Textarea rows={6} value={form.actionsText} onChange={(e) => setForm((prev) => ({ ...prev, actionsText: e.target.value }))} className="border-2 border-slate-300" />
            </div>

            <Separator />

            <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-4 flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-teal-700 mt-0.5" aria-hidden />
              <p className="text-sm text-slate-800">
                Vous éditez un <strong className="font-semibold">plan de prévention</strong> (coactivité, art. R4515-4 à R4515-11). Le document dédié au{" "}
                <strong className="font-semibold">chargement / déchargement</strong> se saisit dans l’autre onglet de l’application.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-slate-900">Champs du plan de prévention</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre du plan de prévention</Label>
                <Input value={form.protocol.protocoleTitle} onChange={(e) => updateProtocol("protocoleTitle", e.target.value)} className="border-2 border-slate-300" />
              </div>
              <div className="space-y-2"><Label>Référence (code du Travail)</Label><Input value={form.protocol.codeTravailReference} onChange={(e) => updateProtocol("codeTravailReference", e.target.value)} className="border-2 border-slate-300" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Type operation</Label><Input value={form.protocol.operationType} onChange={(e) => updateProtocol("operationType", e.target.value)} className="border-2 border-slate-300" /></div>
            </div>

            <Card className="border border-slate-200 shadow-sm">
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
                  <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">Structure {idx + 1}</p>
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

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">2) Nature de la prestation</CardTitle>
                <CardDescription>Objet de l’opération pour l’ensemble des co-intervenants.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea rows={3} value={form.protocol.prestationNature} onChange={(e) => updateProtocol("prestationNature", e.target.value)} />
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Route className="h-4 w-4 text-cyan-600" />3) Organisation chargement / dechargement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Lieu de livraison / prise en charge</Label><Textarea rows={2} value={form.protocol.lieuLivraison} onChange={(e) => updateProtocol("lieuLivraison", e.target.value)} /></div>
                <div className="space-y-2"><Label>Materiels specifiques utilises</Label><Textarea rows={2} value={form.protocol.materielsSpecifiques} onChange={(e) => updateProtocol("materielsSpecifiques", e.target.value)} /></div>
                <div className="space-y-2"><Label>Consignes de securite site</Label><Textarea rows={2} value={form.protocol.consignesSite} onChange={(e) => updateProtocol("consignesSite", e.target.value)} /></div>
                <div className="space-y-2"><Label>Consignes operation</Label><Textarea rows={2} value={form.protocol.consignesOperation} onChange={(e) => updateProtocol("consignesOperation", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
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
                    <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">Risque ligne {idx + 1}</p>
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

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><PhoneCall className="h-4 w-4 text-emerald-600" />5) Premiers secours (CT R4515-6)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Personne(s) à prévenir</Label><Textarea rows={2} value={form.protocol.personnesAPrevenir} onChange={(e) => updateProtocol("personnesAPrevenir", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mesure(s) à suivre en cas d'accident ou incendie</Label><Textarea rows={2} value={form.protocol.mesuresUrgence} onChange={(e) => updateProtocol("mesuresUrgence", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-orange-600" />6) Plan de prévention transmis à (CT R4515-11)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Liste de diffusion</Label><Textarea rows={2} value={form.protocol.planTransmis} onChange={(e) => updateProtocol("planTransmis", e.target.value)} /></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Cellule Sécurité Prévention DIRM MED</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCelluleSecuriteNom} onChange={(e) => updateProtocol("transmissionCelluleSecuriteNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCelluleSecuriteStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCelluleSecuriteStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigne</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCelluleSecuriteObs} onChange={(e) => updateProtocol("transmissionCelluleSecuriteObs", e.target.value)} />
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Correspondant Hygiène et Sécurité du site</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCorrespondantSiteNom} onChange={(e) => updateProtocol("transmissionCorrespondantSiteNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCorrespondantSiteStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCorrespondantSiteStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigne</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCorrespondantSiteObs} onChange={(e) => updateProtocol("transmissionCorrespondantSiteObs", e.target.value)} />
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Correspondant Hygiène et Sécurité APB</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCorrespondantAPBNom} onChange={(e) => updateProtocol("transmissionCorrespondantAPBNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCorrespondantAPBStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCorrespondantAPBStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigne</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCorrespondantAPBObs} onChange={(e) => updateProtocol("transmissionCorrespondantAPBObs", e.target.value)} />
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Texte libre cellule securite</Label><Input value={form.protocol.transmissionCelluleSecurite} onChange={(e) => updateProtocol("transmissionCelluleSecurite", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Texte libre correspondant site</Label><Input value={form.protocol.transmissionCorrespondantSite} onChange={(e) => updateProtocol("transmissionCorrespondantSite", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Texte libre correspondant APB</Label><Input value={form.protocol.transmissionCorrespondantAPB} onChange={(e) => updateProtocol("transmissionCorrespondantAPB", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Observations de transmission</Label><Textarea rows={2} value={form.protocol.observationsTransmission} onChange={(e) => updateProtocol("observationsTransmission", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base">7) Observations / remarques</CardTitle></CardHeader>
              <CardContent><Textarea rows={3} value={form.protocol.observationsRemarques} onChange={(e) => updateProtocol("observationsRemarques", e.target.value)} /></CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
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
                    <Input placeholder="Entite 1" value={form.protocol.signatureEntite1} onChange={(e) => updateProtocol("signatureEntite1", e.target.value)} />
                    <Input placeholder="Nom" value={form.protocol.signatureNom1} onChange={(e) => updateProtocol("signatureNom1", e.target.value)} />
                    <Input placeholder="Prenom" value={form.protocol.signaturePrenom1} onChange={(e) => updateProtocol("signaturePrenom1", e.target.value)} />
                    <Input type="date" value={form.protocol.signatureDate1} onChange={(e) => updateProtocol("signatureDate1", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Signature dématérialisée (image)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="border-2 border-slate-300"
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
                    <Input placeholder="Entite 2" value={form.protocol.signatureEntite2} onChange={(e) => updateProtocol("signatureEntite2", e.target.value)} />
                    <Input placeholder="Nom" value={form.protocol.signatureNom2} onChange={(e) => updateProtocol("signatureNom2", e.target.value)} />
                    <Input placeholder="Prenom" value={form.protocol.signaturePrenom2} onChange={(e) => updateProtocol("signaturePrenom2", e.target.value)} />
                    <Input type="date" value={form.protocol.signatureDate2} onChange={(e) => updateProtocol("signatureDate2", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Signature dématérialisée (image)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="border-2 border-slate-300"
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
                    <Input placeholder="Entite 3" value={form.protocol.signatureEntite3} onChange={(e) => updateProtocol("signatureEntite3", e.target.value)} />
                    <Input placeholder="Nom" value={form.protocol.signatureNom3} onChange={(e) => updateProtocol("signatureNom3", e.target.value)} />
                    <Input placeholder="Prenom" value={form.protocol.signaturePrenom3} onChange={(e) => updateProtocol("signaturePrenom3", e.target.value)} />
                    <Input type="date" value={form.protocol.signatureDate3} onChange={(e) => updateProtocol("signatureDate3", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Signature dématérialisée (image)</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="border-2 border-slate-300"
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

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Route className="h-4 w-4 text-sky-600" />10) Plan de circulation / dechargement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Plan de circulation et de dechargement</Label><Textarea rows={3} value={form.protocol.planCirculation} onChange={(e) => updateProtocol("planCirculation", e.target.value)} /></div>
                <div className="space-y-2"><Label>Materiel a remplacer</Label><Textarea rows={2} value={form.protocol.materielRemplacer} onChange={(e) => updateProtocol("materielRemplacer", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-700" aria-hidden />
                  Annexes et documents joints
                </CardTitle>
                <CardDescription>
                  Joignez des fichiers (PDF, images, bureautique). Limite {formatByteSize(PLAN_ANNEX_MAX_BYTES)} par fichier, {PLAN_ANNEX_MAX_COUNT} fichiers maximum — stockage local à cette session.
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
                    className="border-2 border-slate-300"
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
                    className="border-2 border-slate-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              {viewMode === "edit" && selectedPlan ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlanPendingDelete(selectedPlan)}
                  className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer le plan
                </Button>
              ) : (
                <span className="hidden sm:inline sm:flex-1" aria-hidden />
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewMode("list");
                    setSelectedPlanSnapshot(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button
                  onClick={saveForm}
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {planDeleteConfirmDialog}
      </>
    );
  }

  const doneCount = visiblePlans.filter((plan) => plan.status === "termine").length;
  const inProgressCount = visiblePlans.filter((plan) => plan.status === "en_cours").length;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800 via-emerald-800 to-teal-800 text-white overflow-hidden">
        <CardHeader className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl sm:text-4xl font-bold">Plan de prévention</CardTitle>
                <p className="text-emerald-100 text-lg mt-1">Pilotage des actions de prevention par risque, service et priorite.</p>
              </div>
            </div>
            <Badge className="w-full lg:w-auto justify-center bg-white text-slate-900 border border-slate-200 text-lg px-5 py-2">
              {visiblePlans.length} plan(s)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50"><CardContent className="p-4"><p className="text-xs text-indigo-700 uppercase font-semibold">Plans visibles</p><p className="text-2xl font-bold text-indigo-900 mt-1">{visiblePlans.length}</p></CardContent></Card>
        <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50"><CardContent className="p-4"><p className="text-xs text-teal-700 uppercase font-semibold">En cours</p><p className="text-2xl font-bold text-teal-900 mt-1">{inProgressCount}</p></CardContent></Card>
        <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50"><CardContent className="p-4"><p className="text-xs text-emerald-700 uppercase font-semibold">Termines</p><p className="text-2xl font-bold text-emerald-900 mt-1">{doneCount}</p></CardContent></Card>
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50/80 p-3 flex gap-3">
        <Info className="h-5 w-5 shrink-0 text-teal-700 mt-0.5" aria-hidden />
        <p className="text-sm text-slate-800">
          Cet onglet concerne le <strong className="font-semibold">plan de prévention</strong> (coactivité, modèle type héliportage / opérations). Le document{" "}
          <strong className="font-semibold">chargement / déchargement</strong> est saisi à part, dans l’onglet correspondant.
        </p>
      </div>

      <Card className="border-2 bg-white/95">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:flex-1">
              <div className="relative w-full xl:max-w-md">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPagination();
                  }}
                  placeholder="Rechercher un plan..."
                  className="pl-10 border-2 border-slate-300"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | PlanStatus) => {
                  setStatusFilter(value);
                  resetPagination();
                }}
              >
                <SelectTrigger className="w-full md:w-56 border-2 border-slate-300"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="a_lancer">A lancer</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Termine</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value: "all" | "haute" | "moyenne" | "basse") => {
                  setPriorityFilter(value);
                  resetPagination();
                }}
              >
                <SelectTrigger className="w-full md:w-48 border-2 border-slate-300"><SelectValue placeholder="Priorite" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorites</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="basse">Basse</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={serviceFilter}
                onValueChange={(value) => {
                  setServiceFilter(value);
                  resetPagination();
                }}
              >
                <SelectTrigger className="w-full md:w-52 border-2 border-slate-300"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous services</SelectItem>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="hidden xl:flex items-center gap-2 text-sm text-slate-500"><Filter className="h-4 w-4" />Filtres</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setServiceFilter("all");
                  resetPagination();
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
            {canEdit ? (
              <Button onClick={openCreate} className="w-full xl:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau plan
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {paginatedPlans.map((plan) => {
          const listProtocol = mergePlanProtocol(plan.protocol, risks.find((r) => r.id === plan.riskId), currentUserName);
          const orgsFilled = listProtocol.coIntervenantRows.filter(coIntervenantRowHasContent);
          const orgsSummary =
            orgsFilled.length === 0
              ? "—"
              : `${orgsFilled
                  .slice(0, 2)
                  .map((r) => r.denomination.trim() || r.qualite.trim() || "(sans nom)")
                  .join(" · ")}${orgsFilled.length > 2 ? ` · +${orgsFilled.length - 2}` : ""}`;
          return (
          <Card key={plan.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <CardContent className="p-5 space-y-4">
              {(() => {
                const totalActions = Math.max(1, plan.actions.length);
                const completedActions =
                  plan.status === "termine"
                    ? totalActions
                    : plan.status === "en_cours"
                      ? Math.max(1, Math.floor(totalActions / 2))
                      : 0;
                const progress = (completedActions / totalActions) * 100;
                return (
                  <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      {planCardSubtitle(plan)}
                    </p>
                    <p className="text-lg font-semibold text-slate-900 leading-snug break-words">
                      {normalizeDocumentTitle(listProtocol.protocoleTitle, "PLAN DE PREVENTION")}
                    </p>
                  </div>
                </div>
                <Badge className={statusClass[plan.status]}>{statusLabel[plan.status]}</Badge>
              </div>
              <p className="text-sm text-slate-700 line-clamp-2">{listProtocol.prestationNature || plan.objective}</p>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-emerald-700">Lieu :</span>
                  <span className="text-sm font-semibold text-emerald-700">{listProtocol.lieuLivraison || plan.location}</span>
                </div>
                <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-cyan-700">Plan transmis :</span>
                  <span className="text-sm font-semibold text-cyan-700">{listProtocol.planTransmis || "-"}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-semibold">Avancement actions</span>
                  <span className="font-bold text-teal-700">{completedActions}/{totalActions}</span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 shadow-md" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-semibold">Date signature</Label>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-indigo-50 border-indigo-400 text-indigo-700">
                    {listProtocol.signatureDate1 || listProtocol.signatureDate2 || listProtocol.signatureDate3 || "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-semibold">Co-intervenants</Label>
                  <div className="w-full rounded-lg border-2 bg-sky-50 border-sky-300 px-3 py-3 text-left">
                    <p className="text-xs font-semibold text-sky-950 whitespace-normal break-words line-clamp-4">
                      {orgsFilled.length === 0 ? "—" : orgsSummary}
                    </p>
                    {orgsFilled.length > 0 ? (
                      <p className="text-[10px] font-medium uppercase tracking-wide text-sky-700 mt-2">
                        {orgsFilled.length} structure(s)
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full rounded-xl px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md border border-teal-400/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-100">Responsable du plan</p>
                <p className="text-base font-bold leading-snug break-words">{plan.owner?.trim() || "—"}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <Button variant="outline" className="w-full sm:flex-1" onClick={() => openDetail(plan)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter
                </Button>
                {canEdit ? (
                  <Button className="w-full sm:flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700" onClick={() => openEdit(plan)}>
                    Modifier
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-900"
                    onClick={() => setPlanPendingDelete(plan)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                ) : null}
              </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
          );
        })}
      </div>

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
            <p className="text-gray-700 font-semibold">Aucun plan de prevention</p>
            <p className="text-gray-500 text-sm mt-1">Ajuste les filtres ou cree un nouveau plan.</p>
          </CardContent>
        </Card>
      ) : null}
      {planDeleteConfirmDialog}
    </div>
  );
}
