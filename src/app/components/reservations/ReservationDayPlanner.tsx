import React from "react";
import { MapPin, Plus } from "lucide-react";
import type { ReservationResource } from "@/app/data/reservationCatalog";
import { PLANNER_SLOT_MINUTES } from "@/app/data/reservationCatalog";
import type { ResourceReservation } from "./types";
import {
  formatMinutesToTime,
  generatePlannerSlots,
  reservationEndMinutes,
  reservationOverlapsSlot,
  reservationStartMinutes,
} from "./reservationTimeUtils";
import { cn } from "@/app/components/ui/utils";

interface ReservationDayPlannerProps {
  date: string;
  resources: ReservationResource[];
  reservations: ResourceReservation[];
  onCreateAt: (resourceId: string, time: string) => void;
  onOpenReservation: (reservation: ResourceReservation) => void;
}

export function ReservationDayPlanner({
  date,
  resources,
  reservations,
  onCreateAt,
  onOpenReservation,
}: ReservationDayPlannerProps) {
  const slots = generatePlannerSlots();
  const resourceColPercent =
    resources.length > 0 ? `${100 / resources.length}%` : "auto";

  if (resources.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/60 p-12 text-center w-full">
        <p className="text-gray-600">
          Choisissez un domaine pour afficher les ressources disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 rounded-2xl border border-indigo-100/80 bg-white shadow-lg shadow-indigo-100/40 overflow-hidden flex flex-col flex-1">
      <div className="min-w-0 w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-14 sm:w-16" />
            {resources.map((resource) => (
              <col key={resource.id} style={{ width: resourceColPercent }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-20 border-b border-indigo-100 bg-gradient-to-b from-slate-50 to-white p-2 sm:p-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                Heure
              </th>
              {resources.map((resource) => (
                <th
                  key={resource.id}
                  className="border-b border-l border-indigo-100 bg-gradient-to-b from-indigo-50/90 to-white p-2 sm:p-3 text-left align-top"
                >
                  <span className="font-semibold text-indigo-950 block leading-snug text-xs sm:text-sm">
                    {resource.label}
                  </span>
                  {resource.detail ? (
                    <span className="mt-1 block text-[10px] sm:text-xs font-normal text-slate-500 line-clamp-2">
                      {resource.detail}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              const slotEnd = slot.startMin + PLANNER_SLOT_MINUTES;
              return (
                <tr key={slot.startMin} className="group">
                  <td className="sticky left-0 z-10 border-b border-indigo-50 bg-white/95 px-2 sm:px-3 py-1 font-mono text-[10px] sm:text-xs text-slate-500">
                    {slot.label}
                  </td>
                  {resources.map((resource) => {
                    const active = reservations.find(
                      (r) =>
                        reservationOverlapsSlot(
                          r,
                          resource.id,
                          slot.startMin,
                          slotEnd,
                          date,
                        ) &&
                        reservationStartMinutes(r) === slot.startMin,
                    );
                    const occupied = reservations.some((r) =>
                      reservationOverlapsSlot(
                        r,
                        resource.id,
                        slot.startMin,
                        slotEnd,
                        date,
                      ),
                    );

                    if (active) {
                      const endLabel = formatMinutesToTime(
                        reservationEndMinutes(active),
                      );
                      return (
                        <td
                          key={resource.id}
                          className="border-b border-l border-indigo-50 p-0.5 sm:p-1 align-top"
                        >
                          <button
                            type="button"
                            onClick={() => onOpenReservation(active)}
                            className={cn(
                              "w-full rounded-lg sm:rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-1.5 sm:p-2.5 text-left",
                              "shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-emerald-300/60",
                            )}
                          >
                            <span className="line-clamp-2 text-[10px] sm:text-xs font-semibold text-emerald-950">
                              {active.briefDescription}
                            </span>
                            <span className="mt-0.5 sm:mt-1 block text-[10px] sm:text-[11px] text-emerald-800">
                              {active.allDay
                                ? "Journée entière"
                                : `${active.startTime} → ${endLabel}`}
                            </span>
                            <span className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-700">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {active.destinationCity}
                            </span>
                          </button>
                        </td>
                      );
                    }

                    if (occupied) {
                      return (
                        <td
                          key={resource.id}
                          className="border-b border-l border-indigo-50 bg-emerald-50/40"
                        />
                      );
                    }

                    return (
                      <td
                        key={resource.id}
                        className="border-b border-l border-indigo-50 p-0.5"
                      >
                        <button
                          type="button"
                          title="Réserver ce créneau"
                          onClick={() => onCreateAt(resource.id, slot.label)}
                          className="flex h-8 sm:h-9 w-full items-center justify-center rounded-lg text-indigo-400 opacity-0 transition group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:opacity-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
