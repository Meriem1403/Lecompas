import React, { useEffect, useMemo, useState } from 'react';
import { useLeaveGuard } from '@/app/components/leaveGuard';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  RefreshCw,
  Ban,
  MessageSquare,
  User,
  MapPin,
} from 'lucide-react';
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';
import { getRiskWorkflowStatusLabel } from '@/app/services/riskPriority';

interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  unite: string;
  service: string;
  site: string;
  situation: string;
  associatedRisk: string;
  category: string;
  responsable: string;
  severity: number;
  probability: number;
  riskLevel: number;
  existingMeasures: string[];
  moyenMaitrise: string;
  calculPriorite: number;
  prioriteFinale: number;
  plannedMeasures: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedDate?: string;
    effectiveness?: string;
  }>;
  status: 'a_traiter' | 'en_traitement' | 'maitrise' | 'supprime';
  echeance: string;
  retourAction: string;
  observation: string;
  createdAt: string;
  updatedAt: string;
}

interface ActionReturn {
  id: string;
  riskId: string;
  riskTitle: string;
  proposedBy: string;
  proposedDate: string;
  proposedMeasure: string;
  justification: string;
  status: 'pending' | 'validated_add' | 'validated_replace' | 'rejected';
  reviewedBy?: string;
  reviewedDate?: string;
  reviewComment?: string;
  targetMeasureIndex?: number;
  targetMeasureText?: string;
}

interface RetourActionViewProps {
  risk: Risk;
  user: { name: string; role: 'admin' | 'chef_service' | 'agent' };
  actionReturns: ActionReturn[];
  onBack: () => void;
  onSubmitRetourAction: (data: {
    riskId: string;
    riskTitle: string;
    proposedBy: string;
    proposedMeasure: string;
    justification: string;
  }) => void;
  onValidateRetourAction: (actionReturnId: string, action: 'add' | 'replace' | 'reject', comment: string, targetMeasureIndex?: number) => void;
  getRiskLevelColor: (level: number) => string;
  getRiskLevelLabel: (level: number) => string;
}

