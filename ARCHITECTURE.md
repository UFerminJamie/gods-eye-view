# Architecture

## Upstream application

The browser application in `src/app/` composes UI, layers, services and tools. `src/maps/` configures imagery, terrain and Google 3D. Cesium renders WebGL in the host browser, while satellite.js propagates orbital elements. HLS.js supports public-camera streams. `src/layers/` contains flights, military, satellites, vessels, earthquakes, weather-related and other modules. `src/data/manager.js` registers and toggles layers. `src/ui/`, `src/scenes/`, `src/annotations/` and `src/voice/` implement controls, scene projects, annotation rendering and Realtime voice.

The root Vite config delegates to `server/standalone/vite.config.js`. It loads environment files, constructs `build/vite.js`, and registers middleware from `server/providers/local.js`. Provider modules implement both development and preview hooks. They handle authenticated calls, CORS, allowlisted destinations, timeouts, caching and sanitized failures. The browser calls same-origin `/api/` routes; some public imagery and data are fetched directly. Browser Realtime connects to OpenAI using a short-lived client credential; AISStream uses an outbound server WebSocket through `ws`. Development uses a Vite HMR WebSocket. An empty credentials environment is supported: Esri/OSM maps and eligible public feeds remain available.

## Docker additions

`Dockerfile` pins the official Node 24.14.0 multi-architecture index and respects the lockfile. Dependencies are cached in an independent layer, Puppeteer's browser download is skipped, and the runtime contains built assets, provider source and the Vite/plugin dependencies needed to serve them. There is no host Node installation. A separate `qa` target installs Chromium solely for testing.

`docker/serve.mjs` is a Node ingress on container port 4173. Compose publishes it only on host 127.0.0.1. It relays requests and WebSocket upgrades to Vite on container loopback port 4174. It accepts only literal localhost/loopback Host names and refuses forwarding headers. Host and Origin headers pass through unchanged; upstream cross-site gates, credential file hardening, quotas and CSP stay active. This relay deliberately makes a local host request a container-loopback request: it must never be exposed to other clients. Docker-network peers can access the container port, so avoid attaching unrelated/untrusted containers to this project's network.

`docker/vite.config.mjs` reuses upstream provider plugins, replacing only the dev-only settings registration with the existing `keySetupEndpoint` installed against `/config`. Production uses Vite preview's middleware to serve built assets and APIs. This is appropriate for the reviewed localhost workflow; Vite preview is not a general production hosting server. The upstream MCP HTTP surface is preserved. Its plugin accepts an optional expected Host port for a trusted local relay; Docker supplies the published port, while the default non-Docker socket-port check is unchanged. Loopback, forwarding-header, sharing and Origin gates still apply. Host Codex OAuth and public hosting remain separate extension work.

Initial keyless startup uses the prebuilt image assets. Changed browser provider values trigger a runtime build, so public provider keys are injected only into the writable container layer, never image layers. Saving via POWER UP sets server environment values, closes/rebuilds/reopens the application backend, and updates a revision at `/healthz`. A small external script polls that revision to reload browser assets after a save. During a rebuild the ingress returns 503 and the health check fails until the backend is ready. Restarting the container resets plugin state and rereads the persistent file. Health verifies readiness, the served document and the settings API rather than just PID existence.

## Storage

| Storage                                     | Contents                                                   | Lifecycle                                              |
| ------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `gods-eye-view_config` mounted at `/config` | Provider `.env` (0600), directory 0700                     | Survives down, restart and image rebuild               |
| `gods-eye-view_cache` at `/app/.gev-cache`  | Orbital elements, provider caches, TomTom budget counters  | Preserved to avoid losing quota accounting             |
| `gods-eye-view_logs` at `/app/.gev-logs`    | Upstream redacted voice logs                               | Preserved; sensitive if content logging is enabled     |
| Docker json-file logs                       | Startup and provider diagnostics                           | 3 files × 10 MB per container                          |
| Container writable layer                    | Runtime browser build, transient files                     | Disposable on recreation                               |
| Browser localStorage                        | Scene projects, UI preferences, share-related settings     | Browser/profile/origin-specific, independent of Docker |
| Annotation objects                          | Active session marks unless exported by supported workflow | Not automatically a Docker-backed database             |

No database is required. Scene projects support JSON export/import in the upstream scene UI. Browser storage on localhost:4173 differs from localhost:4175 and 127.0.0.1:4173. Back up exported scenes separately from server volumes.

## Development and extension points

`compose.dev.yaml` is a standalone Compose file, not an override: use `docker compose -f compose.dev.yaml`. Its project, image, config/cache/log/dependency volumes and default port 4175 are distinct. The checkout bind mount enables edits; a nested node_modules volume prevents host dependencies from replacing Linux dependencies. Polling watches files at 500 ms and the ingress forwards HMR upgrades. After lockfile changes, refresh the dependency volume using `docker compose -f compose.dev.yaml run --rm app npm ci` and restart dev.

Add layer modules through the upstream catalog/manager contract, provider routes through provider plugins, and controls through UI composition. Keep secret handling server-side. Preserve `src/` import boundaries and run `npm test`, build, and browser verification inside Docker after changes. The Docker files remain modular so upstream source can be merged with minimal conflict.
