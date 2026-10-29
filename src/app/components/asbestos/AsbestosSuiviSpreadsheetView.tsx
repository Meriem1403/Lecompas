import React, { useMemo, useState } from "react";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import {
  IMPORTED_ASBESTOS_REGISTER,
  IMPORTED_ASBESTOS_SITES_DTA,
} from "@/app/seeds/importedSeeds";
import type {
  AsbestosRegisterRow,
  AsbestosSiteDtaRow,
} from "@/app/types/importedRegisters";
import { CompactSpreadsheet } from "@/app/components/spreadsheet/CompactSpreadsheet";
import { RowAttachmentsDialog } from "@/app/components/spreadsheet/RowAttachmentsDialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Paperclip, Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface AsbestosSuiviSpreadsheetViewProps {
  accessToken?: string;
}

type AttachTarget =
  | { scope: "register"; row: AsbestosRegisterRow }
  | { scope: "site"; row: AsbestosSiteDtaRow }
  | null;

function kindLabel(kind: AsbestosRegisterRow["kind"]) {
  switch (kind) {
    case "synthese":
      return "Synthèse";
    case "controle":
      return "Contrôle";
    case "materiau":
      return "Matériau";
    default:
      return "Historique";
  }
}

export function AsbestosSuiviSpreadsheetView({
  accessToken = "",
}: AsbestosSuiviSpreadsheetViewProps) {
  const [register, setRegister] = useAppDataDocumentStore<AsbestosRegisterRow[]>(
    APP_DATA_KEYS.asbestosSuiviRegister,
    accessToken,
    { seed: IMPORTED_ASBESTOS_REGISTER },
  );
  const [sites, setSites] = useAppDataDocumentStore<AsbestosSiteDtaRow[]>(
    APP_DATA_KEYS.asbestosSitesDta,
    accessToken,
    { seed: IMPORTED_ASBESTOS_SITES_DTA },
  );

  const [search, setSearch] = useState("");
  const [attachTarget, setAttachTarget] = useState<AttachTarget>(null);

  const filteredRegister = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return register;
    return register.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q),
    );
  }, [register, search]);

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((r) =>
      JSON.stringify(r).toLowerCase().includes(q),
    );
  }, [sites, search]);

  const updateRegisterAttachments = (id: string, attachments: AsbestosRegisterRow["attachments"]) => {
    setRegister((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attachments } : r)),
    );
    toast.success("Pièces jointes enregistrées");
  };

  const updateSiteAttachments = (id: string, attachments: AsbestosSiteDtaRow["attachments"]) => {
    setSites((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attachments } : r)),
    );
    toast.success("Pièces jointes enregistrées");
  };

  const addRegisterRow = () => {
    const row: AsbestosRegisterRow = {
      id: `amiante-new-${Date.now()}`,
      kind: "materiau",
      zoneMateriau: "Nouveau matériau",
      localisation: "",
      scoreActuel: "",
      attachments: [],
    };
    setRegister((prev) => [...prev, row]);
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Suivi amiante — registre type Excel
          </h2>
          <p className="text-sm text-muted-foreground">
            Données importées depuis votre tableau COB Marseille · PJ (DTA) par ligne
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Filtrer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">
            Registre COB ({filteredRegister.length})
          </TabsTrigger>
          <TabsTrigger value="sites">
            Sites & DTA ({filteredSites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={addRegisterRow}>
              <Plus className="h-4 w-4 mr-1" />
              Ligne
            </Button>
          </div>
          <CompactSpreadsheet
            rows={filteredRegister}
            getRowId={(r) => r.id}
            onRowClick={(row) => setAttachTarget({ scope: "register", row })}
            columns={[
              {
                id: "kind",
                header: "Type",
                width: "88px",
                cell: (r) => (
                  <Badge variant="outline" className="text-[10px]">
                    {kindLabel(r.kind)}
                  </Badge>
                ),
              },
              {
                id: "c1",
                header: "Col. 1",
                cell: (r) =>
                  r.materiau ||
                  r.dateControle ||
                  r.zoneMateriau ||
                  r.rawCol1 ||
                  "—",
              },
              {
                id: "c2",
                header: "Localisation / Lieu",
                cell: (r) => r.localisation || r.lieuZone || r.rawCol2 || "—",
              },
              {
                id: "c3",
                header: "Description / Type",
                cell: (r) =>
                  r.description ||
                  r.typeControle ||
                  r.typeAnalyse ||
                  r.rawCol3 ||
                  "—",
              },
              {
                id: "score",
                header: "Score",
                width: "72px",
                cell: (r) => r.score || r.scoreActuel || r.rawCol6 || "—",
              },
              {
                id: "action",
                header: "Action / Statut",
                cell: (r) =>
                  r.action ||
                  r.actionAPrevoir ||
                  r.statutMateriau ||
                  r.rawCol7 ||
                  "—",
              },
              {
                id: "pj",
                header: "PJ",
                width: "56px",
                cell: (r) => (
                  <span className="inline-flex items-center gap-0.5 text-indigo-600">
                    <Paperclip className="h-3.5 w-3.5" />
                    {r.attachments?.length ?? 0}
                  </span>
                ),
              },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Cliquez une ligne pour gérer les pièces jointes (DTA, rapports).
          </p>
        </TabsContent>

        <TabsContent value="sites" className="mt-4">
          <CompactSpreadsheet
            rows={filteredSites}
            getRowId={(r) => r.id}
            onRowClick={(row) => setAttachTarget({ scope: "site", row })}
            columns={[
              { id: "dep", header: "Dép.", width: "64px", cell: (r) => r.departement },
              { id: "site", header: "Site", cell: (r) => r.site },
              {
                id: "date",
                header: "Dernier contrôle",
                width: "110px",
                cell: (r) => r.dateDernierControle,
              },
              { id: "acces", header: "Accès", cell: (r) => r.acces },
              { id: "dta", header: "DTA", width: "72px", cell: (r) => r.dtaStatut },
              {
                id: "com",
                header: "Commentaires",
                cell: (r) => r.commentaires,
              },
              {
                id: "pj",
                header: "PJ",
                width: "56px",
                cell: (r) => (
                  <span className="inline-flex items-center gap-0.5 text-indigo-600">
                    <Paperclip className="h-3.5 w-3.5" />
                    {r.attachments?.length ?? 0}
                  </span>
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {attachTarget?.scope === "register" ? (
        <RowAttachmentsDialog
          open
          onOpenChange={(o) => !o && setAttachTarget(null)}
          title={attachTarget.row.materiau || attachTarget.row.zoneMateriau || attachTarget.row.id}
          attachments={attachTarget.row.attachments ?? []}
          onChange={(attachments) => {
            updateRegisterAttachments(attachTarget.row.id, attachments);
            setAttachTarget({
              scope: "register",
              row: { ...attachTarget.row, attachments },
            });
          }}
        />
      ) : null}

      {attachTarget?.scope === "site" ? (
        <RowAttachmentsDialog
          open
          onOpenChange={(o) => !o && setAttachTarget(null)}
          title={attachTarget.row.site}
          attachments={attachTarget.row.attachments ?? []}
          onChange={(attachments) => {
            updateSiteAttachments(attachTarget.row.id, attachments);
            setAttachTarget({
              scope: "site",
              row: { ...attachTarget.row, attachments },
            });
          }}
        />
      ) : null}
    </div>
  );
}
