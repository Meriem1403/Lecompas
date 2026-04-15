import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, Calendar, Clock, ChevronRight, Bell } from 'lucide-react';

interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  service: string;
  plannedMeasures: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  echeance: string;
}

interface DeadlineAlertsCardProps {
  risks: Risk[];
  onNavigateToRisk: (risk: Risk) => void;
}

export function DeadlineAlertsCard({ risks, onNavigateToRisk }: DeadlineAlertsCardProps) {
  const today = new Date();
  
  // Collecter toutes les actions avec échéances
  const upcomingDeadlines: Array<{
    risk: Risk;
    action: string;
    deadline: Date;
    responsible: string;
    daysLeft: number;
  }> = [];

  risks.forEach(risk => {
    risk.plannedMeasures
      .filter(m => m.status !== 'completed')
      .forEach(measure => {
        const deadline = new Date(measure.deadline);
        const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 30 && daysLeft >= 0) {
          upcomingDeadlines.push({
            risk,
            action: measure.description,
            deadline,
            responsible: measure.responsible,
            daysLeft
          });
        }
      });
  });

  // Trier par urgence
  upcomingDeadlines.sort((a, b) => a.daysLeft - b.daysLeft);

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'from-red-500 to-rose-600';
    if (daysLeft <= 14) return 'from-orange-500 to-amber-600';
    return 'from-yellow-400 to-orange-400';
  };

  const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft === 0) return 'Aujourd\'hui';
    if (daysLeft === 1) return 'Demain';
    if (daysLeft <= 7) return `${daysLeft}j - Urgent`;
    if (daysLeft <= 14) return `${daysLeft}j - Important`;
    return `${daysLeft}j`;
  };

  if (upcomingDeadlines.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center text-xl">
            <Bell className="h-6 w-6 mr-2 text-green-500" />
            Alertes Échéances
          </CardTitle>
          <CardDescription>Aucune échéance urgente dans les 30 prochains jours</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm">Toutes les actions sont à jour ou planifiées à long terme</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <CardTitle className="flex items-center text-xl">
          <AlertCircle className="h-6 w-6 mr-2 text-orange-500" />
          Alertes Échéances
          <Badge className="ml-3 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
            {upcomingDeadlines.length} action{upcomingDeadlines.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>Actions à réaliser dans les 30 prochains jours</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {upcomingDeadlines.slice(0, 8).map((item, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:shadow-xl cursor-pointer transition-all hover:scale-[1.01] border border-gray-100"
              onClick={() => onNavigateToRisk(item.risk)}
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getUrgencyColor(item.daysLeft)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.action}</p>
                  <Badge className={`bg-gradient-to-r ${getUrgencyColor(item.daysLeft)} text-white border-0 shadow-md text-xs ml-2`}>
                    {getUrgencyBadge(item.daysLeft)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                  <span className="font-semibold">Risque:</span> {item.risk.title}
                </p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-purple-500" />
                    <span className="font-medium">{item.deadline.toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-indigo-500" />
                    <span className="font-medium">{item.responsible}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-orange-400 flex-shrink-0" />
            </div>
          ))}
        </div>
        {upcomingDeadlines.length > 8 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              + {upcomingDeadlines.length - 8} autre{upcomingDeadlines.length - 8 > 1 ? 's' : ''} action{upcomingDeadlines.length - 8 > 1 ? 's' : ''} à échéance proche
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}