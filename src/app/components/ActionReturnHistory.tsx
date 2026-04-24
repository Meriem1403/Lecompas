import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Clock, User, Calendar, MessageSquare, ArrowLeftRight, Plus, Eye } from 'lucide-react';
import { ListPaginationBar } from './ui/list-pagination-bar';

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

interface ActionReturnHistoryProps {
  actionReturns: ActionReturn[];
  onManageActionReturns?: () => void;
  userRole?: string;
}

export function ActionReturnHistory({ actionReturns, onManageActionReturns, userRole }: ActionReturnHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 2;

  const totalPages = Math.max(1, Math.ceil(actionReturns.length / pageSize));
  const paginatedActionReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return actionReturns.slice(start, start + pageSize);
  }, [actionReturns, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
  
  const getTypeBadge = (status: ActionReturn['status']) => {
    if (status === 'validated_add') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
          <Plus className="h-3 w-3 mr-1" />
          Ajout
        </Badge>
      );
    } else if (status === 'validated_replace') {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
          <ArrowLeftRight className="h-3 w-3 mr-1" />
          Remplacement
        </Badge>
      );
    }
    return null;
  };

  if (actionReturns.length === 0) {
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            Historique des retours d'action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8 italic">
            Aucun retour d'action enregistré pour ce risque
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = actionReturns.filter(ar => ar.status === 'pending').length;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Historique des retours d'action ({actionReturns.length})
          </CardTitle>
          {userRole === 'admin' && pendingCount > 0 && onManageActionReturns && (
            <Button
              size="sm"
              onClick={onManageActionReturns}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              <Eye className="h-4 w-4 mr-1" />
              Gérer ({pendingCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/70">
          <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
            Navigation des retours
          </p>
          <ListPaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={actionReturns.length}
            onPageChange={setCurrentPage}
            itemLabel="retour(s) d'action"
          />
        </div>
        <div className="space-y-4">
            {paginatedActionReturns.map((actionReturn) => (
              <Card 
                key={actionReturn.id} 
                className={`border-2 ${
                  actionReturn.status === 'pending' 
                    ? 'border-amber-300 bg-amber-50' 
                    : actionReturn.status === 'validated_add' || actionReturn.status === 'validated_replace'
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* En-tête */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(actionReturn.status)}
                      {getTypeBadge(actionReturn.status)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(actionReturn.proposedDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Proposé par */}
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Proposé par: <strong className="text-gray-800">{actionReturn.proposedBy}</strong>
                    </span>
                  </div>

                  {/* Justification */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Justification:</p>
                    <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                      {actionReturn.justification}
                    </p>
                  </div>

                  {/* Mesure à remplacer (si remplacement) */}
                  {actionReturn.status === 'validated_replace' && actionReturn.targetMeasureText && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-red-600">Mesure remplacée:</p>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border line-through">
                        {actionReturn.targetMeasureText}
                      </p>
                    </div>
                  )}

                  {/* Nouvelle mesure */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-emerald-600">
                      {actionReturn.status === 'validated_add' ? 'Mesure ajoutée:' : 'Mesure proposée:'}
                    </p>
                    <p className="text-sm text-gray-800 font-semibold bg-white p-2 rounded border-2 border-emerald-300">
                      {actionReturn.proposedMeasure}
                    </p>
                  </div>

                  {/* Validation / Refus */}
                  {actionReturn.status !== 'pending' && (
                    <div className={`p-3 rounded-lg border-2 ${
                      actionReturn.status === 'validated_add' || actionReturn.status === 'validated_replace'
                        ? 'bg-green-100 border-green-300' 
                        : 'bg-red-100 border-red-300'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {actionReturn.status === 'validated_add' || actionReturn.status === 'validated_replace' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-semibold text-gray-800">
                          {actionReturn.status === 'validated_add' || actionReturn.status === 'validated_replace' ? 'Validé' : 'Refusé'} par {actionReturn.reviewedBy}
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
                      {actionReturn.reviewComment && (
                        <div className="text-sm text-gray-700 bg-white/50 p-2 rounded">
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
        <div className="mt-4 p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/70">
          <ListPaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={actionReturns.length}
            onPageChange={setCurrentPage}
            itemLabel="retour(s) d'action"
          />
        </div>
      </CardContent>
    </Card>
  );
}