import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  Database,
  MessageSquare,
  Users, 
  UserCog, 
  Building2,
  Layers,
  MapPin,
  Shield,
  Settings as SettingsIcon,
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

interface AdministrationModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
}

export function AdministrationModulesView({ onSelectModule, onGoBack }: AdministrationModulesViewProps) {
  const modules: Module[] = [
    {
      id: "risks-management",
      title: "Gestion des risques",
      description: "Administration des types de risques et catégories",
      icon: Database,
      color: "text-red-600",
      gradient: "from-red-600 via-rose-500 to-pink-500",
    },
    {
      id: "action-returns",
      title: "Retours d'action",
      description: "Validation des retours d'action des chefs de service",
      icon: MessageSquare,
      color: "text-emerald-600",
      gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    },
    {
      id: "users",
      title: "Utilisateurs",
      description: "Gestion des comptes utilisateurs",
      icon: Users,
      color: "text-blue-600",
      gradient: "from-blue-600 via-indigo-500 to-purple-500",
    },
    {
      id: "roles",
      title: "Rôles",
      description: "Configuration des rôles et permissions",
      icon: UserCog,
      color: "text-purple-600",
      gradient: "from-purple-600 via-indigo-500 to-blue-500",
    },
    {
      id: "services",
      title: "Services",
      description: "Gestion des services de l'organisation",
      icon: Building2,
      color: "text-green-600",
      gradient: "from-green-600 via-teal-500 to-cyan-500",
    },
    {
      id: "domains",
      title: "Domaines",
      description: "Configuration des domaines d'activité",
      icon: Layers,
      color: "text-orange-600",
      gradient: "from-orange-600 via-amber-500 to-yellow-500",
    },
    {
      id: "locations",
      title: "Lieux",
      description: "Gestion des sites et localisations",
      icon: MapPin,
      color: "text-cyan-600",
      gradient: "from-cyan-600 via-blue-500 to-teal-500",
    },
    {
      id: "cerbere",
      title: "Applications Cerbère",
      description: "Gestion des demandes d'accès Cerbère",
      icon: Shield,
      color: "text-indigo-600",
      gradient: "from-indigo-600 via-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onGoBack}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Administration
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestion des utilisateurs, rôles, services et paramètres
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Modules Administration
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
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-purple-200 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
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
                    <ChevronRight className="h-5 w-5 text-purple-500 group-hover:translate-x-2 transition-transform" />
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
