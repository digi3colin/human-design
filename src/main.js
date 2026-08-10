import "./style.css";
import {
  calculateHumanDesign,
  formatUtcOffset,
  HEXAGRAM_DESCRIPTIONS,
  renderBodygraphSVG,
  resolveUtcOffset,
  searchPlaces,
} from "natalengine";
import { calculateChineseMetaphysics } from "./chinese-metaphysics.js";
import { getHexagram } from "./hexagrams.js";

const PLANETS = [
  ["sun", "Sun", "☉"],
  ["earth", "Earth", "⊕"],
  ["northNode", "North Node", "☊"],
  ["southNode", "South Node", "☋"],
  ["moon", "Moon", "☽"],
  ["mercury", "Mercury", "☿"],
  ["venus", "Venus", "♀"],
  ["mars", "Mars", "♂"],
  ["jupiter", "Jupiter", "♃"],
  ["saturn", "Saturn", "♄"],
  ["uranus", "Uranus", "♅"],
  ["neptune", "Neptune", "♆"],
  ["pluto", "Pluto", "♇"],
];

const app = document.querySelector("#app");

app.innerHTML = `
  <header class="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
    <a href="#top" class="flex items-center gap-3 text-ink no-underline" aria-label="Inner Compass home">
      <span class="grid size-10 place-items-center rounded-full border border-ink/15 bg-white/45 font-serif text-2xl">☰</span>
      <span>
        <span class="block font-serif text-xl font-semibold leading-none">Inner Compass</span>
        <span class="eyebrow mt-1 block text-[0.52rem] font-bold text-ink/45">Human Design · 易經 · 八字</span>
      </span>
    </a>
    <a href="#method" class="hidden text-sm font-semibold text-ink/55 underline decoration-ink/20 underline-offset-4 transition hover:text-ink sm:block">How it works</a>
  </header>

  <main id="top" class="mx-auto w-full max-w-[1500px] px-5 pb-16 sm:px-8 lg:px-12">
    <section class="grid items-start gap-8 pt-8 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(34rem,1.28fr)] lg:gap-12 lg:pt-14">
      <div class="lg:sticky lg:top-8">
        <p class="eyebrow mb-5 text-xs font-bold text-clay">Your energetic blueprint</p>
        <h1 class="max-w-2xl font-serif text-5xl font-semibold leading-[0.94] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
          Meet the design beneath the noise.
        </h1>
        <p class="mt-6 max-w-xl text-base leading-7 text-ink/62 sm:text-lg">
          Enter your birth details to map your BodyGraph, active gates, 64 I Ching hexagrams, 本命卦, and 八字.
        </p>

        <form id="chart-form" class="panel mt-9 rounded-[1.65rem] p-5 sm:p-6" novalidate>
          <div class="grid grid-cols-2 gap-4">
            <label>
              <span class="field-label">Birth date</span>
              <input id="birth-date" name="birthDate" class="field-input" type="date" required />
            </label>
            <label>
              <span class="field-label">Local time</span>
              <input id="birth-time" name="birthTime" class="field-input" type="time" step="60" required />
            </label>
          </div>

          <label class="mt-4 block" for="birth-sex">
            <span class="field-label">Traditional sex category</span>
            <select id="birth-sex" name="birthSex" class="field-input appearance-none" required>
              <option value="">Choose for 本命卦…</option>
              <option value="male">Male · 男命</option>
              <option value="female">Female · 女命</option>
            </select>
            <span class="mt-2 block text-xs leading-5 text-ink/45">Required only because the traditional 八宅命卦 formula differs for male and female births.</span>
          </label>

          <div class="relative mt-4">
            <label for="birth-location" class="field-label">Birth location</label>
            <div class="relative">
              <input
                id="birth-location"
                name="birthLocation"
                class="field-input pr-11"
                type="search"
                placeholder="Search a city…"
                autocomplete="off"
                aria-autocomplete="list"
                aria-controls="location-results"
                aria-expanded="false"
                required
              />
              <span id="location-spinner" class="pointer-events-none absolute right-4 top-1/2 hidden size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-sage/25 border-t-sage" aria-hidden="true"></span>
            </div>
            <div id="location-results" class="absolute z-20 mt-2 hidden max-h-64 w-full overflow-auto rounded-2xl border border-ink/10 bg-[#fffdf8] shadow-2xl" role="listbox"></div>
            <p id="timezone-label" class="mt-2 min-h-5 text-xs text-ink/48">Choose a result so historical time-zone rules can be applied.</p>
          </div>

          <details class="mt-3 rounded-xl border border-ink/8 bg-white/30 px-3 py-2 text-sm text-ink/58">
            <summary class="cursor-pointer select-none font-semibold">Historical UTC-offset override</summary>
            <label class="mt-3 block" for="utc-offset">
              <span class="field-label">UTC offset in hours</span>
              <input id="utc-offset" name="utcOffset" class="field-input" type="number" min="-14" max="14" step="0.25" placeholder="For example, 5.5" />
            </label>
            <p class="mt-2 text-xs leading-5">Leave blank to use the selected city's IANA time-zone history. Useful when checking pre-1970 records.</p>
          </details>

          <p id="form-error" class="mt-4 hidden rounded-xl bg-clay/10 px-3 py-2 text-sm font-semibold text-clay" role="alert"></p>

          <button id="calculate-button" class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 font-bold text-paper shadow-[0_14px_35px_rgba(24,32,28,0.2)] transition hover:-translate-y-0.5 hover:bg-sage disabled:cursor-wait disabled:opacity-65" type="submit">
            <span>Reveal my chart</span>
            <span aria-hidden="true">↗</span>
          </button>
          <p class="mt-3 text-center text-[0.68rem] leading-5 text-ink/42">Date and time stay in your browser; the city query is sent to Open-Meteo for lookup.</p>
        </form>
      </div>

      <div id="result-shell" class="panel min-h-[42rem] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
        <div id="empty-state" class="flex min-h-[42rem] flex-col justify-between p-7 sm:p-10 lg:p-12">
          <div class="flex items-center justify-between">
            <span class="eyebrow text-[0.62rem] font-bold text-ink/42">Chart field · waiting</span>
            <span class="size-2 rounded-full bg-gold shadow-[0_0_0_7px_rgba(215,167,60,0.12)]"></span>
          </div>
          <div class="mx-auto my-12 grid w-full max-w-md place-items-center">
            <div class="relative aspect-square w-full">
              <div class="absolute inset-[8%] rounded-full border border-ink/10"></div>
              <div class="absolute inset-[21%] rounded-full border border-dashed border-ink/15"></div>
              <div class="absolute inset-[35%] grid rotate-45 place-items-center border border-sage/35 bg-sage/5">
                <span class="-rotate-45 font-serif text-6xl text-sage/70">易</span>
              </div>
              <span class="absolute left-1/2 top-[2%] -translate-x-1/2 font-serif text-3xl text-ink/25">☰</span>
              <span class="absolute bottom-[2%] left-1/2 -translate-x-1/2 font-serif text-3xl text-ink/25">☷</span>
              <span class="absolute left-[2%] top-1/2 -translate-y-1/2 font-serif text-3xl text-ink/25">☵</span>
              <span class="absolute right-[2%] top-1/2 -translate-y-1/2 font-serif text-3xl text-ink/25">☲</span>
            </div>
          </div>
          <div>
            <p class="font-serif text-2xl leading-tight text-ink/75 sm:text-3xl">“The map becomes useful when it helps you notice your own terrain.”</p>
            <p class="mt-3 text-sm text-ink/42">Your chart will appear here.</p>
          </div>
        </div>
        <div id="chart-result" class="hidden"></div>
      </div>
    </section>

    <section id="method" class="mt-24 grid gap-8 border-t border-ink/12 pt-10 md:grid-cols-[0.7fr_1.3fr]">
      <div>
        <p class="eyebrow text-xs font-bold text-sage">Calculation method</p>
        <h2 class="mt-3 font-serif text-4xl font-semibold">What powers the chart?</h2>
      </div>
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div class="stat-card">
          <span class="font-serif text-2xl text-clay">01</span>
          <h3 class="mt-3 font-bold">Place → time zone</h3>
          <p class="mt-2 text-sm leading-6 text-ink/55">Open-Meteo resolves the city; IANA history converts its local birth time to UTC.</p>
        </div>
        <div class="stat-card">
          <span class="font-serif text-2xl text-clay">02</span>
          <h3 class="mt-3 font-bold">Planets → gates</h3>
          <p class="mt-2 text-sm leading-6 text-ink/55">NatalEngine uses Astronomy Engine/VSOP87 and computes the Design moment at an 88° solar arc.</p>
        </div>
        <div class="stat-card">
          <span class="font-serif text-2xl text-clay">03</span>
          <h3 class="mt-3 font-bold">Gates → BodyGraph</h3>
          <p class="mt-2 text-sm leading-6 text-ink/55">Active gate pairs define channels and centers, then render as a responsive SVG.</p>
        </div>
        <div class="stat-card">
          <span class="font-serif text-2xl text-clay">04</span>
          <h3 class="mt-3 font-bold">Civil time → 八字</h3>
          <p class="mt-2 text-sm leading-6 text-ink/55">Solar-term boundaries set the Four Pillars; the birth year and traditional sex category determine 本命卦.</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="border-t border-ink/10 px-5 py-7 text-center text-xs leading-5 text-ink/42 sm:px-8">
    A contemplative tool, not scientific or medical guidance · Engines: NatalEngine · lunar-javascript
  </footer>
`;

