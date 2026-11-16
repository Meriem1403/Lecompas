import { useState } from "react";
import { ArrowLeft, Download, FileSpreadsheet, MessageSquare, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import {
  DUERP_TABLE_COLUMNS,
  downloadDuerpTableExcel,
  duerpMention,
  duerpTableFile,
  generateDuerpTablePdf,
  risksToDuerpRows,
} from "@/app/utils/duerpTableExport";
import type { Document } from "@/app/components/DocumentsView";

export function DuerpEditionPage({
  risks,
  onBack,
  onCreate,
  onSend,
  canSendForSignature = true,
  directorName = "",
}: {
  risks: Risk[];
  onBack: () => void;
  onCreate: (edition: Document) => void;
  onSend?: (edition: Document) => void;
  canSendForSignature?: boolean;
  directorName?: string;
}) {
  const rows = risksToDuerpRows(risks);
  const today = new Date().toISOString().split("T")[0];
  const [comment, setComment] = useState("");

  const downloadPdf = () => {
    if (rows.length === 0) {
      toast.error("Le tableau de la mise à jour des risques est vide.");
      return;
    }
    generateDuerpTablePdf(rows).save(`DUERP_mise_a_jour_${today}.pdf`);
    toast.success("PDF du tableau téléchargé.");
  };

  const downloadExcel = () => {
    if (rows.length === 0) {
      toast.error("Le tableau de la mise à jour des risques est vide.");
      return;
    }
    downloadDuerpTableExcel(rows, today);
    toast.success("Excel du tableau téléchargé.");
  };

  const buildEdition = (): Document | null => {
    if (rows.length === 0) {
      toast.error("Le tableau de la mise à jour des risques est vide.");
      return null;
    }
    const file = duerpTableFile(rows);
    return {
      id: `duerp-table-${Date.now()}`,
      title: "DUERP, mise à jour des risques",
      description: duerpMention(),
      type: "DUERP",
      version: today,
      status: "Brouillon",
      createdBy: "Prévention",
      createdAt: today,
      updatedAt: today,
      documentDate: today,
      badgeColor: "violet",
      purpose: "bibliotheque",
      ...file,
      tags: ["DUERP", "mise à jour"],
      tagColors: { DUERP: "violet", "mise à jour": "indigo" },
      signatureComment: comment.trim() || undefined,
    };
  };

  const createDocument = () => {
    const edition = buildEdition();
    if (edition) onCreate(edition);
  };

  const sendForSignature = () => {
    const edition = buildEdition();
    if (edition) onSend?.(edition);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">DUERP, mise à jour des risques</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {rows.length} ligne(s). {duerpMention()} Le PDF et l'Excel reprennent ces colonnes.
            {directorName ? ` L'envoi pour signature est destiné à ${directorName}.` : " L'envoi pour signature notifie le directeur désigné."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={downloadPdf} className="h-11 rounded-xl border-slate-300">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button type="button" variant="outline" onClick={downloadExcel} className="h-11 rounded-xl border-slate-300">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button type="button" onClick={createDocument} className="h-11 rounded-xl bg-violet-700 text-white hover:bg-violet-800">
            <Save className="mr-2 h-4 w-4" />
            Créer le document
          </Button>
          {canSendForSignature ? (
            <Button type="button" onClick={sendForSignature} className="h-11 rounded-xl bg-indigo-950 text-white hover:bg-indigo-900">
              <Send className="mr-2 h-4 w-4" />
              Envoyer pour signature
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[2200px] text-left text-xs">
          <thead className="bg-violet-50 text-violet-950">
            <tr>
              {DUERP_TABLE_COLUMNS.map((column) => (
                <th key={column} className="whitespace-nowrap px-2 py-2 font-semibold">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row["N° risque"]}-${index}`} className="border-t border-slate-100">
                {DUERP_TABLE_COLUMNS.map((column) => (
                  <td key={column} className="max-w-[220px] px-2 py-2 align-top text-slate-800">
                    <span className="line-clamp-3">{row[column]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duerp-comment" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <MessageSquare className="h-4 w-4 text-violet-500" />
          Commentaire pour le directeur
        </Label>
        <Textarea
          id="duerp-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-[88px] rounded-xl border-violet-200 px-3 py-2.5"
          placeholder="Observation transmise avec la version, par exemple les changements à regarder"
        />
      </div>

      <div className="border-t border-violet-100 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="h-11 rounded-xl border-violet-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    </div>
  );
}
