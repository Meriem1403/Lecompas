import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Hash,
  MapPin,
  ScanLine,
  Search,
  Ticket,
  TrendingUp,
  User,
  UtensilsCrossed,
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
import { MealTicketScanner } from "./MealTicketScanner";
import { MealProviderIdentity } from "../../utils/userRoles";
import {
  MealTicket,
  buildQrPayload,
  formatMonthLabel,
  formatTicketDate,
  getCurrentMonth,
  getProviderScanStats,
  getProviderScannedTickets,
  parseQrPayload,
  validateMealTicketScan,
} from "../../utils/mealTicketRecord";

interface RepasPrestataireViewProps {
  provider: MealProviderIdentity;
  mealTickets: MealTicket[];
  setMealTickets: React.Dispatch<React.SetStateAction<MealTicket[]>>;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card className="border-2 border-white/60 bg-white/90 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div
            className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
    <div className="space-y-6">
      {/* En-tête prestataire */}
      <div className="rounded-2xl border-2 border-teal-100 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Espace prestataire
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <UtensilsCrossed className="h-7 w-7 text-teal-600" />
              {provider.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {provider.email}
              </span>
              {provider.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {provider.location}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-white/80 border border-teal-200 px-4 py-3 text-sm">
            <p className="text-slate-500">Période en cours</p>
            <p className="font-semibold text-teal-800">{formatMonthLabel(currentMonth)}</p>
          </div>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Scannés aujourd'hui"
          value={stats.today}
          sub="Validations du jour"
          icon={ScanLine}
          gradient="from-teal-500 to-emerald-500"
        />
        <StatCard
          label="Scannés ce mois"
          value={stats.thisMonth}
          sub={formatMonthLabel(currentMonth)}
          icon={Ticket}
          gradient="from-emerald-500 to-cyan-500"
        />
        <StatCard
          label="Repas servis (total)"
          value={stats.totalMeals}
          sub="Depuis l'ouverture du compte"
          icon={UtensilsCrossed}
          gradient="from-cyan-500 to-blue-500"
        />
        <StatCard
          label="Tickets validés (total)"
          value={stats.totalTickets}
          icon={TrendingUp}
          gradient="from-blue-500 to-indigo-500"
        />
      </div>

      {/* Scanner + dernière validation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-teal-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <ScanLine className="h-5 w-5" />
              Scanner un ticket
            </CardTitle>
            <CardDescription>
              Demandez à l'agent de présenter son QR code. Une fois validé, le ticket ne pourra
              plus être réutilisé.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanFeedback && (
              <div
                role="alert"
                className={`rounded-lg border-2 p-3 text-sm font-medium ${
                  scanFeedback.type === "success"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-red-300 bg-red-50 text-red-900"
                }`}
              >
                {scanFeedback.message}
              </div>
            )}
            <MealTicketScanner onScan={processValidation} scannerId="prestataire-qr-scanner" />

            <div className="border-t pt-4 space-y-3">
              <Label htmlFor="manual-code">Saisie manuelle (n° ticket ou code QR)</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  placeholder="TR-202605-00001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualValidation()}
                />
                <Button
                  onClick={handleManualValidation}
                  className="shrink-0 bg-teal-600 hover:bg-teal-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Valider
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="text-emerald-900">Dernière validation</CardTitle>
            <CardDescription>Résultat du dernier ticket scanné avec succès</CardDescription>
          </CardHeader>
          <CardContent>
            {lastValidated ? (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-lg">Ticket validé</p>
                    <p className="text-sm text-emerald-700 font-mono">{lastValidated.ticketNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Agent</p>
                    <p className="font-medium">{lastValidated.agentName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Repas</p>
                    <p className="font-bold text-emerald-700">
                      {lastValidated.mealIndex != null
                        ? `Repas n°${lastValidated.mealIndex}`
                        : "1 repas"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Service</p>
                    <p className="font-medium">{lastValidated.service}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Lieu</p>
                    <p className="font-medium">{lastValidated.location || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500">Validé le</p>
                    <p className="font-medium">{formatTicketDate(lastValidated.usedAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <ScanLine className="h-14 w-14 mb-3 opacity-40" />
                <p className="font-medium">Aucune validation récente</p>
                <p className="text-sm mt-1">Scannez un ticket pour voir le détail ici</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique des tickets scannés */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" />
            Mes tickets scannés
          </CardTitle>
          <CardDescription>
            Historique de tous les tickets que vous avez validés
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

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" /> N° ticket
                    </span>
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Agent
                    </span>
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-600">Service</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Lieu</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Mois ticket</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Repas</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Scanné le</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      Aucun ticket scanné pour cette sélection
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-teal-50/40">
                      <td className="p-3 font-mono text-xs text-teal-800">{ticket.ticketNumber}</td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{ticket.agentName}</p>
                        <p className="text-xs text-slate-400">{ticket.agentEmail}</p>
                      </td>
                      <td className="p-3 text-slate-700">{ticket.service}</td>
                      <td className="p-3 text-slate-700">{ticket.location || "—"}</td>
                      <td className="p-3 text-slate-700">{formatMonthLabel(ticket.month)}</td>
                      <td className="p-3 font-semibold text-emerald-700">
                        {ticket.mealIndex ?? "—"}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {formatTicketDate(ticket.usedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
