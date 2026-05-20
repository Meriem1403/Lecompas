import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Coins,
  Hash,
  MapPin,
  ScanLine,
  Search,
  Ticket,
  UtensilsCrossed,
  User,
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
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "../ui/list-pagination-bar";
import { cn } from "../ui/utils";
import { MealTicketScanner } from "./MealTicketScanner";
import { RepasStatCard } from "./RepasStatCard";
import { MealProviderIdentity } from "../../utils/userRoles";
import { formatEuro } from "../../utils/mealSubsidyRecord";
import {
  MealTicket,
  buildQrPayload,
  formatMonthLabel,
  formatTicketDate,
  getCurrentMonth,
  getProviderScanStats,
  getProviderScannedTickets,
  parseQrPayload,
  resolveTicketMoneyEUR,
  rollupMealTicketsAccounting,
  subscribeMealTicketsReset,
  validateMealTicketScan,
} from "../../utils/mealTicketRecord";

interface RepasPrestataireViewProps {
  provider: MealProviderIdentity;
  mealTickets: MealTicket[];
  setMealTickets: React.Dispatch<React.SetStateAction<MealTicket[]>>;
}

const TICKET_AMOUNT_EXPLANATION =
  "Le montant de chaque ticket correspond au total des subventions (ministérielle + interministérielle) de l’agent, calculé à la génération selon son lieu et son INM.";

