#!/bin/bash
set -euo pipefail
# Docker Desktop may install its CLI without updating Terminal or Finder PATH.
export PATH="$PATH:$HOME/.docker/bin:/Applications/Docker.app/Contents/Resources/bin"
cd "$(dirname "$0")"
if command -v docker >/dev/null && ! docker info >/dev/null 2>&1; then
  open -a Docker || { echo "Install Docker Desktop first." >&2; exit 1; }
  for ((attempt=0; attempt<60; attempt++)); do
    docker info >/dev/null 2>&1 && break
    sleep 2
  done
fi
if ! ./scripts/start-mac.sh; then
  echo "Press Return to close."; read -r; exit 1
fi
source ./scripts/docker-common.sh
open "$(application_url)"
