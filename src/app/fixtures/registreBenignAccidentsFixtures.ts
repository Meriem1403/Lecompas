export interface RegistreBenignAccident {
  id: string;
  numero: number;
  annee: number;
  nomVictime: string;
  prenomVictime: string;
  dateAccident: string;
  heureAccident: string;
  lieuAccident: string;
  circonstances: string;
  natureLesions: string;
  siegeLesions: string;
  soignant: string;
  signatureSoignant: boolean;
  signatureVictime: boolean;
  signatureSoignantDate?: string;
  signatureVictimeDate?: string;
  signatureSoignantImage?: string;
  signatureVictimeImage?: string;
  dateInscription: string;
  observations?: string;
  serviceAffectation?: string;
  domaineAffectation?: string;
  lieuAffectation?: string;
  categorieAccident?: string;
  typeAccidentNature?: string;
  typeLegal?: "" | "travail" | "trajet" | "maladie_pro";
  descriptionFaits?: string;
  causes?: string;
  analyseCauses?: string;
  commentaires?: string;
  duerpRiskId?: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
  duerpRiskFreeText?: string;
}

export const REGISTRE_BENIGN_ACCIDENT_FIXTURES: RegistreBenignAccident[] = [
  {
    id: "1",
    numero: 1,
    annee: 2026,
    nomVictime: "Dupont",
    prenomVictime: "Marie",
    dateAccident: "2026-01-15",
    heureAccident: "10:30",
    lieuAccident: "Atelier de production - Zone découpe",
    circonstances:
      "Coupure superficielle au doigt en manipulant une lame de découpe",
    natureLesions: "Coupure superficielle",
    siegeLesions: "Index main droite",
    soignant: "Dr. Laurent Mercier",
    signatureSoignant: true,
    signatureVictime: true,
    signatureSoignantDate: "2026-01-15",
    signatureVictimeDate: "2026-01-15",
    signatureSoignantImage: "",
    signatureVictimeImage: "",
    dateInscription: "2026-01-15T11:05:00",
    observations: "Pansement appliqué, pas de soins nécessaires",
    categorieAccident: "Travail",
    typeAccidentNature: "Coupure",
    typeLegal: "travail",
    descriptionFaits: "Coupure superficielle lors de la découpe",
    causes: "Lame non sécurisée",
    commentaires: "Surveillance 15 min",
  },
  {
    id: "2",
    numero: 2,
    annee: 2026,
    nomVictime: "Martin",
    prenomVictime: "Jean",
    dateAccident: "2026-01-20",
    heureAccident: "14:15",
    lieuAccident: "Entrepôt - Allée B",
    circonstances: "Chute de plain-pied sur sol mouillé, léger choc au genou",
    natureLesions: "Contusion légère",
    siegeLesions: "Genou gauche",
    soignant: "Infirmier Paul Bernard",
    signatureSoignant: true,
    signatureVictime: true,
    signatureSoignantDate: "2026-01-20",
    signatureVictimeDate: "2026-01-20",
    signatureSoignantImage: "",
    signatureVictimeImage: "",
    dateInscription: "2026-01-20T14:48:00",
    observations: "Application de glace, surveillance 15 minutes",
  },
  {
    id: "3",
    numero: 3,
    annee: 2026,
    nomVictime: "Bernard",
    prenomVictime: "Sophie",
    dateAccident: "2026-01-28",
    heureAccident: "09:45",
    lieuAccident: "Bureau administratif - 2ème étage",
    circonstances: "Heurt contre un meuble en se déplaçant, petit hématome",
    natureLesions: "Hématome superficiel",
    siegeLesions: "Tibia droit",
    soignant: "Dr. Laurent Mercier",
    signatureSoignant: true,
    signatureVictime: true,
    signatureSoignantDate: "2026-01-28",
    signatureVictimeDate: "2026-01-28",
    signatureSoignantImage: "",
    signatureVictimeImage: "",
    dateInscription: "2026-01-28T10:12:00",
    observations: "Aucun soin nécessaire, surveillance recommandée",
  },
];
