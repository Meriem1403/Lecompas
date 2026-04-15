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
  FileText,
  X,
  Save,
  Upload,
  Tag as TagIcon,
  PlusCircle,
  Trash2,
  User,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Document } from './DocumentsView';

interface DocumentEditViewProps {
  document: Document;
  onSave: (document: Document) => void;
  onCancel: () => void;
}

export function DocumentEditView({ 
  document,
  onSave, 
  onCancel
}: DocumentEditViewProps) {
  const [formData, setFormData] = useState<Document>(document);
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((_, i) => i !== index)
    });
  };

  const getTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'DUERP':
        return 'from-purple-500 to-indigo-500';
      case 'Registre':
        return 'from-blue-500 to-cyan-500';
      case 'Procédure':
        return 'from-green-500 to-emerald-500';
      case 'Compte-rendu':
        return 'from-orange-500 to-amber-500';
      case 'Audit':
        return 'from-red-500 to-rose-500';
      case 'Formation':
        return 'from-pink-500 to-fuchsia-500';
    }
  };

  const typeGradient = getTypeColor(formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          type="button"
          variant="ghost" 
          onClick={onCancel}
          className="hover:bg-purple-50"
        >
          ← Annuler et retour
        </Button>
        <div className="flex space-x-2">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button 
            type="submit"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
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
              <div className="flex items-center space-x-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${typeGradient} flex items-center justify-center shadow-lg`}>
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-600">Titre du document</Label>
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
            {/* Description */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-l-4 border-blue-500">
              <Label htmlFor="description" className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Description du document
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-blue-200 min-h-[120px]"
                placeholder="Décrivez le contenu et l'objectif du document..."
                required
              />
            </div>

            <Separator />

            {/* Version */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl">
              <Label htmlFor="version" className="text-sm font-bold text-purple-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Version
              </Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="Ex: 1.0"
                className="bg-white border-purple-200"
                required
              />
            </div>

            <Separator />

            {/* Validation info (si le statut est validé) */}
            {formData.status === 'Validé' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                    <Label htmlFor="validatedBy" className="text-sm font-bold text-green-900 mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Validé par
                    </Label>
                    <Input
                      id="validatedBy"
                      value={formData.validatedBy || ''}
                      onChange={(e) => setFormData({ ...formData, validatedBy: e.target.value })}
                      placeholder="Nom du validateur"
                      className="bg-white border-green-200"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                    <Label htmlFor="validatedAt" className="text-sm font-bold text-green-900 mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Date de validation
                    </Label>
                    <Input
                      id="validatedAt"
                      type="date"
                      value={formData.validatedAt || ''}
                      onChange={(e) => setFormData({ ...formData, validatedAt: e.target.value })}
                      className="bg-white border-green-200"
                    />
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Upload fichier */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border-l-4 border-orange-500">
              <Label className="text-sm font-bold text-orange-900 mb-3 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Fichier
              </Label>
              <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center bg-white">
                <Upload className="h-12 w-12 mx-auto text-orange-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Cliquez pour charger un nouveau fichier</p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX jusqu'à 10 MB</p>
                <Input
                  type="file"
                  className="hidden"
                  id="fileUpload"
                  accept=".pdf,.doc,.docx"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => window.document.getElementById('fileUpload')?.click()}
                >
                  Parcourir
                </Button>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div className="bg-gradient-to-br from-pink-50 to-fuchsia-50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-bold text-pink-900 flex items-center">
                  <TagIcon className="h-4 w-4 mr-2" />
                  Étiquettes
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter une étiquette..."
                  className="flex-1 bg-white border-pink-200"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button 
                  type="button"
                  size="sm"
                  onClick={addTag}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags && formData.tags.length > 0 ? (
                  formData.tags.map((tag, idx) => (
                    <Badge key={idx} className="bg-pink-100 text-pink-800 border-pink-300 pr-1">
                      {tag}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTag(idx)}
                        className="h-4 w-4 p-0 ml-1 hover:bg-pink-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-pink-700 italic text-sm">Aucune étiquette. Ajoutez-en pour faciliter la recherche.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Type Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-500" />
                Type de document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as Document['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DUERP">DUERP</SelectItem>
                  <SelectItem value="Registre">Registre</SelectItem>
                  <SelectItem value="Procédure">Procédure</SelectItem>
                  <SelectItem value="Compte-rendu">Compte-rendu</SelectItem>
                  <SelectItem value="Audit">Audit</SelectItem>
                  <SelectItem value="Formation">Formation</SelectItem>
                </SelectContent>
              </Select>
              
              <div className={`text-center p-4 rounded-xl bg-gradient-to-br ${typeGradient} text-white border-2`}>
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="font-bold text-lg">
                  {formData.type}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statut Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-500" />
                Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Document['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Brouillon">Brouillon</SelectItem>
                  <SelectItem value="En validation">En validation</SelectItem>
                  <SelectItem value="Validé">Validé</SelectItem>
                  <SelectItem value="Obsolète">Obsolète</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="text-center p-4 rounded-xl bg-gray-50 border-2">
                <p className="font-bold text-lg text-gray-700 capitalize">
                  {formData.status}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-bold mb-2">Informations</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Vérifiez tous les champs</li>
                    <li>• Mettez à jour la version si nécessaire</li>
                    <li>• Ajustez le statut selon l'avancement</li>
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