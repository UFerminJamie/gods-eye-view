#!/bin/bash
source "$(dirname "$0")/docker-common.sh"
docker compose ps
application_url
if docker compose ps --status running --services | grep -q '^app$'; then
  docker compose exec -T app node docker/healthcheck.mjs
fi
