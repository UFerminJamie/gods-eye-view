# Deployment contributions

This fork's application is Bilawal Sidhu's upstream God's Eye View. Cesium rendering, data layers, sources, sensor looks, annotations, scene tools and voice capabilities are upstream work. This branch contributes packaging and operation for a local Mac. LICENSE, THIRD_PARTY_NOTICES.md, DATA_SOURCES.md, SECURITY.md, TESTING.md and model/dataset notices remain intact.

## Files added

| Files                                                                                                           | Purpose                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Dockerfile`, `.dockerignore`                                                                                   | Official digest-pinned multi-stage Node image, lockfile installs, credentials excluded, separate development/test/QA targets   |
| `compose.yaml`, `compose.dev.yaml`                                                                              | Loopback production and isolated hot-reload development; non-root process, restricted capabilities, limits, health and volumes |
| `docker/serve.mjs`, `docker/vite.config.mjs`                                                                    | Local HTTP/WebSocket relay, upstream provider integration, persistent settings and cached runtime browser-key rebuilds         |
| `docker/healthcheck.mjs`                                                                                        | Check readiness, served HTML and settings API                                                                                  |
| `docker/smoke.mjs`, `docker/dev-smoke.mjs`, `docker/dev-track.mjs`, `docker/native-smoke.mjs`                   | Real browser rendering/data smoke checks and development reload evidence                                                       |
| `Makefile`                                                                                                      | Repeatable lifecycle, isolated tests and safe cleanup                                                                          |
| `scripts/docker-common.sh`, `start-mac.sh`, `stop-mac.sh`, `restart-mac.sh`, `check-status.sh`, `update-mac.sh` | Friendly Docker diagnostics, actual URL discovery, health waits and preservation of local Git work                             |
| `Start-Gods-Eye-View.command`                                                                                   | Double-click Desktop/start/health/browser workflow                                                                             |
| `DOCKER_MAC_GUIDE.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`                                                       | Setup, operation, backup/migration, architecture and 28 practical experiments                                                  |
| `CONTRIBUTIONS.md`, `DEPLOYMENT_VERIFICATION.md`                                                                | Attribution and reproducible verification record                                                                               |

## Files modified

- `README.md`: prepend the fork's deployment landing page and keep the upstream README below it, including source attribution and media.
- `.env.example`: append commented Docker port/resource examples; keep the full upstream provider reference.
- `scripts/run-unit-tests.mjs`: add optional validated `GEV_TEST_CONCURRENCY` plus serialization of the three observed real-clock timing files; the default upstream invocation stays unchanged. Container test commands bound concurrency to avoid starvation of timing-sensitive tests.
- `scripts/track-regression.mjs`: optional connection to an isolated native browser for GPU QA; default browser launch and all regression assertions remain unchanged.
- `server/mcp/plugin.js`: add optional `expectedHostPort` for the trusted local Docker relay. The normal socket-port gate is unchanged when unspecified; loopback, Host, Origin, proxy-header and sharing checks remain active.

## Why the adapter is needed

The application has server-side provider routes and cannot be served as a static site alone. Most upstream plugins support preview serving, but POWER UP is development-only and restricted to loopback. Docker's host connections arrive through a gateway, so trusting a broad gateway subnet would weaken that gate. The adapter publishes only on host loopback, verifies local Host names and refuses proxy headers before forwarding to container loopback. It installs the existing settings handler with a volume-backed source root and provides a rebuild/reload callback for production. Optional public keys enter runtime assets, not image layers; private keys stay in server environment and restricted configuration.

Source code is bind-mounted only in development. Its node_modules and credential/cache/log volumes are separate from production. Ordinary shutdown, clean, updates and rebuilds preserve user volumes. Browser scene projects remain browser-owned; Docker does not claim to back up localStorage.

## Compatibility and tests

The base image's official manifest contains native linux/arm64 and linux/amd64 variants, and package.json supports the pinned Node 24.14.0 runtime. Apple Silicon macOS is the executed deployment platform; native Intel hardware remains a separate validation gap. Docker Desktop is required, and macOS Keychain/Codex/USB-device integrations are not forwarded automatically.

See DEPLOYMENT_VERIFICATION.md for actual runs, the initial environment failures, isolated retest, complete-suite results, screenshots, provider outcomes, performance measurements and remaining limits. Unit and build commands run inside containers; a separate QA target holds Chromium. No provider credentials or paid services were enabled during testing. Source rendering architecture and upstream lockfile dependencies were preserved.

## Maintenance

Keep origin pointing to this fork and upstream to the original. Make updates refuse dirty work, merge rather than reset, and stop on conflicts. Resolve conflicts with the upstream interface contracts in mind; then rebuild, rerun unit/build/browser checks, push a feature branch and review its PR. The README credits original features separately from these deployment contributions.
