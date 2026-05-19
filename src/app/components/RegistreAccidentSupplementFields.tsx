import React from "react";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { AccidentExtendedFields } from "@/app/components/AccidentExtendedFields";
import {
  patchRegistreFromExtended,
  registreToExtendedValues,
  type RegistreAccidentExtended,
} from "@/app/utils/registreAccidentRecord";
import type { AccidentDuerpRiskRef } from "@/app/utils/accidentRecord";
import { getLegalTypeLabel } from "@/app/utils/accidentRecord";

const fieldClass = "bg-white border-slate-300";

export type RegistreFormExtended = RegistreAccidentExtended & {
  prenomVictime: string;
  nomVictime: string;
  circonstances: string;
  lieuAccident: string;
  dateAccident: string;
  heureAccident: string;
};

interface RegistreAccidentSupplementFieldsProps {
  value: RegistreFormExtended;
  onChange: (patch: Partial<RegistreFormExtended>) => void;
  risks: AccidentDuerpRiskRef[];
  agents: Array<{ id: string; firstName: string; lastName: string }>;
  filteredAgents: Array<{ id: string; firstName: string; lastName: string }>;
}

export function RegistreAccidentSupplementFields({
  value,
  onChange,
  risks,
  agents,
  filteredAgents,
}: RegistreAccidentSupplementFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type légal</Label>
          <Select
            value={value.typeLegal || "__none__"}
            onValueChange={(v) =>
              onChange({
                typeLegal: v === "__none__" ? "" : (v as RegistreAccidentExtended["typeLegal"]),
              })
            }
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Non renseigné" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Non renseigné</SelectItem>
              <SelectItem value="travail">{getLegalTypeLabel("travail")}</SelectItem>
              <SelectItem value="trajet">{getLegalTypeLabel("trajet")}</SelectItem>
              <SelectItem value="maladie_pro">{getLegalTypeLabel("maladie_pro")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="descriptionFaits">Description des faits (résumé)</Label>
        <Textarea
          id="descriptionFaits"
          value={value.descriptionFaits}
          onChange={(e) => onChange({ descriptionFaits: e.target.value })}
          className={`${fieldClass} min-h-[80px]`}
          placeholder="Constat immédiat, résumé factuel…"
        />
      </div>
      <AccidentExtendedFields
        hideVictim
        value={registreToExtendedValues(value)}
        onChange={(patch) => onChange(patchRegistreFromExtended(patch))}
        risks={risks}
        agents={agents}
        filteredAgents={filteredAgents}
        location={value.lieuAccident}
        accidentDate={value.dateAccident}
        accidentTime={value.heureAccident}
      />
    </div>
  );
}
