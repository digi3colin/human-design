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
- A client-side time-range explorer with configurable sampling, chart scrubbing, and gate/line change detection
- Time-range keyboard controls: Left/Right Arrow to step and Space to play or pause at one second per frame

The app also uses [`lunar-javascript`](https://github.com/6tail/lunar-javascript) for client-side 八字 calendar calculations. It displays the Four Pillars, Day Master, Five Elements, Ten Gods, hidden stems, Na Yin, and Xun Kong. Year and month pillars use exact solar-term boundaries converted from UTC+8 into the birthplace offset; day and hour pillars use the entered civil clock time with the civil-midnight day boundary (sect 2).

八宅本命卦 is calculated from the solar year at 立春 and the selected traditional male/female category. When the calculated number is 5, the conventional palace substitution is applied: 2 · 坤 for male births and 8 · 艮 for female births.

NatalEngine uses Astronomy Engine/VSOP87 and reports planetary accuracy of approximately one arcminute. For professional-grade work near gate/line boundaries, consider validating results against Swiss Ephemeris. `swisseph-wasm` is a suitable lower-level JavaScript option, but it requires implementing and maintaining the Human Design gate/channel rules yourself and has additional ephemeris licensing considerations.

This project applies a Bun dependency patch to NatalEngine's Design-date solver. The patched solver searches a deterministic 83–95 day window at one-minute resolution and selects the minute closest to exactly 88 degrees of solar arc. Keep the generated `patchedDependencies` entry and `patches/` file when updating dependencies.

The UI normalizes Manifesting Generator terminology to the Jovian Archive convention: Manifesting Generator is presented as a Generator subtype with the strategy **Wait to Respond**, the signature **Satisfaction**, and the Not-Self Theme **Frustration**. This display normalization does not alter chart calculations.

## Notes

- Birth date and time stay in the browser and are not persisted by this app. City search queries are sent to Open-Meteo for geocoding.
- Birthplace is used to resolve the historical UTC offset; Human Design does not require house or ascendant calculations.
- The manual UTC-offset field is useful for checking historical records, especially before 1970.
- The time-range explorer compares complete charts for a sequence of possible moments. It does not overlay transits on a fixed natal chart, and reported change times are bounded by the selected sample interval.
- 八字 currently uses civil birth time, not true solar time. Schools differ on true solar time and the 23:00 子時 day boundary, so the convention is shown beside each result.
- Human Design and I Ching content is presented as a contemplative tool, not scientific, medical, or professional advice.