export function RetourActionView({
  risk,
  user,
  actionReturns,
  onBack,
  onSubmitRetourAction,
  onValidateRetourAction,
  getRiskLevelColor,
  getRiskLevelLabel
}: RetourActionViewProps) {
  const [proposedMeasure, setProposedMeasure] = useState('');
  const [justification, setJustification] = useState('');
  const [reviewComments, setReviewComments] = useState<{ [key: string]: string }>({});
  const [selectedMeasureForReplace, setSelectedMeasureForReplace] = useState<{ [key: string]: number }>({});
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = Math.max(2, DEFAULT_LIST_PAGE_SIZE - 3);

  const handleSubmit = () => {
    if (!proposedMeasure.trim() || !justification.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onSubmitRetourAction({
      riskId: risk.id,
      riskTitle: risk.title,
      proposedBy: user.name,
      proposedMeasure: proposedMeasure.trim(),
      justification: justification.trim()
    });

    setProposedMeasure('');
    setJustification('');
  };

  const handleValidate = (actionReturnId: string, action: 'add' | 'replace' | 'reject') => {
    const comment = reviewComments[actionReturnId] || '';
    const targetIndex = action === 'replace' ? selectedMeasureForReplace[actionReturnId] : undefined;

    if (action === 'replace' && targetIndex === undefined) {
      alert('Veuillez sélectionner la mesure à remplacer');
      return;
    }

    onValidateRetourAction(actionReturnId, action, comment, targetIndex);
    
    // Reset
    setReviewComments(prev => {
      const newComments = { ...prev };
      delete newComments[actionReturnId];
      return newComments;
    });
    setSelectedMeasureForReplace(prev => {
      const newSelected = { ...prev };
      delete newSelected[actionReturnId];
      return newSelected;
    });
  };

  const pendingReturns = actionReturns.filter(ar => ar.riskId === risk.id && ar.status === 'pending');
  const historyReturns = actionReturns.filter(ar => ar.riskId === risk.id && ar.status !== 'pending');
  const pendingTotalPages = Math.max(1, Math.ceil(pendingReturns.length / pageSize));
  const historyTotalPages = Math.max(1, Math.ceil(historyReturns.length / pageSize));

  const paginatedPendingReturns = useMemo(() => {
    const start = (pendingPage - 1) * pageSize;
    return pendingReturns.slice(start, start + pageSize);
  }, [pendingReturns, pendingPage, pageSize]);

  const paginatedHistoryReturns = useMemo(() => {
    const start = (historyPage - 1) * pageSize;
    return historyReturns.slice(start, start + pageSize);
  }, [historyReturns, historyPage, pageSize]);

  useEffect(() => {
    setPendingPage(1);
    setHistoryPage(1);
  }, [risk.id]);

  useEffect(() => {
    if (pendingPage > pendingTotalPages) setPendingPage(pendingTotalPages);
  }, [pendingPage, pendingTotalPages]);

  useEffect(() => {
    if (historyPage > historyTotalPages) setHistoryPage(historyTotalPages);
  }, [historyPage, historyTotalPages]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date non renseignée";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date non renseignée";
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusChip = (status: ActionReturn["status"]) => {
    if (status === "pending") {
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
          <Clock className="h-3.5 w-3.5" />
          En attente
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
          <XCircle className="h-3.5 w-3.5" />
          Refusé
        </span>
      );
    }
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
        <CheckCircle className="h-3.5 w-3.5" />
        Validé
      </span>
    );
  };

  const ficheTitle = risk.title.trim() ? risk.title : "Lié à aucun risque";
  const measures = risk.existingMeasures ?? [];
  const isProposal = user.role === "chef_service";
  useLeaveGuard(isProposal);
  const replaceDisabled = (actionReturnId: string) => {
    const selected = selectedMeasureForReplace[actionReturnId];
    return selected === undefined || selected < 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isProposal ? "Proposer un retour d'action" : "Consultation du retour d'action"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isProposal
            ? "La proposition est envoyée pour validation."
            : "Même fiche que l'évaluation et la mise à jour des risques."}
        </p>
      </div>

      <article className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
        <div className="space-y-5 p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={onBack}
              variant="outline"
              className="h-10 w-fit rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la fiche
            </Button>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-xl bg-gradient-to-r ${getRiskLevelColor(risk.riskLevel)} px-2.5 py-1 text-xs font-semibold text-white`}>
                {getRiskLevelLabel(risk.riskLevel)}
              </span>
              <span className="inline-flex items-center rounded-xl bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {getRiskWorkflowStatusLabel(risk.status)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3">
              {risk.numeroRisque ? (
                <span className="inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 px-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
                  {risk.numeroRisque}
                </span>
              ) : null}
              <div className="min-w-0">
                <h2 className="text-xl font-semibold leading-snug text-slate-900">{ficheTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{risk.service || "Service non renseigné"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Lieu</p>
                <p className="truncate text-sm font-semibold text-slate-900">{risk.site || "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
                <Calendar className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Détection</p>
                <p className="truncate text-sm font-semibold text-slate-900">{formatDate(risk.createdAt)}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                <User className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Responsable</p>
                <p className="truncate text-sm font-semibold text-slate-900">{risk.responsable || "Non renseigné"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              Description
            </p>
            <p className="text-sm leading-6 text-slate-700">{risk.situation || "Aucune description."}</p>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Mesures existantes
            </p>
            {measures.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Aucune mesure enregistrée sur cette fiche.
              </p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {measures.map((measure, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 shadow-sm">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-xs font-semibold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-6 text-slate-700">{measure}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Formulaire pour chef de service */}
      {isProposal && (
        <article className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500" />
          <div className="space-y-4 p-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Send className="h-4 w-4 text-emerald-600" />
                Proposer une mesure
              </h2>
              <p className="mt-1 text-sm text-slate-500">Elle sera examinée dans les retours d'action.</p>
            </div>
            <div>
              <label htmlFor="proposed-measure" className="mb-2 block text-sm font-semibold text-slate-800">
                Mesure proposée
              </label>
              <Textarea
                id="proposed-measure"
                value={proposedMeasure}
                onChange={(e) => setProposedMeasure(e.target.value)}
                placeholder="Décrivez la mesure de prévention"
                className="min-h-[120px] rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label htmlFor="proposed-justification" className="mb-2 block text-sm font-semibold text-slate-800">
                Justification
              </label>
              <Textarea
                id="proposed-justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Expliquez pourquoi cette mesure est nécessaire"
                className="min-h-[100px] rounded-xl border-slate-200"
              />
            </div>
            <Button
              onClick={handleSubmit}
              className="h-10 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Envoyer le retour d'action
            </Button>
          </div>
        </article>
      )}

      {user.role === "admin" && pendingReturns.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Propositions en attente</h2>
            <p className="mt-1 text-sm text-slate-500">{pendingReturns.length} à examiner sur cette fiche</p>
          </div>
          {paginatedPendingReturns.map((actionReturn) => (
            <article key={actionReturn.id} className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-amber-300 via-orange-200 to-amber-400" />
              <div className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 shadow-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                        <User className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-emerald-800/70">Auteur</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{actionReturn.proposedBy}</p>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-teal-100 bg-white px-3 py-2.5 shadow-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-teal-800/70">Date</p>
                        <p className="truncate text-sm font-semibold text-slate-900">{formatDateTime(actionReturn.proposedDate)}</p>
                      </div>
                    </div>
                  </div>
                  {statusChip(actionReturn.status)}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">Justification</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{actionReturn.justification}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-xs font-semibold text-emerald-800">Mesure proposée</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{actionReturn.proposedMeasure}</p>
                </div>

                {measures.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-800">Mesure à remplacer</p>
                    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {measures.map((measure, index) => {
                        const selected = selectedMeasureForReplace[actionReturn.id] === index;
                        return (
                          <button
                            key={index}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setSelectedMeasureForReplace((prev) => ({
                              ...prev,
                              [actionReturn.id]: prev[actionReturn.id] === index ? -1 : index,
                            }))}
                            className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left shadow-sm transition ${
                              selected
                                ? "border-orange-300 bg-orange-50"
                                : "border-slate-200 bg-white hover:border-orange-200"
                            }`}
                          >
                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                              selected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm leading-6 text-slate-700">{measure}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label htmlFor={`review-${actionReturn.id}`} className="mb-2 block text-sm font-semibold text-slate-800">
                    Commentaire
                  </label>
                  <Textarea
                    id={`review-${actionReturn.id}`}
                    value={reviewComments[actionReturn.id] || ""}
                    onChange={(e) => setReviewComments((prev) => ({
                      ...prev,
                      [actionReturn.id]: e.target.value,
                    }))}
                    placeholder="Commentaire pour la fiche"
                    className="min-h-[80px] rounded-xl border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Button
                    type="button"
                    onClick={() => handleValidate(actionReturn.id, "replace")}
                    disabled={replaceDisabled(actionReturn.id)}
                    className="h-10 w-full rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Remplacer
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleValidate(actionReturn.id, "add")}
                    className="h-10 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Compléter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleValidate(actionReturn.id, "reject")}
                    className="h-10 w-full rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Refuser
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {pendingTotalPages > 1 ? (
            <ListPaginationBar
              currentPage={pendingPage}
              totalPages={pendingTotalPages}
              totalItems={pendingReturns.length}
              onPageChange={setPendingPage}
              itemLabel="retour(s) en attente"
            />
          ) : null}
        </section>
      )}

      {historyReturns.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
          {paginatedHistoryReturns.map((actionReturn) => {
            const refused = actionReturn.status === "rejected";
            return (
              <article
                key={actionReturn.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${refused ? "border-rose-100" : "border-emerald-100"}`}
              >
                <div className={`h-1.5 ${refused ? "bg-gradient-to-r from-rose-300 to-rose-500" : "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500"}`} />
                <div className="space-y-3 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{actionReturn.proposedBy}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{formatDateTime(actionReturn.proposedDate)}</p>
                    </div>
                    {statusChip(actionReturn.status)}
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{actionReturn.proposedMeasure}</p>
                  {actionReturn.reviewedBy ? (
                    <div className={`rounded-2xl border p-3 ${refused ? "border-rose-100 bg-rose-50/70" : "border-emerald-100 bg-emerald-50/70"}`}>
                      <p className="text-sm font-semibold text-slate-900">
                        {refused ? "Refusé" : "Validé"} par {actionReturn.reviewedBy}
                        {actionReturn.reviewedDate ? ` le ${formatDateTime(actionReturn.reviewedDate)}` : ""}
                      </p>
                      {actionReturn.status === "validated_replace" && actionReturn.targetMeasureText ? (
                        <p className="mt-2 text-sm text-slate-600">
                          Mesure remplacée <span className="line-through">{actionReturn.targetMeasureText}</span>
                        </p>
                      ) : null}
                      {actionReturn.reviewComment ? (
                        <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-700">
                          <MessageSquare className="mt-1 h-3.5 w-3.5 shrink-0" />
                          {actionReturn.reviewComment}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
          {historyTotalPages > 1 ? (
            <ListPaginationBar
              currentPage={historyPage}
              totalPages={historyTotalPages}
              totalItems={historyReturns.length}
              onPageChange={setHistoryPage}
              itemLabel="retour(s) dans l'historique"
            />
          ) : null}
        </section>
      )}

      {user.role === "admin" && pendingReturns.length === 0 && historyReturns.length === 0 && (
        <Card className="border border-dashed border-slate-200 bg-white shadow-sm">
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">Aucun retour d'action sur cette fiche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
