#!/usr/bin/env bash
# Self-hosted VM helper: pull deps, build Nitro node-server, start on 0.0.0.0
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "[vm] Missing .env — copy .env.example and set DATABASE_URL / BETTER_AUTH_*"
  exit 1
fi

echo "[vm] npm install..."
npm install

echo "[vm] build (Nitro node-server → .output/server/index.mjs)..."
npm run build

echo "[vm] starting..."
exec npm start
