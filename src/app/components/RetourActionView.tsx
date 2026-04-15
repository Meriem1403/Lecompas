import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle2,
  RefreshCw,
  Ban,
  MessageSquare,
  Check
} from 'lucide-react';

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
  status: 'identifié' | 'en_cours' | 'traité';
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

  const getStatusBadge = (status: ActionReturn['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'validated_add':
      case 'validated_replace':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Retours d'action
        </h1>
        <div className="w-24"></div>
      </div>

      {/* Informations sur le risque */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{risk.title}</CardTitle>
              <CardDescription className="text-base">{risk.site}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`bg-gradient-to-r ${getRiskLevelColor(risk.riskLevel)} text-white border-0 shadow-md text-lg px-4 py-1`}>
                {getRiskLevelLabel(risk.riskLevel)}
              </Badge>
              <Badge variant="outline" className="text-sm flex items-center gap-1">
                {risk.status === 'identifié' ? (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Identifié
                  </>
                ) : risk.status === 'en_cours' ? (
                  <>
                    <Clock className="h-3 w-3" />
                    Surveillé
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Traité
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{risk.situation}</p>
          </div>
          
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">Date de détection</p>
              <p className="text-sm font-bold text-gray-800">
                {new Date(risk.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Responsable</p>
              <p className="text-sm font-bold text-gray-800">{risk.responsable}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Mesures existantes
            </h4>
            <div className="space-y-2">
              {risk.existingMeasures.map((measure, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-white rounded-lg border">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{measure}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire pour chef de service */}
      {user.role === 'chef_service' && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Proposer une nouvelle mesure
            </CardTitle>
            <CardDescription>
              Proposez une mesure de prévention supplémentaire pour ce risque
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mesure proposée <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={proposedMeasure}
                onChange={(e) => setProposedMeasure(e.target.value)}
                placeholder="Décrivez la mesure de prévention que vous proposez..."
                className="min-h-[120px]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Justification <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Expliquez pourquoi cette mesure est nécessaire..."
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer le retour d'action
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section validation pour admin */}
      {user.role === 'admin' && pendingReturns.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              Retours d'action en attente de validation ({pendingReturns.length})
            </CardTitle>
            <CardDescription>
              Validez, complétez ou refusez les propositions des chefs de service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[800px] pr-4">
              <div className="space-y-6">
                {pendingReturns.map((actionReturn) => (
                  <Card key={actionReturn.id} className="border-2 border-amber-300 bg-white">
                    <CardContent className="pt-6 space-y-4">
                      {/* En-tête */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {actionReturn.proposedBy.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{actionReturn.proposedBy}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(actionReturn.proposedDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(actionReturn.status)}
                      </div>

                      <Separator />

                      {/* Justification */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600">Justification :</p>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm text-gray-700">{actionReturn.justification}</p>
                        </div>
                      </div>

                      {/* Mesure proposée */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emerald-600">Mesure proposée :</p>
                        <div className="p-3 bg-emerald-50 rounded-lg border-2 border-emerald-300">
                          <p className="text-sm font-bold text-gray-800">{actionReturn.proposedMeasure}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Zone de sélection pour remplacement */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600">
                          Sélectionnez la mesure à remplacer (optionnel) :
                        </p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {risk.existingMeasures.map((measure, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedMeasureForReplace(prev => ({
                                ...prev,
                                [actionReturn.id]: prev[actionReturn.id] === idx ? -1 : idx
                              }))}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedMeasureForReplace[actionReturn.id] === idx
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  checked={selectedMeasureForReplace[actionReturn.id] === idx}
                                  onChange={() => {}}
                                  className="mt-1"
                                />
                                <span className="text-sm text-gray-700">{measure}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Commentaire admin */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600">
                          Commentaire (optionnel) :
                        </label>
                        <Textarea
                          value={reviewComments[actionReturn.id] || ''}
                          onChange={(e) => setReviewComments(prev => ({
                            ...prev,
                            [actionReturn.id]: e.target.value
                          }))}
                          placeholder="Ajoutez un commentaire si nécessaire..."
                          className="min-h-[80px]"
                        />
                      </div>

                      {/* Boutons d'action */}
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <Button
                          onClick={() => handleValidate(actionReturn.id, 'replace')}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold"
                          disabled={selectedMeasureForReplace[actionReturn.id] === undefined || selectedMeasureForReplace[actionReturn.id] === -1}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Remplacer la mesure
                        </Button>
                        <Button
                          onClick={() => handleValidate(actionReturn.id, 'add')}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Compléter la mesure
                        </Button>
                        <Button
                          onClick={() => handleValidate(actionReturn.id, 'reject')}
                          variant="destructive"
                          className="font-bold"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Refuser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Historique */}
      {historyReturns.length > 0 && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Historique des retours d'action ({historyReturns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-4">
                {historyReturns.map((actionReturn) => (
                  <Card
                    key={actionReturn.id}
                    className={`border-2 ${
                      actionReturn.status === 'rejected'
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <CardContent className="pt-4 space-y-3">
                      {/* En-tête */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {actionReturn.proposedBy.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{actionReturn.proposedBy}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(actionReturn.proposedDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(actionReturn.status)}
                      </div>

                      {/* Mesure proposée */}
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-sm text-gray-700">{actionReturn.proposedMeasure}</p>
                      </div>

                      {/* Validation */}
                      {actionReturn.reviewedBy && (
                        <div className={`p-3 rounded-lg border ${
                          actionReturn.status === 'rejected' 
                            ? 'bg-red-100 border-red-300' 
                            : 'bg-green-100 border-green-300'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {actionReturn.status === 'rejected' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm font-semibold">
                              {actionReturn.status === 'rejected' ? 'Refusé' : 'Validé'} par {actionReturn.reviewedBy}
                            </span>
                            {actionReturn.reviewedDate && (
                              <span className="text-xs text-gray-500 ml-auto">
                                le {new Date(actionReturn.reviewedDate).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                          {actionReturn.status === 'validated_replace' && actionReturn.targetMeasureText && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-semibold">Mesure remplacée : </span>
                              <span className="line-through">{actionReturn.targetMeasureText}</span>
                            </div>
                          )}
                          {actionReturn.reviewComment && (
                            <div className="mt-2 text-sm text-gray-700 bg-white/50 p-2 rounded">
                              <MessageSquare className="h-3 w-3 inline mr-1" />
                              {actionReturn.reviewComment}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun retour */}
      {user.role === 'admin' && pendingReturns.length === 0 && historyReturns.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 italic">Aucun retour d'action enregistré pour ce risque</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
