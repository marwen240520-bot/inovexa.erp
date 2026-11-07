#!/usr/bin/env bash
# Prouve qu'une sauvegarde est RESTAURABLE : la restaure dans une base temporaire, compare avec la base source, puis la supprime.
#
#   ADMIN_DATABASE_URL=postgres://…/postgres DATABASE_URL=postgres://…/inovexa BACKUP_PASSPHRASE='…' npm run restore:check [fichier]
#
# Sans fichier, utilise la sauvegarde la plus récente de BACKUP_DIR. À planifier (voir .github/workflows/backup.yml).
set -euo pipefail
: "${ADMIN_DATABASE_URL:?Définissez ADMIN_DATABASE_URL (base « postgres », compte autorisé à créer des bases)}"
: "${DATABASE_URL:?Définissez DATABASE_URL (base source, pour la comparaison)}"
DIR="${BACKUP_DIR:-./backups}"
FILE="${1:-$(ls -1t "$DIR"/inovexa-*.dump "$DIR"/inovexa-*.dump.gpg 2>/dev/null | head -1 || true)}"
[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "Aucune sauvegarde trouvée dans $DIR" >&2; exit 1; }

SCRATCH="restore_check_$(date +%s)"
TARGET="${ADMIN_DATABASE_URL%/*}/$SCRATCH"
trap 'psql "$ADMIN_DATABASE_URL" -q -c "DROP DATABASE IF EXISTS \"$SCRATCH\" WITH (FORCE)" >/dev/null 2>&1' EXIT
psql "$ADMIN_DATABASE_URL" -q -c "CREATE DATABASE \"$SCRATCH\"" >/dev/null

TARGET_DATABASE_URL="$TARGET" bash "$(dirname "$0")/restore.sh" "$FILE"

q() { psql "$1" -Atc "$2" 2>/dev/null || echo "?"; }
status=0
for t in users documents journal_entries products schema_migrations; do
  src="$(q "$DATABASE_URL" "select count(*) from \"$t\"")"; dst="$(q "$TARGET" "select count(*) from \"$t\"")"
  if [ "$src" = "?" ] && [ "$dst" = "?" ]; then continue; fi
  # la source a pu recevoir des écritures depuis la sauvegarde : la copie ne doit jamais en avoir PLUS
  if [ "$dst" = "?" ] || [ "$dst" -gt "$src" ] 2>/dev/null; then echo "✘ $t : source=$src restaurée=$dst"; status=1; else echo "✔ $t : source=$src restaurée=$dst"; fi
done
[ "$status" = 0 ] && echo "✔ Sauvegarde restaurable : $FILE" || echo "✘ Vérification échouée : $FILE"
exit $status
