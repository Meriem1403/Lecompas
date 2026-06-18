import React from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { renderReactToPdf } from "@/app/utils/visualPdfCapture";

export interface SafetyProtocolPdfInput {
  id: string;
  title: string;
  operationType: string;
  service: string;
  domain: string;
  location: string;
  entreprise1: string;
  entreprise2: string;
  responsable: string;
  date: string;
  status: "brouillon" | "valide" | "signe";
  risques: string;
  mesures: string;
  urgence: string;
  signatures: string;
  circulation: string;
  documents: string[];
  signatureDematerialiseeUrl?: string;
}

const STATUS_LABEL = {
  brouillon: "Brouillon",
  valide: "Valide",
  signe: "Signé",
} as const;

export function SafetyProtocolVisualDocument({ protocol }: { protocol: SafetyProtocolPdfInput }) {
  return (
    <div className="space-y-4 text-slate-900 bg-slate-50 p-2">
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-indigo-700 to-violet-900 text-white px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Protocole de sécurité</p>
        <h1 className="text-xl font-bold mt-1 break-words">{protocol.title}</h1>
        <p className="text-sm text-indigo-100 mt-2">Code du travail — articles R4515-4 à R4515-11</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className="bg-white/15 text-white border border-white/30">{protocol.operationType}</Badge>
          <Badge className="bg-white/15 text-white border border-white/30">{STATUS_LABEL[protocol.status]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-3 text-sm space-y-1">
            <p><span className="font-semibold">Date :</span> {protocol.date || "—"}</p>
            <p><span className="font-semibold">Responsable :</span> {protocol.responsable || "—"}</p>
            <p><span className="font-semibold">Service :</span> {protocol.service || "—"}</p>
            <p><span className="font-semibold">Domaine :</span> {protocol.domain || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-3 text-sm space-y-1">
            <p><span className="font-semibold">Lieu :</span> {protocol.location || "—"}</p>
            <p><span className="font-semibold">Entreprise 1 :</span> {protocol.entreprise1 || "—"}</p>
            <p><span className="font-semibold">Entreprise 2 :</span> {protocol.entreprise2 || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Évaluation des risques &amp; mesures</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
            <p className="text-xs font-bold uppercase text-slate-600 mb-1">Nature des risques</p>
            <p className="whitespace-pre-wrap">{protocol.risques || "—"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
            <p className="text-xs font-bold uppercase text-slate-600 mb-1">Mesures de prévention</p>
            <p className="whitespace-pre-wrap">{protocol.mesures || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-emerald-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-emerald-900">Premiers secours</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap rounded-lg bg-red-50 border border-red-200 p-3">
          {protocol.urgence || "—"}
        </CardContent>
      </Card>

      <Card className="border border-rose-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-rose-900">Signatures</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap rounded-lg bg-rose-50 border border-rose-200 p-3">
          {protocol.signatures || "—"}
          {protocol.signatureDematerialiseeUrl ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-white p-2">
              <p className="text-[10px] font-semibold uppercase text-rose-800 mb-1">Signature dématérialisée</p>
              <img src={protocol.signatureDematerialiseeUrl} alt="" className="max-h-24 object-contain" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-sky-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-sky-900">Plan de circulation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{protocol.circulation || "—"}</CardContent>
      </Card>

      {(protocol.documents || []).length > 0 ? (
        <Card className="border border-violet-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-violet-900">Documents associés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {protocol.documents.map((doc) => (
              <div key={doc} className="rounded-lg border border-violet-100 bg-violet-50 p-2">
                {doc}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export async function downloadSafetyProtocolVisualPdf(protocol: SafetyProtocolPdfInput): Promise<boolean> {
  return renderReactToPdf(
    (mount) => {
      const root = createRoot(mount);
      root.render(<SafetyProtocolVisualDocument protocol={protocol} />);
      return { unmount: () => root.unmount() };
    },
    `protocole-securite-${protocol.id}.pdf`,
  );
}
