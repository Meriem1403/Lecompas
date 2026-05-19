import React from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";

import type { PlanCoIntervenantRow, PlanProtocolFields, PlanRecord, PlanStatus, RiskInput } from "./PreventionPlanView";

function normalizeDocTitle(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  const t = raw.trim().replace(/\s+/g, " ");
  if (/^protocole\s+de\s+s[ée]curit[ée]$/i.test(t)) return fallback;
  if (/^protocole\s+de\s+securite$/i.test(t)) return fallback;
  if (/^PROTOCOLE\s+DE\s+SECURITE$/i.test(t)) return fallback;
  return raw.trim();
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  a_lancer: "A lancer",
  en_cours: "En cours",
  termine: "Termine",
};

const STATUS_BADGE: Record<PlanStatus, string> = {
  a_lancer: "rounded-md border px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-900 border-amber-400",
  en_cours: "rounded-md border px-2 py-1 text-xs font-semibold bg-teal-100 text-teal-900 border-teal-400",
  termine: "rounded-md border px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-900 border-emerald-400",
};

function rowCoHas(r: PlanCoIntervenantRow): boolean {
  return [r.qualite, r.denomination, r.adresse, r.contactNom, r.contactEmail, r.complements].some((x) => x.trim().length > 0);
}

function annexFmt(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Rendu statique proche de la fiche « Consulter », optimisé capture html2canvas → PDF multi-pages. */
export function PreventionPlanVisualDocument({
  plan,
  protocol,
  risks,
}: {
  plan: PlanRecord;
  protocol: PlanProtocolFields;
  risks: RiskInput[];
}) {
  const orgs = protocol.coIntervenantRows.filter(rowCoHas);

  return (
    <div className="prevention-plan-visual-pdf space-y-5 text-slate-900" style={{ WebkitFontSmoothing: "antialiased" }}>
      <div className="rounded-xl overflow-hidden border border-emerald-900/30 bg-emerald-950 text-white px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-200/90 mb-1">Plan de prévention</p>
            <h1 className="text-xl font-bold leading-snug break-words">
              {plan.riskNumber} — {plan.riskTitle}
            </h1>
            <p className="text-sm text-emerald-100 mt-2 leading-snug">{protocol.codeTravailReference}</p>
            <p className="text-xs text-emerald-50/90 mt-3 border-t border-white/10 pt-3">{protocol.operationType}</p>
          </div>
          <span className={STATUS_BADGE[plan.status]}>{STATUS_LABEL[plan.status]}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-[10px] font-bold uppercase text-indigo-700">Service</p>
          <p className="text-sm font-semibold text-indigo-950 mt-1">{plan.service}</p>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="text-[10px] font-bold uppercase text-teal-700">Domaine</p>
          <p className="text-sm font-semibold text-teal-950 mt-1">{plan.domain}</p>
        </div>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
          <p className="text-[10px] font-bold uppercase text-cyan-700">Lieu</p>
          <p className="text-sm font-semibold text-cyan-950 mt-1">{plan.location}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Responsable</p>
          <p className="text-sm font-semibold text-emerald-950 mt-1 break-words">{plan.owner}</p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{normalizeDocTitle(protocol.protocoleTitle, "PLAN DE PREVENTION")}</CardTitle>
          <CardDescription className="text-xs">Objectif · actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Objectif</p>
            <p className="text-slate-800 whitespace-pre-wrap mt-1">{plan.objective || "—"}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-slate-500">Actions</p>
            {plan.actions.length === 0 ? (
              <p className="text-slate-500">—</p>
            ) : (
              plan.actions.map((action, index) => (
                <div key={`${action}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <span className="font-semibold text-slate-900">Action {index + 1} : </span>
                  <span className="text-slate-700 whitespace-pre-wrap">{action}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-indigo-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-indigo-950">1) Co-intervenants</CardTitle>
          <CardDescription className="text-xs">Entreprises, administrations, organismes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orgs.length === 0 ? (
            <p className="text-sm text-slate-600">Aucune structure renseignée.</p>
          ) : (
            orgs.map((row, idx) => (
              <div key={row.id} className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 text-sm space-y-2">
                <p className="text-xs font-bold uppercase text-indigo-800">Structure {idx + 1}</p>
                {row.qualite.trim() ? (
                  <p>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Qualité / rôle </span>
                    <span className="text-slate-900 whitespace-pre-wrap">{row.qualite}</span>
                  </p>
                ) : null}
                <p>
                  <span className="text-[10px] font-semibold uppercase text-slate-500">Dénomination </span>
                  <span className="text-slate-900">{row.denomination.trim() ? row.denomination : "—"}</span>
                </p>
                <p>
                  <span className="text-[10px] font-semibold uppercase text-slate-500">Adresse </span>
                  <span className="text-slate-900 whitespace-pre-wrap">{row.adresse.trim() ? row.adresse : "—"}</span>
                </p>
                {(row.contactNom.trim() || row.contactEmail.trim()) ? (
                  <p>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Contact </span>
                    <span className="text-slate-900">
                      {[row.contactNom.trim(), row.contactEmail.trim()].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </p>
                ) : null}
                {row.complements.trim() ? (
                  <p>
                    <span className="text-[10px] font-semibold uppercase text-slate-500">Précisions </span>
                    <span className="text-slate-900 whitespace-pre-wrap">{row.complements}</span>
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">2) Nature de la prestation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{protocol.prestationNature || "—"}</p>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">3) Organisation chargement / déchargement</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Lieu de livraison ou prise en charge</p>
            <p className="text-slate-800 mt-1 whitespace-pre-wrap">{protocol.lieuLivraison || "—"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Matériel(s) spécifique(s)</p>
            <p className="text-slate-800 mt-1 whitespace-pre-wrap">{protocol.materielsSpecifiques || "—"}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-[10px] font-bold uppercase text-amber-800">Consignes sécurité site</p>
            <p className="text-slate-800 mt-1 whitespace-pre-wrap">{protocol.consignesSite || "—"}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-[10px] font-bold uppercase text-amber-800">Consignes opération</p>
            <p className="text-slate-800 mt-1 whitespace-pre-wrap">{protocol.consignesOperation || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">4) Évaluation des risques (CT R4515-5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="min-w-full text-[11px] leading-snug">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2 font-bold uppercase text-slate-700 border-b border-slate-200 w-[26%]">
                    Situation dangereuse
                  </th>
                  <th className="text-left p-2 font-bold uppercase text-slate-700 border-b border-l border-slate-200 w-[32%]">
                    Dommages associés
                  </th>
                  <th className="text-left p-2 font-bold uppercase text-slate-700 border-b border-l border-slate-200 w-[42%]">
                    Mesures de prévention
                  </th>
                </tr>
              </thead>
              <tbody>
                {protocol.riskEvaluationRows.map((row) => {
                  const evalRisk = row.linkedEvaluationRiskId
                    ? risks.find((r) => r.id === row.linkedEvaluationRiskId)
                    : undefined;
                  return (
                    <tr key={row.id} className="border-t border-slate-200 align-top bg-white">
                      <td className="p-2 whitespace-pre-wrap text-slate-800 border-slate-100">
                        {evalRisk ? (
                          <span className="inline-block mb-1 rounded border border-violet-400 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-900">
                            Réf. {evalRisk.numeroRisque}
                          </span>
                        ) : (row.evaluationRiskFreeText ?? "").trim() ? (
                          <span className="inline-block mb-1 rounded border border-slate-400 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                            Mention hors référentiel
                          </span>
                        ) : null}
                        {!evalRisk && (row.evaluationRiskFreeText ?? "").trim() ? (
                          <p className="text-[10px] text-slate-600 mb-1 whitespace-pre-wrap">{(row.evaluationRiskFreeText ?? "").trim()}</p>
                        ) : null}
                        {row.domaine.trim() ? row.domaine : "—"}
                      </td>
                      <td className="p-2 border-l border-slate-200 whitespace-pre-wrap text-slate-800">
                        {row.natureRisques.trim() ? row.natureRisques : "—"}
                      </td>
                      <td className="p-2 border-l border-slate-200 whitespace-pre-wrap text-slate-800">
                        {row.mesuresPrevention.trim() ? row.mesuresPrevention : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Complément libre</p>
            <p className="text-sm whitespace-pre-wrap mt-1">{protocol.evaluationRisques || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border border-emerald-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-900">5) Premiers secours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Personnes à prévenir</p>
              <p className="text-slate-800 mt-1 whitespace-pre-wrap">{protocol.personnesAPrevenir || "—"}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-[10px] font-bold uppercase text-red-800">Accident / incendie</p>
              <p className="text-slate-800 mt-1 whitespace-pre-wrap">{protocol.mesuresUrgence || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-orange-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-950">6) Plan transmis · 7) Observations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3">
              <p className="text-[10px] font-bold uppercase text-orange-900">Transmis à</p>
              <p className="text-slate-900 mt-1 whitespace-pre-wrap">{protocol.planTransmis || "—"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 overflow-auto">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2 uppercase text-slate-600 font-semibold">Destinataire</th>
                    <th className="text-left p-2 uppercase text-slate-600 font-semibold">O/N</th>
                    <th className="text-left p-2 uppercase text-slate-600 font-semibold">Nom</th>
                    <th className="text-left p-2 uppercase text-slate-600 font-semibold">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-2">Cellule Sécurité</td>
                    <td className="p-2">{protocol.transmissionCelluleSecuriteStatus}</td>
                    <td className="p-2">{protocol.transmissionCelluleSecuriteNom || "—"}</td>
                    <td className="p-2">{protocol.transmissionCelluleSecuriteObs || "—"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">Corresp. site</td>
                    <td className="p-2">{protocol.transmissionCorrespondantSiteStatus}</td>
                    <td className="p-2">{protocol.transmissionCorrespondantSiteNom || "—"}</td>
                    <td className="p-2">{protocol.transmissionCorrespondantSiteObs || "—"}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">Corresp. APB</td>
                    <td className="p-2">{protocol.transmissionCorrespondantAPBStatus}</td>
                    <td className="p-2">{protocol.transmissionCorrespondantAPBNom || "—"}</td>
                    <td className="p-2">{protocol.transmissionCorrespondantAPBObs || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">Observations transmission</p>
              <p className="text-slate-800 whitespace-pre-wrap mt-1">{protocol.observationsTransmission || "—"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">Observations / remarques</p>
              <p className="text-slate-800 whitespace-pre-wrap mt-1">{protocol.observationsRemarques || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-rose-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-rose-900">8) Signatures</CardTitle>
          <CardDescription className="text-xs">
            Empreinte visuelle (image) ou complément manuscrit hors ligne. Pour une signature électronique qualifiée (certificat),
            ouvrez ce PDF dans Adobe Acrobat Reader et utilisez « Signer le document » si votre organisation le prévoit.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 xl:grid-cols-3 gap-4 text-sm">
          {(
            [
              {
                entite: protocol.signatureEntite1 || "Entité 1",
                nom: protocol.signatureNom1,
                prenom: protocol.signaturePrenom1,
                date: protocol.signatureDate1,
                img: protocol.signatureDematerialiseeUrl1,
              },
              {
                entite: protocol.signatureEntite2 || "Entité 2",
                nom: protocol.signatureNom2,
                prenom: protocol.signaturePrenom2,
                date: protocol.signatureDate2,
                img: protocol.signatureDematerialiseeUrl2,
              },
              {
                entite: protocol.signatureEntite3 || "Entité 3",
                nom: protocol.signatureNom3,
                prenom: protocol.signaturePrenom3,
                date: protocol.signatureDate3,
                img: protocol.signatureDematerialiseeUrl3,
              },
            ] as const
          ).map((s, i) => (
            <div key={i} className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-2">
              <p className="font-semibold text-slate-900">{s.entite}</p>
              <p>
                <span className="font-medium">Nom : </span>
                {s.nom || "—"}
              </p>
              <p>
                <span className="font-medium">Prénom : </span>
                {s.prenom || "—"}
              </p>
              <p>
                <span className="font-medium">Date : </span>
                {s.date || "—"}
              </p>
              <div className="mt-2 rounded-lg border border-dashed border-rose-300 bg-white p-2 min-h-[72px] flex items-center justify-center">
                {s.img?.trim() ? (
                  <img src={s.img} alt="" className="max-h-24 w-full object-contain" />
                ) : (
                  <p className="text-[10px] text-slate-400 text-center px-2">Zone réservée à la signature (image saisie dans l’éditeur)</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border border-sky-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-sky-900">10) Plan de circulation et déchargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{protocol.planCirculation || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border border-sky-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-sky-900">Matériel à remplacer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{protocol.materielRemplacer || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Annexes et documents joints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {protocol.annexAttachments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun fichier joint référencé dans l’export visuel (les binaires restent dans l’app).</p>
          ) : (
            <ul className="space-y-2">
              {protocol.annexAttachments.map((att, idx) => (
                <li key={att.id} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                  <span className="font-semibold">
                    {idx + 1}. {att.fileName}
                  </span>
                  <span className="text-xs text-slate-500"> · {annexFmt(att.sizeBytes)}</span>
                </li>
              ))}
            </ul>
          )}
          {protocol.annexesDocuments.trim() ? (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Complément rédactionnel</p>
              <p className="text-sm whitespace-pre-wrap">{protocol.annexesDocuments}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-[10px] leading-relaxed text-slate-500 space-y-2">
        <p>
          Document généré depuis l’application avec une mise en page visuelle proche de l’aperçu à l’écran. Les fichiers joints listés
          ci-dessus peuvent être ajoutés séparément ou intégrés hors ligne selon votre circuit documentaire.
        </p>
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForDomPaint(): Promise<void> {
  await sleep(0);
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await sleep(220);
}

/** Capture le rendu HTML puis produit un PDF multipage (JPEG) pour se rapprocher du visuel consultation. */
export async function downloadPreventionPlanVisualPdf(plan: PlanRecord, protocol: PlanProtocolFields, risks: RiskInput[]): Promise<boolean> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.zIndex = "-10";
  host.style.pointerEvents = "none";
  host.style.width = "794px";
  host.style.maxWidth = "794px";
  host.style.backgroundColor = "#f1f5f9";
  host.style.padding = "12px";
  host.style.boxSizing = "border-box";

  const mount = document.createElement("div");
  host.appendChild(mount);
  document.body.appendChild(host);

  const root = createRoot(mount);

  try {
    root.render(<PreventionPlanVisualDocument plan={plan} protocol={protocol} risks={risks} />);
    await waitForDomPaint();

    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f1f5f9",
      logging: false,
      width: host.scrollWidth,
      height: host.scrollHeight,
      windowWidth: host.scrollWidth,
      windowHeight: host.scrollHeight,
    });

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const pxPerMm = canvas.width / pageW;
    const pagePxH = pageH * pxPerMm;

    let y = 0;
    let first = true;
    while (y < canvas.height) {
      const sliceH = Math.min(pagePxH, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      const data = slice.toDataURL("image/jpeg", 0.9);
      const hMm = sliceH / pxPerMm;
      if (!first) pdf.addPage();
      pdf.addImage(data, "JPEG", 0, 0, pageW, hMm, undefined, "FAST");
      first = false;
      y += sliceH;
    }

    pdf.save(`plan-prevention-${plan.riskNumber || plan.id}.pdf`);
    return true;
  } catch (err) {
    console.error("downloadPreventionPlanVisualPdf", err);
    return false;
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
