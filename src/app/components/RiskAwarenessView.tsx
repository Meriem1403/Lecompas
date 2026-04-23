import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  Link2,
  Paperclip,
  Pencil,
  Plus,
  PlusCircle,
  Search,
  Shield,
  Trash2,
  Eye,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface RiskAwarenessRecord {
  id: string;
  riskKey: string;
  riskNumber: string;
  riskTitle: string;
  summary: string;
  content: string;
  links: string[];
  documents: string[];
  status: "a_completer" | "complete";
  updatedBy?: string;
  updatedAt?: string;
}

interface RiskAwarenessViewProps {
  userRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
  records: RiskAwarenessRecord[];
  setRecords: React.Dispatch<React.SetStateAction<RiskAwarenessRecord[]>>;
  exposedRiskKeys: string[];
}

type ViewMode = "list" | "detail" | "edit" | "create";

export function RiskAwarenessView({
  userRole,
  currentUserName,
  records,
  setRecords,
  exposedRiskKeys,
}: RiskAwarenessViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({
    riskKey: "",
    summary: "",
    content: "",
    linksText: "",
    docsText: "",
  });
  const [linkDraft, setLinkDraft] = useState("");
  const [docDraft, setDocDraft] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const visibleRecords = useMemo(() => {
    const base =
      userRole === "admin"
        ? records
        : records.filter((record) => exposedRiskKeys.includes(record.riskKey));

    return base.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const lower = query.trim().toLowerCase();
      return (
        record.riskNumber.toLowerCase().includes(lower) ||
        record.riskTitle.toLowerCase().includes(lower) ||
        record.summary.toLowerCase().includes(lower) ||
        record.content.toLowerCase().includes(lower)
      );
    });
  }, [exposedRiskKeys, query, records, statusFilter, userRole]);

  const completedCount = visibleRecords.filter((record) => record.status === "complete").length;
  const toCompleteCount = visibleRecords.filter((record) => record.status === "a_completer").length;

  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize));
  const paginatedRecords = useMemo(
    () => visibleRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visibleRecords, currentPage, pageSize],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const selected = records.find((r) => r.id === selectedId) || null;
  const openCreate = () => {
    setForm({
      riskKey: "",
      summary: "",
      content: "",
      linksText: "",
      docsText: "",
    });
    setSelectedId(null);
    setLinkDraft("");
    setDocDraft("");
    setViewMode("create");
  };

  const openEdit = (record: RiskAwarenessRecord) => {
    setSelectedId(record.id);
    setForm({
      riskKey: record.riskKey,
      summary: record.summary,
      content: record.content,
      linksText: record.links.join("\n"),
      docsText: record.documents.join("\n"),
    });
    setLinkDraft("");
    setDocDraft("");
    setViewMode("edit");
  };

  const openDetail = (record: RiskAwarenessRecord) => {
    setSelectedId(record.id);
    setViewMode("detail");
  };

  const saveRecord = () => {
    const links = form.linksText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    const documents = form.docsText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);

    if (!form.riskKey) {
      toast.error("Sélectionnez un risque.");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Le contenu est obligatoire.");
      return;
    }

    if (viewMode === "edit" && selected) {
      setRecords((prev) =>
        prev.map((record) =>
          record.id === selected.id
            ? {
                ...record,
                summary: form.summary,
                content: form.content,
                links,
                documents,
                status: "complete",
                updatedBy: currentUserName,
                updatedAt: new Date().toISOString(),
              }
            : record,
        ),
      );
      toast.success("Fiche mise à jour.");
    } else {
      const existing = records.find((r) => r.riskKey === form.riskKey);
      if (existing) {
        toast.error("Une fiche existe déjà pour ce risque.");
        return;
      }
      const [riskNumber, ...titleParts] = form.riskKey.split("::");
      setRecords((prev) => [
        {
          id: crypto.randomUUID(),
          riskKey: form.riskKey,
          riskNumber: riskNumber || "",
          riskTitle: titleParts.join("::") || "",
          summary: form.summary,
          content: form.content,
          links,
          documents,
          status: "complete",
          updatedBy: currentUserName,
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("Fiche créée.");
    }
    setViewMode("list");
  };

  const addLink = () => {
    const value = linkDraft.trim();
    if (!value) return;
    const current = form.linksText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    if (current.includes(value)) {
      toast.error("Ce lien est déjà ajouté.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      linksText: [...current, value].join("\n"),
    }));
    setLinkDraft("");
  };

  const removeLink = (value: string) => {
    const next = form.linksText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((v) => v !== value);
    setForm((prev) => ({
      ...prev,
      linksText: next.join("\n"),
    }));
  };

  const addDocument = () => {
    const value = docDraft.trim();
    if (!value) return;
    const current = form.docsText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    if (current.includes(value)) {
      toast.error("Ce document est déjà ajouté.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      docsText: [...current, value].join("\n"),
    }));
    setDocDraft("");
  };

  const removeDocument = (value: string) => {
    const next = form.docsText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((v) => v !== value);
    setForm((prev) => ({
      ...prev,
      docsText: next.join("\n"),
    }));
  };

  const resetRecord = (id: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id
          ? {
              ...record,
              summary: "",
              content: "",
              links: [],
              documents: [],
              status: "a_completer",
              updatedBy: currentUserName,
              updatedAt: new Date().toISOString(),
            }
          : record,
      ),
    );
    toast.success("Fiche réinitialisée.");
  };

  if (viewMode === "detail" && selected) {
    const isComplete = selected.status === "complete";
    const linksCount = selected.links.length;
    const docsCount = selected.documents.length;
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {userRole === "admin" ? (
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              onClick={() => openEdit(selected)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifier la fiche
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => setViewMode("list")}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-orange-950 to-amber-950 text-white">
          <CardHeader className="py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Fiche de sensibilisation</p>
                  <CardTitle className="text-2xl sm:text-3xl text-white mt-1">
                    {selected.riskNumber} — {selected.riskTitle}
                  </CardTitle>
                  <p className="text-sm text-orange-100 mt-2">
                    Ressources pour sensibiliser les collaborateurs à ce risque.
                  </p>
                </div>
              </div>
              <Badge
                className={
                  isComplete
                    ? "bg-orange-100 text-orange-900 border-orange-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }
              >
                {isComplete ? "Complétée" : "À compléter par l'admin"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-orange-900 font-semibold">Statut</p>
              <p className="text-lg font-semibold text-orange-950 mt-1">{isComplete ? "Finalisée" : "En attente"}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/80">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-amber-900 font-semibold">Liens utiles</p>
              <p className="text-lg font-semibold text-amber-950 mt-1">{linksCount}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-stone-600 font-semibold">Documents</p>
              <p className="text-lg font-semibold text-stone-900 mt-1">{docsCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-5 sm:p-7 space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">Résumé</p>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selected.summary || "Aucun résumé saisi."}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-2">Information détaillée</p>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selected.content || "Contenu en attente de complétion."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-2 border-amber-100 bg-amber-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-950 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Liens utiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linksCount > 0 ? (
                selected.links.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 text-sm text-amber-950 hover:bg-amber-50/90"
                  >
                    <span className="truncate">{link}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 text-orange-600" />
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucun lien.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-stone-200 bg-stone-100/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-stone-900 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Documents associés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {docsCount > 0 ? (
                selected.documents.map((doc) => (
                  <div
                    key={doc}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
                  >
                    <span className="text-sm text-stone-800 truncate">{doc}</span>
                    <FileText className="h-4 w-4 shrink-0 text-stone-600" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucun document.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {selected.updatedBy ? (
          <p className="text-xs text-gray-500">
            Mis à jour par {selected.updatedBy}
            {selected.updatedAt ? ` le ${new Date(selected.updatedAt).toLocaleDateString("fr-FR")}` : ""}
          </p>
        ) : null}
      </div>
    );
  }

  if ((viewMode === "edit" || viewMode === "create") && userRole === "admin") {
    const availableRiskKeys = records.map((r) => r.riskKey);
    const links = form.linksText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    const docs = form.docsText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {viewMode === "create" ? "Nouvelle fiche de sensibilisation" : "Modifier la fiche"}
            </h3>
            <p className="text-gray-600">CRUD en page complète, sans popup.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setViewMode("list")}
            className="w-full sm:w-auto border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-stone-400" />
          <CardContent className="p-4 sm:p-8 space-y-5">
            <div className="space-y-1">
              <CardTitle className="text-xl text-slate-900">Informations generales</CardTitle>
              <CardDescription>Renseigne le risque et le contenu de la fiche.</CardDescription>
            </div>
            <div className="space-y-2">
              <Label>Risque</Label>
              <Select
                value={form.riskKey}
                onValueChange={(value) => setForm((prev) => ({ ...prev, riskKey: value }))}
                disabled={viewMode === "edit"}
              >
                <SelectTrigger className="bg-white border-2 border-slate-300">
                  <SelectValue placeholder="Sélectionner un risque" />
                </SelectTrigger>
                <SelectContent>
                  {availableRiskKeys.map((riskKey) => (
                    <SelectItem key={riskKey} value={riskKey}>
                      {riskKey.replace("::", " — ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Résumé</Label>
              <Input
                value={form.summary}
                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="bg-white border-2 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Contenu détaillé *</Label>
              <Textarea
                rows={7}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="border-2 border-slate-300"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-orange-600" />
                Liens utiles
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <Input
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  placeholder="https://..."
                  className="bg-white border-2 border-slate-300"
                />
                <Button
                  type="button"
                  onClick={addLink}
                  variant="outline"
                  className="border-2 border-dashed border-amber-400 text-amber-900 hover:bg-amber-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {links.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun lien ajoute.</p>
                ) : null}
                {links.map((link) => (
                  <div
                    key={link}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-amber-50 border-2 border-amber-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-4 w-4 text-amber-800 shrink-0" />
                      <p className="text-sm text-amber-950 break-all">{link}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => removeLink(link)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-stone-600" />
                Documents et fiches
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <Input
                  value={docDraft}
                  onChange={(e) => setDocDraft(e.target.value)}
                  placeholder="Nom du document ou fiche"
                  className="bg-white border-2 border-slate-300"
                />
                <Button
                  type="button"
                  onClick={addDocument}
                  variant="outline"
                  className="border-2 border-dashed border-stone-300 text-stone-700 hover:bg-stone-100"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {docs.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun document ajoute.</p>
                ) : null}
                {docs.map((doc) => (
                  <div
                    key={doc}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-stone-100 border-2 border-stone-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-4 w-4 text-stone-600 shrink-0" />
                      <p className="text-sm text-stone-900 break-all">{doc}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => removeDocument(doc)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setViewMode("list")}>
                Annuler
              </Button>
              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                onClick={saveRecord}
              >
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-orange-900 to-amber-950 text-white overflow-hidden relative">
        <CardHeader className="relative py-6 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="flex flex-col min-w-0 sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg self-start">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2 pr-0 sm:pr-2">
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white break-words">
                  Sensibilisation aux risques
                </CardTitle>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed break-words">
                  Une fiche par risque, à partager avec les équipes pour expliquer le danger et les
                  bons réflexes.
                </p>
              </div>
            </div>
            <Badge className="shrink-0 w-fit self-start sm:self-end lg:self-center bg-white text-slate-900 border border-slate-200 text-sm sm:text-base px-3 sm:px-5 py-2 shadow-xl">
              {visibleRecords.length} fiche(s)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">Fiches visibles</p>
              <p className="text-2xl font-bold text-orange-950">{visibleRecords.length}</p>
            </div>
            <Shield className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Complétées</p>
              <p className="text-2xl font-bold text-amber-950">{completedCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">À compléter</p>
              <p className="text-2xl font-bold text-amber-900">{toCompleteCount}</p>
            </div>
            <Clock3 className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-md bg-white/90 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto xl:flex-1">
              <div className="relative w-full xl:max-w-md">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une fiche..."
                  className="pl-10 bg-white border-2 border-slate-300"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-60 bg-white border-2 border-slate-300">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="a_completer">À compléter par l'admin</SelectItem>
                  <SelectItem value="complete">Complétée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden xl:flex items-center gap-2 text-sm text-slate-500">
              <Filter className="h-4 w-4" />
              Filtres actifs
            </div>
            {userRole === "admin" ? (
              <Button
                className="w-full xl:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                onClick={openCreate}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer une fiche
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {paginatedRecords.map((record) => (
          <Card
            key={record.id}
            className="group border-2 border-transparent hover:border-orange-200 bg-white/95 hover:shadow-2xl transition-all duration-300"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">Fiche de sensibilisation</p>
                    <p className="text-lg font-semibold text-slate-900 break-words leading-snug">
                      {record.summary || "Résumé à compléter"}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    record.status === "complete"
                      ? "bg-orange-100 text-orange-900 border-orange-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }
                >
                  {record.status === "complete" ? "Complétée" : "À compléter"}
                </Badge>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 shadow-sm max-w-full min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-800">Réf risque</span>
                <span className="font-mono text-xs font-bold text-orange-950">{record.riskNumber}</span>
                <span className="text-xs text-orange-700">-</span>
                <span className="text-xs font-semibold text-orange-900 truncate max-w-[200px]">{record.riskTitle}</span>
              </div>

              <p className="text-sm text-slate-700 line-clamp-3 min-h-[60px]">
                {record.content || "Contenu détaillé non renseigné."}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <span className="font-semibold text-amber-900">Liens :</span> {record.links.length}
                </div>
                <div className="rounded-lg bg-stone-100 border border-stone-200 p-2">
                  <span className="font-semibold text-stone-700">Documents :</span> {record.documents.length}
                </div>
              </div>

              <div className="text-xs text-slate-500">
                {record.updatedBy ? `Dernière mise à jour par ${record.updatedBy}` : "Jamais complétée"}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="w-full sm:flex-1" onClick={() => openDetail(record)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Consulter
                </Button>
                {userRole === "admin" ? (
                  <>
                    <Button
                      className="w-full sm:flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                      onClick={() => openEdit(record)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-red-600 hover:bg-red-50"
                      onClick={() => resetRecord(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {visibleRecords.length > 0 ? (
        <Card className="border-2 border-orange-100 bg-white/95">
          <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Page {currentPage} / {totalPages} – {visibleRecords.length} fiche
              {visibleRecords.length > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 hover:bg-orange-50"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 hover:bg-orange-50"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {visibleRecords.length === 0 ? (
        <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
          <CardContent className="py-14 text-center">
            <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Aucune fiche disponible</p>
            <p className="text-gray-500 text-sm mt-1">
              Les fiches apparaîtront automatiquement lors de la création d'un nouveau risque.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

