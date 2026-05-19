import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { AlertCircle, AlertTriangle, CalendarRange, HeartPulse, Scale } from "lucide-react";
import {
  computeRegulatoryGravity,
  computeWorkStoppageDaysFromDates,
  formatStoppagePeriodFr,
  getRegulatoryGravityBadgeClass,
  REGULATORY_GRAVITY_LABELS,
  type AccidentDashboardSeverity,
  type RegulatoryGravity,
} from "@/app/utils/accidentRegulatoryGravity";

const fieldClass = "bg-white border-slate-300 text-slate-900";

export interface AccidentFormSidebarState {
  severity: AccidentDashboardSeverity;
  hasWorkStoppage: boolean;
  workStoppageStartDate: string;
  workStoppageEndDate: string;
  hasReturnToWorkMedicalConditions: boolean;
  returnToWorkMedicalConditions: string;
}

interface AccidentFormSidebarProps {
  formData: AccidentFormSidebarState;
  onChange: (patch: Partial<AccidentFormSidebarState>) => void;
  isEdit?: boolean;
}

function getSeverityGradient(severity: string) {
  switch (severity) {
    case "très_grave":
      return "from-red-500 to-rose-600";
    case "grave":
      return "from-orange-500 to-red-500";
    case "modéré":
      return "from-yellow-400 to-orange-400";
    default:
      return "from-green-400 to-emerald-500";
  }
}

function getSeverityLabel(severity: AccidentDashboardSeverity) {
  switch (severity) {
    case "bénin":
      return "Bénin";
    case "modéré":
      return "Modéré";
    case "grave":
      return "Grave";
    default:
      return "Très grave";
  }
}

