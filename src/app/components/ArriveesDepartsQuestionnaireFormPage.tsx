import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  Settings,
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

interface ArriveesDepartsQuestionnaireFormPageProps {
  questionnaire?: Questionnaire;
  questionnaires: Questionnaire[];
  onBack: () => void;
  onSubmit: (questionnaire: Partial<Questionnaire>, questions: Question[]) => void;
}

export function ArriveesDepartsQuestionnaireFormPage({
  questionnaire,
  questionnaires,
  onBack,
  onSubmit,
}: ArriveesDepartsQuestionnaireFormPageProps) {
  const [questionnaireForm, setQuestionnaireForm] = useState({
    nom: questionnaire?.nom || '',
    description: questionnaire?.description || '',
    type: questionnaire?.type || ('arrivee' as 'arrivee' | 'depart'),
  });
  const [questions, setQuestions] = useState<Question[]>(questionnaire?.questions || []);
  const [optionsInput, setOptionsInput] = useState<Record<string, string>>({});

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = (questionIndex: number) => {
    const optionText = optionsInput[questionIndex]?.trim();
    if (!optionText) {
      toast.error('Veuillez saisir une option');
      return;
    }

    const updated = [...questions];
    const currentOptions = updated[questionIndex].options || [];
    updated[questionIndex].options = [...currentOptions, optionText];
    setQuestions(updated);
    setOptionsInput({ ...optionsInput, [questionIndex]: '' });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    const currentOptions = updated[questionIndex].options || [];
    updated[questionIndex].options = currentOptions.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const handleSaveQuestionnaire = () => {
    if (!questionnaireForm.nom) {
      toast.error('Le nom du questionnaire est obligatoire');
      return;
    }

    if (questions.length === 0) {
      toast.error('Ajoutez au moins une question');
      return;
    }

    // Vérifier que toutes les questions ont un label
    for (const question of questions) {
      if (!question.label.trim()) {
        toast.error('Toutes les questions doivent avoir un libellé');
        return;
      }
    }

    onSubmit(questionnaireForm, questions);
  };

  // Liste des questions disponibles pour la logique conditionnelle
  const availableQuestionsForConditional = (currentIndex: number) => {
    return questions.slice(0, currentIndex).filter(
      (q) => q.type === 'radio' || q.type === 'select'
    );
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
          <h1 className="text-3xl font-bold">
            {questionnaire ? 'Modifier le questionnaire' : 'Nouveau questionnaire'}
          </h1>
          <p className="text-gray-600 mt-1">
            Configurez les questions d'arrivée ou de départ
          </p>
        </div>
      </div>

      {/* Informations du questionnaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Définissez les paramètres de base du questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du questionnaire *</Label>
            <Input
              id="nom"
              value={questionnaireForm.nom}
              onChange={(e) =>
                setQuestionnaireForm({ ...questionnaireForm, nom: e.target.value })
              }
              placeholder="Ex: Questionnaire d'arrivée standard"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={questionnaireForm.description}
              onChange={(e) =>
                setQuestionnaireForm({ ...questionnaireForm, description: e.target.value })
              }
              placeholder="Décrivez l'objectif de ce questionnaire"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={questionnaireForm.type}
              onValueChange={(value: 'arrivee' | 'depart') =>
                setQuestionnaireForm({ ...questionnaireForm, type: value })
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
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Ajoutez et configurez les questions du questionnaire
              </CardDescription>
            </div>
              <Button onClick={handleAddQuestion} className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune question pour le moment</p>
              <p className="text-sm">Cliquez sur "Ajouter une question" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <Card key={question.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <Badge variant="outline" className="text-sm">
                          Question {index + 1}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type de question *</Label>
                          <Select
                            value={question.type}
                            onValueChange={(value) => handleUpdateQuestion(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texte court</SelectItem>
                              <SelectItem value="textarea">Texte long</SelectItem>
                              <SelectItem value="radio">Choix unique</SelectItem>
                              <SelectItem value="checkbox">Choix multiple</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Liste déroulante</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${index}`}
                              checked={question.required}
                              onCheckedChange={(checked) =>
                                handleUpdateQuestion(index, 'required', checked)
                              }
                            />
                            <Label htmlFor={`required-${index}`} className="cursor-pointer">
                              Question obligatoire
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Libellé de la question *</Label>
                        <Input
                          value={question.label}
                          onChange={(e) => handleUpdateQuestion(index, 'label', e.target.value)}
                          placeholder="Ex: Quelle est votre formation initiale ?"
                        />
                      </div>

                      {/* Options pour radio, checkbox, select */}
                      {(question.type === 'radio' ||
                        question.type === 'checkbox' ||
                        question.type === 'select') && (
                        <div className="space-y-2">
                          <Label>Options de réponse</Label>
                          <div className="space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input value={option} disabled className="flex-1" />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => handleRemoveOption(index, optionIndex)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2">
                              <Input
                                value={optionsInput[index] || ''}
                                onChange={(e) =>
                                  setOptionsInput({ ...optionsInput, [index]: e.target.value })
                                }
                                placeholder="Nouvelle option"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddOption(index);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddOption(index)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Logique conditionnelle */}
                      {availableQuestionsForConditional(index).length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-blue-600" />
                            <Label className="text-sm font-medium text-blue-900">
                              Logique conditionnelle (optionnel)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`conditional-${index}`}
                              checked={!!question.conditionalLogic}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleUpdateQuestion(index, 'conditionalLogic', {
                                    showIfQuestionId: '',
                                    showIfAnswer: '',
                                  });
                                } else {
                                  handleUpdateQuestion(index, 'conditionalLogic', undefined);
                                }
                              }}
                            />
                            <Label htmlFor={`conditional-${index}`} className="cursor-pointer text-sm">
                              Afficher cette question conditionnellement
                            </Label>
                          </div>

                          {question.conditionalLogic && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Dépend de la question</Label>
                                <Select
                                  value={question.conditionalLogic.showIfQuestionId}
                                  onValueChange={(value) => {
                                    const updated = { ...question.conditionalLogic, showIfQuestionId: value };
                                    handleUpdateQuestion(index, 'conditionalLogic', updated);
                                  }}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableQuestionsForConditional(index).map((q, i) => (
                                      <SelectItem key={q.id} value={q.id}>
                                        Q{i + 1}: {q.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Afficher si la réponse est</Label>
                                <Input
                                  className="text-sm"
                                  value={
                                    typeof question.conditionalLogic.showIfAnswer === 'string'
                                      ? question.conditionalLogic.showIfAnswer
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const updated = {
                                      ...question.conditionalLogic,
                                      showIfAnswer: e.target.value,
                                    };
                                    handleUpdateQuestion(index, 'conditionalLogic', updated);
                                  }}
                                  placeholder="Ex: Oui"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button onClick={handleSaveQuestionnaire} className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <Save className="h-4 w-4 mr-2" />
          {questionnaire ? 'Enregistrer les modifications' : 'Créer le questionnaire'}
        </Button>
      </div>
    </div>
  );
}
