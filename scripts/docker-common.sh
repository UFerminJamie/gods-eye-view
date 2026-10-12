#!/bin/bash
set -euo pipefail
# Docker Desktop may install its CLI without updating Terminal or Finder PATH.
export PATH="$PATH:$HOME/.docker/bin:/Applications/Docker.app/Contents/Resources/bin"
cd "$(dirname "${BASH_SOURCE[0]}")/.."
command -v docker >/dev/null || { echo "Install Docker Desktop from https://www.docker.com/products/docker-desktop/" >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose is unavailable." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Start Docker Desktop, wait until its engine is ready, then retry." >&2; exit 1; }
application_url() {
  local address
  address=$(docker compose port app 4173 2>/dev/null || true)
  if [[ -n "$address" ]]; then echo "http://localhost:${address##*:}"; else echo "Application is stopped."; fi
}
