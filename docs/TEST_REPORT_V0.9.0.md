# ECU Pulse v0.9.0 Test Report

## Passed

- `node --check web/app.js`
- `node --check server/server.js`
- `node --check server/dev-server.js`
- Python compilation for `web/server.py` and `start_all.py`
- XML parsing for all Android resource and manifest files
- JSON parsing for all Web, Android, shared and server JSON files
- Kotlin parser check: no syntax errors in `MainActivity.kt` or `TripTrackingService.kt` (Android symbols are unresolved outside Android SDK, as expected)
- HTTP static-server smoke test on an alternate local port
- Demo-trip JSON contains 433 points and stop records
- Node development authentication with requested Pro plan
- `/api/v1/entitlements/me` returned Pro and unlimited generic DTC clear quota
- `/api/v1/analyze` returned a dynamic report
- `/api/v1/reports/pdf` returned a valid PDF 1.4 file
- Required map/replay DOM elements and offline SVG layers are present
- Gradle bootstrap scripts and wrapper properties are included

## Browser automation limitation

Chromium/Playwright in this sandbox rejected localhost with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore a real click-through screenshot test could not be completed in this environment. The web server itself was tested using HTTP requests, and JavaScript syntax plus route/map data were validated.

## Device tests still required

- Bluetooth RFCOMM against genuine and clone ELM327 adapters
- Wi-Fi TCP adapters on their real host/port
- Android foreground GPS tracking across OEM battery managers
- Android runtime permission flows on Android 7, 10, 11, 13 and 15+
- Full Android APK build after Android SDK/Maven dependency resolution
- Map tile availability from the user's network; the SVG map remains functional without tiles
