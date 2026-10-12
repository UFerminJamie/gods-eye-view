# Deployment verification

Executed on 2026-10-11 against upstream commit `591f299d11f38a612629a274463196d57ae3862e`. Results are observations of this session, not guarantees of provider availability or future performance.

## Environment

- macOS 26.5.1 (25F80), Apple Silicon ARM64, 16 GiB physical RAM, approximately 79 GiB free storage at inspection.
- Docker Engine/Desktop CLI 29.8.2, Compose 5.5.1; VM reports 10 CPUs and 8,319,504,384 bytes RAM.
- Git 2.50.1. Official GitHub CLI 2.102.0 downloaded to a workspace-local tool directory; GitHub authentication verified as UFerminJamie without printing a token.
- Docker initially had no containers/images/volumes and only its default networks. Port 4173 was unused and the target project did not exist.
- Official Node 24.14.0 bookworm-slim multi-platform digest verified to contain linux/arm64 and linux/amd64 manifests. An AMD64 production image also built and ran under Docker emulation with its health check passing; native Intel hardware has not been tested.

## Build, HTTP, security and storage

The ARM64 production image built using npm ci and the upstream lockfile. Both Compose files validate. Production serves localhost:4173 with a published 127.0.0.1 binding; development serves localhost:4175 with separate volumes. Runtime uid/gid is 1000 (`node`), capabilities are dropped and no-new-privileges is enabled. Health checks pass readiness, served HTML and POWER UP status.

Host `attacker.invalid`, cross-origin settings writes and X-Forwarded-For requests returned 403. Unknown `/api` routes returned JSON 404. The adapter explicitly returns 404 for `.env`/`.git`/config paths; an earlier preview fallback returned HTML for `.env`, never credential data. No optional provider key was configured. A POWER UP save of an empty Cesium token returned 200, produced a persistent `.env` with mode 0600 inside a 0700 directory, and left every provider unconfigured. Container restart and a full Compose down/up recreation retain that file with the same SHA-256. The documented backup command generated a readable archive of config, caches and logs.

## Browser observations

Safari visibly rendered the keyless Esri map and the application UI, with unavailable Google/Bing providers correctly gated. Chromium software-rendered QA initialized Cesium/WebGL 2, rendered the globe, reset the camera, zoomed/rotated and switched NVG/thermal/normal. Observed data included 8,708 OpenSky aircraft in one public snapshot, 336 adsb.lol aircraft after a later fallback, 49–53 military contacts, 828 satellites, 45 earthquakes, 3,904 camera catalog entries, 4,362 datacenters and 716 dams. Counts describe samples at their timestamps. Layer activation/catalog availability does not imply every contact or camera frame was visually inspected.

Development browser QA received a 101 WebSocket upgrade and `connected` message, confirmed the source bind mount and received a CSS HMR update after a temporary comment was added to style.css. The original stylesheet was restored. A public text-file test produced no reload message, so the definitive test used the application's actual stylesheet.

Early combined-layer Chromium runs were stopped after heavy software-rendering load; they are not reported as completed passes. The final production smoke completed **15/15 checks**, with no uncaught page errors or failed network requests. Keyless geographic search returned Austin coordinates; one Austin camera returned a real JPEG (247,442 bytes), not an SVG fallback. Missing AISStream/OpenAI credentials returned clear 503 responses. MCP initialize returned the upstream gods-eye-view server/version through the relay. Browser QA uses SwiftShader in Docker; it does not measure Mac GPU performance.

## Automated tests and diagnostics

The first runtime-only npm test attempt lacked Git and checkout metadata, causing Git-dependent tests to fail; it was superseded by a dedicated Git-enabled container. A complete bounded run executed 6,243 tests: 6,241 pass, one skip and one real-clock CCTV deadline failure under concurrent build/browser load. The entire CCTV test file passed 21/21 in isolation. A later full run hit a 400 ms analyst budget while concurrent browser QA ran.

The container runner now bounds test-file concurrency and serializes analyst, CCTV media deadline and traffic-timing files when GEV_TEST_CONCURRENCY is supplied. Their assertions and budgets are unchanged. Node 24 allocation probes still execute separately. The original default invocation remains unchanged outside this opt-in. The final complete run passed: **6,257 executed tests, 6,256 pass, one upstream skip, zero failures**. This includes 43 analyst tests, 21 CCTV range/deadline tests, three traffic-timing tests, one focus allocation probe and 13 world-overlay allocation probes. The main battery took 202.85 seconds, and the 13 world-overlay workloads took 140.57 seconds. All test assertions and allocation budgets were preserved.

