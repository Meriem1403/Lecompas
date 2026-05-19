import React from "react";
import { ChevronRight, Ticket } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import {
  MealTicket,
  formatMonthLabel,
  formatTicketDate,
} from "../../utils/mealTicketRecord";
import { formatEuro } from "../../utils/mealSubsidyRecord";
import { MealTicketStatusBadge } from "./MealTicketStatusBadge";

interface AgentTicketListCardProps {
  ticket: MealTicket;
  onSelect: (ticket: MealTicket) => void;
}

export function AgentTicketListCard({ ticket, onSelect }: AgentTicketListCardProps) {
  const title =
    ticket.mealIndex != null
      ? `Repas n°${ticket.mealIndex}`
      : `Ticket — ${formatMonthLabel(ticket.month)}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(ticket)}
      className="w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Card className="border border-slate-200 shadow-sm transition-all hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30 active:scale-[0.99]">
        <CardContent className="p-4 flex items-center gap-3">
          <div
            className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${
              ticket.status === "active"
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Ticket className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="font-semibold text-gray-900 truncate">{title}</p>
              <MealTicketStatusBadge status={ticket.status} />
            </div>
            <p className="text-xs font-mono text-gray-500 truncate">
              N° {ticket.ticketNumber}
            </p>
            {ticket.status === "used" && ticket.usedAt && (
              <p className="text-xs text-gray-600 mt-1 truncate">
                Validé le {formatTicketDate(ticket.usedAt)}
                {ticket.usedByProviderName && ` — ${ticket.usedByProviderName}`}
              </p>
            )}
            {ticket.subsidyTotal != null && ticket.subsidyTotal > 0 && (
              <p className="text-xs text-emerald-700 mt-1 font-medium">
                Subvention {formatEuro(ticket.subsidyTotal)}
              </p>
            )}
            {ticket.status === "active" && (
              <p className="text-xs text-blue-700 mt-1">Appuyer pour voir le QR code</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
        </CardContent>
      </Card>
    </button>
  );
}
