import React from "react";
import { AsbestosSuiviSpreadsheetView } from "./asbestos/AsbestosSuiviSpreadsheetView";

/** @deprecated conservé pour imports legacy — voir types/importedRegisters */
export interface AsbestosIntervention {
  id: string;
  reference: string;
  zoneMateriau: string;
  localisationPrecise: string;
  datePremiereReperage: string;
  typeAnalyseInitiale: "Type A" | "Type B" | "Type C";
  resultatAnalyse: string;
  dernierControle?: string;
  scoreActuel: 1 | 2 | 3 | null;
  evolutionScore?: string;
  actionsRealisees?: string;
  retraitRealise: boolean;
  dateRetrait?: string;
  entrepriseRetrait?: string;
  actionAPrevoir?: string;
  echeanceAction?: string;
  priorite?: "Faible" | "Moyenne" | "Élevée" | "Urgente";
  statut: "non_amiante" | "surveiller" | "action_requise" | "retrait_effectue";
  fichierDiagnostic?: string;
  fichierPhotos?: string[];
  batiment?: string;
  etage?: string;
  responsable: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AsbestosViewProps {
  accessToken?: string;
}

export function AsbestosView({ accessToken = "" }: AsbestosViewProps) {
  return <AsbestosSuiviSpreadsheetView accessToken={accessToken} />;
}
