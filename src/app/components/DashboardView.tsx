import { useEffect, useState } from "react";
import { getPriorityBandFromGfm } from "@/app/services/riskPriority";
import {
  APP_DATA_KEYS,
  fetchAppData,
  isSmokePayload,
  type AppDataKey,
} from "@/app/services/appDataApi";
import { isBackendApiEnabled } from "@/app/config/dataBackend";
import { isApiAccessToken } from "@/lib/apiClient";
import type { Action } from "@/app/types/action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { DeadlineAlertsCard } from "./DeadlineAlertsCard";
import {
  Shield,
  AlertCircle,
  Activity,
  AlertTriangle,
  Calendar,
  User,
  ChevronRight,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  Stethoscope,
  Bus,
  ClipboardList,
  Users,
  FileText,
  Droplets,
  CalendarClock,
  FileWarning,
  Brain,
  FolderOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface Risk {
  id: string;
  title: string;
  service: string;
  situation: string;
  category: string;
  riskLevel: number;
  plannedMeasures?: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: "pending" | "in_progress" | "completed";
  }>;
  status: "a_traiter" | "en_traitement" | "maitrise" | "supprime";
  createdAt: string;
}

interface Accident {
  id: string;
  date: string;
  title: string;
  severity: "bénin" | "modéré" | "grave" | "très_grave";
  victim: string;
}

interface DashboardViewProps {
  risks: Risk[];
  accidents: Accident[];
  actions: Action[];
  teamSize: number;
  awarenessCount: number;
  securitySheetCount: number;
  pendingReturns: number;
  accessToken?: string;
  onNavigateToRisk: (risk: { id: string }) => void;
  onOpenModule: (viewId: string) => void;
  getRiskLevelColor: (level: number) => string;
  getRiskLevelLabel: (level: number) => string;
}

const CATEGORY_LABELS: Record<string, string> = {
  chimique: "Chimique",
  électrique: "Électrique",
  electrique: "Électrique",
  incendie: "Incendie",
  mécanique: "Mécanique",
  mecanique: "Mécanique",
  ergonomique: "Ergonomique",
  psychosocial: "Psychosocial",
  physique: "Physique",
  routier: "Routier",
  biologique: "Biologique",
  noyade: "Noyade",
  asphyxie: "Asphyxie",
  risque: "Autres",
};

const WORKFLOW_LABELS: Record<Risk["status"], string> = {
  a_traiter: "À traiter",
  en_traitement: "En traitement",
  maitrise: "Maîtrisé",
  supprime: "Supprimé",
};

const EXTRA_COUNTS: Array<{ viewId: string; key: AppDataKey }> = [
  { viewId: "medical-visits", key: APP_DATA_KEYS.medicalVisits },
  { viewId: "asbestos", key: APP_DATA_KEYS.asbestosSuiviRegister },
  { viewId: "transport-coverage", key: APP_DATA_KEYS.transportCoverageRequests },
  { viewId: "mercury", key: APP_DATA_KEYS.mercuryCampaigns },
  { viewId: "arrivees-departs", key: APP_DATA_KEYS.rhArriveesDepartsDemandes },
  { viewId: "reservations", key: APP_DATA_KEYS.resourceReservations },
  { viewId: "prevention-plan", key: APP_DATA_KEYS.preventionPlans },
  { viewId: "safety-protocols", key: APP_DATA_KEYS.safetyProtocols },
];

function formatCategory(category: string) {
  const key = String(category || "").trim().toLowerCase();
  if (!key) return "Non renseignée";
  return (
    CATEGORY_LABELS[key] ??
    key.charAt(0).toUpperCase() + key.slice(1)
  );
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countRecords(value: unknown) {
  if (value == null || isSmokePayload(value)) return null;
  return Array.isArray(value) ? value.length : null;
}

function lastMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return {
      label: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      year: date.getFullYear(),
      month: date.getMonth(),
    };
  });
}

const chartTooltip = {
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
};

