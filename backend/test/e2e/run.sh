#!/usr/bin/env bash
# Tests de bout en bout sur une VRAIE base PostgreSQL, schéma créé uniquement par les migrations (comme en production).
#
#   E2E_ADMIN_URL=postgres://user:pass@localhost:5432/postgres npm run test:e2e
#
# Chaque suite (*.e2e.js) s'exécute sur une base neuve : la base d'essai est supprimée puis recréée avant chacune.
# Variables : E2E_ADMIN_URL (obligatoire, base « postgres » d'un compte pouvant créer des bases),
#             E2E_DB_NAME (défaut erp_e2e), E2E_PORT (défaut 4101).
set -uo pipefail
cd "$(dirname "$0")/../.."
: "${E2E_ADMIN_URL:?Définissez E2E_ADMIN_URL (ex. postgres://postgres:postgres@localhost:5432/postgres)}"
DB="${E2E_DB_NAME:-erp_e2e}"
PORT="${E2E_PORT:-4101}"
BASE_URL="${E2E_ADMIN_URL%/*}"
export DATABASE_URL="$BASE_URL/$DB" NODE_ENV=production JWT_SECRET="e2e-secret" PORT="$PORT" BASE="http://127.0.0.1:$PORT"
LOG="$(mktemp)"
PID=""
cleanup() { [ -n "$PID" ] && kill "$PID" 2>/dev/null; psql "$E2E_ADMIN_URL" -q -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" >/dev/null 2>&1; }
trap cleanup EXIT

[ -f dist/main.js ] || npm run build >/dev/null || { echo "Échec de la compilation"; exit 1; }

failed=0
for suite in test/e2e/*.e2e.js; do
  echo; echo "══ $(basename "$suite") ══"
  [ -n "$PID" ] && { kill "$PID" 2>/dev/null; wait "$PID" 2>/dev/null; PID=""; }
  psql "$E2E_ADMIN_URL" -q -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" -c "CREATE DATABASE \"$DB\"" >/dev/null || exit 1
  node dist/main.js >"$LOG" 2>&1 &
  PID=$!
  for _ in $(seq 1 90); do
    sleep 1
    grep -q "Server running" "$LOG" && break
    kill -0 "$PID" 2>/dev/null || { echo "Le serveur s'est arrêté :"; tail -20 "$LOG"; exit 1; }
  done
  grep -q "Server running" "$LOG" || { echo "Démarrage trop long :"; tail -20 "$LOG"; exit 1; }
  node test/e2e/seed.js || exit 1
  node "$suite" || failed=1
done
exit $failed
