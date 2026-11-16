import { HeartHandshake } from "lucide-react";

export function SignalementShortcut({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Déposer un signalement"
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-950 shadow-sm hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
        <HeartHandshake className="h-4 w-4" aria-hidden />
      </span>
      Signaler
    </button>
  );
}
