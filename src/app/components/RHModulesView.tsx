import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  Stethoscope, 
  ClipboardList, 
  Users,
  ArrowLeft,
  ChevronRight
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

interface RHModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
}

export function RHModulesView({ onSelectModule, onGoBack }: RHModulesViewProps) {
  const modules: Module[] = [
    {
      id: "medical-visits",
      title: "Visites médicales",
      description: "Planification et suivi des visites médicales du personnel",
      icon: Stethoscope,
      color: "text-pink-600",
      gradient: "from-pink-600 via-rose-500 to-red-500",
    },
    {
      id: "sst-registry",
      title: "Registre SST",
      description: "Registre du Service de Santé au Travail",
      icon: ClipboardList,
      color: "text-rose-600",
      gradient: "from-rose-600 via-pink-500 to-purple-500",
    },
    {
      id: "arrivees-departs",
      title: "Arrivées & Départs",
      description: "Gestion des arrivées et départs du personnel",
      icon: Users,
      color: "text-teal-600",
      gradient: "from-teal-600 via-cyan-500 to-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-cyan-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onGoBack}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white hover:shadow-lg transition-all hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Ressources humaines
                </h1>
                <p className="text-gray-600 mt-1">
                  Visites médicales, registre SST, arrivées et départs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Modules ressources humaines
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
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
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
