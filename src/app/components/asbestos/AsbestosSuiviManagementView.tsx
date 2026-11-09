import React, { useEffect, useMemo, useState } from "react";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import {
  IMPORTED_ASBESTOS_REGISTER,
  IMPORTED_ASBESTOS_SITES_DTA,
} from "@/app/seeds/importedSeeds";
import type {
  AsbestosRegisterRow,
  AsbestosSiteDtaRow,
} from "@/app/types/importedRegisters";
import { RowAttachmentsDialog } from "@/app/components/spreadsheet/RowAttachmentsDialog";
import { AsbestosRegisterDetailSheet } from "./AsbestosRegisterDetailSheet";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  ListPaginationBar,
  TABLE_LIST_PAGE_SIZE,
} from "@/app/components/ui/list-pagination-bar";
import {
  Building2,
  ClipboardList,
  Eye,
  FileStack,
  Layers,
  MapPin,
  Paperclip,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  dtaStatutBadgeClass,
  formatMaybeExcelDate,
  asText,
  kindLabel,
  matchesRegisterSearch,
  matchesSiteSearch,
  registerRowScore,
  registerRowTitle,
  scoreTone,
} from "@/app/utils/asbestosDisplayUtils";

interface AsbestosSuiviManagementViewProps {
  accessToken?: string;
}

type AttachTarget =
  | { scope: "register"; row: AsbestosRegisterRow }
  | { scope: "site"; row: AsbestosSiteDtaRow }
  | null;

