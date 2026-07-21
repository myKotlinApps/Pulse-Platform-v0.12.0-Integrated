# ECU Pulse v0.13.0

- Integrated user-provided `drawable-night-hdpi.zip` containing 93 transparent vehicle-brand PNGs.
- Activated 30 high-confidence brand matches across Web, Android, and Shared assets.
- Updated Android resolver priority to `pack-v130 -> official-v120 -> verified-v110 -> png -> svg -> fallback`.
- Preserved all original SVGs as fallback.
- Updated Android version codes to 101300/201300 and version name to 0.13.0.
- Added robust Android SDK setup to GitHub Actions.
