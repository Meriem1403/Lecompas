import React, { useState } from "react";
import { ArrowLeft, Calendar, Download, Loader2, MapPin, Ticket, User } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { AgentTicketQrCard } from "./AgentTicketQrCard";
import {
  MealTicket,
  formatMonthLabel,
  formatTicketDate,
} from "../../utils/mealTicketRecord";
import { downloadMealTicketPdf } from "../../utils/mealTicketPdfExport";
import { MealTicketStatusBadge } from "./MealTicketStatusBadge";

interface RepasAgentTicketDetailViewProps {
  ticket: MealTicket;
  agentName: string;
  onBack: () => void;
}

export function RepasAgentTicketDetailView({
  ticket,
  agentName,
  onBack,
}: RepasAgentTicketDetailViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      await downloadMealTicketPdf(ticket, agentName);
    } catch {
      setDownloadError("Impossible de générer le PDF. Réessayez.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button type="button" variant="outline" className="gap-2 w-fit" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour à mes tickets
        </Button>
        <Button
          type="button"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-fit"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Télécharger le PDF
        </Button>
      </div>
      {downloadError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {downloadError}
        </p>
      )}

      <Card className="border border-slate-200 bg-slate-50/50">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="h-6 w-6 text-blue-600 shrink-0" />
                {ticket.mealIndex != null
                  ? `Repas n°${ticket.mealIndex}`
                  : "Détail du ticket"}
              </h1>
              <p className="text-sm font-mono text-gray-500 mt-1">
                N° {ticket.ticketNumber}
              </p>
            </div>
            <MealTicketStatusBadge status={ticket.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                <span className="text-gray-500">Titulaire :</span> {agentName}
              </span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                <span className="text-gray-500">Mois :</span>{" "}
                {formatMonthLabel(ticket.month)}
              </span>
            </p>
            <p className="flex items-center gap-2 text-gray-700 sm:col-span-2">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                <span className="text-gray-500">Service :</span> {ticket.service}
                {ticket.domain && ` — ${ticket.domain}`}
                {ticket.location && ` — ${ticket.location}`}
              </span>
            </p>
            {ticket.generatedAt && (
              <p className="text-gray-600 sm:col-span-2">
                <span className="text-gray-500">Émis le :</span>{" "}
                {formatTicketDate(ticket.generatedAt)}
                {ticket.generatedBy && ` par ${ticket.generatedBy}`}
              </p>
            )}
            {ticket.status === "used" && ticket.usedAt && (
              <p className="text-emerald-800 bg-emerald-50 rounded-lg p-3 sm:col-span-2">
                <span className="font-medium">Validé le </span>
                {formatTicketDate(ticket.usedAt)}
                {ticket.usedByProviderName && (
                  <>
                    {" "}
                    par <span className="font-medium">{ticket.usedByProviderName}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AgentTicketQrCard ticket={ticket} />
    </div>
  );
}