export function AsbestosSuiviManagementView({
  accessToken = "",
}: AsbestosSuiviManagementViewProps) {
  const [register, setRegister] = useAppDataDocumentStore<AsbestosRegisterRow[]>(
    APP_DATA_KEYS.asbestosSuiviRegister,
    accessToken,
    { seed: IMPORTED_ASBESTOS_REGISTER },
  );
  const [sites, setSites] = useAppDataDocumentStore<AsbestosSiteDtaRow[]>(
    APP_DATA_KEYS.asbestosSitesDta,
    accessToken,
    { seed: IMPORTED_ASBESTOS_SITES_DTA },
  );

  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [retraitFilter, setRetraitFilter] = useState<string>("all");
  const [dtaFilter, setDtaFilter] = useState<string>("all");
  const [listPage, setListPage] = useState(1);
  const [activeTab, setActiveTab] = useState("materiaux");

  const [detailRow, setDetailRow] = useState<AsbestosRegisterRow | null>(null);
  const [attachTarget, setAttachTarget] = useState<AttachTarget>(null);

  const registerRows = useMemo(
    () => (Array.isArray(register) ? register : []),
    [register],
  );
  const siteRows = useMemo(
    () => (Array.isArray(sites) ? sites : []),
    [sites],
  );

  const synthese = useMemo(
    () => registerRows.filter((r) => r.kind === "synthese"),
    [registerRows],
  );
  const controles = useMemo(
    () => registerRows.filter((r) => r.kind === "controle"),
    [registerRows],
  );
  const materiaux = useMemo(
    () => registerRows.filter((r) => r.kind === "materiau"),
    [registerRows],
  );

  const ac1Count = useMemo(
    () =>
      materiaux.filter((r) =>
        registerRowScore(r).toUpperCase().includes("AC1"),
      ).length,
    [materiaux],
  );

  const filteredMateriaux = useMemo(() => {
    return materiaux.filter((row) => {
      if (!matchesRegisterSearch(row, search)) return false;
      const score = registerRowScore(row).toUpperCase();
      if (scoreFilter === "ep" && !score.includes("EP")) return false;
      if (scoreFilter === "ac1" && !score.includes("AC1")) return false;
      if (scoreFilter === "ac2" && !score.includes("AC2")) return false;
      const retrait = asText(row.retraitRealise).toLowerCase();
      if (retraitFilter === "oui" && !retrait.startsWith("o")) return false;
      if (retraitFilter === "non" && retrait.startsWith("o")) return false;
      return true;
    });
  }, [materiaux, search, scoreFilter, retraitFilter]);

  const filteredSynthese = useMemo(
    () => synthese.filter((r) => matchesRegisterSearch(r, search)),
    [synthese, search],
  );
  const filteredControles = useMemo(
    () => controles.filter((r) => matchesRegisterSearch(r, search)),
    [controles, search],
  );
  const filteredSites = useMemo(() => {
    return siteRows.filter((site) => {
      if (!matchesSiteSearch(site, search)) return false;
      if (dtaFilter === "all") return true;
      const d = asText(site.dtaStatut).trim().toLowerCase();
      if (dtaFilter === "oui") return d.startsWith("oui");
      if (dtaFilter === "non") return d.startsWith("non");
      return true;
    });
  }, [siteRows, search, dtaFilter]);

  const activeRows = useMemo(() => {
    switch (activeTab) {
      case "synthese":
        return filteredSynthese;
      case "controles":
        return filteredControles;
      case "sites":
        return filteredSites;
      default:
        return filteredMateriaux;
    }
  }, [
    activeTab,
    filteredMateriaux,
    filteredSynthese,
    filteredControles,
    filteredSites,
  ]);

  const listPageSize = TABLE_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(
    1,
    Math.ceil(activeRows.length / listPageSize),
  );
  const paginatedActive = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return activeRows.slice(start, start + listPageSize);
  }, [activeRows, listPage, listPageSize]);

  useEffect(() => {
    setListPage(1);
  }, [search, scoreFilter, retraitFilter, dtaFilter, activeTab]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  const saveRegisterRow = (updated: AsbestosRegisterRow) => {
    setRegister((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );
    setDetailRow(updated);
    toast.success("Fiche enregistrée");
  };

  const updateRegisterAttachments = (
    id: string,
    attachments: AsbestosRegisterRow["attachments"],
  ) => {
    setRegister((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attachments } : r)),
    );
    if (detailRow?.id === id) {
      setDetailRow({ ...detailRow, attachments });
    }
    toast.success("Pièces jointes enregistrées");
  };

  const updateSiteAttachments = (
    id: string,
    attachments: AsbestosSiteDtaRow["attachments"],
  ) => {
    setSites((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attachments } : r)),
    );
    toast.success("Pièces jointes enregistrées");
  };

  const renderActionButtons = (row: AsbestosRegisterRow) => (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-indigo-600"
        aria-label="Voir la fiche"
        onClick={() => setDetailRow(row)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-600"
        aria-label="Pièces jointes"
        onClick={() => setAttachTarget({ scope: "register", row })}
      >
        <Paperclip className="h-4 w-4" />
        {(row.attachments?.length ?? 0) > 0 ? (
          <span className="sr-only">{row.attachments!.length} PJ</span>
        ) : null}
      </Button>
    </div>
  );

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-gray-900">
              Suivi amiante — registre MCA
            </h2>
            <p className="text-gray-600">
              Synthèse, contrôles périodiques, matériaux repérés et dossiers DTA
              par site
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-violet-50">
          <CardContent className="pt-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Matériaux suivis</p>
              <p className="text-3xl font-bold text-indigo-700">{materiaux.length}</p>
            </div>
            <Layers className="h-10 w-10 text-indigo-500 opacity-80" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="pt-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Synthèse MCA</p>
              <p className="text-3xl font-bold text-emerald-700">{synthese.length}</p>
            </div>
            <FileStack className="h-10 w-10 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Scores AC1</p>
              <p className="text-3xl font-bold text-orange-700">{ac1Count}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-orange-500 opacity-80" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100">
          <CardContent className="pt-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Sites & DTA</p>
              <p className="text-3xl font-bold text-slate-800">{sites.length}</p>
            </div>
            <Building2 className="h-10 w-10 text-slate-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="pt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 bg-white border-2 border-slate-300"
              placeholder="Recherche (matériau, localisation, site, contrôle, commentaires…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {activeRows.length} enregistrement(s) dans l&apos;onglet actif
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white w-full sm:w-auto"
              onClick={() => {
                setSearch("");
                setScoreFilter("all");
                setRetraitFilter("all");
                setDtaFilter("all");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2 xl:grid-cols-4">
          <TabsTrigger value="materiaux" className="h-auto min-h-11 whitespace-normal rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
            Matériaux et zones ({materiaux.length})
          </TabsTrigger>
          <TabsTrigger value="synthese" className="h-auto min-h-11 whitespace-normal rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
            Synthèse MCA ({synthese.length})
          </TabsTrigger>
          <TabsTrigger value="controles" className="h-auto min-h-11 whitespace-normal rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
            Contrôles et DTA ({controles.length})
          </TabsTrigger>
          <TabsTrigger value="sites" className="h-auto min-h-11 whitespace-normal rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
            Sites ({siteRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materiaux" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les scores</SelectItem>
                <SelectItem value="ep">EP (état préservé)</SelectItem>
                <SelectItem value="ac1">AC1 (dégradation ponctuelle)</SelectItem>
                <SelectItem value="ac2">AC2 / critique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={retraitFilter} onValueChange={setRetraitFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <SelectValue placeholder="Retrait" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Retrait : tous</SelectItem>
                <SelectItem value="oui">Retrait réalisé</SelectItem>
                <SelectItem value="non">Sans retrait</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0 min-w-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Matériau / zone
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase min-w-[200px]">
                        Localisation
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[110px]">
                        Dernier ctrl.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[100px]">
                        Score
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase min-w-[140px]">
                        Statut MCA
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[90px]">
                        Retrait
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase min-w-[180px]">
                        Action à prévoir
                      </th>
                      <th className="px-3 py-3 w-[88px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(paginatedActive as AsbestosRegisterRow[]).map((row) => {
                      const score = scoreTone(registerRowScore(row));
                      const retrait = asText(row.retraitRealise).toLowerCase().startsWith("o");
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-indigo-50/40 transition-colors"
                        >
                          <td className="px-3 py-3 text-sm font-medium text-gray-900">
                            {registerRowTitle(row)}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700 whitespace-normal break-words align-top">
                            {row.localisation || "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {formatMaybeExcelDate(row.dernierControle)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={score.className}>
                              {score.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            {row.statutMateriau || "—"}
                          </td>
                          <td className="px-3 py-3">
                            {retrait ? (
                              <Badge className="bg-purple-100 text-purple-900 border-purple-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Oui
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500">Non</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700 whitespace-normal break-words align-top">
                            {row.actionAPrevoir || "—"}
                          </td>
                          <td className="px-3 py-3">{renderActionButtons(row)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="synthese" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {(paginatedActive as AsbestosRegisterRow[]).map((row) => {
              const score = scoreTone(registerRowScore(row));
              return (
                <Card
                  key={row.id}
                  className="border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{kindLabel(row.kind)}</Badge>
                          <Badge variant="outline" className={score.className}>
                            {score.label}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {row.materiau}
                        </h3>
                        <p className="text-sm text-gray-700 flex items-start gap-2">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                          {row.localisation}
                        </p>
                        {row.description ? (
                          <p className="text-sm text-gray-600">{row.description}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0">{renderActionButtons(row)}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="controles" className="mt-4">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-700 w-[130px]">
                        Date
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-700 min-w-[220px]">
                        Type de contrôle
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-700 min-w-[200px]">
                        Périmètre
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-700 min-w-[120px]">
                        Scores
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-700 min-w-[160px]">
                        Prochaine échéance
                      </th>
                      <th className="px-3 py-3 w-[88px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(paginatedActive as AsbestosRegisterRow[]).map((row) => (
                      <tr key={row.id} className="hover:bg-indigo-50/40">
                        <td className="px-3 py-3 text-sm font-medium whitespace-nowrap">
                          {row.dateControle || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-800">
                          {row.typeControle || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 whitespace-normal break-words align-top">
                          {row.lieuZone || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <Badge
                            variant="outline"
                            className={scoreTone(row.score).className}
                          >
                            {row.score ? row.score.slice(0, 48) : "—"}
                            {row.score && row.score.length > 48 ? "…" : ""}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {row.prochaineEcheance || "—"}
                        </td>
                        <td className="px-3 py-3">{renderActionButtons(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites" className="mt-4 space-y-4">
          <Select value={dtaFilter} onValueChange={setDtaFilter}>
            <SelectTrigger className="w-full sm:w-[220px] bg-white">
              <SelectValue placeholder="DTA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">DTA : tous</SelectItem>
              <SelectItem value="oui">DTA disponible</SelectItem>
              <SelectItem value="non">DTA absent / à refaire</SelectItem>
            </SelectContent>
          </Select>

          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase">
                        Département
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase min-w-[200px]">
                        Site
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase w-[120px]">
                        Dernier contrôle
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase w-[80px]">
                        DTA
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase min-w-[160px]">
                        Accès
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase min-w-[180px]">
                        Commentaires
                      </th>
                      <th className="px-3 py-3 w-[56px]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(paginatedActive as AsbestosSiteDtaRow[]).map((site) => (
                      <tr key={site.id} className="hover:bg-indigo-50/40">
                        <td className="px-3 py-3 text-sm">{site.departement}</td>
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">
                          {site.site}
                        </td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          {formatMaybeExcelDate(site.dateDernierControle)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant="outline"
                            className={dtaStatutBadgeClass(site.dtaStatut)}
                          >
                            {site.dtaStatut || "—"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 whitespace-normal break-words align-top">
                          {site.acces || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 whitespace-normal break-words align-top">
                          {site.commentaires || "—"}
                        </td>
                        <td className="px-3 py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Pièces jointes DTA"
                            onClick={() =>
                              setAttachTarget({ scope: "site", row: site })
                            }
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activeRows.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-12 text-center text-gray-600">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-400" />
            Aucun enregistrement ne correspond à votre recherche.
          </CardContent>
        </Card>
      ) : null}

      <ListPaginationBar
        currentPage={listPage}
        totalPages={listTotalPages}
        totalItems={activeRows.length}
        onPageChange={setListPage}
        itemLabel="ligne(s)"
      />

      <AsbestosRegisterDetailSheet
        row={detailRow}
        open={!!detailRow}
        onOpenChange={(o) => !o && setDetailRow(null)}
        onSave={saveRegisterRow}
        onManageAttachments={() => {
          if (detailRow) {
            setAttachTarget({ scope: "register", row: detailRow });
          }
        }}
        attachmentCount={detailRow?.attachments?.length ?? 0}
      />

      {attachTarget?.scope === "register" ? (
        <RowAttachmentsDialog
          open
          onOpenChange={(o) => !o && setAttachTarget(null)}
          title={registerRowTitle(attachTarget.row)}
          attachments={attachTarget.row.attachments ?? []}
          onChange={(attachments) => {
            updateRegisterAttachments(attachTarget.row.id, attachments);
            setAttachTarget({
              scope: "register",
              row: { ...attachTarget.row, attachments },
            });
          }}
        />
      ) : null}

      {attachTarget?.scope === "site" ? (
        <RowAttachmentsDialog
          open
          onOpenChange={(o) => !o && setAttachTarget(null)}
          title={attachTarget.row.site}
          attachments={attachTarget.row.attachments ?? []}
          onChange={(attachments) => {
            updateSiteAttachments(attachTarget.row.id, attachments);
            setAttachTarget({
              scope: "site",
              row: { ...attachTarget.row, attachments },
            });
          }}
        />
      ) : null}
    </div>
  );
}