const form = document.querySelector("#chart-form");
const dateInput = document.querySelector("#birth-date");
const timeInput = document.querySelector("#birth-time");
const sexInput = document.querySelector("#birth-sex");
const locationInput = document.querySelector("#birth-location");
const offsetInput = document.querySelector("#utc-offset");
const locationResults = document.querySelector("#location-results");
const locationSpinner = document.querySelector("#location-spinner");
const timezoneLabel = document.querySelector("#timezone-label");
const formError = document.querySelector("#form-error");
const calculateButton = document.querySelector("#calculate-button");
const emptyState = document.querySelector("#empty-state");
const chartResult = document.querySelector("#chart-result");

let selectedPlace = null;
let foundPlaces = [];
let highlightedPlace = -1;
let searchTimer;
let searchSequence = 0;
let activeRange = null;
let rangePlaybackTimer = null;

const RANGE_MAX_SAMPLES = 240;

dateInput.max = new Date().toISOString().slice(0, 10);

locationInput.addEventListener("input", () => {
  selectedPlace = null;
  timezoneLabel.textContent = "Choose a result so historical time-zone rules can be applied.";
  clearTimeout(searchTimer);

  const query = locationInput.value.trim();
  if (query.length < 2) {
    closeLocationResults();
    return;
  }

  searchTimer = setTimeout(() => findPlaces(query), 280);
});

locationInput.addEventListener("keydown", (event) => {
  if (locationResults.classList.contains("hidden") || foundPlaces.length === 0) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    highlightedPlace = (highlightedPlace + 1) % foundPlaces.length;
    paintLocationResults();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    highlightedPlace = (highlightedPlace - 1 + foundPlaces.length) % foundPlaces.length;
    paintLocationResults();
  } else if (event.key === "Enter" && highlightedPlace >= 0) {
    event.preventDefault();
    choosePlace(highlightedPlace);
  } else if (event.key === "Escape") {
    closeLocationResults();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#birth-location") && !event.target.closest("#location-results")) {
    closeLocationResults();
  }
});

