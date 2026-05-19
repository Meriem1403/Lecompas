/** Heure au format HH:mm (24 h). */
export function getDefaultAccidentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function normalizeAccidentTime(
  time: string | undefined,
  fallbackIso?: string,
): string {
  if (time && /^\d{2}:\d{2}$/.test(time)) return time;
  if (fallbackIso) {
    const d = new Date(fallbackIso);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }
  return "09:00";
}

export function formatAccidentDateFr(date: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatAccidentDateShortFr(date: string): string {
  if (!date) return "—";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("fr-FR");
}

export function formatAccidentDateTimeFr(date: string, time?: string): string {
  const datePart = formatAccidentDateShortFr(date);
  const t = normalizeAccidentTime(time);
  return `${datePart} à ${t}`;
}
