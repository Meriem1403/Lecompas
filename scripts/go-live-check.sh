#!/usr/bin/env bash
# Vérifications post-déploiement (stack Docker prod sur le serveur intranet).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Fichier .env introuvable. Copiez .env.example vers .env." >&2
  exit 1
fi

# shellcheck disable=SC1091
source .env

FRONTEND_PORT="${FRONTEND_PORT:-5174}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
API_PREFIX="/make-server-cfb78916"
HEALTH_URL="http://127.0.0.1:${BACKEND_PORT}${API_PREFIX}/health"
FRONTEND_URL="http://127.0.0.1:${FRONTEND_PORT}/"

echo "==> Conteneurs Docker (prod)"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "==> Santé PostgreSQL"
docker compose -f docker-compose.prod.yml exec -T db \
  pg_isready -U "${POSTGRES_USER:-lecompas}" -d "${POSTGRES_DB:-lecompas}"

echo ""
echo "==> API ${HEALTH_URL}"
curl -fsS "$HEALTH_URL" | head -c 500
echo ""

echo ""
echo "==> Frontend ${FRONTEND_URL}"
HTTP_CODE="$(curl -fsS -o /dev/null -w "%{http_code}" "$FRONTEND_URL")"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "HTTP inattendu: $HTTP_CODE" >&2
  exit 1
fi
echo "HTTP $HTTP_CODE"

echo ""
echo "Rappels go-live :"
echo "  - VITE_ALLOW_DEMO_LOGIN=false dans .env (rebuild frontend si changement)"
echo "  - Mots de passe seed remplacés (comptes init.sql ou annuaire admin)"
echo "  - Comptes réels : même e-mail en login PostgreSQL et annuaire"
echo "  - Sauvegarde : ./scripts/backup-postgres.sh (+ cron)"
echo ""
echo "OK — stack joignable en local sur le serveur."
