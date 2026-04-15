import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { PlusCircle, X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Accident {
  id: string;
  date: string;
  title: string;
  description: string;
  severity: 'bénin' | 'modéré' | 'grave' | 'très_grave';
  type: 'travail' | 'trajet' | 'maladie_pro';
  victim: string;
  location: string;
  witnesses: string[];
  measures: string;
  createdAt: string;
}

interface AccidentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accident: Accident | null;
  onSave: (accident: Omit<Accident, 'id' | 'createdAt'> & { id?: string }) => void;
}

export function AccidentFormDialog({ open, onOpenChange, accident, onSave }: AccidentFormDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    severity: 'bénin' as 'bénin' | 'modéré' | 'grave' | 'très_grave',
    type: 'travail' as 'travail' | 'trajet' | 'maladie_pro',
    victim: '',
    location: '',
    witnesses: [''],
    measures: ''
  });

  useEffect(() => {
    if (accident) {
      setFormData({
        date: accident.date,
        title: accident.title,
        description: accident.description,
        severity: accident.severity,
        type: accident.type,
        victim: accident.victim,
        location: accident.location,
        witnesses: accident.witnesses.length > 0 ? accident.witnesses : [''],
        measures: accident.measures
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        severity: 'bénin',
        type: 'travail',
        victim: '',
        location: '',
        witnesses: [''],
        measures: ''
      });
    }
  }, [accident, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.victim || !formData.location) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const accidentData = {
      ...(accident && { id: accident.id }),
      date: formData.date,
      title: formData.title,
      description: formData.description,
      severity: formData.severity,
      type: formData.type,
      victim: formData.victim,
      location: formData.location,
      witnesses: formData.witnesses.filter(w => w.trim() !== ''),
      measures: formData.measures
    };

    onSave(accidentData);
    onOpenChange(false);
    toast.success(accident ? 'Accident modifié avec succès ✅' : 'Accident déclaré avec succès ✅');
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, '']
    }));
  };

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index)
    }));
  };

  const updateWitness = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.map((w, i) => i === index ? value : w)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            {accident ? '✏️ Modifier l\'Accident' : '🚨 Déclarer un Accident'}
          </DialogTitle>
          <DialogDescription>
            Renseignez tous les détails de l'accident pour la déclaration officielle
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Informations générales */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-red-700">📋 Informations Générales</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date de l'accident *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type d'accident *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travail">🏢 Accident du travail</SelectItem>
                      <SelectItem value="trajet">🚗 Accident de trajet</SelectItem>
                      <SelectItem value="maladie_pro">🏥 Maladie professionnelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'accident *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Chute dans escalier - blessure cheville"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Gravité *</Label>
                <Select value={formData.severity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bénin">🟢 Bénin</SelectItem>
                    <SelectItem value="modéré">🟡 Modéré</SelectItem>
                    <SelectItem value="grave">🟠 Grave</SelectItem>
                    <SelectItem value="très_grave">🔴 Très grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Description */}
            <div className="space-y-4 bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl">
              <h3 className="font-bold text-lg text-orange-700">📝 Description des Faits</h3>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez précisément les circonstances de l'accident..."
                  rows={4}
                  required
                />
              </div>
            </div>

            {/* Section Victime et Lieu */}
            <div className="space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
              <h3 className="font-bold text-lg text-purple-700">👤 Victime et Localisation</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="victim">Nom de la victime *</Label>
                  <Input
                    id="victim"
                    value={formData.victim}
                    onChange={(e) => setFormData(prev => ({ ...prev, victim: e.target.value }))}
                    placeholder="Prénom Nom"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu de l'accident *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Escalier principal, 2ème étage"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Témoins */}
            <div className="space-y-4 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-amber-700">👥 Témoins Présents</h3>
                <Button type="button" size="sm" onClick={addWitness} className="bg-gradient-to-r from-amber-500 to-orange-500">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {formData.witnesses.map((witness, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={witness}
                    onChange={(e) => updateWitness(index, e.target.value)}
                    placeholder="Nom du témoin"
                  />
                  {formData.witnesses.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeWitness(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Section Mesures */}
            <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
              <h3 className="font-bold text-lg text-green-700">✅ Mesures Prises et Suivi</h3>
              
              <div className="space-y-2">
                <Label htmlFor="measures">Mesures prises *</Label>
                <Textarea
                  id="measures"
                  value={formData.measures}
                  onChange={(e) => setFormData(prev => ({ ...prev, measures: e.target.value }))}
                  placeholder="Décrivez les mesures prises suite à l'accident (soins, arrêt de travail, actions correctives...)"
                  rows={4}
                  required
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-red-600 to-orange-600">
            <Save className="h-4 w-4 mr-2" />
            {accident ? 'Enregistrer' : 'Déclarer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
