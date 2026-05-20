import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Download, Loader2, QrCode, Ticket, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { downloadAgentMealTicketsMonthZip } from "../../utils/mealTicketPdfExport";
import { ListPaginationBar } from "../ui/list-pagination-bar";

const AGENT_TICKETS_PAGE_SIZE = 30;
import { AppUser } from "../admin/UserManagementView";
import { RepasStatCard } from "./RepasStatCard";
import { AgentTicketListCard } from "./AgentTicketListCard";
import { RepasAgentTicketDetailView } from "./RepasAgentTicketDetailView";
import {
  formatMonthLabel,
  getAgentAvailableMonths,
  getAgentMonthSummary,
  getAgentTicketsForMonth,
  getCurrentMonth,
  MealTicket,
} from "../../utils/mealTicketRecord";

interface RepasAgentViewProps {
  agent: AppUser;
  mealTickets: MealTicket[];
}

export function RepasAgentView({ agent, mealTickets }: RepasAgentViewProps) {
  const currentMonth = getCurrentMonth();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [listPage, setListPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<MealTicket | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipDownloadError, setZipDownloadError] = useState<string | null>(null);

  const availableMonths = useMemo(
    () => getAgentAvailableMonths(mealTickets, agent.id),
    [mealTickets, agent.id],
  );

  const summary = useMemo(
    () => getAgentMonthSummary(mealTickets, agent.id, filterMonth),
    [mealTickets, agent.id, filterMonth],
  );

  const monthTickets = useMemo(
    () => getAgentTicketsForMonth(mealTickets, agent.id, filterMonth),
    [mealTickets, agent.id, filterMonth],
  );

  const currentMonthTickets = useMemo(
    () => getAgentTicketsForMonth(mealTickets, agent.id, currentMonth),
    [mealTickets, agent.id, currentMonth],
  );

  const totalPages = Math.max(1, Math.ceil(monthTickets.length / AGENT_TICKETS_PAGE_SIZE));
  const paginatedTickets = monthTickets.slice(
    (listPage - 1) * AGENT_TICKETS_PAGE_SIZE,
    listPage * AGENT_TICKETS_PAGE_SIZE,
  );

  useEffect(() => {
    setListPage(1);
    setSelectedTicket(null);
  }, [filterMonth]);

  useEffect(() => {
    if (listPage > totalPages) {
      setListPage(totalPages);
    }
  }, [listPage, totalPages]);

  const handleDownloadCurrentMonthZip = async () => {
    setZipDownloadError(null);
    setIsDownloadingZip(true);
    try {
      await downloadAgentMealTicketsMonthZip(
        currentMonthTickets,
        agent.name,
        currentMonth,
      );
    } catch {
      setZipDownloadError("Impossible de générer l'archive ZIP. Réessayez.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  if (selectedTicket) {
    const freshTicket =
      mealTickets.find((t) => t.id === selectedTicket.id) ?? selectedTicket;
    return (
      <RepasAgentTicketDetailView
        ticket={freshTicket}
        agentName={agent.name}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <RepasStatCard
          label="Repas restants"
          value={summary.mealsRemaining}
          sub={`${summary.activeTickets.length} QR actif(s) — ${formatMonthLabel(filterMonth)}`}
          icon={UtensilsCrossed}
          accent="emerald"
        />
        <RepasStatCard
          label="Repas utilisés"
          value={summary.mealsUsed}
          sub={`${summary.usedTickets.length} scan(s) ce mois`}
          icon={Ticket}
          accent="sky"
        />
        <RepasStatCard
          label="Tickets émis"
          value={summary.totalTickets}
          sub={formatMonthLabel(filterMonth)}
          icon={Calendar}
          accent="violet"
        />
      </div>

      <section>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Mes tickets repas
            </h2>
            <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[260px]">
              <Label
                htmlFor="agent-repas-month-filter"
                className="text-slate-900 font-semibold"
              >
                Filtrer par mois
              </Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger
                  id="agent-repas-month-filter"
                  aria-label="Filtrer par mois"
                  className="w-full min-h-11 bg-white border-2 border-slate-500 text-slate-900 font-medium shadow-sm hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 [&_svg]:text-slate-700 [&_[data-slot=select-value]]:text-slate-900"
                >
                  <SelectValue placeholder="Choisir un mois" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-300">
                  {availableMonths.map((m) => (
                    <SelectItem
                      key={m}
                      value={m}
                      className="text-slate-900 focus:bg-blue-50 focus:text-slate-900"
                    >
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentMonthTickets.length > 0 && (
            <Button
              type="button"
              variant="outline"
              className="gap-2 w-fit border-2 border-blue-600 text-blue-800 bg-blue-50 hover:bg-blue-100 font-medium"
              onClick={handleDownloadCurrentMonthZip}
              disabled={isDownloadingZip}
            >
              {isDownloadingZip ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger tous les tickets du mois en cours ({currentMonthTickets.length}{" "}
              PDF)
            </Button>
          )}
          {zipDownloadError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {zipDownloadError}
            </p>
          )}
        </div>

        {monthTickets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedTickets.map((ticket) => (
                <AgentTicketListCard
                  key={ticket.id}
                  ticket={ticket}
                  onSelect={setSelectedTicket}
                />
              ))}
            </div>
            <ListPaginationBar
              className="mt-4"
              currentPage={listPage}
              totalPages={totalPages}
              totalItems={monthTickets.length}
              itemLabel="ticket(s)"
              onPageChange={setListPage}
            />
          </>
        ) : (
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/40">
            <CardContent className="py-10 sm:py-12 text-center px-4">
              <QrCode className="h-14 w-14 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">
                Aucun ticket pour {formatMonthLabel(filterMonth)}
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Vos tickets n&apos;ont pas encore été générés pour ce mois.
                Contactez la comptabilité.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

