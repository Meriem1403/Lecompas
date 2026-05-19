import React, { useMemo, useState } from "react";
import { ArrowLeft, Coins, Layers, MapPin, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Location } from "../admin/UserManagementView";
import {
  InmSubsidyBracket,
  MealSubsidyConfig,
  MealSubsidyPeriod,
  MinisterialSubsidyRate,
  normalizeLocationKey,
  saveMealSubsidyConfig,
  upsertMinisterialRate,
} from "../../utils/mealSubsidyRecord";
import { toast } from "sonner";

interface MealSubsidyManagementViewProps {
  config: MealSubsidyConfig;
  setConfig: React.Dispatch<React.SetStateAction<MealSubsidyConfig>>;
  locations: Location[];
  onGoBack?: () => void;
  /** Intégré dans Repas admin : masque le bouton retour. */
  embedded?: boolean;
}

export function MealSubsidyManagementView({
  config,
  setConfig,
  locations,
  onGoBack,
  embedded = false,
}: MealSubsidyManagementViewProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    () => config.periods[0]?.id ?? "",
  );

  const selectedPeriod = useMemo(
    () => config.periods.find((p) => p.id === selectedPeriodId) ?? config.periods[0],
    [config.periods, selectedPeriodId],
  );

  const periodBrackets = useMemo(
    () =>
      config.inmBrackets
        .filter((b) => b.periodId === selectedPeriod?.id)
        .sort((a, b) => a.minInm - b.minInm),
    [config.inmBrackets, selectedPeriod?.id],
  );

  const periodMinisterial = useMemo(
    () =>
      config.ministerialRates.filter((r) => r.periodId === selectedPeriod?.id),
    [config.ministerialRates, selectedPeriod?.id],
  );

  const persist = (next: MealSubsidyConfig) => {
    setConfig(next);
    saveMealSubsidyConfig(next);
    toast.success("Tarifs enregistrés");
  };

  const updatePeriod = (patch: Partial<MealSubsidyPeriod>) => {
    if (!selectedPeriod) return;
    persist({
      ...config,
      periods: config.periods.map((p) =>
        p.id === selectedPeriod.id ? { ...p, ...patch } : p,
      ),
    });
  };

  const addPeriod = () => {
    const year = new Date().getFullYear() + 1;
    const id = `period-${year}`;
    const next: MealSubsidyPeriod = {
      id,
      label: String(year),
      validFrom: `${year}-01-01`,
      interministerialAmount: 1.62,
    };
    persist({
      ...config,
      periods: [...config.periods, next],
      inmBrackets: [
        ...config.inmBrackets,
        {
          id: `inm-${id}-low`,
          periodId: id,
          minInm: 0,
          maxInm: 539,
          grantsInterministerial: true,
        },
        {
          id: `inm-${id}-high`,
          periodId: id,
          minInm: 540,
          maxInm: 9999,
          grantsInterministerial: false,
        },
      ],
    });
    setSelectedPeriodId(id);
  };

  const saveBracket = (bracket: InmSubsidyBracket) => {
    const exists = config.inmBrackets.some((b) => b.id === bracket.id);
    const inmBrackets = exists
      ? config.inmBrackets.map((b) => (b.id === bracket.id ? bracket : b))
      : [...config.inmBrackets, bracket];
    persist({ ...config, inmBrackets });
  };

  const deleteBracket = (id: string) => {
    persist({
      ...config,
      inmBrackets: config.inmBrackets.filter((b) => b.id !== id),
    });
  };

  const setMinisterialForLocation = (location: Location, amount: number) => {
    if (!selectedPeriod) return;
    persist(
      upsertMinisterialRate(config, {
        periodId: selectedPeriod.id,
        locationId: location.id,
        locationName: location.name,
        amount,
      }),
    );
  };

  return (
    <div className="space-y-6">
      {!embedded && onGoBack && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button type="button" variant="outline" onClick={onGoBack} className="gap-2 w-fit">
            <ArrowLeft className="h-4 w-4" />
            Retour comptabilité
          </Button>
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Coins className="h-6 w-6 text-emerald-600" />
          Tarifs & subventions repas
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Subvention ministérielle par lieu · interministérielle selon tranches d&apos;INM (historique
          agent dans Administration → Utilisateurs)
        </p>
      </div>

      <Card className="border-2 border-emerald-100">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="subsidy-period" className="text-slate-900 font-semibold">
              Période tarifaire
            </Label>
            <Select value={selectedPeriod?.id ?? ""} onValueChange={setSelectedPeriodId}>
              <SelectTrigger
                id="subsidy-period"
                className="bg-white border-2 border-slate-500 text-slate-900 font-medium min-h-11"
              >
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {config.periods.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-slate-900">
                    {p.label} (depuis {p.validFrom})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={addPeriod} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle période
          </Button>
        </CardContent>
      </Card>

      {selectedPeriod && (
        <Tabs defaultValue="period" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="period">Période</TabsTrigger>
            <TabsTrigger value="inm">Tranches INM</TabsTrigger>
            <TabsTrigger value="ministerial">Subvention ministérielle</TabsTrigger>
          </TabsList>

          <TabsContent value="period">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres de la période</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Libellé</Label>
                  <Input
                    value={selectedPeriod.label}
                    onChange={(e) => updatePeriod({ label: e.target.value })}
                    className="bg-white border-2 border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={selectedPeriod.validFrom.slice(0, 10)}
                    onChange={(e) => updatePeriod({ validFrom: e.target.value })}
                    className="bg-white border-2 border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin (optionnel)</Label>
                  <Input
                    type="date"
                    value={selectedPeriod.validTo?.slice(0, 10) ?? ""}
                    onChange={(e) =>
                      updatePeriod({ validTo: e.target.value || undefined })
                    }
                    className="bg-white border-2 border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Montant interministériel (€ / repas)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedPeriod.interministerialAmount}
                    onChange={(e) =>
                      updatePeriod({
                        interministerialAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="bg-white border-2 border-slate-300"
                  />
                  <p className="text-xs text-gray-500">
                    Appliqué aux agents dont l&apos;INM est dans une tranche éligible.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inm">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Tranches d&apos;indice majoré (INM)
                </CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    saveBracket({
                      id: crypto.randomUUID(),
                      periodId: selectedPeriod.id,
                      minInm: 0,
                      maxInm: 539,
                      grantsInterministerial: true,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tranche
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {periodBrackets.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune tranche pour cette période.</p>
                )}
                {periodBrackets.map((b) => (
                  <InmBracketRow
                    key={b.id}
                    bracket={b}
                    onChange={saveBracket}
                    onDelete={() => deleteBracket(b.id)}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ministerial">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Montant ministériel par lieu (€ / repas)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {locations.length === 0 && (
                  <p className="text-sm text-amber-700">
                    Aucun lieu défini — renseignez les lieux dans Administration.
                  </p>
                )}
                {locations.map((loc) => {
                  const rate = periodMinisterial.find(
                    (r) =>
                      r.locationId === loc.id ||
                      normalizeLocationKey(r.locationName) === normalizeLocationKey(loc.name),
                  );
                  return (
                    <div
                      key={loc.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{loc.name}</p>
                        <p className="text-xs text-gray-500">
                          Région : {loc.regionCode || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28 bg-white border-2 border-slate-300"
                          value={rate?.amount ?? ""}
                          placeholder="0"
                          onChange={(e) =>
                            setMinisterialForLocation(loc, Number(e.target.value) || 0)
                          }
                        />
                        <span className="text-sm text-gray-600">€</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function InmBracketRow({
  bracket,
  onChange,
  onDelete,
}: {
  bracket: InmSubsidyBracket;
  onChange: (b: InmSubsidyBracket) => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-white">
      <div className="sm:col-span-3 space-y-1">
        <Label className="text-xs">INM min</Label>
        <Input
          type="number"
          value={bracket.minInm}
          onChange={(e) => onChange({ ...bracket, minInm: Number(e.target.value) })}
          className="bg-white border-slate-300"
        />
      </div>
      <div className="sm:col-span-3 space-y-1">
        <Label className="text-xs">INM max</Label>
        <Input
          type="number"
          value={bracket.maxInm}
          onChange={(e) => onChange({ ...bracket, maxInm: Number(e.target.value) })}
          className="bg-white border-slate-300"
        />
      </div>
      <div className="sm:col-span-4 flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          id={`grant-${bracket.id}`}
          checked={bracket.grantsInterministerial}
          onChange={(e) =>
            onChange({ ...bracket, grantsInterministerial: e.target.checked })
          }
          className="h-4 w-4"
        />
        <Label htmlFor={`grant-${bracket.id}`} className="text-sm font-normal">
          Droit subvention interministérielle
        </Label>
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}
