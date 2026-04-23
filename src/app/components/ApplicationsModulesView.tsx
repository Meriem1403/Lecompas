import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, ChevronRight, Cog, LayoutDashboard, Users } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

interface ApplicationsModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
}

export function ApplicationsModulesView({
  onSelectModule,
  onGoBack,
}: ApplicationsModulesViewProps) {
  const modules: Module[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Vue d'ensemble de la plateforme",
      icon: LayoutDashboard,
      gradient: "from-sky-600 via-blue-500 to-indigo-500",
    },
    {
      id: "team",
      title: "Équipe",
      description: "Consultation des fiches agents et informations d'équipe",
      icon: Users,
      gradient: "from-cyan-600 via-sky-500 to-blue-500",
    },
    {
      id: "access-management",
      title: "Gestion des accès",
      description: "Configuration des accès par agent et par module",
      icon: Cog,
      gradient: "from-violet-600 via-indigo-500 to-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onGoBack}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white hover:shadow-lg transition-all hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Applications
                </h1>
                <p className="text-gray-600 mt-1">
                  Dashboard, équipe et gestion des accès
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Modules d&apos;applications</h2>
          <p className="text-gray-600">Sélectionnez un module pour continuer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                onClick={() => onSelectModule(module.id)}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-sky-200 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-sky-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2 min-h-[40px]">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Accéder au module</span>
                    <ChevronRight className="h-5 w-5 text-sky-500 group-hover:translate-x-2 transition-transform" />
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
