import React, { useMemo, useState } from "react";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import {
  Calendar,
  Car,
  Plus,
  ArrowLeft,
  List,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  RESERVATION_DOMAINS,
  RESERVATION_RESOURCES,
} from "@/app/data/reservationCatalog";
import type { ResourceReservation } from "@/app/components/reservations/types";
import { ReservationDayPlanner } from "@/app/components/reservations/ReservationDayPlanner";
import {
  ReservationForm,
  formValuesToReservation,
  type ReservationFormValues,
} from "@/app/components/reservations/ReservationForm";
import {
  formatMinutesToTime,
  reservationEndMinutes,
} from "@/app/components/reservations/reservationTimeUtils";
import { cn } from "@/app/components/ui/utils";

const seedReservations: ResourceReservation[] = [
  {
    id: "seed-1",
    briefDescription: "Visite chantier Littoral - Marseillan + CM34",
    fullDescription: "",
    destinationCity: "Sète",
    startDate: "2026-10-26",
    startTime: "07:00",
    durationMinutes: 780,
    allDay: true,
    domainId: "vehicules-zattara",
    resourceIds: ["peugeot-308"],
    siteType: "Marseille",
    createdBy: "Jean-Marc DUBOIS",
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
  },
  {
    id: "seed-2",
    briefDescription: "déplacement SEF CORSE AJACCIO BASTIA",
    fullDescription: "",
    destinationCity: "AJACCIO",
    startDate: "2026-10-26",
    startTime: "15:00",
    durationMinutes: 300,
    allDay: false,
    domainId: "vehicules-zattara",
    resourceIds: ["renault-clio"],
    siteType: "Corse",
    createdBy: "Pierre LECLERC",
    createdAt: "2026-10-21T09:00:00.000Z",
    updatedAt: "2026-10-21T09:00:00.000Z",
  },
];

type ViewMode = "planning" | "form" | "list";

const domainIcon = (domainId: string) => {
  if (domainId.includes("vehicule")) return Car;
  if (domainId.includes("visio")) return Video;
  return Building2;
};

interface ReservationsViewProps {
  accessToken?: string;
  currentUserName?: string;
  onBack?: () => void;
}

