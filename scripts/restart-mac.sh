#!/bin/bash
source "$(dirname "$0")/docker-common.sh"
docker compose restart app
docker compose up -d --wait --wait-timeout 240
application_url
