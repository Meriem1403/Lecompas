# Plan de mise en production — Lecompas

Document de référence pour rendre **tous les onglets** utilisables **au même niveau** : fonctionnellement aboutis, **persistés sur le serveur** en mode intranet, et **testés** avant mise à disposition des utilisateurs.

## Définition de « au même niveau »

| Inclus | Exclu |
|--------|--------|
| Chaque module du menu est **utilisable de bout en bout** (pas de données figées uniquement dans le navigateur). | **Pas de refonte des rôles** ni des règles d’habilitation déjà en place. |
| Données **partagées** entre postes via API + PostgreSQL (`/app-data/*`, collections KV, `/users`). | Pas d’uniformisation des droits entre admin / chef / agent. |
| **Tests** (build, unitaires, E2E ciblés) + checklist go-live. | Pas de nouveau modèle RBAC. |
| Exploitation documentée (`.env`, Docker prod, sauvegardes). | |

Les différences **agent / chef de service / administrateur** (lecture seule, validation, administration) **restent celles du code actuel** et de la **Gestion des accès** existante.

---

## État des lieux (référence)

### Déjà conforme (serveur + parcours métier)

- DUERP : évaluation risques, retours d’action, sensibilisation, plans de prévention, protocoles, fiches sécurité, plan d’action, documents, archives, accidentologie, registre accidents, signature DUERP.
- Communication : actualités.
- Informatique : Cerbère.
- RH : visites médicales, registre SST.
- Administration : organisation, utilisateurs (annuaire), référentiels, rôles admin (app-data), gestion des accès.

### Finalisé (persistance serveur)

| Module | Clé `/app-data` |
|--------|-----------------|
| Campagnes mercure | `mercuryCampaigns` |
| Diagnostics amiante | `asbestosInterventions` |
| Attestations amiante | `asbestosAttestations` |
| Déclarations amiante | `asbestosDeclarations` |
| Arrivées & départs | `rhArriveesDepartsDemandes`, `rhArriveesDepartsQuestionnaires` |
| Paramètres (notifications) | `notificationPreferencesByUser` |

### Paramètres (hors notifications)

Organisation, SMTP, sécurité, apparence : **local navigateur** (documenté dans l’UI).

### Dashboard

Indicateurs basés sur `visibleRisks` (périmètre utilisateur) + message si périmètre vide.

---

## Phases de réalisation

### Phase 1 — Persistance des modules restants

Pour chaque module listé ci-dessus :

1. Ajouter la clé dans `src/app/services/appDataApi.ts`.
2. Enregistrer dans `APP_DATA_REGISTRY` (`backend/server.js`) avec `adminOnlyWrite` cohérent avec les autres modules RH/environnement (écriture authentifiée, pas réservée admin sauf données de référence).
3. Remplacer `useState(initial…)` par `useAppDataDocumentStore` (ou le même pattern que `SafetyProtocolView` / `MedicalVisitsView`).
4. Passer `accessToken` depuis `App.tsx`.
5. Conserver les jeux `initial*` / `mock*` comme **seed** au premier enregistrement API.

**Clés prévues :**

- `mercuryCampaigns`
- `asbestosInterventions`
- `asbestosAttestations`
- `rhArriveesDepartsDemandes`
- `rhArriveesDepartsQuestionnaires`
- `userNotificationPreferences` (objet indexé par `userId` ou clé dédiée par utilisateur selon implémentation retenue)

**Critère d’acceptation :** création ou modification sur le poste A → visible après reconnexion sur le poste B (même compte ou compte autorisé selon le module).

### Phase 2 — Complétude fonctionnelle & cohérence

- Brancher ou retirer `AsbestosDeclarationView`.
- Dashboard : pas de compteurs incohérents ; messages explicites si périmètre vide (risques filtrés par service/domaine/lieu — **comportement inchangé**).
- Paramètres : limiter la persistance serveur aux préférences utiles (ex. notifications) ; documenter le reste comme local navigateur.
- Vérifier que chaque onglet du menu a un `activeView` + route dans `paths.ts` (sans ajouter de nouveaux rôles).

