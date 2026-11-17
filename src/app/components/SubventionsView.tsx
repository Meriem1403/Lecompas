import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, Download, Eye, FileText, Landmark, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { useLeaveGuard } from "@/app/components/leaveGuard";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  KIND_LABEL,
  blankRequest,
  demandeProgress,
  downloadInvoicePdf,
  downloadSuiviPdf,
  ejDigits,
  eurosEnLettres,
  extractBeneficiaire,
  extractObjet,
  extractReference,
  extractSignataire,
  formatDateTime,
  formatDay,
  formatEj,
  formatMoney,
  inferSubsidyFromText,
  normalizeSubsidy,
  piecesForKind,
  sampleSubsidy,
  signSubsidyPdf,
  stampEjOnPdf,
  statementFor,
  subsidyReference,
  withComputedAmounts,
  withDemandes,
  type PaymentKind,
  type PaymentStatus,
  type SubsidyActor,
  type SubsidyAttachment,
  type SubsidyFile,
  type SubsidyPayment,
  type SubsidyPieceFile,
  type SubsidyRequest,
} from "@/app/utils/subsidyAccounting";

const STORAGE_KEY = "lecompas_subventions_v2";

const STEPS = [
  { id: "attestation", label: "Attestation" },
  { id: "demandes", label: "Demandes" },
  { id: "versements", label: "Versements" },
] as const;

export interface SubsidyDirectoryUser {
  id: string;
  name: string;
  email: string;
  service: string;
}

type StepId = (typeof STEPS)[number]["id"];
type FolderMode = "consult" | "edit";
type DemandeMode = "browse" | "consult" | "edit" | "create";

const primaryBtn = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700";
const quietBtn = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-50";
const ghostBtn = "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-emerald-900 hover:bg-emerald-50";
const dangerBtn = "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-rose-700 hover:bg-rose-50";
const line = "h-12 w-full min-w-0 max-w-full rounded-xl border border-emerald-200 bg-white px-3 text-base text-stone-800 outline-none focus:border-emerald-500";
const panel = "rounded-3xl border border-emerald-100 bg-white";

function loadStore(): SubsidyFile[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubsidyFile[];
    return Array.isArray(parsed) ? parsed.map((file) => normalizeSubsidy(file)) : null;
  } catch {
    return null;
  }
}

function saveStore(value: SubsidyFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    toast.error("Le dossier est trop volumineux pour être conservé dans ce navigateur.");
  }
}

async function readPdfText(data: ArrayBuffer) {
  await import("pdfjs-dist/build/pdf.worker.min.mjs");
  const pdfjs = await import("pdfjs-dist");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data.slice(0)), isEvalSupported: false }).promise;
  const pages: string[] = [];
  for (let index = 1; index <= doc.numPages; index += 1) {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  await doc.destroy();
  return pages.join("\n");
}

function readFile(file: File) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function bytesToDataUrl(bytes: Uint8Array, type = "application/pdf") {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return `data:${type};base64,${btoa(binary)}`;
}

