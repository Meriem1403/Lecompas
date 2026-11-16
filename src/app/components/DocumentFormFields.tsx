import { useState, type ReactNode } from "react";
import { Calendar, FileText, Info, Tag as TagIcon, Upload, User, Layers } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { DOCUMENT_COLORS, DOCUMENT_STATUSES, DOCUMENT_STATUS_STYLES, documentColor, type DocumentColorId } from "@/app/components/documentBadges";
import { duerpMention } from "@/app/utils/duerpTableExport";
import type { Document } from "@/app/components/DocumentsView";
import { readLibraryFile } from "@/app/utils/documentLibraryExport";
import { toast } from "sonner";

const lineClass = "h-11 w-full rounded-xl border-violet-200 bg-white pl-10 text-sm shadow-sm focus-visible:border-violet-400 focus-visible:ring-4 focus-visible:ring-violet-100";
const dateClass = "h-11 w-full rounded-xl border-violet-200 bg-white pl-3 pr-10 text-sm shadow-sm focus-visible:border-violet-400 focus-visible:ring-4 focus-visible:ring-violet-100 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

export type DocumentDraft = {
  title: string;
  description: string;
  type: Document["type"];
  version: string;
  status: Document["status"];
  createdBy: string;
  documentDate: string;
  badgeColor: DocumentColorId;
  tags: string[];
  tagColors: Record<string, string>;
  fileName?: string;
  fileDataUrl?: string;
  fileSize?: number;
  includeRiskTable: boolean;
  validatedBy?: string;
  validatedAt?: string;
};

export function emptyDocumentDraft(): DocumentDraft {
  return {
    title: "",
    description: "",
    type: "DUERP",
    version: "1.0",
    status: "Brouillon",
    createdBy: "",
    documentDate: new Date().toISOString().split("T")[0],
    badgeColor: "violet",
    tags: [],
    tagColors: {},
    includeRiskTable: true,
  };
}

export function draftFromDocument(document: Document): DocumentDraft {
  return {
    title: document.title,
    description: document.description,
    type: document.type,
    version: document.version,
    status: document.status,
    createdBy: document.createdBy,
    documentDate: document.documentDate || document.updatedAt,
    badgeColor: documentColor(document.badgeColor).id,
    tags: document.tags ?? [],
    tagColors: document.tagColors ?? {},
    fileName: document.fileName,
    fileDataUrl: document.fileDataUrl,
    fileSize: document.fileSize,
    includeRiskTable: Boolean(document.riskRows?.length) || document.type === "DUERP",
    validatedBy: document.validatedBy,
    validatedAt: document.validatedAt,
  };
}

function Line({ icon: Icon, label, htmlFor, children }: { icon: typeof User; label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-violet-500" />
        {children}
      </div>
    </div>
  );
}

