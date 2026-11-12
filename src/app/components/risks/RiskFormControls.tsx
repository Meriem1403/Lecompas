export interface DirectoryPerson {
  id: string;
  fullName: string;
  service?: string;
  domain?: string;
  location?: string;
}

export function directoryNames(users: DirectoryPerson[]): Set<string> {
  return new Set(
    users
      .map((user) => user.fullName.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function namesOutsideDirectory(
  names: string[],
  users: DirectoryPerson[],
): string[] {
  const known = directoryNames(users);
  const unknown: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || known.has(trimmed.toLowerCase())) continue;
    if (!unknown.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      unknown.push(trimmed);
    }
  }
  return unknown;
}

export type ChoiceTone = "blue" | "indigo" | "emerald" | "violet";

const choiceTone: Record<ChoiceTone, { on: string; off: string; mark: string }> = {
  blue: {
    on: "border-blue-300 bg-blue-50 text-blue-800 shadow-sm",
    off: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50",
    mark: "border-blue-600 bg-blue-600 text-white",
  },
  indigo: {
    on: "border-indigo-300 bg-indigo-50 text-indigo-800 shadow-sm",
    off: "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50",
    mark: "border-indigo-600 bg-indigo-600 text-white",
  },
  emerald: {
    on: "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm",
    off: "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50",
    mark: "border-emerald-600 bg-emerald-600 text-white",
  },
  violet: {
    on: "border-violet-300 bg-violet-50 text-violet-800 shadow-sm",
    off: "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/50",
    mark: "border-violet-600 bg-violet-600 text-white",
  },
};

function ChoiceMark({ checked, mark }: { checked: boolean; mark: string }) {
  return (
    <span
      className={
        checked
          ? `mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${mark}`
          : "mt-0.5 h-5 w-5 shrink-0 rounded-md border border-slate-300 bg-white"
      }
      aria-hidden
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export function ChoicePills({
  legend,
  options,
  selected,
  onToggle,
  emptyHint,
  tone = "blue",
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string, next: boolean) => void;
  emptyHint: string;
  tone?: ChoiceTone;
}) {
  const palette = choiceTone[tone];
  return (
    <fieldset className="min-w-0">
      {legend ? (
        <legend className="mb-3 text-sm font-semibold text-slate-700">{legend}</legend>
      ) : null}
      {options.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">{emptyHint}</p>
      ) : (
        <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={checked}
                onClick={() => onToggle(option, !checked)}
                className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${checked ? palette.on : palette.off}`}
              >
                <ChoiceMark checked={checked} mark={palette.mark} />
                <span className="min-w-0 break-words leading-5">{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export function DirectoryUserSelect({
  id,
  value,
  users,
  onChange,
}: {
  id: string;
  value: string;
  users: DirectoryPerson[];
  onChange: (fullName: string) => void;
}) {
  const known = directoryNames(users).has(value.trim().toLowerCase());
  return (
    <div className="relative min-w-0">
      <select
        id={id}
        value={known ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm text-slate-900 shadow-sm"
      >
        <option value="">Choisir dans Utilisateurs</option>
        {users.map((user) => (
          <option key={user.id} value={user.fullName}>
            {user.fullName}
            {user.service ? `, ${user.service}` : ""}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden>
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      {value.trim() && !known ? (
        <p className="mt-1 text-xs text-amber-800">
          « {value} » n’est pas un compte d’Utilisateurs. Choisissez une personne de la liste.
        </p>
      ) : null}
    </div>
  );
}

export function DirectoryUserPills({
  users,
  selected,
  onChange,
}: {
  users: DirectoryPerson[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const known = directoryNames(users);
  const unknown = selected.filter(
    (name) => name.trim() && !known.has(name.trim().toLowerCase()),
  );
  const palette = choiceTone.violet;
  return (
    <div className="space-y-2">
      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Aucun compte dans Utilisateurs.</p>
      ) : (
        <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1">
          {users.map((user) => {
            const active = selected.some(
              (name) => name.trim().toLowerCase() === user.fullName.trim().toLowerCase(),
            );
            return (
              <button
                key={user.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const next = active
                    ? selected.filter(
                        (name) =>
                          name.trim().toLowerCase() !== user.fullName.trim().toLowerCase(),
                      )
                    : [...selected, user.fullName];
                  onChange(next);
                }}
                className={`flex min-w-0 items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? palette.on : palette.off}`}
              >
                <ChoiceMark checked={active} mark={palette.mark} />
                <span className="min-w-0 break-words leading-5">
                  {user.fullName}
                  {user.service ? <span className="font-normal opacity-80">, {user.service}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {unknown.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(selected.filter((item) => item !== name))}
          className="block w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900"
        >
          {name} n’est pas dans Utilisateurs. Retirer.
        </button>
      ))}
    </div>
  );
}
