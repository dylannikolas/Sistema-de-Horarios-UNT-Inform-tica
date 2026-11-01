#!/usr/bin/env bash
# Sube todos los cambios locales a GitHub (commit + push).  Uso: ./scripts/subir_cambios.sh "mensaje"
set -e
cd "$(dirname "$0")/.."
MSG="${1:-Actualizacion}"
git add -A
git commit -m "$MSG" || echo "(nada nuevo que commitear)"
git pull --rebase origin main
git push -u origin main