export function DocumentFormFields({
  draft,
  onChange,
  riskCount,
  fileInputId,
}: {
  draft: DocumentDraft;
  onChange: (draft: DocumentDraft) => void;
  riskCount: number;
  fileInputId: string;
}) {
  const [tagLabel, setTagLabel] = useState("");
  const [tagColor, setTagColor] = useState<DocumentColorId>("violet");
  const chosen = documentColor(draft.badgeColor);

  const patch = (partial: Partial<DocumentDraft>) => onChange({ ...draft, ...partial });

  const chooseType = (type: Document["type"]) => {
    const next = { ...draft, type };
    if (type === "DUERP" && !next.description.includes("Mise à jour des risques")) {
      next.includeRiskTable = true;
    }
    if (type !== "DUERP") next.includeRiskTable = false;
    onChange(next);
  };

  const addTag = () => {
    const label = tagLabel.trim();
    if (!label || draft.tags.includes(label)) return;
    patch({ tags: [...draft.tags, label], tagColors: { ...draft.tagColors, [label]: tagColor } });
    setTagLabel("");
  };

  return (
    <div className="space-y-5">
      <Line icon={FileText} label="Titre" htmlFor="doc-title">
        <Input id="doc-title" value={draft.title} onChange={(event) => patch({ title: event.target.value })} className={lineClass} placeholder="DUERP, mise à jour des risques" required />
      </Line>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-800">Type</Label>
          <div className="relative">
            <Layers className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-violet-500" />
            <Select value={draft.type} onValueChange={(value) => chooseType(value as Document["type"])}>
              <SelectTrigger className="h-11 rounded-xl border-violet-200 bg-white pl-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["DUERP", "Registre", "Procédure", "Compte-rendu", "Audit", "Formation"].map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Line icon={FileText} label="Version" htmlFor="doc-version">
          <Input id="doc-version" value={draft.version} onChange={(event) => patch({ version: event.target.value })} className={lineClass} required />
        </Line>
        <Line icon={User} label="Auteur" htmlFor="doc-author">
          <Input id="doc-author" value={draft.createdBy} onChange={(event) => patch({ createdBy: event.target.value })} className={lineClass} placeholder="Nom et service" required />
        </Line>
        <div className="space-y-2">
          <Label htmlFor="doc-date" className="text-sm font-semibold text-slate-800">Date du document</Label>
          <div className="relative">
            <Input id="doc-date" type="date" value={draft.documentDate} onChange={(event) => patch({ documentDate: event.target.value })} className={dateClass} />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-description" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Info className="h-4 w-4 text-violet-500" />
          Description
        </Label>
        <Textarea
          id="doc-description"
          value={draft.description}
          onChange={(event) => patch({ description: event.target.value })}
          className="min-h-[96px] rounded-xl border-violet-200 bg-white px-3 py-2.5 text-sm"
          placeholder="Objet du document, et ce qu'il reprend."
          required
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Statut du badge</p>
        <p className="text-sm text-slate-600">La couleur affichée est celle du badge. Elle se choisit ici.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DOCUMENT_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={draft.status === status}
              onClick={() => patch({ status })}
              className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${draft.status === status ? DOCUMENT_STATUS_STYLES[status] : "border-slate-200 bg-white text-slate-600"}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {draft.status === "Validé" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Line icon={User} label="Validé par" htmlFor="doc-validator">
            <Input id="doc-validator" value={draft.validatedBy || ""} onChange={(event) => patch({ validatedBy: event.target.value })} className={lineClass} />
          </Line>
          <div className="space-y-2">
            <Label htmlFor="doc-validated-at" className="text-sm font-semibold text-slate-800">Date de validation</Label>
            <div className="relative">
              <Input id="doc-validated-at" type="date" value={draft.validatedAt || ""} onChange={(event) => patch({ validatedAt: event.target.value })} className={dateClass} />
              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Couleur du badge de type</p>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-pressed={draft.badgeColor === color.id}
              onClick={() => patch({ badgeColor: color.id })}
              className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${color.badge} ${draft.badgeColor === color.id ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
            >
              {color.label}
            </button>
          ))}
        </div>
        <Badge className={`${chosen.badge} border`}>{draft.type}</Badge>
      </div>

      {draft.type === "DUERP" ? (
        <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-semibold text-violet-950">Tableau de la mise à jour des risques</p>
          <p className="text-sm text-violet-900">{duerpMention()} {riskCount} ligne(s), les mêmes colonnes que l'onglet.</p>
          <button
            type="button"
            aria-pressed={draft.includeRiskTable}
            onClick={() => {
              const includeRiskTable = !draft.includeRiskTable;
              const mention = duerpMention();
              const description = includeRiskTable && !draft.description.includes("Mise à jour des risques")
                ? `${draft.description.trim()}\n\n${mention}`.trim()
                : draft.description;
              patch({ includeRiskTable, description });
            }}
            className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${draft.includeRiskTable ? "border-violet-700 bg-violet-700 text-white" : "border-violet-200 bg-white text-violet-950"}`}
          >
            {draft.includeRiskTable ? "Le PDF structuré sera joint" : "Joindre le tableau en PDF"}
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Upload className="h-4 w-4 text-violet-500" />
          Pièce jointe
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id={fileInputId}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,application/pdf"
            className="h-11 rounded-xl border-violet-200 bg-white text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-violet-950"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void readLibraryFile(file).then((stored) => {
                patch(stored);
                toast.success(`${stored.fileName} est prêt.`);
              }).catch(() => toast.error("Le fichier dépasse 10 Mo."));
            }}
          />
        </div>
        <p className="text-sm text-slate-600">{draft.fileName || "Aucun fichier choisi. PDF, image, Word ou Excel, 10 Mo maximum."}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-tag" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <TagIcon className="h-4 w-4 text-violet-500" />
          Étiquettes
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
            <Input id="doc-tag" value={tagLabel} onChange={(event) => setTagLabel(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} className={lineClass} placeholder="Ajouter une étiquette" />
          </div>
          <Button type="button" variant="outline" onClick={addTag} className="h-11 rounded-xl border-violet-200">Ajouter</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_COLORS.map((color) => (
            <button key={color.id} type="button" aria-pressed={tagColor === color.id} onClick={() => setTagColor(color.id)} className={`h-9 rounded-lg border px-2 text-xs font-semibold ${color.badge} ${tagColor === color.id ? "ring-2 ring-slate-900" : ""}`}>
              {color.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {draft.tags.map((tag) => {
            const color = documentColor(draft.tagColors[tag]);
            return (
              <button key={tag} type="button" onClick={() => patch({ tags: draft.tags.filter((item) => item !== tag) })} className={`rounded-lg border px-2 py-1 text-sm ${color.badge}`}>
                {tag} ×
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
