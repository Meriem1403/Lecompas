import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  Droplet, 
  Shield, 
  FileSignature, 
  Fish,
  Leaf,
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

interface EnvironnementModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
}

export function EnvironnementModulesView({ onSelectModule, onGoBack }: EnvironnementModulesViewProps) {
  const modules: Module[] = [
    {
      id: "mercury",
      title: "Campagnes mercure",
      description: "Suivi et gestion des campagnes de contrôle du mercure",
      icon: Droplet,
      color: "text-cyan-600",
      gradient: "from-cyan-600 via-blue-500 to-teal-500",
    },
    {
      id: "asbestos",
      title: "Diagnostics amiante",
      description: "Gestion des diagnostics et interventions amiante",
      icon: Shield,
      color: "text-purple-600",
      gradient: "from-purple-600 via-indigo-500 to-blue-500",
    },
    {
      id: "asbestos-attestations",
      title: "Attestations amiante",
      description: "Gestion des attestations et certifications amiante",
      icon: FileSignature,
      color: "text-amber-600",
      gradient: "from-amber-600 via-orange-500 to-yellow-500",
    },
    {
      id: "fisherman",
      title: "Gestion de la pêche",
      description: "Gestion des autorisations de pêche et déclarations",
      icon: Fish,
      color: "text-teal-600",
      gradient: "from-teal-600 via-cyan-500 to-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-cyan-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onGoBack}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white hover:shadow-lg transition-all hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Environnement
                </h1>
                <p className="text-gray-600 mt-1">
                  Campagnes mercure, diagnostics amiante, gestion de la pêche
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Modules d&apos;environnement
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
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-teal-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
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