offsetInput.addEventListener("input", () => {
  const hasOverride = offsetInput.value !== "";
  timezoneLabel.textContent = hasOverride
    ? `Manual offset will be used: ${formatUtcOffset(Number(offsetInput.value || 0))}`
    : selectedPlace
      ? selectedPlace.timezone
      : "Choose a result so historical time-zone rules can be applied.";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateChart();
});

document.addEventListener("keydown", handleRangeKeyboard);

async function findPlaces(query) {
  const sequence = ++searchSequence;
  locationSpinner.classList.remove("hidden");

  try {
    const places = await searchPlaces(query, 6);
    if (sequence !== searchSequence) return;
    foundPlaces = places;
    highlightedPlace = places.length ? 0 : -1;
    paintLocationResults();
  } catch (error) {
    if (sequence !== searchSequence) return;
    foundPlaces = [];
    highlightedPlace = -1;
    locationResults.innerHTML = `<p class="px-4 py-3 text-sm text-clay">Location search is unavailable. Enter a label and use the UTC-offset override.</p>`;
    locationResults.classList.remove("hidden");
    locationInput.setAttribute("aria-expanded", "true");
    console.error(error);
  } finally {
    if (sequence === searchSequence) locationSpinner.classList.add("hidden");
  }
}

function paintLocationResults() {
  if (!foundPlaces.length) {
    locationResults.innerHTML = `<p class="px-4 py-3 text-sm text-ink/55">No matching places found.</p>`;
  } else {
    locationResults.innerHTML = foundPlaces
      .map(
        (place, index) => `
          <button class="location-option" type="button" role="option" aria-selected="${index === highlightedPlace}" data-place-index="${index}">
            <span class="min-w-0">
              <span class="block truncate font-semibold text-ink">${escapeHTML(place.label)}</span>
              <span class="mt-0.5 block text-xs text-ink/42">${escapeHTML(place.timezone)}</span>
            </span>
            <span class="shrink-0 text-sage">↗</span>
          </button>
        `,
      )
      .join("");

    locationResults.querySelectorAll("[data-place-index]").forEach((button) => {
      button.addEventListener("click", () => choosePlace(Number(button.dataset.placeIndex)));
    });
  }

  locationResults.classList.remove("hidden");
  locationInput.setAttribute("aria-expanded", "true");
}

function choosePlace(index) {
  selectedPlace = foundPlaces[index];
  locationInput.value = selectedPlace.label;
  timezoneLabel.textContent = selectedPlace.timezone;
  closeLocationResults();
  offsetInput.dispatchEvent(new Event("input"));
}

function closeLocationResults() {
  locationResults.classList.add("hidden");
  locationInput.setAttribute("aria-expanded", "false");
}

function calculateChart() {
  hideError();

  const date = dateInput.value;
  const time = timeInput.value;
  const sex = sexInput.value;
  const locationLabel = locationInput.value.trim();
  const hasOffsetOverride = offsetInput.value !== "";

  if (!date || !time || !sex || !locationLabel) {
    showError("Enter a birth date, local time, traditional sex category, and location.");
    return;
  }

  if (!selectedPlace && !hasOffsetOverride) {
    showError("Choose a location from the search results, or enter a UTC-offset override.");
    return;
  }

  const decimalHour = timeToDecimal(time);
  let utcOffset;

  try {
    utcOffset = hasOffsetOverride
      ? Number(offsetInput.value)
      : resolveUtcOffset(date, time, selectedPlace.timezone);

    if (!Number.isFinite(utcOffset) || utcOffset < -14 || utcOffset > 14) {
      throw new Error("The UTC offset must be between -14 and +14 hours.");
    }

    setCalculating(true);
    window.setTimeout(() => {
      try {
        stopRangePlayback(false);
        activeRange = null;
        const chart = normalizeTerminology(calculateHumanDesign(date, decimalHour, utcOffset));
        const chinese = calculateChineseMetaphysics(date, time, sex, utcOffset);
        renderChart(chart, {
          location: selectedPlace?.label || locationLabel,
          timezone: selectedPlace?.timezone || "Manual offset",
          utcOffset,
          localTime: time,
          chinese,
        });
      } catch (error) {
        console.error(error);
        showError("The chart could not be calculated. Check the date, time, and offset, then try again.");
      } finally {
        setCalculating(false);
      }
    }, 40);
  } catch (error) {
    showError(error.message || "The time zone could not be resolved.");
  }
}