export function AccidentFormSidebar({ formData, onChange, isEdit }: AccidentFormSidebarProps) {
  const computedDays = useMemo(
    () =>
      formData.hasWorkStoppage
        ? computeWorkStoppageDaysFromDates(
            formData.workStoppageStartDate,
            formData.workStoppageEndDate,
          )
        : undefined,
    [formData.hasWorkStoppage, formData.workStoppageStartDate, formData.workStoppageEndDate],
  );

  const regulatoryGravity: RegulatoryGravity = useMemo(
    () => computeRegulatoryGravity(formData.hasWorkStoppage, computedDays),
    [formData.hasWorkStoppage, computedDays],
  );

  const severityGradient = getSeverityGradient(formData.severity);
  const endBeforeStart =
    formData.hasWorkStoppage &&
    formData.workStoppageStartDate &&
    formData.workStoppageEndDate &&
    formData.workStoppageEndDate < formData.workStoppageStartDate;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur border-l-4 border-l-teal-600">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Scale className="h-5 w-5 mr-2 text-teal-600" />
            Arrêt, gravité réglementaire et reprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Arrêt de travail</Label>
            <Select
              value={formData.hasWorkStoppage ? "oui" : "non"}
              onValueChange={(v) => {
                const has = v === "oui";
                onChange({
                  hasWorkStoppage: has,
                  ...(has
                    ? {}
                    : {
                        workStoppageStartDate: "",
                        workStoppageEndDate: "",
                        hasReturnToWorkMedicalConditions: false,
                        returnToWorkMedicalConditions: "",
                      }),
                });
              }}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non">Non — pas d&apos;arrêt (G1)</SelectItem>
                <SelectItem value="oui">Oui — avec arrêt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.hasWorkStoppage && (
            <div className="space-y-4 rounded-lg border border-teal-200 bg-white/90 p-4">
              <p className="text-xs font-semibold text-teal-900 flex items-center gap-2">
                <CalendarRange className="h-4 w-4" aria-hidden />
                Période d&apos;arrêt
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="workStoppageStartDate">Date de début *</Label>
                  <Input
                    id="workStoppageStartDate"
                    type="date"
                    value={formData.workStoppageStartDate}
                    onChange={(e) => onChange({ workStoppageStartDate: e.target.value })}
                    className={fieldClass}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workStoppageEndDate">Date de fin</Label>
                  <Input
                    id="workStoppageEndDate"
                    type="date"
                    value={formData.workStoppageEndDate}
                    min={formData.workStoppageStartDate || undefined}
                    onChange={(e) => onChange({ workStoppageEndDate: e.target.value })}
                    className={endBeforeStart ? "border-red-400 bg-white" : fieldClass}
                  />
                  <p className="text-xs text-slate-600">
                    Laissez vide si l&apos;arrêt est encore en cours (durée calculée à ce jour).
                  </p>
                  {endBeforeStart && (
                    <p className="text-xs text-red-600">
                      La date de fin doit être postérieure ou égale à la date de début.
                    </p>
                  )}
                </div>
              </div>
              {computedDays != null && !endBeforeStart && (
                <p className="text-sm text-teal-900">
                  <span className="font-semibold">Durée :</span> {computedDays} jour
                  {computedDays > 1 ? "s" : ""} calendaire{computedDays > 1 ? "s" : ""}
                  {!formData.workStoppageEndDate ? " (en cours)" : ""}
                </p>
              )}

              <div className="space-y-3 pt-2 border-t border-teal-100">
                <p className="text-xs font-semibold text-teal-900 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4" aria-hidden />
                  Reprise — médecine du travail
                </p>
                <div className="space-y-2">
                  <Label>Conditions médicales pour la reprise</Label>
                  <Select
                    value={formData.hasReturnToWorkMedicalConditions ? "oui" : "non"}
                    onValueChange={(v) =>
                      onChange({
                        hasReturnToWorkMedicalConditions: v === "oui",
                        returnToWorkMedicalConditions:
                          v === "oui" ? formData.returnToWorkMedicalConditions : "",
                      })
                    }
                  >
                    <SelectTrigger className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non">Non</SelectItem>
                      <SelectItem value="oui">
                        Oui — avis / aménagements médecine du travail
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.hasReturnToWorkMedicalConditions && (
                  <div className="space-y-2">
                    <Label htmlFor="returnToWorkMedicalConditions">
                      Précisions (restrictions, aménagements, suivi…)
                    </Label>
                    <Textarea
                      id="returnToWorkMedicalConditions"
                      value={formData.returnToWorkMedicalConditions}
                      onChange={(e) =>
                        onChange({ returnToWorkMedicalConditions: e.target.value })
                      }
                      className={`${fieldClass} min-h-[88px]`}
                      placeholder="Ex. reprise à mi-temps, interdiction de port de charges, visite de reprise programmée…"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl p-4 border-2 border-teal-200 bg-teal-50/80">
            <p className="text-xs font-semibold text-teal-900 mb-2">Classement G1–G5 (réglementaire)</p>
            <Badge className={`text-sm px-3 py-1 ${getRegulatoryGravityBadgeClass(regulatoryGravity)}`}>
              {regulatoryGravity}
            </Badge>
            <p className="text-sm text-teal-950 mt-2 font-medium">
              {REGULATORY_GRAVITY_LABELS[regulatoryGravity]}
            </p>
            {formData.hasWorkStoppage && (
              <p className="text-xs text-teal-800 mt-2">
                {formatStoppagePeriodFr(
                  true,
                  formData.workStoppageStartDate,
                  formData.workStoppageEndDate,
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Gravité (tableau de bord)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Niveau interne pour les statistiques — choix manuel, indépendant du G1–G5.
          </p>
          <Select
            value={formData.severity}
            onValueChange={(value) =>
              onChange({ severity: value as AccidentDashboardSeverity })
            }
          >
            <SelectTrigger className={fieldClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bénin">Bénin</SelectItem>
              <SelectItem value="modéré">Modéré</SelectItem>
              <SelectItem value="grave">Grave</SelectItem>
              <SelectItem value="très_grave">Très grave</SelectItem>
            </SelectContent>
          </Select>
          <div
            className={`text-center p-4 rounded-xl bg-gradient-to-br ${severityGradient} border-2`}
          >
            <p className="text-white text-xs font-semibold mb-1">Niveau sélectionné</p>
            <p className="text-white font-bold text-2xl">{getSeverityLabel(formData.severity)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-bold mb-2">
                {isEdit ? "Modification" : "Déclaration"} d&apos;accident
              </p>
              <ul className="space-y-1 text-blue-800 text-xs">
                <li>• Dates d&apos;arrêt pour le classement G1–G5</li>
                <li>• Conditions de reprise si médecine du travail concernée</li>
                <li>• Gravité dashboard pour les indicateurs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function isAccidentStoppageFormValid(state: AccidentFormSidebarState): string | null {
  if (!state.hasWorkStoppage) return null;
  if (!state.workStoppageStartDate.trim()) {
    return "Indiquez la date de début d'arrêt de travail.";
  }
  if (
    state.workStoppageEndDate &&
    state.workStoppageStartDate &&
    state.workStoppageEndDate < state.workStoppageStartDate
  ) {
    return "La date de fin d'arrêt doit être postérieure ou égale à la date de début.";
  }
  const days = computeWorkStoppageDaysFromDates(
    state.workStoppageStartDate,
    state.workStoppageEndDate,
  );
  if (days == null || days < 1) {
    return "Impossible de calculer la durée d'arrêt à partir des dates saisies.";
  }
  if (
    state.hasReturnToWorkMedicalConditions &&
    !state.returnToWorkMedicalConditions.trim()
  ) {
    return "Précisez les conditions médicales de reprise (médecine du travail).";
  }
  return null;
}

