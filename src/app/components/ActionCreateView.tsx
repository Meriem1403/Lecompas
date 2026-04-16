import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Calendar,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Save,
  Target,
  DollarSign
} from 'lucide-react';
import { Action } from './ActionsView';

export interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  unite: string;
  service: string;
  site: string;
  situation: string;
  associatedRisk: string;
  category: string;
}

interface ActionCreateViewProps {
  onSave: (action: Omit<Action, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  risks?: Risk[];
}

export function ActionCreateView({ 
  onSave, 
  onCancel,
  risks = []
}: ActionCreateViewProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    riskId: '',
    riskTitle: '',
    priority: 'Moyenne' as Action['priority'],
    status: 'À faire' as Action['status'],
    responsable: '',
    deadline: new Date().toISOString().split('T')[0],
    budget: undefined as number | undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getPriorityGradient = (priority: Action['priority']) => {
    switch (priority) {
      case 'Haute':
        return 'from-red-500 to-rose-500';
      case 'Moyenne':
        return 'from-orange-500 to-amber-500';
      case 'Faible':
        return 'from-green-500 to-emerald-500';
    }
  };

  const getStatusConfig = (status: Action['status']) => {
    switch (status) {
      case 'Terminée':
        return { icon: CheckCircle2, gradient: 'from-green-500 to-emerald-500' };
      case 'En cours':
        return { icon: Clock, gradient: 'from-blue-500 to-cyan-500' };
      case 'En retard':
        return { icon: AlertCircle, gradient: 'from-red-500 to-rose-500' };
      case 'À faire':
        return { icon: Calendar, gradient: 'from-gray-500 to-slate-500' };
    }
  };

  const StatusIcon = getStatusConfig(formData.status).icon;
  const statusGradient = getStatusConfig(formData.status).gradient;
  const priorityGradient = getPriorityGradient(formData.priority);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button 
          type="button"
          variant="ghost" 
          onClick={onCancel}
          className="hover:bg-purple-50"
        >
          ← Annuler et retour
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button 
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${statusGradient} flex items-center justify-center shadow-lg`}>
                  <StatusIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-600">Titre de l'action</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-xl font-bold mt-1"
                    placeholder="Ex: Installation de garde-corps"
                    required
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-l-4 border-blue-500">
              <Label htmlFor="description" className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Description de l'action
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-blue-200 min-h-[120px]"
                placeholder="Décrivez l'action à réaliser..."
                required
              />
            </div>

            <Separator />

            {/* Risque associé */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
              <Label htmlFor="riskSelect" className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Risque associé
              </Label>
              <Select
                value={formData.riskId}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData({ 
                      ...formData, 
                      riskId: '',
                      riskTitle: 'Aucun'
                    });
                  } else {
                    const selectedRisk = risks.find(r => r.id === value);
                    if (selectedRisk) {
                      setFormData({ 
                        ...formData, 
                        riskId: value,
                        riskTitle: `${selectedRisk.numeroRisque} - ${selectedRisk.title}`
                      });
                    }
                  }
                }}
              >
                <SelectTrigger className="bg-white border-purple-200">
                  <SelectValue placeholder="Sélectionnez un risque ou choisissez 'Aucun'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {risks.map((risk) => (
                    <SelectItem key={risk.id} value={risk.id}>
                      {risk.numeroRisque} - {risk.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.riskTitle && (
                <p className="mt-2 text-sm text-purple-700 font-medium">
                  Sélection actuelle : {formData.riskTitle}
                </p>
              )}
            </div>

            <Separator />

            {/* Responsable et Échéance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                <Label htmlFor="responsable" className="text-sm font-bold text-green-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Responsable
                </Label>
                <Input
                  id="responsable"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Nom du responsable"
                  className="bg-white border-green-200"
                  required
                />
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl">
                <Label htmlFor="deadline" className="text-sm font-bold text-orange-900 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Échéance
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-white border-orange-200"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Budget */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl">
              <Label htmlFor="budget" className="text-sm font-bold text-amber-900 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Budget alloué (optionnel)
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Montant en euros"
                className="bg-white border-amber-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Action['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À faire">À faire</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Terminée">Terminée</SelectItem>
                  <SelectItem value="En retard">En retard</SelectItem>
                </SelectContent>
              </Select>
              
              <div className={`text-center p-4 rounded-xl bg-gradient-to-br ${statusGradient}`}>
                <StatusIcon className="h-8 w-8 mx-auto mb-2 text-white" />
                <p className="font-bold text-lg capitalize text-white">
                  {formData.status}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Priorité Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                Priorité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Action['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Haute">Haute</SelectItem>
                  <SelectItem value="Moyenne">Moyenne</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                </SelectContent>
              </Select>
              
              <div className={`text-center p-4 rounded-xl bg-gradient-to-br ${priorityGradient} text-white border-2`}>
                <p className="font-bold text-lg">
                  Priorité {formData.priority}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">Nouvelle action</p>
                <p className="text-xs text-gray-600">
                  Cette action sera ajoutée au plan de prévention
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}