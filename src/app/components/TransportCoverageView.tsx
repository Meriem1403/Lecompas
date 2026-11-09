import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bus, Calendar, Check, ChevronDown, Download, Eye, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import {
  EMPTY_AGENT_PROFILES,
  applyProfile,
  profileKey,
  rememberProfile,
  type AgentTransportProfile,
} from "@/app/utils/agentTransportProfile";
import { readTransportForm, transportFormHasValues } from "@/app/utils/importTransportForm";
import {
  TRANSPORT_FORM_TEMPLATE_URL,
  fillTransportCoveragePdf,
  type TransportCoverageRequest,
  type TransportJustificatif,
} from "@/app/utils/transportCoveragePdf";
import { EMPTY_WORKFLOW_ASSIGNMENTS, type WorkflowAssignments } from "@/app/components/access-management/workflowActions";
import { AddressSuggest } from "./transport/AddressSuggest";
import { SignaturePad } from "./transport/SignaturePad";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const EMPTY_REQUESTS: TransportCoverageRequest[] = [];

const DECLARATIONS = [
  "Je ne perçois pas d'indemnités représentatives de frais pour mes déplacements entre ma résidence habituelle et mon lieu de travail",
  "Je ne bénéficie pas d'un logement de fonction",
  "Je ne bénéficie pas d'un véhicule de fonction",
  "Je ne bénéficie pas d'un transport collectif gratuit entre mon domicile et mon lieu de travail",
  "Je ne suis pas transporté(e) gratuitement par mon employeur",
  "Je ne bénéficie pas pour le même trajet d'une prise en charge au titre des frais de déplacements temporaires",
  "Je ne bénéficie pas des dispositions du décret n°83-588 du 1er juillet 1983 et je ne suis pas atteint d'un handicap dont l'importance empêche l'utilisation des transports en commun",
];

