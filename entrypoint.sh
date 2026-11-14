#!/bin/sh
# Démarre en root le temps de donner le dossier des données à l'utilisateur du menu,
# puis lance le serveur sans les droits root (PUID/PGID, 1000 par défaut).
set -e
DATA="${MENU_DATA:-/data}"
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA/icons"
  chown -R "${PUID:-1000}:${PGID:-1000}" "$DATA"
  exec su-exec "${PUID:-1000}:${PGID:-1000}" "$@"
fi
exec "$@"
