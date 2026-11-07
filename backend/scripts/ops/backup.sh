#!/usr/bin/env bash
# Sauvegarde complète de la base PostgreSQL (format « custom » de pg_dump : compressé, restaurable table par table).
#
#   DATABASE_URL=postgres://… BACKUP_PASSPHRASE='…' npm run backup
#
# Variables :
#   DATABASE_URL        base à sauvegarder (obligatoire)
#   BACKUP_DIR          dossier de sortie (défaut ./backups)
#   BACKUP_PASSPHRASE   si renseignée, la sauvegarde est chiffrée (GPG, AES-256) — fortement recommandé
#   BACKUP_S3_URI       ex. s3://mon-bucket/inovexa : copie hors serveur (AWS CLI ; BACKUP_S3_ENDPOINT pour Scaleway, OVH, MinIO…)
#   BACKUP_KEEP_DAYS    ancienneté maximale des sauvegardes locales (défaut 14)
#
# ⚠ Une sauvegarde qui reste sur le serveur qui l'a produite ne protège pas d'une perte du serveur : copiez-la ailleurs
#   (BACKUP_S3_URI) et testez régulièrement la restauration (npm run restore:check).
set -euo pipefail
: "${DATABASE_URL:?Définissez DATABASE_URL}"
DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
umask 077
mkdir -p "$DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$DIR/inovexa-$STAMP.dump"

pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" --file="$FILE"
pg_restore --list "$FILE" >/dev/null   # le fichier doit être relisible

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 --symmetric --cipher-algo AES256 -o "$FILE.gpg" "$FILE" 3<<<"$BACKUP_PASSPHRASE"
  rm -f "$FILE"
  FILE="$FILE.gpg"
else
  echo "⚠ BACKUP_PASSPHRASE non défini : la sauvegarde n'est PAS chiffrée." >&2
fi
( cd "$DIR" && sha256sum "$(basename "$FILE")" > "$(basename "$FILE").sha256" )

if [ -n "${BACKUP_S3_URI:-}" ]; then
  EP=(); [ -n "${BACKUP_S3_ENDPOINT:-}" ] && EP=(--endpoint-url "$BACKUP_S3_ENDPOINT")
  aws "${EP[@]}" s3 cp "$FILE" "${BACKUP_S3_URI%/}/$(basename "$FILE")" --only-show-errors
  aws "${EP[@]}" s3 cp "$FILE.sha256" "${BACKUP_S3_URI%/}/$(basename "$FILE").sha256" --only-show-errors
  echo "Copie distante : ${BACKUP_S3_URI%/}/$(basename "$FILE")"
fi

find "$DIR" -maxdepth 1 -name 'inovexa-*' -mtime +"$KEEP_DAYS" -delete
echo "Sauvegarde créée : $FILE ($(du -h "$FILE" | cut -f1))"
