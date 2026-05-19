import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Goudurix]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full rounded-2xl border-2 border-red-200 bg-white p-8 shadow-lg text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900">Erreur de chargement</h1>
            <p className="text-sm text-slate-600 mt-2">
              L&apos;application n&apos;a pas pu démarrer sur cet appareil. Essayez de recharger la
              page ou utilisez Chrome / Firefox à jour.
            </p>
            <p className="text-xs text-red-700 mt-4 font-mono break-all bg-red-50 rounded p-2">
              {this.state.error.message}
            </p>
            <Button
              type="button"
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recharger
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
