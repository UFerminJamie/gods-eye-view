#!/bin/bash
source "$(dirname "$0")/docker-common.sh"
docker compose down
echo "Stopped. Configuration, cache and logs are preserved."