interface TransportCoverageViewProps {
  accessToken?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
  currentUserRole?: string;
  directory?: Array<{ id: string; email: string; firstName: string; lastName: string }>;
  onNotify?: (notice: { recipientEmail: string; titre: string; contenu: string }) => void;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const ANNEES = ["2024", "2025", "2026", "2027", "2028"];

function statusMeta(statut?: TransportCoverageRequest["statut"]) {
  if (statut === "traitee") return { label: "Traitée", className: "bg-emerald-50 text-emerald-800" };
  if (statut === "en_attente_rh") return { label: "Chez le DRH", className: "bg-amber-50 text-amber-800" };
  return { label: "Brouillon", className: "bg-slate-100 text-slate-600" };
}

function requestLine(request: TransportCoverageRequest) {
  const trip = [request.domicileCommune || request.domicileArret, request.travailCommune || request.travailArret]
    .filter(Boolean)
    .join(" → ");
  const period = [
    [request.periodeMoisDebut, request.periodeAnneeDebut].filter(Boolean).join(" "),
    [request.periodeMoisFin, request.periodeAnneeFin].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" — ");
  const amount = request.montantTotalMensuel ? `${request.montantTotalMensuel} €` : "";
  return [trip, period, amount].filter(Boolean).join(" · ");
}

function withoutAttachmentBytes(request: TransportCoverageRequest): TransportCoverageRequest {
  return {
    ...request,
    justificatifs: request.justificatifs.map(({ id, name }) => ({ id, name, dataUrl: "" })),
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function emptyRequest(name: string, email: string): TransportCoverageRequest {
  const { prenom, nom } = splitName(name);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    agentEmail: email,
    ministereDirectionAffectation: "DIRM Méditerranée",
    nom,
    prenom,
    numeroSecuriteSociale: "",
    matricule: "",
    corps: "",
    grade: "",
    dateArriveeStructure: "",
    domicileNumeroRue: "",
    domicileCommune: "",
    domicileCodePostal: "",
    domicileArret: "",
    travailNumeroRue: "",
    travailCommune: "",
    travailCodePostal: "",
    travailArret: "",
    abonnementHebdomadaire: false,
    abonnementMensuel: false,
    abonnementAnnuel: false,
    abonnementVelo: false,
    periodeMoisDebut: "",
    periodeAnneeDebut: "",
    periodeMoisFin: "",
    periodeAnneeFin: "",
    semaineDu: "",
    semaineAu: "",
    allocationSpeciale: false,
    modeTransport: "",
    modeTransportAutres: "",
    faitLe: todayIso(),
    faitA: "",
    signatureAgent: name,
    signatureImage: "",
    montantIleDeFrance: "",
    montantHorsIleDeFrance: "",
    montantLocationVelo: "",
    zonesIleDeFrance: "",
    zonesHorsIleDeFrance: "",
    montantTotalMensuel: "",
    certificateurNom: "",
    certificateurDate: "",
    certificateurFonction: "",
    justificatifs: [],
    statut: "brouillon",
    feuilleJointeNom: "",
  };
}

function DateField({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const openPicker = () => {
    const input = boxRef.current?.querySelector("input");
    if (!(input instanceof HTMLInputElement)) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        input.focus();
      }
    }
    input.focus();
  };
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div ref={boxRef} className="relative">
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 border-sky-200 bg-white pr-10 [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <button
          type="button"
          aria-label={`Ouvrir le calendrier ${label}`}
          onClick={openPicker}
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-sky-700 hover:bg-sky-50"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-sky-200 bg-white pl-3 pr-10 text-sm text-slate-900"
        >
          <option value="">Choisir</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  id = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        className="border-sky-200 bg-white"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "sky" | "indigo" | "amber" | "slate";
  children: ReactNode;
}) {
  const tones = {
    sky: "from-sky-600 to-blue-600",
    indigo: "from-indigo-600 to-violet-600",
    amber: "from-amber-500 to-orange-500",
    slate: "from-slate-700 to-slate-900",
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-md">
      <h2 className={`bg-gradient-to-r ${tones[tone]} px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white`}>
        {title}
      </h2>
      <div className="space-y-4 p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function TransportCoverageView({
  accessToken = "",
  currentUserId = "",
  currentUserName = "",
  currentUserEmail = "",
  currentUserRole = "agent",
  directory = [],
  onNotify,
}: TransportCoverageViewProps) {
  const [requests, setRequests] = useAppDataDocumentStore<TransportCoverageRequest[]>(
    APP_DATA_KEYS.transportCoverageRequests,
    accessToken,
    { seed: EMPTY_REQUESTS },
  );
  const [profiles, setProfiles] = useAppDataDocumentStore<Record<string, AgentTransportProfile>>(
    APP_DATA_KEYS.agentProfiles,
    accessToken,
    { seed: EMPTY_AGENT_PROFILES },
  );
  const [assignments] = useAppDataDocumentStore<WorkflowAssignments>(
    APP_DATA_KEYS.workflowAssignments,
    accessToken,
    { seed: EMPTY_WORKFLOW_ASSIGNMENTS },
  );
  const [draft, setDraft] = useState<TransportCoverageRequest | null>(null);
  const [step, setStep] = useState<"list" | "form" | "recap" | "consult" | "rh" | "apercu">("list");
  const [previewFrom, setPreviewFrom] = useState<"consult" | "rh">("consult");
  const [dropping, setDropping] = useState(false);
  const [readingSheet, setReadingSheet] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const certifierIds = assignments["transport-coverage"]?.certifier ?? [];
  const canCertify = currentUserRole === "rh" || certifierIds.includes(currentUserId);
  const currentProfile = profiles[profileKey(currentUserEmail)];
  const attachmentsStripped = useRef(false);

  useEffect(() => {
    if (attachmentsStripped.current || !Array.isArray(requests)) return;
    const keepsBytes = requests.some((request) => request.justificatifs?.some((file) => file.dataUrl));
    if (!keepsBytes) return;
    attachmentsStripped.current = true;
    setRequests((current) => (Array.isArray(current) ? current.map(withoutAttachmentBytes) : current));
  }, [requests, setRequests]);

  const visibleRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const email = currentUserEmail.toLowerCase();
    return list
      .filter((request) => request.agentEmail?.toLowerCase() === email)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }, [requests, currentUserEmail]);

  const requestsToCertify = useMemo(() => {
    if (!canCertify) return [];
    const list = Array.isArray(requests) ? requests : [];
    return list
      .filter((request) => request.statut === "en_attente_rh")
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }, [requests, canCertify]);

  useEffect(() => {
    setDraft(null);
    setStep("list");
  }, [currentUserId, currentUserRole]);

  const patch = (partial: Partial<TransportCoverageRequest>) => {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  };

  const persist = (next: TransportCoverageRequest) => {
    const saved = withoutAttachmentBytes({
      ...next,
      updatedAt: new Date().toISOString(),
      agentEmail: next.agentEmail || currentUserEmail,
    });
    setRequests((current) => {
      const list = Array.isArray(current) ? current : [];
      const index = list.findIndex((item) => item.id === saved.id);
      if (index === -1) return [saved, ...list];
      return list.map((item) => (item.id === saved.id ? saved : item));
    });
    const key = profileKey(saved.agentEmail);
    if (key) {
      setProfiles((current) => ({
        ...current,
        [key]: rememberProfile(current[key], saved),
      }));
    }
    setDraft(saved);
    return saved;
  };

  const downloadPdf = async (request: TransportCoverageRequest) => {
    if (!request.nom.trim() || !request.prenom.trim()) {
      toast.error("Le nom et le prénom sont nécessaires pour remplir le formulaire.");
      return;
    }
    try {
      const response = await fetch(TRANSPORT_FORM_TEMPLATE_URL);
      if (!response.ok) throw new Error("Modèle introuvable");
      const bytes = await fillTransportCoveragePdf(await response.arrayBuffer(), request);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transports-${request.nom || "agent"}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Le PDF n'a pas pu être généré.");
    }
  };

  const rememberNames = (files: FileList | File[]) => {
    if (!draft) return;
    const next: TransportJustificatif[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (file.size > 8_000_000) {
        toast.error(`${file.name} dépasse 8 Mo.`);
        continue;
      }
      next.push({ id: crypto.randomUUID(), name: file.name, dataUrl: "" });
    }
    patch({ justificatifs: [...draft.justificatifs, ...next].slice(0, 4) });
  };

  const importSheet = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Déposez la feuille au format PDF.");
      return;
    }
    if (file.size > 8_000_000) {
      toast.error("Le PDF dépasse 8 Mo.");
      return;
    }
    setReadingSheet(true);
    try {
      const buffer = await file.arrayBuffer();
      const extracted = await readTransportForm(buffer);
      const base = applyProfile(draft || emptyRequest(currentUserName, currentUserEmail), currentProfile);
      const attachment: TransportJustificatif = { id: crypto.randomUUID(), name: file.name, dataUrl: "" };
      setDraft({
        ...base,
        ...extracted,
        id: base.id,
        createdAt: base.createdAt,
        agentEmail: base.agentEmail,
        statut: "brouillon",
        feuilleJointeNom: file.name,
        justificatifs: [...base.justificatifs.filter((item) => item.name !== file.name), attachment].slice(0, 4),
        signatureImage: base.signatureImage,
      });
      setStep("form");
      if (transportFormHasValues(extracted)) {
        toast.success("Les informations de la pièce ont été reprises. Vérifiez-les avant d'enregistrer.");
      } else {
        toast.error("Cette pièce n'a pas été reconnue. Aucun champ n'a été rempli au hasard.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Cette feuille n'a pas pu être lue.");
    } finally {
      setReadingSheet(false);
    }
  };

  const startDraft = () => {
    setDraft(applyProfile(emptyRequest(currentUserName, currentUserEmail), currentProfile));
    setStep("form");
  };

  const openRequest = (request: TransportCoverageRequest, asRh = false) => {
    setDraft(request);
    if (asRh && canCertify && request.statut === "en_attente_rh") setStep("rh");
    else if (request.statut === "en_attente_rh" || request.statut === "traitee") setStep("consult");
    else setStep("form");
  };

  const saveDraft = () => {
    if (!draft) return null;
    const saved = persist({ ...draft, statut: draft.statut === "traitee" ? "traitee" : draft.statut || "brouillon" });
    return saved;
  };

  const confirmRequest = () => {
    if (!draft) return;
    const saved = persist({ ...draft, statut: "en_attente_rh" });
    const holders = directory.filter((person) => certifierIds.includes(person.id));
    if (holders.length === 0) {
      toast.error("Aucun responsable DRH n'est désigné dans Rôles et Gestion des accès. La demande est enregistrée sans destinataire.");
    } else {
      holders.forEach((person) => {
        onNotify?.({
          recipientEmail: person.email,
          titre: "Demande de transport à traiter",
          contenu: `${saved.prenom} ${saved.nom} a déposé une demande. Le cadre DRH est à compléter.`,
        });
      });
      toast.success("Demande confirmée. Le DRH désigné a été prévenu.");
    }
    setStep("consult");
  };

  const validateByRh = () => {
    if (!draft) return;
    if (!draft.certificateurNom.trim()) {
      toast.error("Indiquez le nom de la personne qui certifie.");
      return;
    }
    const saved = persist({ ...draft, statut: "traitee" });
    onNotify?.({
      recipientEmail: saved.agentEmail,
      titre: "Demande de transport traitée",
      contenu: "Votre demande de prise en charge a été validée. Vous pouvez télécharger le PDF.",
    });
    toast.success("Demande validée. L'agent a été prévenu.");
    void openPreview(saved, "consult");
  };

  const openPreview = async (request: TransportCoverageRequest, from: "consult" | "rh") => {
    try {
      const response = await fetch(TRANSPORT_FORM_TEMPLATE_URL);
      if (!response.ok) throw new Error("Modèle introuvable");
      const bytes = await fillTransportCoveragePdf(await response.arrayBuffer(), request);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      setPreviewFrom(from);
      setStep("apercu");
    } catch (error) {
      console.error(error);
      toast.error("L'aperçu n'a pas pu être généré.");
    }
  };

  const closePreview = () => {
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setStep(previewFrom);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {step !== "apercu" ? <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Transports</h1>
                <p className="mt-1 max-w-2xl text-sm text-sky-50">
                  Prise en charge partielle des titres d'abonnement domicile-travail. La première saisie est recopiée dans la fiche profil des paramètres.
                </p>
              </div>
            </div>
            {step === "list" ? (
              <Button type="button" className="bg-white text-sky-800 hover:bg-sky-50" onClick={startDraft}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle demande
              </Button>
            ) : null}
          </div>
        </div> : null}

        {(step === "list" || step === "form") && <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            dropping ? "border-indigo-500 bg-indigo-50" : "border-sky-300 bg-white/80"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDropping(false);
            const file = event.dataTransfer.files[0];
            if (file) void importSheet(file);
          }}
        >
          <Upload className="h-6 w-6 text-sky-700" />
          <span className="text-sm font-medium text-slate-800">
            {readingSheet ? "Lecture de la feuille…" : "Glissez la feuille de transport (PDF)"}
          </span>
          <span className="text-xs text-slate-500">Titre d'abonnement ou formulaire officiel. Le fichier n'est pas conservé, seul son nom est indiqué.</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importSheet(file);
              event.target.value = "";
            }}
          />
        </label>}

        {step === "list" ? (
          <div className="flex flex-col gap-3">
            {canCertify ? (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-slate-700">À traiter</h2>
                {requestsToCertify.length === 0 ? (
                  <p className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm text-slate-500">Aucune demande en attente.</p>
                ) : (
                  requestsToCertify.map((request) => (
                    <article key={request.id} className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{request.prenom} {request.nom}</p>
                        <p className="mt-1 text-sm text-slate-600">{requestLine(request) || "Dossier à certifier"}</p>
                      </div>
                      <Button type="button" className="bg-amber-700 hover:bg-amber-800" onClick={() => openRequest(request, true)}>
                        Traiter
                      </Button>
                    </article>
                  ))
                )}
              </section>
            ) : null}
            {canCertify ? <h2 className="text-sm font-semibold text-slate-700">Mes demandes</h2> : null}
            {visibleRequests.filter((request) => !requestsToCertify.some((item) => item.id === request.id)).length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">Aucune demande enregistrée.</p>
            ) : (
              visibleRequests
                .filter((request) => !requestsToCertify.some((item) => item.id === request.id))
                .map((request) => {
                  const status = statusMeta(request.statut);
                  const locked = request.statut === "en_attente_rh" || request.statut === "traitee";
                  return (
                    <article key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{request.prenom} {request.nom}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{requestLine(request) || request.ministereDirectionAffectation || "Saisie incomplète"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="border-sky-200" onClick={() => openRequest(request)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {locked ? "Consulter" : "Modifier"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-rose-200 text-rose-700"
                          onClick={() => {
                            if (!window.confirm("Supprimer cette demande ?")) return;
                            setRequests((current) => (Array.isArray(current) ? current : []).filter((item) => item.id !== request.id));
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </article>
                  );
                })
            )}
          </div>
        ) : step === "form" && draft ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.nom.trim() || !draft.prenom.trim()) {
                toast.error("Le nom et le prénom sont nécessaires.");
                return;
              }
              saveDraft();
              setStep("recap");
              toast.success("Demande enregistrée. Relisez le récapitulatif avant de confirmer.");
            }}
          >
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraft(null);
                  setStep("list");
                }}
              >
                Retour à la liste
              </Button>
            </div>

            <Section title="Renseignements concernant l'agent" tone="sky">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Ministère / Direction / Affectation" value={draft.ministereDirectionAffectation} onChange={(value) => patch({ ministereDirectionAffectation: value })} />
                </div>
                <Field id="agent-nom" label="Nom" value={draft.nom} onChange={(value) => patch({ nom: value })} />
                <Field label="Prénom" value={draft.prenom} onChange={(value) => patch({ prenom: value })} />
                <Field
                  label="Numéro de sécurité sociale"
                  value={draft.numeroSecuriteSociale}
                  placeholder="15 chiffres"
                  onChange={(value) => patch({ numeroSecuriteSociale: value.replace(/\D/g, "").slice(0, 15) })}
                />
                <Field label="Matricule" value={draft.matricule} onChange={(value) => patch({ matricule: value })} />
                <Field label="Corps" value={draft.corps} onChange={(value) => patch({ corps: value })} />
                <Field label="Grade" value={draft.grade} onChange={(value) => patch({ grade: value })} />
                <DateField id="date-arrivee" label="Date d'arrivée dans la structure" value={draft.dateArriveeStructure} onChange={(value) => patch({ dateArriveeStructure: value })} />
              </div>
              <AddressSuggest
                idPrefix="domicile"
                title="Domicile habituel"
                value={{ rue: draft.domicileNumeroRue, commune: draft.domicileCommune, codePostal: draft.domicileCodePostal }}
                onChange={(value) => patch({ domicileNumeroRue: value.rue, domicileCommune: value.commune, domicileCodePostal: value.codePostal })}
              />
              <Field label="Arrêt, station, gare desservant le domicile" value={draft.domicileArret} onChange={(value) => patch({ domicileArret: value })} />
              <AddressSuggest
                idPrefix="travail"
                title="Lieu de travail"
                value={{ rue: draft.travailNumeroRue, commune: draft.travailCommune, codePostal: draft.travailCodePostal }}
                onChange={(value) => patch({ travailNumeroRue: value.rue, travailCommune: value.commune, travailCodePostal: value.codePostal })}
              />
              <Field label="Arrêt, station, gare desservant le lieu de travail" value={draft.travailArret} onChange={(value) => patch({ travailArret: value })} />
            </Section>

            <Section title="Titre d'abonnement souscrit" tone="indigo">
              <div className="flex flex-col gap-3">
                {(
                  [
                    ["abonnementHebdomadaire", "Carte ou abonnement hebdomadaire"],
                    ["abonnementMensuel", "Carte ou abonnement mensuel"],
                    ["abonnementAnnuel", "Carte ou abonnement annuel"],
                    ["abonnementVelo", "Abonnement à un service public de location de vélo"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 rounded-xl bg-indigo-50/70 px-3 py-2 text-sm text-slate-800">
                    <Checkbox className="mt-0.5" checked={draft[key]} onCheckedChange={(checked) => patch({ [key]: checked === true })} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ChoiceField id="mois-debut" label="Du mois de" value={draft.periodeMoisDebut} options={MOIS} onChange={(value) => patch({ periodeMoisDebut: value })} />
                <ChoiceField id="annee-debut" label="Année de début" value={draft.periodeAnneeDebut} options={ANNEES} onChange={(value) => patch({ periodeAnneeDebut: value })} />
                <ChoiceField id="mois-fin" label="Au mois de" value={draft.periodeMoisFin} options={MOIS} onChange={(value) => patch({ periodeMoisFin: value })} />
                <ChoiceField id="annee-fin" label="Année de fin" value={draft.periodeAnneeFin} options={ANNEES} onChange={(value) => patch({ periodeAnneeFin: value })} />
                <DateField id="semaine-du" label="Semaine du" value={draft.semaineDu} onChange={(value) => patch({ semaineDu: value })} />
                <DateField id="semaine-au" label="Semaine au" value={draft.semaineAu} onChange={(value) => patch({ semaineAu: value })} />
              </div>
              <div>
                <Label>Justificatifs d'achat</Label>
                {draft.feuilleJointeNom ? (
                  <p className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-sm text-indigo-900">
                    La pièce « {draft.feuilleJointeNom} » est déjà jointe depuis le dépôt du haut.
                  </p>
                ) : (
                  <label
                    className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-6 text-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer.files.length) rememberNames(event.dataTransfer.files);
                    }}
                  >
                    <Upload className="h-5 w-5 text-indigo-700" />
                    <span className="text-sm text-slate-700">Glissez un justificatif, ou cliquez pour le choisir</span>
                    <input
                      className="sr-only"
                      type="file"
                      multiple
                      onChange={(event) => {
                        if (event.target.files) rememberNames(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                )}
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {draft.justificatifs
                    .filter((file) => file.name !== draft.feuilleJointeNom)
                    .map((file) => (
                      <li key={file.id} className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2">
                        <span className="truncate text-indigo-900">{file.name}</span>
                        <button
                          type="button"
                          className="text-slate-500"
                          onClick={() => patch({ justificatifs: draft.justificatifs.filter((item) => item.id !== file.id) })}
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </Section>

            <Section title="Déclaration et signature" tone="amber">
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {DECLARATIONS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <label className="flex items-start gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-slate-800">
                <Checkbox className="mt-0.5" checked={draft.allocationSpeciale} onCheckedChange={(checked) => patch({ allocationSpeciale: checked === true })} />
                <span>Je sollicite une demande d'allocation spéciale.</span>
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-slate-900">Mode de transport utilisé</legend>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {(
                    [
                      ["vehicule", "Véhicule personnel"],
                      ["taxi", "Taxi"],
                      ["autres", "Autres"],
                    ] as const
                  ).map(([modeValue, label]) => (
                    <label key={modeValue} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm">
                      <input type="radio" name="mode-transport" checked={draft.modeTransport === modeValue} onChange={() => patch({ modeTransport: modeValue })} />
                      {label}
                    </label>
                  ))}
                </div>
                {draft.modeTransport === "autres" ? (
                  <div className="mt-3">
                    <Field label="Préciser le mode de transport" value={draft.modeTransportAutres} onChange={(value) => patch({ modeTransportAutres: value })} />
                  </div>
                ) : null}
              </fieldset>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateField id="fait-le" label="Fait le" value={draft.faitLe} onChange={(value) => patch({ faitLe: value })} />
                <Field label="À" value={draft.faitA} onChange={(value) => patch({ faitA: value })} />
              </div>
              <div>
                <Label>Signature</Label>
                <p className="mb-2 text-xs text-slate-500">Signez au doigt ou à la souris. Le tracé est repris sur le PDF.</p>
                <SignaturePad value={draft.signatureImage} onChange={(signatureImage) => patch({ signatureImage })} />
              </div>
            </Section>
            <Button type="submit" className="h-12 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-base hover:from-sky-700 hover:to-indigo-700">
              Enregistrer
            </Button>
          </form>
        ) : step === "recap" && draft ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Confirmation des saisies</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                ["Nom", `${draft.prenom} ${draft.nom}`],
                ["Sécurité sociale", draft.numeroSecuriteSociale],
                ["Domicile", [draft.domicileNumeroRue, draft.domicileCodePostal, draft.domicileCommune].filter(Boolean).join(" ")],
                ["Arrêt domicile", draft.domicileArret],
                ["Lieu de travail", [draft.travailNumeroRue, draft.travailCodePostal, draft.travailCommune].filter(Boolean).join(" ")],
                ["Arrêt travail", draft.travailArret],
                ["Période", `${draft.periodeMoisDebut} ${draft.periodeAnneeDebut} — ${draft.periodeMoisFin} ${draft.periodeAnneeFin}`],
                ["Montant", draft.montantTotalMensuel || draft.montantHorsIleDeFrance],
                ["Pièce", draft.feuilleJointeNom || "Aucune"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-sky-50 px-3 py-2">
                  <dt className="text-xs uppercase tracking-wide text-sky-800">{label}</dt>
                  <dd className="text-slate-900">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setStep("form")}>
                Corriger
              </Button>
              <Button type="button" className="bg-indigo-700 hover:bg-indigo-800" onClick={confirmRequest}>
                <Check className="mr-2 h-4 w-4" />
                Confirmer
              </Button>
            </div>
          </section>
        ) : step === "consult" && draft ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {draft.prenom} {draft.nom}
                </h2>
                <p className="text-sm text-slate-600">
                  {draft.statut === "traitee" ? "Demande traitée" : "En attente du cadre DRH"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(null);
                    setStep("list");
                  }}
                >
                  Retour à la liste
                </Button>
                <Button type="button" variant="outline" className="border-indigo-200" onClick={() => void openPreview(draft, "consult")}>
                  <Eye className="mr-2 h-4 w-4" />
                  Aperçu
                </Button>
                <Button type="button" className="bg-sky-700 hover:bg-sky-800" onClick={() => void downloadPdf(draft)}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le PDF
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {[
                ["Parcours", `${draft.domicileArret || draft.domicileCommune} → ${draft.travailArret || draft.travailCommune}`],
                ["Période", `${draft.periodeMoisDebut} ${draft.periodeAnneeDebut} — ${draft.periodeMoisFin} ${draft.periodeAnneeFin}`],
                ["Montant mensuel", draft.montantTotalMensuel ? `${draft.montantTotalMensuel} €` : ""],
                ["Pièce", draft.feuilleJointeNom || ""],
                ["Certifié par", [draft.certificateurNom, draft.certificateurFonction].filter(Boolean).join(", ")],
              ]
                .filter(([, value]) => value.trim() && value.trim() !== "→")
                .map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-slate-900">{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ) : step === "rh" && draft ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Cadre réservé au DRH</p>
                <h2 className="text-lg font-semibold text-slate-900">{draft.prenom} {draft.nom}</h2>
                <p className="text-sm text-slate-600">{requestLine(draft)}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => { setDraft(null); setStep("list"); }}>
                Retour à la liste
              </Button>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {[
                ["Agent", `${draft.prenom} ${draft.nom}`],
                ["Matricule", draft.matricule],
                ["Domicile", [draft.domicileNumeroRue, draft.domicileCodePostal, draft.domicileCommune].filter(Boolean).join(" ")],
                ["Travail", [draft.travailNumeroRue, draft.travailCodePostal, draft.travailCommune].filter(Boolean).join(" ")],
                ["Période", `${draft.periodeMoisDebut} ${draft.periodeAnneeDebut} — ${draft.periodeMoisFin} ${draft.periodeAnneeFin}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-amber-50 px-3 py-2">
                  <dt className="text-xs text-amber-900">{label}</dt>
                  <dd className="text-slate-900">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Île-de-France" value={draft.montantIleDeFrance} onChange={(value) => patch({ montantIleDeFrance: value })} />
              <Field label="Zones concernées par le titre" value={draft.zonesIleDeFrance} onChange={(value) => patch({ zonesIleDeFrance: value })} />
              <Field label="Hors Île-de-France" value={draft.montantHorsIleDeFrance} onChange={(value) => patch({ montantHorsIleDeFrance: value })} />
              <Field label="Zones traversées" value={draft.zonesHorsIleDeFrance} onChange={(value) => patch({ zonesHorsIleDeFrance: value })} />
              <Field label="Location vélo" value={draft.montantLocationVelo} onChange={(value) => patch({ montantLocationVelo: value })} />
              <Field label="Montant total mensuel" value={draft.montantTotalMensuel} onChange={(value) => patch({ montantTotalMensuel: value })} />
              <Field id="brh-nom" label="Nom du certificateur" value={draft.certificateurNom} onChange={(value) => patch({ certificateurNom: value })} />
              <DateField id="brh-date" label="Date et cachet" value={draft.certificateurDate} onChange={(value) => patch({ certificateurDate: value })} />
              <Field label="Fonction" value={draft.certificateurFonction} onChange={(value) => patch({ certificateurFonction: value })} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => void openPreview(draft, "rh")}>
                <Eye className="mr-2 h-4 w-4" />
                Voir le PDF
              </Button>
              <Button type="button" className="bg-amber-700 hover:bg-amber-800" onClick={validateByRh}>
                Valider le cadre DRH
              </Button>
            </div>
          </section>
        ) : step === "apercu" && previewUrl ? (
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Aperçu du formulaire</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={closePreview}>
                  Retour
                </Button>
                {draft ? (
                  <Button type="button" className="bg-sky-700 hover:bg-sky-800" onClick={() => void downloadPdf(draft)}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le PDF
                  </Button>
                ) : null}
              </div>
            </div>
            <iframe title="Aperçu du formulaire" src={previewUrl} className="h-[78vh] w-full rounded-xl border border-slate-200 bg-white" />
          </section>
        ) : null}
    </div>
  );
}
