#!/bin/sh
set -e

echo "[entrypoint] aplicando migrations..."
npm run db:migrate

# Seed é controlado pela variável SEED_ON_START (default: true).
# O runner é idempotente: em reinícios com o mesmo volume, nada é re-aplicado.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] aplicando seeders..."
  npm run db:seed
fi

echo "[entrypoint] iniciando API..."
exec npm start
