import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  GitBranch,
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

interface ArriveesDepartsNewDemandePageProps {
  questionnaires: Questionnaire[];
  onBack: () => void;
  onSubmit: (demande: any) => void;
}

export function ArriveesDepartsNewDemandePage({
  questionnaires,
  onBack,
  onSubmit,
}: ArriveesDepartsNewDemandePageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    statut: '',
    corps: '',
    grade: '',
    typeDemande: 'arrivee' as 'arrivee' | 'depart',
  });
  const [reponses, setReponses] = useState<Record<string, any>>({});

  // Questionnaire actif pour le type sélectionné
  const activeQuestionnaire = questionnaires.find(
    (q) => q.type === formData.typeDemande && q.actif
  );

  // Vérifier si une question doit être affichée selon la logique conditionnelle
  const shouldShowQuestion = (question: Question, currentQuestionnaire: Questionnaire): boolean => {
    if (!question.conditionalLogic) return true;

    const { showIfQuestionId, showIfAnswer } = question.conditionalLogic;
    const parentAnswer = reponses[showIfQuestionId];

    if (!parentAnswer) return false;

    if (Array.isArray(showIfAnswer)) {
      return showIfAnswer.includes(parentAnswer);
    }

    return parentAnswer === showIfAnswer;
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      // Validation des informations de base
      if (!formData.nom || !formData.prenom || !formData.statut || !formData.corps || !formData.grade) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmitDemande = (asBrouillon: boolean = false) => {
    const selectedQuestionnaireObj = questionnaires.find(
      (q) => q.type === formData.typeDemande && q.actif
    );

    if (!selectedQuestionnaireObj) {
      toast.error('Aucun questionnaire actif pour ce type de demande');
      return;
    }

    // Validation des réponses obligatoires
    const requiredQuestions = selectedQuestionnaireObj.questions.filter(
      (q) => q.required && shouldShowQuestion(q, selectedQuestionnaireObj)
    );

    if (!asBrouillon) {
      for (const question of requiredQuestions) {
        if (!reponses[question.id] || (Array.isArray(reponses[question.id]) && reponses[question.id].length === 0)) {
          toast.error(`La question "${question.label}" est obligatoire`);
          return;
        }
      }
    }

    const newDemande = {
      id: `d${Date.now()}`,
      ...formData,
      statutDemande: asBrouillon ? 'brouillon' : 'en_attente',
      questionnaireId: selectedQuestionnaireObj.id,
      reponses,
      createdAt: new Date().toISOString(),
      createdBy: 'Utilisateur Connecté',
    };

    onSubmit(newDemande);
    toast.success(
      asBrouillon ? 'Demande sauvegardée en brouillon' : 'Demande soumise avec succès'
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouvelle demande</h1>
          <p className="text-gray-600 mt-1">
            Étape {currentStep + 1} sur 2
          </p>
        </div>
      </div>

      {/* Contenu */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-xl mb-4">Informations personnelles</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut *</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Titulaire">Titulaire</SelectItem>
                      <SelectItem value="Contractuel">Contractuel</SelectItem>
                      <SelectItem value="Stagiaire">Stagiaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corps">Corps *</Label>
                  <Select
                    value={formData.corps}
                    onValueChange={(value) => setFormData({ ...formData, corps: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administratif">Administratif</SelectItem>
                      <SelectItem value="Technique">Technique</SelectItem>
                      <SelectItem value="Maritime">Maritime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade *</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="typeDemande">Type de demande *</Label>
                  <Select
                    value={formData.typeDemande}
                    onValueChange={(value: 'arrivee' | 'depart') =>
                      setFormData({ ...formData, typeDemande: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrivee">Arrivée</SelectItem>
                      <SelectItem value="depart">Départ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && activeQuestionnaire && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <GitBranch className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {activeQuestionnaire.nom}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activeQuestionnaire.description}
                  </p>
                </div>
              </div>

              {activeQuestionnaire.questions
                .filter((q) => shouldShowQuestion(q, activeQuestionnaire))
                .map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label>
                      {question.label}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {question.type === 'text' && (
                      <Input
                        value={reponses[question.id] || ''}
                        onChange={(e) =>
                          setReponses({ ...reponses, [question.id]: e.target.value })
                        }
                      />
                    )}

                    {question.type === 'textarea' && (
                      <Textarea
                        value={reponses[question.id] || ''}
                        onChange={(e) =>
                          setReponses({ ...reponses, [question.id]: e.target.value })
                        }
                        rows={4}
                      />
                    )}

                    {question.type === 'date' && (
                      <Input
                        type="date"
                        value={reponses[question.id] || ''}
                        onChange={(e) =>
                          setReponses({ ...reponses, [question.id]: e.target.value })
                        }
                      />
                    )}

                    {question.type === 'radio' && question.options && (
                      <RadioGroup
                        value={reponses[question.id] || ''}
                        onValueChange={(value) =>
                          setReponses({ ...reponses, [question.id]: value })
                        }
                      >
                        {question.options.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                            <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.type === 'checkbox' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${question.id}-${option}`}
                              checked={(reponses[question.id] || []).includes(option)}
                              onCheckedChange={(checked) => {
                                const current = reponses[question.id] || [];
                                setReponses({
                                  ...reponses,
                                  [question.id]: checked
                                    ? [...current, option]
                                    : current.filter((o: string) => o !== option),
                                });
                              }}
                            />
                            <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'select' && question.options && (
                      <Select
                        value={reponses[question.id] || ''}
                        onValueChange={(value) =>
                          setReponses({ ...reponses, [question.id]: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep === 0 ? (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            ) : (
              <Button variant="outline" onClick={handlePreviousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}

            <div className="flex gap-2">
              {currentStep === 1 && (
                <>
                  <Button variant="outline" onClick={() => handleSubmitDemande(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder brouillon
                  </Button>
                  <Button onClick={() => handleSubmitDemande(false)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre
                  </Button>
                </>
              )}
              {currentStep === 0 && (
                <Button onClick={handleNextStep} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
