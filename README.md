
  # Application de gestion des risques

  This is a code bundle for Application de gestion des risques. The original project is available at https://www.figma.com/design/vT8MtILUP0ZJfYLvzKCC4S/Application-de-gestion-des-risques.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Running with Docker

Run `docker compose up --build` to start the full local stack with Docker:
- frontend Vite (`http://localhost:5174`)
- backend API (`http://localhost:8000/make-server-cfb78916`)
- PostgreSQL local database (`localhost:5433`)

Then open `http://localhost:5174`.

To stop the containers, run `docker compose down`.

### Local fixtures and no remote Supabase

- The local database is initialized from `backend/db/init.sql`.
- Demo users are pre-seeded:
  - `admin@dirm-med.gouv.fr` / `admin123`
  - `chef@dirm-med.gouv.fr` / `chef123`
  - `agent@dirm-med.gouv.fr` / `agent123`
- The app is configured to use the local API (`VITE_API_BASE`) instead of remote Supabase.
  