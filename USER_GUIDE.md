# User guide: explore God's Eye View

This application combines public spatial data with a cinematic interface. Start at http://localhost:4173 after `make start`. Use **EXPLORE MANUALLY** for a quiet starting view. Panels expand from the edges; **LOCATION** searches places, **VISUAL PRESETS** changes maps/styles, **DATA LAYERS** selects feeds, **DISPLAY** controls overlays, **CCTV** selects cameras, **SCENES** saves tours and **POWER UP** configures optional providers. **Reset Globe**, **North Up** and **Tilt** help recover your view.

“Live” means recently reported by a provider, not instant or complete. Satellite positions are propagated; traffic may be simulated; camera poses and launch paths are estimated; map imagery and infrastructure can be older snapshots. Sensor looks and tactical HUD are visualization, not physical sensor measurements. Read source and freshness labels before interpreting a contact. See upstream DATA_SOURCES.md for attribution and source details. These experiments describe supported functionality; deployment-specific verification is recorded separately in DEPLOYMENT_VERIFICATION.md.

## Practical experiments

### 1. Find your bearings

**Purpose:** Understand the globe and camera.

**Steps:** Choose EXPLORE MANUALLY; use Reset Globe, drag to rotate, scroll to zoom, and use North Up or Tilt to compare angles.

**Source and timing:** Esri/OSM imagery and terrain. Imagery is a provider mosaic, often older than today; camera position is local.

**Keys:** None. **Limits:** Imagery is not a live satellite video; 2D imagery lacks photorealistic city geometry.

### 2. Compare basemaps

**Purpose:** See imagery versus street cartography.

**Steps:** Open VISUAL PRESETS; select ESRI SATELLITE, then OSM; return to satellite and compare the same road.

**Source and timing:** Esri World Imagery, OpenStreetMap. Provider-managed imagery and community map updates.

**Keys:** None; Google/Bing options are gated. **Limits:** Availability and zoom limits vary; Esri can fall back to OSM.

### 3. Search a city

**Purpose:** Move directly to a named place.

**Steps:** Expand LOCATION; enter a city such as Austin; select the matching result and inspect the new camera location.

**Source and timing:** OSM Nominatim keyless search; Google when configured. Geographic database, not a live event feed.

**Keys:** None for keyless search; optional Google for enhanced places. **Limits:** Names can be ambiguous; search rate limits and outages can prevent results.

### 4. Follow an aircraft

**Purpose:** Read a moving contact and its telemetry.

**Steps:** Expand DATA LAYERS; enable Flights; zoom to a busy region; click an aircraft and read its source/time/altitude; release tracking to navigate again.

**Source and timing:** OpenSky or public ADS-B fallback such as adsb.lol. Live/delayed transponder observations with interpolated motion.

**Keys:** None where public fallback works; optional OpenSky OAuth. **Limits:** Receiver coverage is incomplete; missing data and estimated motion are not proof of a real-world absence.

### 5. Ride in a cockpit

**Purpose:** Explore the tracked-aircraft camera.

**Steps:** Track an airborne flight; select COCKPIT; compare forward view and sensor presets; exit cockpit and release tracking.

**Source and timing:** Same aircraft source plus app camera geometry. Telemetry-derived camera; simulated cockpit viewpoint.

**Keys:** None for available public flight feed. **Limits:** This is not a pilot camera, certified simulator or navigation instrument.

### 6. Show 3D aircraft

**Purpose:** Compare symbols with models.

**Steps:** Enable Flights, track a contact, and open DISPLAY; choose available 3D aircraft display/proximity settings; zoom close and compare model versus glyph.

**Source and timing:** ADS-B contact class plus bundled licensed models. Models represent contact classes; positions derive from telemetry.

**Keys:** None for available aircraft; 3D basemap optional. **Limits:** A model may not match the exact airframe; respect public/models/README.md licenses.

### 7. Inspect military ADS-B

**Purpose:** Compare reported military-class contacts.

**Steps:** Enable Military in DATA LAYERS; locate a visible contact; click its metadata and compare its freshness with a civil flight.

**Source and timing:** adsb.lol military feed. Reported/transponder-derived observations.

**Keys:** None. **Limits:** Classification and coverage are imperfect; this is not a complete military operational picture.

### 8. Ride with the ISS

**Purpose:** Understand orbital motion.

**Steps:** Enable Satellites; choose the ISS from visible contacts/search where available; click it to track and inspect its orbit; return to Reset Globe.

**Source and timing:** CelesTrak orbital elements and satellite.js. Propagated estimate from dated elements, not direct live GPS.

**Keys:** None. **Limits:** Old orbital elements, network failures and propagation approximations reduce accuracy.

### 9. Compare satellite orbits

**Purpose:** Explore orbital groups.

**Steps:** Enable Satellites; select several satellites in sequence; compare altitude, inclination and orbital paths; inspect the source timestamp.

