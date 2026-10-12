# Discover Docker Desktop even when a shell or Finder has a minimal PATH.
export PATH := $(PATH):$(HOME)/.docker/bin:/Applications/Docker.app/Contents/Resources/bin
COMPOSE = docker compose
.PHONY: install start stop restart status logs update rebuild test browser-test track-test dev clean
install: rebuild start
start:
	@./scripts/start-mac.sh
stop:
	@./scripts/stop-mac.sh
restart:
	@./scripts/restart-mac.sh
status:
	@./scripts/check-status.sh
logs:
	$(COMPOSE) logs -f --tail=100
update:
	@./scripts/update-mac.sh
rebuild:
	$(COMPOSE) build
test:
	docker build --target test -t gods-eye-view:test .
	docker run --rm -e GEV_TEST_CONCURRENCY=2 -v "$$(pwd):/app" -v /app/node_modules gods-eye-view:test npm test
	docker run --rm -v "$$(pwd):/app" -v /app/node_modules gods-eye-view:test npm run build
	$(COMPOSE) exec -T app node docker/healthcheck.mjs
dev:
	docker compose -f compose.dev.yaml up -d --build --wait --wait-timeout 180
clean:
	$(COMPOSE) down --remove-orphans
	docker compose -f compose.dev.yaml down --remove-orphans

browser-test:
	docker build --target qa -t gods-eye-view:qa .
	mkdir -p qa-artifacts
	docker run --rm --network container:$$(docker compose ps -q app) -v "$$(pwd)/qa-artifacts:/app/qa-artifacts" gods-eye-view:qa node docker/smoke.mjs

track-test:
	docker build --target qa -t gods-eye-view:qa .
	docker run --rm --network container:$$(docker compose -f compose.dev.yaml ps -q app) -v "$$(pwd):/app" -v /app/node_modules gods-eye-view:qa node docker/dev-track.mjs
