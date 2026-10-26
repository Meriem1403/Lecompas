import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  RESERVATION_DOMAINS,
  RESERVATION_RESOURCES,
  RESERVATION_SITE_TYPES,
} from "@/app/data/reservationCatalog";
import type { ResourceReservation } from "./types";
import {
  AlignLeft,
  CalendarClock,
  Car,
  Check,
  Clock,
  MapPin,
  Sparkles,
  Tag,
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";

export interface ReservationFormValues {
  briefDescription: string;
  fullDescription: string;
  destinationCity: string;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  allDay: boolean;
  domainId: string;
  resourceIds: string[];
  siteType: string;
}

interface ReservationFormProps {
  initial?: Partial<ReservationFormValues>;
  currentUserName: string;
  onSubmit: (values: ReservationFormValues) => void;
  onCancel: () => void;
}

const DURATION_PRESETS = [30, 60, 120, 240] as const;

const defaultValues = (): ReservationFormValues => ({
  briefDescription: "",
  fullDescription: "",
  destinationCity: "",
  startDate: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  durationMinutes: 30,
  allDay: false,
  domainId: "vehicules-zattara",
  resourceIds: [],
  siteType: "",
});

export function ReservationForm({
  initial,
  currentUserName,
  onSubmit,
  onCancel,
}: ReservationFormProps) {
  const [values, setValues] = useState<ReservationFormValues>(() => ({
    ...defaultValues(),
    ...initial,
  }));

  useEffect(() => {
    if (initial) {
      setValues({ ...defaultValues(), ...initial });
    }
  }, [initial]);

  const resourcesForDomain = useMemo(
    () => RESERVATION_RESOURCES.filter((r) => r.domainId === values.domainId),
    [values.domainId],
  );

  const toggleResource = (id: string, multi: boolean) => {
    setValues((prev) => {
      if (multi) {
        const set = new Set(prev.resourceIds);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return { ...prev, resourceIds: [...set] };
      }
      return { ...prev, resourceIds: [id] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.briefDescription.trim()) return;
    if (!values.destinationCity.trim()) return;
    if (!values.siteType) return;
    if (values.resourceIds.length === 0) return;
    onSubmit(values);
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Nouvelle réservation
            </h2>
            <p className="mt-1 text-indigo-100 text-sm">
              Demandeur : <span className="font-medium">{currentUserName}</span>
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-indigo-100 bg-white/90 p-4 sm:p-6 lg:p-8 shadow-lg backdrop-blur-sm xl:grid xl:grid-cols-12 xl:gap-8 xl:space-y-0"
      >
        <div className="space-y-6 xl:col-span-7 2xl:col-span-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-900">
            <AlignLeft className="h-5 w-5" />
            <h3 className="font-semibold">Objet du déplacement</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="briefDescription">
                Brève description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="briefDescription"
                className="mt-1.5 h-11"
                placeholder="Ex. Visite chantier, réunion inter-sites…"
                value={values.briefDescription}
                onChange={(e) =>
                  setValues((v) => ({ ...v, briefDescription: e.target.value }))
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fullDescription">Description complète</Label>
              <Textarea
                id="fullDescription"
                rows={3}
                className="mt-1.5 resize-none"
                placeholder="Précisions utiles pour le service logistique…"
                value={values.fullDescription}
                onChange={(e) =>
                  setValues((v) => ({ ...v, fullDescription: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="destinationCity">
                Ville de destination <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="destinationCity"
                  className="h-11 pl-10"
                  placeholder="Marseille, Ajaccio…"
                  value={values.destinationCity}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      destinationCity: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label>
                Type / site <span className="text-red-500">*</span>
              </Label>
              <Select
                value={values.siteType || undefined}
                onValueChange={(siteType) =>
                  setValues((v) => ({ ...v, siteType }))
                }
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Choisir un site" />
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_SITE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 text-indigo-900">
            <CalendarClock className="h-5 w-5" />
            <h3 className="font-semibold">Créneau</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="startDate">Date</Label>
              <Input
                id="startDate"
                type="date"
                className="mt-1.5 h-11"
                value={values.startDate}
                onChange={(e) =>
                  setValues((v) => ({ ...v, startDate: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Heure de début</Label>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="startTime"
                  type="time"
                  className="h-11 pl-10"
                  disabled={values.allDay}
                  value={values.startTime}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, startTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration">Durée</Label>
              <div className="mt-1.5 flex h-11 items-center gap-2 rounded-md border border-input bg-background px-3">
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  disabled={values.allDay}
                  className="border-0 p-0 h-auto shadow-none focus-visible:ring-0"
                  value={values.durationMinutes}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      durationMinutes: Number(e.target.value) || 30,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground shrink-0">
                  min
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((mins) => (
              <Button
                key={mins}
                type="button"
                size="sm"
                variant={
                  values.durationMinutes === mins && !values.allDay
                    ? "default"
                    : "outline"
                }
                disabled={values.allDay}
                onClick={() =>
                  setValues((v) => ({ ...v, durationMinutes: mins }))
                }
              >
                {mins < 60 ? `${mins} min` : `${mins / 60} h`}
              </Button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <Checkbox
              checked={values.allDay}
              onCheckedChange={(checked) =>
                setValues((v) => ({ ...v, allDay: checked === true }))
              }
            />
            <span className="text-sm font-medium text-indigo-950">
              Toute la journée (7h – 20h)
            </span>
          </label>
        </section>
        </div>

        <section className="space-y-4 border-t border-slate-100 pt-6 xl:col-span-5 2xl:col-span-4 xl:border-t-0 xl:border-l xl:border-slate-100 xl:pt-0 xl:pl-8">
          <div className="flex items-center gap-2 text-indigo-900">
            <Car className="h-5 w-5" />
            <h3 className="font-semibold">Ressources</h3>
          </div>
          <div>
            <Label>Domaine</Label>
            <Select
              value={values.domainId}
              onValueChange={(domainId) =>
                setValues((v) => ({ ...v, domainId, resourceIds: [] }))
              }
            >
              <SelectTrigger className="mt-1.5 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESERVATION_DOMAINS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Cliquez pour sélectionner · Maintenez Ctrl (⌘) pour en choisir
            plusieurs
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {resourcesForDomain.map((resource) => {
              const selected = values.resourceIds.includes(resource.id);
              return (
                <button
                  key={resource.id}
                  type="button"
                  onClick={(e) =>
                    toggleResource(resource.id, e.ctrlKey || e.metaKey)
                  }
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all",
                    selected
                      ? "border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-200"
                      : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50",
                  )}
                >
                  {selected ? (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                  <span className="font-semibold text-slate-900 pr-8 block">
                    {resource.label}
                  </span>
                  {resource.detail ? (
                    <span className="mt-1 block text-xs text-slate-500">
                      {resource.detail}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {values.resourceIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {values.resourceIds.map((id) => {
                const label =
                  RESERVATION_RESOURCES.find((r) => r.id === id)?.label ?? id;
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {label}
                  </Badge>
                );
              })}
            </div>
          ) : null}
        </section>

        <p className="text-xs text-muted-foreground xl:col-span-12">
          Les champs marqués d&apos;un * sont obligatoires.
        </p>

        <div className="flex flex-wrap gap-3 justify-end border-t border-slate-100 pt-6 xl:col-span-12">
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            Enregistrer la réservation
          </Button>
        </div>
      </form>
    </div>
  );
}

export function formValuesToReservation(
  values: ReservationFormValues,
  id: string,
  createdBy: string,
  existing?: ResourceReservation,
): ResourceReservation {
  const now = new Date().toISOString();
  return {
    id,
    briefDescription: values.briefDescription.trim(),
    fullDescription: values.fullDescription.trim(),
    destinationCity: values.destinationCity.trim(),
    startDate: values.startDate,
    startTime: values.allDay ? "07:00" : values.startTime,
    durationMinutes: values.allDay ? 780 : values.durationMinutes,
    allDay: values.allDay,
    domainId: values.domainId,
    resourceIds: values.resourceIds,
    siteType: values.siteType as ResourceReservation["siteType"],
    createdBy,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
