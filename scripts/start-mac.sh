#!/bin/bash
source "$(dirname "$0")/docker-common.sh"
if ! docker compose up -d --build --wait --wait-timeout 240; then
  echo "Startup failed. Check port conflicts and docker compose logs --tail=100." >&2
  exit 1
fi
application_url
