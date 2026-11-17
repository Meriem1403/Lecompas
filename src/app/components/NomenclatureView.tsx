import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Copy, Search, SlidersHorizontal } from "lucide-react";
import { ListPaginationBar, LIST_PAGE_SIZE_OPTIONS } from "@/app/components/ui/list-pagination-bar";
import { Switch } from "@/app/components/ui/switch";
import {
  NOMENCLATURE_DELIVERED_ON,
  chorusText,
  entryByCode,
  hasAccount,
  isUnused,
  nomenclatureDomains,
  nomenclatureSegments,
  searchNomenclature,
  subsidyBeneficiaries,
  subsidyBeneficiaryLabel,
  subsidyMatches,
  subsidySenses,
  SUBSIDY_NATURES,
  type NomenclatureEntry,
  type SubsidyMatch,
  type SubsidyNature,
  type SubsidySens,
} from "@/app/utils/nomenclature";

const RECENT_KEY = "lecompas_nomenclature_recent";
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function deliveredLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const label = day === 1 ? "1er" : String(day);
  return `${label} ${MONTHS[month - 1]} ${year}`;
}
const panel = "rounded-3xl border border-emerald-100 bg-white";
const quietBtn = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50";
const line = "h-12 w-full rounded-xl border border-emerald-200 bg-white px-3 text-base text-stone-800 outline-none focus:border-emerald-500";
const selectLine = line;

function foldText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function pageOf<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return { current, totalPages, slice: items.slice(start, start + pageSize), show: items.length > LIST_PAGE_SIZE_OPTIONS[0] || pageSize !== LIST_PAGE_SIZE_OPTIONS[0] };
}

function loadRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function remember(code: string) {
  const next = [code, ...loadRecent().filter((item) => item !== code)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

async function copyValue(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copié.`);
  } catch {
    toast.error("La copie a échoué.");
  }
}

function Choice({ pressed, label, detail, onClick }: { pressed: boolean; label: string; detail?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-left ${pressed ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-950 hover:border-emerald-300"}`}
    >
      <span className="block text-sm font-medium">{label}</span>
      {detail ? <span className={`mt-0.5 block text-[12px] leading-5 ${pressed ? "text-emerald-50" : "text-stone-500"}`}>{detail}</span> : null}
    </button>
  );
}

