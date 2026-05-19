import React, { useMemo, useState } from "react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  FileText,
  MapPin,
  Search,
  User,
} from "lucide-react";
import {
  ACCIDENT_CATEGORY_OPTIONS,
  ACCIDENT_EVENT_TYPE_OPTIONS,
  type AccidentDuerpRiskRef,
  buildVictimFullName,
} from "@/app/utils/accidentRecord";

const fieldClass = "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500";

export interface AccidentExtendedValues {
  accidentCategory: string;
  accidentEventType: string;
  victimFirstName: string;
  victimLastName: string;
  circumstances: string;
  accidentCauses: string;
  causeAnalysis: string;
  comments: string;
  duerpRiskId: string;
  duerpRiskFreeText: string;
}

interface AccidentExtendedFieldsProps {
  value: AccidentExtendedValues;
  onChange: (patch: Partial<AccidentExtendedValues>) => void;
  risks: AccidentDuerpRiskRef[];
  agents: Array<{ id: string; firstName: string; lastName: string }>;
  filteredAgents: Array<{ id: string; firstName: string; lastName: string }>;
  location: string;
  accidentDate: string;
  accidentTime: string;
  hideVictim?: boolean;
}

function addCustomOption(options: string[], value: string): string[] {
  const t = value.trim();
  if (!t || options.includes(t)) return options;
  return [...options, t];
}