### Phase 3 — Tests

| Niveau | Contenu |
|--------|---------|
| Build | `npm run build` (CI) |
| Unitaires | `npm run test:unit` |
| E2E Playwright | Login ; accueil ; 1 parcours admin ; 1 parcours agent (actualités, risques, SST) ; après phase 1 : mercure ou amiante + arrivées-départs |
| Manuel intranet | Checklist `DEPLOIEMENT-INTRANET.md` complétée sur environnement Docker prod |

### Phase 4 — Mise en service (exploitation)

Sans modifier les rôles :

1. `.env` prod : `VITE_USE_BACKEND_API=true`, `VITE_ALLOW_DEMO_LOGIN=false` (rebuild frontend si changement).
2. `docker compose -f docker-compose.prod.yml up -d --build`.
3. `./scripts/go-live-check.sh` (API `/health`, frontend, PostgreSQL).
4. Changer mots de passe seed (UI admin ; pas via `init.sql` si la base existe déjà).
5. Créer les comptes réels (login PostgreSQL + fiche annuaire, **même e-mail**).
6. Aligner organisation (services, domaines, lieux) et données risques avec le périmètre des agents.
7. Sauvegardes Postgres (`scripts/backup-postgres.sh` + cron).
8. Reverse proxy / DNS interne si besoin ; mettre à jour `CORS_ORIGINS` et `VITE_API_BASE`.
9. Checklist manuelle [DEPLOIEMENT-INTRANET.md](./DEPLOIEMENT-INTRANET.md) étape 4 (tous rôles).

---

## Checklist go-live (tous utilisateurs)

### Technique

- [ ] Stack Docker prod stable (`/health` OK).
- [ ] Tous les modules du menu : persistance serveur validée (phase 1).
- [ ] Aucune régression build / tests.

### Comptes (rôles existants uniquement)

- [ ] Chaque utilisateur : compte login + annuaire (e-mail identique).
- [ ] Rôle `admin`, `chef_service` ou `agent` selon la fiche — **sans changer les règles applicatives**.
- [ ] Profils « Gestion des accès » configurés si la DIRM restreint des modules (optionnel, hors scope dev).

### Fonctionnel par rôle (tests manuels)

- [ ] **Agent** : connexion, accueil, modules autorisés aujourd’hui (lecture/écriture selon écrans existants).
- [ ] **Chef de service** : idem + validations prévues (retours, amiante, etc.).
- [ ] **Admin** : administration + validations Cerbère / retours d’action.

### Documentation

- [ ] `DEPLOIEMENT-INTRANET.md` à jour.
- [ ] Ce plan : cases cochées au fil de l’avancement.

---

## Suivi d’avancement

| Phase | Statut | Notes |
|-------|--------|-------|
| 1 — Persistance modules | ☑ | Tous modules menu (dont déclarations amiante) |
| 2 — Complétude fonctionnelle | ☑ | Dashboard périmètre, paramètres documentés, routes OK |
| 3 — Tests | ☑ | `npm run test:verify` (build, unitaires, smoke API Docker, E2E démo + intranet API) |
| 4 — Go-live | ◐ | Script `go-live-check.sh`, healthchecks Docker, smoke CI ; reste : comptes réels + checklist manuelle sur le NAS |

---

## Ordre d’implémentation recommandé (Phase 1)

1. Arrivées & départs  
2. Campagnes mercure  
3. Diagnostics amiante + attestations amiante  
4. Préférences notifications (paramètres)  
5. Doc + E2E  

---

## Références

- Déploiement : [DEPLOIEMENT-INTRANET.md](./DEPLOIEMENT-INTRANET.md)
- Variables : [.env.example](../.env.example)
- CI : [.github/workflows/deploy-intranet.yml](../.github/workflows/deploy-intranet.yml)
