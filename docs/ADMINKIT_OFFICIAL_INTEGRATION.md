# AdminKit Official Integration

ECU Pulse now uses the official AdminKit v3.4.0 distribution downloaded from:

- Source: https://github.com/adminkit/adminkit
- License: MIT
- Version: 3.4.0

## Local assets

- `assets/adminkit/css/app.css`
- `assets/adminkit/js/app.js`
- `assets/adminkit/css/ecu-pulse-rtl.css`
- `assets/adminkit/LICENSE`

The app does not depend on a remote AdminKit CDN at runtime.

## Official AdminKit structure applied

- `wrapper`
- `sidebar js-sidebar`
- `sidebar-content js-simplebar`
- `sidebar-nav`
- `sidebar-item`
- `sidebar-link`
- `main`
- `navbar navbar-expand navbar-light navbar-bg`
- `content`
- `container-fluid p-0`

The compatibility stylesheet mirrors the AdminKit sidebar for RTL/Persian use while retaining the official collapse behavior and visual system. AdminKit is the only selectable application theme.

## Single-theme behavior

- `data-theme="adminkit"` is present in the initial HTML, so the page does not flash a legacy theme before JavaScript starts.
- Old Dark, Ivory, MyDiag, EPS and Figma theme choices are no longer exposed or restored from local storage.
- The palette cycle and the duplicate mobile bottom navigation were removed.
- Mobile navigation uses the AdminKit sidebar with one RTL-aware toggle owner, a backdrop, scroll lock, Escape-safe page navigation and correct RTL motion.
- The sidebar uses a calm near-white surface, subtle edge shadow, readable slate text and a light-blue active state instead of the former heavy dark panel.
- AdminKit colors are now the source values for legacy ECU Pulse cards, charts, inputs and status elements.
- Runtime data and vehicle logos load from repository-local `shared/` assets, so the UI no longer falls back to an incomplete catalog or depends on a GitHub branch URL.

## Preserved ECU Pulse features

All existing application pages and behavior remain available, including vehicle catalog, vehicle detail dashboards, four ECharts gauges, manufacturer sensors, DTC read/clear (global and per-code), scanner console, trips, expenses, maintenance, Iranian vehicle services, garage, service history, dashboard signs, gauge gallery, Pro center, and analysis.

## Verification completed

Run `python3 tools/test_adminkit_theme.py` to verify the single-theme contract, required local assets and inline JavaScript syntax.

- Official AdminKit asset files loaded locally
- AdminKit wrapper/sidebar/main/navbar/content hierarchy verified
- JavaScript syntax checked with Node
- Sidebar collapse tested in browser
- Sidebar scrolling tested
- Dashboard renders three gauges in the first row at wide viewport
- Individual and global DTC clear controls verified
- Error modal absent after initialization fix