export function AccidentExtendedFields({
  value,
  onChange,
  risks,
  agents,
  filteredAgents,
  location,
  accidentDate,
  accidentTime,
  hideVictim = false,
}: AccidentExtendedFieldsProps) {
  const [categoryOptions, setCategoryOptions] = useState(ACCIDENT_CATEGORY_OPTIONS);
  const [eventTypeOptions, setEventTypeOptions] = useState(ACCIDENT_EVENT_TYPE_OPTIONS);
  const [newCategory, setNewCategory] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [duerpSearch, setDuerpSearch] = useState("");

  const agentList = filteredAgents.length > 0 ? filteredAgents : agents;
  const victimFullName = buildVictimFullName(value.victimFirstName, value.victimLastName);

  const filteredRisks = useMemo(() => {
    const q = duerpSearch.trim().toLowerCase();
    if (!q) return risks.slice(0, 40);
    return risks
      .filter(
        (r) =>
          r.numeroRisque.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [risks, duerpSearch]);

  const selectedRisk = value.duerpRiskId
    ? risks.find((r) => r.id === value.duerpRiskId)
    : undefined;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
        <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-indigo-700" aria-hidden />
          Catégorie et type d&apos;accident
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Catégorie de l&apos;accident</Label>
            <Select
              value={value.accidentCategory || "__none__"}
              onValueChange={(v) =>
                onChange({ accidentCategory: v === "__none__" ? "" : v })
              }
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Non renseigné</SelectItem>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Autre catégorie"
                className={fieldClass}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 bg-white"
                onClick={() => {
                  if (!newCategory.trim()) return;
                  setCategoryOptions((prev) => addCustomOption(prev, newCategory));
                  onChange({ accidentCategory: newCategory.trim() });
                  setNewCategory("");
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type d&apos;accident (nature)</Label>
            <Select
              value={value.accidentEventType || "__none__"}
              onValueChange={(v) =>
                onChange({ accidentEventType: v === "__none__" ? "" : v })
              }
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue placeholder="Ex. Chute, Heurt…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Non renseigné</SelectItem>
                {eventTypeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                placeholder="Autre type"
                className={fieldClass}
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 bg-white"
                onClick={() => {
                  if (!newEventType.trim()) return;
                  setEventTypeOptions((prev) => addCustomOption(prev, newEventType));
                  onChange({ accidentEventType: newEventType.trim() });
                  setNewEventType("");
                }}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {!hideVictim && (
      <section className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-4">
        <h3 className="font-bold text-purple-950 flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-purple-700" aria-hidden />
          Victime
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="victimFirstName">Prénom</Label>
            <Input
              id="victimFirstName"
              value={value.victimFirstName}
              onChange={(e) => onChange({ victimFirstName: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="victimLastName">Nom</Label>
            <Input
              id="victimLastName"
              value={value.victimLastName}
              onChange={(e) => onChange({ victimLastName: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Sélection rapide (annuaire agents)</Label>
          <Select
            value={victimFullName || "__none__"}
            onValueChange={(fullName) => {
              if (fullName === "__none__") return;
              const agent = agentList.find(
                (a) => `${a.firstName} ${a.lastName}` === fullName,
              );
              if (agent) {
                onChange({
                  victimFirstName: agent.firstName,
                  victimLastName: agent.lastName,
                });
              }
            }}
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue placeholder="Choisir un agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Saisie manuelle ci-dessus</SelectItem>
              {agentList.map((agent) => {
                const fullName = `${agent.firstName} ${agent.lastName}`;
                return (
                  <SelectItem key={agent.id} value={fullName}>
                    {fullName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </section>
      )}

      <section className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-4">
        <h3 className="font-bold text-orange-950 flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-orange-700" aria-hidden />
          Circonstances
        </h3>
        <p className="text-xs text-orange-900">
          Lieu enregistré : <span className="font-semibold">{location || "—"}</span> · Date :{" "}
          <span className="font-semibold">{accidentDate || "—"}</span> · Heure :{" "}
          <span className="font-semibold">{accidentTime || "—"}</span>
        </p>
        <div className="space-y-2">
          <Label htmlFor="circumstances">Lieu, déroulement, explications</Label>
          <Textarea
            id="circumstances"
            value={value.circumstances}
            onChange={(e) => onChange({ circumstances: e.target.value })}
            className={`${fieldClass} min-h-[100px]`}
            placeholder="Décrivez le contexte : activité en cours, conditions, témoins, environnement…"
          />
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
        <h3 className="font-bold text-amber-950 flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden />
          Causes et analyse
        </h3>
        <div className="space-y-2">
          <Label htmlFor="accidentCauses">Causes de l&apos;accident</Label>
          <Textarea
            id="accidentCauses"
            value={value.accidentCauses}
            onChange={(e) => onChange({ accidentCauses: e.target.value })}
            className={`${fieldClass} min-h-[88px]`}
            placeholder="Causes immédiates et contributives identifiées…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="causeAnalysis">Analyse des causes</Label>
          <Textarea
            id="causeAnalysis"
            value={value.causeAnalysis}
            onChange={(e) => onChange({ causeAnalysis: e.target.value })}
            className={`${fieldClass} min-h-[88px]`}
            placeholder="Analyse (QQOQCCP, arbre des causes, retour d'expérience…)…"
          />
        </div>
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4">
        <h3 className="font-bold text-blue-950 flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-blue-700" aria-hidden />
          Risque identifié dans le DUERP
        </h3>
        <div className="space-y-2">
          <Label htmlFor="duerpSearch">Rechercher un risque</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="duerpSearch"
              value={duerpSearch}
              onChange={(e) => setDuerpSearch(e.target.value)}
              className={`${fieldClass} pl-9`}
              placeholder="N° ou intitulé du risque"
            />
          </div>
        </div>
        <Select
          value={value.duerpRiskId || "__none__"}
          onValueChange={(v) => {
            if (v === "__none__") {
              onChange({ duerpRiskId: "" });
              return;
            }
            const risk = risks.find((r) => r.id === v);
            onChange({
              duerpRiskId: v,
              duerpRiskFreeText: risk ? "" : value.duerpRiskFreeText,
            });
          }}
        >
          <SelectTrigger className={fieldClass}>
            <SelectValue placeholder="Lier un risque du DUERP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Aucun / hors référentiel</SelectItem>
            {filteredRisks.map((risk) => (
              <SelectItem key={risk.id} value={risk.id}>
                {risk.numeroRisque} — {risk.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRisk && (
          <p className="text-sm text-blue-900 bg-white/80 rounded-lg p-2 border border-blue-100">
            <span className="font-semibold">{selectedRisk.numeroRisque}</span> —{" "}
            {selectedRisk.title}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="duerpRiskFreeText">Risque non référencé (mention libre)</Label>
          <Input
            id="duerpRiskFreeText"
            value={value.duerpRiskFreeText}
            onChange={(e) =>
              onChange({
                duerpRiskFreeText: e.target.value,
                duerpRiskId: e.target.value.trim() ? "" : value.duerpRiskId,
              })
            }
            className={fieldClass}
            placeholder="Si le risque n'est pas dans le DUERP"
            disabled={Boolean(value.duerpRiskId)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-slate-600" aria-hidden />
          Commentaires
        </h3>
        <Textarea
          id="comments"
          value={value.comments}
          onChange={(e) => onChange({ comments: e.target.value })}
          className={`${fieldClass} min-h-[80px]`}
          placeholder="Observations complémentaires, suivi, échanges avec la médecine du travail…"
        />
      </section>

      <Separator />
    </div>
  );
}
