import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  FileText,
  ArrowLeft,
  Edit,
  Download,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag as TagIcon
} from 'lucide-react';
import { Document } from './DocumentsView';

interface DocumentDetailViewProps {
  document: Document;
  onBack: () => void;
  onEdit: (document: Document) => void;
  onDownload: (document: Document) => void;
  isArchive?: boolean;
}

export function DocumentDetailView({ 
  document, 
  onBack,
  onEdit,
  onDownload,
  isArchive = false
}: DocumentDetailViewProps) {
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

  const getStatusConfig = (status: Document['status']) => {
    switch (status) {
      case 'Validé':
        return { 
          icon: CheckCircle2, 
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'En validation':
        return { 
          icon: Clock, 
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'Brouillon':
        return { 
          icon: Edit, 
          gradient: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
      case 'Obsolète':
        return { 
          icon: AlertCircle, 
          gradient: 'from-red-500 to-rose-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const StatusIcon = getStatusConfig(document.status).icon;
  const statusConfig = getStatusConfig(document.status);
  const typeGradient = getTypeColor(document.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="hover:bg-purple-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
        <div className="flex space-x-2">
          <Button 
            onClick={() => onDownload(document)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          {!isArchive && (
            <Button 
              onClick={() => onEdit(document)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${typeGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{document.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`bg-gradient-to-r ${typeGradient} text-white border-0 shadow-md`}>
                    {document.type}
                  </Badge>
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {document.status}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Version {document.version}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-sm font-bold text-blue-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{document.description}</p>
            </div>

            <Separator />

            {/* Informations de création */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-green-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Créé par
                </p>
                <p className="font-bold text-lg text-green-700">{document.createdBy}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-orange-900 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date de création
                </p>
                <p className="font-bold text-lg text-orange-700">
                  {new Date(document.createdAt).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Validation info si validé */}
            {document.validatedBy && document.validatedAt && (
              <>
                <Separator />
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500">
                  <h3 className="text-sm font-bold text-green-900 mb-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Validation
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-green-700 mb-1">Validé par</p>
                      <p className="font-semibold text-green-800">{document.validatedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-700 mb-1">Date de validation</p>
                      <p className="font-semibold text-green-800">
                        {new Date(document.validatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* File info */}
            {document.fileSize && (
              <>
                <Separator />
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-l-4 border-purple-500">
                  <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Fichier joint
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Taille du fichier</p>
                      <p className="font-bold text-xl text-purple-800">{formatFileSize(document.fileSize)}</p>
                    </div>
                    <Button 
                      onClick={() => onDownload(document)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <>
                <Separator />
                <div className="bg-gradient-to-br from-pink-50 to-fuchsia-50 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-pink-900 mb-3 flex items-center">
                    <TagIcon className="h-4 w-4 mr-2" />
                    Étiquettes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag, idx) => (
                      <Badge key={idx} className="bg-pink-100 text-pink-800 border-pink-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                Historique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Créé le</p>
                <p className="font-semibold text-gray-800">
                  {new Date(document.createdAt).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 mb-1">Dernière modification</p>
                <p className="font-semibold text-gray-800">
                  {new Date(document.updatedAt).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              {document.validatedAt && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">Validé le</p>
                  <p className="font-semibold text-green-600">
                    {new Date(document.validatedAt).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${statusConfig.gradient} flex items-center justify-center mx-auto mb-3`}>
                  <StatusIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">Statut actuel</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {document.status}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Type Info */}
          <Card className={`border-0 shadow-xl bg-gradient-to-br ${typeGradient} text-white`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-90" />
                <p className="text-sm font-semibold opacity-90 mb-1">Type de document</p>
                <p className="text-2xl font-bold">
                  {document.type}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}