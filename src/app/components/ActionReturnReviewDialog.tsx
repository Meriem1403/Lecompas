import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import { CheckCircle, XCircle, ArrowLeftRight, AlertCircle, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ActionReturn {
  id: string;
  riskId: string;
  riskTitle: string;
  proposedBy: string;
  proposedDate: string;
  type: 'add' | 'replace';
  newMeasure: string;
  targetMeasureIndex?: number;
  targetMeasureText?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedDate?: string;
  reviewComment?: string;
  reason: string;
}

interface ActionReturnReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionReturn: ActionReturn;
  currentUser: { name: string };
  onApprove: (actionReturnId: string, comment?: string) => void;
  onReject: (actionReturnId: string, comment: string) => void;
}

export function ActionReturnReviewDialog({ 
  open, 
  onOpenChange, 
  actionReturn, 
  currentUser,
  onApprove, 
  onReject 
}: ActionReturnReviewDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    if (action === 'reject' && !comment.trim()) {
      toast.error('Veuillez saisir un commentaire pour le refus');
      return;
    }

    if (action === 'approve') {
      onApprove(actionReturn.id, comment.trim() || undefined);
      toast.success('Retour d\'action approuvé', {
        description: 'La mesure a été ajoutée/remplacée avec succès'
      });
    } else if (action === 'reject') {
      onReject(actionReturn.id, comment.trim());
      toast.success('Retour d\'action refusé', {
        description: 'Le chef de service sera notifié'
      });
    }

    // Reset
    setAction(null);
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-purple-600" />
            Validation du Retour d'Action
          </DialogTitle>
          <DialogDescription>
            Examinez et validez ou refusez la proposition de retour d'action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations générales */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-blue-900">{actionReturn.riskTitle}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Proposé par: <strong>{actionReturn.proposedBy}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(actionReturn.proposedDate).toLocaleDateString('fr-FR', { 
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
                <Badge className={`${
                  actionReturn.type === 'add' 
                    ? 'bg-emerald-500' 
                    : 'bg-orange-500'
                } text-white`}>
                  {actionReturn.type === 'add' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ajout
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      Remplacement
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Justification */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-gray-700">Justification / Contexte</Label>
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <p className="text-gray-800">{actionReturn.reason}</p>
            </div>
          </div>

          {/* Mesure à remplacer (si remplacement) */}
          {actionReturn.type === 'replace' && actionReturn.targetMeasureText && (
            <div className="space-y-2">
              <Label className="text-base font-semibold text-red-700">Mesure actuelle (à remplacer)</Label>
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                <p className="text-gray-800 line-through">{actionReturn.targetMeasureText}</p>
              </div>
            </div>
          )}

          {/* Nouvelle mesure proposée */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-emerald-700">
              {actionReturn.type === 'add' ? 'Nouvelle mesure à ajouter' : 'Nouvelle mesure de remplacement'}
            </Label>
            <div className="p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300">
              <p className="text-gray-800 font-semibold">{actionReturn.newMeasure}</p>
            </div>
          </div>

          {/* Actions de décision */}
          {!action && (
            <div className="space-y-3 pt-4">
              <Label className="text-base font-semibold text-gray-700">Votre décision</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setAction('approve')}
                  className="h-auto py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 flex-col items-center gap-2"
                >
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-bold">Approuver</span>
                  <span className="text-xs font-normal opacity-90">
                    {actionReturn.type === 'add' ? 'Ajouter la mesure' : 'Remplacer la mesure'}
                  </span>
                </Button>

                <Button
                  onClick={() => setAction('reject')}
                  variant="destructive"
                  className="h-auto py-4 flex-col items-center gap-2"
                >
                  <XCircle className="h-6 w-6" />
                  <span className="font-bold">Refuser</span>
                  <span className="text-xs font-normal opacity-90">
                    Rejeter la proposition
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Commentaire */}
          {action && (
            <div className="space-y-2 pt-4 border-t-2">
              <Label htmlFor="comment" className="text-base font-semibold">
                Commentaire {action === 'reject' && '(obligatoire pour un refus)'}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  action === 'approve' 
                    ? "Ajoutez un commentaire optionnel..." 
                    : "Expliquez la raison du refus..."
                }
                className="min-h-[100px] resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {action ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAction(null);
                  setComment('');
                }}
              >
                Retour
              </Button>
              <Button 
                onClick={handleConfirm}
                className={action === 'approve' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                  : 'bg-red-600 hover:bg-red-700'
                }
              >
                {action === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer l'approbation
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmer le refus
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}