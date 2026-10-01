import React, { useEffect, useMemo, useRef, useState } from "react";
import { isBackendApiEnabled } from "@/app/config/dataBackend";
import { isApiAccessToken } from "@/lib/apiClient";
import {
  APP_DATA_KEYS,
  fetchAppData,
  saveAppData,
} from "@/app/services/appDataApi";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { Activity, AlertTriangle, ArrowLeft, Building2, CalendarDays, CheckCircle2, Download, Edit3, FileText, Layers, MapPin, PlusCircle, Search, Shield, Siren, Trash2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { ListPaginationBar } from "@/app/components/ui/list-pagination-bar";
import {
  loadDeletedProtocols,
  loadSafetyProtocols,
  saveDeletedProtocols,
  saveSafetyProtocols,
  type ProtocolAttachment,
} from "@/app/utils/lecompasStorage";

type ProtocolStatus = "brouillon" | "valide" | "signe";

interface ProtocolRecord {
  id: string;
  title: string;
  operationType: string;
  service: string;
  domain: string;
  location: string;
  entreprise1: string;
  entreprise2: string;
  responsable: string;
  date: string;
  status: ProtocolStatus;
  risques: string;
  mesures: string;
  urgence: string;
  signatures: string;
  circulation: string;
  documents: string[];
  attachments?: ProtocolAttachment[];
  signatureDematerialiseeUrl?: string;
}

interface DeletedProtocolRecord {
  deletedAt: string;
  protocol: ProtocolRecord;
}

interface SafetyProtocolViewProps {
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
  currentUserService: string;
  currentUserDomain: string;
  currentUserLocation: string;
  serviceOptions: string[];
  domainOptions: string[];
  locationOptions: string[];
  accessToken?: string;
}

type ViewMode = "list" | "detail" | "create" | "edit";

const statusLabel: Record<ProtocolStatus, string> = {
  brouillon: "Brouillon",
  valide: "Valide",
  signe: "Signe",
};

const statusClass: Record<ProtocolStatus, string> = {
  brouillon: "bg-amber-100 text-amber-800 border-amber-300",
  valide: "bg-blue-100 text-blue-800 border-blue-300",
  signe: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const defaultProtocols: ProtocolRecord[] = [
  {
    id: "proto-2024-03-19",
    title: "Protocole de sécurité - Manutention cabestan 700 kg",
    operationType: "Chargement / déchargement",
    service: "Sécurité",
    domain: "Phares et balises",
    location: "Quai du commerce - Ajaccio",
    entreprise1: "Armement des Phares et Balises (APB)",
    entreprise2: "Société Insulaire Pétrolière (SIP)",
    responsable: "M. Vincent Crumiere",
    date: "2024-03-19",
    status: "signe",
    risques: "Risque manutention mécanique et au levage",
    mesures: "Port des EPI, suivi des élingues, CACES et vérifications périodiques des appareils de levage.",
    urgence: "SAMU 15, Pompiers 18, Police/Gendarmerie 17, numéro unique 112.",
    signatures: "DIRM Med / SPBM / COB Ajaccio, APB, SIP",
    circulation: "Zone de manutention quai du commerce (cf plan de circulation).",
    documents: [],
    attachments: [],
  },
];

export function SafetyProtocolView({
  currentUserRole,
  currentUserName,
  currentUserService,
  currentUserDomain,
  currentUserLocation,
  serviceOptions,
  domainOptions,
  locationOptions,
  accessToken = "",
}: SafetyProtocolViewProps) {
  const protocolsSkipRef = useRef(false);
  const deletedProtocolsSkipRef = useRef(false);
  const [protocols, setProtocols] = useState<ProtocolRecord[]>(
    () => loadSafetyProtocols() ?? defaultProtocols,
  );
  const [deletedProtocols, setDeletedProtocols] = useState<DeletedProtocolRecord[]>(
    () => loadDeletedProtocols() ?? [],
  );

  useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      return;
    }
    protocolsSkipRef.current = true;
    deletedProtocolsSkipRef.current = true;
    void (async () => {
      try {
        const [fromApiProtocols, fromApiDeleted] = await Promise.all([
          fetchAppData<ProtocolRecord[]>(
            APP_DATA_KEYS.safetyProtocols,
            accessToken,
          ),
          fetchAppData<DeletedProtocolRecord[]>(
            APP_DATA_KEYS.deletedProtocols,
            accessToken,
          ),
        ]);
        if (fromApiProtocols && fromApiProtocols.length > 0) {
          setProtocols(fromApiProtocols);
        } else {
          const local = loadSafetyProtocols() ?? defaultProtocols;
          setProtocols(local);
          protocolsSkipRef.current = false;
          await saveAppData(APP_DATA_KEYS.safetyProtocols, local, accessToken);
          protocolsSkipRef.current = true;
        }
        if (fromApiDeleted) {
          setDeletedProtocols(fromApiDeleted);
        }
      } catch (error) {
        console.warn("[Lecompas] chargement protocoles API", error);
      }
    })();
  }, [accessToken]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProtocolStatus>("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [form, setForm] = useState({
    title: "",
    operationType: "Chargement / déchargement",
    service: currentUserService || serviceOptions[0] || "",
    domain: currentUserDomain || domainOptions[0] || "",
    location: currentUserLocation || locationOptions[0] || "",
    entreprise1: "Armement des Phares et Balises (APB)",
    entreprise2: "",
    responsable: currentUserName,
    date: new Date().toISOString().slice(0, 10),
    status: "brouillon" as ProtocolStatus,
    risques: "",
    mesures: "",
    urgence: "SAMU 15, Pompiers 18, Police/Gendarmerie 17, numéro unique 112.",
    signatures: "",
    circulation: "",
    docsText: "",
  });
  const [docDraft, setDocDraft] = useState("");
  const [formAttachments, setFormAttachments] = useState<ProtocolAttachment[]>([]);
  const [signatureDematerialiseeUrl, setSignatureDematerialiseeUrl] = useState("");
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUserRole !== "agent";

  const visibleProtocols = useMemo(() => {
    return protocols.filter((protocol) => {
      if (statusFilter !== "all" && protocol.status !== statusFilter) return false;
      if (serviceFilter !== "all" && protocol.service !== serviceFilter) return false;
      if (domainFilter !== "all" && protocol.domain !== domainFilter) return false;
      if (locationFilter !== "all" && protocol.location !== locationFilter) return false;
      const lower = query.trim().toLowerCase();
      if (!lower) return true;
      return (
        protocol.title.toLowerCase().includes(lower) ||
        protocol.location.toLowerCase().includes(lower) ||
        protocol.service.toLowerCase().includes(lower) ||
        protocol.domain.toLowerCase().includes(lower) ||
        protocol.entreprise1.toLowerCase().includes(lower) ||
        protocol.entreprise2.toLowerCase().includes(lower)
      );
    });
  }, [protocols, query, statusFilter, serviceFilter, domainFilter, locationFilter]);

  const selectedProtocol = protocols.find((protocol) => protocol.id === selectedId) || null;
  const signedCount = visibleProtocols.filter((protocol) => protocol.status === "signe").length;
  const draftCount = visibleProtocols.filter((protocol) => protocol.status === "brouillon").length;
  const formCompletion = [form.title, form.service, form.domain, form.location, form.entreprise1, form.entreprise2, form.risques, form.mesures, form.urgence, form.signatures, form.circulation].filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(visibleProtocols.length / pageSize));
  const paginatedProtocols = useMemo(
    () => visibleProtocols.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visibleProtocols, currentPage],
  );

  const resetForm = () => {
    setForm({
      title: "",
      operationType: "Chargement / déchargement",
      service: currentUserService || serviceOptions[0] || "",
      domain: currentUserDomain || domainOptions[0] || "",
      location: currentUserLocation || locationOptions[0] || "",
      entreprise1: "Armement des Phares et Balises (APB)",
      entreprise2: "",
      responsable: currentUserName,
      date: new Date().toISOString().slice(0, 10),
      status: "brouillon",
      risques: "",
      mesures: "",
      urgence: "SAMU 15, Pompiers 18, Police/Gendarmerie 17, numéro unique 112.",
      signatures: "",
      circulation: "",
      docsText: "",
    });
    setDocDraft("");
    setFormAttachments([]);
    setSignatureDematerialiseeUrl("");
  };

  const openCreate = () => {
    resetForm();
    setSelectedId(null);
    setViewMode("create");
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setViewMode("detail");
  };

  const openEdit = (protocol: ProtocolRecord) => {
    setSelectedId(protocol.id);
    setForm({
      title: protocol.title,
      operationType: protocol.operationType,
      service: protocol.service,
      domain: protocol.domain,
      location: protocol.location,
      entreprise1: protocol.entreprise1,
      entreprise2: protocol.entreprise2,
      responsable: currentUserName,
      date: protocol.date,
      status: protocol.status,
      risques: protocol.risques,
      mesures: protocol.mesures,
      urgence: protocol.urgence,
      signatures: protocol.signatures,
      circulation: protocol.circulation,
      docsText: (protocol.documents || []).join("\n"),
    });
    setFormAttachments(protocol.attachments || []);
    setSignatureDematerialiseeUrl(protocol.signatureDematerialiseeUrl || "");
    setDocDraft("");
    setViewMode("edit");
  };

  const saveForm = () => {
    if (!form.title.trim()) return;
    const documents = form.docsText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);

    if (viewMode === "edit" && selectedId) {
      setProtocols((prev) =>
        prev.map((protocol) =>
          protocol.id === selectedId
            ? {
                ...protocol,
                ...form,
                documents,
                attachments: formAttachments,
                signatureDematerialiseeUrl,
                responsable: currentUserName,
              }
            : protocol,
        ),
      );
      toast.success("Protocole modifié.");
    } else {
      setProtocols((prev) => [
        {
          id: `proto-custom-${Date.now()}`,
          ...form,
          documents,
          attachments: formAttachments,
          signatureDematerialiseeUrl,
          responsable: currentUserName,
        },
        ...prev,
      ]);
      toast.success("Protocole créé.");
    }

    setViewMode("list");
    setSelectedId(null);
    resetForm();
  };

  const deleteProtocol = (id: string) => {
    const protocol = protocols.find((item) => item.id === id);
    if (!protocol) return;

    const confirmed = window.confirm(`Supprimer le protocole "${protocol.title}" ?`);
    if (!confirmed) return;

    setDeletedProtocols((prev) => [
      { deletedAt: new Date().toISOString(), protocol },
      ...prev,
    ]);
    setProtocols((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setViewMode("list");
    }
    toast.success("Protocole supprimé.");
  };

  const restoreProtocol = (id: string) => {
    const deleted = deletedProtocols.find((item) => item.protocol.id === id);
    if (!deleted) return;
    setProtocols((prev) => [deleted.protocol, ...prev]);
    setDeletedProtocols((prev) => prev.filter((item) => item.protocol.id !== id));
    toast.success("Protocole restauré.");
  };

  const handleDownloadProtocol = async (protocol: ProtocolRecord) => {
    try {
      const { downloadSafetyProtocolVisualPdf } = await import("./safetyProtocolVisualPdf");
      const visualOk = await downloadSafetyProtocolVisualPdf(protocol);
      if (visualOk) {
        toast.success("PDF téléchargé (mise en page proche de la fiche à l'écran).");
        return;
      }
    } catch {
      // fallback texte ci-dessous
    }
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

      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("PROTOCOLE DE SECURITE", margin, 9);
      doc.setTextColor(0, 0, 0);
      y = 20;

      addTitle(protocol.title);
      addBlock("Code du travail", "Articles R4515-4 a R4515-11");
      addBlock("Type d'operation", protocol.operationType);
      addBlock("Date", protocol.date);
      addBlock("Responsable", protocol.responsable);
      addBlock("Service", protocol.service);
      addBlock("Domaine", protocol.domain);
      addBlock("Lieu", protocol.location);
      addBlock("1) Entreprise APB", protocol.entreprise1);
      addBlock("2) Societe intervenante", protocol.entreprise2);
      addBlock("4) Evaluation des risques", protocol.risques);
      addBlock("Mesures de prevention", protocol.mesures);
      addBlock("5) Premiers secours", protocol.urgence);
      addBlock("8) Signatures", protocol.signatures);
      addBlock("10) Plan de circulation / dechargement", protocol.circulation);
      addBlock("Documents associes", protocol.documents?.length ? protocol.documents.join("\n") : "-");
      if (protocol.attachments?.length) {
        addBlock(
          "Pieces jointes",
          protocol.attachments.map((att) => `${att.fileName} (${Math.round(att.sizeBytes / 1024)} Ko)`).join("\n"),
        );
      }

      doc.save(`protocole-securite-${protocol.id}.pdf`);
      toast.success("Protocole telecharge en PDF.");
    } catch (error) {
      toast.error("Impossible de generer le PDF.");
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, serviceFilter, domainFilter, locationFilter]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveSafetyProtocols(protocols);
      return;
    }
    if (protocolsSkipRef.current) {
      protocolsSkipRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(
        APP_DATA_KEYS.safetyProtocols,
        protocols,
        accessToken,
      ).catch((error) => {
        console.error("[Lecompas] sync protocoles API", error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [protocols, accessToken]);

  React.useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveDeletedProtocols(deletedProtocols);
      return;
    }
    if (deletedProtocolsSkipRef.current) {
      deletedProtocolsSkipRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(
        APP_DATA_KEYS.deletedProtocols,
        deletedProtocols,
        accessToken,
      ).catch((error) => {
        console.error("[Lecompas] sync corbeille protocoles API", error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [deletedProtocols, accessToken]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      setDeletedProtocols((prev) =>
        prev.filter((item) => now - new Date(item.deletedAt).getTime() < ONE_WEEK_MS),
      );
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if ((viewMode === "create" || viewMode === "edit") && canEdit) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {viewMode === "create" ? "Nouveau protocole de sécurité" : "Modifier le protocole de sécurité"}
            </h2>
            <p className="text-slate-600 mt-1">Structure alignée sur la logique d'évaluation des risques.</p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="default"
              onClick={() => setViewMode("list")}
              className="w-full sm:w-auto font-semibold shadow-sm border-2 border-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      {viewMode === "create" ? "Création du protocole" : "Édition du protocole"}
                    </CardTitle>
                    <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md">
                      Structure consultation Évaluation des risques
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl shadow-lg border border-gray-200 text-gray-800 space-y-4">
                <h3 className="text-xl font-bold flex items-center mb-2 text-gray-700">
                  <Building2 className="h-5 w-5 mr-2" />
                  Identification du protocole
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre du protocole *</Label>
                    <Input className="border-2 border-slate-300" placeholder="Ex: Manutention cabestan 700kg" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type d'opération</Label>
                    <Input className="border-2 border-slate-300" placeholder="Chargement / Déchargement / Héliportage" value={form.operationType} onChange={(e) => setForm((prev) => ({ ...prev, operationType: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsable (utilisateur connecté)</Label>
                    <Input className="border-2 border-slate-300 bg-slate-100" value={form.responsable} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input className="border-2 border-slate-300" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={form.service} onValueChange={(value) => setForm((prev) => ({ ...prev, service: value }))}>
                      <SelectTrigger className="border-2 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((service) => (
                          <SelectItem key={service} value={service}>{service}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Domaine</Label>
                    <Select value={form.domain} onValueChange={(value) => setForm((prev) => ({ ...prev, domain: value }))}>
                      <SelectTrigger className="border-2 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {domainOptions.map((domain) => (
                          <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lieux</Label>
                    <Select value={form.location} onValueChange={(value) => setForm((prev) => ({ ...prev, location: value }))}>
                      <SelectTrigger className="border-2 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((location) => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={form.status} onValueChange={(value: ProtocolStatus) => setForm((prev) => ({ ...prev, status: value }))}>
                      <SelectTrigger className="border-2 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="signe">Signé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                  Entreprises concernées (Sections 1 et 2)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entreprise APB</Label>
                    <Input className="border-2 border-slate-300" value={form.entreprise1} onChange={(e) => setForm((prev) => ({ ...prev, entreprise1: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Société intervenante</Label>
                    <Input className="border-2 border-slate-300" value={form.entreprise2} onChange={(e) => setForm((prev) => ({ ...prev, entreprise2: e.target.value }))} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                  Évaluation des risques (Section 4)
                </h4>
                <Textarea className="border-2 border-slate-300 min-h-[120px]" placeholder="Domaine, nature des risques, circonstances..." value={form.risques} onChange={(e) => setForm((prev) => ({ ...prev, risques: e.target.value }))} />
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Mesures de prévention
                </h4>
                <Textarea className="border-2 border-slate-300 min-h-[120px]" placeholder="EPI, consignes, habilitations, vérifications périodiques..." value={form.mesures} onChange={(e) => setForm((prev) => ({ ...prev, mesures: e.target.value }))} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Siren className="h-4 w-4 mr-2 text-red-500" />
                    Premiers secours (Section 5)
                  </h4>
                  <Textarea className="border-2 border-slate-300 min-h-[88px]" value={form.urgence} onChange={(e) => setForm((prev) => ({ ...prev, urgence: e.target.value }))} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-violet-500" />
                    Signatures (Section 8)
                  </h4>
                  <Textarea className="border-2 border-slate-300 min-h-[88px]" value={form.signatures} onChange={(e) => setForm((prev) => ({ ...prev, signatures: e.target.value }))} />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 800 * 1024) {
                          toast.error("Image de signature trop volumineuse (max. 800 Ko).");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setSignatureDematerialiseeUrl(String(reader.result || ""));
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => signatureInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Joindre une signature (image)
                    </Button>
                    {signatureDematerialiseeUrl ? (
                      <Button type="button" variant="ghost" className="text-red-600" onClick={() => setSignatureDematerialiseeUrl("")}>
                        Retirer la signature
                      </Button>
                    ) : null}
                  </div>
                  {signatureDematerialiseeUrl ? (
                    <img src={signatureDematerialiseeUrl} alt="Aperçu signature" className="mt-2 max-h-24 rounded border border-slate-200" />
                  ) : null}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                    Plan de circulation / déchargement (Section 10)
                  </h4>
                  <Textarea className="border-2 border-slate-300 min-h-[88px]" value={form.circulation} onChange={(e) => setForm((prev) => ({ ...prev, circulation: e.target.value }))} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-violet-500" />
                    Documents associés
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                    <Input
                      className="border-2 border-slate-300"
                      placeholder="Nom du document / lien partagé"
                      value={docDraft}
                      onChange={(e) => setDocDraft(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const value = docDraft.trim();
                        if (!value) return;
                        const current = form.docsText
                          .split("\n")
                          .map((v) => v.trim())
                          .filter(Boolean);
                        if (current.includes(value)) return;
                        setForm((prev) => ({
                          ...prev,
                          docsText: [...current, value].join("\n"),
                        }));
                        setDocDraft("");
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {form.docsText
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .map((doc) => (
                        <div key={doc} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                          <span className="truncate">{doc}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                docsText: prev.docsText
                                  .split("\n")
                                  .map((v) => v.trim())
                                  .filter(Boolean)
                                  .filter((v) => v !== doc)
                                  .join("\n"),
                              }))
                            }
                          >
                            Retirer
                          </Button>
                        </div>
                      ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files?.length) return;
                        Array.from(files).forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setFormAttachments((prev) => [
                              ...prev,
                              {
                                id: crypto.randomUUID(),
                                fileName: file.name,
                                mimeType: file.type || "application/octet-stream",
                                dataUrl: String(reader.result || ""),
                                sizeBytes: file.size,
                              },
                            ]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => attachmentInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Joindre un fichier
                    </Button>
                  </div>
                  {formAttachments.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {formAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50 p-2 text-sm">
                          <span className="truncate">{att.fileName}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() =>
                              setFormAttachments((prev) => prev.filter((item) => item.id !== att.id))
                            }
                          >
                            Retirer
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                  Avancement formulaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${(formCompletion / 11) * 100}%` }} />
                </div>
                <p className="text-sm text-gray-600">{formCompletion}/11 champs principaux renseignés</p>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {statusLabel[form.status]}
                </Badge>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Résumé rapide</CardTitle>
                <CardDescription className="text-slate-300">Prévisualisation proche de la vue consultation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Titre</p>
                  <p className="font-semibold mt-1">{form.title || "Non renseigné"}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Responsable</p>
                  <p className="font-semibold mt-1">{form.responsable || "-"}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Site</p>
                  <p className="font-semibold mt-1">{form.location || "-"}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <p className="text-xs uppercase text-slate-300">Service / Domaine</p>
                  <p className="font-semibold mt-1">{form.service || "-"}</p>
                  <p className="font-semibold mt-1">{form.domain || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-2 border-indigo-100 bg-white/95">
          <CardContent className="py-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setViewMode("list")} className="w-full sm:w-auto">Annuler</Button>
            <Button onClick={saveForm} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              {viewMode === "create" ? "Enregistrer le protocole" : "Mettre à jour le protocole"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === "detail" && selectedProtocol) {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleDownloadProtocol(selectedProtocol)}
              className="w-full sm:w-auto border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            {canEdit ? (
              <Button
                onClick={() => openEdit(selectedProtocol)}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                variant="destructive"
                onClick={() => deleteProtocol(selectedProtocol.id)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            ) : null}
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="default"
              onClick={() => setViewMode("list")}
              className="w-full sm:w-auto font-semibold shadow-sm border-2 border-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Protocole de sécurité</p>
                  <CardTitle className="text-2xl mt-1 leading-snug">{selectedProtocol.title}</CardTitle>
                  <CardDescription className="text-emerald-100 mt-2">
                    Code du Travail — articles R4515-4 à R4515-11
                  </CardDescription>
                </div>
              </div>
              <Badge className={statusClass[selectedProtocol.status]}>{statusLabel[selectedProtocol.status]}</Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-2 border-indigo-100 bg-indigo-50/70">
            <CardContent className="p-4">
              <p className="text-xs text-indigo-700 font-semibold uppercase">Service</p>
              <p className="font-semibold text-indigo-900 mt-1">{selectedProtocol.service || "—"}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-teal-100 bg-teal-50/70">
            <CardContent className="p-4">
              <p className="text-xs text-teal-700 font-semibold uppercase">Domaine</p>
              <p className="font-semibold text-teal-900 mt-1">{selectedProtocol.domain || "—"}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-cyan-100 bg-cyan-50/70">
            <CardContent className="p-4">
              <p className="text-xs text-cyan-700 font-semibold uppercase">Lieu</p>
              <p className="font-semibold text-cyan-900 mt-1">{selectedProtocol.location || "—"}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-100 bg-emerald-50/70">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700 font-semibold uppercase">Responsable</p>
              <p className="font-semibold text-emerald-900 mt-1">{selectedProtocol.responsable || "—"}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Type d&apos;opération et calendrier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Opération :</span> {selectedProtocol.operationType}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-sm">
                <p className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Date du protocole
                </p>
                <p className="font-semibold text-slate-900 mt-1">{selectedProtocol.date || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-sm">
                <p className="text-xs text-slate-500 font-semibold uppercase">Référence</p>
                <p className="font-semibold text-slate-900 mt-1">{selectedProtocol.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-2 border-indigo-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-indigo-900">1) Entreprise APB</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="rounded-lg bg-indigo-50 p-3">
                <p className="text-xs text-indigo-700 font-semibold uppercase">Désignation</p>
                <p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.entreprise1 || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-teal-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-900">2) Société intervenante</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="text-xs text-teal-700 font-semibold uppercase">Désignation</p>
                <p className="text-slate-800 mt-1 whitespace-pre-wrap">{selectedProtocol.entreprise2 || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">3) Site et contexte d&apos;intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-slate-800">
              <p className="text-xs text-amber-700 font-semibold uppercase mb-1">Lieu d&apos;intervention</p>
              <p className="whitespace-pre-wrap">{selectedProtocol.location || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">4) Évaluation des risques et mesures (CT R4515-5)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-slate-200">
              <div>
                <div className="bg-slate-100 p-3 text-xs font-bold uppercase text-slate-700">Nature des risques</div>
                <div className="p-3 text-sm text-slate-800 whitespace-pre-wrap bg-white min-h-[4rem]">
                  {selectedProtocol.risques || "—"}
                </div>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-slate-200">
                <div className="bg-slate-100 p-3 text-xs font-bold uppercase text-slate-700">Mesures de prévention</div>
                <div className="p-3 text-sm text-slate-800 whitespace-pre-wrap bg-white min-h-[4rem]">
                  {selectedProtocol.mesures || "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-2 border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-emerald-900">5) Premiers secours (CT R4515-6)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-slate-800 whitespace-pre-wrap">
                {selectedProtocol.urgence || "—"}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-orange-900">6) Statut et suivi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="rounded-lg bg-orange-50 p-3">
                <p className="text-xs text-orange-700 font-semibold uppercase">Statut document</p>
                <Badge className={`${statusClass[selectedProtocol.status]} mt-1`}>
                  {statusLabel[selectedProtocol.status]}
                </Badge>
              </div>
              <p className="text-slate-600 text-xs">
                Sections couvertes : entreprises, risques, mesures, secours, signatures, plan de circulation.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-rose-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-rose-900">8) Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap rounded-xl border border-rose-200 bg-rose-50/60 p-4">
              {selectedProtocol.signatures || "—"}
            </p>
            {selectedProtocol.signatureDematerialiseeUrl ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-white p-2">
                <p className="text-[10px] font-semibold uppercase text-rose-800 mb-1">Signature dématérialisée</p>
                <img src={selectedProtocol.signatureDematerialiseeUrl} alt="" className="max-h-28 object-contain" />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-2 border-sky-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-sky-900">10) Plan de circulation et de déchargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedProtocol.circulation || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-violet-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-violet-900">Documents associés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(selectedProtocol.documents || []).length > 0 ? (
              selectedProtocol.documents.map((doc) => (
                <div key={doc} className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-slate-800">
                  {doc}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Aucun document associé.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Protocoles de sécurité</h1>
            <p className="text-gray-600 mt-1">Pilotage des protocoles opérationnels de chargement, déchargement et levage.</p>
          </div>
        </div>
        {canEdit ? (
          <Button onClick={openCreate} className="w-full lg:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau protocole
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-indigo-50"><CardContent className="p-4"><p className="text-xs text-violet-700 uppercase font-semibold">Protocoles visibles</p><p className="text-2xl font-bold text-violet-900 mt-1">{visibleProtocols.length}</p></CardContent></Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50"><CardContent className="p-4"><p className="text-xs text-emerald-700 uppercase font-semibold">Signés</p><p className="text-2xl font-bold text-emerald-900 mt-1">{signedCount}</p></CardContent></Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4"><p className="text-xs text-amber-700 uppercase font-semibold">Brouillons</p><p className="text-2xl font-bold text-amber-900 mt-1">{draftCount}</p></CardContent></Card>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:flex-1">
              <div className="relative w-full xl:max-w-md">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (titre, service, domaine, lieu, entreprise...)" className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={(value: "all" | ProtocolStatus) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="valide">Valide</SelectItem>
                  <SelectItem value="signe">Signe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Domaine" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {domainOptions.map((domain) => (
                    <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Lieux" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les lieux</SelectItem>
                  {locationOptions.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-600">{visibleProtocols.length} protocole(s) affiché(s)</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setServiceFilter("all");
                  setDomainFilter("all");
                  setLocationFilter("all");
                  setCurrentPage(1);
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {paginatedProtocols.map((protocol) => (
          <Card key={protocol.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-indigo-600">{protocol.operationType}</p>
                    <p className="text-lg font-semibold text-slate-900 leading-snug">{protocol.title}</p>
                  </div>
                </div>
                <Badge className={statusClass[protocol.status]}>{statusLabel[protocol.status]}</Badge>
              </div>
              <CardDescription className="text-slate-700 flex items-center gap-2"><MapPin className="h-4 w-4" />{protocol.location}</CardDescription>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Service :</span>
                  <span className="text-sm font-semibold text-blue-700">{protocol.service}</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">Domaine :</span>
                  <span className="text-sm font-semibold text-indigo-700">{protocol.domain}</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Lieu :</span>
                  <span className="text-sm font-semibold text-emerald-700">{protocol.location}</span>
                </div>
                <p className="flex items-start gap-2"><Building2 className="h-4 w-4 mt-0.5 text-violet-600" /><span><span className="font-semibold">Entreprise 1:</span> {protocol.entreprise1}</span></p>
                <p className="flex items-start gap-2"><Building2 className="h-4 w-4 mt-0.5 text-fuchsia-600" /><span><span className="font-semibold">Entreprise 2:</span> {protocol.entreprise2}</span></p>
                <p className="flex items-start gap-2"><User className="h-4 w-4 mt-0.5 text-slate-500" /><span><span className="font-semibold">Responsable:</span> {protocol.responsable || "-"}</span></p>
                <p className="flex items-start gap-2"><CalendarDays className="h-4 w-4 mt-0.5 text-slate-500" /><span><span className="font-semibold">Date:</span> {protocol.date || "-"}</span></p>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Avancement sections protocole
                  </span>
                  <span className="font-bold text-purple-600">
                    {[protocol.risques, protocol.mesures, protocol.urgence, protocol.signatures, protocol.circulation].filter(Boolean).length}/5
                  </span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${([protocol.risques, protocol.mesures, protocol.urgence, protocol.signatures, protocol.circulation].filter(Boolean).length / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-semibold">Statut</Label>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-indigo-50 border-indigo-400 text-indigo-700">
                    {statusLabel[protocol.status]}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-semibold">Date protocole</Label>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-cyan-50 border-cyan-400 text-cyan-700">
                    {protocol.date || "-"}
                  </div>
                </div>
              </div>

              <Badge className="w-full justify-center capitalize font-bold border-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {protocol.operationType}
              </Badge>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:flex-1" onClick={() => openDetail(protocol.id)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter
                </Button>
                {canEdit ? (
                  <>
                    <Button className="w-full sm:flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700" onClick={() => openEdit(protocol)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={() => deleteProtocol(protocol.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ListPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={visibleProtocols.length}
        onPageChange={setCurrentPage}
        itemLabel="protocole(s)"
      />

      {deletedProtocols.length > 0 ? (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Corbeille protocoles (7 jours)</CardTitle>
            <CardDescription>
              Les protocoles supprimés sont conservés 7 jours puis purgés automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {deletedProtocols.map((item) => (
              <div key={item.protocol.id} className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.protocol.title}</p>
                  <p className="text-xs text-slate-500">Supprimé le {new Date(item.deletedAt).toLocaleString("fr-FR")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => restoreProtocol(item.protocol.id)}>
                  Restaurer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {visibleProtocols.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300 bg-white/80">
          <CardContent className="py-14 text-center">
            <Shield className="h-10 w-10 text-cyan-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">Aucun protocole trouvé</p>
            <p className="text-slate-500 text-sm mt-1">Ajuste les filtres ou crée un nouveau protocole.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
