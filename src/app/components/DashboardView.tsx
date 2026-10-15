import { getPriorityBandFromGfm } from '@/app/services/riskPriority';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DeadlineAlertsCard } from './DeadlineAlertsCard';
import { PageHeader } from './PageHeader';
import { 
  Shield, 
  AlertCircle, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
  Check,
  Flame,
  Target,
  BarChart3,
  PieChart,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutDashboard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface Risk {
  id: string;
  numeroRisque: string;
  title: string;
  unite: string;
  service: string;
  site: string;
  situation: string;
  associatedRisk: string;
  category: string;
  responsable: string;
  severity: number;
  probability: number;
  riskLevel: number;
  existingMeasures: string[];
  moyenMaitrise: string;
  calculPriorite: number;
  prioriteFinale: number;
  plannedMeasures: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedDate?: string;
    effectiveness?: string;
  }>;
  status: 'a_traiter' | 'en_traitement' | 'maitrise' | 'supprime';
  echeance: string;
  retourAction: string;
  observation: string;
  createdAt: string;
  updatedAt: string;
}

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

interface DashboardViewProps {
  risks: Risk[];
  accidents: Accident[];
  onNavigateToRisk: (risk: Risk) => void;
  getCategoryIcon: (category: string) => any;
  getCategoryColor: (category: string) => string;
  getRiskLevelColor: (level: number) => string;
  getRiskLevelLabel: (level: number) => string;
}