export function DashboardView({
  risks,
  accidents,
  actions,
  teamSize,
  awarenessCount,
  securitySheetCount,
  pendingReturns,
  accessToken = "",
  onNavigateToRisk,
  onOpenModule,
  getRiskLevelColor,
  getRiskLevelLabel,
}: DashboardViewProps) {
  const [extraCounts, setExtraCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!isBackendApiEnabled() || !accessToken || !isApiAccessToken(accessToken)) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        EXTRA_COUNTS.map(async (item) => {
          try {
            const value = await fetchAppData<unknown>(item.key, accessToken);
            return [item.viewId, countRecords(value)] as const;
          } catch {
            return [item.viewId, null] as const;
          }
        }),
      );
      if (!cancelled) setExtraCounts(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const priorityCounts = { P1: 0, P2: 0, P3: 0 };
  const workflowCounts: Record<Risk["status"], number> = {
    a_traiter: 0,
    en_traitement: 0,
    maitrise: 0,
    supprime: 0,
  };
  const categoryCounts = new Map<string, number>();
  const serviceCounts = new Map<string, number>();

  risks.forEach((risk) => {
    priorityCounts[getPriorityBandFromGfm(Number(risk.riskLevel) || 0)] += 1;
    if (workflowCounts[risk.status] != null) workflowCounts[risk.status] += 1;
    const category = formatCategory(risk.category);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    const service = String(risk.service || "").trim();
    if (service) serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
  });

  const now = new Date();
  const accidentsThisMonth = accidents.filter((accident) => {
    const date = parseDate(accident.date);
    return date?.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
  const accidentsThisYear = accidents.filter((accident) => {
    const date = parseDate(accident.date);
    return date?.getFullYear() === now.getFullYear();
  }).length;

  const openActions = actions.filter((action) => action.status !== "Terminée");
  const overdueActions = actions.filter((action) => {
    if (action.status === "Terminée") return false;
    if (action.status === "En retard") return true;
    const deadline = parseDate(action.deadline);
    return deadline != null && deadline.getTime() < now.getTime();
  });

  const months = lastMonths(6);
  const monthlyData = months.map((month) => ({
    mois: month.label,
    risques: risks.filter((risk) => {
      const date = parseDate(risk.createdAt);
      return date?.getFullYear() === month.year && date.getMonth() === month.month;
    }).length,
    accidents: accidents.filter((accident) => {
      const date = parseDate(accident.date);
      return date?.getFullYear() === month.year && date.getMonth() === month.month;
    }).length,
    actions: actions.filter((action) => {
      const date = parseDate(action.createdAt);
      return date?.getFullYear() === month.year && date.getMonth() === month.month;
    }).length,
  }));

  const categoryData = [...categoryCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const serviceData = [...serviceCounts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const criticalityData = [
    { name: "P1", value: priorityCounts.P1, color: "#ef4444" },
    { name: "P2", value: priorityCounts.P2, color: "#f97316" },
    { name: "P3", value: priorityCounts.P3, color: "#22c55e" },
  ];
  const priorityTotal = priorityCounts.P1 + priorityCounts.P2 + priorityCounts.P3;

  const actionStatus = [
    { name: "À faire", value: actions.filter((action) => action.status === "À faire").length, color: "#94a3b8" },
    { name: "En cours", value: actions.filter((action) => action.status === "En cours").length, color: "#f59e0b" },
    { name: "En retard", value: actions.filter((action) => action.status === "En retard").length, color: "#ef4444" },
    { name: "Terminées", value: actions.filter((action) => action.status === "Terminée").length, color: "#22c55e" },
  ];
  const actionTotal = actionStatus.reduce((sum, item) => sum + item.value, 0);

  const workflowData = (Object.keys(WORKFLOW_LABELS) as Array<Risk["status"]>).map((status) => ({
    name: WORKFLOW_LABELS[status],
    value: workflowCounts[status],
  }));

  const modules = [
    { id: "risks", label: "Évaluation des risques", hint: "DUERP du périmètre", value: risks.length, icon: Shield },
    { id: "actions", label: "Plan d'action", hint: `${overdueActions.length} en retard`, value: actions.length, icon: Activity },
    { id: "accidents", label: "Accidentologie", hint: `${accidentsThisYear} cette année`, value: accidents.length, icon: AlertTriangle },
    { id: "risk-awareness", label: "Sensibilisation", hint: "Registre des sensibilisations", value: awarenessCount, icon: Brain },
    { id: "safety-sheets", label: "Fiches de sécurité", hint: "Fiches publiées", value: securitySheetCount, icon: FileWarning },
    { id: "prevention-plan", label: "Plans de prévention", hint: "Entreprises extérieures", value: extraCounts["prevention-plan"] ?? null, icon: ClipboardList },
    { id: "safety-protocols", label: "Protocoles de sécurité", hint: "Chargement et déchargement", value: extraCounts["safety-protocols"] ?? null, icon: FolderOpen },
    { id: "medical-visits", label: "Visites médicales", hint: "Suivi des agents", value: extraCounts["medical-visits"] ?? null, icon: Stethoscope },
    { id: "arrivees-departs", label: "Arrivées et départs", hint: "Demandes RH", value: extraCounts["arrivees-departs"] ?? null, icon: Users },
    { id: "transport-coverage", label: "Transports", hint: "Prises en charge", value: extraCounts["transport-coverage"] ?? null, icon: Bus },
    { id: "asbestos", label: "Amiante", hint: "Interventions suivies", value: extraCounts.asbestos ?? null, icon: FileText },
    { id: "mercury", label: "Campagnes mercure", hint: "Prélèvements", value: extraCounts.mercury ?? null, icon: Droplets },
    { id: "reservations", label: "Réservations", hint: "Salles et véhicules", value: extraCounts.reservations ?? null, icon: CalendarClock },
    { id: "team", label: "Équipe", hint: "Annuaire des agents", value: teamSize, icon: Users },
  ];

  const priorityRisks = [...risks]
    .filter((risk) => getPriorityBandFromGfm(Number(risk.riskLevel) || 0) === "P1")
    .sort((a, b) => (Number(b.riskLevel) || 0) - (Number(a.riskLevel) || 0))
    .slice(0, 5);

  const recentAccidents = [...accidents]
    .sort((a, b) => (parseDate(b.date)?.getTime() || 0) - (parseDate(a.date)?.getTime() || 0))
    .slice(0, 5);

  const kpis = [
    {
      title: "Risques du périmètre",
      value: risks.length,
      detail: `${workflowCounts.a_traiter} à traiter`,
      icon: Shield,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      title: "Priorité P1",
      value: priorityCounts.P1,
      detail: priorityTotal > 0 ? `${Math.round((priorityCounts.P1 / priorityTotal) * 100)} % du stock` : "Aucun risque",
      icon: AlertCircle,
      tone: "bg-red-50 text-red-700",
    },
    {
      title: "Actions ouvertes",
      value: openActions.length,
      detail: `${overdueActions.length} échues`,
      icon: Activity,
      tone: "bg-amber-50 text-amber-800",
    },
    {
      title: "Accidents ce mois",
      value: accidentsThisMonth,
      detail: `${accidentsThisYear} en ${now.getFullYear()}`,
      icon: AlertTriangle,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="space-y-6">
      {risks.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          Aucun risque dans votre périmètre. Les indicateurs de risques restent vides tant qu'aucun risque ne vous est accessible.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 pt-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{kpi.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{kpi.detail}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Modules de l'application
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => onOpenModule(module.id)}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
              >
                <Icon className="h-5 w-5 shrink-0 text-sky-700" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{module.label}</span>
                  <span className="block truncate text-xs text-slate-500">{module.hint}</span>
                </span>
                <span className="text-lg font-semibold text-slate-800">
                  {module.value == null ? "—" : module.value}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="mr-2 h-5 w-5 text-violet-600" />
              Risques par famille
            </CardTitle>
            <CardDescription>Les huit familles les plus présentes dans votre périmètre</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">Aucune famille de risque à afficher.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" allowDecimals={false} stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <Tooltip contentStyle={chartTooltip} />
                  <Bar dataKey="value" name="Risques" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChart className="mr-2 h-5 w-5 text-orange-500" />
              Priorités résiduelles
            </CardTitle>
            <CardDescription>P1 au-dessus de 9, P2 de 4 à 9, P3 en dessous de 4</CardDescription>
          </CardHeader>
          <CardContent>
            {priorityTotal === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">Aucune priorité à répartir.</p>
            ) : (
              <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[220px_1fr]">
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPieChart>
                    <Pie data={criticalityData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80}>
                      {criticalityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltip} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {criticalityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Créations sur 6 mois</CardTitle>
            <CardDescription>Risques, accidents et actions datés dans le périmètre</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" stroke="#6b7280" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={chartTooltip} />
                <Area type="monotone" dataKey="risques" name="Risques" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} />
                <Area type="monotone" dataKey="accidents" name="Accidents" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                <Area type="monotone" dataKey="actions" name="Actions" stroke="#0f766e" fill="#0f766e" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Avancement des risques</CardTitle>
            <CardDescription>Statut de traitement dans l'évaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowData.map((item) => {
              const share = risks.length > 0 ? (item.value / risks.length) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="text-slate-500">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-600" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-600" />
              Plan d'action
            </CardTitle>
            <CardDescription>
              {pendingReturns > 0
                ? `${pendingReturns} retour${pendingReturns > 1 ? "s" : ""} d'action en attente de revue`
                : "Aucun retour d'action en attente"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionTotal === 0 ? (
              <p className="text-sm text-slate-500">Le plan d'action ne contient encore aucune action.</p>
            ) : (
              actionStatus.map((status) => {
                const share = (status.value / actionTotal) * 100;
                return (
                  <div key={status.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        {status.name === "En retard" ? <Clock className="h-4 w-4 text-red-500" /> : null}
                        {status.name}
                      </span>
                      <Badge style={{ backgroundColor: status.color }} className="border-0 text-white">
                        {status.value}
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: status.color }} />
                    </div>
                  </div>
                );
              })
            )}
            {overdueActions.slice(0, 3).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onOpenModule("actions")}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">{action.title}</span>
                  <span className="text-xs text-slate-500">{action.responsable || "Responsable non renseigné"}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Services les plus exposés</CardTitle>
            <CardDescription>Cinq services avec le plus de risques identifiés</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">Aucun service renseigné sur les risques.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serviceData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" allowDecimals={false} stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <Tooltip contentStyle={chartTooltip} />
                  <Bar dataKey="value" name="Risques" fill="#0284c7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <DeadlineAlertsCard risks={risks} onNavigateToRisk={onNavigateToRisk} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Risques P1 à traiter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityRisks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun risque en priorité P1.</p>
            ) : (
              priorityRisks.map((risk) => (
                <button
                  key={risk.id}
                  type="button"
                  onClick={() => onNavigateToRisk(risk)}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-red-200"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
                    P1
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{risk.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs text-slate-600">{risk.situation}</span>
                    <Badge className={`mt-2 border-0 bg-gradient-to-r text-white ${getRiskLevelColor(risk.riskLevel)}`}>
                      {getRiskLevelLabel(risk.riskLevel)}
                    </Badge>
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 text-violet-600" />
              Derniers accidents
            </CardTitle>
            <button type="button" className="text-sm font-medium text-sky-700" onClick={() => onOpenModule("accidents")}>
              Ouvrir
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAccidents.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun accident enregistré.</p>
            ) : (
              recentAccidents.map((accident) => {
                const date = parseDate(accident.date);
                return (
                  <button
                    key={accident.id}
                    type="button"
                    onClick={() => onOpenModule("accidents")}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-violet-200"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-slate-900">{accident.title}</span>
                      <Badge variant="outline" className="shrink-0 capitalize">{accident.severity}</Badge>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {date ? date.toLocaleDateString("fr-FR") : "Date inconnue"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {accident.victim || "Victime non renseignée"}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
