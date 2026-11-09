export interface RiskSheetCopy {
  description: string;
  situations: string;
  dommages: string;
  prevention: string;
}

const GENERIC: RiskSheetCopy = {
  description: "Danger identifié dans le référentiel. La fiche précise le contexte du service.",
  situations: "L'exposition dépend de l'activité, du lieu et des moyens réellement utilisés.",
  dommages: "Blessure, atteinte à la santé ou aggravation d'un trouble déjà présent.",
  prevention: "Repérer la situation, appliquer les mesures prévues et signaler ce qui manque.",
};

/** Repères courts pour la consultation. Le texte saisi sur la fiche remplace ces repères. */
const SHEETS: Record<string, RiskSheetCopy> = {
  "1": {
    description: "L'amiante reste dangereux dès qu'un matériau est percé, poncé ou cassé.",
    situations: "Travaux sur flocages, dalles, calorifuge ou toiture d'un bâtiment ancien.",
    dommages: "Maladies respiratoires graves, souvent longues à apparaître.",
    prevention: "Ne pas intervenir sans diagnostic. Porter la protection prévue et confiner la zone.",
  },
  "2": {
    description: "Des agents biologiques peuvent être présents dans l'eau, les déchets ou les locaux.",
    situations: "Contact avec eaux usées, locaux souillés, personnes malades ou échantillons.",
    dommages: "Infections, allergies ou maladies transmissibles.",
    prevention: "Gants, hygiène des mains, vaccinations prévues et plaie protégée.",
  },
  "3": {
    description: "Un produit chimique peut être inhalé, touché ou projeté.",
    situations: "Transvasement, nettoyage, stockage ouvert ou mélange de produits.",
    dommages: "Brûlure, irritation, intoxication ou allergie.",
    prevention: "Lire l'étiquette, aérer, porter les gants et lunettes indiqués, ne pas mélanger.",
  },
  "4": {
    description: "Certains produits sont cancérogènes, mutagènes ou toxiques pour la reproduction.",
    situations: "Usage régulier d'un produit classé CMR, même en petite quantité.",
    dommages: "Atteinte grave à la santé, parfois sans signe immédiat.",
    prevention: "Remplacer le produit si possible, limiter la quantité et suivre la fiche de données.",
  },
  "5": {
    description: "Une surface, un liquide ou une vapeur très chaude brûle au contact.",
    situations: "Proximité d'un moteur, d'une canalisation, d'un four ou d'un liquide chaud.",
    dommages: "Brûlure de la peau ou des voies respiratoires.",
    prevention: "Gants adaptés, écran, consignation avant intervention et signaler la zone chaude.",
  },
  "6": {
    description: "Le courant électrique traverse le corps dès qu'un contact ferme le circuit.",
    situations: "Tableau ouvert, câble abîmé, local humide ou intervention sans consignation.",
    dommages: "Électrisation, brûlure interne, chute liée au choc.",
    prevention: "Seul un intervenant habilité agit. Consigner, vérifier l'absence de tension.",
  },
  "7": {
    description: "Un mélange air-gaz ou des poussières peut s'enflammer d'un seul coup.",
    situations: "Local confiné, fuite, étincelle, point chaud ou produit inflammable ouvert.",
    dommages: "Brûlures, blast, projections et incendie.",
    prevention: "Supprimer les sources d'ignition, ventiler et respecter les zones classées.",
  },
  "8": {
    description: "Un feu se propage vite s'il trouve du combustible et n'est pas contenu.",
    situations: "Stockage anarchique, prise surchargée, travaux par point chaud.",
    dommages: "Brûlures, fumées toxiques, évacuation d'urgence.",
    prevention: "Dégager les issues, connaître l'extincteur proche et ne pas encombrer les circulations.",
  },
  "9": {
    description: "Une source lumineuse intense ou un laser peut atteindre l'œil en un instant.",
    situations: "Éclairage très lumineux, soudage, pointeur ou appareil optique mal réglé.",
    dommages: "Éblouissement, lésion de la rétine ou de la peau.",
    prevention: "Ne pas viser les yeux, porter le filtre prévu et baliser la zone.",
  },
  "10": {
    description: "Un produit pyrotechnique réagit fortement à un choc, à la chaleur ou à une étincelle.",
    situations: "Manutention, stockage ou tir sans le périmètre prévu.",
    dommages: "Brûlure, blast, projection de fragments.",
    prevention: "Respecter les quantités, les distances et le mode opératoire du tir.",
  },
  "11": {
    description: "Un outil à main ou portatif peut riper, casser ou projeter un éclat.",
    situations: "Découpe, perçage, serrage en force ou outil en mauvais état.",
    dommages: "Coupure, piqûre, corps étranger dans l'œil.",
    prevention: "Outil adapté et entretenu, pièce bien tenue, lunettes si projection.",
  },
  "12": {
    description: "Un automatisme peut se remettre en mouvement sans geste visible.",
    situations: "Portail, convoyeur, vanne ou machine avec redémarrage automatique.",
    dommages: "Happement, écrasement, choc.",
    prevention: "Consigner avant d'entrer dans la zone et ne pas shunter une sécurité.",
  },
  "13": {
    description: "Un fluide sous pression peut fuir ou faire éclater un équipement.",
    situations: "Flexible usé, vanne ouverte trop vite, récipient hors contrôle.",
    dommages: "Projection, coupure, brûlure ou explosion du contenant.",
    prevention: "Purger, vérifier l'état du flexible et rester hors du jet.",
  },
  "14": {
    description: "Répéter le même geste fatigue les tendons et les articulations.",
    situations: "Saisie, clavier, vissage ou manutention légère faite longtemps.",
    dommages: "Douleurs, tendinites, troubles musculosquelettiques.",
    prevention: "Alterner les tâches, régler le poste et faire des pauses courtes.",
  },
  "15": {
    description: "Une posture maintenue trop longtemps charge le dos, la nuque ou les épaules.",
    situations: "Écran mal placé, travail au sol, bras levés ou station debout fixe.",
    dommages: "Douleurs, raideurs, fatigue qui s'installe.",
    prevention: "Régler le siège et l'écran, changer de position, rapprocher le travail.",
  },
  "16": {
    description: "Les rayonnements ionisants et certains champs électromagnétiques traversent les protections ordinaires.",
    situations: "Source radioactive, appareil de contrôle, antenne ou zone balisée.",
    dommages: "Atteinte des tissus, effets à long terme selon la dose.",
    prevention: "Rester hors zone sans habilitation, respecter le temps et la distance.",
  },
  "17": {
    description: "Porter, tirer ou pousser une charge sollicite le dos et les bras.",
    situations: "Carton, bidon, matériel de bord déplacé à la main.",
    dommages: "Lombalgie, chute de la charge, écrasement des pieds.",
    prevention: "Plier les jambes, rapprocher la charge, demander de l'aide ou un chariot.",
  },
  "18": {
    description: "Un levage mécanique peut décrocher, balancer ou coincer une personne.",
    situations: "Palan, grue, chariot ou élingue utilisée hors de sa capacité.",
    dommages: "Écrasement, choc, chute de la charge.",
    prevention: "Charge arrimée, personne formée, personne hors de la trajectoire.",
  },
  "19": {
    description: "Une pièce en mouvement peut happer un vêtement, une main ou un cheveu.",
    situations: "Arbre tournant, engrenage, porte ou capot ouvert en marche.",
    dommages: "Coupure, fracture, happement.",
    prevention: "Protecteurs en place, vêtements ajustés, arrêt avant toute approche.",
  },
  "20": {
    description: "Dans un espace confiné, l'air peut manquer ou devenir toxique sans signe évident.",
    situations: "Cuve, cale, local technique fermé, fosse ou puits.",
    dommages: "Malaise, asphyxie, intoxication.",
    prevention: "Ne jamais entrer seul. Contrôler l'atmosphère et garder un surveillant dehors.",
  },
  "21": {
    description: "Un objet mal rangé ou mal arrimé peut tomber sur une personne.",
    situations: "Étagère chargée, matériel posé en hauteur, mer agitée à bord.",
    dommages: "Traumatisme de la tête, des épaules ou des pieds.",
    prevention: "Ranger au plus bas ce qui est lourd, arrimer et porter un casque si la zone l'exige.",
  },
  "22": {
    description: "La plupart des chutes se font de plain-pied, sur un sol glissant ou encombré.",
    situations: "Sol mouillé, câble au sol, marche mal vue, chaussures inadaptées.",
    dommages: "Entorse, fracture, coup à la tête.",
    prevention: "Garder les circulations libres, essuyer les flaques, tenir la rampe.",
  },
  "23": {
    description: "Travailler au-dessus du sol expose à une chute dès que l'appui manque.",
    situations: "Échelle, toiture, passerelle, ouverture de plancher, bastingage.",
    dommages: "Chute grave, fractures, traumatisme.",
    prevention: "Garde-corps, harnais attaché à un point prévu, pas d'échelle comme poste de travail.",
  },
  "24": {
    description: "Le chaud ou le froid extrême fatigue le corps avant même le malaise.",
    situations: "Local surchauffé, chambre froide, pont exposé au soleil ou au vent.",
    dommages: "Déshydratation, coup de chaleur, hypothermie, baisse de vigilance.",
    prevention: "Boire, fractionner l'exposition, vêtements adaptés et pause à l'abri.",
  },
  "25": {
    description: "Un éclairage trop faible ou éblouissant fait rater un obstacle ou un détail.",
    situations: "Local sombre, contre-jour, éclairage de secours seul, écran face à une fenêtre.",
    dommages: "Fatigue visuelle, erreur de geste, chute.",
    prevention: "Éclairer la tâche, éviter les contrastes brutaux, signaler une lampe en panne.",
  },
  "26": {
    description: "Un air confiné accumule poussières, solvants ou dioxyde de carbone.",
    situations: "Local sans ouverture, ventilation arrêtée, travaux de peinture ou de soudage.",
    dommages: "Maux de tête, irritation, malaise.",
    prevention: "Aérer avant et pendant, ne pas obturer les bouches, sortir si l'air semble lourd.",
  },
  "27": {
    description: "Le bruit abîme l'ouïe sans douleur immédiate et masque les alarmes.",
    situations: "Local machines, moteur, atelier, port ou open-space très bruyant.",
    dommages: "Fatigue, acouphènes, surdité progressive.",
    prevention: "Protecteurs quand le niveau l'exige, s'éloigner de la source, limiter la durée.",
  },
  "28": {
    description: "L'écran fatigue les yeux et la nuque quand le poste est mal réglé.",
    situations: "Longue lecture, écran trop haut ou trop bas, reflets, pause oubliée.",
    dommages: "Fatigue visuelle, douleurs de nuque et d'épaules.",
    prevention: "Haut de l'écran à hauteur des yeux, pauses, éclairage sans reflet.",
  },
  "29": {
    description: "Les horaires décalés et les astreintes perturbent le sommeil et la vigilance.",
    situations: "Nuit, début très tôt, astreinte après une journée déjà chargée.",
    dommages: "Fatigue, erreurs, troubles du sommeil.",
    prevention: "Prévoir le repos, éviter les enchaînements, signaler une vigilance trop basse.",
  },
  "30": {
    description: "Se déplacer dans le site expose aux heurts, aux sols inégaux et aux véhicules.",
    situations: "Couloir encombré, quai, escalier, croisement avec un engin.",
    dommages: "Choc, chute, écrasement.",
    prevention: "Rester sur les cheminements, voir et être vu, ne pas courir.",
  },
  "31": {
    description: "Une personne seule met plus de temps à être secourue si quelque chose tourne mal.",
    situations: "Visite technique, ronde, intervention hors des heures d'ouverture.",
    dommages: "Aggravation d'un malaise, d'une chute ou d'une agression.",
    prevention: "Prévenir quelqu'un du départ et du retour, emporter un moyen d'alerte.",
  },
  "32": {
    description: "Les vibrations se transmettent par le siège, le pont ou l'outil.",
    situations: "Conduite d'engin, séjour à bord, machine portative tenue longtemps.",
    dommages: "Douleurs du dos, des mains, fatigue.",
    prevention: "Limiter la durée, siège ou poignée en bon état, pauses hors vibration.",
  },
  "33": {
    description: "La charge de travail, les tensions ou l'isolement usent autant qu'un danger physique.",
    situations: "Urgences répétées, manque de marge, conflit, objectif flou.",
    dommages: "Épuisement, anxiété, perte de sommeil, erreurs.",
    prevention: "En parler tôt au responsable ou à un relais prévention, répartir la charge.",
  },
  "34": {
    description: "Le contact avec le public peut devenir tendu, voire agressif.",
    situations: "Accueil, contrôle, refus, intervention sur le terrain.",
    dommages: "Choc, stress, blessure.",
    prevention: "Garder une distance, ne pas rester isolé, alerter dès que la tension monte.",
  },
  "35": {
    description: "Alcool, drogues, médicaments ou tabac modifient les réflexes et le jugement.",
    situations: "Prise avant ou pendant le travail, surtout sur un poste à risque.",
    dommages: "Accident, malaise, dépendance.",
    prevention: "Ne pas travailler sous l'effet d'un produit. Signaler un médicament qui assoupit.",
  },
  "36": {
    description: "Quand plusieurs équipes partagent le même lieu, chacune ignore les dangers de l'autre.",
    situations: "Entreprise extérieure, chantier dans un local occupé, livraison.",
    dommages: "Choc, chute, exposition à un risque non annoncé.",
    prevention: "Plan de prévention, consignes communes, un responsable identifié sur place.",
  },
  "37": {
    description: "Un animal peut mordre, griffer ou transmettre une maladie.",
    situations: "Intervention près d'animaux, locaux occupés, morsure ou déjection.",
    dommages: "Blessure, infection, allergie.",
    prevention: "Ne pas s'approcher sans besoin, gants, laver la plaie et la déclarer.",
  },
  "38": {
    description: "La route reste un risque majeur dès qu'un trajet fait partie du travail.",
    situations: "Mission, fatigue, téléphone, météo, véhicule mal préparé.",
    dommages: "Accident de la circulation, blessures graves.",
    prevention: "Pause, ceinture, pas de téléphone en conduisant, véhicule vérifié.",
  },
  "39": {
    description: "Une infection ou une allergie peut circuler entre collègues ou via le matériel.",
    situations: "Contact proche, objet partagé, plaie, saison épidémique.",
    dommages: "Maladie, réaction allergique, arrêt.",
    prevention: "Mains propres, rester chez soi si contagieux, protéger une plaie.",
  },
  "40": {
    description: "Un événement exceptionnel dépasse l'organisation habituelle.",
    situations: "Tempête, inondation, panne générale, évacuation.",
    dommages: "Blessure pendant l'urgence, stress, dégâts.",
    prevention: "Connaître le point de rassemblement et suivre les consignes du moment.",
  },
  "41": {
    description: "Le télétravail déplace les risques du bureau à la maison.",
    situations: "Poste improvisé, longues journées sans pause, isolement.",
    dommages: "Douleurs, fatigue visuelle, sentiment d'isolement.",
    prevention: "Un vrai plan de travail, des horaires tenus, un contact régulier avec l'équipe.",
  },
  "42": {
    description: "L'eau peut surprendre même un bon nageur, surtout habillé ou fatigué.",
    situations: "Bord de quai, embarquement, pont glissant, chute à l'eau.",
    dommages: "Noyade, hypothermie, choc.",
    prevention: "Gilet là où il est prévu, ne pas courir sur un pont mouillé, alerter tout de suite.",
  },
  "43": {
    description: "Le milieu hyperbare change la pression supportée par le corps.",
    situations: "Intervention en pression, plongée, caisson.",
    dommages: "Accident de décompression, barotraumatisme.",
    prevention: "Personnel autorisé seulement, durées et paliers respectés.",
  },
  "44": {
    description: "Une intervention auprès de personnes en grande précarité peut être tendue et imprévisible.",
    situations: "Contrôle, accueil ou opération sur zone, groupe sous tension.",
    dommages: "Agression, stress aigu, blessure.",
    prevention: "Ne pas y aller seul, garder une issue, appliquer la consigne du service.",
  },
  "45": {
    description: "Le port d'une arme ajoute un danger immédiat en cas de mauvaise manipulation.",
    situations: "Port, remise, nettoyage ou stockage de l'arme de service.",
    dommages: "Blessure par tir accidentel, stress.",
    prevention: "Arme en sécurité, formation à jour, jamais de geste hors procédure.",
  },
};

export function displayRiskSheet(reference: {
  numeroRisque: string;
  description?: string;
  situations?: string;
  dommages?: string;
  prevention?: string;
}): RiskSheetCopy {
  const base = SHEETS[reference.numeroRisque.trim()] ?? GENERIC;
  const pick = (value: string | undefined, fallback: string) => {
    const text = value?.trim() ?? "";
    return text || fallback;
  };
  return {
    description: pick(reference.description, base.description),
    situations: pick(reference.situations, base.situations),
    dommages: pick(reference.dommages, base.dommages),
    prevention: pick(reference.prevention, base.prevention),
  };
}

export function attachmentPreviewKind(
  fileName: string,
  mimeType: string,
): "pdf" | "image" | "none" {
  const mime = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/.test(name)) return "image";
  return "none";
}
