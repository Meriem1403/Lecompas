import React from "react";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { IMPORTED_ACCIDENT_INDICATORS } from "@/app/seeds/importedSeeds";
import type { AccidentSuiviIndicateurs } from "@/app/types/importedRegisters";
import { CompactSpreadsheet } from "@/app/components/spreadsheet/CompactSpreadsheet";

interface AccidentSuiviPanelsProps {
  accessToken?: string;
}

export function AccidentSuiviIndicateursPanel({
  accessToken = "",
}: AccidentSuiviPanelsProps) {
  const [data] = useAppDataDocumentStore<AccidentSuiviIndicateurs>(
    APP_DATA_KEYS.accidentSuiviIndicateurs,
    accessToken,
    { seed: IMPORTED_ACCIDENT_INDICATORS },
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Indicateurs par année</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Synthèse importée depuis votre fichier Excel (complément Causalis, pas de
          reporting additionnel).
        </p>
        <CompactSpreadsheet
          rows={data.byYear}
          getRowId={(r) => String(r.year)}
          maxHeight="320px"
          columns={[
            { id: "y", header: "Année", width: "72px", cell: (r) => r.year },
            {
              id: "tot",
              header: "Nb accidents",
              cell: (r) => r.nbAccidents,
            },
            { id: "sa", header: "Sans arrêt", cell: (r) => r.sansArret },
            { id: "aa", header: "Avec arrêt", cell: (r) => r.avecArret },
          ]}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Par cause et année</h3>
        <CompactSpreadsheet
          rows={data.byCauseYear}
          getRowId={(r) => `${r.cause}-${r.year}-${r.nbAccidents}`}
          maxHeight="min(50vh, 480px)"
          columns={[
            { id: "cause", header: "Cause", cell: (r) => r.cause },
            { id: "y", header: "Année", width: "64px", cell: (r) => r.year },
            { id: "n", header: "Nb", width: "48px", cell: (r) => r.nbAccidents },
            { id: "sa", header: "Sans arrêt", width: "72px", cell: (r) => r.sansArret },
            { id: "aa", header: "Avec arrêt", width: "72px", cell: (r) => r.avecArret },
            {
              id: "j",
              header: "Jours arrêt",
              width: "88px",
              cell: (r) => r.joursArret || "—",
            },
          ]}
        />
      </div>
    </div>
  );
}

interface DeclaratifAccidentRow {
  id: string;
  date: string;
  site: string;
  unite: string;
  categorie: string;
  type: string;
  gravite: string;
  arret: string;
  causes: string;
  circonstances: string;
}

interface AccidentDeclaratifTableProps {
  onSelect?: (id: string) => void;
  accidents: Array<{
    id: string;
    date: string;
    location: string;
    service?: string;
    accidentCategory?: string;
    accidentEventType?: string;
    regulatoryGravity?: string;
    hasWorkStoppage?: boolean;
    accidentCauses?: string;
    circumstances?: string;
    description?: string;
  }>;
}

export function AccidentDeclaratifTable({
  accidents,
  onSelect,
}: AccidentDeclaratifTableProps) {
  const rows: DeclaratifAccidentRow[] = accidents.map((a) => ({
    id: a.id,
    date: a.date,
    site: a.location,
    unite: a.service ?? "—",
    categorie: a.accidentCategory ?? "—",
    type: a.accidentEventType ?? "—",
    gravite: a.regulatoryGravity ?? "—",
    arret: a.hasWorkStoppage ? "Oui" : "Non",
    causes: a.accidentCauses ?? "—",
    circonstances: (a.circumstances || a.description || "—").slice(0, 200),
  }));

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Vue tableau compacte (victimes anonymisées). Cliquez une ligne pour le détail
        complet via les actions de la liste.
      </p>
      <CompactSpreadsheet
        rows={rows}
        getRowId={(r) => r.id}
        onRowClick={onSelect ? (r) => onSelect(r.id) : undefined}
        maxHeight="min(65vh, 800px)"
        columns={[
          { id: "d", header: "Date", width: "96px", cell: (r) => r.date },
          { id: "site", header: "Site", cell: (r) => r.site },
          { id: "u", header: "Unité", cell: (r) => r.unite },
          { id: "cat", header: "Catégorie", cell: (r) => r.categorie },
          { id: "t", header: "Type", cell: (r) => r.type },
          { id: "g", header: "Grav.", width: "48px", cell: (r) => r.gravite },
          { id: "a", header: "Arrêt", width: "52px", cell: (r) => r.arret },
          { id: "c", header: "Causes", cell: (r) => r.causes },
          {
            id: "circ",
            header: "Circonstances",
            cell: (r) => r.circonstances,
          },
        ]}
      />
    </div>
  );
}
