import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  AppWindow,
  Shield, 
  Users, 
  Leaf, 
  MessageSquare, 
  Settings as SettingsIcon, 
  FileSignature,
  Cpu,
  LayoutDashboard,
  ChevronRight,
  Calculator
} from "lucide-react";

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  moduleCount: number;
}

interface CategoriesViewProps {
  onSelectCategory: (categoryId: string) => void;
  onGoToDashboard: () => void;
  /** Accès rapide : ouvrir directement l'évaluation des risques */
  onGoToRisks: () => void;
}

export function CategoriesView({ onSelectCategory, onGoToDashboard, onGoToRisks }: CategoriesViewProps) {
  const categories: Category[] = [
    {
      id: "applications",
      title: "Applications",
      description: "Dashboard, équipe et gestion des accès",
      icon: AppWindow,
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
      moduleCount: 3,
    },
    {
      id: "communication",
      title: "Communication",
      description: "Actualités et informations importantes",
      icon: MessageSquare,
      gradient: "from-blue-600 via-indigo-600 to-purple-600",
      moduleCount: 1,
    },
    {
      id: "administration",
      title: "Administration",
      description: "Gestion des utilisateurs, rôles, services et paramètres",
      icon: SettingsIcon,
      gradient: "from-purple-600 via-pink-600 to-rose-600",
      moduleCount: 8,
    },
    {
      id: "rh",
      title: "Ressources humaines",
      description: "Visites médicales, registre SST, arrivées et départs",
      icon: Users,
      gradient: "from-teal-500 via-cyan-500 to-blue-500",
      moduleCount: 3,
    },
    {
      id: "informatique",
      title: "Informatique",
      description: "Applications Cerbère et habilitations",
      icon: Cpu,
      gradient: "from-indigo-500 via-blue-500 to-cyan-500",
      moduleCount: 1,
    },
    {
      id: "duerp",
      title: "Prévention",
      description: "Évaluation des risques, sensibilisation, plans, protocoles, fiches, accidentologie, DUERP",
      icon: Shield,
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      moduleCount: 10,
    },
    {
      id: "environnement",
      title: "Environnement",
      description: "Campagnes mercure, diagnostics amiante, gestion de la pêche",
      icon: Leaf,
      gradient: "from-cyan-500 via-teal-500 to-blue-500",
      moduleCount: 4,
    },
    {
      id: "validation",
      title: "Validation",
      description: "Signature et validation des documents DUERP",
      icon: FileSignature,
      gradient: "from-rose-600 via-pink-600 to-purple-600",
      moduleCount: 1,
    },
    {
      id: "comptabilite",
      title: "Comptabilité",
      description: "Tickets repas mensuels et gestion comptable du personnel",
      icon: Calculator,
      gradient: "from-emerald-600 via-teal-500 to-cyan-500",
      moduleCount: 1,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-cyan-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent break-words">
                Le Compas
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">DIRM</p>
            </div>
            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 px-5 py-3 sm:px-6 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg active:scale-[0.99] sm:hover:scale-105 transition-all min-h-11"
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            Choisissez une catégorie
          </h2>
          <p className="text-gray-600">
            Sélectionnez une catégorie pour accéder à ses modules
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-cyan-200 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-bold text-blue-700">
                        {category.moduleCount} {category.moduleCount > 1 ? "modules" : "module"}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                      Accéder aux modules
                    </span>
                    <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Accès rapide : cartes cliquables + grille responsive */}
        <div className="mt-10 sm:mt-12">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
            Accès rapide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onGoToDashboard}
              className="w-full min-h-[4.5rem] text-left rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:p-5 shadow-sm transition-all hover:shadow-lg hover:border-cyan-300 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <LayoutDashboard className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">Dashboard</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Vue d&apos;ensemble de la plateforme</p>
                </div>
                <ChevronRight className="h-5 w-5 text-cyan-500 shrink-0" aria-hidden />
              </div>
            </button>

            <button
              type="button"
              onClick={onGoToRisks}
              className="w-full min-h-[4.5rem] text-left rounded-xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 sm:p-5 shadow-sm transition-all hover:shadow-lg hover:border-teal-300 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">Évaluation des risques</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Accès direct au module</p>
                </div>
                <ChevronRight className="h-5 w-5 text-teal-500 shrink-0" aria-hidden />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
