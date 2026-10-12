# Docker macOS guide

## Prerequisites and first deployment

Use Docker Desktop's official Apple Silicon or Intel installer, start the app and wait until the engine is ready. Check `docker info` and `docker compose version`. Docker Desktop licensing and organization eligibility are governed by Docker's current terms. Git is required; GitHub CLI is needed only for account/fork/PR maintenance. Do not install Node/npm on macOS for this workflow.

```bash
git clone https://github.com/UFerminJamie/gods-eye-view.git ~/Projects/gods-eye-view
cd ~/Projects/gods-eye-view
git switch feature/docker-macos-deployment
make install
make status
open http://localhost:4173
```

`make install` builds then starts and waits up to 240 seconds for readiness. The pinned base supports ARM64 and AMD64; Docker chooses the native architecture. Native Intel Mac behavior must still be validated separately. On this 16 GiB Apple Silicon machine the VM has about 8 GiB RAM; default service limits are 2 CPUs and 2 GiB, configurable below.

## Daily use

Run `make start`, `make stop`, `make restart`, `make status`, or `make logs` from the checkout. Ctrl-C stops log following without stopping the application. `make rebuild` rebuilds changed layers; `make start` then recreates a container whose image changed. `make clean` stops production and development project containers and removes their networks while preserving all volumes. None of these commands prune global Docker resources or delete volumes.

Double-click `Start-Gods-Eye-View.command` in Finder. It checks Docker, starts Desktop when its engine is stopped, waits for health and opens the published localhost URL. On macOS a new Terminal session should inherit Docker Desktop's CLI path. If `docker` is missing, enable Docker Desktop's supported CLI installation and reopen Terminal. The launcher displays an error and waits for Return if startup fails.

## Ports and resources

Compose reads an optional ignored root `.env` for interpolation. Example:

```dotenv
GEV_PORT=4173
GEV_DEV_PORT=4175
GEV_MEMORY_LIMIT=2g
GEV_CPUS=2
```

Before changing a port inspect `lsof -nP -iTCP:4173 -sTCP:LISTEN`. If another app owns it, choose an available port, e.g. `GEV_PORT=4180 make start`, or persist that value in `.env`. Use the same value on future commands. The launcher derives the URL from `docker compose port`. Port changes select a different browser storage origin; export scenes beforehand.

Keep published bindings at 127.0.0.1. Do not attach tunnels or publish on 0.0.0.0. This app brokers configured provider credentials and is intended for a single local operator.

## Provider settings and environment files

Open **POWER UP**, choose a provider, obtain credentials from that provider only if you want its capability, paste them and apply. The existing settings validation, same-origin gate and owner-only atomic writes remain in use. `/config/.env` inside the named volume persists; production rebuilds browser assets when public provider values change and reloads the page. Blank/removal keeps keyless behavior. No provider is enabled by the deployment automatically.

The root `.env` is not sent into the container as provider configuration and is excluded from image context and Git. To import an existing provider file, first back up `/config`; then stream a trusted file without printing it:

```bash
docker compose exec -T app sh -c 'umask 077; cat > /config/.env' < /path/to/provider.env
make restart
```

This manual import replaces the volume's provider file. Use POWER UP for ordinary changes; do not overwrite an existing store without a backup. The full upstream `.env.example` lists optional server model, rate-limit and source settings. Values loaded from this volume retain file-managed provenance; explicitly supplied process environment overrides remain externally managed.

| Integration                                  | Access and possible cost                                              | Credential visibility                                                    |
| -------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Esri/OSM, USGS, public cameras, NOAA weather | Keyless, provider policies/limits apply                               | None                                                                     |
| Cesium ion                                   | Account; eligible community use and quotas; other plans may cost      | Browser token: scope assets/read and allowed URLs                        |
| Google Maps/Places                           | Billing-enabled metered APIs; quotas and budgets needed               | Map token public; separate server key recommended for Places/Street View |
| OpenAI Realtime                              | API account; metered voice and optional HUD requests                  | Server API key; browser only short-lived Realtime secret                 |
| OpenSky                                      | Registered OAuth client for authenticated service; quotas/terms apply | Client ID/secret server-side                                             |
| AISStream                                    | Registered API key; provider availability/limits apply                | Server-side                                                              |
| NASA FIRMS                                   | Registered map key for live fire feed                                 | Server-side                                                              |
| TomTom                                       | Registered key, quotas and possible paid usage                        | Server-side; keyless traffic is simulation                               |
| Mapillary                                    | Registered application token under provider terms                     | Public client token; scope/restrict where supported                      |

Provider pricing and plans can change; follow provider links in POWER UP before registering or enabling billing. No exact prices are promised. Never use `VITE_` prefixes for server secrets. Restrict public keys by allowed localhost URL/referrers and APIs; configure provider quotas/budgets. Docker does not forward macOS Keychain, Codex authentication or microphones to the server; browser microphone prompts belong to the host browser.