**Source and timing:** CelesTrak TLE/orbital catalogs. Mathematical propagation of published elements.

**Keys:** None. **Limits:** Not every catalog entry loads at once; do not use it for mission-critical orbit predictions.

### 10. Replay a space mission

**Purpose:** Explore a launch trajectory.

**Steps:** Choose SPACE MISSIONS or enable launches; pick a launch with replay; use play and scrub controls and vary replay speed.

**Source and timing:** Launch Library and app trajectory reconstruction. Launch metadata plus RECONSTRUCTED ESTIMATE.

**Keys:** None. **Limits:** Replays are coarse reconstructed trajectories, not flight telemetry.

### 11. Read earthquake events

**Purpose:** Compare magnitude, time and location.

**Steps:** Enable Earthquakes under Events; zoom out; click a marker, read magnitude and timestamp, and compare a second event.

**Source and timing:** USGS earthquake feeds. Recent observations, preliminary and updated.

**Keys:** None. **Limits:** Feeds can revise magnitude/location and take time to publish; not an emergency alert service.

### 12. Watch forecast wind

**Purpose:** Read model-based airflow.

**Steps:** Enable Wind in Weather; open WEATHER; choose NOAA GFS or ECMWF IFS, select a forecast step, and inspect the center reading.

**Source and timing:** NOAA GFS / ECMWF IFS. Forecast/model estimate, with issuance and valid time.

**Keys:** None. **Limits:** Modeled 10 m wind is not a local sensor measurement; grid resolution and model coverage matter.

### 13. Replay observed weather

**Purpose:** Distinguish observation from forecast.

**Steps:** Enable Rain radar, Satellite clouds or Lightning density; open WEATHER; step backward, select Play, then Latest.

**Source and timing:** NOAA nowCOAST. Delayed observations on a history timeline.

**Keys:** None. **Limits:** Radar/lightning coverage is regional; clouds are satellite observations; imagery may be stale or missing.

### 14. Inspect cyclone advisories

**Purpose:** Read forecast uncertainty.

**Steps:** Enable Cyclone advisories; select an active advisory where available; compare current position, forecast track and cone at successive times.

**Source and timing:** NOAA NHC / CPHC. Published advisories and forecast estimates.

**Keys:** None. **Limits:** Atlantic/eastern/central North Pacific coverage; a cone is not a complete hazard forecast. Follow official local guidance.

### 15. Explore public cameras

**Purpose:** Compare public views with map context.

**Steps:** Enable Cameras over Austin or another supported region; open CCTV; select a camera and inspect its frame/video; cycle the coverage control.

**Source and timing:** Municipal and transport agencies listed in DATA_SOURCES.md. Live or periodically refreshed frames; camera pose/coverage estimated.

**Keys:** Many feeds keyless; Google fallback optional. **Limits:** A feed can be offline, delayed or blocked; coverage wedges are not calibrated optical measurements.

### 16. Map ALPR locations

**Purpose:** Inspect public mapping tags.

**Steps:** Enable ALPR Cameras; focus a city; select a mapped location and read its OpenStreetMap tags.

**Source and timing:** OpenStreetMap Overpass. Community-mapped location metadata.

**Keys:** None. **Limits:** Locations/tags only: no plate records or live surveillance access; maps may be incomplete.

### 17. Cycle sensor looks

**Purpose:** Explore visual grading.

**Steps:** Open VISUAL PRESETS; choose CRT, NVG, FLIR, Anime, Noir and Snow; adjust available display parameters and return to NORMAL.

**Source and timing:** Local GLSL postprocessing of rendered imagery. Simulated appearance.

**Keys:** None. **Limits:** FLIR is not measured thermal imagery; NVG does not reveal objects absent from the map.

### 18. Adjust HUD and detection

**Purpose:** Read overlays without mistaking them for sensors.

**Steps:** Open DISPLAY; change HUD and detection settings; compare label density at a busy region; turn the overlay off to see the underlying map.

**Source and timing:** Local screen-space rendering of enabled app objects. Derived screen overlays and stylized HUD values.

**Keys:** None. **Limits:** Boxes are generated from app contacts, not computer-vision detections in satellite photos; some HUD labels are aesthetic.

### 19. Explore infrastructure

**Purpose:** Compare bundled points and routes.

**Steps:** Enable Datacenters, Dams or Submarine Cables; zoom out; select a feature and inspect its source metadata.

**Source and timing:** Bundled OSM/Open Infrastructure Map and TeleGeography datasets. Static snapshots.

**Keys:** None. **Limits:** Data may be outdated. TeleGeography data is CC BY-NC-SA; OSM-derived databases carry ODbL conditions.

### 20. Save a scene tour

**Purpose:** Create a repeatable camera sequence.

**Steps:** Expand SCENES; use the available capture/add-scene controls; save several camera views; play the sequence; export the project JSON before changing browser or port.

