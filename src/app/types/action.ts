export interface Action {
  id: string;
  title: string;
  description: string;
  riskId: string;
  riskTitle: string;
  priority: "Haute" | "Moyenne" | "Faible";
  status: "À faire" | "En cours" | "Terminée" | "En retard";
  responsable: string;
  deadline: string;
  createdAt: string;
  createdBy?: string;
  completedAt?: string;
  budget?: number;
  source?: "DUERP" | "MANUEL";
  services?: string[];
  site?: string;
  papripactYear?: number | null;
}

export interface DuerpActionRisk {
  id: string;
  numeroRisque: string;
  title: string;
  unite: string;
  service: string;
  site: string;
  situation: string;
  associatedRisk: string;
  category: string;
  plannedMeasures?: Array<{
    description: string;
    responsible: string;
    deadline: string;
    status: "pending" | "in_progress" | "completed";
  }>;
}
