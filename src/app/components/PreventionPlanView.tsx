import React, { useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { AlertTriangle, ArrowLeft, Building2, ClipboardList, Download, FileText, Filter, PhoneCall, PlusCircle, Route, Search, Send, Shield, Ship, Signature, Target } from "lucide-react";
import { toast } from "sonner";

interface RiskMeasure {
  description: string;
  responsible: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
}

interface RiskInput {
  id: string;
  numeroRisque: string;
  title: string;
  service: string;
  domain?: string;
  site: string;
  responsable: string;
  riskLevel: number;
  plannedMeasures: RiskMeasure[];
}

interface PlanProtocolFields {
  protocoleTitle: string;
  codeTravailReference: string;
  operationType: string;
  entreprise1Name: string;
  entreprise1Address: string;
  navireName: string;
  capitaineName: string;
  prestationNature: string;
  entreprise2Name: string;
  entreprise2Address: string;
  responsableName: string;
  responsableEmail: string;
  lieuLivraison: string;
  materielsSpecifiques: string;
  consignesSite: string;
  consignesOperation: string;
  evaluationRisques: string;
  evaluationDomaineRisques: string;
  evaluationNatureRisques: string;
  evaluationMesuresPrevention: string;
  personnesAPrevenir: string;
  mesuresUrgence: string;
  planTransmis: string;
  transmissionCelluleSecurite: string;
  transmissionCorrespondantSite: string;
  transmissionCorrespondantAPB: string;
  transmissionCelluleSecuriteStatus: "non_renseigne" | "oui" | "non";
  transmissionCorrespondantSiteStatus: "non_renseigne" | "oui" | "non";
  transmissionCorrespondantAPBStatus: "non_renseigne" | "oui" | "non";
  transmissionCelluleSecuriteNom: string;
  transmissionCorrespondantSiteNom: string;
  transmissionCorrespondantAPBNom: string;
  transmissionCelluleSecuriteObs: string;
  transmissionCorrespondantSiteObs: string;
  transmissionCorrespondantAPBObs: string;
  observationsTransmission: string;
  observationsRemarques: string;
  signatureEntite1: string;
  signatureNom1: string;
  signaturePrenom1: string;
  signatureDate1: string;
  signatureEntite2: string;
  signatureNom2: string;
  signaturePrenom2: string;
  signatureDate2: string;
  signatureEntite3: string;
  signatureNom3: string;
  signaturePrenom3: string;
  signatureDate3: string;
  planCirculation: string;
  materielRemplacer: string;
  annexesDocuments: string;
}

type PlanStatus = "a_lancer" | "en_cours" | "termine";
type ViewMode = "list" | "detail" | "create" | "edit";

interface PlanRecord {
  id: string;
  riskId: string;
  riskNumber: string;
  riskTitle: string;
  service: string;
  domain: string;
  location: string;
  owner: string;
  dueDate: string;
  priority: "haute" | "moyenne" | "basse";
  status: PlanStatus;
  objective: string;
  actions: string[];
  protocol: PlanProtocolFields;
  updatedAt: string;
}

interface PreventionPlanViewProps {
  risks: RiskInput[];
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
}

const statusLabel: Record<PlanStatus, string> = {
  a_lancer: "A lancer",
  en_cours: "En cours",
  termine: "Termine",
};

const statusClass: Record<PlanStatus, string> = {
  a_lancer: "bg-amber-100 text-amber-800 border-amber-300",
  en_cours: "bg-teal-100 text-teal-800 border-teal-300",
  termine: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const defaultProtocolFields = (risk?: RiskInput, currentUserName?: string): PlanProtocolFields => ({
  protocoleTitle: "PROTOCOLE DE SECURITE",
  codeTravailReference: "Code du Travail article R4515-4 a R4515-11",
  operationType: "Operation de chargement / dechargement",
  entreprise1Name: "Armement des Phares et Balises",
  entreprise1Address: "",
  navireName: "",
  capitaineName: "",
  prestationNature: risk ? `Prevention du risque ${risk.numeroRisque} - ${risk.title}` : "",
  entreprise2Name: "",
  entreprise2Address: "",
  responsableName: currentUserName || "",
  responsableEmail: "",
  lieuLivraison: risk?.site || "",
  materielsSpecifiques: "",
  consignesSite: "",
  consignesOperation: "",
  evaluationRisques: "",
  evaluationDomaineRisques: "",
  evaluationNatureRisques: "",
  evaluationMesuresPrevention: "",
  personnesAPrevenir: "",
  mesuresUrgence: "SAMU : 15 - Pompiers : 18 - Police : 17 - Numero unique : 112",
  planTransmis: "",
  transmissionCelluleSecurite: "",
  transmissionCorrespondantSite: "",
  transmissionCorrespondantAPB: "",
  transmissionCelluleSecuriteStatus: "non_renseigne",
  transmissionCorrespondantSiteStatus: "non_renseigne",
  transmissionCorrespondantAPBStatus: "non_renseigne",
  transmissionCelluleSecuriteNom: "",
  transmissionCorrespondantSiteNom: "",
  transmissionCorrespondantAPBNom: "",
  transmissionCelluleSecuriteObs: "",
  transmissionCorrespondantSiteObs: "",
  transmissionCorrespondantAPBObs: "",
  observationsTransmission: "",
  observationsRemarques: "",
  signatureEntite1: "DIRM Med / SPBM / COB Ajaccio",
  signatureNom1: "",
  signaturePrenom1: "",
  signatureDate1: "",
  signatureEntite2: "Armement des Phares et Balises (APB)",
  signatureNom2: "",
  signaturePrenom2: "",
  signatureDate2: "",
  signatureEntite3: "Societe Insulaire Petroliere",
  signatureNom3: "",
  signaturePrenom3: "",
  signatureDate3: "",
  planCirculation: "",
  materielRemplacer: "",
  annexesDocuments: "",
});

function toPriority(level: number): "haute" | "moyenne" | "basse" {
  if (level >= 12) return "haute";
  if (level >= 6) return "moyenne";
  return "basse";
}

function toStatus(measures: RiskMeasure[]): PlanStatus {
  if (measures.some((measure) => measure.status === "in_progress")) return "en_cours";
  if (measures.length > 0 && measures.every((measure) => measure.status === "completed")) return "termine";
  return "a_lancer";
}

export function PreventionPlanView({ risks, currentUserRole, currentUserName }: PreventionPlanViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlanSnapshot, setSelectedPlanSnapshot] = useState<PlanRecord | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "haute" | "moyenne" | "basse">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [form, setForm] = useState({
    riskId: "",
    owner: "",
    dueDate: "",
    priority: "moyenne" as "haute" | "moyenne" | "basse",
    status: "a_lancer" as PlanStatus,
    objective: "",
    actionsText: "",
    protocol: defaultProtocolFields(undefined, currentUserName),
  });

  const canEdit = currentUserRole !== "agent";

  const initialPlans = useMemo<PlanRecord[]>(() => {
    const filteredRisks = risks;

    return filteredRisks.slice(0, 24).map((risk) => {
      const firstMeasure = risk.plannedMeasures[0];
      return {
        id: `plan-${risk.id}`,
        riskId: risk.id,
        riskNumber: risk.numeroRisque,
        riskTitle: risk.title,
        service: risk.service || "Non renseigne",
        domain: risk.domain || "Non renseigne",
        location: risk.site || "Non renseigne",
        owner: firstMeasure?.responsible || risk.responsable || "A affecter",
        dueDate: firstMeasure?.deadline || new Date().toISOString().slice(0, 10),
        priority: toPriority(risk.riskLevel),
        status: toStatus(risk.plannedMeasures),
        objective:
          firstMeasure?.description ||
          "Renforcer la prevention sur ce risque avec un plan d'action structure.",
        actions:
          risk.plannedMeasures.length > 0
            ? risk.plannedMeasures.map((measure) => measure.description)
            : ["Analyser les causes", "Definir les mesures de prevention", "Suivre l'efficacite"],
        protocol: {
          ...defaultProtocolFields(risk, firstMeasure?.responsible || risk.responsable || currentUserName),
          navireName: "A renseigner",
          capitaineName: "A renseigner",
          evaluationRisques: risk.plannedMeasures
            .map((measure, index) => `${index + 1}. ${measure.description}`)
            .join("\n"),
          evaluationDomaineRisques: "Risque manutention mécanique et au levage",
          evaluationNatureRisques: risk.plannedMeasures
            .map((measure, index) => `${index + 1}. ${measure.description}`)
            .join("\n"),
          evaluationMesuresPrevention: "Port des EPI, respect des consignes, vérifications périodiques.",
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [currentUserName, risks]);

  const [plans, setPlans] = useState<PlanRecord[]>(initialPlans);

  const serviceOptions = useMemo(
    () => Array.from(new Set(plans.map((plan) => plan.service))).sort((a, b) => a.localeCompare(b)),
    [plans],
  );

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      if (statusFilter !== "all" && plan.status !== statusFilter) return false;
      if (priorityFilter !== "all" && plan.priority !== priorityFilter) return false;
      if (serviceFilter !== "all" && plan.service !== serviceFilter) return false;
      const lower = query.trim().toLowerCase();
      if (!lower) return true;
      return (
        plan.riskNumber.toLowerCase().includes(lower) ||
        plan.riskTitle.toLowerCase().includes(lower) ||
        plan.owner.toLowerCase().includes(lower) ||
        plan.objective.toLowerCase().includes(lower)
      );
    });
  }, [plans, query, priorityFilter, serviceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(visiblePlans.length / pageSize));
  const paginatedPlans = useMemo(
    () => visiblePlans.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visiblePlans, currentPage],
  );

  const selectedPlan =
    selectedPlanSnapshot ||
    plans.find((plan) => plan.id === selectedId) ||
    null;
  const selectedProtocol = selectedPlan
    ? {
        ...defaultProtocolFields(undefined, currentUserName),
        ...(selectedPlan.protocol || {}),
      }
    : null;

  const resetForm = () => {
    setForm({
      riskId: "",
      owner: currentUserName,
      dueDate: "",
      priority: "moyenne",
      status: "a_lancer",
      objective: "",
      actionsText: "",
      protocol: defaultProtocolFields(undefined, currentUserName),
    });
  };

  const openCreate = () => {
    resetForm();
    setSelectedId(null);
    setSelectedPlanSnapshot(null);
    setViewMode("create");
  };

  const openDetail = (plan: PlanRecord) => {
    setSelectedId(plan.id);
    setSelectedPlanSnapshot(plan);
    setViewMode("detail");
  };

  const openEdit = (plan: PlanRecord) => {
    setSelectedId(plan.id);
    setSelectedPlanSnapshot(plan);
    setForm({
      riskId: plan.riskId,
      owner: plan.owner,
      dueDate: plan.dueDate,
      priority: plan.priority,
      status: plan.status,
      objective: plan.objective,
      actionsText: plan.actions.join("\n"),
      protocol: {
        ...defaultProtocolFields(undefined, currentUserName),
        ...(plan.protocol || {}),
      },
    });
    setViewMode("edit");
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const saveForm = () => {
    if (!form.riskId) {
      toast.error("Selectionne un risque.");
      return;
    }
    if (!form.objective.trim()) {
      toast.error("L'objectif est obligatoire.");
      return;
    }
    const risk = risks.find((riskItem) => riskItem.id === form.riskId);
    if (!risk) {
      toast.error("Risque introuvable.");
      return;
    }
    const actions = form.actionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (viewMode === "edit" && selectedPlan) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === selectedPlan.id
            ? {
                ...plan,
                owner: form.owner || currentUserName,
                dueDate: form.dueDate,
                priority: form.priority,
                status: form.status,
                objective: form.objective,
                actions,
                protocol: form.protocol,
                updatedAt: new Date().toISOString(),
              }
            : plan,
        ),
      );
      toast.success("Plan de prevention modifie.");
    } else {
      setPlans((prev) => [
        {
          id: `plan-custom-${Date.now()}`,
          riskId: risk.id,
          riskNumber: risk.numeroRisque,
          riskTitle: risk.title,
          service: risk.service || "Non renseigne",
          domain: risk.domain || "Non renseigne",
          location: risk.site || "Non renseigne",
          owner: form.owner || currentUserName,
          dueDate: form.dueDate,
          priority: form.priority,
          status: form.status,
          objective: form.objective,
          actions,
          protocol: {
            ...defaultProtocolFields(risk, form.owner || currentUserName),
            ...form.protocol,
          },
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Plan de prevention cree.");
    }
    setViewMode("list");
    setSelectedPlanSnapshot(null);
  };

  const updateProtocol = (key: keyof PlanProtocolFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        [key]: value,
      },
    }));
  };

  React.useEffect(() => {
    if ((viewMode === "detail" || viewMode === "edit") && selectedId && !selectedPlan) {
      setViewMode("list");
      setSelectedId(null);
      setSelectedPlanSnapshot(null);
      toast.error("Impossible d'ouvrir cette fiche. Elle a ete rechargee.");
    }
  }, [selectedId, selectedPlan, viewMode]);

  const handleDownloadPlan = async (plan: PlanRecord) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageHeight = 297;
      const margin = 14;
      const contentWidth = 182;
      let y = 16;

      const ensureSpace = (needed = 14) => {
        if (y + needed > pageHeight - 14) {
          doc.addPage();
          y = 16;
        }
      };

      const addTitle = (title: string) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(title, margin, y);
        y += 7;
      };

      const addBlock = (label: string, value: string) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(label, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value || "-", contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      };

      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, 210, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PLAN DE PREVENTION", margin, 9);
      doc.setTextColor(0, 0, 0);
      y = 20;

      addTitle(`${plan.riskNumber} - ${plan.riskTitle}`);
      addBlock("Reference", plan.protocol.codeTravailReference);
      addBlock("Objectif", plan.objective);
      addBlock("1) Armement des phares et balises - APB", `${plan.protocol.entreprise1Name}\n${plan.protocol.entreprise1Address}\nNavire: ${plan.protocol.navireName}\nCapitaine: ${plan.protocol.capitaineName}`);
      addBlock("2) Societe intervenante", `${plan.protocol.entreprise2Name}\n${plan.protocol.entreprise2Address}\nResponsable: ${plan.protocol.responsableName}\nEmail: ${plan.protocol.responsableEmail}`);
      addBlock("3) Organisation du chargement/dechargement", `Lieu: ${plan.protocol.lieuLivraison}\nMateriels: ${plan.protocol.materielsSpecifiques}\nConsignes site: ${plan.protocol.consignesSite}\nConsignes operation: ${plan.protocol.consignesOperation}`);
      addBlock("4) Evaluation des risques (CT R4515-5)", `Domaine: ${plan.protocol.evaluationDomaineRisques}\nNature: ${plan.protocol.evaluationNatureRisques}\nMesures: ${plan.protocol.evaluationMesuresPrevention}\nComplement: ${plan.protocol.evaluationRisques}`);
      addBlock("5) Premiers secours (CT R4515-6)", `Personnes a prevenir: ${plan.protocol.personnesAPrevenir}\nMesures urgence: ${plan.protocol.mesuresUrgence}`);
      addBlock("6) Plan de prevention transmis a (CT R4515-11)", `${plan.protocol.planTransmis}\nCellule securite: ${plan.protocol.transmissionCelluleSecuriteStatus} - ${plan.protocol.transmissionCelluleSecuriteNom} (${plan.protocol.transmissionCelluleSecuriteObs})\nCorrespondant site: ${plan.protocol.transmissionCorrespondantSiteStatus} - ${plan.protocol.transmissionCorrespondantSiteNom} (${plan.protocol.transmissionCorrespondantSiteObs})\nCorrespondant APB: ${plan.protocol.transmissionCorrespondantAPBStatus} - ${plan.protocol.transmissionCorrespondantAPBNom} (${plan.protocol.transmissionCorrespondantAPBObs})`);
      addBlock("7) Observations / remarques", plan.protocol.observationsRemarques);
      addBlock("8) Signatures", `${plan.protocol.signatureEntite1} - ${plan.protocol.signatureNom1} ${plan.protocol.signaturePrenom1} - ${plan.protocol.signatureDate1}\n${plan.protocol.signatureEntite2} - ${plan.protocol.signatureNom2} ${plan.protocol.signaturePrenom2} - ${plan.protocol.signatureDate2}\n${plan.protocol.signatureEntite3} - ${plan.protocol.signatureNom3} ${plan.protocol.signaturePrenom3} - ${plan.protocol.signatureDate3}`);
      addBlock("10) Plan de circulation et de dechargement", plan.protocol.planCirculation);
      addBlock("Materiel a remplacer", plan.protocol.materielRemplacer);
      addBlock("Annexes et documents joints", plan.protocol.annexesDocuments);

      doc.save(`plan-prevention-${plan.riskNumber || plan.id}.pdf`);
      toast.success("Plan de prevention telecharge.");
    } catch (error) {
      toast.error("Impossible de generer le PDF.");
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, priorityFilter, serviceFilter]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (viewMode === "detail" && selectedPlan && selectedProtocol) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => handleDownloadPlan(selectedPlan)}
            className="w-full sm:w-auto border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          {canEdit ? (
            <Button
              onClick={() => openEdit(selectedPlan)}
              className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              Modifier
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setViewMode("list");
              setSelectedPlanSnapshot(null);
            }}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Plan de prevention</p>
                  <CardTitle className="text-2xl mt-1">{selectedPlan.riskNumber} — {selectedPlan.riskTitle}</CardTitle>
                  <CardDescription className="text-emerald-100 mt-2">{selectedProtocol.codeTravailReference}</CardDescription>
                </div>
              </div>
              <Badge className={statusClass[selectedPlan.status]}>{statusLabel[selectedPlan.status]}</Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-2 border-indigo-100 bg-indigo-50/70"><CardContent className="p-4"><p className="text-xs text-indigo-700 font-semibold uppercase">Service</p><p className="font-semibold text-indigo-900 mt-1">{selectedPlan.service}</p></CardContent></Card>
          <Card className="border-2 border-teal-100 bg-teal-50/70"><CardContent className="p-4"><p className="text-xs text-teal-700 font-semibold uppercase">Domaine</p><p className="font-semibold text-teal-900 mt-1">{selectedPlan.domain}</p></CardContent></Card>
          <Card className="border-2 border-cyan-100 bg-cyan-50/70"><CardContent className="p-4"><p className="text-xs text-cyan-700 font-semibold uppercase">Lieu</p><p className="font-semibold text-cyan-900 mt-1">{selectedPlan.location}</p></CardContent></Card>
          <Card className="border-2 border-emerald-100 bg-emerald-50/70"><CardContent className="p-4"><p className="text-xs text-emerald-700 font-semibold uppercase">Responsable</p><p className="font-semibold text-emerald-900 mt-1">{selectedPlan.owner}</p></CardContent></Card>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Actions de prevention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPlan.actions.map((action, index) => (
              <div key={`${action}-${index}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-sm text-slate-700"><span className="font-semibold text-slate-900">Action {index + 1} :</span> {action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-2 border-indigo-100 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base text-indigo-900">1) ARMEMENT DES PHARES ET BALISES - APB</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-indigo-50 p-3"><p className="text-xs text-indigo-700 font-semibold uppercase">Adresse</p><p className="text-slate-800 mt-1">{selectedProtocol.entreprise1Address || "-"}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Navire</p><p className="text-slate-800 mt-1">{selectedProtocol.navireName || "-"}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Nom du capitaine</p><p className="text-slate-800 mt-1">{selectedProtocol.capitaineName || "-"}</p></div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">NATURE DE LA PRESTATION</p><p className="text-slate-800 mt-1">{selectedProtocol.prestationNature || "-"}</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-teal-100 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base text-teal-900">2) SOCIÉTÉ INTERVENANTE</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-teal-50 p-3"><p className="text-xs text-teal-700 font-semibold uppercase">Société</p><p className="text-slate-800 mt-1">{selectedProtocol.entreprise2Name || "-"}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Adresse</p><p className="text-slate-800 mt-1">{selectedProtocol.entreprise2Address || "-"}</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Nom du responsable</p><p className="text-slate-800 mt-1">{selectedProtocol.responsableName || "-"}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Email</p><p className="text-slate-800 mt-1 break-all">{selectedProtocol.responsableEmail || "-"}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">3) Organisation du chargement ou déchargement</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Lieu de livraison ou prise en charge</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.lieuLivraison || "-"}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Matériel(s) spécifique(s) utilisé(s)</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.materielsSpecifiques || "-"}</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs text-amber-700 font-semibold uppercase">Consignes de sécurité particulières sur le site</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.consignesSite || "-"}</p></div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3"><p className="text-xs text-amber-700 font-semibold uppercase">Consignes particulières concernant l'opération</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.consignesOperation || "-"}</p></div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader><CardTitle className="text-base">4) Évaluation des risques (CT R4515-5)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-100 p-3 text-xs font-bold uppercase text-slate-700">Domaine des risques</div>
              <div className="bg-slate-100 p-3 text-xs font-bold uppercase text-slate-700 border-l border-slate-200">Nature des risques</div>
              <div className="bg-slate-100 p-3 text-xs font-bold uppercase text-slate-700 border-l border-slate-200">Mesures de prévention</div>
              <div className="p-3 text-sm text-slate-800 whitespace-pre-wrap bg-white">{selectedProtocol.evaluationDomaineRisques || "-"}</div>
              <div className="p-3 text-sm text-slate-800 whitespace-pre-wrap border-l border-slate-200 bg-white">{selectedProtocol.evaluationNatureRisques || "-"}</div>
              <div className="p-3 text-sm text-slate-800 whitespace-pre-wrap border-l border-slate-200 bg-white">{selectedProtocol.evaluationMesuresPrevention || "-"}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500 font-semibold uppercase">Complément</p><p className="text-sm text-slate-800 whitespace-pre-wrap mt-1">{selectedProtocol.evaluationRisques || "-"}</p></div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-2 border-emerald-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-emerald-900">5) Premiers secours (CT R4515-6)</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700 font-semibold uppercase">Personne(s) à prévenir</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.personnesAPrevenir || "-"}</p></div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-3"><p className="text-xs text-red-700 font-semibold uppercase">Mesure(s) en cas d'accident ou incendie</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.mesuresUrgence || "-"}</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-orange-900">6) Plan transmis + 7) Observations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-orange-50 p-3 text-sm"><p className="text-xs text-orange-700 font-semibold uppercase">Plan de prévention transmis à</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.planTransmis || "-"}</p></div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Destinataire</th>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Oui/Non</th>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Nom</th>
                      <th className="text-left p-2 text-xs uppercase text-slate-600">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t"><td className="p-2">Cellule Sécurité Prévention DIRM MED</td><td className="p-2">{selectedProtocol.transmissionCelluleSecuriteStatus}</td><td className="p-2">{selectedProtocol.transmissionCelluleSecuriteNom || "-"}</td><td className="p-2">{selectedProtocol.transmissionCelluleSecuriteObs || "-"}</td></tr>
                    <tr className="border-t"><td className="p-2">Correspondant Hygiène et Sécurité du site</td><td className="p-2">{selectedProtocol.transmissionCorrespondantSiteStatus}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantSiteNom || "-"}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantSiteObs || "-"}</td></tr>
                    <tr className="border-t"><td className="p-2">Correspondant Hygiène et Sécurité APB</td><td className="p-2">{selectedProtocol.transmissionCorrespondantAPBStatus}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantAPBNom || "-"}</td><td className="p-2">{selectedProtocol.transmissionCorrespondantAPBObs || "-"}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500 font-semibold uppercase">Observations de transmission</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.observationsTransmission || "-"}</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500 font-semibold uppercase">Observations / remarques</p><p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.observationsRemarques || "-"}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-rose-100 shadow-sm">
          <CardHeader><CardTitle className="text-base text-rose-900">8) Signatures</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 xl:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-rose-200 p-3 bg-rose-50/60">
              <p className="font-semibold text-slate-900 mb-2">{selectedProtocol.signatureEntite1 || "Entité 1"}</p>
              <p><span className="font-medium">Nom:</span> {selectedProtocol.signatureNom1 || "-"}</p><p><span className="font-medium">Prénom:</span> {selectedProtocol.signaturePrenom1 || "-"}</p><p><span className="font-medium">Date:</span> {selectedProtocol.signatureDate1 || "-"}</p>
            </div>
            <div className="rounded-xl border border-rose-200 p-3 bg-rose-50/60">
              <p className="font-semibold text-slate-900 mb-2">{selectedProtocol.signatureEntite2 || "Entité 2"}</p>
              <p><span className="font-medium">Nom:</span> {selectedProtocol.signatureNom2 || "-"}</p><p><span className="font-medium">Prénom:</span> {selectedProtocol.signaturePrenom2 || "-"}</p><p><span className="font-medium">Date:</span> {selectedProtocol.signatureDate2 || "-"}</p>
            </div>
            <div className="rounded-xl border border-rose-200 p-3 bg-rose-50/60">
              <p className="font-semibold text-slate-900 mb-2">{selectedProtocol.signatureEntite3 || "Entité 3"}</p>
              <p><span className="font-medium">Nom:</span> {selectedProtocol.signatureNom3 || "-"}</p><p><span className="font-medium">Prénom:</span> {selectedProtocol.signaturePrenom3 || "-"}</p><p><span className="font-medium">Date:</span> {selectedProtocol.signatureDate3 || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-2 border-sky-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-sky-900">10) Plan de circulation et de déchargement</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.planCirculation || "-"}</p></CardContent>
          </Card>
          <Card className="border-2 border-sky-100 shadow-sm">
            <CardHeader><CardTitle className="text-base text-sky-900">Matériel à remplacer</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.materielRemplacer || "-"}</p></CardContent>
          </Card>
        </div>
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">Annexes et documents joints</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.annexesDocuments || "-"}</p></CardContent>
        </Card>
      </div>
    );
  }

  if ((viewMode === "create" || viewMode === "edit") && canEdit) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {viewMode === "create" ? "Nouveau plan de prevention" : "Modifier le plan de prevention"}
            </h2>
            <p className="text-slate-600 mt-1">Edition en page complete, style premium.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setViewMode("list");
              setSelectedPlanSnapshot(null);
            }}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-white">
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardContent className="p-5 sm:p-8 space-y-5">
            <Card className="border-0 bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 text-white">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Document officiel</p>
                    <p className="text-lg font-semibold mt-1">{form.protocol.protocoleTitle}</p>
                    <p className="text-emerald-100 text-sm mt-1">{form.protocol.codeTravailReference}</p>
                  </div>
                  <Badge className="bg-white text-slate-900 border-white/20">{viewMode === "create" ? "Creation" : "Modification"}</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Risque *</Label>
                <Select
                  value={form.riskId}
                  onValueChange={(value) => {
                    const selectedRisk = risks.find((risk) => risk.id === value);
                    setForm((prev) => ({
                      ...prev,
                      riskId: value,
                      protocol: {
                        ...prev.protocol,
                        prestationNature: selectedRisk
                          ? `Prevention du risque ${selectedRisk.numeroRisque} - ${selectedRisk.title}`
                          : prev.protocol.prestationNature,
                        lieuLivraison: selectedRisk?.site || prev.protocol.lieuLivraison,
                      },
                    }));
                  }}
                >
                  <SelectTrigger className="border-2 border-slate-300">
                    <SelectValue placeholder="Selectionner un risque" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks.map((risk) => (
                      <SelectItem key={risk.id} value={risk.id}>
                        {risk.numeroRisque} — {risk.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input value={form.owner} onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))} className="border-2 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label>Echeance</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))} className="border-2 border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label>Priorite</Label>
                <Select value={form.priority} onValueChange={(value: "haute" | "moyenne" | "basse") => setForm((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="border-2 border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objectif de prevention *</Label>
              <Textarea rows={4} value={form.objective} onChange={(e) => setForm((prev) => ({ ...prev, objective: e.target.value }))} className="border-2 border-slate-300" />
            </div>

            <div className="space-y-2">
              <Label>Actions (une par ligne)</Label>
              <Textarea rows={6} value={form.actionsText} onChange={(e) => setForm((prev) => ({ ...prev, actionsText: e.target.value }))} className="border-2 border-slate-300" />
            </div>

            <Separator />

            <h3 className="text-lg font-semibold text-slate-900">Champs complets du protocole / plan de prevention</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Titre document</Label><Input value={form.protocol.protocoleTitle} onChange={(e) => updateProtocol("protocoleTitle", e.target.value)} className="border-2 border-slate-300" /></div>
              <div className="space-y-2"><Label>Reference Code du Travail</Label><Input value={form.protocol.codeTravailReference} onChange={(e) => updateProtocol("codeTravailReference", e.target.value)} className="border-2 border-slate-300" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Type operation</Label><Input value={form.protocol.operationType} onChange={(e) => updateProtocol("operationType", e.target.value)} className="border-2 border-slate-300" /></div>
            </div>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Ship className="h-4 w-4 text-indigo-600" />1) Armement / APB</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom structure</Label><Input value={form.protocol.entreprise1Name} onChange={(e) => updateProtocol("entreprise1Name", e.target.value)} /></div>
                <div className="space-y-2"><Label>Adresse</Label><Input value={form.protocol.entreprise1Address} onChange={(e) => updateProtocol("entreprise1Address", e.target.value)} /></div>
                <div className="space-y-2"><Label>Navire</Label><Input value={form.protocol.navireName} onChange={(e) => updateProtocol("navireName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Nom du capitaine</Label><Input value={form.protocol.capitaineName} onChange={(e) => updateProtocol("capitaineName", e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Nature de la prestation</Label><Input value={form.protocol.prestationNature} onChange={(e) => updateProtocol("prestationNature", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-600" />2) Societe intervenante</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nom societe</Label><Input value={form.protocol.entreprise2Name} onChange={(e) => updateProtocol("entreprise2Name", e.target.value)} /></div>
                <div className="space-y-2"><Label>Adresse</Label><Input value={form.protocol.entreprise2Address} onChange={(e) => updateProtocol("entreprise2Address", e.target.value)} /></div>
                <div className="space-y-2"><Label>Nom responsable</Label><Input value={form.protocol.responsableName} onChange={(e) => updateProtocol("responsableName", e.target.value)} /></div>
                <div className="space-y-2"><Label>Email responsable</Label><Input value={form.protocol.responsableEmail} onChange={(e) => updateProtocol("responsableEmail", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Route className="h-4 w-4 text-cyan-600" />3) Organisation chargement / dechargement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Lieu de livraison / prise en charge</Label><Textarea rows={2} value={form.protocol.lieuLivraison} onChange={(e) => updateProtocol("lieuLivraison", e.target.value)} /></div>
                <div className="space-y-2"><Label>Materiels specifiques utilises</Label><Textarea rows={2} value={form.protocol.materielsSpecifiques} onChange={(e) => updateProtocol("materielsSpecifiques", e.target.value)} /></div>
                <div className="space-y-2"><Label>Consignes de securite site</Label><Textarea rows={2} value={form.protocol.consignesSite} onChange={(e) => updateProtocol("consignesSite", e.target.value)} /></div>
                <div className="space-y-2"><Label>Consignes operation</Label><Textarea rows={2} value={form.protocol.consignesOperation} onChange={(e) => updateProtocol("consignesOperation", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4 text-purple-600" />4) Évaluation des risques (CT R4515-5)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Domaine des risques</Label>
                    <Textarea rows={4} value={form.protocol.evaluationDomaineRisques} onChange={(e) => updateProtocol("evaluationDomaineRisques", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nature des risques</Label>
                    <Textarea rows={4} value={form.protocol.evaluationNatureRisques} onChange={(e) => updateProtocol("evaluationNatureRisques", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mesures de prévention</Label>
                    <Textarea rows={4} value={form.protocol.evaluationMesuresPrevention} onChange={(e) => updateProtocol("evaluationMesuresPrevention", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Complément libre</Label>
                  <Textarea rows={4} value={form.protocol.evaluationRisques} onChange={(e) => updateProtocol("evaluationRisques", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><PhoneCall className="h-4 w-4 text-emerald-600" />5) Premiers secours (CT R4515-6)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Personne(s) à prévenir</Label><Textarea rows={2} value={form.protocol.personnesAPrevenir} onChange={(e) => updateProtocol("personnesAPrevenir", e.target.value)} /></div>
                <div className="space-y-2"><Label>Mesure(s) à suivre en cas d'accident ou incendie</Label><Textarea rows={2} value={form.protocol.mesuresUrgence} onChange={(e) => updateProtocol("mesuresUrgence", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-orange-600" />6) Plan de prévention transmis à (CT R4515-11)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Liste de diffusion</Label><Textarea rows={2} value={form.protocol.planTransmis} onChange={(e) => updateProtocol("planTransmis", e.target.value)} /></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Cellule Sécurité Prévention DIRM MED</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCelluleSecuriteNom} onChange={(e) => updateProtocol("transmissionCelluleSecuriteNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCelluleSecuriteStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCelluleSecuriteStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigne</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCelluleSecuriteObs} onChange={(e) => updateProtocol("transmissionCelluleSecuriteObs", e.target.value)} />
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Correspondant Hygiène et Sécurité du site</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCorrespondantSiteNom} onChange={(e) => updateProtocol("transmissionCorrespondantSiteNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCorrespondantSiteStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCorrespondantSiteStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigne</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCorrespondantSiteObs} onChange={(e) => updateProtocol("transmissionCorrespondantSiteObs", e.target.value)} />
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-slate-50">
                    <CardContent className="p-3 space-y-2">
                      <Label className="text-xs">Correspondant Hygiène et Sécurité APB</Label>
                      <Input placeholder="Nom" value={form.protocol.transmissionCorrespondantAPBNom} onChange={(e) => updateProtocol("transmissionCorrespondantAPBNom", e.target.value)} />
                      <Select value={form.protocol.transmissionCorrespondantAPBStatus} onValueChange={(value: "non_renseigne" | "oui" | "non") => updateProtocol("transmissionCorrespondantAPBStatus", value)}>
                        <SelectTrigger><SelectValue placeholder="oui / non" /></SelectTrigger>
                        <SelectContent><SelectItem value="non_renseigne">Non renseigne</SelectItem><SelectItem value="oui">Oui</SelectItem><SelectItem value="non">Non</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Observation" value={form.protocol.transmissionCorrespondantAPBObs} onChange={(e) => updateProtocol("transmissionCorrespondantAPBObs", e.target.value)} />
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Texte libre cellule securite</Label><Input value={form.protocol.transmissionCelluleSecurite} onChange={(e) => updateProtocol("transmissionCelluleSecurite", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Texte libre correspondant site</Label><Input value={form.protocol.transmissionCorrespondantSite} onChange={(e) => updateProtocol("transmissionCorrespondantSite", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Texte libre correspondant APB</Label><Input value={form.protocol.transmissionCorrespondantAPB} onChange={(e) => updateProtocol("transmissionCorrespondantAPB", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Observations de transmission</Label><Textarea rows={2} value={form.protocol.observationsTransmission} onChange={(e) => updateProtocol("observationsTransmission", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base">7) Observations / remarques</CardTitle></CardHeader>
              <CardContent><Textarea rows={3} value={form.protocol.observationsRemarques} onChange={(e) => updateProtocol("observationsRemarques", e.target.value)} /></CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Signature className="h-4 w-4 text-rose-600" />8) Signatures</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input placeholder="Entite 1" value={form.protocol.signatureEntite1} onChange={(e) => updateProtocol("signatureEntite1", e.target.value)} />
                  <Input placeholder="Nom" value={form.protocol.signatureNom1} onChange={(e) => updateProtocol("signatureNom1", e.target.value)} />
                  <Input placeholder="Prenom" value={form.protocol.signaturePrenom1} onChange={(e) => updateProtocol("signaturePrenom1", e.target.value)} />
                  <Input type="date" value={form.protocol.signatureDate1} onChange={(e) => updateProtocol("signatureDate1", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input placeholder="Entite 2" value={form.protocol.signatureEntite2} onChange={(e) => updateProtocol("signatureEntite2", e.target.value)} />
                  <Input placeholder="Nom" value={form.protocol.signatureNom2} onChange={(e) => updateProtocol("signatureNom2", e.target.value)} />
                  <Input placeholder="Prenom" value={form.protocol.signaturePrenom2} onChange={(e) => updateProtocol("signaturePrenom2", e.target.value)} />
                  <Input type="date" value={form.protocol.signatureDate2} onChange={(e) => updateProtocol("signatureDate2", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input placeholder="Entite 3" value={form.protocol.signatureEntite3} onChange={(e) => updateProtocol("signatureEntite3", e.target.value)} />
                  <Input placeholder="Nom" value={form.protocol.signatureNom3} onChange={(e) => updateProtocol("signatureNom3", e.target.value)} />
                  <Input placeholder="Prenom" value={form.protocol.signaturePrenom3} onChange={(e) => updateProtocol("signaturePrenom3", e.target.value)} />
                  <Input type="date" value={form.protocol.signatureDate3} onChange={(e) => updateProtocol("signatureDate3", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Route className="h-4 w-4 text-sky-600" />10) Plan de circulation / dechargement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Plan de circulation et de dechargement</Label><Textarea rows={3} value={form.protocol.planCirculation} onChange={(e) => updateProtocol("planCirculation", e.target.value)} /></div>
                <div className="space-y-2"><Label>Materiel a remplacer</Label><Textarea rows={2} value={form.protocol.materielRemplacer} onChange={(e) => updateProtocol("materielRemplacer", e.target.value)} /></div>
                <div className="space-y-2"><Label>Annexes / documents joints</Label><Textarea rows={2} value={form.protocol.annexesDocuments} onChange={(e) => updateProtocol("annexesDocuments", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Separator />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode("list");
                  setSelectedPlanSnapshot(null);
                }}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button onClick={saveForm} className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">Enregistrer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doneCount = visiblePlans.filter((plan) => plan.status === "termine").length;
  const inProgressCount = visiblePlans.filter((plan) => plan.status === "en_cours").length;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800 via-emerald-800 to-teal-800 text-white overflow-hidden">
        <CardHeader className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl sm:text-4xl font-bold">Plan de prevention</CardTitle>
                <p className="text-emerald-100 text-lg mt-1">Pilotage des actions de prevention par risque, service et priorite.</p>
              </div>
            </div>
            <Badge className="w-full lg:w-auto justify-center bg-white text-slate-900 border border-slate-200 text-lg px-5 py-2">
              {visiblePlans.length} plan(s)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50"><CardContent className="p-4"><p className="text-xs text-indigo-700 uppercase font-semibold">Plans visibles</p><p className="text-2xl font-bold text-indigo-900 mt-1">{visiblePlans.length}</p></CardContent></Card>
        <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50"><CardContent className="p-4"><p className="text-xs text-teal-700 uppercase font-semibold">En cours</p><p className="text-2xl font-bold text-teal-900 mt-1">{inProgressCount}</p></CardContent></Card>
        <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50"><CardContent className="p-4"><p className="text-xs text-emerald-700 uppercase font-semibold">Termines</p><p className="text-2xl font-bold text-emerald-900 mt-1">{doneCount}</p></CardContent></Card>
      </div>

      <Card className="border-2 bg-white/95">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:flex-1">
              <div className="relative w-full xl:max-w-md">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPagination();
                  }}
                  placeholder="Rechercher un plan..."
                  className="pl-10 border-2 border-slate-300"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | PlanStatus) => {
                  setStatusFilter(value);
                  resetPagination();
                }}
              >
                <SelectTrigger className="w-full md:w-56 border-2 border-slate-300"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="a_lancer">A lancer</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Termine</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value: "all" | "haute" | "moyenne" | "basse") => {
                  setPriorityFilter(value);
                  resetPagination();
                }}
              >
                <SelectTrigger className="w-full md:w-48 border-2 border-slate-300"><SelectValue placeholder="Priorite" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorites</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="basse">Basse</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={serviceFilter}
                onValueChange={(value) => {
                  setServiceFilter(value);
                  resetPagination();
                }}
              >
                <SelectTrigger className="w-full md:w-52 border-2 border-slate-300"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous services</SelectItem>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="hidden xl:flex items-center gap-2 text-sm text-slate-500"><Filter className="h-4 w-4" />Filtres</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setServiceFilter("all");
                  resetPagination();
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
            {canEdit ? (
              <Button onClick={openCreate} className="w-full xl:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouveau plan
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {paginatedPlans.map((plan) => (
          <Card key={plan.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <CardContent className="p-5 space-y-4">
              {(() => {
                const totalActions = Math.max(1, plan.actions.length);
                const completedActions =
                  plan.status === "termine"
                    ? totalActions
                    : plan.status === "en_cours"
                      ? Math.max(1, Math.floor(totalActions / 2))
                      : 0;
                const progress = (completedActions / totalActions) * 100;
                return (
                  <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{plan.protocol.operationType || "Protocole de sécurité"}</p>
                    <p className="text-lg font-semibold text-slate-900 leading-snug break-words">{plan.protocol.protocoleTitle || "PROTOCOLE DE SECURITE"}</p>
                  </div>
                </div>
                <Badge className={statusClass[plan.status]}>{statusLabel[plan.status]}</Badge>
              </div>
              <p className="text-sm text-slate-700 line-clamp-2">{plan.protocol.prestationNature || plan.objective}</p>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-blue-700">Entité 1 :</span>
                  <span className="text-sm font-semibold text-blue-700">{plan.protocol.entreprise1Name || "-"}</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-indigo-700">Entité 2 :</span>
                  <span className="text-sm font-semibold text-indigo-700">{plan.protocol.entreprise2Name || "-"}</span>
                </div>
                <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-teal-700">Responsable protocole :</span>
                  <span className="text-sm font-semibold text-indigo-700">{plan.protocol.responsableName || plan.owner}</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-emerald-700">Lieu :</span>
                  <span className="text-sm font-semibold text-emerald-700">{plan.protocol.lieuLivraison || plan.location}</span>
                </div>
                <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-cyan-700">Plan transmis :</span>
                  <span className="text-sm font-semibold text-cyan-700">{plan.protocol.planTransmis || "-"}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-semibold">Avancement actions</span>
                  <span className="font-bold text-teal-700">{completedActions}/{totalActions}</span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 shadow-md" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-semibold">Date signature</Label>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-indigo-50 border-indigo-400 text-indigo-700">
                    {plan.protocol.signatureDate1 || plan.protocol.signatureDate2 || plan.protocol.signatureDate3 || "-"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-semibold">Navire</Label>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-cyan-50 border-cyan-400 text-cyan-700">
                    {plan.protocol.navireName || "-"}
                  </div>
                </div>
              </div>

              <Badge className="w-full justify-center font-bold border-0 bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-2">
                {plan.protocol.operationType || "Plan de prévention"}
              </Badge>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:flex-1" onClick={() => openDetail(plan)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter
                </Button>
                {canEdit ? (
                  <Button className="w-full sm:flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700" onClick={() => openEdit(plan)}>
                    Modifier
                  </Button>
                ) : null}
              </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      {visiblePlans.length > 0 ? (
        <Card className="border-2 bg-white/95">
          <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Page {currentPage} / {totalPages} - {visiblePlans.length} résultat(s)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visiblePlans.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white/80">
          <CardContent className="py-14 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Aucun plan de prevention</p>
            <p className="text-gray-500 text-sm mt-1">Ajuste les filtres ou cree un nouveau plan.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
