#!/usr/bin/env bash
# Charge l'image frontend précompilée (sans Vite sur le NAS) et redémarre le service.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_TAR="${1:-lecompas-frontend.tar.gz}"
IMAGE_NAME="${LECOMPAS_FRONTEND_IMAGE:-lecompas-frontend:deploy}"

if [[ ! -f "$IMAGE_TAR" ]]; then
  echo "Archive introuvable: $IMAGE_TAR" >&2
  echo "Téléchargez l'artifact CI « lecompas-frontend-image » ou copiez le fichier depuis la machine de build." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Créez .env (voir .env.example) avant le déploiement." >&2
  exit 1
fi

echo "Chargement de $IMAGE_TAR"
gunzip -c "$IMAGE_TAR" | docker load

export LECOMPAS_FRONTEND_IMAGE="$IMAGE_NAME"
echo "Redémarrage frontend ($IMAGE_NAME, sans rebuild Vite)…"
docker compose -f docker-compose.prod.yml up -d frontend --no-build

echo "OK — frontend servi depuis l'image $IMAGE_NAME"