## Volumes, backup and restore

Inspect project volumes with `docker volume ls --filter label=com.docker.compose.project=gods-eye-view`. They contain credentials (`config`), caches plus quota counters (`cache`) and voice logs (`logs`). Browser scenes and preferences are separate and must be exported in the scene UI. Keep backup archives private and outside Git; configuration backups contain secrets.

Create a consistent server backup while the backend is stopped:

```bash
mkdir -p "$HOME/gev-backups"
chmod 700 "$HOME/gev-backups"
docker compose stop app
umask 077
docker compose run --rm --no-deps --entrypoint tar app -czf - -C / config app/.gev-cache app/.gev-logs > "$HOME/gev-backups/server.tgz"
docker compose up -d --wait --wait-timeout 240
```

Restore only a trusted archive on a stopped, initialized deployment. This replaces matching stored files; back up current state first:

```bash
docker compose stop app
docker compose run --rm -T --no-deps --entrypoint tar app -xzf - -C / < "$HOME/gev-backups/server.tgz"
docker compose up -d --wait --wait-timeout 240
```

Named-volume ownership is initialized for uid 1000 (`node`). The credential directory is restricted by the launcher, and the upstream writer creates credentials with 0600. Never use `docker compose down -v` as daily maintenance. Keep cache volume backups if TomTom quota accounting matters. Docker stdout rotates at 10 MB × 3; upstream voice logs have their own rotation and privacy policy in SECURITY.md.

## Updating and upstream synchronization

Configure `origin` as your fork and `upstream` as `https://github.com/bilawalsidhu/gods-eye-view.git`; verify `git remote -v`. Develop on `feature/docker-macos-deployment` or another feature branch, and use PRs against your fork. `make update` refuses tracked or untracked local changes, fetches upstream/main, displays incoming commits and merges without resetting your branch. It stops on conflicts, then builds/tests before restarting.

For review before merging:

```bash
git status
git fetch upstream main
git log --oneline HEAD..upstream/main
git diff HEAD...upstream/main
git merge upstream/main
make install
make test
make browser-test
git push origin HEAD
```

If conflicts occur, inspect `git status`, edit conflicted files preserving Docker contributions, `git add` the resolutions and `git commit`. `git merge --abort` returns to the pre-merge state. Rebase is an alternative only on unpublished/private feature work: `git rebase upstream/main`, resolve and `git rebase --continue`, or `git rebase --abort`. Never force-push shared changes. The update command does not push, open or merge PRs automatically.

## Development and migration

`make dev` starts the separate development project at localhost:4175. Edit source on macOS; Vite hot reload runs in Docker. Dependencies and provider volumes are distinct from production. After package-lock changes run `docker compose -f compose.dev.yaml run --rm app npm ci`, then restart dev. Use `docker compose -f compose.dev.yaml logs -f` and `down` for dev specifically. Run `make test` and `make browser-test` against production after rebuilding; upstream `test:track` imports live source modules and must run against dev using the QA image as documented in the verification report.

On another Mac install Docker Desktop and Git, clone the fork, select the deployment branch, and `make install`. Restore a trusted server archive and exported scene JSON if desired. Do not copy host node_modules; Docker rebuilds the correct architecture. A container image can be rebuilt on Intel without using ARM emulation.

## Troubleshooting

| Symptom                                  | Action                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Docker permission/socket error           | Start Desktop; verify `docker info`; verify your terminal has Docker access                                                    |
| Startup timeout/unhealthy                | `docker compose logs --tail=100`; `docker inspect $(docker compose ps -q app)`; changed public-provider assets rebuild at boot |
| Port occupied                            | Choose another GEV_PORT; never kill unrelated apps                                                                             |
| Empty globe                              | Check WebGL/hardware acceleration; try OSM and keyless sources; inspect browser network errors                                 |
| Optional provider unavailable            | Check POWER UP, source freshness and provider status/quotas; absence of credentials is expected                                |
| Settings show 403                        | Use localhost URL directly; forwarding headers, remote names and cross-origin writes are refused                               |
| HMR not updating                         | Confirm dev port, `compose.dev.yaml`, dependency installation and Docker bind-mount access                                     |
| Out-of-memory                            | Increase GEV_MEMORY_LIMIT/Desktop VM RAM, reduce other active workloads, rebuild; browser GPU load is separate                 |
| Browser scenes missing after port change | Return to original origin or import the exported project                                                                       |
| Git update refuses                       | Commit/stash local changes; resolve conflicts before rebuild                                                                   |

Run `docker stats --no-stream` for server CPU/RAM and browser developer tools for rendering/network behavior. The production browser renders on the Mac GPU, while QA Chromium in Docker uses software rendering; QA FPS is not Mac GPU performance.
