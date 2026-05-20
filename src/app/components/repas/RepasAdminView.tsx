import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Building2,
  CheckCircle2,
  ClipboardList,
  Coins,
  MapPin,
  PlusCircle,
  Search,
  Shield,
  Ticket,
  TrendingUp,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "../ui/list-pagination-bar";
import { AppUser, Location } from "../admin/UserManagementView";
import {
  formatEuro,
  MealSubsidyConfig,
  UserInmHistoryEntry,
} from "../../utils/mealSubsidyRecord";
import { MealSubsidyManagementView } from "./MealSubsidyManagementView";
import { cn } from "../ui/utils";
import { RepasStatCard } from "./RepasStatCard";
import { MealTicketStatusBadge } from "./MealTicketStatusBadge";
import { MealTicketRecipientSelect } from "./MealTicketRecipientSelect";
import {
  applySubsidiesToMonthTickets,
  MealTicket,
  cancelMealTicket,
  filterMealTicketRecipients,
  filterTickets,
  formatMonthLabel,
  formatTicketDate,
  generateMonthlyTickets,
  getAdminTicketStats,
  getCurrentMonth,
  resolveTicketMoneyEUR,
  rollupMealTicketsAccounting,
  countUserMonthTickets,
  previewTicketsToCreate,
  resetMealTicketsStorageAsync,
  userHasFullMealAllocation,
} from "../../utils/mealTicketRecord";

interface RepasAdminViewProps {
  adminUsers: AppUser[];
  services: string[];
  domains: string[];
  locations: string[];
  locationCatalog?: Location[];
  mealTickets: MealTicket[];
  setMealTickets: React.Dispatch<React.SetStateAction<MealTicket[]>>;
  generatedBy: string;
  mealSubsidyConfig?: MealSubsidyConfig;
  setMealSubsidyConfig?: React.Dispatch<React.SetStateAction<MealSubsidyConfig>>;
  userInmHistory?: UserInmHistoryEntry[];
}

const DEFAULT_MEAL_COUNT = 22;
/** Service de démo où sont la plupart des agents et chefs */
const DEFAULT_REPAS_SERVICE = "Maintenance";

/** Montant ticket = subventions totales agent ; générés / scannés / reste pour la facture prestataire. */
const ACCOUNTING_EXPLANATION_ADMIN =
  "Chaque ticket vaut le total des subventions (ministérielle + interministérielle) calculé pour l’agent à la génération. « Générés » = plafond du mois · « Scannés » = montant à facturer · « Reste » = tickets actifs non encore validés.";

function AdminTicketCard({
  ticket,
  onCancel,
  mealSubsidyConfig,
}: {
  ticket: MealTicket;
  onCancel: (id: string) => void;
  mealSubsidyConfig?: MealSubsidyConfig;
}) {
  const mv = resolveTicketMoneyEUR(ticket);
  return (
    <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <div>
            <p className="font-bold text-gray-900">{ticket.agentName}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{ticket.ticketNumber}</p>
            <p className="text-xs text-gray-500 mt-1">{ticket.service}</p>
          </div>
          <MealTicketStatusBadge status={ticket.status} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <p>
            <span className="text-gray-500">Repas n° :</span>{" "}
            <span className="font-semibold text-amber-700">
              {ticket.mealIndex ?? "—"}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Lieu :</span> {ticket.location || "—"}
          </p>
          <p className="col-span-2 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white p-3 text-xs text-slate-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)]">
            <span className="inline-flex flex-wrap gap-x-1 gap-y-0.5 [&>span]:whitespace-nowrap">
              <span className="font-semibold text-amber-800 tabular-nums">
                Montant ticket&nbsp;: {formatEuro(mv.ticketAmountEUR)}
              </span>
              {mv.subsidyMinisterialEUR > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-violet-800 tabular-nums">
                    Min.&nbsp;: {formatEuro(mv.subsidyMinisterialEUR)}
                  </span>
                </>
              )}
              {mv.subsidyInterministerialEUR > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-teal-800 tabular-nums">
                    Inter.&nbsp;: {formatEuro(mv.subsidyInterministerialEUR)}
                  </span>
                </>
              )}
            </span>
          </p>
          {ticket.subsidyTotal != null && (
            <p className="col-span-2">
              <span className="text-gray-500">Subvention enregistrée :</span>{" "}
              <span className="font-semibold text-emerald-700">
                {formatEuro(ticket.subsidyTotal)}
              </span>
              {" / repas"}
              {ticket.agentInm != null && (
                <span className="text-xs text-gray-500 block">INM {ticket.agentInm}</span>
              )}
            </p>
          )}
        </div>
        {ticket.status === "used" && ticket.usedAt && (
          <p className="text-xs text-gray-600 bg-slate-50 rounded-lg p-2 mb-2">
            Validé le {formatTicketDate(ticket.usedAt)}
            {ticket.usedByProviderName && ` par ${ticket.usedByProviderName}`}
          </p>
        )}
        {ticket.status === "active" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-red-600 border-red-200">
                <Ban className="h-4 w-4 mr-1" />
                Annuler le ticket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Annuler ce ticket ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le ticket {ticket.ticketNumber} de {ticket.agentName} sera invalidé. L&apos;agent
                  pourra recevoir un nouveau ticket pour ce mois si vous relancez une génération.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Retour</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => onCancel(ticket.id)}
                >
                  Confirmer l&apos;annulation
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}

