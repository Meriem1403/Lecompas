import { getPriorityBandFromGfm } from "@/app/services/riskPriority";
import { formatMoyenMaitriseLabel } from "@/app/utils/riskManagementFilterLogic";

export function RiskEvaluationFacts({
  calculPriorite,
  moyenMaitrise,
  riskLevel,
  prioriteFinale,
}: {
  calculPriorite: number;
  moyenMaitrise?: string;
  riskLevel: number;
  prioriteFinale: number;
}) {
  const band = getPriorityBandFromGfm(riskLevel);
  const bandClass = band === "P1" ? "text-rose-700" : band === "P2" ? "text-orange-700" : "text-emerald-700";
  const items = [
    { label: "Priorité initiale", value: String(calculPriorite), accent: "bg-amber-400", valueClass: "text-slate-900" },
    { label: "Moyen de maîtrise", value: formatMoyenMaitriseLabel(moyenMaitrise), accent: "bg-teal-500", valueClass: "text-slate-900" },
    { label: "Niveau GFM", value: String(riskLevel), accent: "bg-violet-500", valueClass: "text-slate-900" },
    { label: "P1/P2/P3", value: band, accent: band === "P1" ? "bg-rose-500" : band === "P2" ? "bg-orange-500" : "bg-emerald-500", valueClass: bandClass },
    { label: "Priorité finale", value: String(prioriteFinale), accent: "bg-indigo-500", valueClass: "text-slate-900" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
      <div className="grid grid-cols-2 gap-px lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 bg-white px-4 py-3">
            <span className={`mb-2 block h-0.5 w-7 rounded-full ${item.accent}`} />
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className={`mt-1 break-words text-sm font-semibold leading-snug ${item.valueClass}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RiskProgress({ completed, total }: { completed: number; total: number }) {
  const width = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-600">Avancement</span>
        <span className="font-semibold text-slate-900">{completed}/{total}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
