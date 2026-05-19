import React, { useState } from "react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { PlusCircle, Trash2, Stethoscope, Bandage, ClipboardList } from "lucide-react";

const DEFAULT_LESION_SITE_OPTIONS = [
  "Tête",
  "Cou",
  "Dos",
  "Membre supérieur",
  "Membre inférieur",
  "Main",
  "Pied",
  "Yeux",
  "Voies respiratoires",
];
const DEFAULT_LESION_NATURE_OPTIONS = [
  "Contusion",
  "Coupure",
  "Brûlure",
  "Fracture",
  "Entorse",
  "Irritation",
  "Lombalgie",
  "Plaie",
  "Traumatisme",
];
const DEFAULT_CORRECTIVE_ACTION_OPTIONS = [
  "Mise à jour consigne sécurité",
  "Formation complémentaire",
  "Ajout EPI",
  "Balisage de zone",
  "Maintenance corrective",
  "Contrôle périodique renforcé",
];

const fieldInputClass =
  "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-red-400";
const selectTriggerClass =
  "flex-1 bg-white border-slate-300 text-slate-900 data-[placeholder]:text-slate-500";

export interface AccidentLesionsValues {
  lesionSites: string[];
  lesionNatures: string[];
  correctiveActions: string[];
}

interface AccidentLesionsFieldsProps {
  value: AccidentLesionsValues;
  onChange: (patch: Partial<AccidentLesionsValues>) => void;
}

function addOption(
  value: string,
  options: string[],
  setOptions: React.Dispatch<React.SetStateAction<string[]>>,
  reset: () => void,
) {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (!options.includes(trimmed)) setOptions((prev) => [...prev, trimmed]);
  reset();
}

export function AccidentLesionsFields({ value, onChange }: AccidentLesionsFieldsProps) {
  const [lesionSiteOptions, setLesionSiteOptions] = useState(DEFAULT_LESION_SITE_OPTIONS);
  const [lesionNatureOptions, setLesionNatureOptions] = useState(DEFAULT_LESION_NATURE_OPTIONS);
  const [correctiveActionOptions, setCorrectiveActionOptions] = useState(
    DEFAULT_CORRECTIVE_ACTION_OPTIONS,
  );
  const [newLesionSiteOption, setNewLesionSiteOption] = useState("");
  const [newLesionNatureOption, setNewLesionNatureOption] = useState("");
  const [newCorrectiveActionOption, setNewCorrectiveActionOption] = useState("");

  return (
    <section
      className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-5"
      aria-labelledby="accident-lesions-heading"
    >
      <h3
        id="accident-lesions-heading"
        className="font-bold text-lg text-red-900 flex items-center gap-2"
      >
        <Stethoscope className="h-5 w-5 text-red-700 shrink-0" aria-hidden />
        Lésions et actions correctives
      </h3>

      <div className="space-y-3">
        <Label className="text-sm font-bold text-red-950 flex items-center gap-2">
          <Bandage className="h-4 w-4 text-red-700" aria-hidden />
          Siège(s) de lésion
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <Input
            value={newLesionSiteOption}
            onChange={(e) => setNewLesionSiteOption(e.target.value)}
            placeholder="Ajouter un siège de lésion"
            className={fieldInputClass}
          />
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            onClick={() =>
              addOption(newLesionSiteOption, lesionSiteOptions, setLesionSiteOptions, () =>
                setNewLesionSiteOption(""),
              )
            }
          >
            Ajouter à la liste
          </Button>
        </div>
        {value.lesionSites.map((siteValue, idx) => (
          <div key={`lesion-site-${idx}`} className="flex gap-2">
            <Select
              value={siteValue}
              onValueChange={(selected) =>
                onChange({
                  lesionSites: value.lesionSites.map((item, i) => (i === idx ? selected : item)),
                })
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Sélectionner un siège de lésion" />
              </SelectTrigger>
              <SelectContent>
                {lesionSiteOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              className="text-red-700 hover:text-red-900 hover:bg-red-100"
              onClick={() =>
                onChange({ lesionSites: value.lesionSites.filter((_, i) => i !== idx) })
              }
              aria-label={`Retirer le siège de lésion ${idx + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-red-300 bg-white text-red-900 hover:bg-red-50"
          onClick={() =>
            onChange({
              lesionSites: [...value.lesionSites, lesionSiteOptions[0] || ""],
            })
          }
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Ajouter un siège
        </Button>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-bold text-red-950 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-red-700" aria-hidden />
          Nature(s) de lésion
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <Input
            value={newLesionNatureOption}
            onChange={(e) => setNewLesionNatureOption(e.target.value)}
            placeholder="Ajouter une nature de lésion"
            className={fieldInputClass}
          />
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            onClick={() =>
              addOption(
                newLesionNatureOption,
                lesionNatureOptions,
                setLesionNatureOptions,
                () => setNewLesionNatureOption(""),
              )
            }
          >
            Ajouter à la liste
          </Button>
        </div>
        {value.lesionNatures.map((natureValue, idx) => (
          <div key={`lesion-nature-${idx}`} className="flex gap-2">
            <Select
              value={natureValue}
              onValueChange={(selected) =>
                onChange({
                  lesionNatures: value.lesionNatures.map((item, i) =>
                    i === idx ? selected : item,
                  ),
                })
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Sélectionner une nature de lésion" />
              </SelectTrigger>
              <SelectContent>
                {lesionNatureOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              className="text-red-700 hover:text-red-900 hover:bg-red-100"
              onClick={() =>
                onChange({ lesionNatures: value.lesionNatures.filter((_, i) => i !== idx) })
              }
              aria-label={`Retirer la nature de lésion ${idx + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-red-300 bg-white text-red-900 hover:bg-red-50"
          onClick={() =>
            onChange({
              lesionNatures: [...value.lesionNatures, lesionNatureOptions[0] || ""],
            })
          }
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Ajouter une nature
        </Button>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-bold text-red-950 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-red-700" aria-hidden />
          Action(s) corrective(s)
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <Input
            value={newCorrectiveActionOption}
            onChange={(e) => setNewCorrectiveActionOption(e.target.value)}
            placeholder="Ajouter une action corrective"
            className={fieldInputClass}
          />
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            onClick={() =>
              addOption(
                newCorrectiveActionOption,
                correctiveActionOptions,
                setCorrectiveActionOptions,
                () => setNewCorrectiveActionOption(""),
              )
            }
          >
            Ajouter à la liste
          </Button>
        </div>
        {value.correctiveActions.map((actionValue, idx) => (
          <div key={`corrective-action-${idx}`} className="flex gap-2">
            <Select
              value={actionValue}
              onValueChange={(selected) =>
                onChange({
                  correctiveActions: value.correctiveActions.map((item, i) =>
                    i === idx ? selected : item,
                  ),
                })
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="Sélectionner une action corrective" />
              </SelectTrigger>
              <SelectContent>
                {correctiveActionOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              className="text-red-700 hover:text-red-900 hover:bg-red-100"
              onClick={() =>
                onChange({
                  correctiveActions: value.correctiveActions.filter((_, i) => i !== idx),
                })
              }
              aria-label={`Retirer l'action corrective ${idx + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-red-300 bg-white text-red-900 hover:bg-red-50"
          onClick={() =>
            onChange({
              correctiveActions: [
                ...value.correctiveActions,
                correctiveActionOptions[0] || "",
              ],
            })
          }
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Ajouter une action
        </Button>
      </div>
    </section>
  );
}
