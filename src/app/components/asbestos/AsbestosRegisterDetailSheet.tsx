import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/app/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Paperclip, Pencil, Save, X } from "lucide-react";
import type { AsbestosRegisterRow } from "@/app/types/importedRegisters";
import {
  kindLabel,
  registerRowScore,
  registerRowTitle,
  scoreTone,
} from "@/app/utils/asbestosDisplayUtils";

type FieldDef = {
  key: keyof AsbestosRegisterRow;
  label: string;
  multiline?: boolean;
};

const FIELDS_BY_KIND: Record<AsbestosRegisterRow["kind"], FieldDef[]> = {
  synthese: [
    { key: "materiau", label: "Matériau / produit" },
    { key: "localisation", label: "Localisation", multiline: true },
    { key: "description", label: "Description / remarques", multiline: true },
    { key: "score", label: "Niveau (EP / AC…)" },
  ],
  controle: [
    { key: "dateControle", label: "Date du contrôle" },
    { key: "typeControle", label: "Type de contrôle", multiline: true },
    { key: "lieuZone", label: "Périmètre visité", multiline: true },
    { key: "zoneRetrait", label: "Zones / retraits concernés", multiline: true },
    { key: "zonesPresence", label: "Présence amiante (MCA)", multiline: true },
    { key: "zonesNonAmiantees", label: "Zones non amiantées", multiline: true },
    { key: "score", label: "Scores / état de conservation", multiline: true },
    { key: "action", label: "Actions à mener", multiline: true },
    { key: "prochaineEcheance", label: "Prochaine échéance" },
  ],
  materiau: [
    { key: "zoneMateriau", label: "Matériau / zone (ZPSO)" },
    { key: "localisation", label: "Localisation précise", multiline: true },
    { key: "datePremierReperage", label: "Premier repérage" },
    { key: "typeAnalyse", label: "Type d'analyse / diagnostic", multiline: true },
    { key: "dernierControle", label: "Dernier contrôle" },
    { key: "scoreActuel", label: "Score actuel (EP / AC1…)" },
    { key: "statutMateriau", label: "Statut réglementaire (liste A/B…)" },
    { key: "actionsRealisees", label: "Actions déjà réalisées", multiline: true },
    { key: "retraitRealise", label: "Retrait réalisé" },
    { key: "actionAPrevoir", label: "Action à prévoir", multiline: true },
  ],
  historique: [
    { key: "rawCol1", label: "Événement" },
    { key: "rawCol2", label: "Détail", multiline: true },
    { key: "rawCol3", label: "Complément", multiline: true },
  ],
};

interface AsbestosRegisterDetailSheetProps {
  row: AsbestosRegisterRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (row: AsbestosRegisterRow) => void;
  onManageAttachments: () => void;
  attachmentCount: number;
}

export function AsbestosRegisterDetailSheet({
  row,
  open,
  onOpenChange,
  onSave,
  onManageAttachments,
  attachmentCount,
}: AsbestosRegisterDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AsbestosRegisterRow | null>(null);

  useEffect(() => {
    if (row) {
      setDraft({ ...row });
      setEditing(false);
    }
  }, [row]);

  if (!row || !draft) return null;

  const fields = FIELDS_BY_KIND[row.kind] ?? FIELDS_BY_KIND.materiau;
  const score = scoreTone(registerRowScore(draft));

  const patch = (key: keyof AsbestosRegisterRow, value: string) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto border-l-2 border-indigo-100"
      >
        <SheetHeader className="space-y-3 pb-4 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {kindLabel(row.kind)}
            </Badge>
            <Badge variant="outline" className={score.className}>
              {score.label}
            </Badge>
          </div>
          <SheetTitle className="text-left text-xl leading-snug pr-8">
            {registerRowTitle(row)}
          </SheetTitle>
          <SheetDescription className="text-left">
            Fiche registre amiante — champs adaptés au type d&apos;enregistrement
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-5">
          {fields.map((field) => {
            const value = String(draft[field.key] ?? "");
            return (
              <div key={String(field.key)} className="space-y-1.5">
                <Label className="text-slate-700">{field.label}</Label>
                {editing ? (
                  field.multiline ? (
                    <Textarea
                      value={value}
                      rows={4}
                      className="bg-white border-slate-300"
                      onChange={(e) => patch(field.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={value}
                      className="bg-white border-slate-300"
                      onChange={(e) => patch(field.key, e.target.value)}
                    />
                  )
                ) : (
                  <p className="text-sm text-slate-900 whitespace-pre-wrap rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 min-h-[2.5rem]">
                    {value.trim() ? value : "—"}
                  </p>
                )}
              </div>
            );
          })}

          <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">Pièces jointes (DTA, rapports)</p>
                <p className="text-sm text-muted-foreground">
                  {attachmentCount} document{attachmentCount !== 1 ? "s" : ""} rattaché
                  {attachmentCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onManageAttachments}>
                <Paperclip className="h-4 w-4 mr-1" />
                Gérer
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          {editing ? (
            <>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button type="button" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="h-4 w-4 mr-1" />
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button type="button" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