function renderChart(chart, context, options = {}) {
  const graph = renderBodygraphSVG(chart, {
    id: "result",
    gateNumbers: true,
    themeOverrides: {
      personality: "#18201c",
      design: "#ba5f45",
      inactive: "#e3ded2",
      undefinedCenter: "#fffdf8",
      centerStroke: "#c7c0b3",
      gateTextInactive: "#8f8b82",
      centers: {
        head: "#d7a73c",
        ajna: "#97aa82",
        throat: "#c89b6a",
        g: "#e0bd58",
        heart: "#ba5f45",
        spleen: "#b79a6b",
        solar: "#d3a574",
        sacral: "#c96e51",
        root: "#9cac87",
      },
    },
  });

  const definedCenters = chart.centers.defined.map((center) => center.name).join(" · ") || "None";
  const channels = chart.channels.length
    ? chart.channels
        .map(
          (channel) => `
            <li class="flex items-start gap-3 border-b border-ink/8 py-3 last:border-0">
              <span class="mt-0.5 rounded-full bg-sage/12 px-2 py-1 font-mono text-xs font-bold text-sage">${channel.gates.join("–")}</span>
              <span><strong class="block text-sm">${escapeHTML(channel.name)}</strong><span class="text-xs capitalize text-ink/45">${escapeHTML(channel.circuit || "")}${channel.subcircuit ? ` · ${escapeHTML(channel.subcircuit)}` : ""}</span></span>
            </li>
          `,
        )
        .join("")
    : `<li class="py-3 text-sm text-ink/50">No complete channels — a Reflector chart.</li>`;

  chartResult.innerHTML = `
    <div class="${options.animate === false ? "" : "chart-enter"}">
      <div class="border-b border-ink/10 bg-white/28 px-6 py-7 sm:px-9 sm:py-8">
        <div class="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p class="eyebrow text-[0.62rem] font-bold text-clay">Your Human Design</p>
            <h2 class="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">${escapeHTML(chart.type.name)}</h2>
            <p class="mt-2 max-w-lg text-sm leading-6 text-ink/55">${escapeHTML(chart.type.description || "")}</p>
          </div>
          <div class="rounded-2xl border border-ink/10 bg-white/45 px-4 py-3 text-right text-xs leading-5 text-ink/50">
            <strong class="block text-sm text-ink">${escapeHTML(context.location)}</strong>
            ${escapeHTML(chart.meta.birthDate)} · ${escapeHTML(context.localTime)} · ${escapeHTML(formatUtcOffset(context.utcOffset))}
          </div>
        </div>

        <div class="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          ${stat("Strategy", chart.type.strategy)}
          ${stat("Authority", chart.authority.name)}
          ${stat("Profile", `${chart.profile.numbers} · ${chart.profile.name}`)}
          ${stat("Definition", chart.definition)}
        </div>
      </div>

      <div class="grid gap-0 xl:grid-cols-[minmax(21rem,1.15fr)_minmax(17rem,0.85fr)]">
        <section class="border-b border-ink/10 p-5 sm:p-8 xl:border-b-0 xl:border-r">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow text-[0.6rem] font-bold text-ink/42">BodyGraph</p>
              <p class="mt-1 text-xs text-ink/45"><span class="font-bold text-ink">Black</span> personality · <span class="font-bold text-clay">red</span> design</p>
            </div>
            <span class="rounded-full border border-ink/10 bg-white/40 px-3 py-1 text-xs font-semibold text-ink/55">${chart.gates.all.length} active gates</span>
          </div>
          <div class="mx-auto mt-5 max-w-[31rem] [&_svg]:h-auto [&_svg]:w-full">${graph}</div>
        </section>

        <aside class="p-6 sm:p-8">
          <div>
            <p class="eyebrow text-[0.6rem] font-bold text-ink/42">Incarnation cross</p>
            <h3 class="mt-2 font-serif text-2xl font-semibold">${escapeHTML(chart.incarnationCross.name)}</h3>
            <p class="mt-2 text-sm leading-6 text-ink/55">Gates ${chart.incarnationCross.gates.join(" · ")}</p>
          </div>
          <div class="mt-7 border-t border-ink/10 pt-6">
            <p class="eyebrow text-[0.6rem] font-bold text-ink/42">Defined centers</p>
            <p class="mt-2 text-sm font-semibold leading-6 text-sage">${escapeHTML(definedCenters)}</p>
          </div>
          <div class="mt-7 border-t border-ink/10 pt-6">
            <div class="flex items-center justify-between gap-3">
              <p class="eyebrow text-[0.6rem] font-bold text-ink/42">Channels</p>
              <span class="font-serif text-xl text-clay">${chart.channels.length}</span>
            </div>
            <ul class="mt-2">${channels}</ul>
          </div>
          <div class="mt-7 rounded-2xl bg-sage/9 p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-sage">Signature / not-self</p>
            <p class="mt-2 font-serif text-xl">${escapeHTML(chart.type.signature)} <span class="text-ink/25">↔</span> ${escapeHTML(chart.type.notSelf)}</p>
          </div>
        </aside>
      </div>

      ${chineseMetaphysicsPanel(context.chinese)}

      <section class="border-t border-ink/10 bg-white/22 px-5 py-8 sm:px-9 sm:py-10">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="eyebrow text-[0.62rem] font-bold text-clay">The 64 gates · 六十四卦</p>
            <h3 class="mt-2 font-serif text-3xl font-semibold">Your active hexagrams</h3>
          </div>
          <p class="max-w-md text-xs leading-5 text-ink/45">Open a row for its I Ching meaning and active line. Repeated gates may appear under different planets.</p>
        </div>

        <div class="mt-7 grid gap-6 lg:grid-cols-2">
          ${activationColumn("Personality · conscious", chart.gates.personality, "personality")}
          ${activationColumn("Design · unconscious", chart.gates.design, "design")}
        </div>
      </section>

      ${rangeExplorer(chart, context)}
      ${rangeSnapshotPanel()}

      <div class="border-t border-ink/10 px-6 py-5 text-xs leading-5 text-ink/42 sm:px-9">
        ${escapeHTML(chart.meta.ephemeris)} · Design moment ${escapeHTML(chart.positions.design.dateTime)} · ${chart.meta.designSolarArc}° solar arc · ${escapeHTML(context.timezone)}
      </div>
    </div>
  `;

  emptyState.classList.add("hidden");
  chartResult.classList.remove("hidden");
  wireRangeExplorer();

  if (options.scroll !== false && window.matchMedia("(max-width: 1023px)").matches) {
    document.querySelector("#result-shell").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function rangeExplorer(chart, context) {
  const range = activeRange;
  const startDate = range?.startDate || chart.meta.birthDate;
  const startTime = range?.startTime || context.localTime;
  const defaultEnd = addLocalMinutes(startDate, startTime, 24 * 60);
  const endDate = range?.endDate || defaultEnd.date;
  const endTime = range?.endTime || defaultEnd.time;
  const stepMinutes = range?.stepMinutes || 60;

  return `
    <section id="range-section" class="border-y border-ink/10 bg-sage/[0.045] px-5 py-7 sm:px-9">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="eyebrow text-[0.62rem] font-bold text-sage">Time range explorer</p>
          <h3 class="mt-2 font-serif text-2xl font-semibold">See when the chart changes</h3>
          <p class="mt-2 max-w-2xl text-xs leading-5 text-ink/50">Samples a complete chart at each local time. This compares possible chart moments rather than adding transits to one natal chart. Change points are accurate to the selected interval, not the exact transition second.</p>
        </div>
      </div>

      <form id="range-form" class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" novalidate>
        <label class="min-w-0">
          <span class="field-label">Start date</span>
          <input id="range-start-date" class="field-input" type="date" value="${escapeHTML(startDate)}" required />
        </label>
        <label class="min-w-0">
          <span class="field-label">Start time</span>
          <input id="range-start-time" class="field-input" type="time" value="${escapeHTML(startTime)}" required />
        </label>
        <label class="min-w-0">
          <span class="field-label">End date</span>
          <input id="range-end-date" class="field-input" type="date" value="${escapeHTML(endDate)}" required />
        </label>
        <label class="min-w-0">
          <span class="field-label">End time</span>
          <input id="range-end-time" class="field-input" type="time" value="${escapeHTML(endTime)}" required />
        </label>
        <label class="min-w-0">
          <span class="field-label">Sample every</span>
          <select id="range-step" class="field-input appearance-none" aria-label="Sample interval">
            ${rangeStepOption(15, "15 minutes", stepMinutes)}
            ${rangeStepOption(60, "1 hour", stepMinutes)}
            ${rangeStepOption(360, "6 hours", stepMinutes)}
            ${rangeStepOption(1440, "1 day", stepMinutes)}
          </select>
        </label>
        <div class="sm:col-span-2 xl:col-span-3">
          <p id="range-error" class="mb-3 hidden rounded-xl bg-clay/10 px-3 py-2 text-sm font-semibold text-clay" role="alert"></p>
          <button id="range-calculate" class="rounded-xl bg-sage px-5 py-3 text-sm font-bold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-60" type="submit">Calculate range</button>
          <span class="ml-3 text-xs text-ink/42">Maximum ${RANGE_MAX_SAMPLES} samples</span>
        </div>
      </form>
    </section>
  `;
}

function rangeSnapshotPanel() {
  const range = activeRange;
  if (!range) return "";

  const selected = range.snapshots[range.selectedIndex];
  const eventSnapshots = range.snapshots.filter((snapshot, index) => index === 0 || snapshot.changes.length > 0);
  const changeItems = selected.changes.length
    ? selected.changes
        .map(
          (change) => `
            <li class="rounded-xl border border-ink/8 bg-white/55 px-3 py-2 text-xs leading-5">
              <strong class="text-ink">${escapeHTML(change.label)}</strong>
              <span class="ml-1 text-ink/45">${escapeHTML(change.from)} → ${escapeHTML(change.to)}</span>
            </li>
          `,
        )
        .join("")
    : `<li class="rounded-xl bg-sage/8 px-3 py-2 text-xs leading-5 text-sage">${range.selectedIndex === 0 ? "Starting chart for this range." : "No gate, line, channel, or summary change since the previous sample."}</li>`;

  return `
    <section id="range-snapshot-panel" class="bg-sage/[0.045] px-5 py-7 sm:px-9">
      <div class="rounded-2xl border border-ink/10 bg-[#fffdf8]/70 p-4 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="eyebrow text-[0.56rem] font-bold text-sage">Selected snapshot</p>
            <p class="mt-1 font-serif text-2xl font-semibold">${escapeHTML(formatMoment(selected.date, selected.time))}</p>
          </div>
          <span class="rounded-full bg-clay/10 px-3 py-1 text-xs font-bold text-clay">${range.snapshots.length} samples · ${eventSnapshots.length - 1} change points</span>
        </div>

        <div class="mt-5 flex items-center gap-3">
          <button id="range-previous" class="grid size-9 shrink-0 place-items-center rounded-full border border-ink/12 bg-white text-ink transition hover:border-sage hover:text-sage disabled:opacity-30" type="button" ${range.selectedIndex === 0 ? "disabled" : ""} aria-label="Previous snapshot">←</button>
          <button id="range-play" class="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs text-paper transition hover:bg-sage" type="button" aria-label="${range.isPlaying ? "Pause timeline" : "Play timeline"}">${range.isPlaying ? "❚❚" : "▶"}</button>
          <input id="range-slider" class="timeline-range w-full" type="range" min="0" max="${range.snapshots.length - 1}" value="${range.selectedIndex}" step="1" aria-label="Select chart snapshot" />
          <button id="range-next" class="grid size-9 shrink-0 place-items-center rounded-full border border-ink/12 bg-white text-ink transition hover:border-sage hover:text-sage disabled:opacity-30" type="button" ${range.selectedIndex === range.snapshots.length - 1 ? "disabled" : ""} aria-label="Next snapshot">→</button>
        </div>
        <div class="mt-2 flex justify-between text-[0.62rem] text-ink/40">
          <span>${escapeHTML(formatMoment(range.startDate, range.startTime))}</span>
          <span>${escapeHTML(formatMoment(range.endDate, range.endTime))}</span>
        </div>
        <p class="mt-3 text-center text-[0.65rem] font-semibold text-ink/42">← → step through time · Space play/pause · 1 second per frame</p>

        <div class="mt-5 overflow-x-auto pb-2">
          <div class="flex min-w-max items-center gap-2" aria-label="Detected change points">
            ${eventSnapshots
              .map((snapshot) => {
                const index = range.snapshots.indexOf(snapshot);
                return `<button class="range-event rounded-full border px-3 py-1.5 text-xs font-semibold transition ${index === range.selectedIndex ? "border-ink bg-ink text-paper" : "border-ink/10 bg-white/60 text-ink/55 hover:border-sage hover:text-sage"}" type="button" data-range-index="${index}">${index === 0 ? "Start" : escapeHTML(shortMoment(snapshot.date, snapshot.time))}</button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="mt-4 border-t border-ink/8 pt-4">
          <p class="text-xs font-bold uppercase tracking-wider text-ink/45">Changes at this sample</p>
          <ul class="mt-3 grid gap-2 sm:grid-cols-2">${changeItems}</ul>
        </div>
      </div>
    </section>
  `;
}

function rangeStepOption(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
}

function wireRangeExplorer() {
  document.querySelector("#range-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateRange();
  });

  document.querySelector("#range-slider")?.addEventListener("change", (event) => {
    showRangeSnapshot(Number(event.target.value));
  });

  document.querySelector("#range-previous")?.addEventListener("click", () => {
    showRangeSnapshot(activeRange.selectedIndex - 1);
  });

  document.querySelector("#range-next")?.addEventListener("click", () => {
    showRangeSnapshot(activeRange.selectedIndex + 1);
  });

  document.querySelector("#range-play")?.addEventListener("click", toggleRangePlayback);

  document.querySelectorAll("[data-range-index]").forEach((button) => {
    button.addEventListener("click", () => showRangeSnapshot(Number(button.dataset.rangeIndex)));
  });
}

async function calculateRange() {
  stopRangePlayback(false);
  const startDate = document.querySelector("#range-start-date").value;
  const startTime = document.querySelector("#range-start-time").value;
  const endDate = document.querySelector("#range-end-date").value;
  const endTime = document.querySelector("#range-end-time").value;
  const stepMinutes = Number(document.querySelector("#range-step").value);
  const rangeError = document.querySelector("#range-error");
  const rangeButton = document.querySelector("#range-calculate");
  const startMs = localMomentToMs(startDate, startTime);
  const endMs = localMomentToMs(endDate, endTime);

  rangeError.classList.add("hidden");
  rangeError.textContent = "";

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    showRangeError("The end must be later than the start.");
    return;
  }

  const moments = [];
  const stepMs = stepMinutes * 60 * 1000;
  for (let moment = startMs; moment <= endMs; moment += stepMs) moments.push(moment);
  if (moments.at(-1) !== endMs) moments.push(endMs);

  if (moments.length > RANGE_MAX_SAMPLES) {
    showRangeError(`This range needs ${moments.length} samples. Choose a larger interval or a shorter range.`);
    return;
  }

  const hasOffsetOverride = offsetInput.value !== "";
  if (!selectedPlace && !hasOffsetOverride) {
    showRangeError("Choose a location or provide a manual UTC offset first.");
    return;
  }

  const sex = sexInput.value;
  if (!sex) {
    showRangeError("Choose the traditional sex category for the 本命卦 calculation.");
    return;
  }

  rangeButton.disabled = true;
  const snapshots = [];

  try {
    for (let index = 0; index < moments.length; index += 1) {
      const { date, time } = msToLocalMoment(moments[index]);
      const utcOffset = hasOffsetOverride
        ? Number(offsetInput.value)
        : resolveUtcOffset(date, time, selectedPlace.timezone);
      const chart = normalizeTerminology(calculateHumanDesign(date, timeToDecimal(time), utcOffset));
      const chinese = calculateChineseMetaphysics(date, time, sex, utcOffset);
      const previous = snapshots.at(-1);

      snapshots.push({
        chart,
        date,
        time,
        changes: previous ? compareCharts(previous.chart, chart, previous.context.chinese, chinese) : [],
        context: {
          location: selectedPlace?.label || locationInput.value.trim(),
          timezone: selectedPlace?.timezone || "Manual offset",
          utcOffset,
          localTime: time,
          chinese,
        },
      });

      rangeButton.textContent = `Calculating ${index + 1} / ${moments.length}…`;
      if (index > 0 && index % 16 === 0) await nextFrame();
    }

    activeRange = { startDate, startTime, endDate, endTime, stepMinutes, snapshots, selectedIndex: 0, isPlaying: false };
    renderChart(snapshots[0].chart, snapshots[0].context, { scroll: false });
  } catch (error) {
    console.error(error);
    showRangeError("The range could not be calculated. Check the dates, time zone, and interval.");
    rangeButton.disabled = false;
    rangeButton.textContent = "Calculate range";
  }
}

function showRangeSnapshot(index, options = {}) {
  if (!activeRange) return;
  if (options.stopPlayback !== false) stopRangePlayback(false);
  activeRange.selectedIndex = Math.max(0, Math.min(activeRange.snapshots.length - 1, index));
  const snapshot = activeRange.snapshots[activeRange.selectedIndex];
  renderChart(snapshot.chart, snapshot.context, { scroll: false, animate: false });
}

function handleRangeKeyboard(event) {
  if (!activeRange || isTextEntryTarget(event.target)) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showRangeSnapshot(activeRange.selectedIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    showRangeSnapshot(activeRange.selectedIndex + 1);
  } else if (event.code === "Space" && !event.repeat) {
    if (["button", "a", "summary"].includes(event.target?.tagName?.toLowerCase())) return;
    event.preventDefault();
    toggleRangePlayback();
  }
}

function isTextEntryTarget(target) {
  const tagName = target?.tagName?.toLowerCase();
  return target?.isContentEditable || ["input", "select", "textarea"].includes(tagName);
}

function toggleRangePlayback() {
  if (!activeRange) return;

  if (activeRange.isPlaying) {
    stopRangePlayback(true);
    return;
  }

  if (activeRange.selectedIndex >= activeRange.snapshots.length - 1) {
    activeRange.selectedIndex = 0;
  }

  activeRange.isPlaying = true;
  const snapshot = activeRange.snapshots[activeRange.selectedIndex];
  renderChart(snapshot.chart, snapshot.context, { scroll: false, animate: false });
  scheduleRangePlayback();
}

function scheduleRangePlayback() {
  window.clearTimeout(rangePlaybackTimer);
  rangePlaybackTimer = window.setTimeout(() => {
    rangePlaybackTimer = null;
    if (!activeRange?.isPlaying) return;

    if (activeRange.selectedIndex >= activeRange.snapshots.length - 1) {
      stopRangePlayback(true);
      return;
    }

    showRangeSnapshot(activeRange.selectedIndex + 1, { stopPlayback: false });
    scheduleRangePlayback();
  }, 1000);
}

function stopRangePlayback(render = true) {
  window.clearTimeout(rangePlaybackTimer);
  rangePlaybackTimer = null;

  if (!activeRange) return;
  const wasPlaying = activeRange.isPlaying;
  activeRange.isPlaying = false;

  if (render && wasPlaying) {
    const snapshot = activeRange.snapshots[activeRange.selectedIndex];
    renderChart(snapshot.chart, snapshot.context, { scroll: false, animate: false });
  }
}

function compareCharts(previous, current, previousChinese, currentChinese) {
  const changes = [];
  const summaryFields = [
    ["Type", previous.type.name, current.type.name],
    ["Authority", previous.authority.name, current.authority.name],
    ["Profile", previous.profile.numbers, current.profile.numbers],
    ["Definition", previous.definition, current.definition],
  ];

  summaryFields.forEach(([label, from, to]) => {
    if (from !== to) changes.push({ label, from, to });
  });

  [
    ["Personality", previous.gates.personality, current.gates.personality],
    ["Design", previous.gates.design, current.gates.design],
  ].forEach(([side, previousGates, currentGates]) => {
    PLANETS.forEach(([key, label]) => {
      const from = activationLabel(previousGates[key]);
      const to = activationLabel(currentGates[key]);
      if (from !== to) changes.push({ label: `${side} ${label}`, from, to });
    });
  });

  const previousChannels = previous.channels.map((channel) => channel.gates.join("–")).sort().join(", ") || "None";
  const currentChannels = current.channels.map((channel) => channel.gates.join("–")).sort().join(", ") || "None";
  if (previousChannels !== currentChannels) {
    changes.push({ label: "Channels", from: previousChannels, to: currentChannels });
  }

  if (previousChinese && currentChinese) {
    previousChinese.bazi.pillars.forEach((pillar, index) => {
      const currentPillar = currentChinese.bazi.pillars[index];
      if (pillar.value !== currentPillar.value) {
        changes.push({ label: `八字 ${pillar.label}`, from: pillar.value, to: currentPillar.value });
      }
    });

    if (previousChinese.mingGua.number !== currentChinese.mingGua.number) {
      changes.push({
        label: "本命卦",
        from: `${previousChinese.mingGua.number} · ${previousChinese.mingGua.name}`,
        to: `${currentChinese.mingGua.number} · ${currentChinese.mingGua.name}`,
      });
    }
  }

  return changes;
}

function activationLabel(activation) {
  return activation ? `${activation.gate}.${activation.line}` : "—";
}

function localMomentToMs(date, time) {
  return Date.parse(`${date}T${time}:00Z`);
}

function msToLocalMoment(milliseconds) {
  const value = new Date(milliseconds).toISOString();
  return { date: value.slice(0, 10), time: value.slice(11, 16) };
}

function addLocalMinutes(date, time, minutes) {
  return msToLocalMoment(localMomentToMs(date, time) + minutes * 60 * 1000);
}

function formatMoment(date, time) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(localMomentToMs(date, time)));
}

function shortMoment(date, time) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(localMomentToMs(date, time)));
}

function showRangeError(message) {
  const rangeError = document.querySelector("#range-error");
  rangeError.textContent = message;
  rangeError.classList.remove("hidden");
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function chineseMetaphysicsPanel(chinese) {
  if (!chinese) return "";

  const { bazi, mingGua, solarTerms } = chinese;

  return `
    <section class="border-t border-ink/10 bg-sage/[0.045] px-5 py-8 sm:px-9 sm:py-10">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow text-[0.62rem] font-bold text-sage">中華命理 · Chinese metaphysics</p>
          <h3 class="mt-2 font-serif text-3xl font-semibold">八字與本命卦</h3>
        </div>
        <p class="max-w-md text-xs leading-5 text-ink/45">Calculated locally from the entered civil birth time. Solar-term boundaries are converted to the birthplace UTC offset.</p>
      </div>

      <div class="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.55fr)]">
        <article class="rounded-2xl border border-ink/10 bg-[#fffdf8]/72 p-4 sm:p-5">
          <div class="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
            <div>
              <p class="eyebrow text-[0.56rem] font-bold text-clay">四柱八字 · Four Pillars</p>
              <p class="mt-2 font-serif text-2xl font-semibold tracking-[0.16em] sm:text-3xl">${escapeHTML(bazi.value)}</p>
            </div>
            <div class="rounded-xl bg-sage/9 px-3 py-2 text-right text-xs leading-5 text-ink/50">
              <span class="block font-bold text-ink">日主 ${escapeHTML(bazi.dayMaster.stem)} · ${escapeHTML(bazi.dayMaster.polarity)}${escapeHTML(bazi.dayMaster.element)}</span>
              ${escapeHTML(bazi.lunarDate)} · ${escapeHTML(bazi.zodiac)}
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            ${bazi.pillars.map(pillarCard).join("")}
          </div>

          <p class="mt-4 text-[0.68rem] leading-5 text-ink/42">Convention: civil clock time, exact 節氣 year/month boundaries, and the civil-midnight day boundary (sect ${bazi.sect}). True solar time is not applied.</p>
        </article>

        <article class="flex flex-col rounded-2xl border border-ink/10 bg-ink p-5 text-paper">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow text-[0.56rem] font-bold text-paper/50">八宅本命卦 · Ming Gua</p>
              <h4 class="mt-3 font-serif text-4xl font-semibold">${mingGua.number} · ${escapeHTML(mingGua.name)}<span class="ml-2 text-xl text-paper/45">${escapeHTML(mingGua.english)}</span></h4>
            </div>
            <span class="hex-symbol text-6xl text-gold" aria-hidden="true">${mingGua.symbol}</span>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-4">
            ${darkStat("類別", mingGua.group)}
            ${darkStat("五行", mingGua.element)}
            ${darkStat("本位", mingGua.direction)}
            ${darkStat("命年", `${mingGua.year} · ${mingGua.sexLabel}`)}
          </div>

          <div class="mt-auto border-t border-paper/12 pt-5 text-xs leading-5 text-paper/50">
            The traditional formula uses the solar year at 立春. For this date, the local boundary is ${escapeHTML(solarTerms.liChunLocal)}.
          </div>
        </article>
      </div>
    </section>
  `;
}

function pillarCard(pillar) {
  const hidden = pillar.hiddenStems
    .map((stem, index) => `${stem} · ${pillar.hiddenTenGods[index]}`)
    .join(" / ");

  return `
    <div class="rounded-xl border border-ink/8 bg-white/60 p-3 text-center">
      <p class="text-[0.62rem] font-bold uppercase tracking-wider text-ink/42">${escapeHTML(pillar.label)} · ${escapeHTML(pillar.english)}</p>
      <p class="mt-3 font-serif text-4xl font-semibold leading-none">${escapeHTML(pillar.gan)}<span class="text-clay">${escapeHTML(pillar.zhi)}</span></p>
      <p class="mt-2 text-xs font-bold text-sage">${escapeHTML(pillar.ganElement)} / ${escapeHTML(pillar.zhiElement)} · ${escapeHTML(pillar.tenGod)}</p>
      <dl class="mt-3 border-t border-ink/8 pt-3 text-left text-[0.65rem] leading-5 text-ink/48">
        <div><dt class="inline font-bold text-ink/65">藏干</dt><dd class="ml-1 inline">${escapeHTML(hidden)}</dd></div>
        <div><dt class="inline font-bold text-ink/65">納音</dt><dd class="ml-1 inline">${escapeHTML(pillar.naYin)}</dd></div>
        <div><dt class="inline font-bold text-ink/65">空亡</dt><dd class="ml-1 inline">${escapeHTML(pillar.xunKong)}</dd></div>
      </dl>
    </div>
  `;
}

function darkStat(label, value) {
  return `
    <div class="border-t border-paper/15 pt-3">
      <p class="text-[0.58rem] font-bold uppercase tracking-wider text-paper/40">${escapeHTML(label)}</p>
      <p class="mt-1 text-sm font-bold text-paper">${escapeHTML(value)}</p>
    </div>
  `;
}

function activationColumn(title, gates, side) {
  const rows = PLANETS.map(([key, label, glyph]) => {
    const activation = gates[key];
    if (!activation) return "";

    const hexagram = getHexagram(activation.gate);
    const description = HEXAGRAM_DESCRIPTIONS[activation.gate];
    const lineMeaning = description?.lines?.[activation.line];

    return `
      <details class="group border-b border-ink/8 last:border-0">
        <summary class="activation-row cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span class="min-w-0">
            <span class="mr-1 text-lg ${side === "design" ? "text-clay" : "text-ink"}" aria-hidden="true">${glyph}</span>
            <span class="text-sm font-semibold">${label}</span>
          </span>
          <span class="font-mono text-sm font-bold">${activation.gate}.${activation.line}</span>
          <span class="flex min-w-0 items-center gap-2">
            <span class="hex-symbol text-3xl text-sage" aria-hidden="true">${hexagram.symbol}</span>
            <span class="min-w-0">
              <span class="block text-sm font-bold">${hexagram.chinese}</span>
              <span class="block truncate text-[0.68rem] text-ink/45">${escapeHTML(hexagram.english)}</span>
            </span>
          </span>
        </summary>
        <div class="pb-4 pl-1 pr-2 text-xs leading-5 text-ink/58">
          <p>${escapeHTML(description?.meaning || activation.theme || "")}</p>
          ${lineMeaning ? `<p class="mt-2 border-l-2 border-gold/55 pl-3"><strong class="text-ink">Line ${activation.line}:</strong> ${escapeHTML(lineMeaning)}</p>` : ""}
        </div>
      </details>
    `;
  }).join("");

  return `
    <div class="rounded-2xl border border-ink/10 bg-[#fffdf8]/65 p-4 sm:p-5">
      <div class="flex items-center justify-between border-b border-ink/10 pb-3">
        <h4 class="font-bold">${title}</h4>
        <span class="size-2 rounded-full ${side === "design" ? "bg-clay" : "bg-ink"}"></span>
      </div>
      <div>${rows}</div>
    </div>
  `;
}

function stat(label, value) {
  return `
    <div class="stat-card">
      <p class="eyebrow text-[0.55rem] font-bold text-ink/40">${escapeHTML(label)}</p>
      <p class="mt-1 text-sm font-bold leading-5 text-ink">${escapeHTML(value || "—")}</p>
    </div>
  `;
}

function normalizeTerminology(chart) {
  if (chart.type?.name !== "Manifesting Generator") return chart;

  return {
    ...chart,
    type: {
      ...chart.type,
      strategy: "Wait to Respond",
      notSelf: "Frustration",
      description: "A Generator subtype with manifesting potential and a faster tempo",
    },
  };
}

function timeToDecimal(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}

function setCalculating(isCalculating) {
  calculateButton.disabled = isCalculating;
  calculateButton.querySelector("span:first-child").textContent = isCalculating ? "Calculating…" : "Reveal my chart";
}

function showError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function hideError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
