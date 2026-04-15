import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeftRight, Plus, Send } from 'lucide-react';
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

interface Risk {
  id: string;
  title: string;
  existingMeasures: string[];
}

interface ActionReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: Risk;
  currentUser: { name: string; role: string };
  onSubmit: (actionReturn: Omit<ActionReturn, 'id' | 'proposedDate' | 'status'>) => void;
}

export function ActionReturnDialog({ open, onOpenChange, risk, currentUser, onSubmit }: ActionReturnDialogProps) {
  const [type, setType] = useState<'add' | 'replace'>('add');
  const [newMeasure, setNewMeasure] = useState('');
  const [reason, setReason] = useState('');
  const [targetMeasureIndex, setTargetMeasureIndex] = useState<number | undefined>();

  const handleSubmit = () => {
    if (!newMeasure.trim()) {
      toast.error('Veuillez saisir la nouvelle mesure');
      return;
    }
    if (!reason.trim()) {
      toast.error('Veuillez saisir la raison du retour d\'action');
      return;
    }
    if (type === 'replace' && targetMeasureIndex === undefined) {
      toast.error('Veuillez sélectionner la mesure à remplacer');
      return;
    }

    onSubmit({
      riskId: risk.id,
      riskTitle: risk.title,
      proposedBy: currentUser.name,
      type,
      newMeasure: newMeasure.trim(),
      targetMeasureIndex: type === 'replace' ? targetMeasureIndex : undefined,
      targetMeasureText: type === 'replace' && targetMeasureIndex !== undefined ? risk.existingMeasures[targetMeasureIndex] : undefined,
      reason: reason.trim()
    });

    // Reset
    setType('add');
    setNewMeasure('');
    setReason('');
    setTargetMeasureIndex(undefined);
    onOpenChange(false);
    
    toast.success('Retour d\'action soumis', {
      description: 'L\'administrateur sera notifié pour validation'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <Send className="h-6 w-6 text-emerald-600" />
            Proposer un Retour d'Action
          </DialogTitle>
          <DialogDescription>
            Proposez une nouvelle mesure de prévention pour le risque : <strong>{risk.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type de retour */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type d'action</Label>
            <RadioGroup value={type} onValueChange={(value: 'add' | 'replace') => setType(value)} className="space-y-3">
              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors">
                <RadioGroupItem value="add" id="add" className="mt-1" />
                <label htmlFor="add" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <Plus className="h-4 w-4" />
                    Ajouter une nouvelle mesure
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    La mesure proposée sera ajoutée aux mesures existantes
                  </p>
                </label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors">
                <RadioGroupItem value="replace" id="replace" className="mt-1" />
                <label htmlFor="replace" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-semibold text-orange-700">
                    <ArrowLeftRight className="h-4 w-4" />
                    Remplacer une mesure existante
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    La mesure proposée remplacera une mesure existante
                  </p>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Si remplacement, sélection de la mesure à remplacer */}
          {type === 'replace' && (
            <div className="space-y-2">
              <Label htmlFor="targetMeasure" className="text-base font-semibold">
                Mesure à remplacer *
              </Label>
              <Select 
                value={targetMeasureIndex?.toString()} 
                onValueChange={(value) => setTargetMeasureIndex(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la mesure à remplacer" />
                </SelectTrigger>
                <SelectContent>
                  {risk.existingMeasures.map((measure, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {measure}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nouvelle mesure proposée */}
          <div className="space-y-2">
            <Label htmlFor="newMeasure" className="text-base font-semibold">
              Nouvelle mesure proposée *
            </Label>
            <Textarea
              id="newMeasure"
              value={newMeasure}
              onChange={(e) => setNewMeasure(e.target.value)}
              placeholder="Décrivez la mesure de prévention que vous proposez..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Raison du retour d'action */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base font-semibold">
              Justification / Contexte *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi cette mesure devrait être mise en place..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Aperçu */}
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Aperçu</h4>
            {type === 'add' ? (
              <p className="text-sm text-gray-600">
                ➕ La mesure sera <strong className="text-emerald-600">ajoutée</strong> aux {risk.existingMeasures.length} mesure(s) existante(s)
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                🔄 La mesure sélectionnée sera <strong className="text-orange-600">remplacée</strong> par votre proposition
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Send className="h-4 w-4 mr-2" />
            Soumettre le retour d'action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}