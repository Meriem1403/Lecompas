import { AlertCircle, ArrowLeft, BookOpen, Building2, Calendar, CheckCircle, Clock, Edit, FileText, Loader, MapPin, Send, Shield, Tag, Trash2, User, Users } from "lucide-react";
import { ActionReturnHistory } from "@/app/components/ActionReturnHistory";
import { RiskEvaluationFacts, RiskProgress } from "@/app/components/risks/RiskEvaluationFacts";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import type { ActionReturnFixture } from "@/app/fixtures/actionReturnFixtures";
import { getRiskWorkflowStatusLabel } from "@/app/services/riskPriority";

const severityWords = ["", "Faible", "Moyen", "Élevé", "Très élevé"];
const frequencyWords = ["", "Rare", "Peu probable", "Probable", "Très probable"];
const scaleTones = ["", "bg-teal-500", "bg-sky-500", "bg-orange-500", "bg-rose-600"];

export function RiskScalePair({ severity, probability }: { severity: number; probability: number }) {
  const items = [
    { label: "Gravité", value: severity, word: severityWords[severity] || String(severity) },
    { label: "Fréquence", value: probability, word: frequencyWords[probability] || String(probability) },
  ];
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">{item.label}</p>
          <p className="mt-0.5 break-words text-sm font-bold leading-tight text-slate-900">{item.word}</p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full ${step <= item.value ? scaleTones[item.value] || "bg-slate-400" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RiskConsultationDetail({
  risk,
  riskLevelGradient,
  riskLevelLabel,
  onBack,
  onEdit,
  onDelete,
  canManage = false,
  canProposeReturn = false,
  onProposeReturn,
  actionReturns = [],
  userRole,
  onManageActionReturns,
  onLearnMore,
}: {
  risk: Risk;
  riskLevelGradient: (level: number) => string;
  riskLevelLabel: (level: number) => string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
  canProposeReturn?: boolean;
  onProposeReturn?: () => void;
  actionReturns?: ActionReturnFixture[];
  userRole?: string;
  onManageActionReturns?: () => void;
  onLearnMore?: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-white/80 shadow-xl backdrop-blur">
        <div className={`h-2 bg-gradient-to-r ${riskLevelGradient(risk.riskLevel)}`} />
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" size="sm" onClick={onBack} className="w-fit border-gray-300 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex flex-wrap gap-2">
              {canProposeReturn && onProposeReturn ? (
                <Button
                  size="sm"
                  onClick={onProposeReturn}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Retour d'action
                </Button>
              ) : null}
              {canManage ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEdit}
                    className="border-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDelete}
                    className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Supprimer
                  </Button>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className={`shrink-0 rounded-2xl bg-gradient-to-br ${riskLevelGradient(risk.riskLevel)} px-4 py-3 text-center text-white shadow-lg`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">Priorité finale</p>
              <p className="mt-1 text-3xl font-extrabold leading-none">{riskLevelLabel(risk.riskLevel)}</p>
              <p className="mt-1 text-xs opacity-90">GFM {risk.riskLevel}</p>
            </div>
            <div className="min-w-0 pt-1">
              <CardTitle className="text-2xl font-bold leading-snug">
                {risk.detachedFromReference ? (
                  <span className="text-amber-800">Lié à aucun risque</span>
                ) : (
                  risk.title
                )}
              </CardTitle>
              {onLearnMore && !risk.detachedFromReference ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLearnMore}
                  className="mt-3 h-11 rounded-xl border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                >
                  <BookOpen className="h-4 w-4" />
                  Je me renseigne sur ce risque
                </Button>
              ) : null}
            </div>
          </div>
          <RiskScalePair severity={risk.severity} probability={risk.probability} />
          <RiskEvaluationFacts
            calculPriorite={risk.calculPriorite}
            moyenMaitrise={risk.moyenMaitrise}
            riskLevel={risk.riskLevel}
            prioriteFinale={risk.prioriteFinale}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-6 text-gray-800 shadow-lg">
            <h3 className="mb-4 flex items-center text-2xl font-bold text-gray-700">
              <Building2 className="mr-3 h-6 w-6" />
              Identification du risque
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur">
                <p className="mb-1 flex items-center text-xs font-semibold text-gray-500">
                  <FileText className="mr-1 h-3 w-3" />
                  Numéro de risque
                </p>
                <p className="text-lg font-bold text-gray-800">{risk.numeroRisque}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur">
                <p className="mb-1 flex items-center text-xs font-semibold text-gray-500">
                  <User className="mr-1 h-3 w-3" />
                  Responsable
                </p>
                <p className="text-lg font-bold text-gray-800">{risk.responsable}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white/80 p-3 backdrop-blur">
                <p className="mb-1 flex items-center text-xs font-semibold text-gray-500">
                  <Users className="mr-1 h-3 w-3" />
                  Services
                </p>
                <div className="flex min-w-0 flex-wrap gap-1">
                  {(risk.service || "").split(",").map((item) => item.trim()).filter(Boolean).map((service) => (
                    <Badge key={service} variant="outline" className="h-auto max-w-full shrink whitespace-normal break-words bg-blue-50 text-left text-blue-700 border-blue-200">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white/80 p-3 backdrop-blur">
                <p className="mb-1 flex items-center text-xs font-semibold text-gray-500">
                  <Tag className="mr-1 h-3 w-3" />
                  Unité
                </p>
                <p className="break-words text-sm font-semibold text-gray-800">{risk.unite || "Aucune"}</p>
              </div>
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white/80 p-3 backdrop-blur">
                <p className="mb-1 flex items-center text-xs font-semibold text-gray-500">
                  <Building2 className="mr-1 h-3 w-3" />
                  Domaines
                </p>
                <div className="flex min-w-0 flex-wrap gap-1">
                  {(risk.domain || "").split(",").map((item) => item.trim()).filter(Boolean).map((domain) => (
                    <Badge key={domain} variant="outline" className="h-auto max-w-full shrink whitespace-normal break-words bg-orange-50 text-left text-orange-700 border-orange-200">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-gray-200 bg-white/80 p-3 backdrop-blur">
                <p className="mb-1 flex items-center text-xs font-semibold text-gray-500">
                  <MapPin className="mr-1 h-3 w-3" />
                  Lieux
                </p>
                <div className="flex min-w-0 flex-wrap gap-1">
                  {(risk.site || "").split(",").map((item) => item.trim()).filter(Boolean).map((location) => (
                    <Badge key={location} variant="outline" className="h-auto max-w-full shrink whitespace-normal break-words bg-cyan-50 text-left text-cyan-700 border-cyan-200">
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="mb-2 flex items-center text-sm font-bold text-gray-700">
              <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
              Situation dangereuse
            </h4>
            <p className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 text-gray-700">{risk.situation}</p>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 flex items-center text-sm font-bold text-gray-700">
              <Shield className="mr-2 h-4 w-4 text-red-500" />
              Dommages associés
            </h4>
            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
              <p className="text-gray-700">{risk.associatedRisk}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 flex items-center text-sm font-bold text-gray-700">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Mesures de prévention existantes
            </h4>
            <ul className="space-y-2">
              {risk.existingMeasures && risk.existingMeasures.length > 0 ? (
                risk.existingMeasures.map((measure, idx) => (
                  <li key={idx} className="flex items-start">
                    <Badge variant="outline" className="mr-2 border-green-200 bg-green-50 text-green-700">
                      {idx + 1}
                    </Badge>
                    <span className="text-gray-700">{measure}</span>
                  </li>
                ))
              ) : (
                <p className="italic text-gray-500">Aucune mesure existante définie</p>
              )}
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="mb-3 flex items-center text-sm font-bold text-gray-700">
              <Calendar className="mr-2 h-4 w-4 text-blue-500" />
              Actions planifiées
            </h4>
            <RiskProgress
              completed={risk.plannedMeasures?.filter((measure) => measure.status === "completed").length || 0}
              total={risk.plannedMeasures?.length || 0}
            />
            <div className="mt-3 space-y-3">
              {risk.plannedMeasures && risk.plannedMeasures.length > 0 ? (
                risk.plannedMeasures.map((measure, idx) => (
                  <Card
                    key={idx}
                    className={`border-2 ${measure.status === "completed" ? "border-green-300 bg-green-50" : measure.status === "in_progress" ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
                  >
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start space-x-3">
                        <Badge className={`${measure.status === "completed" ? "bg-green-500" : measure.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"} flex items-center gap-1 text-white`}>
                          {measure.status === "completed" ? (
                            <>
                              <CheckCircle className="h-3 w-3" /> Terminée
                            </>
                          ) : measure.status === "in_progress" ? (
                            <>
                              <Loader className="h-3 w-3" /> En cours
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> En attente
                            </>
                          )}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{measure.description}</p>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                            <div>
                              <span className="font-medium text-gray-500">Responsable:</span>
                              <p className="font-semibold text-gray-700">{measure.responsible}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Échéance:</span>
                              <p className="font-semibold text-gray-700">
                                {measure.deadline ? new Date(measure.deadline).toLocaleDateString("fr-FR") : "Pas de date"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="italic text-gray-500">Aucune action planifiée</p>
              )}
            </div>
          </div>

          <Separator className="my-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4">
              <p className="mb-1 text-xs font-semibold text-gray-500">Échéance</p>
              <p className="text-base font-semibold text-gray-800">
                {risk.echeance ? new Date(risk.echeance).toLocaleDateString("fr-FR") : "Non définie"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-4">
              <p className="mb-1 text-xs font-semibold text-gray-500">Statut</p>
              <p className="text-base font-semibold text-gray-800">{getRiskWorkflowStatusLabel(risk.status)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white/80 p-4">
            <p className="mb-1 text-xs font-semibold text-gray-500">Retour d'action</p>
            <p className="text-sm leading-6 text-gray-800">{risk.retourAction || "Aucun retour"}</p>
          </div>
          <Separator className="my-6" />
          {risk.observation ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-6 text-gray-800 shadow-lg">
              <h3 className="mb-3 flex items-center text-2xl font-bold text-gray-700">
                <AlertCircle className="mr-3 h-6 w-6" />
                Observation
              </h3>
              <div className="rounded-xl border border-gray-200 bg-white/80 p-5 backdrop-blur">
                <p className="text-base font-medium leading-relaxed text-gray-800">{risk.observation}</p>
              </div>
            </div>
          ) : null}

          <Separator className="my-6" />

          {canProposeReturn && onProposeReturn ? (
            <div className="flex justify-center">
              <Button
                onClick={onProposeReturn}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-white shadow-lg hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl"
              >
                <Send className="mr-2 h-5 w-5" />
                Faire un retour d'action
              </Button>
            </div>
          ) : null}

          <Separator className="my-6" />

          <ActionReturnHistory
            actionReturns={actionReturns}
            userRole={userRole}
            onManageActionReturns={onManageActionReturns}
          />
        </CardContent>
      </Card>
    </div>
  );
}