Production builds pass, with upstream large-chunk warnings. These are warnings about the existing rendering bundle, not build failures. Shell syntax and Git whitespace checks pass. `make update` with dirty work refuses without fetching/merging/discarding changes.

## Performance observations

- Earlier unconditional startup included a runtime production asset build logged at 12.83 seconds. The launcher now uses prebuilt keyless assets and fingerprints public provider values to rebuild only when needed. A final restart-to-HTTP-ready measurement was 4.234 seconds. These measure different phases; no unsupported percentage speedup is claimed.
- One production snapshot after keyless use: 0.34% CPU and 169.1 MiB resident memory within a 2 GiB limit. Provider traffic and runtime builds can increase these values substantially.
- Docker image inspect reported approximately 1.05 GiB for the production image; the inspection reported 1,122,606,981 bytes before the final documentation refresh. Docker's reported image accounting differs from the application directory size.
- Recursive development-image chown was superseded after a slow/incomplete build; copy-time ownership plus targeted directory changes completed the ownership step in 2.1 seconds. The abandoned run is not an exact before/after benchmark.

- Final Chromium run: application initialization 15.407 s; a settled/renderable globe at 59.403 s, including tile acquisition and the smoke's explicit camera reset/wait. This is a browser/tile metric, not container startup.
- Software-rendering rotation sample after cycling large layers: four rAF intervals over the sampling window, average 1,058.3 ms, approximately 0.945 callbacks/s. This small sample records poor SwiftShader responsiveness; it is not native Mac GPU FPS or a stable rendering benchmark.
- Browser network sample: 266 responses, 14,816,601 bytes summed from Content-Length headers. This excludes responses without Content-Length and transport overhead, so it is not total network traffic.

## Limits and failure classification

- Missing optional credentials: Google/Cesium photorealistic 3D, OpenAI voice, AISStream maritime and other registered integrations were not enabled or claimed as successful live tests. Host Keychain/Codex OAuth and USB SDR are not forwarded.
- External provider failures: public feeds can rate-limit or fall back, as the observed OpenSky → adsb.lol transition demonstrates. Camera catalog availability is separate from image/video availability.
- Browser/GPU limits: intensive software-rendered QA can saturate several VM CPU cores; a separate native Chromium Apple M4/Metal sample is recorded below. Safari visual rendering is verified separately.
- Initial Docker testing defects: Git/checkout absence and unrestricted scheduling were addressed in the isolated test workflow.
- Timing-sensitive upstream budgets: failures under contention were investigated rather than skipped or relaxed.
- Scope: single-user localhost serving using upstream preview hooks; no public exposure or paid service activation. No PR will be merged automatically.

## Native GPU observation

An isolated installed Mac Chromium 154 instance connected to container-based Puppeteer reported WebGL 2 and `ANGLE Metal Renderer: Apple M4`. The first sample initialized in 2.655 s, displayed globe tiles by 4.177 s and recorded 38.57 frames/s with the first-launch panel visible. A second sample dismissed that panel through its actual Explore Manually control: initialization 3.628 s, globe tiles visible by 8.980 s, 212 rendered frames over 5.001 s (42.39 frames/s). These short samples used no heavy data layers and are not sustained benchmarks. No uncaught page errors occurred. The actual screenshot in README retains Esri attribution.

## Tracking regression limitations

The upstream tracking harness completed against the Docker development server using bundled imagery and synthetic aircraft: **106 passed, 3 failed, 0 skipped**. Initialization, tracking/shared-link restoration, cockpit/3D controls, camera and most display-floor checks passed. Three assertions remain unresolved: flights arrival visibility flipped at frame 5 rather than the required frame 4; a corridor fixture did not clear cell-boundary hysteresis; the loading fixture still had one rendering model. These are application/browser regression observations under concurrent native QA/build load, not missing-credential or external-provider failures. Their assertions were not relaxed, and no rendering rewrite was attempted. Earlier Docker SwiftShader harness attempts timed out during navigation. The Docker relay wrapper was corrected to close after the upstream harness sets its exit status.

## Management and launcher

Production `make restart`, `make status`, `make clean` and `make install` completed successfully; clean preserved project volumes and install returned a healthy localhost:4173 deployment. Development was shut down after its tests. The executable macOS launcher ran to completion, waited for Compose health and issued the default-browser `open` request successfully; Finder double-click and Docker Desktop cold-start were not separately exercised. Final image inspection: ARM64, 1,126,032,442 bytes. No unrelated Docker resources were removed.
