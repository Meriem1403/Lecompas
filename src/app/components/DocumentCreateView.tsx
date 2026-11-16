import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useLeaveGuard } from "@/app/components/leaveGuard";
import { DocumentFormFields, emptyDocumentDraft, type DocumentDraft } from "@/app/components/DocumentFormFields";
import type { Document } from "@/app/components/DocumentsView";

interface DocumentCreateViewProps {
  riskCount: number;
  onSave: (draft: DocumentDraft) => void;
  onCancel: () => void;
}

export function DocumentCreateView({ riskCount, onSave, onCancel }: DocumentCreateViewProps) {
  const requestLeave = useLeaveGuard();
  const [draft, setDraft] = useState<DocumentDraft>(emptyDocumentDraft());

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Nouveau document</h1>
        <p className="mt-1 text-sm text-slate-600">Le type DUERP peut joindre le tableau de la mise à jour des risques.</p>
      </div>
      <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
        <DocumentFormFields draft={draft} onChange={setDraft} riskCount={riskCount} fileInputId="fileUpload" />
      </section>
      <div className="flex flex-col gap-3 border-t border-violet-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={() => requestLeave(onCancel)} className="h-11 rounded-xl border-violet-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        <Button type="submit" className="h-11 rounded-xl bg-violet-700 text-white hover:bg-violet-800">
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export type { Document };
