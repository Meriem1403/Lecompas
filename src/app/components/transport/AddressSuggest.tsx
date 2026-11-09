import { useEffect, useId, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface AddressValue {
  rue: string;
  commune: string;
  codePostal: string;
}

interface BanFeature {
  properties?: {
    label?: string;
    name?: string;
    postcode?: string;
    city?: string;
    housenumber?: string;
    street?: string;
  };
}

interface AddressSuggestProps {
  title: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  idPrefix: string;
}

export function AddressSuggest({ title, value, onChange, idPrefix }: AddressSuggestProps) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<BanFeature["properties"][]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const search = (query: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = window.setTimeout(() => {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query.trim())}&limit=5`;
      void fetch(url)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { features?: BanFeature[] } | null) => {
          const next = (payload?.features || [])
            .map((feature) => feature.properties)
            .filter((item): item is NonNullable<BanFeature["properties"]> => Boolean(item?.label));
          setSuggestions(next);
          setOpen(next.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
        });
    }, 280);
  };

  const apply = (item: NonNullable<BanFeature["properties"]>) => {
    const street = [item.housenumber, item.street].filter(Boolean).join(" ");
    onChange({
      rue: street || value.rue,
      commune: item.city || value.commune,
      codePostal: item.postcode || value.codePostal,
    });
    setOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="relative sm:col-span-2">
        <Label htmlFor={`${idPrefix}-rue`}>{title} — n° et rue</Label>
        <Input
          id={`${idPrefix}-rue`}
          className="mt-1 border-sky-200 bg-white"
          value={value.rue}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          placeholder="Commencez à taper une adresse"
          onChange={(event) => {
            onChange({ ...value, rue: event.target.value });
            search(event.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-sky-200 bg-white shadow-lg"
          >
            {suggestions.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-sky-50"
                  onClick={() => apply(item)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="relative">
        <Label htmlFor={`${idPrefix}-commune`}>Commune</Label>
        <Input
          id={`${idPrefix}-commune`}
          className="mt-1 border-sky-200 bg-white"
          value={value.commune}
          autoComplete="off"
          placeholder="Marseille"
          onChange={(event) => {
            onChange({ ...value, commune: event.target.value });
            search(event.target.value);
          }}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-cp`}>Code postal</Label>
        <Input
          id={`${idPrefix}-cp`}
          className="mt-1 border-sky-200 bg-white"
          value={value.codePostal}
          inputMode="numeric"
          placeholder="13001"
          onChange={(event) => onChange({ ...value, codePostal: event.target.value.replace(/[^\d]/g, "").slice(0, 5) })}
        />
      </div>
    </div>
  );
}
