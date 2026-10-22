# Lecompas

Application de gestion des risques pour la Direction interrégionale de la mer Méditerranée.

Elle couvre la cartographie des risques, les mesures de prévention, la signature électronique du document unique, le suivi amiante, le registre SST et les droits d'accès. Les données métier restent sur l'intranet : elles ne sont pas dans ce dépôt.

## Stack

- React, Vite, Tailwind CSS
- API Node.js, PostgreSQL
- Docker Compose

## Démarrage

```bash
cp .env.example .env
docker compose up --build
```

Renseigner `POSTGRES_PASSWORD` dans `.env` avant le premier lancement. Ne pas réutiliser un mot de passe d'exemple.

Les guides de mise en production sont dans `doc/`.
