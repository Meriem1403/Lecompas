import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { SignalementShortcut } from "./SignalementShortcut";
import { 
  Stethoscope, 
  ClipboardList, 
  Users,
  ArrowLeft,
  ChevronRight,
  Bus,
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
  onSignalement: () => void;
}

export function RHModulesView({ onSelectModule, onGoBack, onSignalement }: RHModulesViewProps) {
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
      title: "Arrivées et départs",
      description: "Gestion des arrivées et départs du personnel",
      icon: Users,
      color: "text-teal-600",
      gradient: "from-teal-600 via-cyan-500 to-blue-500",
    },
    {
      id: "transport-coverage",
      title: "Transports",
      description: "Demande de prise en charge partielle des titres d'abonnement domicile-travail",
      icon: Bus,
      color: "text-sky-700",
      gradient: "from-sky-700 via-blue-600 to-cyan-500",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="sticky top-0 z-10 border-b border-cyan-100 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={onGoBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="break-words bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent sm:text-3xl">
                  Ressources humaines
                </h1>
                <p className="mt-1 break-words text-gray-600">
                  Santé au travail, arrivées et transports
                </p>
              </div>
            </div>
            <SignalementShortcut onClick={onSignalement} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Modules des ressources humaines
          </h2>
          <p className="text-gray-600">
            Sélectionnez un module pour commencer à travailler
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