**Source and timing:** User-authored camera/layer state. Recorded local view settings; live feeds still change on playback.

**Keys:** None. **Limits:** Scene projects live in browser localStorage. Export/import is required for reliable migration; a live target may disappear.

### 21. Draw annotations

**Purpose:** Explain spatial relationships.

**Steps:** Use the annotation tools where exposed; draw a point/route/shape and inspect its label; clear it after the experiment. For a deterministic demo, upstream TESTING.md documents window.__gevAnnotations.demo() in developer tools.

**Source and timing:** User-authored geometry; optional OSM boundaries/routing. Local drawings; resolved routes/boundaries may be estimates or fallback straight lines.

**Keys:** Manual tools keyless; voice drawing requires optional OpenAI. **Limits:** Session marks are not automatically stored in Docker; fallback routes should be labeled; boundary resolution can fail.

### 22. Share a view

**Purpose:** Reopen camera and layer settings.

**Steps:** Use Copy share link; paste it into a new local browser tab; compare camera/style/layers; return to your original tab.

**Source and timing:** Local URL serialization. View configuration; tracked target is a live handoff.

**Keys:** None. **Limits:** localhost links work only on a machine running the application; they do not share your server or provider keys.

### 23. Inspect traffic honestly

**Purpose:** Compare simulation with measured traffic.

**Steps:** Enable Traffic around a road network; read the layer source/status; compare keyless behavior before deciding whether you need TomTom.

**Source and timing:** OSM roads with simulated motion; optional TomTom aggregate flow. Keyless simulation; configured traffic uses provider aggregate observations.

**Keys:** None for simulation; TomTom registration for live flow. **Limits:** Vehicle dots are not individual tracked people/cars; provider quota counters persist in the cache volume.

### 24. Explore maritime contacts

**Purpose:** Add shipping only when desired.

**Steps:** Without a key, enable Vessels and observe the missing-provider state. If you already have AISStream access, add it in POWER UP, enable the layer and click a vessel.

**Source and timing:** AISStream maritime AIS. Reported AIS positions with coverage/freshness limitations.

**Keys:** AISStream registration required. **Limits:** Not tested with credentials in the keyless deployment; AIS can be missing, inaccurate or delayed.

### 25. Use voice control deliberately

**Purpose:** Operate the application by speech.

**Steps:** Obtain an OpenAI API key only if you accept its metered usage; add it in POWER UP; use GEV MIC; ask for a city or annotation; stop the session and inspect the cost indicator.

**Source and timing:** OpenAI Realtime plus app tools. AI-generated interpretation of current app state.

**Keys:** Optional metered OpenAI API key; host browser microphone permission. **Limits:** No paid voice session was enabled by deployment. Cost indicator is an estimate; quotas/budgets belong at the provider. Host Codex OAuth is not mounted.

### 26. Inspect fire detections

**Purpose:** Compare static and fresh fire data.

**Steps:** Enable Fires; inspect source/date; if desired obtain a NASA FIRMS map key, add it in POWER UP and compare fresh observations.

**Source and timing:** NASA FIRMS bundled snapshot or configured API. Satellite detections, delayed; bundled data static.

**Keys:** Registered FIRMS key for fresh feed. **Limits:** A hotspot is not a confirmed incident perimeter; cloud cover and overpass timing limit observation.

### 27. Try street-level imagery

**Purpose:** Relate ground-level photos to the map.

**Steps:** Expand STREET LEVEL; choose a supported provider, enable its layer, select an image location, and navigate adjacent imagery.

**Source and timing:** Mapillary or other upstream supported street-level sources. Historical captured photographs.

**Keys:** Mapillary registered public token where required. **Limits:** Coverage and photo dates vary; opening photographs is not live street surveillance.

### 28. Explore utilities and local transport

**Purpose:** Inspect activity with published source context.

**Steps:** Enable Radio, Bikeshare or Transit in DATA LAYERS; select a station/dock/vehicle; compare timestamp/source labels and regional coverage.

**Source and timing:** Radio Browser, GBFS operators, regional public transit feeds. Directory snapshots, current station availability or delayed vehicle observations.

**Keys:** Supported feeds keyless. **Limits:** Streams can fail; bicycle counts and transit positions are limited by operator feeds and geographic coverage.

## Missing providers and saving your work

An unavailable source or missing key should leave the rest of the globe usable. Switch to keyless Esri/OSM, disable a failing layer and inspect its source status. Do not repeatedly retry a paid provider to fix a quota error. Add optional keys using POWER UP; changes rebuild the browser assets, briefly return startup responses, and reload the page. Browser-exposed keys need restrictions at the provider.

Scene projects/preferences belong to the browser profile and URL origin; Docker preserves server credentials/caches/logs, not localStorage. Export scene JSON before migration. Session annotations require a supported export workflow to survive closing the app. See DOCKER_MAC_GUIDE.md for volume backup and restore.
