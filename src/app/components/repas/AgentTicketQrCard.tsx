import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { MealTicket, buildQrPayload, formatMonthLabel } from "../../utils/mealTicketRecord";
import { MealTicketStatusBadge } from "./MealTicketStatusBadge";

export function AgentTicketQrCard({ ticket }: { ticket: MealTicket }) {
  const payload = buildQrPayload(ticket);
  const isUsed = ticket.status === "used";

  return (
    <Card className="border-2 border-blue-100 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
              <Ticket className="h-5 w-5 shrink-0" />
              {ticket.mealIndex != null
                ? `Repas n°${ticket.mealIndex}`
                : `Ticket — ${formatMonthLabel(ticket.month)}`}
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-sm">
              N° {ticket.ticketNumber}
            </CardDescription>
          </div>
          <MealTicketStatusBadge status={ticket.status} />
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm order-2 md:order-1">
            <p>
              <span className="text-gray-500">Usage :</span>{" "}
              <span className="font-bold text-blue-700">1 repas — QR unique</span>
            </p>
            <p>
              <span className="text-gray-500">Service :</span>{" "}
              <span className="font-medium">{ticket.service}</span>
            </p>
            <p>
              <span className="text-gray-500">Domaine :</span>{" "}
              <span className="font-medium">{ticket.domain || "—"}</span>
            </p>
            <p>
              <span className="text-gray-500">Lieu :</span>{" "}
              <span className="font-medium">{ticket.location || "—"}</span>
            </p>
            {isUsed && ticket.usedAt && (
              <p className="text-amber-800 bg-amber-50 rounded-lg p-3 text-sm">
                Validé le {new Date(ticket.usedAt).toLocaleString("fr-FR")}
                {ticket.usedByProviderName && ` par ${ticket.usedByProviderName}`}
              </p>
            )}
            {!isUsed && (
              <p className="text-emerald-800 bg-emerald-50 rounded-lg p-3 text-sm">
                Présentez ce QR code au prestataire. Une fois validé, le ticket ne pourra plus
                être utilisé.
              </p>
            )}
          </div>
          <div className="flex flex-col items-center justify-center order-1 md:order-2">
            <div
              className={`relative p-3 sm:p-4 bg-white rounded-2xl border-2 ${
                isUsed ? "border-gray-200 opacity-50" : "border-blue-200"
              }`}
            >
              <QRCodeSVG value={payload} size={180} level="H" includeMargin />
              {isUsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                  <div className="text-center">
                    <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-2" />
                    <p className="font-bold text-red-600 text-sm">Ticket utilisé</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
