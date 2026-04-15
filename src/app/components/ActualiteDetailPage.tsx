import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  ArrowLeft,
  Info,
  AlertCircle,
  AlertTriangle,
  Wrench,
  Users,
  Calendar,
  Eye,
  FileText,
  Download,
  Paperclip,
  CalendarCheck,
  Clock,
  MapPinned,
  Link as LinkIcon,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react';

interface Document {
  id: string;
  nom: string;
  type: string;
  url: string;
  taille: string;
}

interface Lien {
  id: string;
  titre: string;
  url: string;
}

interface Actualite {
  id: string;
  titre: string;
  contenu: string;
  type: 'info' | 'alerte' | 'urgent' | 'maintenance' | 'evenement' | 'document';
  auteur: string;
  dateCreation: string;
  dateExpiration?: string;
  dateEvenement?: string;
  heureDebut?: string;
  heureFin?: string;
  lieuEvenement?: string;
  imageUrl?: string;
  documents?: Document[];
  liens?: Lien[];
  destinataires: {
    roles: string[];
    services: string[];
    domaines: string[];
    lieux: string[];
    categories: string[];
  };
  estPublie: boolean;
  vuesPar: string[];
}

interface ActualiteDetailPageProps {
  actualite: Actualite;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  userRole?: 'admin' | 'chef_service' | 'agent';
}

export function ActualiteDetailPage({
  actualite,
  onBack,
  onEdit,
  onDelete,
  userRole = 'agent',
}: ActualiteDetailPageProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-6 w-6" />;
      case 'alerte':
        return <AlertCircle className="h-6 w-6" />;
      case 'urgent':
        return <AlertTriangle className="h-6 w-6" />;
      case 'maintenance':
        return <Wrench className="h-6 w-6" />;
      case 'evenement':
        return <CalendarCheck className="h-6 w-6" />;
      case 'document':
        return <FileText className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-base px-4 py-1">ℹ️ Information</Badge>;
      case 'alerte':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-base px-4 py-1">⚠️ Alerte</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 border-red-300 text-base px-4 py-1">🚨 Urgent</Badge>;
      case 'maintenance':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-base px-4 py-1">🔧 Maintenance</Badge>;
      case 'evenement':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-base px-4 py-1">📅 Événement</Badge>;
      case 'document':
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300 text-base px-4 py-1">📄 Document</Badge>;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'from-blue-500 to-cyan-500';
      case 'alerte':
        return 'from-orange-500 to-amber-500';
      case 'urgent':
        return 'from-red-500 to-rose-500';
      case 'maintenance':
        return 'from-purple-500 to-indigo-500';
      case 'evenement':
        return 'from-green-500 to-emerald-500';
      case 'document':
        return 'from-cyan-500 to-blue-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Détail de l'actualité</h1>
            <p className="text-gray-600 mt-1">
              Consultation complète de la publication
            </p>
          </div>
        </div>

        {userRole === 'admin' && (
          <div className="flex gap-3">
            {onEdit && (
              <Button onClick={onEdit} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button onClick={onDelete} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* En-tête de l'actualité */}
      <Card className="border-2">
        <CardHeader className={`bg-gradient-to-r ${getTypeColor(actualite.type)} text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                {getTypeIcon(actualite.type)}
              </div>
              <div>
                <CardTitle className="text-3xl mb-3 text-white">{actualite.titre}</CardTitle>
                <div className="flex gap-2">
                  {getTypeBadge(actualite.type)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Image (si disponible) */}
      {actualite.imageUrl && (
        <Card className="overflow-hidden">
          <img
            src={actualite.imageUrl}
            alt={actualite.titre}
            className="w-full h-96 object-cover"
          />
        </Card>
      )}

      {/* Contenu principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contenu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{actualite.contenu}</p>
        </CardContent>
      </Card>

      {/* Informations événement */}
      {actualite.type === 'evenement' && actualite.dateEvenement && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CalendarCheck className="h-6 w-6" />
              Détails de l'événement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-green-700">
              <Calendar className="h-6 w-6" />
              <div>
                <p className="text-sm text-green-600">Date</p>
                <p className="font-bold text-lg">
                  {new Date(actualite.dateEvenement).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {actualite.heureDebut && (
              <div className="flex items-center gap-3 text-green-700">
                <Clock className="h-6 w-6" />
                <div>
                  <p className="text-sm text-green-600">Horaires</p>
                  <p className="font-bold text-lg">
                    {actualite.heureDebut} - {actualite.heureFin}
                  </p>
                </div>
              </div>
            )}
            {actualite.lieuEvenement && (
              <div className="flex items-center gap-3 text-green-700">
                <MapPinned className="h-6 w-6" />
                <div>
                  <p className="text-sm text-green-600">Lieu</p>
                  <p className="font-bold text-lg">{actualite.lieuEvenement}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Liens */}
      {actualite.liens && actualite.liens.length > 0 && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <LinkIcon className="h-6 w-6" />
              Liens utiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actualite.liens.map((lien) => (
                <Card key={lien.id} className="border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <CardContent className="p-4">
                    <a
                      href={lien.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {lien.titre}
                          </p>
                          <p className="text-sm text-blue-600 hover:underline">
                            {lien.url}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {actualite.documents && actualite.documents.length > 0 && (
        <Card className="border-2 border-cyan-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-800">
              <Paperclip className="h-6 w-6" />
              Documents joints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actualite.documents.map((doc) => (
                <Card key={doc.id} className="border-2 border-cyan-200 bg-cyan-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-cyan-600" />
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{doc.nom}</p>
                          <p className="text-sm text-gray-500">
                            {doc.type.toUpperCase()} • {doc.taille}
                          </p>
                        </div>
                      </div>
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Auteur</p>
                <p className="font-semibold text-gray-900">{actualite.auteur}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-semibold text-gray-900">
                  {new Date(actualite.dateCreation).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            {actualite.dateExpiration && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date d'expiration</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(actualite.dateExpiration).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vues</p>
                <p className="font-semibold text-gray-900">{actualite.vuesPar.length} vue(s)</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3">
            <p className="font-semibold text-gray-900">Destinataires :</p>
            <div className="flex flex-wrap gap-2">
              {actualite.destinataires.roles.map((role) => (
                <Badge key={role} variant="outline" className="bg-gray-50">
                  <Users className="h-3 w-3 mr-1" />
                  {role === 'admin'
                    ? 'Administrateurs'
                    : role === 'chef_service'
                    ? 'Chefs de service'
                    : 'Agents'}
                </Badge>
              ))}
              {actualite.destinataires.services.map((service) => (
                <Badge key={service} variant="outline" className="bg-green-50 border-green-300 text-green-700">
                  {service}
                </Badge>
              ))}
              {actualite.destinataires.lieux.map((lieu) => (
                <Badge key={lieu} variant="outline" className="bg-purple-50 border-purple-300 text-purple-700">
                  {lieu}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
