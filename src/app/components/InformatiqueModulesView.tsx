import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Shield, Car, ArrowLeft, ChevronRight } from "lucide-react";
import { SignalementShortcut } from "./SignalementShortcut";

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

interface InformatiqueModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
  onSignalement: () => void;
}

export function InformatiqueModulesView({
  onSelectModule,
  onGoBack,
  onSignalement,
}: InformatiqueModulesViewProps) {
  const modules: Module[] = [
    {
      id: "cerbere",
      title: "Applications Cerbère",
      description: "Demandes d'habilitation et validations",
      icon: Shield,
      gradient: "from-indigo-600 via-blue-600 to-cyan-600",
    },
    {
      id: "reservations",
      title: "Réservations véhicules & salles",
      description: "Planning véhicules, salles de réunion et visio Lifesize",
      icon: Car,
      gradient: "from-violet-600 via-purple-600 to-indigo-600",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-indigo-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <button
              type="button"
              onClick={onGoBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white hover:shadow-lg transition-all hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent sm:text-3xl">
                Informatique
              </h1>
              <p className="mt-1 break-words text-gray-600">
                Cerbère et réservations de ressources
              </p>
            </div>
            <SignalementShortcut onClick={onSignalement} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="cursor-pointer border-0 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
                onClick={() => onSelectModule(module.id)}
              >
                <CardHeader>
                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-2`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {module.title}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
