CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  service TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kv_store_cfb78916 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO users(id, email, password, name, role, service) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@dirm-med.gouv.fr', 'admin123', 'Jean-Marc DUBOIS', 'admin', 'Direction'),
('22222222-2222-2222-2222-222222222222', 'chef@dirm-med.gouv.fr', 'chef123', 'Marie MARTIN', 'chef_service', 'Secrétariat Général'),
('33333333-3333-3333-3333-333333333333', 'agent@dirm-med.gouv.fr', 'agent123', 'Pierre LECLERC', 'agent', 'Service Technique')
ON CONFLICT (id) DO NOTHING;

INSERT INTO kv_store_cfb78916(key, value) VALUES
('user:11111111-1111-1111-1111-111111111111', '{"id":"11111111-1111-1111-1111-111111111111","email":"admin@dirm-med.gouv.fr","name":"Jean-Marc DUBOIS","role":"admin","service":"Direction","createdAt":"2026-01-01T00:00:00.000Z"}'::jsonb),
('user:22222222-2222-2222-2222-222222222222', '{"id":"22222222-2222-2222-2222-222222222222","email":"chef@dirm-med.gouv.fr","name":"Marie MARTIN","role":"chef_service","service":"Secrétariat Général","createdAt":"2026-01-01T00:00:00.000Z"}'::jsonb),
('user:33333333-3333-3333-3333-333333333333', '{"id":"33333333-3333-3333-3333-333333333333","email":"agent@dirm-med.gouv.fr","name":"Pierre LECLERC","role":"agent","service":"Service Technique","createdAt":"2026-01-01T00:00:00.000Z"}'::jsonb),
('risks:list', '["1","2","3","4","5","6"]'::jsonb),
('accidents:list', '["1","2","3","4"]'::jsonb),
('risk:1', $${
  "id":"1","numeroRisque":"RISK-2026-001","title":"Risque de chute sur sol glissant","unite":"Unité Administrative","service":"Service Affaires Maritimes","site":"Siège Marseille",
  "situation":"Sol mouillé dans le couloir principal du bâtiment A suite au nettoyage quotidien",
  "associatedRisk":"Chute de plain-pied pouvant entraîner des traumatismes (entorses, fractures)","category":"mécanique","responsable":"Jean Martin (Responsable HSE)",
  "severity":3,"probability":3,"riskLevel":9,"existingMeasures":["Panneaux de signalisation \"Sol glissant\"","Nettoyage hors heures de pointe","Chaussures antidérapantes fournies au personnel"],
  "moyenMaitrise":"Mesures de prévention collectives et individuelles","calculPriorite":9,"prioriteFinale":6,
  "plannedMeasures":[
    {"description":"Installation de tapis antidérapants dans les zones à risque","responsible":"Marie Dupont (Services Généraux)","deadline":"2026-03-15","status":"in_progress"},
    {"description":"Formation du personnel de nettoyage sur les techniques de séchage rapide","responsible":"Jean Martin (Responsable HSE)","deadline":"2026-02-28","status":"completed","completedDate":"2026-01-20","effectiveness":"Temps de séchage réduit de 40%, aucune chute constatée depuis"}
  ],
  "status":"en_cours","echeance":"2026-03-31","retourAction":"Formation effectuée avec succès. Installation en cours.",
  "observation":"Amélioration significative constatée depuis la mise en place des mesures","createdAt":"2025-12-15T10:00:00Z","updatedAt":"2026-01-20T15:30:00Z"
}$$::jsonb),
('risk:2', $${
  "id":"2","numeroRisque":"RISK-2026-002","title":"Exposition aux produits chimiques - Atelier","unite":"Unité Technique","service":"Service Technique","site":"Port de Marseille",
  "situation":"Manipulation quotidienne de solvants et produits chimiques dans l'atelier de peinture sans ventilation adéquate",
  "associatedRisk":"Intoxication par inhalation, brûlures chimiques, dermatoses professionnelles","category":"chimique","responsable":"Pierre Leclerc (Chef de service)",
  "severity":4,"probability":3,"riskLevel":12,"existingMeasures":["EPI : gants nitrile, masque FFP2","Fiches de données de sécurité disponibles","Formation annuelle manipulation produits chimiques","Douche de sécurité installée"],
  "moyenMaitrise":"EPI, ventilation, formation et substitution de produits","calculPriorite":12,"prioriteFinale":8,
  "plannedMeasures":[
    {"description":"Installation d'un système de ventilation VMC dans l'atelier","responsible":"Pierre Leclerc (Maintenance)","deadline":"2026-04-30","status":"pending"},
    {"description":"Remplacement des solvants par des produits moins toxiques","responsible":"Sophie Bernard (Achats)","deadline":"2026-06-15","status":"pending"},
    {"description":"Mise en place d'une surveillance médicale renforcée","responsible":"Dr. Laurent (Médecin du travail)","deadline":"2026-03-01","status":"in_progress"}
  ],
  "status":"identifié","echeance":"2026-06-30","retourAction":"Surveillance médicale en cours. Étude de substitution lancée.",
  "observation":"Risque prioritaire nécessitant une action rapide","createdAt":"2025-11-10T08:00:00Z","updatedAt":"2026-01-15T09:00:00Z"
}$$::jsonb),
('risk:3', $${
  "id":"3","numeroRisque":"RISK-2026-003","title":"Travail en hauteur - Maintenance toiture","unite":"Unité Maintenance","service":"Service Technique","site":"Port de Toulon",
  "situation":"Interventions de maintenance sur toiture plate à 8 mètres de hauteur sans système antichute permanent",
  "associatedRisk":"Chute de hauteur avec risque de blessures graves voire mortelles","category":"mécanique","responsable":"Marc Durand (Responsable travaux)",
  "severity":4,"probability":2,"riskLevel":8,"existingMeasures":["Harnais de sécurité individuel","Ligne de vie temporaire","Autorisation de travail en hauteur obligatoire","Formation travail en hauteur validée","Contrôle visuel des EPI avant chaque intervention"],
  "moyenMaitrise":"Protection collective et individuelle, autorisation de travail","calculPriorite":8,"prioriteFinale":4,
  "plannedMeasures":[
    {"description":"Installation de lignes de vie permanentes sur toute la toiture","responsible":"Marc Durand (Travaux)","deadline":"2026-05-30","status":"in_progress"},
    {"description":"Mise en place de garde-corps permanents aux zones d'accès","responsible":"Marc Durand (Travaux)","deadline":"2026-05-30","status":"pending"}
  ],
  "status":"en_cours","echeance":"2026-05-31","retourAction":"Travaux de sécurisation en cours. Livraison prévue dans les délais.",
  "observation":"Investissement important nécessaire pour la sécurité","createdAt":"2025-10-05T14:00:00Z","updatedAt":"2026-01-10T11:00:00Z"
}$$::jsonb),
('risk:4', $${
  "id":"4","numeroRisque":"RISK-2026-004","title":"Risques psychosociaux - Service client","unite":"Unité Administrative","service":"Service Formation","site":"Siège Marseille",
  "situation":"Charge de travail élevée au service client avec pics d'activité réguliers, clients agressifs, objectifs de performance élevés",
  "associatedRisk":"Stress chronique, burn-out, troubles anxieux, démotivation, turnover élevé","category":"psychosocial","responsable":"Anne Petit (Manager Service Client)",
  "severity":3,"probability":4,"riskLevel":12,"existingMeasures":["Entretiens annuels d'évaluation","Cellule d'écoute psychologique","Droit à la déconnexion","Formation gestion du stress"],
  "moyenMaitrise":"Organisation du travail, soutien psychologique, formation","calculPriorite":12,"prioriteFinale":6,
  "plannedMeasures":[
    {"description":"Embauche de 2 conseillers supplémentaires pour réduire la charge","responsible":"Claire Dubois (RH)","deadline":"2026-03-31","status":"in_progress"},
    {"description":"Mise en place de pause relaxation 10 min/jour","responsible":"Anne Petit (Manager Service Client)","deadline":"2026-02-15","status":"completed","completedDate":"2026-02-01","effectiveness":"Retours positifs des équipes, baisse de 25% des arrêts maladie"},
    {"description":"Réorganisation des plannings pour mieux répartir les pics","responsible":"Anne Petit (Manager Service Client)","deadline":"2026-02-28","status":"in_progress"}
  ],
  "status":"en_cours","echeance":"2026-03-31","retourAction":"Mesures en cours d'application. Amélioration déjà constatée.",
  "observation":"Suivi régulier nécessaire avec les équipes RH","createdAt":"2025-09-20T09:00:00Z","updatedAt":"2026-02-01T16:00:00Z"
}$$::jsonb),
('risk:5', $${
  "id":"5","numeroRisque":"RISK-2026-005","title":"Troubles musculo-squelettiques - Postes de travail bureau","unite":"Unité Administrative","service":"Service Administratif","site":"Siège Marseille",
  "situation":"Postes de travail sur écran non ergonomiques, sièges inadaptés, absence de matériel ergonomique",
  "associatedRisk":"TMS (tendinites, lombalgies, cervicalgies), fatigue visuelle","category":"ergonomique","responsable":"Sophie Bernard (Responsable Achats)",
  "severity":2,"probability":4,"riskLevel":8,"existingMeasures":["Écrans ajustables en hauteur","Formation gestes et postures","Pauses recommandées toutes les 2h"],
  "moyenMaitrise":"Aménagement ergonomique des postes, formation","calculPriorite":8,"prioriteFinale":4,
  "plannedMeasures":[
    {"description":"Remplacement de tous les sièges par des sièges ergonomiques","responsible":"Sophie Bernard (Achats)","deadline":"2026-04-15","status":"pending"},
    {"description":"Fourniture de souris et claviers ergonomiques","responsible":"Sophie Bernard (Achats)","deadline":"2026-03-30","status":"pending"},
    {"description":"Audit ergonomique de tous les postes de travail","responsible":"Cabinet ERGOCONFORT","deadline":"2026-02-28","status":"in_progress"}
  ],
  "status":"identifié","echeance":"2026-04-30","retourAction":"Audit en cours. Commandes prévues selon recommandations.",
  "observation":"Amélioration progressive du confort de travail","createdAt":"2025-12-01T10:00:00Z","updatedAt":"2026-01-10T14:00:00Z"
}$$::jsonb),
('risk:6', $${
  "id":"6","numeroRisque":"RISK-2026-006","title":"Risque électrique - Armoires électriques","unite":"Unité Maintenance","service":"Service Technique","site":"Siège Marseille",
  "situation":"Armoires électriques vétustes dans le sous-sol, certaines portes ne ferment plus correctement",
  "associatedRisk":"Électrisation, électrocution, incendie d'origine électrique","category":"électrique","responsable":"Pierre Leclerc (Chef maintenance)",
  "severity":4,"probability":2,"riskLevel":8,"existingMeasures":["Habilitations électriques du personnel","Signalisation danger électrique","Vérifications annuelles réglementaires","Consignation avant intervention"],
  "moyenMaitrise":"Habilitation, signalisation, vérifications périodiques","calculPriorite":8,"prioriteFinale":3,
  "plannedMeasures":[
    {"description":"Remplacement complet des armoires électriques du sous-sol","responsible":"Entreprise ELEC PRO","deadline":"2026-06-30","status":"pending"},
    {"description":"Mise en place de verrous à clé sur toutes les armoires","responsible":"Pierre Leclerc (Maintenance)","deadline":"2026-03-15","status":"in_progress"}
  ],
  "status":"identifié","echeance":"2026-06-30","retourAction":"Appel d'offres lancé pour le remplacement. Sécurisation temporaire en cours.",
  "observation":"Risque grave nécessitant une attention prioritaire","createdAt":"2025-11-20T11:00:00Z","updatedAt":"2026-01-12T10:00:00Z"
}$$::jsonb),
('accident:1', '{"id":"1","date":"2026-01-25","title":"Chute dans escalier - blessure cheville","description":"L''employée descendait l''escalier principal en portant un carton. Elle a manqué une marche et s''est tordu la cheville. Transport aux urgences, diagnostic : entorse cheville gauche grade 2.","severity":"modéré","type":"travail","victim":"Amélie Rousseau","location":"Escalier principal, 2ème étage","witnesses":["Thomas Blanchard","Julie Mercier"],"measures":"Arrt de travail 15 jours. Main courante renforcée. Rappel : ne pas porter de charges lourdes dans les escaliers.","createdAt":"2026-01-25T14:30:00Z"}'::jsonb),
('accident:2', '{"id":"2","date":"2026-01-18","title":"Brûlure chimique - projection produit","description":"Lors du transvasement d''un produit de nettoyage concentré, projection dans l''œil malgré le port de lunettes. Rinçage immédiat au poste de rinçage oculaire pendant 15 minutes.","severity":"grave","type":"travail","victim":"Carlos Mendes","location":"Local produits chimiques, Bâtiment B","witnesses":["Fatima El Amrani"],"measures":"Transport SAMU. Bilan ophtalmologique : brûlure superficielle cornée. Arrêt 7 jours. Formation complémentaire manipulation produits chimiques programmée. Révision procédure transvasement.","createdAt":"2026-01-18T10:15:00Z"}'::jsonb),
('accident:3', '{"id":"3","date":"2026-01-10","title":"Accident de trajet - collision routière","description":"Accident de la route sur le trajet domicile-travail. Collision avec un autre véhicule à un carrefour.","severity":"modéré","type":"trajet","victim":"Stéphane Moreau","location":"Carrefour Avenue de la République / Rue Victor Hugo","witnesses":[],"measures":"Déclaration accident de trajet. Arrêt de travail 21 jours. Fracture côte + contusions multiples. Suivi médical en cours.","createdAt":"2026-01-10T08:45:00Z"}'::jsonb),
('accident:4', '{"id":"4","date":"2026-01-05","title":"Coupure main - manipulation carton","description":"Coupure profonde à la main droite lors de l''ouverture d''un carton avec un cutter. Lame a dérapé.","severity":"bénin","type":"travail","victim":"Nadia Benali","location":"Réserve, rez-de-chaussée","witnesses":["Karim Ziani"],"measures":"Soins infirmerie. Suture 3 points au centre de soins. Arrêt de travail 3 jours. Rappel : utiliser les cutters de sécurité avec lame rétractable.","createdAt":"2026-01-05T15:20:00Z"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
