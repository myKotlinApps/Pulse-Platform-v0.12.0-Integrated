# EPS theme extraction and reusable classes — v0.10.0

The upload contained six EPS files, but three are byte-for-byte duplicates:

- `2323929.eps`
- `2323929(1).eps`
- `4402630_2323929.eps`

There are therefore four unique designs.

## Theme classes

| Source | Theme ID | Web class | Android class |
|---|---|---|---|
| 6145222_3173108.eps | eps-neon | NeonAnalyticsTheme | EpsDashboardTheme.NeonAnalytics |
| 6402304_3276515.eps | eps-color | ColorMetricsTheme | EpsDashboardTheme.ColorMetrics |
| 5185757_2660690.eps | eps-mobile | MobileGradientTheme | EpsDashboardTheme.MobileGradient |
| 2323929.eps | eps-industrial | IndustrialInfographicTheme | EpsDashboardTheme.IndustrialInfographic |

## Extracted component families

### Neon Analytics
Line graph, radial tick dial, four progress rings, progress sliders.

### Color Metrics
Flat donut gauges, colored bar chart, multicolor line chart, slider controls.

### Mobile Gradient
Segmented radial activity gauge, gradient metric rows and live sparklines.

### Industrial Infographic
Beveled circular gauges, vertical meters, timeline and step cards.

## Files

- `web/themes/eps-themes.js`: reusable web classes and live-data update API.
- `web/themes/eps-themes.css`: visual definitions and responsive layout.
- `android/.../ui/theme/EpsDashboardTheme.kt`: palette/theme registry.
- `android/.../ui/theme/EpsThemePanelView.kt`: Android native Canvas renderer.
- `web/assets/eps/source/`: vector conversions of the complete EPS sheets.
- `web/assets/eps/elements/`: standalone reusable SVG elements.
- matching Android asset folders.

The original EPS files appear to include Freepik attribution. Their original license and attribution obligations remain applicable to any direct use of the supplied artwork.
