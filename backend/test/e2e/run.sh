#!/usr/bin/env bash
# Tests de bout en bout sur une VRAIE base PostgreSQL, schéma créé uniquement par les migrations (comme en production).
#
#   E2E_ADMIN_URL=postgres://user:pass@localhost:5432/postgres npm run test:e2e
#
# Chaque suite (*.e2e.js) s'exécute sur une base neuve : la base d'essai est supprimée puis recréée avant chacune.
# Variables : E2E_ADMIN_URL (obligatoire, base « postgres » d'un compte pouvant créer des bases),
#             E2E_DB_NAME (défaut erp_e2e), E2E_PORT (défaut 4101), E2E_ONLY (facultatif : texte du nom de la suite à lancer, ex. saas).
# Les suites saas.e2e.js et online.e2e.js tournent avec un FAUX serveur d'emails (SMTP) et un FAUX Konnect, démarrés par la suite elle-même
# sur les ports E2E_PORT+100 et E2E_PORT+101 : le code de vérification et le paiement par carte sont testés pour de bon,
# sans Internet ni vrai paiement. Les autres suites tournent sans SMTP ni Konnect (comme une installation vierge).
set -uo pipefail
cd "$(dirname "$0")/../.."
: "${E2E_ADMIN_URL:?Définissez E2E_ADMIN_URL (ex. postgres://postgres:postgres@localhost:5432/postgres)}"
DB="${E2E_DB_NAME:-erp_e2e}"
PORT="${E2E_PORT:-4101}"
BASE_URL="${E2E_ADMIN_URL%/*}"
export DATABASE_URL="$BASE_URL/$DB" NODE_ENV=production JWT_SECRET="e2e-secret" PORT="$PORT" BASE="http://127.0.0.1:$PORT"
export FAKE_SMTP_PORT=$((PORT + 100)) FAKE_KONNECT_PORT=$((PORT + 101))
LOG="$(mktemp)"
PID=""
cleanup() { [ -n "$PID" ] && kill "$PID" 2>/dev/null; psql "$E2E_ADMIN_URL" -q -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" >/dev/null 2>&1; }
trap cleanup EXIT

[ -f dist/main.js ] || npm run build >/dev/null || { echo "Échec de la compilation"; exit 1; }

failed=0
for suite in test/e2e/*.e2e.js; do
  # E2E_ONLY=saas : ne lance que les suites dont le nom contient ce texte (utile pendant le développement).
  [ -n "${E2E_ONLY:-}" ] && [[ "$(basename "$suite")" != *"$E2E_ONLY"* ]] && continue
  echo; echo "══ $(basename "$suite") ══"
  [ -n "$PID" ] && { kill "$PID" 2>/dev/null; wait "$PID" 2>/dev/null; PID=""; }
  psql "$E2E_ADMIN_URL" -q -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" -c "CREATE DATABASE \"$DB\"" >/dev/null || exit 1
  EXTRA=()
  if [ "$(basename "$suite")" = "saas.e2e.js" ] || [ "$(basename "$suite")" = "online.e2e.js" ]; then
    EXTRA=(SMTP_HOST=127.0.0.1 "SMTP_PORT=$FAKE_SMTP_PORT" "SMTP_FROM=Inovexa ERP <no-reply@test.tn>" KONNECT_API_KEY=e2e-konnect-key KONNECT_WALLET_ID=e2e-wallet KONNECT_ENV=sandbox "KONNECT_API_URL=http://127.0.0.1:$FAKE_KONNECT_PORT/api/v2" "API_PUBLIC_URL=$BASE" FRONTEND_URL=http://localhost:3000)
  fi
  env ${EXTRA[@]+"${EXTRA[@]}"} node dist/main.js >"$LOG" 2>&1 &
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
