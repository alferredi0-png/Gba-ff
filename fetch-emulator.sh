#!/usr/bin/env bash
# OPCIONAL: descarga EmulatorJS para que la app funcione SIN internet.
# Requiere: curl y 7z (p7zip). Ejecútalo antes de "cap sync".
# Si la versión cambia, mira https://github.com/EmulatorJS/EmulatorJS/releases
set -euo pipefail
VERSION="${1:-4.2.3}"
DEST="$(dirname "$0")/../www/emulator"
TMP="$(mktemp -d)"
echo "Descargando EmulatorJS $VERSION ..."
curl -fL "https://github.com/EmulatorJS/EmulatorJS/releases/download/v${VERSION}/${VERSION}.7z" -o "$TMP/ejs.7z"
7z x -y -o"$TMP/out" "$TMP/ejs.7z" >/dev/null
rm -rf "$DEST"; mkdir -p "$DEST"
# El archivo contiene la carpeta "data"
if [ -d "$TMP/out/data" ]; then cp -r "$TMP/out/data" "$DEST/data"; else cp -r "$TMP/out/"*/data "$DEST/data"; fi
echo "Listo: $DEST/data  (la app lo usará automáticamente)"
