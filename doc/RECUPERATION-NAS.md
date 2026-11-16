# Récupérer cette version sur le NAS

Un `git pull` seul ne change pas le site. Les conteneurs continuent de servir l’ancienne image tant qu’ils ne sont pas reconstruits. Le push sur `main` lance le déploiement. L’action « Deploy intranet » doit être verte, puis le site se vérifie dans une fenêtre privée.

## Ce que contient cette livraison

Ce sont des écrans. Ils n’écrasent pas les comptes, les 478 risques, le PAPRIPACT ni les accidents déjà enregistrés.

- **Signalement.** Le bouton **Signaler** est dans l’en-tête, pour tous les rôles, sur l’accueil, les pages de modules et les écrans de l’application. Il ouvre le formulaire de dépôt. Il ne flotte plus au-dessus des cartes.
- **Suivi amiante.** Vraies pages, sans fenêtre surgissante : sites, matériaux et zones, synthèse, contrôles. Affichage cartes ou tableau, filtres, création, modification, suppression avec confirmation, dossier PDF. Zone et matériau sont deux listes fermées. Le tableau des sites du classeur est dans `src/app/seeds/imported/asbestos-sites-dta.json` (108 sites). Le fichier source est `data/Tableau amiante le compas.xlsx`.
- **Tableaux risques.** Dans l’évaluation, la mise à jour et le référentiel : choix d’afficher 10, 50 ou 100 lignes, et défilement horizontal gardé en bas du tableau. Les listes déroulantes gardent leur flèche dans le champ.

Le tableau amiante du dépôt n’est recopié sur le NAS que si le document `asbestosSitesDta` est encore vide. S’il contient déjà une liste, cette liste reste. Ne pas forcer l’écriture : la commande d’import des documents réécrirait aussi le PAPRIPACT.

## Cette version ne remplace pas les données du NAS

Les écrans livrés ici (évaluation et mise à jour des risques, référentiel, retours d’action, plan de prévention, protocole de sécurité, fiche de sécurité, PDF) sont une évolution du frontend. Ils ne contiennent pas de nouveau jeu de données et ils n’écrasent pas PostgreSQL.

Ce qui est déjà sur le NAS reste en place : les 478 risques du classeur une fois installés, le PAPRIPACT, les accidents, les comptes, et le reste des modules. Un déploiement ne les recharge pas.

La seule écriture automatique sur les risques a déjà été livrée : à la connexion d’un administrateur, si la base est encore la courte base de démonstration (écart de plus de 20 lignes avec le classeur), elle est remplacée par les 478 lignes. Si le classeur est déjà en place, cette connexion ne réécrit rien. Le PAPRIPACT n’est pas concerné.

Les brouillons saisis dans le navigateur avec l’API coupée (plans, protocoles, fiches de la session de démonstration) sont dans le navigateur de ce Mac. Ils ne sont ni dans Git, ni sur le NAS. Les déployer ne les emporte pas, et ne les efface pas non plus sur le serveur.

## Ce qui change pour la connexion

- Ouvrir l’adresse IP affiche la page de connexion. La session de démonstration Jean-Marc DUBOIS n’est plus rouverte.
- Chacun se connecte avec son propre compte.
- La session se ferme après **30 minutes** sans activité, et au plus tard au bout de **8 heures**.
- « Se souvenir de moi » ne prolonge pas au-delà de ces délais.
- Les boutons de comptes de démonstration ne sont pas affichés sur la version intranet (`VITE_ALLOW_DEMO_LOGIN=false`).

Les navigateurs qui avaient encore l’ancienne session voient la page de connexion au prochain chargement. Il suffit de se reconnecter avec son compte.

## Risques : 49 lignes, c’est la base de démonstration

Le classeur DUERP contient **478** risques (`duerp-import-…`). Une cinquantaine de lignes, c’est l’ancienne base de démonstration, stockée dans PostgreSQL. Un `git pull` et une reconstruction des images ne la changent pas.

Si la base est encore cette base courte, une connexion **administrateur** la remplace par les 478 lignes du classeur. Le PAPRIPACT, les accidents et les autres données ne sont pas touchés. Si les 478 lignes sont déjà là, la connexion ne les réécrit pas. Tant que le classeur n’est pas en place, ne pas laisser l’ancienne page ouverte : elle peut réécrire les 49 lignes par-dessus le serveur.

Pour le faire tout de suite depuis un PC du réseau, sans attendre le déploiement :

```bash
export INTRANET_API_BASE=http://ADRESSE_IP_DU_NAS:8000/make-server-cfb78916
export INTRANET_ADMIN_EMAIL=admin@dirm-med.gouv.fr
export INTRANET_ADMIN_PASSWORD='le mot de passe administrateur du NAS'
npm run seed:imported -- --risks-only
```

`--risks-only` est obligatoire. Sans ce drapeau, la commande remplace aussi le PAPRIPACT.

## À ne pas faire

- Ne pas lancer `npm run seed:imported` sans `--risks-only`.
- Ne pas lancer `docker compose -f docker-compose.prod.yml up -d --build` sur le NAS. Le build du frontend sature une machine d’environ 1 Go de RAM.
- Ne pas copier le `.env` du poste de développement. Le `.env` du NAS reste sur le NAS.

## Si le runner GitHub du NAS tourne

Le push sur `main` lance `.github/workflows/deploy-intranet.yml` :

1. Les tests passent.
2. Le frontend est compilé hors du NAS, avec l’API activée et la connexion démo désactivée.
3. Le runner reconstruit l’API et charge l’image frontend déjà compilée. Cette image contient le dossier `dist`. S’il est exclu du contexte Docker, l’action échoue et le NAS continue d’afficher les anciens onglets.

Vérifier ensuite que l’action « Deploy intranet » est verte, puis ouvrir l’adresse IP dans une fenêtre privée : la page de connexion doit s’afficher. Un simple rafraîchissement d’un onglet déjà ouvert peut encore montrer l’ancienne interface.

## Si le runner ne tourne pas

Sur le NAS, dans le dossier du dépôt :

```bash
git pull
docker compose -f docker-compose.prod.yml up -d db backend --build
```

Cette commande met à jour l’API (expiration des jetons). Elle ne recompile pas le frontend.

Le frontend se construit sur un PC qui a Node 20, avec l’adresse de l’API du NAS :

```bash
npm ci
VITE_USE_BACKEND_API=true VITE_ALLOW_DEMO_LOGIN=false \
  VITE_API_BASE=http://ADRESSE_IP_DU_NAS:8000/make-server-cfb78916 \
  npm run build
docker build -f Dockerfile.prod.static -t lecompas-frontend:deploy .
docker save lecompas-frontend:deploy | gzip > lecompas-frontend.tar.gz
```

Copier `lecompas-frontend.tar.gz` sur le NAS, puis :

```bash
./scripts/deploy-nas-frontend.sh lecompas-frontend.tar.gz
```

## Contrôle

1. Fenêtre privée sur l’adresse IP : page de connexion, pas de session déjà ouverte.
2. Connexion avec un compte personnel, pas avec un bouton de démonstration.
3. Après 30 minutes sans clic, la session demande de se reconnecter.
4. Connecté en administrateur, l’onglet Risques affiche les 478 lignes du classeur, pas la cinquantaine de la démonstration. Le PAPRIPACT déjà saisi reste en place.
