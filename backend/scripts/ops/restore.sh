#!/usr/bin/env bash
# Restaure une sauvegarde créée par backup.sh dans une base CIBLE VIDE.
#
#   TARGET_DATABASE_URL=postgres://…/base_vide BACKUP_PASSPHRASE='…' bash scripts/ops/restore.sh backups/inovexa-….dump.gpg
#
# Par sécurité, le script refuse de restaurer dans une base qui contient déjà des tables.
# Pour remplacer une base existante : créez-en une nouvelle, restaurez, vérifiez, puis basculez DATABASE_URL.
set -euo pipefail
FILE="${1:?Usage : restore.sh <fichier de sauvegarde>}"
: "${TARGET_DATABASE_URL:?Définissez TARGET_DATABASE_URL (base cible vide)}"
[ -f "$FILE" ] || { echo "Fichier introuvable : $FILE" >&2; exit 1; }

if [ -f "$FILE.sha256" ]; then ( cd "$(dirname "$FILE")" && sha256sum --check --quiet "$(basename "$FILE").sha256" ) || { echo "Somme de contrôle invalide : sauvegarde corrompue." >&2; exit 1; }; fi

TABLES="$(psql "$TARGET_DATABASE_URL" -Atc "select count(*) from information_schema.tables where table_schema='public'")"
if [ "$TABLES" != "0" ]; then echo "La base cible contient déjà $TABLES table(s) : restauration refusée." >&2; exit 1; fi

WORK="$FILE"
if [[ "$FILE" == *.gpg ]]; then
  : "${BACKUP_PASSPHRASE:?Sauvegarde chiffrée : définissez BACKUP_PASSPHRASE}"
  WORK="$(mktemp)"; trap 'rm -f "$WORK"' EXIT
  gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --decrypt -o "$WORK" "$FILE" 3<<<"$BACKUP_PASSPHRASE"
fi
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_DATABASE_URL" "$WORK"
echo "Restauration terminée : $(psql "$TARGET_DATABASE_URL" -Atc "select count(*) from information_schema.tables where table_schema='public'") tables."
