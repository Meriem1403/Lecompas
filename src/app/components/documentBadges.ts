import type { Document } from "@/app/components/DocumentsView";

export const DOCUMENT_COLORS = [
  { id: "violet", label: "Violet", badge: "border-violet-200 bg-violet-100 text-violet-950", tile: "bg-violet-600" },
  { id: "indigo", label: "Indigo", badge: "border-indigo-200 bg-indigo-100 text-indigo-950", tile: "bg-indigo-600" },
  { id: "ardoise", label: "Ardoise", badge: "border-slate-200 bg-slate-100 text-slate-800", tile: "bg-slate-600" },
  { id: "emeraude", label: "Émeraude", badge: "border-emerald-200 bg-emerald-100 text-emerald-950", tile: "bg-emerald-600" },
  { id: "ambre", label: "Ambre", badge: "border-amber-200 bg-amber-100 text-amber-950", tile: "bg-amber-600" },
  { id: "rose", label: "Rose", badge: "border-rose-200 bg-rose-100 text-rose-950", tile: "bg-rose-600" },
  { id: "ciel", label: "Ciel", badge: "border-sky-200 bg-sky-100 text-sky-950", tile: "bg-sky-700" },
] as const;

export type DocumentColorId = (typeof DOCUMENT_COLORS)[number]["id"];

export const DOCUMENT_STATUSES: Document["status"][] = [
  "Brouillon",
  "En validation",
  "Validé",
  "Envoyé pour signature",
  "Signé",
  "Refusé",
  "Obsolète",
];

export const DOCUMENT_STATUS_STYLES: Record<Document["status"], string> = {
  Brouillon: "border-slate-300 bg-slate-100 text-slate-800",
  "En validation": "border-sky-300 bg-sky-100 text-sky-900",
  "Validé": "border-emerald-300 bg-emerald-100 text-emerald-950",
  "Envoyé pour signature": "border-indigo-300 bg-indigo-100 text-indigo-950",
  "Signé": "border-emerald-400 bg-emerald-50 text-emerald-950",
  "Refusé": "border-rose-400 bg-rose-50 text-rose-950",
  "Obsolète": "border-rose-300 bg-rose-100 text-rose-900",
};

export function documentColor(id?: string) {
  return DOCUMENT_COLORS.find((color) => color.id === id) ?? DOCUMENT_COLORS[0];
}
