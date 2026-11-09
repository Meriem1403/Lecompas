import React from "react";
import { Eye, MapPin, Pencil, Trash2 } from "lucide-react";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { IMPORTED_ACCIDENT_INDICATORS } from "@/app/seeds/importedSeeds";
import type { AccidentSuiviIndicateurs } from "@/app/types/importedRegisters";
import { CompactSpreadsheet } from "@/app/components/spreadsheet/CompactSpreadsheet";
import { Button } from "@/app/components/ui/button";
import { formatAccidentDateTimeFr, normalizeAccidentTime } from "@/app/utils/accidentDateTime";
import { getRegulatoryGravityBadgeClass } from "@/app/utils/accidentRegulatoryGravity";

interface AccidentSuiviPanelsProps {
  accessToken?: string;
}

export function AccidentSuiviIndicateursPanel({
  accessToken = "",
}: AccidentSuiviPanelsProps) {
  const [data] = useAppDataDocumentStore<AccidentSuiviIndicateurs>(
    APP_DATA_KEYS.accidentSuiviIndicateurs,
    accessToken,
    { seed: IMPORTED_ACCIDENT_INDICATORS },
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Indicateurs par année</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Synthèse importée depuis votre fichier Excel (complément Causalis, pas de
          reporting additionnel).
        </p>
        <CompactSpreadsheet
          rows={data.byYear}
          getRowId={(r) => String(r.year)}
          maxHeight="320px"
          columns={[
            { id: "y", header: "Année", width: "72px", cell: (r) => r.year },
            {
              id: "tot",
              header: "Nb accidents",
              cell: (r) => r.nbAccidents,
            },
            { id: "sa", header: "Sans arrêt", cell: (r) => r.sansArret },
            { id: "aa", header: "Avec arrêt", cell: (r) => r.avecArret },
          ]}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Par cause et année</h3>
        <CompactSpreadsheet
          rows={data.byCauseYear}
          getRowId={(r) => `${r.cause}-${r.year}-${r.nbAccidents}`}
          maxHeight="min(50vh, 480px)"
          columns={[
            { id: "cause", header: "Cause", cell: (r) => r.cause },
            { id: "y", header: "Année", width: "64px", cell: (r) => r.year },
            { id: "n", header: "Nb", width: "48px", cell: (r) => r.nbAccidents },
            { id: "sa", header: "Sans arrêt", width: "72px", cell: (r) => r.sansArret },
            { id: "aa", header: "Avec arrêt", width: "72px", cell: (r) => r.avecArret },
            {
              id: "j",
              header: "Jours arrêt",
              width: "88px",
              cell: (r) => r.joursArret || "—",
            },
          ]}
        />
      </div>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  travail: "Travail",
  trajet: "Trajet",
  maladie_pro: "Maladie professionnelle",
};

const SEVERITY_LABEL: Record<string, string> = {
  "bénin": "Bénin",
  "modéré": "Modéré",
  grave: "Grave",
  "très_grave": "Très grave",
};

function severityTone(severity: string): string {
  if (severity === "très_grave") return "bg-red-700 text-white";
  if (severity === "grave") return "bg-orange-600 text-white";
  if (severity === "modéré") return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
}

function asText(value: string | undefined, fallback = "Non renseigné"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export interface AccidentListItem {
  id: string;
  date: string;
  time?: string;
  createdAt?: string;
  title: string;
  location: string;
  service?: string;
  type: string;
  severity: string;
  accidentCategory?: string;
  accidentEventType?: string;
  regulatoryGravity?: string;
  hasWorkStoppage?: boolean;
  accidentCauses?: string;
  circumstances?: string;
  description?: string;
  victim?: string;
}

interface AccidentDeclaratifTableProps {
  accidents: AccidentListItem[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AccidentDeclaratifTable({
  accidents,
  onView,
  onEdit,
  onDelete,
}: AccidentDeclaratifTableProps) {
  if (accidents.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        Aucun accident ne correspond à cette liste.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {accidents.map((accident) => {
        const when = formatAccidentDateTimeFr(
          accident.date,
          accident.time ?? normalizeAccidentTime(undefined, accident.createdAt),
        );
        const gravity = accident.regulatoryGravity;
        const summary = asText(accident.circumstances || accident.description, "");
        return (
          <li
            key={accident.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{when}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityTone(accident.severity)}`}>
                    {SEVERITY_LABEL[accident.severity] || accident.severity}
                  </span>
                  {gravity ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRegulatoryGravityBadgeClass(gravity as "G1")}`}>
                      {gravity}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {TYPE_LABEL[accident.type] || accident.type}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${accident.hasWorkStoppage ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"}`}>
                    {accident.hasWorkStoppage ? "Avec arrêt" : "Sans arrêt"}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 break-words sm:text-lg">
                  {asText(accident.title, "Accident sans intitulé")}
                </h4>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="flex min-w-0 items-start gap-2 text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Lieu</dt>
                      <dd className="break-words">{asText(accident.location)}</dd>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Unité</dt>
                    <dd className="break-words text-slate-800">{asText(accident.service)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Catégorie</dt>
                    <dd className="break-words text-slate-800">{asText(accident.accidentCategory)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Événement</dt>
                    <dd className="break-words text-slate-800">{asText(accident.accidentEventType)}</dd>
                  </div>
                </dl>
                {summary ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{summary}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-44 lg:shrink-0 lg:flex-col">
                <Button
                  type="button"
                  size="sm"
                  className="h-10 w-full min-w-0 bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => onView(accident.id)}
                >
                  <Eye className="h-4 w-4" />
                  Voir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 w-full min-w-0"
                  onClick={() => onEdit(accident.id)}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 w-full min-w-0 border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => onDelete(accident.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
