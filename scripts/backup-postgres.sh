#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Fichier .env introuvable. Copiez .env.example vers .env." >&2
  exit 1
fi

# shellcheck disable=SC1091
source .env

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/lecompas-${STAMP}.sql.gz"

echo "Sauvegarde PostgreSQL vers $OUT_FILE"
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "${POSTGRES_USER:-lecompas}" "${POSTGRES_DB:-lecompas}" | gzip > "$OUT_FILE"

echo "OK — $(du -h "$OUT_FILE" | awk '{print $1}')"
