import React, { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Search,
  Ticket,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ListPaginationBar, TABLE_LIST_PAGE_SIZE } from "../ui/list-pagination-bar";
import { AppUser } from "../admin/UserManagementView";
import { RepasStatCard } from "./RepasStatCard";
import { MealTicketStatusBadge } from "./MealTicketStatusBadge";
import {
  MealTicket,
  filterTickets,
  formatMonthLabel,
  formatTicketDate,
  getChefTeamStats,
  getCurrentMonth,
} from "../../utils/mealTicketRecord";
import { isMealTicketRecipient } from "../../utils/userRoles";

interface RepasChefServiceViewProps {
  chef: AppUser;
  adminUsers: AppUser[];
  mealTickets: MealTicket[];
}

function TeamTicketCard({ ticket }: { ticket: MealTicket }) {
  return (
    <Card className="border-l-4 border-l-indigo-500 shadow-sm bg-white">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <div>
            <p className="font-bold text-gray-900">{ticket.agentName}</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{ticket.ticketNumber}</p>
          </div>
          <MealTicketStatusBadge status={ticket.status} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <p>
            <span className="text-gray-500">Repas n° :</span>{" "}
            <span className="font-semibold text-indigo-700">{ticket.mealIndex ?? "—"}</span>
          </p>
          <p>
            <span className="text-gray-500">Lieu :</span> {ticket.location}
          </p>
        </div>
        {ticket.status === "used" && ticket.usedAt && (
          <p className="text-xs text-gray-600 bg-slate-50 rounded-lg p-2">
            Validé le {formatTicketDate(ticket.usedAt)}
            {ticket.usedByProviderName && ` par ${ticket.usedByProviderName}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function RepasChefServiceView({
  chef,
  adminUsers,
  mealTickets,
}: RepasChefServiceViewProps) {
  const currentMonth = getCurrentMonth();
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterStatus, setFilterStatus] = useState<"all" | MealTicket["status"]>("all");
  const [search, setSearch] = useState("");
  const [listPage, setListPage] = useState(1);

  const scope = useMemo(
    () => ({
      service: chef.service,
      domain: chef.domain,
      location: chef.location,
    }),
    [chef],
  );

  const teamMembers = useMemo(
    () =>
      adminUsers.filter(
        (u) => isMealTicketRecipient(u) && u.service === chef.service,
      ),
    [adminUsers, chef.service],
  );

  const stats = useMemo(
    () => getChefTeamStats(mealTickets, filterMonth, scope),
    [mealTickets, filterMonth, scope],
  );

  const availableMonths = useMemo(() => {
    const months = new Set(
      mealTickets
        .filter((t) => t.service === chef.service)
        .map((t) => t.month),
    );
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  }, [mealTickets, chef.service, currentMonth]);

  const filteredTickets = useMemo(
    () =>
      filterTickets(mealTickets, {
        month: filterMonth,
        service: chef.service,
        domain: scope.domain?.trim() ? scope.domain : "all",
        location: scope.location?.trim() ? scope.location : "all",
        status: filterStatus,
        search,
      }).sort((a, b) => a.agentName.localeCompare(b.agentName)),
    [mealTickets, filterMonth, chef.service, scope, filterStatus, search],
  );

  const paginated = filteredTickets.slice(
    (listPage - 1) * TABLE_LIST_PAGE_SIZE,
    listPage * TABLE_LIST_PAGE_SIZE,
  );
  const listTotalPages = Math.max(1, Math.ceil(filteredTickets.length / TABLE_LIST_PAGE_SIZE));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 p-4 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Espace chef de service
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2 flex-wrap">
          <Building2 className="h-6 w-6 text-indigo-600 shrink-0" />
          Service {chef.service}
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Suivi des tickets repas de votre équipe — {teamMembers.length} collaborateur
          {teamMembers.length !== 1 ? "s" : ""} dans le service
        </p>
        {(chef.domain || chef.location) && (
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
            {chef.domain && <span>Domaine : {chef.domain}</span>}
            {chef.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {chef.location}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <RepasStatCard
          label="Collaborateurs"
          value={teamMembers.length}
          icon={Users}
          accent="violet"
        />
        <RepasStatCard
          label="Tickets émis"
          value={stats.ticketsIssued}
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

      <Card className="border-0 shadow-md bg-white/90">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un agent..."
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
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="used">Utilisés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredTickets.length === 0 ? (
        <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="py-10 text-center text-gray-500 px-4">
            Aucun ticket pour cette sélection.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {paginated.map((ticket) => (
              <TeamTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          <Card className="hidden lg:block border-0 shadow-xl bg-white/80 overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-violet-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">N° ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Repas</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Lieu</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-indigo-50/30">
                      <td className="px-4 py-3 font-medium">{ticket.agentName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">
                        {ticket.mealIndex ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{ticket.location}</td>
                      <td className="px-4 py-3">
                        <MealTicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ticket.status === "used"
                          ? formatTicketDate(ticket.usedAt)
                          : "—"}
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
  );
}
