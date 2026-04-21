import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Separator } from '@/app/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Briefcase,
  Award,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: {
    showIfQuestionId: string;
    showIfAnswer: string | string[];
  };
}

interface Questionnaire {
  id: string;
  nom: string;
  description: string;
  type: 'arrivee' | 'depart';
  questions: Question[];
  actif: boolean;
  createdAt: string;
  createdBy: string;
}

interface Demande {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
  corps: string;
  grade: string;
  statutDemande: 'brouillon' | 'en_attente' | 'validee' | 'refusee';
  typeDemande: 'arrivee' | 'depart';
  questionnaireId: string;
  reponses: Record<string, any>;
  createdAt: string;
  createdBy: string;
  validatedAt?: string;
  validatedBy?: string;
  commentaire?: string;
}

interface ArriveesDepartsDetailPageProps {
  demande: Demande;
  questionnaire: Questionnaire | null;
  onBack: () => void;
  onValidate?: (demandeId: string, isApproved: boolean, commentaire?: string) => void;
  userRole?: 'admin' | 'chef_service' | 'agent';
}

export function ArriveesDepartsDetailPage({
  demande,
  questionnaire,
  onBack,
  onValidate,
  userRole = 'agent',
}: ArriveesDepartsDetailPageProps) {
  const [commentaire, setCommentaire] = useState('');

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Brouillon</Badge>;
      case 'en_attente':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">En attente</Badge>;
      case 'validee':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Validée</Badge>;
      case 'refusee':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Refusée</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'arrivee' ? (
      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
        <UserPlus className="h-3 w-3 mr-1" />
        Arrivée
      </Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-700 border-purple-300">
        <UserMinus className="h-3 w-3 mr-1" />
        Départ
      </Badge>
    );
  };

  const handleValidate = (isApproved: boolean) => {
    if (onValidate) {
      onValidate(demande.id, isApproved, commentaire);
    }
  };

  const formatReponse = (question: Question, reponse: any) => {
    if (reponse === null || reponse === undefined || reponse === '') {
      return <span className="text-gray-400 italic">Non renseigné</span>;
    }

    if (Array.isArray(reponse)) {
      return (
        <div className="flex flex-wrap gap-2">
          {reponse.map((item, index) => (
            <Badge key={index} variant="outline" className="bg-blue-50">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (question.type === 'date') {
      return new Date(reponse).toLocaleDateString('fr-FR');
    }

    return reponse;
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Détail de la demande</h1>
          <p className="text-gray-600 mt-1">
            Consultation et gestion de la demande
          </p>
        </div>
      </div>

      {/* Informations principales */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <CardTitle className="text-2xl mb-2">
                {demande.prenom} {demande.nom}
              </CardTitle>
              <div className="flex gap-2 mb-4">
                {getTypeBadge(demande.typeDemande)}
                {getStatutBadge(demande.statutDemande)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <p className="font-medium">{demande.statut}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Corps</p>
                <p className="font-medium">{demande.corps}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium">{demande.grade}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium">
                  {new Date(demande.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Créée par</p>
                <p className="font-medium">{demande.createdBy}</p>
              </div>
            </div>
            {demande.validatedAt && (
              <>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date de validation</p>
                    <p className="font-medium">
                      {new Date(demande.validatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Validée par</p>
                    <p className="font-medium">{demande.validatedBy}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {demande.commentaire && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm font-medium text-yellow-800 mb-1">Commentaire</p>
              <p className="text-sm text-yellow-700">{demande.commentaire}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Réponses au questionnaire */}
      <Card>
        <CardHeader>
          <CardTitle>Réponses au questionnaire</CardTitle>
          {questionnaire && (
            <CardDescription>{questionnaire.nom}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {questionnaire ? (
            <div className="space-y-6">
              {questionnaire.questions.map((question) => {
                const reponse = demande.reponses[question.id];
                
                // Ne pas afficher les questions conditionnelles si elles n'ont pas de réponse
                if (question.conditionalLogic && !reponse) {
                  return null;
                }

                return (
                  <div key={question.id} className="pb-4 border-b last:border-b-0">
                    <Label className="text-base font-medium text-gray-900 mb-2 block">
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="mt-2 text-gray-700">
                      {formatReponse(question, reponse)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">Questionnaire non disponible</p>
          )}
        </CardContent>
      </Card>

      {/* Actions de validation (Admin uniquement) */}
      {userRole === 'admin' && demande.statutDemande === 'en_attente' && (
        <Card className="border-2 border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle>Actions de validation</CardTitle>
            <CardDescription>
              Validez ou refusez cette demande
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ajoutez un commentaire sur votre décision..."
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => handleValidate(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider la demande
              </Button>
              <Button
                onClick={() => handleValidate(false)}
                variant="outline"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Refuser la demande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