export function RepasPrestataireView({
  provider,
  mealTickets,
  setMealTickets,
}: RepasPrestataireViewProps) {
  const currentMonth = getCurrentMonth();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [listPage, setListPage] = useState(1);
  const [lastValidated, setLastValidated] = useState<MealTicket | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    return subscribeMealTicketsReset(() => {
      setLastValidated(null);
      setScanFeedback(null);
      setListPage(1);
    });
  }, []);

  useEffect(() => {
    if (lastValidated && !mealTickets.some((t) => t.id === lastValidated.id)) {
      setLastValidated(null);
    }
  }, [mealTickets, lastValidated]);

  const stats = useMemo(
    () => getProviderScanStats(mealTickets, provider.id, currentMonth),
    [mealTickets, provider.id, currentMonth],
  );

  const scannedTickets = useMemo(
    () => getProviderScannedTickets(mealTickets, provider.id),
    [mealTickets, provider.id],
  );

  const availableMonths = useMemo(() => {
    const months = new Set(scannedTickets.map((t) => t.month));
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  }, [scannedTickets, currentMonth]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scannedTickets.filter((ticket) => {
      if (filterMonth !== "all" && ticket.month !== filterMonth) return false;
      if (!q) return true;
      const haystack = [
        ticket.ticketNumber,
        ticket.agentName,
        ticket.agentEmail,
        ticket.service,
        ticket.domain,
        ticket.location,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [scannedTickets, filterMonth, search]);

  const paginatedTickets = filteredTickets.slice(
    (listPage - 1) * TABLE_LIST_PAGE_SIZE,
    listPage * TABLE_LIST_PAGE_SIZE,
  );

  const moneyRollupSelection = useMemo(
    () => rollupMealTicketsAccounting(filteredTickets),
    [filteredTickets],
  );

  const lastValidatedMoney = useMemo(() => {
    if (!lastValidated) return null;
    return resolveTicketMoneyEUR(lastValidated);
  }, [lastValidated]);

  const processValidation = useCallback(
    (payload: string) => {
      const parsed = parseQrPayload(payload);
      if (!parsed) {
        const msg = "QR code non reconnu. Vérifiez qu'il s'agit d'un ticket repas DIRM.";
        setScanFeedback({ type: "error", message: msg });
        toast.error(msg, { position: "bottom-center" });
        return;
      }

      setMealTickets((prev) => {
        const { tickets: updated, result } = validateMealTicketScan(prev, parsed, provider);
        if (result.success && result.ticket) {
          setLastValidated(result.ticket);
          setScanFeedback({ type: "success", message: result.message });
          toast.success(result.message, { position: "bottom-center" });
        } else {
          setScanFeedback({ type: "error", message: result.message });
          toast.error(result.message, { position: "bottom-center" });
        }
        return updated;
      });
    },
    [provider, setMealTickets],
  );

  const handleManualValidation = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("GOUDURIX-REPAS")) {
      processValidation(trimmed);
    } else {
      const ticket = mealTickets.find(
        (t) => t.ticketNumber.toUpperCase() === trimmed.toUpperCase() && t.status === "active",
      );
      if (ticket) {
        processValidation(buildQrPayload(ticket));
      } else {
        toast.error("Ticket introuvable ou déjà utilisé.");
      }
    }
    setManualCode("");
  };

  return (
    <div className="space-y-8">
      {/* Indicateurs tout en haut de page */}
      <section className="space-y-6" aria-labelledby="prestataire-indicateurs">
        <div>
          <h2 id="prestataire-indicateurs" className="text-sm font-semibold text-slate-900">
            Indicateurs
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Activité&nbsp;: validations et volumes · Montant&nbsp;: somme des subventions agent sur les
            tickets scannés correspondant au filtre de l&apos;historique.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <RepasStatCard
            label="Scannés aujourd'hui"
            value={stats.today}
            sub="Validations du jour"
            icon={ScanLine}
            accent="teal"
          />
          <RepasStatCard
            label="Scannés ce mois"
            value={stats.thisMonth}
            sub={formatMonthLabel(currentMonth)}
            icon={Ticket}
            accent="emerald"
          />
          <RepasStatCard
            label="Repas servis · total"
            value={stats.totalMeals}
            sub="Historique depuis l’ouverture du compte"
            icon={UtensilsCrossed}
            accent="cyan"
          />
          <RepasStatCard
            label="Tickets validés · total"
            value={stats.totalTickets}
            sub={stats.totalTickets === 1 ? "Une validation cumulée" : "Validations cumulées"}
            icon={CheckCircle2}
            accent="sky"
          />
        </div>

        <RepasStatCard
          label="Montant tickets scannés"
          value={formatEuro(moneyRollupSelection.scannedAmountEUR)}
          sub={`${moneyRollupSelection.scannedTicketCount} ticket(s) · Σ subventions agent (filtre historique)`}
          icon={Coins}
          accent="amber"
          layout="currency"
        />

        <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-900/[0.02]">
          <span className="font-semibold text-slate-800">Montant du ticket&nbsp;:</span>{" "}
          {TICKET_AMOUNT_EXPLANATION}
        </p>
      </section>

      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-800/90">
            Espace prestataire
          </p>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/[0.12] text-teal-700 ring-1 ring-teal-600/15">
              <UtensilsCrossed className="h-[1.35rem] w-[1.35rem]" strokeWidth={1.75} />
            </span>
            <span className="text-balance">{provider.name}</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-slate-700 ring-1 ring-slate-200">
              <Building2 className="h-3.5 w-3.5 text-teal-600" aria-hidden />
              {provider.email}
            </span>
            {provider.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden />
                {provider.location}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm ring-1 ring-slate-900/[0.04] sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Période en cours</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
            {formatMonthLabel(currentMonth)}
          </p>
        </div>
      </header>

      {/* Scanner + dernière validation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          className={cn(
            "overflow-hidden border border-teal-200/65 bg-white",
            "shadow-[0_4px_28px_-12px_rgba(13,148,136,0.18)] ring-1 ring-slate-900/[0.03]",
          )}
        >
          <CardHeader className="border-b border-teal-100/70 bg-teal-50/25 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg text-teal-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/[0.12] text-teal-700 ring-1 ring-teal-600/10">
                <ScanLine className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.85} />
              </span>
              Scanner un ticket
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-slate-600">
              L’agent présente son QR&nbsp;: une fois accepté, le ticket est définitivement consommé.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            {scanFeedback && (
              <div
                role="alert"
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium leading-snug",
                  scanFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50/90 text-emerald-950 ring-1 ring-emerald-500/10"
                    : "border-red-200 bg-red-50/90 text-red-950 ring-1 ring-red-500/10",
                )}
              >
                {scanFeedback.message}
              </div>
            )}
            <MealTicketScanner onScan={processValidation} scannerId="prestataire-qr-scanner" />

            <div className="space-y-3 border-t border-slate-100 pt-5">
              <Label htmlFor="manual-code" className="text-slate-700">
                Saisie manuelle <span className="font-normal text-slate-400">(n° ticket ou QR)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  placeholder="TR-202605-00001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualValidation()}
                  className="h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-teal-500/35"
                />
                <Button
                  onClick={handleManualValidation}
                  className="h-11 shrink-0 bg-teal-600 px-5 hover:bg-teal-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Valider
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "overflow-hidden border border-emerald-200/65 bg-white",
            "shadow-[0_4px_28px_-12px_rgba(16,185,129,0.22)] ring-1 ring-slate-900/[0.03]",
          )}
        >
          <CardHeader className="border-b border-emerald-100/70 bg-emerald-50/20 pb-4">
            <CardTitle className="text-lg text-emerald-950">Dernière validation</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-slate-600">
              Détail du dernier ticket accepté depuis ce poste.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {lastValidated ? (
              <div className="space-y-5 rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 ring-1 ring-emerald-500/8">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-600/25">
                    <CheckCircle2 className="h-7 w-7" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-emerald-950 text-lg tracking-tight">Ticket validé</p>
                    <p className="mt-1 font-mono text-sm text-emerald-800">{lastValidated.ticketNumber}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:gap-x-6">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Agent
                    </dt>
                    <dd className="font-medium text-slate-900">{lastValidated.agentName}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Repas
                    </dt>
                    <dd className="font-bold tabular-nums text-emerald-800">
                      {lastValidated.mealIndex != null
                        ? `n° ${lastValidated.mealIndex}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Service
                    </dt>
                    <dd className="text-slate-800">{lastValidated.service}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Lieu
                    </dt>
                    <dd className="text-slate-800">{lastValidated.location || "—"}</dd>
                  </div>
                  <div className="col-span-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-emerald-100/80">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Validé le
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatTicketDate(lastValidated.usedAt)}
                    </dd>
                  </div>
                  {lastValidatedMoney ? (
                    <div className="col-span-2 grid gap-3 border-t border-emerald-200/55 pt-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-amber-50/80 px-3 py-3 ring-1 ring-amber-100/90">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/90">
                          Montant ticket
                        </p>
                        <p className="mt-2 text-lg font-bold tabular-nums text-amber-950">
                          {formatEuro(lastValidatedMoney.ticketAmountEUR)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-violet-50/85 px-3 py-3 ring-1 ring-violet-100/95">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-900/85">
                          Ministérielle
                        </p>
                        <p className="mt-2 text-lg font-bold tabular-nums text-violet-950">
                          {formatEuro(lastValidatedMoney.subsidyMinisterialEUR)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-teal-50/95 px-3 py-3 ring-1 ring-teal-200/90">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                          Interministérielle
                        </p>
                        <p className="mt-2 text-lg font-bold tabular-nums text-teal-900">
                          {formatEuro(lastValidatedMoney.subsidyInterministerialEUR)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/35 py-14 text-center text-slate-400">
                <ScanLine className="mb-3 h-14 w-14 opacity-35" aria-hidden />
                <p className="font-medium text-slate-500">Aucune validation récente</p>
                <p className="mt-1 max-w-[16rem] text-sm text-slate-400">
                  Scannez un ticket&nbsp;: un récapitulatif apparaît ici après le scan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique des tickets scannés */}
      <Card className="overflow-hidden border border-slate-200/90 bg-white shadow-[0_2px_20px_-8px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.02]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/35 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/[0.1] text-teal-700">
              <ClipboardList className="h-[18px] w-[18px]" strokeWidth={1.85} />
            </span>
            Historique · tickets scannés
          </CardTitle>
          <CardDescription>
            Filtrez par mois ou recherche&nbsp;: montants indicativement reliés aux barèmes enregistrés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par agent, n° ticket, service..."
                className="pl-9"
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
              <SelectTrigger>
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatMonthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-inner">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/50 text-left">
                    <th className="whitespace-nowrap p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        N° ticket
                      </span>
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        Agent
                      </span>
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Service
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Lieu
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Mois ticket
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Repas
                    </th>
                    <th className="whitespace-nowrap p-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Montant
                    </th>
                    <th className="whitespace-nowrap p-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Min.
                    </th>
                    <th className="whitespace-nowrap p-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Inter.
                    </th>
                    <th className="whitespace-nowrap p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Scanné le
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-500">
                        Aucun ticket scanné pour cette sélection
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket, rowIdx) => {
                      const mv = resolveTicketMoneyEUR(ticket);
                      return (
                        <tr
                          key={ticket.id}
                          className={cn(
                            "transition-colors hover:bg-teal-50/[0.45]",
                            rowIdx % 2 === 1 && "bg-slate-50/40",
                          )}
                        >
                          <td className="whitespace-nowrap p-3 font-mono text-xs font-medium text-teal-900">
                            {ticket.ticketNumber}
                          </td>
                          <td className="p-3 align-top">
                            <p className="font-medium text-slate-900">{ticket.agentName}</p>
                            <p className="truncate text-[11px] text-slate-400">{ticket.agentEmail}</p>
                          </td>
                          <td className="max-w-[8rem] truncate p-3 text-slate-700">{ticket.service}</td>
                          <td className="max-w-[7rem] truncate p-3 text-slate-600">
                            {ticket.location || "—"}
                          </td>
                          <td className="whitespace-nowrap p-3 text-slate-600">
                            {formatMonthLabel(ticket.month)}
                          </td>
                          <td className="p-3 text-center tabular-nums font-semibold text-emerald-800">
                            {ticket.mealIndex ?? "—"}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right text-sm tabular-nums font-semibold text-amber-900">
                            {formatEuro(mv.ticketAmountEUR)}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right text-sm tabular-nums font-semibold text-violet-900">
                            {formatEuro(mv.subsidyMinisterialEUR)}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right text-sm tabular-nums font-semibold text-teal-900">
                            {formatEuro(mv.subsidyInterministerialEUR)}
                          </td>
                          <td className="whitespace-nowrap p-3 text-xs text-slate-600">
                            {formatTicketDate(ticket.usedAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ListPaginationBar
            currentPage={listPage}
            totalPages={Math.max(1, Math.ceil(filteredTickets.length / TABLE_LIST_PAGE_SIZE))}
            totalItems={filteredTickets.length}
            onPageChange={setListPage}
            itemLabel="ticket(s) scanné(s)"
          />
        </CardContent>
      </Card>
    </div>
  );
}
