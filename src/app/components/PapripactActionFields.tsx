import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { Action } from "@/app/types/action";

const STATUSES: Action["status"][] = ["À faire", "En cours", "Terminée", "En retard"];
const PRIORITIES: Action["priority"][] = ["Haute", "Moyenne", "Faible"];

const STATUS_BADGE: Record<Action["status"], string> = {
  "À faire": "bg-gray-100 text-gray-800",
  "En cours": "bg-blue-100 text-blue-800",
  Terminée: "bg-green-100 text-green-800",
  "En retard": "bg-red-100 text-red-800",
};

const PRIORITY_BADGE: Record<Action["priority"], string> = {
  Haute: "bg-gradient-to-r from-red-500 to-rose-500 text-white",
  Moyenne: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
  Faible: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
};

export function papripactUnitsLabel(action: {
  papripactUnits?: string;
  services?: string[];
}): string {
  if (action.papripactUnits !== undefined) return action.papripactUnits;
  if ((action.services?.length ?? 0) > 0) return action.services!.join(" - ");
  return "Tous les services";
}

export function servicesFromPapripactUnits(units: string): string[] {
  const trimmed = units.trim();
  const normalized = trimmed.toLowerCase();
  if (!trimmed || normalized === "tous les services" || normalized === "na") return [];
  return trimmed
    .split(/[-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function PapripactYearField({
  year,
  onChange,
}: {
  year: number | null;
  onChange: (year: number | null) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="papripact-year">Année du PAPRIPACT</Label>
      <Select
        value={year ? String(year) : "none"}
        onValueChange={(value) => onChange(value === "none" ? null : Number(value))}
      >
        <SelectTrigger id="papripact-year" className="bg-white">
          <SelectValue placeholder="Hors PAPRIPACT" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Hors PAPRIPACT</SelectItem>
          <SelectItem value="2026">PAPRIPACT 2026</SelectItem>
          <SelectItem value="2027">PAPRIPACT 2027</SelectItem>
          <SelectItem value="2028">PAPRIPACT 2028</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

const fieldClass = "bg-white";

export function PapripactActionFields({
  value,
  onChange,
}: {
  value: Pick<
    Action,
    | "description"
    | "riskTitle"
    | "responsable"
    | "deadline"
    | "status"
    | "priority"
    | "papripactUnits"
    | "papripactIndicators"
    | "papripactComments"
    | "papripactCost"
    | "services"
  >;
  onChange: (partial: Partial<Action>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="papripact-category">Catégorie d'action / Risques *</Label>
        <Input
          id="papripact-category"
          value={value.riskTitle}
          onChange={(event) => onChange({ riskTitle: event.target.value, riskId: "" })}
          placeholder="Ex. : Actions transversales"
          className={fieldClass}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="papripact-units">Unités concernées *</Label>
        <Input
          id="papripact-units"
          value={papripactUnitsLabel(value)}
          onChange={(event) =>
            onChange({
              papripactUnits: event.target.value,
              services: servicesFromPapripactUnits(event.target.value),
            })
          }
          placeholder="Ex. : Tous les services, ou SPB - CROSS"
          className={fieldClass}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="papripact-action">
          Actions de prévention à mettre en place *
        </Label>
        <Textarea
          id="papripact-action"
          value={value.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Mesure organisationnelle, collective ou individuelle"
          className={`${fieldClass} min-h-32`}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="papripact-owner">Responsable(s) de l'action *</Label>
          <Input
            id="papripact-owner"
            value={value.responsable}
            onChange={(event) => onChange({ responsable: event.target.value })}
            placeholder="Ex. : CP, SG"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="papripact-deadline">Échéance *</Label>
          <Input
            id="papripact-deadline"
            type="date"
            value={value.deadline}
            onChange={(event) => onChange({ deadline: event.target.value })}
            className={fieldClass}
            required
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-800">
          Badges affichés sur la fiche
        </legend>
        <div className="flex flex-wrap gap-2" aria-hidden="true">
          <Badge className="border-0 bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
            PAPRIPACT
          </Badge>
          <Badge className={`border-0 ${STATUS_BADGE[value.status]}`}>{value.status}</Badge>
          <Badge className={`border-0 ${PRIORITY_BADGE[value.priority]}`}>
            Priorité {value.priority}
          </Badge>
        </div>
        <div className="space-y-2">
          <Label id="papripact-status-label">Statut</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="papripact-status-label">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={value.status === status}
                onClick={() => onChange({ status })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${STATUS_BADGE[status]} ${
                  value.status === status ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-70"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label id="papripact-priority-label">Priorité</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="papripact-priority-label">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                type="button"
                aria-pressed={value.priority === priority}
                onClick={() => onChange({ priority })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${PRIORITY_BADGE[priority]} ${
                  value.priority === priority ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-70"
                }`}
              >
                Priorité {priority}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="papripact-indicators">Indicateurs</Label>
        <Textarea
          id="papripact-indicators"
          value={value.papripactIndicators ?? ""}
          onChange={(event) => onChange({ papripactIndicators: event.target.value })}
          placeholder="Ex. : 100 % des sites prioritaires contrôlés"
          className={`${fieldClass} min-h-20`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="papripact-comments">Commentaires</Label>
        <Textarea
          id="papripact-comments"
          value={value.papripactComments ?? ""}
          onChange={(event) => onChange({ papripactComments: event.target.value })}
          className={`${fieldClass} min-h-20`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="papripact-cost">Coût de la mesure</Label>
        <Input
          id="papripact-cost"
          value={value.papripactCost ?? ""}
          onChange={(event) => onChange({ papripactCost: event.target.value })}
          placeholder="Montant ou précision libre"
          className={fieldClass}
        />
      </div>
    </div>
  );
}

export function papripactPayload<T extends Partial<Action>>(form: T): T {
  const description = (form.description ?? "").trim();
  const units = papripactUnitsLabel(form);
  return {
    ...form,
    riskId: "",
    riskTitle: (form.riskTitle ?? "").trim(),
    description,
    title: description.split("\n")[0].trim().slice(0, 140),
    papripactUnits: units,
    services: servicesFromPapripactUnits(units),
    papripactIndicators: (form.papripactIndicators ?? "").trim(),
    papripactComments: (form.papripactComments ?? "").trim(),
    papripactCost: (form.papripactCost ?? "").trim(),
    site: "",
    budget: undefined,
  };
}
