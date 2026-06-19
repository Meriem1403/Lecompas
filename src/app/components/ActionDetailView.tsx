import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import {
  Calendar,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Edit,
  DollarSign
} from 'lucide-react';
import type { Action } from '@/app/types/action';

interface ActionDetailViewProps {
  action: Action;
  onBack: () => void;
  onEdit: (action: Action) => void;
}

export function ActionDetailView({ 
  action, 
  onBack,
  onEdit
}: ActionDetailViewProps) {
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
        return { 
          icon: CheckCircle2, 
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'En cours':
        return { 
          icon: Clock, 
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'En retard':
        return { 
          icon: AlertCircle, 
          gradient: 'from-red-500 to-rose-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
      case 'À faire':
        return { 
          icon: Calendar, 
          gradient: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
    }
  };

  const isOverdue = (deadline: string, status: Action['status']) => {
    if (status === 'Terminée') return false;
    return new Date(deadline) < new Date();
  };

  const StatusIcon = getStatusConfig(action.status).icon;
  const statusConfig = getStatusConfig(action.status);
  const priorityGradient = getPriorityGradient(action.priority);
  const overdue = isOverdue(action.deadline, action.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="hover:bg-purple-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
        <Button 
          onClick={() => onEdit(action)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:space-x-4">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <StatusIcon className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{action.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`bg-gradient-to-r ${priorityGradient} text-white border-0 shadow-md`}>
                    Priorité {action.priority}
                  </Badge>
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                    {action.status}
                  </Badge>
                  {overdue && action.status !== 'Terminée' && (
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-md animate-pulse">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      En retard
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-sm font-bold text-blue-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{action.description}</p>
            </div>

            <Separator />

            {/* Risque associé */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-l-4 border-purple-500">
              <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Risque associé
              </h3>
              <p className="text-gray-700 font-semibold text-lg">{action.riskTitle}</p>
            </div>

            <Separator />

            {/* Informations complémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-green-900 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Responsable
                </p>
                <p className="font-bold text-lg text-green-700">{action.responsable}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl">
                <p className="text-sm font-bold text-orange-900 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Échéance
                </p>
                <p className={`font-bold text-lg ${overdue ? 'text-red-600' : 'text-orange-700'}`}>
                  {new Date(action.deadline).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {action.budget && (
              <>
                <Separator />
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-l-4 border-yellow-500">
                  <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget alloué
                  </h3>
                  <p className="font-bold text-3xl text-amber-700">{action.budget.toLocaleString('fr-FR')} €</p>
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
                Chronologie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Date de création</p>
                <p className="font-semibold text-gray-800">
                  {new Date(action.createdAt).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              {action.completedAt && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">Date de réalisation</p>
                  <p className="font-semibold text-green-600">
                    {new Date(action.completedAt).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 mb-1">Échéance</p>
                <p className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-800'}`}>
                  {new Date(action.deadline).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${statusConfig.gradient} flex items-center justify-center mx-auto mb-3`}>
                  <StatusIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">Statut actuel</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {action.status}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Priority Info */}
          <Card className={`border-0 shadow-xl bg-gradient-to-br ${priorityGradient} text-white`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-90" />
                <p className="text-sm font-semibold opacity-90 mb-1">Niveau de priorité</p>
                <p className="text-2xl font-bold">
                  {action.priority}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
