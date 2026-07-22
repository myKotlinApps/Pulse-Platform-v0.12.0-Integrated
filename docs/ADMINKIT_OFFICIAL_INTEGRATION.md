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

The compatibility stylesheet mirrors the AdminKit sidebar for RTL/Persian use while retaining the official collapse behavior and visual system.

## Preserved ECU Pulse features

All existing application pages and behavior remain available, including vehicle catalog, vehicle detail dashboards, four ECharts gauges, manufacturer sensors, DTC read/clear (global and per-code), scanner console, trips, expenses, maintenance, Iranian vehicle services, garage, service history, dashboard signs, gauge gallery, themes, Pro center, and analysis.

## Verification completed

- Official AdminKit asset files loaded locally
- AdminKit wrapper/sidebar/main/navbar/content hierarchy verified
- JavaScript syntax checked with Node
- Sidebar collapse tested in browser
- Sidebar scrolling tested
- Dashboard renders three gauges in the first row at wide viewport
- Individual and global DTC clear controls verified
- Error modal absent after initialization fix
