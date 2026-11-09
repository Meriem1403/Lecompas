# Récupérer cette version sur le NAS

Un `git pull` seul ne change pas le site. Les conteneurs continuent de servir l’ancienne image tant qu’ils ne sont pas reconstruits.

## Ce qui change pour la connexion

- Ouvrir l’adresse IP affiche la page de connexion. La session de démonstration Jean-Marc DUBOIS n’est plus rouverte.
- Chacun se connecte avec son propre compte.
- La session se ferme après **30 minutes** sans activité, et au plus tard au bout de **8 heures**.
- « Se souvenir de moi » ne prolonge pas au-delà de ces délais.
- Les boutons de comptes de démonstration ne sont pas affichés sur la version intranet (`VITE_ALLOW_DEMO_LOGIN=false`).

Les navigateurs qui avaient encore l’ancienne session voient la page de connexion au prochain chargement. Il suffit de se reconnecter avec son compte.

## À ne pas faire

- Ne pas lancer `npm run seed:imported`. Cette commande remplace les risques et les actions PAPRIPACT déjà en base.
- Ne pas lancer `docker compose -f docker-compose.prod.yml up -d --build` sur le NAS. Le build du frontend sature une machine d’environ 1 Go de RAM.
- Ne pas copier le `.env` du poste de développement. Le `.env` du NAS reste sur le NAS.

## Si le runner GitHub du NAS tourne

Le push sur `main` lance `.github/workflows/deploy-intranet.yml` :

1. Les tests passent.
2. Le frontend est compilé hors du NAS, avec l’API activée et la connexion démo désactivée.
3. Le runner reconstruit l’API et charge l’image frontend déjà compilée.

Vérifier ensuite que l’action « Deploy intranet » est verte, puis ouvrir l’adresse IP dans une fenêtre privée : la page de connexion doit s’afficher.

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
4. Les risques et le PAPRIPACT déjà saisis sont toujours là. Aucun import n’est nécessaire pour cette mise à jour.
