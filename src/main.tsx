import { Toaster } from "sonner";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

/** Renforce même si une vieille copie cache index.html sans les attributs. */
function forbidBrowserTranslationTransforms() {
  const root = document.documentElement;
  root.lang = root.lang?.trim() ? root.lang : "fr";
  root.setAttribute("translate", "no");
  root.classList.add("notranslate");

  document.body?.setAttribute("translate", "no");
  document.body?.classList.add("notranslate");

  const rootEl = document.getElementById("root");
  rootEl?.setAttribute("translate", "no");
  rootEl?.classList.add("notranslate");
}

forbidBrowserTranslationTransforms();

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