function dataUrlToBytes(dataUrl: string) {
  const binary = atob(dataUrl.split(",")[1] || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function toDataUrl(data: ArrayBuffer) {
  return bytesToDataUrl(new Uint8Array(data));
}

function blankFile(): SubsidyFile {
  return {
    id: `sub-${Date.now()}`,
    reference: "",
    ej: "",
    programme: "",
    objet: "",
    beneficiaire: "",
    signataire: "",
    qualite: "",
    suiviNom: "",
    suiviEmail: "",
    conventionDate: "",
    commencementDate: "",
    attestationPlace: "",
    attestationDate: "",
    courrierDate: "",
    courrierText: "",
    total: 0,
    advanceRate: 0.3,
    requestedAmount: 0,
    amountSource: "",
    payeeName: "",
    payeeBank: "",
    payments: [],
    demandes: [],
  };
}

function paidSum(file: SubsidyFile) {
  return file.payments.filter((payment) => payment.status === "versé").reduce((sum, payment) => sum + payment.amount, 0);
}

function askedSum(file: SubsidyFile) {
  return (file.demandes || []).reduce((sum, demande) => sum + (Number(demande.amount) || 0), 0);
}

export function SubventionsView({ accessToken, directory = [], currentUser = { id: "", name: "", email: "", service: "", role: "agent" }, onNotify = () => {} }: {
  accessToken: string;
  directory?: SubsidyDirectoryUser[];
  currentUser?: SubsidyDirectoryUser & { role: string };
  onNotify?: (notice: { titre: string; contenu: string; recipientEmail?: string }) => void;
}) {
  const navigate = useNavigate();
  const [files, setFiles] = useAppDataDocumentStore<SubsidyFile[]>(
    APP_DATA_KEYS.subsidyFiles,
    accessToken,
    { seed: [sampleSubsidy()], loadLocal: loadStore, saveLocal: saveStore },
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<FolderMode>("consult");
  const [draft, setDraft] = useState<SubsidyFile | null>(null);
  const [baseline, setBaseline] = useState("");
  const [step, setStep] = useState<StepId>("attestation");
  const [demandeMode, setDemandeMode] = useState<DemandeMode>("browse");
  const [activeDemandeId, setActiveDemandeId] = useState<string | null>(null);
  const [demandeDraft, setDemandeDraft] = useState<SubsidyRequest | null>(null);
  const [toDelete, setToDelete] = useState<SubsidyFile | null>(null);
  const [toDeleteDemande, setToDeleteDemande] = useState<SubsidyRequest | null>(null);
  const stampedFor = useRef("");
  const editing = mode === "edit";
  const dirty = Boolean(editing && draft && JSON.stringify(draft) !== baseline);
  const requestLeave = useLeaveGuard(dirty);
  const selected = files.find((file) => file.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      setBaseline("");
      return;
    }
    if (!selected) return;
    const next = normalizeSubsidy(selected);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    stampedFor.current = next.ejStampVersion === 2 && next.attestationStamped
      ? `2:${next.attestation?.dataUrl.length || 0}:${ejDigits(next.ej)}`
      : "";
  }, [selectedId, files]);

  useEffect(() => {
    setStep("attestation");
    setDemandeMode("browse");
    setActiveDemandeId(null);
    setDemandeDraft(null);
  }, [selectedId]);

  const figures = useMemo(() => (draft ? subsidyReference(draft) : null), [draft]);
  const demandes = draft?.demandes || [];
  const activeDemande = demandes.find((demande) => demande.id === activeDemandeId) || null;

  const resetDemandePane = () => {
    setDemandeMode("browse");
    setActiveDemandeId(null);
    setDemandeDraft(null);
  };

  const openFile = (file: SubsidyFile, nextMode: FolderMode) => requestLeave(() => {
    setMode(nextMode);
    setSelectedId(file.id);
  });

  const backToList = () => requestLeave(() => setSelectedId(null));

  const createFile = () => requestLeave(() => {
    const created = normalizeSubsidy(blankFile());
    setDraft(created);
    setBaseline(JSON.stringify(created));
    setMode("edit");
    setSelectedId(created.id);
  });

  const patch = (partial: Partial<SubsidyFile>) => {
    setDraft((current) => (current ? withComputedAmounts({ ...current, ...partial }) : current));
  };

  const patchPayment = (id: string, partial: Partial<SubsidyPayment>) => {
    setDraft((current) => (current
      ? withComputedAmounts({
        ...current,
        payments: current.payments.map((payment) => (payment.id === id ? { ...payment, ...partial } : payment)),
      })
      : current));
  };

  const engrave = async (ej: string, original?: SubsidyAttachment | null, quiet = false) => {
    const source = original || draft?.attestation;
    const digits = ejDigits(ej);
    if (!source || digits.length < 8) return;
    const key = `2:${source.dataUrl.length}:${digits}`;
    if (stampedFor.current === key) return;
    stampedFor.current = key;
    try {
      const stamped = await stampEjOnPdf(dataUrlToBytes(source.dataUrl), digits);
      const attachment = { name: source.name.replace(/\.pdf$/i, "") + "-EJ.pdf", dataUrl: bytesToDataUrl(stamped) };
      setDraft((current) => {
        if (!current) return current;
        const nextDemandes = (current.demandes || []).map((demande) => (
          demande.stage === "ej" ? { ...demande, stage: "signature" as const } : demande
        ));
        if (!quiet) {
          nextDemandes.filter((demande) => demande.stage === "signature" && !demande.signedAt).forEach((demande) => {
            (demande.providers || []).forEach((person) => onNotify({
              titre: "Attestation à signer",
              contenu: `Le numéro EJ ${formatEj(digits)} est inscrit. ${demande.label || "La demande"} attend le document signé.`,
              recipientEmail: person.email,
            }));
          });
        }
        const next = { ...current, attestationStamped: attachment, ejStampVersion: 2, demandes: nextDemandes };
        if (!quiet) {
          setFiles((stored) => stored.map((file) => (file.id === next.id ? next : file)));
          setBaseline(JSON.stringify(next));
        }
        return next;
      });
      if (!quiet) toast.success(`Le numéro ${formatEj(digits)} est inscrit dans la case EJ.`);
    } catch {
      stampedFor.current = "";
      toast.error("Ce PDF n'a pas pu recevoir le numéro EJ.");
    }
  };

  useEffect(() => {
    if (!draft?.attestation || ejDigits(draft.ej).length < 8) return;
    if (draft.ejStampVersion === 2 && draft.attestationStamped) return;
    void engrave(draft.ej, draft.attestation, true);
  }, [draft?.id, draft?.attestation?.dataUrl, draft?.ej, draft?.ejStampVersion]);

  const onAttestation = async (file: File) => {
    if (!draft || !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Déposez l'attestation au format PDF.");
      return;
    }
    const data = await readFile(file);
    const attachment = { name: file.name, dataUrl: toDataUrl(data) };
    stampedFor.current = "";
    patch({ attestation: attachment, attestationStamped: null });
    toast.message("Document reçu. Collez le numéro EJ pour le placer dans la case prévue.");
    if (ejDigits(draft.ej).length >= 8) await engrave(draft.ej, attachment);
  };

  const onEj = (value: string) => {
    if (ejDigits(value).length < 8) {
      stampedFor.current = "";
      patch({ ej: value, attestationStamped: null });
      return;
    }
    patch({ ej: value });
    if (ejDigits(value).length >= 10) void engrave(value);
  };

  const openDemande = (demande: SubsidyRequest) => {
    setActiveDemandeId(demande.id);
    setDemandeDraft(null);
    setDemandeMode("consult");
  };

  const editDemande = (demande: SubsidyRequest) => {
    setActiveDemandeId(demande.id);
    setDemandeDraft({ ...demande });
    setDemandeMode("edit");
  };

  const startDemande = () => {
    const kind: PaymentKind = demandes.some((demande) => demande.kind === "avance") ? "acompte" : "avance";
    const self = currentUser.email ? [{ id: currentUser.id, name: currentUser.name, email: currentUser.email }] : [];
    const compta = ["admin", "directeur", "chef_service"].includes(currentUser.role);
    const created = blankRequest({
      kind,
      label: kind === "avance" ? "Demande d'avance" : "Nouvelle demande",
      reference: draft?.reference || "",
      handlers: compta ? self : [],
      providers: self,
      pieces: piecesForKind(kind),
    });
    setActiveDemandeId(created.id);
    setDemandeDraft(created);
    setDemandeMode("create");
  };

  const onDemandePdf = async (file: File) => {
    if (!draft || !demandeDraft || !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Déposez la demande au format PDF.");
      return;
    }
    const data = await readFile(file);
    const text = await readPdfText(data).catch(() => "");
    const found = inferSubsidyFromText(text, draft.advanceRate || 0.3);
    const amount = found.requested || found.total || demandeDraft.amount;
    const objet = extractObjet(text);
    setDemandeDraft({
      ...demandeDraft,
      pdf: { name: file.name, dataUrl: toDataUrl(data) },
      text,
      amount: amount || demandeDraft.amount,
      reference: demandeDraft.reference || extractReference(text),
      label: demandeDraft.label === "Nouvelle demande" && objet ? objet.slice(0, 90) : demandeDraft.label,
    });
    patch({
      beneficiaire: draft.beneficiaire || extractBeneficiaire(text),
      objet: draft.objet || objet,
      reference: draft.reference || extractReference(text),
      programme: draft.programme || (/fonds\s+vert/i.test(text) ? "Fonds vert" : ""),
      signataire: draft.signataire || extractSignataire(text),
    });
    if (amount) toast.success(`Somme lue dans la demande : ${formatMoney(amount)}.`);
    else toast.message("Aucun montant lisible. Saisissez la somme demandée.");
  };

  const writeDemande = (nextDemande: SubsidyRequest, message: string) => {
    if (!draft) return;
    const previous = (draft.demandes || []).find((demande) => demande.id === nextDemande.id);
    let payments = draft.payments;
    if (previous?.kind === "acompte" && nextDemande.kind !== "acompte" && previous.paymentId) {
      const payment = payments.find((item) => item.id === previous.paymentId);
      if (payment?.status !== "versé") payments = payments.filter((item) => item.id !== previous.paymentId);
    }
    const exists = (draft.demandes || []).some((demande) => demande.id === nextDemande.id);
    const nextDemandes = exists
      ? (draft.demandes || []).map((demande) => (demande.id === nextDemande.id ? { ...nextDemande, paymentId: nextDemande.kind === "acompte" ? (demande.paymentId || nextDemande.paymentId) : undefined } : demande))
      : [...(draft.demandes || []), nextDemande];
    const next = withDemandes({ ...draft, payments, demandes: nextDemandes });
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setFiles((current) => (current.some((file) => file.id === next.id)
      ? current.map((file) => (file.id === next.id ? next : file))
      : [next, ...current]));
    setActiveDemandeId(nextDemande.id);
    setDemandeDraft(null);
    setDemandeMode("consult");
    toast.success(message);
  };

  const commitDemande = () => {
    if (!draft || !demandeDraft) return;
    if (!demandeDraft.label.trim() && !demandeDraft.pdf && !(demandeDraft.amount > 0)) {
      toast.error("Donnez un intitulé, un montant, ou déposez le PDF.");
      return;
    }
    if (!(demandeDraft.handlers || []).length || !(demandeDraft.providers || []).length) {
      toast.error("Désignez qui traite la demande et qui fournit les pièces.");
      return;
    }
    const creating = demandeMode === "create";
    writeDemande(demandeDraft, creating ? "La demande est créée." : "La demande est modifiée.");
    if (creating) {
      (demandeDraft.handlers || []).forEach((person) => onNotify({
        titre: "Nouvelle demande de paiement",
        contenu: `${currentUser.name || "Un utilisateur"} a créé « ${demandeDraft.label || "une demande"} ». Les pièces sont à suivre.`,
        recipientEmail: person.email,
      }));
    }
  };

  const removeDemande = (demande: SubsidyRequest) => {
    setDraft((current) => {
      if (!current) return current;
      const payment = current.payments.find((item) => item.id === demande.paymentId);
      const payments = demande.kind === "acompte" && payment?.status !== "versé"
        ? current.payments.filter((item) => item.id !== demande.paymentId)
        : current.payments;
      return withDemandes({
        ...current,
        payments,
        demandes: (current.demandes || []).filter((item) => item.id !== demande.id),
      });
    });
    if (activeDemandeId === demande.id) resetDemandePane();
    setToDeleteDemande(null);
    toast.success("La demande est retirée.");
  };

  const setStatus = (payment: SubsidyPayment, status: PaymentStatus) => {
    if (status === payment.status) return;
    const settledAt = status === "versé" ? new Date().toISOString() : "";
    patchPayment(payment.id, { status, settledAt });
    if (status === "versé") toast.success(`Règlement enregistré le ${formatDateTime(settledAt)}.`);
  };

  const addPayment = (kind: PaymentKind) => {
    if (!draft) return;
    if (kind !== "acompte" && draft.payments.some((payment) => payment.kind === kind)) {
      toast.error(`${KIND_LABEL[kind]} est déjà dans le suivi.`);
      return;
    }
    const payment: SubsidyPayment = {
      id: `pay-${Date.now()}`,
      kind,
      month: new Date().toISOString().slice(0, 7),
      serviceFait: "",
      amount: 0,
      place: "Marseille",
      status: "prévu",
    };
    setDraft(withComputedAmounts({ ...draft, payments: [...draft.payments, payment] }));
  };

  const save = () => {
    if (!draft) return;
    if (draft.ej && ejDigits(draft.ej).length < 8) {
      toast.error("Le numéro EJ doit contenir au moins 8 chiffres.");
      return;
    }
    if (!draft.ej && !draft.beneficiaire.trim() && !draft.programme.trim()) {
      toast.error("Indiquez le numéro EJ ou le bénéficiaire pour retrouver le dossier.");
      return;
    }
    const next = withDemandes(draft);
    setFiles((current) => (current.some((file) => file.id === next.id)
      ? current.map((file) => (file.id === next.id ? next : file))
      : [next, ...current]));
    setSelectedId(next.id);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    toast.success("Le dossier de subvention est enregistré.");
  };

  const removeFile = (file: SubsidyFile) => {
    setFiles((current) => current.filter((item) => item.id !== file.id));
    if (selectedId === file.id) setSelectedId(null);
    setToDelete(null);
  };

  if (!draft || !figures) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-5 text-stone-800">
        <header className={`${panel} overflow-hidden`}>
          <div className="flex flex-col gap-4 bg-gradient-to-br from-emerald-50 via-white to-amber-50/50 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-emerald-700">Comptabilité</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">Subventions</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">Le service instructeur reçoit l'arrêté signé par le préfet, inscrit le numéro EJ, puis enregistre chaque demande de paiement du bénéficiaire et suit l'avance et le solde.</p>
            </div>
            <button type="button" onClick={createFile} className={primaryBtn}><Plus className="h-4 w-4" /> Nouvelle subvention</button>
          </div>
        </header>
        {files.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-14 text-center">
            <Landmark className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-base font-medium text-emerald-950">Aucune subvention</p>
            <p className="mt-1 text-sm text-stone-600">Créez le dossier, puis ajoutez les demandes au fur et à mesure.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {files.map((file) => {
              const ready = normalizeSubsidy(file);
              const ref = subsidyReference(ready);
              const paid = paidSum(ready);
              const asked = askedSum(ready);
              const ratio = ref.total > 0 ? Math.min(100, Math.round((paid / ref.total) * 100)) : 0;
              return (
                <article key={file.id} className={`${panel} overflow-hidden`}>
                  <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)_auto] lg:items-center">
                    <div className="min-w-0 border-l-4 border-emerald-500 pl-4">
                      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-emerald-700">{ready.programme || "Subvention"} {ready.reference ? `· ${ready.reference}` : ""}</p>
                      <h2 className="mt-1 text-lg font-semibold text-emerald-950">{ready.beneficiaire || "Bénéficiaire à préciser"}</h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{ready.objet || "Objet à préciser"}</p>
                      <p className="mt-2 text-[13px] text-stone-500">{(ready.demandes || []).length} demande{(ready.demandes || []).length > 1 ? "s" : ""} · EJ {formatEj(ready.ej) || "à inscrire"}</p>
                    </div>
                    <div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Stat label="Total" value={formatMoney(ref.total)} />
                        <Stat label="Demandé" value={formatMoney(asked)} />
                        <Stat label="Reste" value={formatMoney(Math.max(0, ref.total - paid))} tone="amber" />
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100" aria-hidden>
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ratio}%` }} />
                      </div>
                      <p className="mt-1 text-[12px] text-stone-500">{formatMoney(paid)} versés</p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      <button type="button" onClick={() => openFile(ready, "consult")} className={quietBtn}><Eye className="h-4 w-4" /> Consulter</button>
                      <button type="button" onClick={() => openFile(ready, "edit")} className={ghostBtn}><Pencil className="h-4 w-4" /> Modifier</button>
                      <button type="button" onClick={() => setToDelete(ready)} className={dangerBtn}><Trash2 className="h-4 w-4" /> Supprimer</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <ConfirmDialog
          open={Boolean(toDelete)}
          title="Supprimer ce dossier ?"
          description={toDelete ? `${toDelete.reference || toDelete.programme || "Ce dossier"}, ses demandes et son suivi seront retirés.` : ""}
          confirmLabel="Supprimer"
          onClose={() => setToDelete(null)}
          onConfirm={() => { if (toDelete) removeFile(toDelete); }}
        />
      </div>
    );
  }

  const preview = draft.attestationStamped || draft.attestation;
  const ratePercent = Number((draft.advanceRate * 100).toFixed(2));
  const paid = paidSum(draft);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 text-stone-800">
      <header className={`${panel} overflow-hidden`}>
        <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-emerald-700">{editing ? "Modification" : "Consultation"}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">{draft.programme || "Subvention"} {draft.reference ? `· ${draft.reference}` : ""}</h1>
              <p className="mt-1 text-sm text-stone-600">{draft.beneficiaire || "Bénéficiaire à préciser"} · EJ {formatEj(draft.ej) || "à inscrire"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {editing ? null : <button type="button" onClick={() => setMode("edit")} className={primaryBtn}><Pencil className="h-4 w-4" /> Modifier</button>}
              <button type="button" onClick={() => downloadSuiviPdf(draft)} className={quietBtn}><Download className="h-4 w-4" /> Suivi PDF</button>
              <button type="button" onClick={() => {
                const hint = [draft.beneficiaire, draft.objet].filter(Boolean).join(" — ");
                navigate(`/nomenclature?parcours=subvention${hint ? `&q=${encodeURIComponent(hint)}` : ""}`);
              }} className={quietBtn}>GM et PCE</button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={`Avance ${ratePercent} %`} value={formatMoney(figures.avance)} tone="emerald" />
            <Stat label="Acomptes et solde" value={formatMoney(figures.apresAvance)} />
            <Stat label="Demandé" value={formatMoney(askedSum(draft))} />
            <Stat label="Reste à verser" value={formatMoney(Math.max(0, figures.total - paid))} tone="amber" />
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Étapes du dossier" className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((item, index) => {
          const selectedStep = step === item.id;
                const detail = item.id === "demandes"
                  ? `${demandes.length} demande${demandes.length > 1 ? "s" : ""}`
                  : item.id === "versements"
                    ? formatMoney(figures.total)
                    : draft.attestationStamped ? "EJ inscrit" : draft.attestation ? "PDF reçu" : "À déposer";
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selectedStep}
              onClick={() => setStep(item.id)}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left ${selectedStep ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-950 hover:border-emerald-300"}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${selectedStep ? "bg-white/20" : "bg-emerald-50 text-emerald-800"}`}>{index + 1}</span>
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={`block text-[12px] ${selectedStep ? "text-emerald-50" : "text-stone-500"}`}>{detail}</span>
              </span>
            </button>
          );
        })}
      </div>

      {step === "attestation" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <article className={`${panel} p-5 sm:p-6`}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-950"><FileText className="h-5 w-5 text-emerald-700" /> Attestation reçue</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Le préfet signe l'arrêté, le bénéficiaire signe l'attestation. Le numéro EJ se place en noir dans la case « EJ n° » déjà imprimée. Sur l'attestation, il se place sous le titre.</p>
            {editing ? (
              <>
                <DropZone title="Glisser l'attestation PDF" hint={draft.attestation?.name || "ou choisir le fichier"} onFile={(file) => void onAttestation(file)} />
                <div className="mt-4">
                  <Field id="ej" label="Numéro EJ">
                    <input id="ej" className={line} value={draft.ej} placeholder="2105059013" onChange={(event) => onEj(event.target.value)} onBlur={(event) => { if (ejDigits(event.target.value).length >= 8) void engrave(event.target.value); }} />
                  </Field>
                </div>
              </>
            ) : (
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="text-[12px] text-stone-500">Fichier</dt><dd className="mt-1 font-medium">{draft.attestation?.name || "Aucune attestation jointe"}</dd></div>
                <div><dt className="text-[12px] text-stone-500">Numéro EJ</dt><dd className="mt-1 font-medium">{formatEj(draft.ej) || "Non inscrit"}</dd></div>
              </dl>
            )}
            <p className="mt-4 text-sm leading-6 text-stone-600">
              {draft.attestationStamped ? `Le numéro ${formatEj(draft.ej)} est dans la case EJ.` : "Le numéro apparaît dès que le document et l'EJ sont réunis."}
            </p>
            {preview ? <a href={preview.dataUrl} download={preview.name} className={`${primaryBtn} mt-4`}><Download className="h-4 w-4" /> Télécharger l'attestation</a> : null}
          </article>
          <PdfFrame title="Attestation" file={preview} empty="L'attestation s'affiche ici après le dépôt." />
        </section>
      ) : null}

      {step === "demandes" ? (
        <section className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start">
          <aside className={`${panel} min-w-0 p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-emerald-950">Demandes</h2>
              <button type="button" onClick={startDemande} className={quietBtn}><Plus className="h-4 w-4" /> Nouvelle</button>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-stone-500">{demandes.length ? `${formatMoney(askedSum(draft))} demandés au total.` : "Les courriers du bénéficiaire arrivent un par un. Une demande incomplète se signale sous quinze jours."}</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {demandes.length === 0 ? <p className="w-full rounded-2xl bg-emerald-50 px-3 py-4 text-sm text-emerald-950">Aucune demande. {editing ? "La première est souvent l'avance." : "Passez en modification pour en créer une."}</p> : demandes.map((demande) => {
                const active = demande.id === activeDemandeId;
                const progress = demandeProgress(demande);
                return (
                  <article key={demande.id} className={`w-[min(100%,18rem)] shrink-0 rounded-2xl border p-3 lg:w-auto ${active ? "border-emerald-400 bg-emerald-50" : "border-emerald-100 bg-white"}`}>
                    <button type="button" onClick={() => openDemande(demande)} className="w-full text-left">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-[12px] text-stone-500">{formatDay(demande.receivedAt)} · {KIND_LABEL[demande.kind]}</span>
                          <span className="mt-1 block truncate font-medium text-emerald-950">{demande.label || "Demande"}</span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-950">{formatMoney(demande.amount)}</span>
                      </span>
                      <span className="mt-3 block">
                        <span className="mb-1 flex justify-between text-[12px] text-stone-500"><span>Pièces</span><span>{progress.ready}/{progress.total}</span></span>
                        <span className="block h-1.5 overflow-hidden rounded-full bg-emerald-100"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${progress.percent}%` }} /></span>
                      </span>
                    </button>
                    {editing ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button type="button" aria-label={`Modifier ${demande.label || "la demande"}`} onClick={() => editDemande(demande)} className={ghostBtn}><Pencil className="h-3.5 w-3.5" /> Modifier</button>
                        <button type="button" aria-label={`Supprimer ${demande.label || "la demande"}`} onClick={() => setToDeleteDemande(demande)} className={dangerBtn}><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </aside>
          <div>
            {demandeMode === "create" || demandeMode === "edit" ? (
              demandeDraft ? (
                <DemandeForm
                  demande={demandeDraft}
                  creating={demandeMode === "create"}
                  directory={directory}
                  currentUser={currentUser}
                  onChange={setDemandeDraft}
                  onFile={(file) => void onDemandePdf(file)}
                  onCancel={() => {
                    if (demandeMode === "edit" && activeDemande) setDemandeMode("consult");
                    else resetDemandePane();
                    setDemandeDraft(null);
                  }}
                  onSubmit={commitDemande}
                />
              ) : null
            ) : activeDemande ? (
              <DemandeSheet
                demande={activeDemande}
                dossier={draft}
                editing={editing}
                currentUser={currentUser}
                onEdit={() => editDemande(activeDemande)}
                onDelete={() => setToDeleteDemande(activeDemande)}
                onUpdate={(next, message) => writeDemande(next, message)}
                onNotify={onNotify}
              />
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
                <Eye className="h-8 w-8 text-emerald-600" />
                <p className="mt-3 font-medium text-emerald-950">Consultation d'une demande</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-stone-600">{editing ? "Choisissez une demande dans la liste, ou créez-en une nouvelle." : "Choisissez une demande. Pour en ajouter une, ouvrez le dossier en modification."}</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {step === "versements" ? (
        <section className={`${panel} p-4 sm:p-6`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-950"><Landmark className="h-5 w-5 text-emerald-700" /> Suivi des versements</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">L'avance de {ratePercent} % est de {formatMoney(figures.avance)}. {eurosEnLettres(figures.avance)}. Le solde suit, après les pièces de l'arrêté. Le versement part vers la paierie du bénéficiaire. Un statut « Versé » inscrit la date et l'heure.</p>
            </div>
          </div>
          {editing ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field id="total" label="Montant de la subvention">
                <input id="total" type="number" min="0" step="0.01" className={line} value={draft.total || ""} onChange={(event) => {
                  const total = Number(event.target.value);
                  setDraft((current) => {
                    if (!current) return current;
                    if (!current.payments.length && total > 0) return withDemandes({ ...current, total });
                    return withComputedAmounts({ ...current, total });
                  });
                }} />
              </Field>
              <Field id="rate" label="Avance (%)">
                <input id="rate" type="number" min="0" max="100" step="0.5" className={line} value={ratePercent} onChange={(event) => patch({ advanceRate: Number(event.target.value) / 100 })} />
              </Field>
              <Field id="beneficiaire" label="Bénéficiaire"><input id="beneficiaire" className={line} value={draft.beneficiaire} onChange={(event) => patch({ beneficiaire: event.target.value })} /></Field>
              <Field id="reference" label="Référence"><input id="reference" className={line} value={draft.reference} onChange={(event) => patch({ reference: event.target.value })} /></Field>
              <div className="md:col-span-2"><Field id="objet" label="Objet"><input id="objet" className={line} value={draft.objet} onChange={(event) => patch({ objet: event.target.value })} /></Field></div>
              <Field id="payee" label="Versement à"><input id="payee" className={line} value={draft.payeeName} onChange={(event) => patch({ payeeName: event.target.value })} /></Field>
              <DateInput id="convention" label="Convention signée le" value={draft.conventionDate} onChange={(conventionDate) => patch({ conventionDate })} />
            </div>
          ) : (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-[12px] text-stone-500">Bénéficiaire</dt><dd className="mt-1 font-medium">{draft.beneficiaire || "—"}</dd></div>
              <div><dt className="text-[12px] text-stone-500">Référence</dt><dd className="mt-1 font-medium">{draft.reference || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-[12px] text-stone-500">Objet</dt><dd className="mt-1 font-medium leading-6">{draft.objet || "—"}</dd></div>
            </dl>
          )}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Stat label={`Avance ${ratePercent} %`} value={formatMoney(figures.avance)} hint={eurosEnLettres(figures.avance)} tone="emerald" />
            <Stat label="Acomptes et solde" value={formatMoney(figures.apresAvance)} hint={eurosEnLettres(figures.apresAvance)} />
            <Stat label="Montant total" value={formatMoney(figures.total)} hint={eurosEnLettres(figures.total)} tone="amber" />
          </div>
          {editing ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {(["avance", "acompte", "solde"] as PaymentKind[]).map((kind) => (
                <button key={kind} type="button" onClick={() => addPayment(kind)} className={quietBtn}>Ajouter {KIND_LABEL[kind].toLowerCase()}</button>
              ))}
            </div>
          ) : null}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-[12px] uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Versement</th>
                  <th className="px-2 py-2 font-medium">Mois</th>
                  <th className="px-2 py-2 font-medium">SF n°</th>
                  <th className="px-2 py-2 font-medium">Déjà versé</th>
                  <th className="px-2 py-2 font-medium">À payer</th>
                  <th className="px-2 py-2 font-medium">Reste</th>
                  <th className="px-2 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {draft.payments.length === 0 ? (
                  <tr><td colSpan={7} className="px-2 py-6 text-stone-500">Le suivi s'ouvre avec le montant de la subvention.</td></tr>
                ) : draft.payments.map((payment) => {
                  const statement = statementFor(withComputedAmounts(draft), payment);
                  return (
                    <tr key={payment.id} className="border-t border-emerald-50 align-top">
                      <td className="px-2 py-3 font-medium">{KIND_LABEL[payment.kind]}</td>
                      <td className="px-2 py-3">{editing ? <input aria-label={`Mois ${KIND_LABEL[payment.kind]}`} type="month" className="h-10 rounded-lg border border-emerald-200 px-2" value={payment.month} onChange={(event) => patchPayment(payment.id, { month: event.target.value })} /> : formatDay(payment.month)}</td>
                      <td className="px-2 py-3">{editing ? <input aria-label={`Service fait ${KIND_LABEL[payment.kind]}`} className="h-10 w-28 rounded-lg border border-emerald-200 px-2" value={payment.serviceFait} onChange={(event) => patchPayment(payment.id, { serviceFait: event.target.value })} /> : (payment.serviceFait || "—")}</td>
                      <td className="px-2 py-3 tabular-nums">{formatMoney(statement.previousSum)}</td>
                      <td className="px-2 py-3 tabular-nums">
                        {editing && payment.kind === "acompte" ? (
                          <input aria-label="Montant de l'acompte" type="number" min="0" step="0.01" className="h-10 w-32 rounded-lg border border-emerald-200 px-2" value={payment.amount || ""} onChange={(event) => patchPayment(payment.id, { amount: Number(event.target.value) })} />
                        ) : formatMoney(statement.due)}
                      </td>
                      <td className="px-2 py-3 tabular-nums">{formatMoney(statement.after)}</td>
                      <td className="px-2 py-3">
                        {editing ? (
                          <select aria-label={`Statut ${KIND_LABEL[payment.kind]}`} className={`${line} h-10 appearance-none pr-8`} value={payment.status} onChange={(event) => setStatus(payment, event.target.value as PaymentStatus)}>
                            <option value="prévu">Prévu</option>
                            <option value="versé">Versé</option>
                          </select>
                        ) : <StatusChip status={payment.status} />}
                        <p className="mt-1 text-[12px] text-stone-500">{payment.settledAt ? formatDateTime(payment.settledAt) : "La date s'inscrit au règlement."}</p>
                        {(() => {
                          const linked = (draft.demandes || []).find((demande) => demande.paymentId === payment.id)
                            || (draft.demandes || []).find((demande) => demande.kind === payment.kind && payment.kind !== "acompte");
                          if (linked?.paymentDecision === "oui") {
                            return <button type="button" onClick={() => downloadInvoicePdf(draft, payment, linked)} className={`${quietBtn} mt-2`}>Facture</button>;
                          }
                          if (linked?.paymentDecision === "non") return <p className="mt-1 text-[12px] text-stone-500">Paiement non déclenché.</p>;
                          return null;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <footer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={backToList} className={ghostBtn}>Retour à la liste</button>
        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setToDelete(draft)} className={dangerBtn}>Supprimer</button>
            <button type="button" onClick={save} className={primaryBtn}>Enregistrer</button>
          </div>
        ) : null}
      </footer>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce dossier ?"
        description="Les demandes et le suivi de versements seront retirés avec lui."
        confirmLabel="Supprimer"
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) removeFile(toDelete); }}
      />
      <ConfirmDialog
        open={Boolean(toDeleteDemande)}
        title="Supprimer cette demande ?"
          description={toDeleteDemande ? `« ${toDeleteDemande.label || "Cette demande"} », ${formatMoney(toDeleteDemande.amount)}, sera retirée du dossier.` : ""}
        confirmLabel="Supprimer"
        onClose={() => setToDeleteDemande(null)}
        onConfirm={() => { if (toDeleteDemande) removeDemande(toDeleteDemande); }}
      />
    </div>
  );
}

function DemandeForm({ demande, creating, directory, currentUser, onChange, onFile, onCancel, onSubmit }: {
  demande: SubsidyRequest;
  creating: boolean;
  directory: SubsidyDirectoryUser[];
  currentUser: SubsidyDirectoryUser;
  onChange: (demande: SubsidyRequest) => void;
  onFile: (file: File) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const chooseKind = (kind: PaymentKind) => {
    const hasFile = (demande.pieces || []).some((piece) => piece.files.length);
    onChange({ ...demande, kind, pieces: hasFile ? demande.pieces : piecesForKind(kind) });
  };
  return (
    <article className={`${panel} min-w-0 p-4 sm:p-6`}>
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-emerald-700">{creating ? "Création" : "Modification"}</p>
      <h2 className="mt-1 text-lg font-semibold text-emerald-950">{creating ? "Nouvelle demande" : demande.label || "Demande"}</h2>
      <div className="mt-5">
        <p className="text-[13px] font-medium text-stone-600">Type de versement</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(["avance", "acompte", "solde"] as PaymentKind[]).map((kind) => (
            <button key={kind} type="button" aria-pressed={demande.kind === kind} onClick={() => chooseKind(kind)} className={`min-h-11 rounded-xl border px-3 text-sm font-medium ${demande.kind === kind ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-950"}`}>{KIND_LABEL[kind]}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateInput id="demande-date" label="Reçue le" value={demande.receivedAt} onChange={(receivedAt) => onChange({ ...demande, receivedAt })} />
        <Field id="demande-amount" label="Somme demandée">
          <input id="demande-amount" type="number" min="0" step="0.01" className={line} value={demande.amount || ""} onChange={(event) => onChange({ ...demande, amount: Number(event.target.value) })} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="demande-label" label="Intitulé"><input id="demande-label" className={line} value={demande.label} onChange={(event) => onChange({ ...demande, label: event.target.value })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="demande-ref" label="Référence du courrier"><input id="demande-ref" className={line} value={demande.reference} onChange={(event) => onChange({ ...demande, reference: event.target.value })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="demande-note" label="Note"><textarea id="demande-note" className="min-h-20 w-full rounded-xl border border-emerald-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500" value={demande.note} onChange={(event) => onChange({ ...demande, note: event.target.value })} /></Field>
        </div>
      </div>
      {demande.amount > 0 ? <p className="mt-3 text-sm leading-6 text-emerald-950">{eurosEnLettres(demande.amount)}</p> : null}
      <PeoplePicker title="Comptabilité" hint="Ces personnes examinent les pièces et décident du paiement." people={directory} selected={demande.handlers || []} currentUser={currentUser} onChange={(handlers) => onChange({ ...demande, handlers })} />
      <PeoplePicker title="Demandeurs" hint="Ces personnes déposent les pièces du dossier." people={directory} selected={demande.providers || []} currentUser={currentUser} onChange={(providers) => onChange({ ...demande, providers })} />
      <DropZone title="Glisser le PDF de la demande" hint={demande.pdf?.name || "Le montant est lu dans le courrier"} onFile={onFile} />
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={onCancel} className={ghostBtn}>Annuler</button>
        <button type="button" onClick={onSubmit} className={primaryBtn}>{creating ? "Créer la demande" : "Enregistrer la modification"}</button>
      </div>
      {demande.pdf ? <div className="mt-4"><PdfFrame title="Demande" file={demande.pdf} empty="" /></div> : null}
    </article>
  );
}

function DemandeSheet({ demande, dossier, editing, currentUser, onEdit, onDelete, onUpdate, onNotify }: {
  demande: SubsidyRequest;
  dossier: SubsidyFile;
  editing: boolean;
  currentUser: SubsidyDirectoryUser & { role: string };
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (demande: SubsidyRequest, message: string) => void;
  onNotify: (notice: { titre: string; contenu: string; recipientEmail?: string }) => void;
}) {
  const email = currentUser.email.toLowerCase();
  const listed = (people?: SubsidyActor[]) => (people || []).some((person) => person.email.toLowerCase() === email);
  const compta = ["admin", "directeur", "chef_service"].includes(currentUser.role) || listed(demande.handlers);
  const provider = listed(demande.providers);
  const attestation = dossier.attestationStamped || dossier.attestation;
  const names = (people?: SubsidyActor[]) => (people || []).map((person) => person.name).filter(Boolean).join(", ") || "Personne désignée";
  const progress = demandeProgress(demande);
  const [pieceId, setPieceId] = useState("");
  const [pieceNote, setPieceNote] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const catalog = demande.pieces?.length ? demande.pieces : piecesForKind(demande.kind);
  const selectedPiece = catalog.find((piece) => piece.id === pieceId) || catalog.find((piece) => piece.review === "refuse" || piece.files.length === 0) || catalog[0];

  const notifyPeople = (people: SubsidyActor[] | undefined, notice: { titre: string; contenu: string }) => {
    (people || []).forEach((person) => {
      if (!person.email || person.email.toLowerCase() === email) return;
      onNotify({ ...notice, recipientEmail: person.email });
    });
  };

  const addPieceFile = async (targetId: string, file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const nextFile: SubsidyPieceFile = { id: `doc-${Date.now()}`, name: file.name, dataUrl };
    const target = catalog.find((piece) => piece.id === targetId);
    onUpdate({
      ...demande,
      pieces: catalog.map((piece) => (piece.id === targetId
        ? { ...piece, files: [...piece.files, nextFile], note: pieceNote || piece.note || "", review: "", reviewNote: "", reviewedAt: "", reviewedBy: "" }
        : piece)),
    }, `${file.name} est joint à « ${target?.label || "la pièce"} ».`);
    setPieceNote("");
    notifyPeople(demande.handlers, {
      titre: "Pièce déposée",
      contenu: `${currentUser.name || "Un demandeur"} a déposé « ${target?.label || "une pièce"} » pour « ${demande.label || "la demande"} ».`,
    });
  };

  const reviewPiece = (targetId: string, review: "accepte" | "refuse") => {
    const target = catalog.find((piece) => piece.id === targetId);
    const reviewNote = (reviewNotes[targetId] || "").trim();
    onUpdate({
      ...demande,
      pieces: catalog.map((piece) => (piece.id === targetId
        ? { ...piece, review, reviewNote, reviewedAt: new Date().toISOString(), reviewedBy: currentUser.name }
        : piece)),
    }, review === "accepte" ? `« ${target?.label || "La pièce"} » est acceptée.` : `« ${target?.label || "La pièce"} » est refusée.`);
    notifyPeople(demande.providers, {
      titre: review === "accepte" ? "Pièce acceptée" : "Pièce refusée",
      contenu: `${currentUser.name || "La comptabilité"} a ${review === "accepte" ? "accepté" : "refusé"} « ${target?.label || "une pièce"} » pour « ${demande.label || "la demande"} ».${reviewNote ? ` ${reviewNote}` : ""}`,
    });
  };

  const transmit = () => {
    const next = { ...demande, stage: "ej" as const };
    onUpdate(next, "Les pièces sont transmises à la comptabilité.");
    (demande.handlers || []).forEach((person) => onNotify({
      titre: "Pièces reçues",
      contenu: `${currentUser.name || "Le bénéficiaire"} a transmis les pièces de « ${demande.label || "la demande"} ». Le numéro EJ peut être inscrit.`,
      recipientEmail: person.email,
    }));
  };

  const signElectronically = async (signaturePng: string) => {
    if (!attestation) {
      toast.error("L'attestation n'est pas encore disponible.");
      return;
    }
    const at = formatDateTime(new Date().toISOString());
    const signed = await signSubsidyPdf(dataUrlToBytes(attestation.dataUrl), dataUrlToBytes(signaturePng), currentUser.name || "Signataire", at);
    const signedPdf = { name: attestation.name.replace(/\.pdf$/i, "") + "-signe.pdf", dataUrl: bytesToDataUrl(signed) };
    finishSignature({ ...demande, signatureImage: signaturePng, signedPdf }, "La signature électronique est posée sur l'attestation.");
  };

  const signUploaded = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    finishSignature({ ...demande, signedPdf: { name: file.name, dataUrl } }, "Le document signé est reçu.");
  };

  const finishSignature = (next: SubsidyRequest, message: string) => {
    const signed = { ...next, stage: "decision" as const, signedAt: new Date().toISOString(), signedBy: currentUser.name };
    onUpdate(signed, message);
    (demande.handlers || []).forEach((person) => onNotify({
      titre: "Document signé reçu",
      contenu: `${currentUser.name || "Le signataire"} a renvoyé « ${demande.label || "la demande"} » signée. Le paiement peut être décidé.`,
      recipientEmail: person.email,
    }));
  };

  const decide = (paymentDecision: "oui" | "non") => {
    onUpdate(
      { ...demande, paymentDecision },
      paymentDecision === "oui" ? "Le paiement est déclenché. La facture se génère dans le suivi des versements." : "Le paiement n'est pas déclenché.",
    );
  };

  return (
    <article className={`${panel} overflow-hidden`}>
      <div className="flex flex-col gap-4 border-b border-emerald-100 bg-gradient-to-br from-white to-emerald-50/60 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-emerald-700">{compta && !provider ? "Comptabilité" : provider && !compta ? "Demandeur" : compta ? "Comptabilité et demandeur" : "Consultation"} · {KIND_LABEL[demande.kind]}</p>
          <h2 className="mt-1 text-xl font-semibold text-emerald-950">{demande.label || "Demande"}</h2>
          <p className="mt-1 text-sm text-stone-600">Reçue le {formatDay(demande.receivedAt)}{demande.reference ? ` · ${demande.reference}` : ""}</p>
          <p className="mt-1 text-sm text-stone-600">Comptabilité : {names(demande.handlers)}</p>
          <p className="text-sm text-stone-600">Demandeurs : {names(demande.providers)}</p>
        </div>
        <div className="min-w-0 sm:text-right">
          <p className="text-2xl font-semibold tabular-nums text-emerald-950">{formatMoney(demande.amount)}</p>
          <p className="mt-1 text-sm text-stone-600">{progress.ready} pièce{progress.ready > 1 ? "s" : ""} sur {progress.total}</p>
        </div>
      </div>
      <div className="border-b border-emerald-100 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-emerald-950">Avancement des pièces</span>
          <span className="tabular-nums text-stone-600">{progress.percent} %</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement des pièces">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="mt-2 text-[13px] leading-5 text-stone-500">{progress.deposited} déposée{progress.deposited > 1 ? "s" : ""} · {progress.accepted} acceptée{progress.accepted > 1 ? "s" : ""}{progress.refused ? ` · ${progress.refused} refusée${progress.refused > 1 ? "s" : ""}` : ""}</p>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-sm text-stone-600">{demande.amount > 0 ? eurosEnLettres(demande.amount) : "Montant à préciser."}</p>
        {demande.note ? <p className="rounded-2xl bg-stone-50 px-3 py-3 text-sm leading-6 text-stone-700">{demande.note}</p> : null}
        <div className="flex flex-wrap gap-2">
          {editing ? <button type="button" onClick={onEdit} className={quietBtn}><Pencil className="h-4 w-4" /> Modifier</button> : null}
          {editing ? <button type="button" onClick={onDelete} className={dangerBtn}><Trash2 className="h-4 w-4" /> Supprimer</button> : null}
          {demande.pdf ? <a href={demande.pdf.dataUrl} download={demande.pdf.name} className={primaryBtn}><Download className="h-4 w-4" /> Télécharger</a> : null}
        </div>

        <section className="min-w-0 rounded-2xl border border-emerald-100 p-4">
          <h3 className="text-base font-semibold text-emerald-950">{provider && compta ? "Pièces" : provider ? "Déposer une pièce" : "Pièces du dossier"}</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">{provider && compta ? "Choisissez la pièce, déposez le fichier, puis acceptez ou refusez ce qui est reçu. Le demandeur est prévenu." : provider ? "Choisissez la pièce dans la liste, déposez le fichier, et ajoutez une note si besoin." : compta ? "Chaque pièce déposée s'accepte ou se refuse. Le demandeur est prévenu." : "Les pièces déposées et la décision de la comptabilité."}</p>
          {provider ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {catalog.map((piece) => (
                  <button key={piece.id} type="button" aria-pressed={(selectedPiece?.id || "") === piece.id} onClick={() => { setPieceId(piece.id); setPieceNote(piece.note || ""); }} className={`min-w-0 rounded-xl border px-3 py-3 text-left ${(selectedPiece?.id || "") === piece.id ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-950"}`}>
                    <span className="block text-sm font-medium">{piece.label}</span>
                    <span className={`mt-1 block text-[12px] ${(selectedPiece?.id || "") === piece.id ? "text-emerald-50" : "text-stone-500"}`}>{piece.files.length ? `${piece.files.length} fichier${piece.files.length > 1 ? "s" : ""}` : "À fournir"}{piece.review === "refuse" ? " · refusée" : ""}</span>
                  </button>
                ))}
              </div>
              <Field id="piece-note" label="Note sur la pièce">
                <textarea id="piece-note" className="min-h-20 w-full rounded-xl border border-emerald-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500" value={pieceNote} placeholder="Précision facultative" onChange={(event) => setPieceNote(event.target.value)} />
              </Field>
              <DropZone title={selectedPiece ? `Glisser « ${selectedPiece.label} »` : "Choisissez une pièce"} hint="ou choisir le fichier" onFile={(file) => { if (!selectedPiece) return; void addPieceFile(selectedPiece.id, file); }} />
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {catalog.map((piece) => (
              <article key={piece.id} className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-950">{piece.label}</p>
                    <p className="mt-1 text-[12px] text-stone-500">{piece.files.length ? `${piece.files.length} fichier${piece.files.length > 1 ? "s" : ""}` : "Pas encore déposée"}</p>
                  </div>
                  <PieceStatus review={piece.review || ""} />
                </div>
                {piece.note ? <p className="mt-2 text-sm leading-6 text-stone-700">{piece.note}</p> : null}
                <ul className="mt-2 space-y-1">
                  {piece.files.map((file) => <li key={file.id} className="min-w-0"><a href={file.dataUrl} download={file.name} className="break-all text-sm text-emerald-800 underline">{file.name}</a></li>)}
                </ul>
                {piece.review === "refuse" && piece.reviewNote ? <p className="mt-2 text-sm leading-6 text-rose-800">{piece.reviewNote}</p> : null}
                {compta && piece.files.length ? (
                  <div className="mt-3 space-y-2">
                    <Field id={`review-${piece.id}`} label="Motif, si la pièce est refusée">
                      <input id={`review-${piece.id}`} className={line} value={reviewNotes[piece.id] ?? piece.reviewNote ?? ""} onChange={(event) => setReviewNotes((current) => ({ ...current, [piece.id]: event.target.value }))} />
                    </Field>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button type="button" aria-pressed={piece.review === "accepte"} onClick={() => reviewPiece(piece.id, "accepte")} className={`min-h-11 rounded-xl border px-3 text-sm font-medium ${piece.review === "accepte" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 bg-white text-emerald-950"}`}>Accepter</button>
                      <button type="button" aria-pressed={piece.review === "refuse"} onClick={() => reviewPiece(piece.id, "refuse")} className={`min-h-11 rounded-xl border px-3 text-sm font-medium ${piece.review === "refuse" ? "border-rose-600 bg-rose-600 text-white" : "border-rose-100 bg-white text-rose-800"}`}>Refuser</button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {provider && demande.stage === "pieces" ? <button type="button" onClick={transmit} className={`${primaryBtn} mt-4 w-full sm:w-auto`}>Transmettre à la comptabilité</button> : null}
        </section>

        <section className="rounded-2xl border border-emerald-100 p-4">
          <h3 className="text-base font-semibold text-emerald-950">Attestation et signature</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">{dossier.attestationStamped ? `Le numéro ${formatEj(dossier.ej)} est dans la case EJ. Le document est à renvoyer signé.` : "La comptabilité inscrit le numéro EJ, puis l'attestation revient ici pour signature."}</p>
          {attestation ? <a href={attestation.dataUrl} download={attestation.name} className={`${quietBtn} mt-3`}><Download className="h-4 w-4" /> Télécharger l'attestation</a> : null}
          {provider && (demande.stage === "signature" || dossier.attestationStamped) && !demande.signedAt ? (
            <div className="mt-3 space-y-3">
              <FileButton label="Remettre le document signé" onFile={(file) => void signUploaded(file)} />
              <SignaturePad onSign={(image) => void signElectronically(image)} />
            </div>
          ) : null}
          {demande.signedAt ? <p className="mt-3 text-sm text-emerald-950">Signé par {demande.signedBy || "le bénéficiaire"} le {formatDateTime(demande.signedAt)}.</p> : null}
          {demande.signedPdf ? <a href={demande.signedPdf.dataUrl} download={demande.signedPdf.name} className={`${primaryBtn} mt-3`}><Download className="h-4 w-4" /> Télécharger le document signé</a> : null}
        </section>

        {compta && demande.signedAt ? (
          <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <h3 className="text-base font-semibold text-amber-950">Décision de paiement</h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">Les pièces signées sont reçues. Le paiement se déclenche, ou non. S'il est déclenché, la facture se génère dans le suivi des versements.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => decide("oui")} className={primaryBtn}>Déclencher le paiement</button>
              <button type="button" onClick={() => decide("non")} className={quietBtn}>Ne pas payer</button>
            </div>
            {demande.paymentDecision === "oui" ? <p className="mt-2 text-sm text-emerald-950">Paiement déclenché. Ouvrez Versements pour la facture.</p> : null}
            {demande.paymentDecision === "non" ? <p className="mt-2 text-sm text-stone-600">Paiement non déclenché.</p> : null}
          </section>
        ) : null}

        <PdfFrame title="Demande de paiement" file={demande.signedPdf || demande.pdf} empty="Cette demande n'a pas encore de PDF." />
      </div>
    </article>
  );
}

function PeoplePicker({ title, hint, people, selected, currentUser, onChange }: {
  title: string;
  hint: string;
  people: SubsidyDirectoryUser[];
  selected: SubsidyActor[];
  currentUser: SubsidyDirectoryUser;
  onChange: (people: SubsidyActor[]) => void;
}) {
  const [query, setQuery] = useState("");
  const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const needle = fold(query.trim());
  const visible = people.filter((person) => !needle || fold(`${person.name} ${person.email} ${person.service}`).includes(needle));
  const mine = currentUser.email ? { id: currentUser.id || currentUser.email, name: currentUser.name, email: currentUser.email } : null;
  const isOn = (person: { id: string; email: string }) => selected.some((item) => item.id === person.id || item.email.toLowerCase() === person.email.toLowerCase());
  const setPerson = (person: SubsidyActor, on: boolean) => {
    onChange(on
      ? (isOn(person) ? selected : [...selected, person])
      : selected.filter((item) => item.id !== person.id && item.email.toLowerCase() !== person.email.toLowerCase()));
  };
  return (
    <section className="mt-4 min-w-0 rounded-2xl border border-emerald-100 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-emerald-950">{title}</h3>
          <p className="mt-1 text-[13px] leading-5 text-stone-500">{hint}</p>
        </div>
        {mine ? (
          <button type="button" onClick={() => setPerson(mine, !isOn(mine))} className={`${quietBtn} w-full sm:w-auto`}>{isOn(mine) ? "Me retirer" : "Me désigner"}</button>
        ) : null}
      </div>
      {selected.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((person) => (
            <button key={person.id || person.email} type="button" onClick={() => setPerson(person, false)} className="max-w-full truncate rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-950">{person.name || person.email}</button>
          ))}
        </div>
      ) : null}
      <label className="relative mt-3 block">
        <span className="sr-only">Rechercher une personne</span>
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-emerald-700" />
        <input className={`${line} pl-9`} value={query} placeholder="Nom, service ou adresse" onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {visible.length === 0 ? <p className="px-1 py-3 text-sm text-stone-500">Aucune personne ne correspond.</p> : visible.map((person) => (
          <div key={person.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-emerald-50">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-800">{person.name}</p>
              <p className="truncate text-[12px] text-stone-500">{[person.service, person.email].filter(Boolean).join(" · ")}</p>
            </div>
            <Switch checked={isOn(person)} onCheckedChange={(on) => setPerson(person, on)} aria-label={`Désigner ${person.name}`} className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-stone-200" />
          </div>
        ))}
      </div>
    </section>
  );
}

function FileButton({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  return (
    <label className={`${quietBtn} mt-2 cursor-pointer`}>
      {label}
      <input type="file" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file); event.target.value = ""; }} />
    </label>
  );
}

function SignaturePad({ onSign }: { onSign: (png: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#14532d";
    context.lineWidth = 2.2;
    context.lineCap = "round";
  }, []);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width, y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height };
  };
  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
  };
  return (
    <div>
      <p className="text-sm text-stone-600">Ou signer électroniquement ici.</p>
      <canvas
        ref={canvasRef}
        width={520}
        height={140}
        className="mt-2 w-full max-w-xl rounded-xl border border-emerald-200 bg-white"
        onPointerDown={(event) => {
          drawing.current = true;
          const context = canvasRef.current?.getContext("2d");
          const start = point(event);
          context?.beginPath();
          context?.moveTo(start.x, start.y);
        }}
        onPointerMove={draw}
        onPointerUp={() => { drawing.current = false; }}
        onPointerLeave={() => { drawing.current = false; }}
      />
      <button type="button" className={`${primaryBtn} mt-2`} onClick={() => { const url = canvasRef.current?.toDataURL("image/png"); if (url) onSign(url); }}>Signer l'attestation</button>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Stat({ label, value, hint, tone = "stone" }: { label: string; value: string; hint?: string; tone?: "stone" | "emerald" | "amber" }) {
  const surface = tone === "emerald" ? "bg-emerald-50 text-emerald-950" : tone === "amber" ? "bg-amber-50 text-amber-950" : "bg-stone-50 text-stone-800";
  return (
    <div className={`rounded-2xl px-3 py-3 ${surface}`}>
      <p className="text-[12px] text-stone-500">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[12px] leading-5 text-stone-600">{hint}</p> : null}
    </div>
  );
}

function StatusChip({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ${status === "versé" ? "bg-emerald-100 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      {status === "versé" ? "Versé" : "Prévu"}
    </span>
  );
}

function PieceStatus({ review }: { review: string }) {
  const label = review === "accepte" ? "Acceptée" : review === "refuse" ? "Refusée" : "En attente";
  const tone = review === "accepte" ? "bg-emerald-100 text-emerald-900" : review === "refuse" ? "bg-rose-100 text-rose-800" : "bg-stone-100 text-stone-600";
  return <span className={`inline-flex h-8 w-fit items-center rounded-full px-3 text-[13px] font-medium ${tone}`}>{label}</span>;
}

function PdfFrame({ title, file, empty }: { title: string; file?: SubsidyAttachment | null; empty: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"empty" | "loading" | "ready" | "error">("empty");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    if (!file?.dataUrl) {
      setState("empty");
      setPages(0);
      return;
    }
    let cancelled = false;
    const paint = async () => {
      setState("loading");
      setPages(0);
      await import("pdfjs-dist/build/pdf.worker.min.mjs");
      const pdfjs = await import("pdfjs-dist");
      const doc = await pdfjs.getDocument({ data: dataUrlToBytes(file.dataUrl), isEvalSupported: false }).promise;
      const target = host.current;
      if (!target || cancelled) {
        await doc.destroy();
        return;
      }
      target.replaceChildren();
      const count = doc.numPages;
      const cssWidth = Math.max(280, target.clientWidth - 8);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      for (let index = 1; index <= count; index += 1) {
        if (cancelled) break;
        const page = await doc.getPage(index);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.className = "block bg-white";
        const context = canvas.getContext("2d");
        if (!context) continue;
        await page.render({ canvasContext: context, viewport }).promise;
        const sheet = document.createElement("div");
        sheet.className = "shrink-0 overflow-hidden rounded-lg bg-white shadow-sm";
        sheet.append(canvas);
        target.append(sheet);
      }
      await doc.destroy();
      if (cancelled) return;
      setPages(count);
      setState("ready");
    };
    paint().catch(() => {
      if (!cancelled) setState("error");
    });
    return () => {
      cancelled = true;
    };
  }, [file?.dataUrl]);

  return (
    <article className={`${panel} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-emerald-100 px-4 py-3">
        <p className="text-sm font-medium text-emerald-950">{title}{pages > 0 ? ` · ${pages} page${pages > 1 ? "s" : ""}` : ""}</p>
        {file ? <a href={file.dataUrl} download={file.name} className="shrink-0 text-sm font-medium text-emerald-800 hover:underline">Télécharger</a> : null}
      </div>
      <div className="bg-stone-100 p-3">
        {file ? <div ref={host} className="flex max-h-[70vh] min-h-0 flex-col gap-3 overflow-y-auto" /> : null}
        {file && state !== "ready" && state !== "error" ? <p className="px-3 py-6 text-center text-sm text-stone-600">Lecture du PDF…</p> : null}
        {state === "error" ? <p className="px-3 py-6 text-center text-sm text-stone-600">Le PDF ne s'affiche pas ici. Le lien Télécharger l'ouvre.</p> : null}
        {!file ? <p className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-stone-500">{empty}</p> : null}
      </div>
    </article>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <label htmlFor={id} className="block min-w-0 space-y-1.5">
      <span className="text-[13px] font-medium text-stone-600">{label}</span>
      {children}
    </label>
  );
}

function DateInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field id={id} label={label}>
      <span className="relative block">
        <input id={id} type="date" className={`${line} pr-10 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`} value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button" aria-label={`Ouvrir le calendrier pour ${label}`} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-emerald-800" onClick={() => {
          const input = document.getElementById(id) as HTMLInputElement | null;
          input?.showPicker?.();
          input?.focus();
        }}><Calendar className="h-4 w-4" /></button>
      </span>
    </Field>
  );
}

function DropZone({ title, hint, onFile }: { title: string; hint: string; onFile: (file: File) => void }) {
  const [over, setOver] = useState(false);
  const take = (file?: File) => { if (file) onFile(file); };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files?.[0]);
  };
  return (
    <label
      onDragOver={(event) => { event.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center ${over ? "border-emerald-500 bg-emerald-50" : "border-emerald-200 bg-emerald-50/30"}`}
    >
      <span className="text-sm font-medium text-emerald-950">{title}</span>
      <span className="mt-1 text-sm text-stone-500">{hint}</span>
      <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { take(event.target.files?.[0]); event.target.value = ""; }} />
    </label>
  );
}

function ConfirmDialog({ open, title, description, confirmLabel, onClose, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button type="button" className="rounded-xl bg-rose-600 text-white hover:bg-rose-700" onClick={onConfirm}>{confirmLabel}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
