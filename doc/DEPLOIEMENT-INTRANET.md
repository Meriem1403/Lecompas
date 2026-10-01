# Déploiement Lecompas en intranet (serveur / NAS)

## Étape 1 — Prérequis

- Docker et Docker Compose sur le serveur (Synology Container Manager ou Linux)
- IP fixe intranet (ex. `10.13.186.8`)
- Ports : `8080` (app), `8000` (API), PostgreSQL en interne uniquement

## Étape 2 — Configuration

```bash
cp .env.example .env
```

Éditer `.env` :

- `PUBLIC_HOST` = IP ou nom DNS interne
- `POSTGRES_PASSWORD` = mot de passe fort
- `VITE_API_BASE=http://VOTRE_IP:8000/make-server-cfb78916`
- `CORS_ORIGINS=http://VOTRE_IP:8080`

## Étape 3 — Lancer la stack production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Accès :

- **Application** : `http://VOTRE_IP:8080`
- **API santé** : `http://VOTRE_IP:8000/make-server-cfb78916/health`

Comptes initiaux (base `backend/db/init.sql`) :

| Email | Mot de passe |
|-------|----------------|
| admin@dirm-med.gouv.fr | admin123 |
| chef@dirm-med.gouv.fr | chef123 |
| agent@dirm-med.gouv.fr | agent123 |

Changez ces mots de passe avant la mise en service.

## Étape 4 — Vérification

1. Connexion avec `admin@dirm-med.gouv.fr` / `admin123`
2. Ouvrir **Gestion des risques** — les risques viennent de la **base serveur**
3. Modifier un risque depuis un second PC : la modification doit être visible après rechargement

## Étape 5 — Reverse proxy Synology (optionnel)

Panneau de configuration → Portail de connexion → Proxy inverse :

- Source : `http://lecompas.intranet:80`
- Destination : `http://localhost:8080`

Ajouter un enregistrement DNS ou une entrée `hosts` : `VOTRE_IP lecompas.intranet`

## Étape 6 — GitHub (mises à jour)

1. Installer un **runner self-hosted** sur le NAS ou un PC du réseau DIRM
2. Workflow `.github/workflows/deploy-intranet.yml` (job `deploy` avec `runs-on: self-hosted`)
3. `git push` sur `main` → tests cloud + déploiement sur le serveur

## Mode développement local

```bash
docker compose up --build
```

Frontend dev : http://localhost:5174 — pour activer l’API en local, définir dans `.env` ou docker-compose :

```
VITE_USE_BACKEND_API=true
VITE_ALLOW_DEMO_LOGIN=true
```

## Netlify (démo publique)

Le build Netlify désactive l’API (`VITE_USE_BACKEND_API=false`) et garde la connexion démo.

## Prochaines étapes produit

- [x] Hash bcrypt des mots de passe (upgrade automatique à la connexion)
- [x] CRUD `/users` (lecture : utilisateurs connectés ; écriture : admin)
- [x] Actions, accidents, notifications (KV PostgreSQL + sync frontend)
- [x] Retours d’action (`/action-returns`)
- [x] Données applicatives (`/app-data/*`) : organisation, droits, références risques, fiches, sensibilisation, protocoles, plans de prévention, repas, PAPRIPACT
- [x] Réconciliation des suppressions sur les collections synchronisées
- [ ] Registre accidents bénins (vue séparée) — encore locale
- [ ] Sauvegardes PostgreSQL planifiées
