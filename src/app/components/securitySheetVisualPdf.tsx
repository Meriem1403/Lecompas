import React from "react";
import { createRoot } from "react-dom/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import type { ControleRow, SecuritySheetRecord } from "@/app/components/SecuritySheetView";
import { renderReactToPdf } from "@/app/utils/visualPdfCapture";

const SECTIONS: { key: keyof SecuritySheetRecord; label: string; withInspector: boolean }[] = [
  { key: "controleAmiante", label: "Amiante", withInspector: false },
  { key: "controlePlomb", label: "Plomb", withInspector: false },
  { key: "controleEquipementPression", label: "Équipements sous pression", withInspector: false },
  { key: "controleElectricite", label: "Électricité", withInspector: true },
  { key: "controleEquipements", label: "Équipements de travail", withInspector: true },
  { key: "controleEpi", label: "EPI", withInspector: false },
  { key: "controleLevage", label: "Levage", withInspector: true },
  { key: "controleCvc", label: "CVC", withInspector: true },
  { key: "controlePortes", label: "Portes", withInspector: true },
];

function readRows(record: SecuritySheetRecord, key: keyof SecuritySheetRecord): ControleRow[] {
  const arr = record[key];
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (row) =>
      row.action ||
      row.site ||
      row.dateRapport ||
      row.reference ||
      row.observation ||
      row.datePassage ||
      row.nomInspecteur,
  );
}

export function SecuritySheetVisualDocument({ record }: { record: SecuritySheetRecord }) {
  return (
    <div className="space-y-4 text-slate-900 bg-slate-50 p-2">
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 text-white px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-pink-100">Fiche sécurité</p>
        <h1 className="text-xl font-bold mt-1">
          {record.nomSite} — {record.titreFiche}
        </h1>
        <p className="text-sm text-pink-100 mt-2">{record.duerpTitre}</p>
        <Badge className="mt-3 bg-white/15 text-white border border-white/30">MAJ {record.dateMiseAJour}</Badge>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Identification</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><span className="font-semibold">Lieu / éléments contrôlés :</span> {record.lieuElementsControles || "—"}</p>
          <p><span className="font-semibold">Référentiel :</span> {record.referentielAnnee || "—"}</p>
          <p><span className="font-semibold">Effectif :</span> {record.effectif || "—"}</p>
          <p><span className="font-semibold">Adresse :</span> {record.adresse || "—"}</p>
          <p><span className="font-semibold">Téléphones :</span> Bureau {record.telephoneBureau || "—"} · Astreinte {record.telephoneAstreinte || "—"}</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activités &amp; prévention</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="whitespace-pre-wrap"><span className="font-semibold">Activités :</span> {record.activitesPrincipales || "—"}</p>
          <p className="whitespace-pre-wrap"><span className="font-semibold">Horaires :</span> {record.cyclesHoraires || "—"}</p>
          <p><span className="font-semibold">Correspondant prévention :</span> {record.correspondantPrevention || "—"}</p>
          <p><span className="font-semibold">Registre SST :</span> {record.registreSst || "—"}</p>
          <p className="whitespace-pre-wrap"><span className="font-semibold">Protocole d&apos;accueil :</span> {record.protocoleAccueil || "—"}</p>
          <p><span className="font-semibold">Registre des contrôles :</span> {record.registreControlesLieu || "—"}</p>
          <p className="whitespace-pre-wrap"><span className="font-semibold">Habilitation électrique :</span> {record.personnelHabilitationElectrique || "—"}</p>
          <p><span className="font-semibold">Évacuation incendie :</span> {record.procedureEvacuationIncendie || "—"}</p>
          {record.autresComplement ? (
            <p className="whitespace-pre-wrap"><span className="font-semibold">Complément :</span> {record.autresComplement}</p>
          ) : null}
        </CardContent>
      </Card>

      {SECTIONS.map((section) => {
        const rows = readRows(record, section.key);
        if (!rows.length) return null;
        return (
          <Card key={String(section.key)} className="border border-rose-200 bg-white shadow-sm">
            <CardHeader className="pb-2 bg-rose-50">
              <CardTitle className="text-base text-rose-900">Contrôles — {section.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.map((row, idx) => (
                <div key={row.id || idx} className="rounded-lg border border-rose-100 bg-rose-50/40 p-3 text-xs space-y-1">
                  <p className="font-bold text-rose-950">Ligne {idx + 1}</p>
                  <p><span className="font-semibold">Action :</span> {row.action || "—"}</p>
                  <p><span className="font-semibold">Site :</span> {row.site || "—"}</p>
                  <p><span className="font-semibold">Date rapport :</span> {row.dateRapport || "—"}</p>
                  <p><span className="font-semibold">Référence :</span> {row.reference || "—"}</p>
                  <p className="whitespace-pre-wrap"><span className="font-semibold">Observation :</span> {row.observation || "—"}</p>
                  {section.withInspector ? (
                    <>
                      <p><span className="font-semibold">Date passage :</span> {row.datePassage || "—"}</p>
                      <p><span className="font-semibold">Inspecteur :</span> {row.nomInspecteur || "—"}</p>
                    </>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export async function downloadSecuritySheetVisualPdf(record: SecuritySheetRecord): Promise<boolean> {
  const safeName = (record.nomSite || record.id).replace(/\s+/g, "-");
  return renderReactToPdf(
    (mount) => {
      const root = createRoot(mount);
      root.render(<SecuritySheetVisualDocument record={record} />);
      return { unmount: () => root.unmount() };
    },
    `fiche-securite-${safeName}.pdf`,
  );
}
