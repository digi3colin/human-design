# Inner Compass

A private, browser-based Human Design BodyGraph and I Ching hexagram calculator built with Bun, vanilla JavaScript, Vite, and Tailwind CSS.

## Run locally

```bash
bun install
bun run dev
```

Create a production bundle with:

```bash
bun run build
```

## Calculation library

The app uses [`natalengine`](https://github.com/Unforced-Dev/natalengine) for Human Design calculations and SVG BodyGraph rendering. It provides:

- Personality and Design activations down to gate, line, color, tone, and base
- The exact Design moment using an 88-degree solar arc
- Type, strategy, authority, profile, definition, centers, channels, and incarnation cross
- IANA historical time-zone resolution and keyless Open-Meteo place search
- A pure SVG BodyGraph renderer that works in the browser

NatalEngine uses Astronomy Engine/VSOP87 and reports planetary accuracy of approximately one arcminute. For professional-grade work near gate/line boundaries, consider validating results against Swiss Ephemeris. `swisseph-wasm` is a suitable lower-level JavaScript option, but it requires implementing and maintaining the Human Design gate/channel rules yourself and has additional ephemeris licensing considerations.

## Notes

- Birth date and time stay in the browser and are not persisted by this app. City search queries are sent to Open-Meteo for geocoding.
- Birthplace is used to resolve the historical UTC offset; Human Design does not require house or ascendant calculations.
- The manual UTC-offset field is useful for checking historical records, especially before 1970.
- Human Design and I Ching content is presented as a contemplative tool, not scientific, medical, or professional advice.
