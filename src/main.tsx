import { Toaster } from "sonner";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <>
        {/*
          Un seul Toaster dans toute l'app.
          Multiples instances (une par vue dans App) provoquaient une erreur insertBefore sur Chrome Android.
        */}
        <Toaster position="top-center" duration={4500} closeButton richColors />
        <App />
      </>
    </ErrorBoundary>,
  );
}
