import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Download, Eraser, FileSignature, PenLine, Type, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { DocumentFileViewer } from "@/app/components/DocumentFileViewer";
import { DOCUMENT_STATUS_STYLES } from "@/app/components/documentBadges";
import type { Document } from "@/app/components/DocumentsView";
import {
  downloadStoredFile,
  loadDocumentLibrary,
  loadSavedSignature,
  saveDocumentLibrary,
  saveSavedSignature,
} from "@/app/utils/documentLibraryExport";
import { generateDuerpTablePdf, type DuerpTableRow } from "@/app/utils/duerpTableExport";

function formatDay(value?: string) {
  if (!value) return "";
  if (!value.includes("T")) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function rowKey(row: DuerpTableRow) {
  return row["N° risque"];
}

function hasMeasure(row: DuerpTableRow) {
  return Boolean(row["Mesures existantes"] || row["Actions planifiées"]);
}

function versionOrder(item: Document) {
  const match = item.id.match(/(\d{10,})/);
  return match ? Number(match[1]) : Date.parse(item.createdAt || "") || 0;
}

function describeChanges(current: Document, versions: Document[]) {
  const rows = current.riskRows || [];
  if (rows.length === 0) return null;
  const previous = versions
    .filter((item) => item.id !== current.id && item.riskRows?.length && versionOrder(item) < versionOrder(current))
    .sort((left, right) => versionOrder(right) - versionOrder(left))[0];
  if (!previous?.riskRows) {
    return {
      hasPrevious: false,
      risks: rows.length,
      measures: rows.filter(hasMeasure).length,
      newRisks: 0,
      updatedRisks: 0,
      newMeasures: 0,
      updatedMeasures: 0,
    };
  }
  const before = new Map(previous.riskRows.map((row) => [rowKey(row), row]));
  let newRisks = 0;
  let updatedRisks = 0;
  let newMeasures = 0;
  let updatedMeasures = 0;
  rows.forEach((row) => {
    const earlier = before.get(rowKey(row));
    if (!earlier) {
      newRisks += 1;
      if (hasMeasure(row)) newMeasures += 1;
      return;
    }
    if (JSON.stringify(earlier) !== JSON.stringify(row)) updatedRisks += 1;
    const measureChanged = earlier["Mesures existantes"] !== row["Mesures existantes"] || earlier["Actions planifiées"] !== row["Actions planifiées"];
    if (measureChanged) updatedMeasures += 1;
  });
  return { hasPrevious: true, risks: rows.length, measures: 0, newRisks, updatedRisks, newMeasures, updatedMeasures };
}

type SignMode = "fichier" | "pad" | "texte";

function textSignature(name: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 520;
  canvas.height = 150;
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1e1b4b";
  context.font = "italic 52px 'Segoe Script', 'Brush Script MT', cursive";
  context.fillText(name, 18, 92);
  return canvas.toDataURL("image/png");
}

export function DirectorSignatureView({
  accessToken,
  signerName,
  signerEmail,
  designatedEmail,
  designatedName,
  enabled,
  onDecided,
}: {
  accessToken: string;
  signerName: string;
  signerEmail: string;
  designatedEmail?: string;
  designatedName?: string;
  enabled: boolean;
  onDecided: (notice: { titre: string; contenu: string; recipientEmail?: string }) => void;
}) {
  const [documents, setDocuments] = useAppDataDocumentStore<Document[]>(
    APP_DATA_KEYS.documentsLibrary,
    accessToken,
    { seed: [], loadLocal: loadDocumentLibrary, saveLocal: saveDocumentLibrary },
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<SignMode>("fichier");
  const [savedSignature, setSavedSignature] = useState(loadSavedSignature);
  const [typedName, setTypedName] = useState(signerName);
  const [motif, setMotif] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const pending = documents.filter((item) => item.type === "DUERP" && (item.status === "Envoyé pour signature" || item.status === "Signé" || item.status === "Refusé"));
  const selected = pending.find((item) => item.id === selectedId) ?? null;
  const designatedMatch = Boolean(designatedEmail) && designatedEmail!.toLowerCase() === signerEmail.toLowerCase();
  const canSign = designatedEmail ? designatedMatch : enabled;
  const changes = selected ? describeChanges(selected, pending) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "pad") return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#1e1b4b";
    context.lineWidth = 2.5;
    context.lineCap = "round";
  }, [mode, selectedId]);

  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width,
      y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height,
    };
  };

  const updateDocument = (next: Document) => {
    setDocuments((current) => current.map((item) => item.id === next.id ? next : item));
  };

  const placeSignature = (dataUrl: string, signatureMode: SignMode) => {
    if (!selected) return;
    if (!canSign) {
      toast.error(designatedName ? `Seul ${designatedName} peut signer ce DUERP.` : "Seul le directeur désigné peut signer.");
      return;
    }
    const at = new Date().toLocaleString("fr-FR");
    let fileDataUrl = selected.fileDataUrl;
    let fileSize = selected.fileSize;
    if (selected.riskRows?.length) {
      fileDataUrl = generateDuerpTablePdf(selected.riskRows, { dataUrl, name: signerName, at }).output("datauristring");
      fileSize = Math.round((fileDataUrl.length * 3) / 4);
    }
    const signed: Document = {
      ...selected,
      status: "Signé",
      updatedAt: new Date().toISOString().split("T")[0],
      signatureImage: dataUrl,
      signatureMode,
      signedAt: new Date().toISOString(),
      signedBy: signerName,
      fileDataUrl,
      fileSize,
      refusalReason: undefined,
    };
    updateDocument(signed);
    onDecided({
      titre: "DUERP signé",
      contenu: `${signerName} a signé « ${selected.title} ».`,
      recipientEmail: selected.sentByEmail,
    });
    toast.success("Signature placée sur le DUERP.");
  };

  const refuse = () => {
    if (!selected) return;
    if (!canSign) {
      toast.error("Seul le directeur désigné peut refuser.");
      return;
    }
    if (!motif.trim()) {
      toast.error("Indiquez le motif du refus.");
      return;
    }
    updateDocument({
      ...selected,
      status: "Refusé",
      refusalReason: motif.trim(),
      updatedAt: new Date().toISOString().split("T")[0],
    });
    onDecided({
      titre: "DUERP refusé",
      contenu: `${signerName} a refusé « ${selected.title} ». Motif : ${motif.trim()}`,
      recipientEmail: selected.sentByEmail,
    });
    setMotif("");
    toast.success("Refus enregistré, avec le motif.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Signature DUERP</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {designatedName
            ? `${designatedName} est le seul directeur habilité à signer. L'historique, le commentaire et les changements restent consultables ici.`
            : "Aucun directeur n'est encore désigné. Le rôle Directeur permet d'essayer la signature. L'historique des versions reste consultable."}
        </p>
      </div>

      {pending.length === 0 ? (
        <section className="rounded-2xl border border-violet-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Aucune version en attente. Le conseiller de prévention envoie un DUERP depuis Documents SST, bouton Générer le DUERP, puis Envoyer pour signature.
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-2">
            {pending.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left ${selectedId === item.id ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`}
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">Version {item.version} · {item.sentByName || item.createdBy}</p>
                {item.signedAt ? <p className="mt-1 text-xs text-emerald-800">Signé le {formatDay(item.signedAt)} par {item.signedBy}</p> : null}
                <Badge className={`mt-2 border ${DOCUMENT_STATUS_STYLES[item.status]}`}>{item.status}</Badge>
              </button>
            ))}
          </div>

          {selected ? (
            <section className="space-y-4 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{selected.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{selected.description}</p>
                {selected.refusalReason ? <p className="mt-2 text-sm text-rose-800">Motif du refus : {selected.refusalReason}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signataire</p>
                  <p className="mt-1 font-semibold text-slate-950">{selected.directorName || designatedName || "Directeur"}</p>
                  <p className="text-sm text-slate-600">Directeur</p>
                  {selected.directorEmail || designatedEmail ? <p className="text-sm text-slate-600">{selected.directorEmail || designatedEmail}</p> : null}
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                  <p>Envoyé le {formatDay(selected.createdAt)}{selected.sentByName ? ` par ${selected.sentByName}` : ""}.</p>
                  {selected.signedAt ? <p className="mt-1">Signé le {formatDay(selected.signedAt)} par {selected.signedBy}.</p> : null}
                </div>
              </div>
              {selected.signatureComment ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">Commentaire</p>
                  <p className="mt-1 text-sm text-slate-700">{selected.signatureComment}</p>
                </div>
              ) : null}
              {changes ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {changes.hasPrevious ? "Modifications depuis la version précédente" : "Contenu de cette version"}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {changes.hasPrevious ? (
                      <>
                        <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs text-slate-500">Nouveaux risques</dt><dd className="text-lg font-semibold text-slate-950">{changes.newRisks}</dd></div>
                        <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs text-slate-500">Risques modifiés</dt><dd className="text-lg font-semibold text-slate-950">{changes.updatedRisks}</dd></div>
                        <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs text-slate-500">Nouvelles mesures</dt><dd className="text-lg font-semibold text-slate-950">{changes.newMeasures}</dd></div>
                        <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs text-slate-500">Mesures modifiées</dt><dd className="text-lg font-semibold text-slate-950">{changes.updatedMeasures}</dd></div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs text-slate-500">Risques</dt><dd className="text-lg font-semibold text-slate-950">{changes.risks}</dd></div>
                        <div className="rounded-xl border border-slate-200 p-3"><dt className="text-xs text-slate-500">Avec une mesure ou une action</dt><dd className="text-lg font-semibold text-slate-950">{changes.measures}</dd></div>
                      </>
                    )}
                  </dl>
                </div>
              ) : null}
              {selected.fileDataUrl ? (
                <Button type="button" variant="outline" onClick={() => downloadStoredFile(selected)} className="h-11 rounded-xl">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le PDF
                </Button>
              ) : null}
              {selected.fileDataUrl ? <DocumentFileViewer name={selected.fileName} dataUrl={selected.fileDataUrl} /> : <p className="text-sm text-slate-600">Aucun fichier à consulter.</p>}
              {selected.signatureImage && selected.status === "Signé" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-emerald-950">Signature placée</p>
                  <img src={selected.signatureImage} alt={`Signature de ${selected.signedBy || signerName}`} className="h-20 bg-white object-contain" />
                </div>
              ) : null}

              {selected.status === "Envoyé pour signature" && canSign ? (
                <div className="space-y-4 border-t border-violet-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["fichier", "Fichier"],
                      ["pad", "Pad"],
                      ["texte", "Texte"],
                    ] as const).map(([value, label]) => (
                      <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${mode === value ? "border-violet-700 bg-violet-700 text-white" : "border-violet-200 bg-white text-violet-950"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {mode === "fichier" ? (
                    <div className="space-y-3">
                      <Label htmlFor="signature-file" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Upload className="h-4 w-4 text-violet-500" />
                        Signature enregistrée
                      </Label>
                      <Input
                        id="signature-file"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="h-11 rounded-xl border-violet-200"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = String(reader.result || "");
                            saveSavedSignature(dataUrl);
                            setSavedSignature(dataUrl);
                            toast.success("Signature enregistrée. Elle peut être placée sur le document.");
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      {savedSignature ? <img src={savedSignature} alt="Signature enregistrée" className="h-20 rounded-lg border border-violet-100 bg-white object-contain" /> : null}
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={!savedSignature} onClick={() => {
                          const link = document.createElement("a");
                          link.href = savedSignature;
                          link.download = "signature-directeur.png";
                          link.click();
                        }} className="h-11 rounded-xl">
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger la signature
                        </Button>
                        <Button type="button" disabled={!savedSignature} onClick={() => placeSignature(savedSignature, "fichier")} className="h-11 rounded-xl bg-indigo-950 text-white hover:bg-indigo-900">
                          <FileSignature className="mr-2 h-4 w-4" />
                          Placer automatiquement
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {mode === "pad" ? (
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><PenLine className="h-4 w-4 text-violet-500" />Signer au pad</p>
                      <canvas
                        ref={canvasRef}
                        width={640}
                        height={180}
                        className="w-full max-w-xl touch-none rounded-xl border border-violet-200 bg-white"
                        onPointerDown={(event) => {
                          drawing.current = true;
                          lastPoint.current = pointFromEvent(event);
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                        onPointerMove={(event) => {
                          if (!drawing.current || !lastPoint.current) return;
                          const context = canvasRef.current?.getContext("2d");
                          const next = pointFromEvent(event);
                          if (!context) return;
                          context.beginPath();
                          context.moveTo(lastPoint.current.x, lastPoint.current.y);
                          context.lineTo(next.x, next.y);
                          context.stroke();
                          lastPoint.current = next;
                        }}
                        onPointerUp={() => { drawing.current = false; lastPoint.current = null; }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => {
                          const canvas = canvasRef.current;
                          const context = canvas?.getContext("2d");
                          if (!canvas || !context) return;
                          context.fillStyle = "#ffffff";
                          context.fillRect(0, 0, canvas.width, canvas.height);
                        }} className="h-11 rounded-xl">
                          <Eraser className="mr-2 h-4 w-4" />
                          Effacer
                        </Button>
                        <Button type="button" onClick={() => {
                          const dataUrl = canvasRef.current?.toDataURL("image/png") || "";
                          if (!dataUrl) return;
                          saveSavedSignature(dataUrl);
                          setSavedSignature(dataUrl);
                          placeSignature(dataUrl, "pad");
                        }} className="h-11 rounded-xl bg-indigo-950 text-white hover:bg-indigo-900">
                          <PenLine className="mr-2 h-4 w-4" />
                          Signer avec le tracé
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {mode === "texte" ? (
                    <div className="space-y-3">
                      <Label htmlFor="signature-text" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Type className="h-4 w-4 text-violet-500" />
                        Signer par le nom
                      </Label>
                      <Input id="signature-text" value={typedName} onChange={(event) => setTypedName(event.target.value)} className="h-11 max-w-md rounded-xl border-violet-200 pl-3" />
                      <p className="font-[cursive] text-3xl text-indigo-950">{typedName || "Nom"}</p>
                      <Button type="button" onClick={() => {
                        const dataUrl = textSignature(typedName.trim() || signerName);
                        saveSavedSignature(dataUrl);
                        setSavedSignature(dataUrl);
                        placeSignature(dataUrl, "texte");
                      }} className="h-11 rounded-xl bg-indigo-950 text-white hover:bg-indigo-900">
                        <Type className="mr-2 h-4 w-4" />
                        Signer avec ce texte
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="refusal-motif" className="text-sm font-semibold text-slate-800">Refuser, avec un motif</Label>
                    <Textarea id="refusal-motif" value={motif} onChange={(event) => setMotif(event.target.value)} className="min-h-[80px] rounded-xl border-rose-200 px-3 py-2.5" placeholder="Motif lu par le conseiller de prévention" />
                    <Button type="button" variant="outline" onClick={refuse} className="h-11 rounded-xl border-rose-200 text-rose-800">
                      Refuser
                    </Button>
                  </div>
                </div>
              ) : null}

              {selected.status === "Envoyé pour signature" && !canSign ? (
                <p className="text-sm text-rose-800">Seul {designatedName || "le directeur désigné"} peut signer ou refuser cette version.</p>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Choisissez une version pour la consulter.</section>
          )}
        </div>
      )}
    </div>
  );
}