export function DashboardView({
  risks,
  accidents,
  onNavigateToRisk,
  getCategoryIcon,
  getCategoryColor,
  getRiskLevelColor,
  getRiskLevelLabel
}: DashboardViewProps) {
  const showEmptyScopeHint = risks.length === 0;

  // Statistiques
  const stats = [
    { 
      title: 'Risques Identifiés', 
      value: risks.length, 
      icon: Shield, 
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      change: '+12%',
      changeType: 'up'
    },
    {
      title: 'Risques P1',
      value: risks.filter(r => r.riskLevel > 9).length,
      icon: AlertCircle, 
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50',
      change: '-8%',
      changeType: 'down'
    },
    { 
      title: 'Actions en cours', 
      value: risks.reduce((acc, r) => acc + r.plannedMeasures.filter(m => m.status === 'in_progress').length, 0),
      icon: Activity, 
      gradient: 'from-orange-500 to-yellow-500',
      bgGradient: 'from-orange-50 to-yellow-50',
      change: '+24%',
      changeType: 'up'
    },
    { 
      title: 'Accidents ce mois', 
      value: accidents.length, 
      icon: AlertTriangle, 
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      change: '-15%',
      changeType: 'down'
    }
  ];

  const CATEGORY_LABELS: Record<string, string> = {
    chimique: 'Chimique',
    électrique: 'Électrique',
    incendie: 'Incendie',
    mécanique: 'Mécanique',
    ergonomique: 'Ergonomique',
    psychosocial: 'Psychosocial',
    physique: 'Physique',
    routier: 'Routier',
    biologique: 'Biologique',
    noyade: 'Noyade',
    asphyxie: 'Asphyxie',
    risque: 'Autres',
  };

  const formatCategoryLabel = (category: string) =>
    CATEGORY_LABELS[category] ??
    category.charAt(0).toUpperCase() + category.slice(1);

  const aggregateByPriority = () => {
    const bands: Record<'P1' | 'P2' | 'P3', number> = { P1: 0, P2: 0, P3: 0 };
    risks.forEach((risk) => {
      const band = getPriorityBandFromGfm(risk.riskLevel);
      bands[band] += 1;
    });
    return (['P1', 'P2', 'P3'] as const).map((band, index) => ({
      id: `prio-${band}`,
      category: band,
      name: band,
      total: bands[band],
      critique: band === 'P1' ? bands[band] : 0,
      value: bands[band],
      color: index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#22c55e',
    }));
  };

  const categoryChartData = aggregateByPriority();
  const radarData = categoryChartData.slice(0, 8);

  // Donnees pour graphique par catégorie de risque
  const riskData = categoryChartData.slice(0, 10);

  const CATEGORY_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  // Données pour graphique de criticité
  const criticalityData = [
    { id: 'crit-p1', name: 'P1', value: risks.filter(r => r.riskLevel > 9).length, color: '#ef4444' },
    { id: 'crit-p2', name: 'P2', value: risks.filter(r => r.riskLevel >= 4 && r.riskLevel <= 9).length, color: '#f97316' },
    { id: 'crit-p3', name: 'P3', value: risks.filter(r => r.riskLevel < 4).length, color: '#22c55e' }
  ];

  // Données pour évolution mensuelle (simulation)
  const monthlyData = [
    { id: 'month-aout', mois: 'Août', risques: 3, accidents: 2, actions: 5 },
    { id: 'month-sept', mois: 'Sept', risques: 4, accidents: 1, actions: 8 },
    { id: 'month-oct', mois: 'Oct', risques: 5, accidents: 3, actions: 12 },
    { id: 'month-nov', mois: 'Nov', risques: 4, accidents: 2, actions: 15 },
    { id: 'month-dec', mois: 'Déc', risques: 6, accidents: 3, actions: 18 },
    { id: 'month-janv', mois: 'Janv', risques: 5, accidents: 4, actions: 22 },
    { id: 'month-fevr', mois: 'Févr', risques: 6, accidents: 4, actions: 25 }
  ];

  // Données pour répartition par service
  const serviceData = Object.entries(
    risks.reduce((acc, risk) => {
      if (risk.service && risk.service.trim()) {
        const service = risk.service;
        acc[service] = (acc[service] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], index) => ({ id: `srv-${name}-${value}-${index}`, name, value })).slice(0, 5);

  // Données pour statut des actions
  const actionsStatus = [
    {
      id: 'act-completed',
      name: 'Terminées',
      value: risks.reduce((acc, r) => acc + (r.plannedMeasures?.filter(m => m.status === 'completed').length || 0), 0),
      color: '#22c55e'
    },
    {
      id: 'act-progress',
      name: 'En cours',
      value: risks.reduce((acc, r) => acc + (r.plannedMeasures?.filter(m => m.status === 'in_progress').length || 0), 0),
      color: '#f59e0b'
    },
    {
      id: 'act-pending',
      name: 'En attente',
      value: risks.reduce((acc, r) => acc + (r.plannedMeasures?.filter(m => m.status === 'pending').length || 0), 0),
      color: '#94a3b8'
    }
  ];

  // Donnees radar par catégorie (top 8)

  return (
    <div className="space-y-6">
      {showEmptyScopeHint && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          Aucun risque dans votre périmètre (service, domaine, lieu). Les indicateurs
          du tableau de bord reflètent uniquement les risques auxquels vous avez accès.
        </div>
      )}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-105 bg-white/80 backdrop-blur overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`}></div>
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                    <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2">
                      {stat.changeType === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                      )}
                      <span className="text-xs font-bold text-green-600">{stat.change}</span>
                      <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
                    </div>
                  </div>
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en barres - Répartition par catégorie */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="h-6 w-6 mr-2 text-purple-500" />
              Répartition par catégorie
            </CardTitle>
            <CardDescription>Nombre de risques par famille</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskData} id="category-chart" layout="vertical" margin={{ left: 8, right: 16 }}>
                <defs>
                  <linearGradient id="categoryBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b7280"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar key="category-bar" dataKey="value" fill="url(#categoryBarGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique en camembert - Criticité */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <PieChart className="h-6 w-6 mr-2 text-orange-500" />
              Matrice de Criticité
            </CardTitle>
            <CardDescription>Distribution des niveaux de risque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPieChart id="criticality-pie-chart">
                  <Pie
                    key="criticality-pie"
                    data={criticalityData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 25;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#374151"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="font-bold text-sm"
                        >
                          {`${(percent * 100).toFixed(1)}%`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {criticalityData.map((entry, index) => (
                      <Cell key={`cell-${entry.id}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              {/* Légende personnalisée avec pourcentages */}
              <div className="grid grid-cols-2 gap-3">
                {criticalityData.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50">
                    <div 
                      className="h-4 w-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700">{item.name}</p>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution et radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en aires - Évolution temporelle */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
              Évolution sur 7 mois
            </CardTitle>
            <CardDescription>Tendances des risques, accidents et actions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData} id="monthly-area-chart">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area key="area-risques" type="monotone" dataKey="risques" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Risques" />
                <Area key="area-accidents" type="monotone" dataKey="accidents" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Accidents" />
                <Area key="area-actions" type="monotone" dataKey="actions" stackId="3" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Actions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique radar - Vue d'ensemble */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Target className="h-6 w-6 mr-2 text-indigo-500" />
              Vue d'ensemble par catégorie
            </CardTitle>
            <CardDescription>Total vs critiques (8 principales catégories)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart
                data={radarData}
                id="radar-overview-chart"
                cx="50%"
                cy="50%"
                outerRadius="68%"
              >
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#4b5563' }}
                />
                <PolarRadiusAxis stroke="#6b7280" allowDecimals={false} />
                <Radar key="radar-total" name="Total" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                <Radar key="radar-critique" name="Critiques" dataKey="critique" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  labelFormatter={(label) => `Catégorie : ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            {categoryChartData.length > 8 && (
              <p className="mt-2 text-xs text-center text-gray-500">
                Radar limité aux 8 catégories les plus représentées ({categoryChartData.length} au total).
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique des actions et services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut des actions */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CheckCircle2 className="h-6 w-6 mr-2 text-green-500" />
              Statut des Actions
            </CardTitle>
            <CardDescription>Avancement du plan d'actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {actionsStatus.map((status) => {
                const total = actionsStatus.reduce((sum, s) => sum + s.value, 0);
                const percentage = total > 0 ? (status.value / total) * 100 : 0;
                return (
                  <div key={status.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {status.name === 'Terminées' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {status.name === 'En cours' && <Clock className="h-5 w-5 text-orange-500" />}
                        {status.name === 'En attente' && <XCircle className="h-5 w-5 text-gray-400" />}
                        <span className="text-sm font-bold text-gray-700">{status.name}</span>
                      </div>
                      <Badge style={{ backgroundColor: status.color }} className="text-white border-0 shadow-md">
                        {status.value} actions
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 shadow-md"
                        style={{ width: `${percentage}%`, backgroundColor: status.color }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{percentage.toFixed(1)}% du total</span>
                      <span>{status.value} / {total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top services */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Activity className="h-6 w-6 mr-2 text-cyan-500" />
              Top 5 Services à Risque
            </CardTitle>
            <CardDescription>Services avec le plus de risques identifiés</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={serviceData} layout="vertical" id="service-bar-chart">
                <defs>
                  <linearGradient id="serviceBarGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: '11px' }} width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar key="service-bar" dataKey="value" fill="url(#serviceBarGradient)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertes échéances */}
      <DeadlineAlertsCard risks={risks} onNavigateToRisk={onNavigateToRisk} />

      {/* Listes récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risques critiques */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center text-xl">
              <AlertCircle className="h-6 w-6 mr-2 text-red-500" />
              Risques Critiques à Traiter
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {risks
                .filter(r => r.riskLevel >= 12)
                .slice(0, 5)
                .map((risk) => {
                  const band = getPriorityBandFromGfm(risk.riskLevel);
                  const gradient =
                    band === 'P1'
                      ? 'from-red-500 to-rose-600'
                      : band === 'P2'
                        ? 'from-orange-500 to-amber-600'
                        : 'from-green-500 to-emerald-600';
                  return (
                    <div 
                      key={risk.id}
                      className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:shadow-xl cursor-pointer transition-all hover:scale-[1.02] border border-gray-100"
                      onClick={() => onNavigateToRisk(risk)}
                    >
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex flex-col items-center justify-center flex-shrink-0 shadow-lg`}>
                        <span className="text-sm font-extrabold text-white">{band}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800">{risk.title}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{risk.situation}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={`bg-gradient-to-r ${getRiskLevelColor(risk.riskLevel)} text-white border-0 shadow-md`}>
                            {getRiskLevelLabel(risk.riskLevel)}
                          </Badge>
                          <span className="text-xs font-bold text-gray-500">Niveau: {risk.riskLevel}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-purple-400 flex-shrink-0" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Accidents récents */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center text-xl">
              <AlertTriangle className="h-6 w-6 mr-2 text-purple-500" />
              Accidents Récents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {accidents.slice(0, 5).map((accident) => {
                const severityColor = 
                  accident.severity === 'très_grave' ? 'from-red-500 to-rose-600' :
                  accident.severity === 'grave' ? 'from-orange-500 to-red-500' :
                  accident.severity === 'modéré' ? 'from-yellow-400 to-orange-400' : 'from-green-400 to-emerald-500';
                
                return (
                  <div key={accident.id} className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-gray-800">{accident.title}</span>
                      <Badge className={`bg-gradient-to-r ${severityColor} text-white border-0 shadow-md capitalize`}>
                        {accident.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-purple-500" />
                        <span className="font-medium">{new Date(accident.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-indigo-500" />
                        <span className="font-medium">{accident.victim}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}