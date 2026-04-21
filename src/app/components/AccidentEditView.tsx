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
  Activity,
  MapPin,
  AlertCircle,
  AlertTriangle,
  Calendar,
  User,
  Users,
  Check,
  X,
  Save,
  PlusCircle,
  Trash2
} from 'lucide-react';

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

interface AccidentEditViewProps {
  accident: Accident;
  onSave: (accident: Accident) => void;
  onCancel: () => void;
}

export function AccidentEditView({ 
  accident, 
  onSave, 
  onCancel
}: AccidentEditViewProps) {
  const [formData, setFormData] = useState<Accident>(accident);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addWitness = () => {
    setFormData({
      ...formData,
      witnesses: [...(formData.witnesses || []), '']
    });
  };

  const updateWitness = (index: number, value: string) => {
    const newWitnesses = [...(formData.witnesses || [])];
    newWitnesses[index] = value;
    setFormData({ ...formData, witnesses: newWitnesses });
  };

  const removeWitness = (index: number) => {
    setFormData({
      ...formData,
      witnesses: formData.witnesses.filter((_, i) => i !== index)
    });
  };

  const getSeverityGradient = (severity: string) => {
    switch (severity) {
      case 'très_grave':
        return 'from-red-500 to-rose-600';
      case 'grave':
        return 'from-orange-500 to-red-500';
      case 'modéré':
        return 'from-yellow-400 to-orange-400';
      default:
        return 'from-green-400 to-emerald-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'travail':
        return Activity;
      case 'trajet':
        return MapPin;
      default:
        return AlertCircle;
    }
  };

  const TypeIcon = getTypeIcon(formData.type);
  const severityGradient = getSeverityGradient(formData.severity);

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
        <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
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
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${severityGradient} flex items-center justify-center shadow-lg`}>
                  <TypeIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-600">Titre de l'accident</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-xl font-bold mt-1"
                    required
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date et Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                  Date de l'accident
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type" className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-500" />
                  Type d'accident
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travail">Travail</SelectItem>
                    <SelectItem value="trajet">Trajet</SelectItem>
                    <SelectItem value="maladie_pro">Maladie professionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Victime et Lieu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
                <Label htmlFor="victim" className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Victime
                </Label>
                <Input
                  id="victim"
                  value={formData.victim}
                  onChange={(e) => setFormData({ ...formData, victim: e.target.value })}
                  placeholder="Nom de la victime"
                  className="bg-white border-purple-200"
                  required
                />
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                <Label htmlFor="location" className="text-sm font-bold text-blue-900 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Lieu
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Lieu de l'accident"
                  className="bg-white border-blue-200"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-xl border-l-4 border-orange-500">
              <Label htmlFor="description" className="text-sm font-bold text-orange-900 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Description des faits
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-orange-200 min-h-[120px]"
                placeholder="Décrivez les circonstances de l'accident..."
                required
              />
            </div>

            <Separator />

            {/* Témoins */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                <Label className="text-sm font-bold text-amber-900 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Témoins présents
                </Label>
                <Button 
                  type="button"
                  size="sm"
                  onClick={addWitness}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {formData.witnesses && formData.witnesses.length > 0 ? (
                  formData.witnesses.map((witness, idx) => (
                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        {idx + 1}
                      </Badge>
                      <Input
                        value={witness}
                        onChange={(e) => updateWitness(idx, e.target.value)}
                        placeholder="Nom du témoin..."
                        className="flex-1 bg-white border-amber-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeWitness(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-amber-700 italic text-sm">Aucun témoin. Cliquez sur "Ajouter" pour en créer un.</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Mesures prises */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
              <Label htmlFor="measures" className="text-sm font-bold text-green-900 mb-3 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Mesures prises et suivi
              </Label>
              <Textarea
                id="measures"
                value={formData.measures}
                onChange={(e) => setFormData({ ...formData, measures: e.target.value })}
                className="bg-white border-green-200 min-h-[100px]"
                placeholder="Décrivez les mesures prises suite à l'accident..."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Severity */}
        <div className="space-y-6">
          {/* Severity Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Gravité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bénin">Bénin</SelectItem>
                  <SelectItem value="modéré">Modéré</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="très_grave">Très grave</SelectItem>
                </SelectContent>
              </Select>
              
              <div className={`text-center p-4 rounded-xl bg-gradient-to-br ${severityGradient} bg-opacity-10 border-2`}>
                <p className="text-gray-600 text-xs font-semibold mb-1">Niveau de gravité sélectionné</p>
                <p className="font-bold text-2xl capitalize">
                  {formData.severity.replace('_', ' ')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-bold mb-2">Informations importantes</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Vérifiez tous les champs</li>
                    <li>• Ajoutez les témoins si présents</li>
                    <li>• Décrivez les mesures prises</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
