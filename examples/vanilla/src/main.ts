import { Timeline } from "@multitrack/core";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { config, views, MAP_STEPS, LOCATIONS } from "./config.ts";
import "./style.css";

const timeline = new Timeline({ config, devtools: true });

/* ------------------------------------------------------------------ */
/*  Cache DOM elements                                                 */
/* ------------------------------------------------------------------ */

const scrollContainer = document.getElementById("scroll-container")!;
const title = document.getElementById("title")!;
const textTokyo = document.getElementById("text-tokyo")!;
const textAlps = document.getElementById("text-alps")!;
const textSahara = document.getElementById("text-sahara")!;
const textNyc = document.getElementById("text-nyc")!;
const textAmazon = document.getElementById("text-amazon")!;
const outro = document.getElementById("outro")!;
const locationDots = document.getElementById("location-dots")!;
const dots = locationDots.querySelectorAll<HTMLDivElement>(".location-dot");
const progressBar = document.getElementById("progress-bar")!;

const textPanels: Record<string, HTMLElement> = {
  "text-tokyo": textTokyo,
  "text-alps": textAlps,
  "text-sahara": textSahara,
  "text-nyc": textNyc,
  "text-amazon": textAmazon,
};

/* ------------------------------------------------------------------ */
/*  Set scroll height                                                  */
/* ------------------------------------------------------------------ */

scrollContainer.style.height = `${timeline.totalSteps * 100}vh`;

/* ------------------------------------------------------------------ */
/*  Initialise MapLibre                                                */
/* ------------------------------------------------------------------ */

const map = new maplibregl.Map({
  container: "map-container",
  style: "https://tiles.openfreemap.org/styles/positron",
  center: views.globe.center,
  zoom: views.globe.zoom,
  pitch: views.globe.pitch,
  bearing: views.globe.bearing,
  interactive: false,
  attributionControl: false,
});

let currentView = "globe";

/* ------------------------------------------------------------------ */
/*  Scroll handler                                                     */
/* ------------------------------------------------------------------ */

timeline.on("scroll", ({ scrollPercentage }) => {
  const opacities = timeline.getOpacities(scrollPercentage);

  // --- Map flyTo ---
  const active = MAP_STEPS.find((name) => (opacities[name] ?? 0) > 0);
  if (active && active !== currentView) {
    currentView = active;
    const view = views[active];
    map.flyTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      duration: 4000,
      essential: true,
    });
  }

  // --- Title ---
  updateSection(title, opacities["title"] ?? 0);

  // --- Text panels ---
  for (const [name, el] of Object.entries(textPanels)) {
    updatePanel(el, opacities[name] ?? 0);
  }

  // --- Outro ---
  updateSection(outro, opacities["outro"] ?? 0);

  // --- Location dots ---
  const activeLocIdx = LOCATIONS.findIndex(
    (name) => (opacities[`text-${name}`] ?? 0) > 0,
  );
  locationDots.style.display = activeLocIdx >= 0 ? "" : "none";
  dots.forEach((dot, i) => {
    dot.style.background =
      i === activeLocIdx
        ? "rgba(255,255,255,0.8)"
        : "rgba(255,255,255,0.2)";
  });

  // --- Progress bar ---
  progressBar.style.width = `${scrollPercentage * 100}%`;
});

timeline.start();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function updateSection(el: HTMLElement, opacity: number) {
  el.style.opacity = String(opacity);
  el.style.transform = `translateY(${(1 - opacity) * 20}px)`;
  el.style.display = opacity > 0 ? "" : "none";
}

function updatePanel(el: HTMLElement, opacity: number) {
  el.style.opacity = String(opacity);
  el.style.transform = `translateY(calc(-50% + ${(1 - opacity) * 30}px))`;
  el.style.display = opacity > 0 ? "" : "none";
}