function ResultCard({ match, onUse, showImmo = false }: { match: SubsidyMatch; onUse: (code: string) => void; showImmo?: boolean }) {
  const { entry, hint } = match;
  const account = hasAccount(entry);
  const use = (value: string, label: string) => {
    onUse(entry.code);
    void copyValue(value, label);
  };
  return (
    <article className={`${panel} p-4 sm:p-5`}>
      <p className="font-mono text-sm text-emerald-700">{entry.code}</p>
      <h3 className="mt-1 text-lg font-semibold text-emerald-950">{entry.shortLabel}</h3>
      <p className="mt-1 text-sm leading-6 text-stone-600">{entry.longLabel}</p>
      <p className="mt-2 text-sm text-stone-500">{entry.domainLabel} · {entry.segmentLabel}</p>
      <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-emerald-800">Compte PCE</p>
        {account ? (
          <>
            <p className="mt-1 font-mono text-lg text-emerald-950">{entry.pce}</p>
            <p className="text-sm text-stone-600">{entry.pceLabel}</p>
          </>
        ) : (
          <p className="mt-1 text-sm leading-6 text-stone-700">
            {entry.pce === "TECHNIQUE"
              ? "Compte technique. La fiche immobilisation donne le compte PCE, le GM ne le dérive pas."
              : "Aucun compte PCE n'est dérivé de ce GM."}
          </p>
        )}
      </div>
      {entry.stockPce ? <p className="mt-3 text-sm text-stone-600">Stock : <span className="font-mono">{entry.stockPce}</span> {entry.stockLabel}</p> : null}
      {hint ? <p className="mt-3 text-sm leading-6 text-amber-900">{hint}</p> : null}
      {entry.legacy ? <p className="mt-3 text-sm leading-6 text-amber-900">Ancien GM, préfixé EX-. Il sert à solder un engagement déjà ouvert.</p> : null}
      {isUnused(entry) ? <p className="mt-3 text-sm leading-6 text-rose-800">Ce GM est marqué « ne pas utiliser ».</p> : null}
      {showImmo && entry.immo && account ? <p className="mt-3 text-sm leading-6 text-stone-600">Une immobilisation peut être saisie sur ce GM. La fiche immobilisation remplace alors ce compte de charge.</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={quietBtn} onClick={() => use(entry.code, "GM")}><Copy className="h-4 w-4" /> Copier le GM</button>
        {account ? <button type="button" className={quietBtn} onClick={() => use(entry.pce, "PCE")}><Copy className="h-4 w-4" /> Copier le PCE</button> : null}
        {account ? <button type="button" className={quietBtn} onClick={() => use(chorusText(entry), "GM et PCE")}><Copy className="h-4 w-4" /> Copier les deux</button> : null}
      </div>
    </article>
  );
}

export function NomenclatureView() {
  const [params] = useSearchParams();
  const dossierHint = params.get("q")?.trim() || "";
  const [mode, setMode] = useState<"subvention" | "recherche">(params.get("parcours") === "recherche" ? "recherche" : "subvention");
  const [nature, setNature] = useState<SubsidyNature | "">("");
  const [beneficiary, setBeneficiary] = useState("");
  const [sens, setSens] = useState<SubsidySens | "">("");
  const [query, setQuery] = useState(params.get("parcours") === "recherche" ? dossierHint : "");
  const [includeLegacy, setIncludeLegacy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [segment, setSegment] = useState("");
  const [account, setAccount] = useState<"" | "compte" | "technique">("");
  const [immo, setImmo] = useState<"" | "oui" | "non">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(LIST_PAGE_SIZE_OPTIONS[0]);
  const [guidedPage, setGuidedPage] = useState(1);
  const [guidedPageSize, setGuidedPageSize] = useState<number>(LIST_PAGE_SIZE_OPTIONS[0]);
  const [beneficiaryQuery, setBeneficiaryQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(loadRecent);

  const senses = nature && beneficiary ? subsidySenses(nature, beneficiary) : [];
  const activeSens: SubsidySens | "" = senses.length > 1 ? sens : senses[0] || "";
  const guided = useMemo(() => {
    if (!nature || !beneficiary) return [];
    if (senses.length > 1 && !sens) return [];
    return subsidyMatches(nature, beneficiary, activeSens);
  }, [nature, beneficiary, sens, senses.length, activeSens]);
  const found = useMemo(
    () => searchNomenclature(query, { includeLegacy, domain, segment, account, immo }),
    [query, includeLegacy, domain, segment, account, immo],
  );
  const domains = useMemo(() => nomenclatureDomains(includeLegacy), [includeLegacy]);
  const segments = useMemo(() => (domain ? nomenclatureSegments(domain, includeLegacy) : []), [domain, includeLegacy]);
  const filtersActive = Boolean(domain || segment || account || immo);
  const recentEntries = recent.map((code) => entryByCode(code)).filter((entry): entry is NomenclatureEntry => Boolean(entry));
  const searchPage = pageOf(found, page, pageSize);
  const guidedPageView = pageOf(guided, guidedPage, guidedPageSize);
  const beneficiaries = nature ? subsidyBeneficiaries(nature) : [];
  const visibleBeneficiaries = beneficiaries.filter((id) => foldText(subsidyBeneficiaryLabel(id)).includes(foldText(beneficiaryQuery.trim())));

  useEffect(() => { setPage(1); }, [query, includeLegacy, domain, segment, account, immo, pageSize]);
  useEffect(() => { setGuidedPage(1); }, [nature, beneficiary, sens, guidedPageSize]);

  const keep = (code: string) => setRecent(remember(code));

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 text-stone-800">
      <header className={`${panel} overflow-hidden`}>
        <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 px-5 py-5 sm:px-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-emerald-700">Comptabilité</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">Nomenclature GM et PCE</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Le groupe de marchandises décrit la nature de la dépense. Le compte PCE en découle. Référentiel DGFiP du {deliveredLabel(NOMENCLATURE_DELIVERED_ON)}. Les anciens codes EX- restent masqués.
          </p>
        </div>
      </header>

      {dossierHint ? (
        <p className={`${panel} px-5 py-4 text-sm leading-6 text-stone-700`}>
          Repère du dossier : <span className="font-medium text-emerald-950">{dossierHint}</span>. Les questions donnent le GM à saisir dans Chorus.
        </p>
      ) : null}

      <div role="tablist" aria-label="Façon de chercher" className="grid gap-2 sm:grid-cols-2">
        <button type="button" role="tab" aria-selected={mode === "subvention"} onClick={() => setMode("subvention")} className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium ${mode === "subvention" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-950"}`}>Subvention</button>
        <button type="button" role="tab" aria-selected={mode === "recherche"} onClick={() => setMode("recherche")} className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium ${mode === "recherche" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-950"}`}>Autre dépense</button>
      </div>

      {recentEntries.length ? (
        <section>
          <h2 className="text-sm font-medium text-emerald-950">Derniers codes copiés</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentEntries.map((entry) => (
              <button key={entry.code} type="button" className={quietBtn} onClick={() => { keep(entry.code); void copyValue(chorusText(entry), "GM et PCE"); }}>
                <span className="font-mono">{entry.code}</span>
                <span className="max-w-40 truncate text-stone-600">{entry.shortLabel}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "subvention" ? (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-medium text-emerald-950">1. Nature du versement</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {SUBSIDY_NATURES.map((item) => (
                <Choice key={item.id} pressed={nature === item.id} label={item.label} detail={item.detail} onClick={() => { setNature(item.id); setBeneficiary(""); setSens(""); setBeneficiaryQuery(""); }} />
              ))}
            </div>
          </div>
          {nature ? (
            <div>
              <h2 className="text-sm font-medium text-emerald-950">2. Bénéficiaire</h2>
              {beneficiaries.length > 8 ? (
                <input className={`${line} mt-2`} value={beneficiaryQuery} placeholder="Filtrer le bénéficiaire" onChange={(event) => setBeneficiaryQuery(event.target.value)} />
              ) : null}
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {visibleBeneficiaries.map((id) => (
                  <Choice key={id} pressed={beneficiary === id} label={subsidyBeneficiaryLabel(id)} onClick={() => { setBeneficiary(id); setSens(""); }} />
                ))}
              </div>
              {beneficiaryQuery && visibleBeneficiaries.length === 0 ? <p className="mt-2 text-sm text-stone-600">Aucun bénéficiaire ne correspond.</p> : null}
            </div>
          ) : null}
          {senses.length > 1 ? (
            <div>
              <h2 className="text-sm font-medium text-emerald-950">3. Sens du transfert</h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Choice pressed={sens === "direct"} label="Direct" detail="Le bénéficiaire reçoit le versement" onClick={() => setSens("direct")} />
                <Choice pressed={sens === "indirect"} label="Indirect" detail="Le versement passe par un tiers" onClick={() => setSens("indirect")} />
              </div>
            </div>
          ) : null}
          {guidedPageView.slice.length ? (
            <div className="grid gap-3">
              {guidedPageView.slice.map((match) => <ResultCard key={match.entry.code} match={match} onUse={keep} />)}
            </div>
          ) : null}
          {guidedPageView.show ? (
            <ListPaginationBar
              currentPage={guidedPageView.current}
              totalPages={guidedPageView.totalPages}
              totalItems={guided.length}
              itemLabel="GM"
              pageSize={guidedPageSize}
              onPageSizeChange={setGuidedPageSize}
              onPageChange={setGuidedPage}
              className="border-emerald-100 shadow-none"
            />
          ) : null}
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-medium text-emerald-950">Mot, code GM ou compte PCE</span>
            <span className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-emerald-700" />
              <input className={`${line} pl-10`} value={query} placeholder="électricité, 32.01.02, 6066110000" onChange={(event) => setQuery(event.target.value)} />
            </span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white px-4 py-3 sm:min-w-80">
              <div>
                <p className="text-sm font-medium text-emerald-950">Anciens GM (EX-)</p>
                <p className="text-[12px] leading-5 text-stone-500">Pour solder un engagement déjà ouvert.</p>
              </div>
              <Switch checked={includeLegacy} onCheckedChange={setIncludeLegacy} aria-label="Afficher les anciens GM" className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-stone-200" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)} className={quietBtn}>
                <SlidersHorizontal className="h-4 w-4" />
                {filtersOpen ? "Masquer les filtres" : "Filtres"}
              </button>
              {filtersActive ? (
                <button type="button" className={quietBtn} onClick={() => { setDomain(""); setSegment(""); setAccount(""); setImmo(""); }}>Réinitialiser</button>
              ) : null}
            </div>
          </div>
          {filtersOpen ? (
            <div className={`${panel} grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4`}>
              <label className="block text-sm font-medium text-emerald-950">
                Domaine
                <select className={`${selectLine} mt-2`} value={domain} onChange={(event) => { setDomain(event.target.value); setSegment(""); }}>
                  <option value="">Tous</option>
                  {domains.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-emerald-950">
                Segment
                <select className={`${selectLine} mt-2`} value={segment} disabled={!domain} onChange={(event) => setSegment(event.target.value)}>
                  <option value="">{domain ? "Tous" : "Choisir un domaine"}</option>
                  {segments.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-emerald-950">
                Compte
                <select className={`${selectLine} mt-2`} value={account} onChange={(event) => setAccount(event.target.value as "" | "compte" | "technique")}>
                  <option value="">Tous</option>
                  <option value="compte">Compte PCE chiffré</option>
                  <option value="technique">Compte technique</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-emerald-950">
                Immobilisation
                <select className={`${selectLine} mt-2`} value={immo} onChange={(event) => setImmo(event.target.value as "" | "oui" | "non")}>
                  <option value="">Toutes</option>
                  <option value="oui">Possible</option>
                  <option value="non">Non</option>
                </select>
              </label>
            </div>
          ) : null}
          {query.trim().length < 2 && !domain && !segment ? <p className="text-sm text-stone-600">Saisissez un mot, ou choisissez un domaine dans les filtres.</p> : null}
          {((query.trim().length >= 2) || domain || segment) && found.length === 0 ? <p className="text-sm text-stone-600">Aucun GM ne correspond.</p> : null}
          <div className="grid gap-3">
            {searchPage.slice.map((entry) => <ResultCard key={entry.code} match={{ entry, hint: "" }} onUse={keep} showImmo />)}
          </div>
          {searchPage.show ? (
            <ListPaginationBar
              currentPage={searchPage.current}
              totalPages={searchPage.totalPages}
              totalItems={found.length}
              itemLabel="GM"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={setPage}
              className="border-emerald-100 shadow-none"
            />
          ) : null}
        </section>
      )}
    </div>
  );
}