export function RepasAdminView({
  adminUsers,
  services,
  domains,
  locations,
  locationCatalog = [],
  mealTickets,
  setMealTickets,
  generatedBy,
  mealSubsidyConfig,
  setMealSubsidyConfig,
  userInmHistory = [],
}: RepasAdminViewProps) {
  const [adminTab, setAdminTab] = useState<"tickets" | "tarifs">("tickets");
  const currentMonth = getCurrentMonth();

  const [genMonth, setGenMonth] = useState(currentMonth);
  const [genService, setGenService] = useState(
    () =>
      (services.includes(DEFAULT_REPAS_SERVICE)
        ? DEFAULT_REPAS_SERVICE
        : services[0]) ?? "",
  );
  const [genDomain, setGenDomain] = useState("all");
  const [genLocation, setGenLocation] = useState("all");
  const [mealCount, setMealCount] = useState(String(DEFAULT_MEAL_COUNT));
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterService, setFilterService] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | MealTicket["status"]>("all");
  const [search, setSearch] = useState("");
  const [listPage, setListPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [resettingTickets, setResettingTickets] = useState(false);

  const genFilters = useMemo(
    () => ({
      service: genService || "all",
      domain: genDomain,
      location: genLocation,
    }),
    [genService, genDomain, genLocation],
  );

  const selectableRecipients = useMemo(() => {
    if (!genService) return [];
    return filterMealTicketRecipients(adminUsers, genFilters).sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr"),
    );
  }, [adminUsers, genFilters, genService]);

  const mealsPerPersonNum = Number(mealCount);
  const getMonthTicketCount = (userId: string) =>
    countUserMonthTickets(mealTickets, userId, genMonth);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [genService, genMonth, genDomain, genLocation]);

  useEffect(() => {
    if (services.length === 0) return;
    if (!genService || !services.includes(genService)) {
      setGenService(
        services.includes(DEFAULT_REPAS_SERVICE)
          ? DEFAULT_REPAS_SERVICE
          : services[0],
      );
    }
  }, [services, genService]);

  const handleResetAllTickets = async () => {
    setResettingTickets(true);
    try {
      await resetMealTicketsStorageAsync();
      setMealTickets([]);
      setSelectedUserIds([]);
      toast.success(
        "Tous les tickets repas ont été supprimés (admin, prestataire, agents). Vous pouvez régénérer des QR pour vos tests.",
      );
    } catch {
      toast.error("Échec de la réinitialisation des tickets.");
    } finally {
      setResettingTickets(false);
    }
  };

  const generationPreview = useMemo(() => {
    const perPerson = Math.max(
      1,
      Math.min(31, Math.floor(Number.isFinite(mealsPerPersonNum) ? mealsPerPersonNum : 0)),
    );
    const selected = selectableRecipients.filter((u) =>
      selectedUserIds.includes(u.id),
    );
    const toCreate = previewTicketsToCreate(
      mealTickets,
      selected.map((u) => u.id),
      genMonth,
      perPerson,
    );
    const fullyAllocated = selected.filter((u) =>
      userHasFullMealAllocation(mealTickets, u.id, genMonth, perPerson),
    ).length;
    return {
      selected: selected.length,
      fullyAllocated,
      toCreate,
    };
  }, [selectableRecipients, selectedUserIds, genMonth, mealTickets, mealsPerPersonNum]);

  const filteredTickets = useMemo(
    () =>
      filterTickets(mealTickets, {
        month: filterMonth,
        service: filterService,
        domain: filterDomain,
        location: filterLocation,
        status: filterStatus,
        search,
      }).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),
    [
      mealTickets,
      filterMonth,
      filterService,
      filterDomain,
      filterLocation,
      filterStatus,
      search,
    ],
  );

  const stats = useMemo(() => getAdminTicketStats(filteredTickets), [filteredTickets]);

  const accountingScopeTickets = useMemo(
    () =>
      filterTickets(mealTickets, {
        month: filterMonth,
        service: filterService,
        domain: filterDomain,
        location: filterLocation,
        search,
      }),
    [mealTickets, filterMonth, filterService, filterDomain, filterLocation, search],
  );

  const accountingRollup = useMemo(
    () => rollupMealTicketsAccounting(accountingScopeTickets),
    [accountingScopeTickets],
  );

  const availableMonths = useMemo(() => {
    const months = new Set(mealTickets.map((t) => t.month));
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  }, [mealTickets, currentMonth]);

  const paginated = filteredTickets.slice(
    (listPage - 1) * TABLE_LIST_PAGE_SIZE,
    listPage * TABLE_LIST_PAGE_SIZE,
  );
  const listTotalPages = Math.max(1, Math.ceil(filteredTickets.length / TABLE_LIST_PAGE_SIZE));

  const handleGenerate = () => {
    const count = Number(mealCount);
    if (!Number.isFinite(count) || count < 1 || count > 31) {
      toast.error("Nombre de repas invalide (entre 1 et 31).");
      return;
    }
    if (!genService) {
      toast.error("Sélectionnez un service.");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Sélectionnez au moins un agent ou chef de service.");
      return;
    }
    if (generationPreview.toCreate === 0) {
      toast.info("Aucun nouveau ticket à créer pour cette sélection.");
      setGenerateOpen(false);
      return;
    }

    const { tickets, created, skipped } = generateMonthlyTickets({
      month: genMonth,
      agents: adminUsers,
      existingTickets: mealTickets,
      mealsPerPerson: count,
      generatedBy,
      filters: genFilters,
      selectedUserIds,
      subsidyConfig: mealSubsidyConfig,
      inmHistory: userInmHistory,
      locationCatalog,
    });

    setMealTickets(tickets);
    setSelectedUserIds([]);
    setGenerateOpen(false);
    toast.success(
      `${created} QR code(s) créé(s)${skipped > 0 ? `, ${skipped} personne(s) déjà complètes` : ""}.`,
    );
  };

  const handleRecalculateSubsidies = () => {
    if (!mealSubsidyConfig) {
      toast.error("Configurez d'abord les tarifs dans l'onglet Tarifs & subventions.");
      return;
    }
    const targetIds =
      selectedUserIds.length > 0
        ? selectedUserIds
        : selectableRecipients.map((u) => u.id);
    if (targetIds.length === 0) {
      toast.error("Sélectionnez au moins un agent ou un service.");
      return;
    }
    setMealTickets((prev) =>
      applySubsidiesToMonthTickets(
        prev,
        genMonth,
        adminUsers,
        mealSubsidyConfig,
        userInmHistory,
        locationCatalog,
        targetIds,
      ),
    );
    toast.success(
      `Subventions et participations recalculées pour ${formatMonthLabel(genMonth)} (barèmes actuels).`,
    );
  };

  const handleCancel = (ticketId: string) => {
    setMealTickets((prev) => {
      const { tickets, success, message } = cancelMealTicket(prev, ticketId);
      if (success) toast.success(message);
      else toast.error(message);
      return tickets;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border-2 border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Espace administrateur
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2 flex-wrap">
          <Shield className="h-6 w-6 text-amber-600 shrink-0" />
          Gestion des tickets repas
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Génération des tickets, barèmes de subventions (ministérielle / interministérielle) et
          suivi.
        </p>
      </div>

      <Card className="border-2 border-violet-300 bg-violet-50/80 shadow-md">
        <CardContent className="p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800 mb-2">
            Navigation repas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdminTab("tickets")}
              className={cn(
                "flex items-center justify-center gap-2 min-h-12 px-4 rounded-xl border-2 font-semibold text-sm transition-all",
                adminTab === "tickets"
                  ? "bg-white border-amber-500 text-amber-900 shadow-md"
                  : "bg-white/60 border-slate-300 text-slate-600 hover:border-amber-300",
              )}
            >
              <Ticket className="h-5 w-5 shrink-0" />
              Tickets & génération
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("tarifs")}
              className={cn(
                "flex items-center justify-center gap-2 min-h-12 px-4 rounded-xl border-2 font-semibold text-sm transition-all",
                adminTab === "tarifs"
                  ? "bg-white border-violet-600 text-violet-900 shadow-md"
                  : "bg-white/60 border-slate-300 text-slate-600 hover:border-violet-400",
              )}
            >
              <Coins className="h-5 w-5 shrink-0" />
              Tarifs & subventions
            </button>
          </div>
        </CardContent>
      </Card>

      {adminTab === "tarifs" ? (
        mealSubsidyConfig && setMealSubsidyConfig ? (
          <MealSubsidyManagementView
            embedded
            config={mealSubsidyConfig}
            setConfig={setMealSubsidyConfig}
            locations={locationCatalog}
          />
        ) : (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-8 text-center text-amber-900">
              Configuration des tarifs indisponible. Rechargez l&apos;application.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Indicateurs en tête : les filtres de liste sont plus bas (même logique métier que les agrégés) */}
          <section aria-labelledby="admin-repas-indicateurs" className="space-y-4">
            <div>
              <h2 id="admin-repas-indicateurs" className="text-sm font-semibold text-slate-900">
                Indicateurs · tickets repas
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Volumes&nbsp;: mêmes filtres que la liste (y compris statut). Synthèse compta ci-dessous&nbsp;:
                mois, service, domaine, lieu et recherche — <strong>sans</strong> le filtre statut, pour
                comparer tickets générés, scannés et reste à scanner.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              <RepasStatCard
                label="Tickets (filtre)"
                value={stats.ticketsTotal}
                sub={formatMonthLabel(filterMonth)}
                icon={Ticket}
                accent="amber"
              />
              <RepasStatCard
                label="Actifs"
                value={stats.ticketsActive}
                icon={ClipboardList}
                accent="emerald"
              />
              <RepasStatCard
                label="Utilisés"
                value={stats.ticketsUsed}
                icon={CheckCircle2}
                accent="sky"
              />
              <RepasStatCard
                label="Annulés"
                value={stats.ticketsCancelled}
                icon={XCircle}
                accent="slate"
              />
              <RepasStatCard
                label="Repas restants"
                value={stats.mealsRemaining}
                icon={UtensilsCrossed}
                accent="teal"
              />
              <RepasStatCard
                label="Repas consommés"
                value={stats.mealsUsed}
                icon={TrendingUp}
                accent="cyan"
              />
            </div>

            <div
              className={cn(
                "overflow-hidden rounded-3xl border border-emerald-200/60",
                "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/30",
                "shadow-[0_4px_32px_-12px_rgba(15,118,110,0.25),inset_0_1px_0_0_rgba(255,255,255,0.9)]",
              )}
            >
              <div className="border-b border-emerald-200/35 bg-emerald-950/[0.02] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800/85">
                  Synthèse comptabilité · prestataire
                </p>
                <h3 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                  Générés · Scannés · Reste
                </h3>
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-600">
                  {formatMonthLabel(filterMonth)}
                  {filterService !== "all" ? ` · ${filterService}` : ""}
                  {filterLocation !== "all" ? ` · ${filterLocation}` : ""}. {ACCOUNTING_EXPLANATION_ADMIN}
                </p>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <div className="group relative flex flex-col gap-2 rounded-2xl border border-amber-200/60 bg-white/85 p-4 shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-amber-300/80 hover:shadow-md">
                  <div className="flex items-center gap-2 text-amber-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-600/10">
                      <Ticket className="h-4 w-4" strokeWidth={1.85} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/90">
                      Tickets générés
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {accountingRollup.generatedTicketCount} ticket
                    {accountingRollup.generatedTicketCount !== 1 ? "s" : ""} · Σ subventions agent
                  </p>
                  <p className="text-xl font-bold tabular-nums tracking-tight text-amber-950 sm:text-2xl">
                    {formatEuro(accountingRollup.generatedAmountEUR)}
                  </p>
                </div>
                <div className="group relative flex flex-col gap-2 rounded-2xl border border-teal-200/60 bg-white/85 p-4 shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-teal-300/80 hover:shadow-md">
                  <div className="flex items-center gap-2 text-teal-900">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-600/10">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={1.85} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-900/90">
                      Scannés · facture
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {accountingRollup.scannedTicketCount} ticket
                    {accountingRollup.scannedTicketCount !== 1 ? "s" : ""} validés
                    {accountingRollup.generatedTicketCount > 0
                      ? ` (${accountingRollup.scannedTicketCount}/${accountingRollup.generatedTicketCount})`
                      : ""}
                  </p>
                  <p className="text-xl font-bold tabular-nums tracking-tight text-teal-950 sm:text-2xl">
                    {formatEuro(accountingRollup.scannedAmountEUR)}
                  </p>
                </div>
                <div className="group relative flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm ring-1 ring-slate-900/[0.02] transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-center gap-2 text-slate-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/10 ring-1 ring-slate-600/10">
                      <ClipboardList className="h-4 w-4" strokeWidth={1.85} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-800">
                      Reste à scanner
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {accountingRollup.remainingTicketCount} ticket
                    {accountingRollup.remainingTicketCount !== 1 ? "s" : ""} actifs
                  </p>
                  <p className="text-xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-2xl">
                    {formatEuro(accountingRollup.remainingAmountEUR)}
                  </p>
                </div>
              </div>
              {accountingRollup.generatedAmountEUR > 0 &&
                Math.abs(
                  accountingRollup.generatedAmountEUR -
                    (accountingRollup.scannedAmountEUR + accountingRollup.remainingAmountEUR),
                ) > 0.01 && (
                  <p className="border-t border-emerald-200/35 px-5 py-3 text-xs text-amber-800">
                    Écart de réconciliation — vérifiez les tickets sans statut actif/utilisé ou sans subvention
                    enregistrée.
                  </p>
                )}
            </div>
          </section>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-amber-300 text-amber-900 hover:bg-amber-100"
        disabled={resettingTickets}
        onClick={() => void handleResetAllTickets()}
      >
        {resettingTickets ? "Réinitialisation…" : "Réinitialiser tous les tickets (tests)"}
      </Button>

      <Card className="border-2 border-amber-200 shadow-md bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <PlusCircle className="h-5 w-5" />
            Génération mensuelle
          </CardTitle>
          <CardDescription>
            Chaque repas correspond à un ticket avec un QR code unique. Choisissez un service et
            les collaborateurs : {DEFAULT_MEAL_COUNT} repas = {DEFAULT_MEAL_COUNT} QR par personne
            (complément possible si déjà partiellement émis).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label>Mois</Label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Repas par personne (QR)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                className="min-h-11"
                value={mealCount}
                onChange={(e) => setMealCount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select
                value={genService || undefined}
                onValueChange={(v) => {
                  setGenService(v);
                  setSelectedUserIds([]);
                }}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="Choisir un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Domaine</Label>
              <Select value={genDomain} onValueChange={setGenDomain}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {domains.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Lieu</Label>
              <Select value={genLocation} onValueChange={setGenLocation}>
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <MealTicketRecipientSelect
            service={genService || "all"}
            recipients={selectableRecipients}
            selectedIds={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
            mealsPerPerson={mealsPerPersonNum}
            getMonthTicketCount={getMonthTicketCount}
            genMonth={genMonth}
            mealSubsidyConfig={mealSubsidyConfig}
            userInmHistory={userInmHistory}
            locationCatalog={locationCatalog}
          />

          {mealSubsidyConfig && selectedUserIds.length > 0 && (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-3 text-sm space-y-1">
              <p className="font-semibold text-emerald-900">
                Branchement subventions (INM + lieu → barèmes) pour {formatMonthLabel(genMonth)}
              </p>
              <p className="text-xs text-emerald-800">
                Chaque nouveau QR reprend ces montants. Après modification de l&apos;INM dans
                Utilisateurs, cliquez « Recalculer subventions du mois » pour mettre à jour les
                tickets déjà créés.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm bg-amber-50/80 rounded-xl p-3 border border-amber-100">
            <span className="inline-flex items-center gap-1 text-slate-700">
              <Users className="h-4 w-4 text-amber-600" />
              {generationPreview.selected} sélectionné(s)
            </span>
            <span className="text-slate-400">·</span>
            <span>{generationPreview.fullyAllocated} déjà au complet</span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-amber-800">
              {generationPreview.toCreate} à créer
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-violet-300 text-violet-900 hover:bg-violet-50 min-h-11"
              onClick={handleRecalculateSubsidies}
              disabled={!mealSubsidyConfig}
            >
              Recalculer subventions du mois
            </Button>
            <AlertDialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 min-h-11"
                disabled={
                  generationPreview.toCreate === 0 || selectedUserIds.length === 0
                }
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Générer {generationPreview.toCreate} QR code(s)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la génération</AlertDialogTitle>
                <AlertDialogDescription>
                  Créer {generationPreview.toCreate} QR code(s) pour{" "}
                  {formatMonthLabel(genMonth)} (jusqu&apos;à {mealCount} par personne), service{" "}
                  {genService} ?
                  {generationPreview.fullyAllocated > 0 &&
                    ` ${generationPreview.fullyAllocated} personne(s) déjà complètes seront ignorées.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={handleGenerate}
                >
                  Générer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-white/90">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Agent, n° ticket, e-mail..."
                className="pl-9 min-h-11"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setListPage(1);
                }}
              />
            </div>
            <Select
              value={filterMonth}
              onValueChange={(v) => {
                setFilterMonth(v);
                setListPage(1);
              }}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatMonthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterService}
              onValueChange={(v) => {
                setFilterService(v);
                setListPage(1);
              }}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous services</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterDomain}
              onValueChange={(v) => {
                setFilterDomain(v);
                setListPage(1);
              }}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Domaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous domaines</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterLocation}
              onValueChange={(v) => {
                setFilterLocation(v);
                setListPage(1);
              }}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Lieu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous lieux</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v as typeof filterStatus);
                setListPage(1);
              }}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="used">Utilisés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredTickets.length === 0 ? (
        <Card className="border-2 border-dashed border-amber-200 bg-amber-50/30">
          <CardContent className="py-10 text-center text-gray-500 px-4">
            <Building2 className="h-10 w-10 text-amber-300 mx-auto mb-3" />
            Aucun ticket pour cette sélection.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {paginated.map((ticket) => (
              <AdminTicketCard
                key={ticket.id}
                ticket={ticket}
                mealSubsidyConfig={mealSubsidyConfig}
                onCancel={handleCancel}
              />
            ))}
          </div>

          <Card className="hidden lg:block border-0 shadow-xl bg-white/80 overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">N° ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Lieu
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Repas n°</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Validation</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-amber-50/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">{ticket.agentName}</p>
                        <p className="text-xs text-gray-500">{ticket.agentEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3 text-sm">{ticket.service}</td>
                      <td className="px-4 py-3 text-sm">{ticket.location || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">
                        {ticket.mealIndex ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <MealTicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ticket.status === "used"
                          ? formatTicketDate(ticket.usedAt)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ticket.status === "active" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                Annuler
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Annuler ce ticket ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ticket {ticket.ticketNumber} — {ticket.agentName}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Retour</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleCancel(ticket.id)}
                                >
                                  Confirmer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <ListPaginationBar
            currentPage={listPage}
            totalPages={listTotalPages}
            totalItems={filteredTickets.length}
            onPageChange={setListPage}
            itemLabel="ticket(s)"
          />
        </>
      )}
        </div>
      )}
    </div>
  );
}
