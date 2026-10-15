# Déploiement Lecompas en intranet (serveur / NAS)

Plan détaillé (périmètre prod, tests, suivi) : [PLAN-MISE-EN-PROD.md](./PLAN-MISE-EN-PROD.md)

## Étape 1 — Prérequis

- Docker et Docker Compose sur le serveur (Synology Container Manager ou Linux)
- IP fixe intranet (ex. `10.13.186.8`)
- Ports sur le NAS (ex. **NAS-APPLI**, sans conflit avec Atlantide sur **5433**) :

  | Service | Port hôte Lecompas |
  |---------|-------------------|
  | Frontend | **5174** |
  | Backend API | **8000** |
  | PostgreSQL | **5436** (`POSTGRES_HOST_PORT`) |

  Les conteneurs backend/db communiquent en interne (PostgreSQL reste **5432** dans le réseau Docker).

## Étape 2 — Configuration

```bash
cp .env.example .env
```

Éditer `.env` :

- `PUBLIC_HOST` = IP ou nom DNS interne
- `POSTGRES_PASSWORD` = mot de passe fort
- `POSTGRES_HOST_PORT=5436` (ne pas utiliser 5433 si Atlantide est sur le même NAS)
- `FRONTEND_PORT=5174` et `BACKEND_PORT=8000`
- `VITE_API_BASE=http://VOTRE_IP:8000/make-server-cfb78916`
- `CORS_ORIGINS=http://VOTRE_IP:5174` (même port que le frontend)
- `VITE_USE_BACKEND_API=true`
- `VITE_ALLOW_DEMO_LOGIN=false`

## Étape 3 — Lancer la stack production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Accès :

- **Application** : `http://VOTRE_IP:5174` (ou la valeur de `FRONTEND_PORT`)
- **API santé** : `http://VOTRE_IP:8000/make-server-cfb78916/health`

Comptes initiaux (base `backend/db/init.sql`) :

| Email | Mot de passe |
|-------|----------------|
| admin@dirm-med.gouv.fr | admin123 |
| chef@dirm-med.gouv.fr | chef123 |
| agent@dirm-med.gouv.fr | agent123 |

Changez ces mots de passe avant la mise en service (via **Administration → utilisateurs** ; `init.sql` ne s’applique qu’à une base **vide** au premier démarrage).

Contrôle automatique après déploiement :

```bash
chmod +x scripts/go-live-check.sh
./scripts/go-live-check.sh
```

## Étape 4 — Vérification fonctionnelle (checklist)

1. Connexion admin — token API (pas `token-*` démo).
2. **Risques** — création / modification visible depuis un second poste.
3. **Plan d’action** — idem.
4. **Accidentologie** + **registre bénin** — persistance serveur.
5. **Retours d’action** — validation admin conservée.
6. **Administration** — services, domaines, sites, catégories, comptes.
7. **Protocoles / plans de prévention / fiches sécurité** — rechargement après déconnexion.
8. **Documents / archives / actualités / Cerbère** — données partagées.
9. **Visites médicales / registre SST** — persistance serveur (`/app-data/*`).
10. **Mercure / amiante (diagnostics, attestations, déclarations) / arrivées-départs** — persistance serveur (`/app-data/*`).
11. **Paramètres → notifications** — préférences par utilisateur (`notificationPreferencesByUser`).
12. **Tests automatisés** — `npm run test:verify` (build, unitaires, smoke API avec Docker, E2E démo + E2E intranet API).

## Étape 5 — Sauvegardes PostgreSQL

```bash
./scripts/backup-postgres.sh
```

Planifier via cron (ex. quotidien) sur le serveur. Les fichiers `.sql.gz` sont créés dans `backups/postgres/` (configurable via `BACKUP_DIR` dans `.env`).

Restauration (exemple) :

```bash
gunzip -c backups/postgres/lecompas-YYYYMMDD-HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U lecompas -d lecompas
```

## Étape 6 — Reverse proxy Synology (optionnel)

Panneau de configuration → Portail de connexion → Proxy inverse :

- Source : `http://lecompas.intranet:80`
- Destination : `http://localhost:5174` (ou `FRONTEND_PORT` du `.env`)

Ajouter un enregistrement DNS ou une entrée `hosts` : `VOTRE_IP lecompas.intranet`

Mettre à jour `CORS_ORIGINS` et `VITE_API_BASE` si l’URL publique change.

## Étape 7 — GitHub (mises à jour)

1. Installer un **runner self-hosted** sur le NAS ou un PC du réseau DIRM
2. Workflow `.github/workflows/deploy-intranet.yml` (job `deploy` avec `runs-on: self-hosted`)
3. `git push` sur `main` → tests cloud + déploiement sur le serveur

## Mode développement local

```bash
docker compose up --build
```

Frontend dev : http://localhost:5174 — pour activer l’API en local :

```
VITE_USE_BACKEND_API=true
VITE_ALLOW_DEMO_LOGIN=true
```

## Netlify (démo publique)

Le build Netlify désactive l’API (`VITE_USE_BACKEND_API=false`) et garde la connexion démo.

## Données persistées (mode intranet)

| Domaine | API |
|---------|-----|
| Utilisateurs | PostgreSQL + `/users` |
| Risques, actions, accidents, notifications, retours d’action | Collections KV |
| Organisation (services, domaines, sites, catégories), droits, DUERP annexes, visites médicales, registre SST, rôles admin, etc. | `/app-data/*` |

## État produit

- [x] Parcours DUERP / accidentologie / action partagés en base
- [x] Registre accidents bénins, documents, archives, actualités, Cerbère, visites médicales, registre SST
- [x] Script de sauvegarde PostgreSQL
- [x] Script de contrôle go-live (`scripts/go-live-check.sh`)
- [x] Paramètres → **notifications** persistées (`notificationPreferencesByUser`)
- [ ] Paramètres UI (organisation, SMTP, apparence) — local navigateur
