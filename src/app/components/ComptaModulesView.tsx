import { ArrowLeft, BookOpen, ChevronRight, Landmark } from "lucide-react";
import { SignalementShortcut } from "./SignalementShortcut";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface ComptaModulesViewProps {
  onSelectModule: (moduleId: string) => void;
  onGoBack: () => void;
  onSignalement: () => void;
}

export function ComptaModulesView({ onSelectModule, onGoBack, onSignalement }: ComptaModulesViewProps) {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="sticky top-0 z-10 border-b border-emerald-100 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onGoBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-emerald-950 sm:text-3xl">Comptabilité</h1>
              <p className="mt-1 text-stone-600">Subventions, nomenclature GM / PCE et états de versement</p>
            </div>
          </div>
          <SignalementShortcut onClick={onSignalement} />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 sm:py-12">
        <Card
          onClick={() => onSelectModule("subventions")}
          className="cursor-pointer border-emerald-100 bg-white hover:border-emerald-300 hover:shadow-lg"
        >
          <CardHeader>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Landmark className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl text-emerald-950">Subventions</CardTitle>
            <CardDescription className="mt-2 text-stone-600">
              Attestation de commencement, courrier de demande de paiement et suivi des versements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-emerald-800">
              <span>Accéder au module</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => onSelectModule("nomenclature")}
          className="cursor-pointer border-emerald-100 bg-white hover:border-emerald-300 hover:shadow-lg"
        >
          <CardHeader>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <BookOpen className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl text-emerald-950">Nomenclature GM / PCE</CardTitle>
            <CardDescription className="mt-2 text-stone-600">
              Trois questions pour une subvention, ou une recherche pour les autres dépenses. Le code GM et le compte PCE se copient pour Chorus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-emerald-800">
              <span>Accéder au module</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
