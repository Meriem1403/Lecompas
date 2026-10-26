import {
  ALL_DAY_END,
  ALL_DAY_START,
  PLANNER_SLOT_MINUTES,
} from "@/app/data/reservationCatalog";
import type { ResourceReservation } from "./types";

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatMinutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function reservationEndMinutes(reservation: ResourceReservation): number {
  if (reservation.allDay) {
    return parseTimeToMinutes(ALL_DAY_END);
  }
  return (
    parseTimeToMinutes(reservation.startTime) + reservation.durationMinutes
  );
}

export function reservationStartMinutes(
  reservation: ResourceReservation,
): number {
  if (reservation.allDay) {
    return parseTimeToMinutes(ALL_DAY_START);
  }
  return parseTimeToMinutes(reservation.startTime);
}

export function reservationOverlapsSlot(
  reservation: ResourceReservation,
  resourceId: string,
  slotStartMin: number,
  slotEndMin: number,
  date: string,
): boolean {
  if (reservation.startDate !== date) return false;
  if (!reservation.resourceIds.includes(resourceId)) return false;
  const start = reservationStartMinutes(reservation);
  const end = reservationEndMinutes(reservation);
  return start < slotEndMin && end > slotStartMin;
}

export function generatePlannerSlots(): { label: string; startMin: number }[] {
  const start = parseTimeToMinutes(ALL_DAY_START);
  const end = parseTimeToMinutes(ALL_DAY_END);
  const slots: { label: string; startMin: number }[] = [];
  for (let t = start; t < end; t += PLANNER_SLOT_MINUTES) {
    slots.push({ label: formatMinutesToTime(t), startMin: t });
  }
  return slots;
}
