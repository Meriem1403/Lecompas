import type { ReservationSiteType } from "@/app/data/reservationCatalog";

export interface ResourceReservation {
  id: string;
  briefDescription: string;
  fullDescription: string;
  destinationCity: string;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  allDay: boolean;
  domainId: string;
  resourceIds: string[];
  siteType: ReservationSiteType | "";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