export function ReservationsView({
  accessToken = "",
  currentUserName = "Utilisateur",
  onBack,
}: ReservationsViewProps) {
  const [reservations, setReservations] = useAppDataDocumentStore<
    ResourceReservation[]
  >(APP_DATA_KEYS.resourceReservations, accessToken, {
    seed: seedReservations,
  });

  const [viewMode, setViewMode] = useState<ViewMode>("planning");
  const [planDate, setPlanDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [planDomainId, setPlanDomainId] = useState("vehicules-zattara");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInitial, setFormInitial] = useState<
    Partial<ReservationFormValues> | undefined
  >(undefined);

  const resourcesInDomain = useMemo(
    () => RESERVATION_RESOURCES.filter((r) => r.domainId === planDomainId),
    [planDomainId],
  );

  const dayReservations = useMemo(
    () => reservations.filter((r) => r.startDate === planDate),
    [reservations, planDate],
  );

  const domainStats = useMemo(() => {
    return RESERVATION_DOMAINS.map((d) => {
      const count = dayReservations.filter((r) => r.domainId === d.id).length;
      const resources = RESERVATION_RESOURCES.filter(
        (r) => r.domainId === d.id,
      ).length;
      return { ...d, count, resources };
    });
  }, [dayReservations]);

  const shiftPlanDate = (delta: number) => {
    const d = new Date(`${planDate}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setPlanDate(d.toISOString().slice(0, 10));
  };

  const openCreate = (resourceId?: string, time?: string) => {
    setEditingId(null);
    setFormInitial({
      startDate: planDate,
      startTime: time ?? "09:00",
      domainId: planDomainId,
      resourceIds: resourceId ? [resourceId] : [],
    });
    setViewMode("form");
  };

  const openEdit = (reservation: ResourceReservation) => {
    setEditingId(reservation.id);
    setFormInitial({
      briefDescription: reservation.briefDescription,
      fullDescription: reservation.fullDescription,
      destinationCity: reservation.destinationCity,
      startDate: reservation.startDate,
      startTime: reservation.startTime,
      durationMinutes: reservation.durationMinutes,
      allDay: reservation.allDay,
      domainId: reservation.domainId,
      resourceIds: reservation.resourceIds,
      siteType: reservation.siteType,
    });
    setViewMode("form");
  };

  const handleSave = (values: ReservationFormValues) => {
    const id = editingId ?? `res-${Date.now()}`;
    const existing = reservations.find((r) => r.id === id);
    const next = formValuesToReservation(
      values,
      id,
      currentUserName,
      existing,
    );
    setReservations((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      }
      return [...prev, next];
    });
    toast.success(
      editingId ? "Réservation modifiée" : "Réservation enregistrée",
    );
    setViewMode("planning");
    setPlanDate(values.startDate);
    setPlanDomainId(values.domainId);
  };

  const handleDelete = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    toast.success("Réservation supprimée");
    setViewMode("planning");
  };

  const planDateLabel = useMemo(() => {
    try {
      return new Date(`${planDate}T12:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return planDate;
    }
  }, [planDate]);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-gradient-to-br from-slate-50 via-indigo-50/80 to-violet-50">
      <div className="border-b border-indigo-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm shrink-0">
        <div className="w-full px-3 sm:px-5 lg:px-8 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBack ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 border-indigo-200"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
                  <Calendar className="h-5 w-5" />
                </span>
                Réservations
              </h1>
              <p className="text-sm text-slate-600 mt-0.5 truncate">
                Véhicules, salles et visio — planning intuitif
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === "planning" ? "default" : "outline"}
              size="sm"
              className={cn(
                viewMode === "planning" &&
                  "bg-indigo-600 hover:bg-indigo-700",
              )}
              onClick={() => setViewMode("planning")}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Planning
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              className={cn(
                viewMode === "list" && "bg-indigo-600 hover:bg-indigo-700",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1.5" />
              Liste
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md"
              onClick={() => openCreate()}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle réservation
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1 px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        {viewMode === "form" ? (
          <ReservationForm
            initial={formInitial}
            currentUserName={currentUserName}
            onSubmit={handleSave}
            onCancel={() => setViewMode("planning")}
          />
        ) : null}

        {viewMode === "planning" ? (
          <div className="flex min-h-0 w-full min-w-0 flex-col gap-4 lg:flex-row lg:gap-5">
            <aside className="w-full shrink-0 space-y-4 lg:w-52 xl:w-56 2xl:w-60">
              <div className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-3">
                  Domaines
                </p>
                <ul className="space-y-2">
                  {domainStats.map((d) => {
                    const Icon = domainIcon(d.id);
                    const active = planDomainId === d.id;
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => setPlanDomainId(d.id)}
                          className={cn(
                            "w-full rounded-xl p-3 text-left transition-all border",
                            active
                              ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm ring-1 ring-indigo-200"
                              : "border-transparent hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                active
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-slate-900 leading-snug">
                                {d.label}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {d.resources} ressource
                                {d.resources > 1 ? "s" : ""}
                              </p>
                            </div>
                            {d.count > 0 ? (
                              <Badge
                                variant="secondary"
                                className="shrink-0 bg-indigo-100 text-indigo-800"
                              >
                                {d.count}
                              </Badge>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-4">
                <div className="flex items-center gap-2 text-indigo-800 mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Astuce</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Survolez le planning et cliquez sur{" "}
                  <Plus className="inline h-3 w-3" /> pour réserver un créneau
                  libre en un clic.
                </p>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-4 w-full">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-white/90 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => shiftPlanDate(-1)}
                    aria-label="Jour précédent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => shiftPlanDate(1)}
                    aria-label="Jour suivant"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">
                      {planDateLabel}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dayReservations.length} réservation
                      {dayReservations.length !== 1 ? "s" : ""} ce jour
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="planDate" className="sr-only">
                    Date
                  </Label>
                  <Input
                    id="planDate"
                    type="date"
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                    className="w-auto h-10 border-indigo-100"
                  />
                </div>
              </div>

              <ReservationDayPlanner
                date={planDate}
                resources={resourcesInDomain}
                reservations={dayReservations.filter(
                  (r) => r.domainId === planDomainId,
                )}
                onCreateAt={(resourceId, time) =>
                  openCreate(resourceId, time)
                }
                onOpenReservation={openEdit}
              />
            </div>
          </div>
        ) : null}

        {viewMode === "list" ? (
          <ul className="grid w-full min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[...reservations]
              .sort((a, b) =>
                `${b.startDate}${b.startTime}`.localeCompare(
                  `${a.startDate}${a.startTime}`,
                ),
              )
              .map((r) => {
                const end = formatMinutesToTime(reservationEndMinutes(r));
                const domainLabel =
                  RESERVATION_DOMAINS.find((d) => d.id === r.domainId)
                    ?.label ?? r.domainId;
                return (
                  <li
                    key={r.id}
                    className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-md transition hover:shadow-lg hover:border-indigo-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {domainLabel}
                      </Badge>
                      {r.allDay ? (
                        <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                          Journée
                        </Badge>
                      ) : null}
                    </div>
                    <p className="font-semibold text-slate-900 leading-snug">
                      {r.briefDescription}
                    </p>
                    <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                        {r.startDate} · {r.allDay ? "7h – 20h" : `${r.startTime} → ${end}`}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                        {r.destinationCity}
                        {r.siteType ? ` · ${r.siteType}` : ""}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                      {r.resourceIds
                        .map(
                          (id) =>
                            RESERVATION_RESOURCES.find((x) => x.id === id)
                              ?.label ?? id,
                        )
                        .join(" · ")}
                    </p>
                    <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(r)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(r.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </li>
                );
              })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
