import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Shield,
  AlertCircle,
  ClipboardList,
  Calendar,
  FileText,
  Archive,
  Target,
  ArrowLeft,
  ChevronRight,
  FileCheck,
  Info,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

interface DUERPModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
}

export function DUERPModulesView({ onSelectModule, onGoBack }: DUERPModulesViewProps) {
  const modules: Module[] = [
    {
      id: "risks",
      title: "Évaluation des risques",
      description: "Identification et évaluation des risques professionnels",
      icon: Shield,
      color: "text-purple-500",
      gradient: "from-purple-500 via-indigo-500 to-blue-500",
    },
    {
      id: "risk-awareness",
      title: "Sensibilisation aux risques",
      description: "Fiches de sensibilisation pour les collaborateurs, liées à l'évaluation (DUERP)",
      icon: Info,
      color: "text-orange-500",
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
    },
    {
      id: "prevention-plan",
      title: "Plan de prévention",
      description: "Plans de prévention opérationnels liés aux risques et services",
      icon: Target,
      color: "text-sky-500",
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
    },
    {
      id: "safety-protocols",
      title: "Protocole sécurité",
      description: "Protocoles opérationnels de chargement, déchargement, levage et coactivité",
      icon: Shield,
      color: "text-cyan-500",
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    },
    {
      id: "safety-sheets",
      title: "Fiches sécurité",
      description: "Fiches par secteur : activités, prévention, contrôles amiante, plomb, CACES, CVC, etc.",
      icon: FileCheck,
      color: "text-pink-500",
      gradient: "from-pink-500 via-rose-500 to-stone-400",
    },
    {
      id: "accidents",
      title: "Accidentologie",
      description: "Suivi et analyse des accidents du travail",
      icon: AlertCircle,
      color: "text-red-500",
      gradient: "from-red-500 via-rose-500 to-pink-500",
    },
    {
      id: "registre",
      title: "Registre Accidents",
      description: "Registre officiel des accidents de travail",
      icon: ClipboardList,
      color: "text-rose-500",
      gradient: "from-rose-500 via-pink-500 to-purple-500",
    },
    {
      id: "actions",
      title: "Plan d'actions",
      description: "Suivi des mesures de prévention et actions correctives",
      icon: Calendar,
      color: "text-green-500",
      gradient: "from-green-500 via-teal-500 to-cyan-500",
    },
    {
      id: "documents",
      title: "Documents DUERP",
      description: "Gestion des documents du Document Unique",
      icon: FileText,
      color: "text-orange-500",
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
    },
    {
      id: "archives",
      title: "Archives (40 ans)",
      description: "Archivage réglementaire sur 40 ans",
      icon: Archive,
      color: "text-red-500",
      gradient: "from-red-600 via-red-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onGoBack}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  DUERP Manager
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestion des risques professionnels et de la sécurité au travail
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Modules DUERP
          </h2>
          <p className="text-gray-600">
            Sélectionnez un module pour commencer à travailler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-cyan-200 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2 min-h-[40px]">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                      Accéder au module
                    </span>
                    <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
