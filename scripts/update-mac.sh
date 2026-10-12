#!/bin/bash
source "$(dirname "$0")/docker-common.sh"
[[ -z "$(git status --porcelain)" ]] || { echo "Commit or stash local work before updating; nothing was changed." >&2; exit 1; }
branch=$(git symbolic-ref --short HEAD) || { echo "Switch to a development branch before updating." >&2; exit 1; }
before=$(git rev-parse HEAD)
git fetch upstream main
git log --oneline HEAD..upstream/main
echo "Merging upstream/main into $branch (existing work is preserved)."
if ! git merge --no-edit upstream/main; then
  echo "Resolve conflicts, git add the resolutions, and git commit; then make install && make test. Or use git merge --abort." >&2
  exit 1
fi
if [[ "$before" == "$(git rev-parse HEAD)" ]]; then
  echo "Already up to date; checking the current build and deployment."
  docker compose up -d --build --wait --wait-timeout 240
  application_url
  exit 0
fi
docker compose build
docker build --target test -t gods-eye-view:test .
docker run --rm -e GEV_TEST_CONCURRENCY=2 -v "$PWD:/app" -v /app/node_modules gods-eye-view:test npm test
docker compose up -d --wait --wait-timeout 240
application_url
