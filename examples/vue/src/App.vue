<script setup lang="ts">
import type { StepConfig, EasingFunction } from "@multitrack/core";
import { useTimeline } from "./composables/useTimeline.ts";
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ------------------------------------------------------------------ */
/*  Custom easings                                                     */
/* ------------------------------------------------------------------ */

const fadeOut: EasingFunction = (t) => (t > 0.7 ? (1 - t) / 0.3 : 1);

const fadeInOut: EasingFunction = (t) => {
  if (t < 0.2) return t / 0.2;
  if (t > 0.8) return (1 - t) / 0.2;
  return 1;
};

const fadeIn: EasingFunction = (t) => Math.min(t / 0.3, 1);

/* ------------------------------------------------------------------ */
/*  Map view states                                                    */
/* ------------------------------------------------------------------ */

const views: Record<
  string,
  { center: [number, number]; zoom: number; pitch: number; bearing: number }
> = {
  globe: { center: [20, 20], zoom: 1.8, pitch: 0, bearing: 0 },
  tokyo: { center: [139.75, 35.685], zoom: 12, pitch: 50, bearing: -17 },
  alps: { center: [10.5, 46.85], zoom: 9, pitch: 60, bearing: 30 },
  sahara: { center: [8, 23.5], zoom: 4, pitch: 0, bearing: 0 },
  nyc: { center: [-74.006, 40.713], zoom: 13, pitch: 55, bearing: -15 },
  amazon: { center: [-62, -3.5], zoom: 5, pitch: 20, bearing: 10 },
  "globe-out": { center: [0, 20], zoom: 1.8, pitch: 0, bearing: 0 },
};

/* ------------------------------------------------------------------ */
/*  Text content                                                       */
/* ------------------------------------------------------------------ */

const content: Record<string, { label: string; title: string; body: string }> =
  {
    tokyo: {
      label: "URBAN DENSITY",
      title: "Tokyo",
      body: "37 million people inhabit the greater Tokyo area, making it the most populous metropolitan region on Earth. The city\u2019s rail network moves 40 million passengers daily\u2009\u2014\u2009more than many countries\u2019 entire population.",
    },
    alps: {
      label: "ELEVATION",
      title: "The Alps",
      body: "Stretching 1,200 kilometers across eight countries, the Alps are home to over 4,000 peaks above 2,000 meters. Glaciers here hold 40% of Europe\u2019s fresh water\u2009\u2014\u2009though they\u2019ve lost half their volume since 1900.",
    },
    sahara: {
      label: "EXPANSE",
      title: "Sahara Desert",
      body: "At 9.2 million square kilometers, the Sahara is roughly the size of the United States. Beneath its surface lies the world\u2019s largest underground aquifer system\u2009\u2014\u2009ancient water sealed away for thousands of years.",
    },
    nyc: {
      label: "THE GRID",
      title: "New York City",
      body: "Manhattan\u2019s 1811 grid plan laid out 12 avenues and 155 cross-streets on what was then farmland and forest. Two centuries later, 1.6 million people live on this 23-square-mile island.",
    },
    amazon: {
      label: "BIODIVERSITY",
      title: "Amazon Basin",
      body: "The Amazon rainforest produces 20% of the world\u2019s oxygen and contains 10% of all species on Earth. Its river system carries one-fifth of all fresh water that flows into the world\u2019s oceans.",
    },
  };

/* ------------------------------------------------------------------ */
/*  Step configuration                                                 */
/* ------------------------------------------------------------------ */

const config: StepConfig[] = [
  // Map track
  { name: "globe", duration: 4, track: "map" },
  { name: "tokyo", duration: 5, track: "map" },
  { name: "alps", duration: 5, track: "map", when: "desktop" },
  { name: "sahara", duration: 5, track: "map" },
  { name: "nyc", duration: 5, track: "map", when: "desktop" },
  { name: "amazon", duration: 5, track: "map" },
  { name: "globe-out", duration: 4, track: "map" },

  // Text track
  { name: "title", duration: 4, track: "text", easing: fadeOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-tokyo", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-alps", duration: 4, track: "text", easing: fadeInOut, when: "desktop" },
  { name: "buffer", duration: 1, track: "text", when: "desktop" },
  { name: "text-sahara", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-nyc", duration: 4, track: "text", easing: fadeInOut, when: "desktop" },
  { name: "buffer", duration: 1, track: "text", when: "desktop" },
  { name: "text-amazon", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "outro", duration: 3, track: "text", easing: fadeIn },
];

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

const { scrollPercentage, opacities, totalSteps } = useTimeline(config, {
  breakpoints: {
    mobile: "(max-width: 768px)",
    desktop: "(min-width: 769px)",
  },
});

const MAP_STEPS = [
  "globe",
  "tokyo",
  "alps",
  "sahara",
  "nyc",
  "amazon",
  "globe-out",
];
const LOCATIONS = ["tokyo", "alps", "sahara", "nyc", "amazon"];

/* ------------------------------------------------------------------ */
/*  Map                                                                */
/* ------------------------------------------------------------------ */

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
let currentView = "globe";

onMounted(() => {
  if (!mapContainer.value) return;
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: "https://tiles.openfreemap.org/styles/positron",
    center: views.globe.center,
    zoom: views.globe.zoom,
    pitch: views.globe.pitch,
    bearing: views.globe.bearing,
    interactive: false,
    attributionControl: false,
  });
});

onUnmounted(() => {
  map?.remove();
  map = null;
});

watch(opacities, (o) => {
  if (!map) return;
  const active = MAP_STEPS.find((name) => (o[name] ?? 0) > 0);
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
});

/* ------------------------------------------------------------------ */
/*  Computed helpers                                                    */
/* ------------------------------------------------------------------ */

const activeLocationIndex = computed(() =>
  LOCATIONS.findIndex((name) => (opacities.value[`text-${name}`] ?? 0) > 0),
);

function panelStyle(name: string) {
  const o = opacities.value[name] ?? 0;
  return {
    opacity: o,
    transform: `translateY(calc(-50% + ${(1 - o) * 30}px))`,
  };
}

function sectionStyle(name: string) {
  const o = opacities.value[name] ?? 0;
  return {
    opacity: o,
    transform: `translateY(${(1 - o) * 20}px)`,
  };
}
</script>

<template>
  <div :style="{ height: totalSteps * 100 + 'vh' }">
    <div class="fixed-stage">
      <div class="scene">
        <!-- Map -->
        <div ref="mapContainer" class="map-container" />

        <!-- Vignette -->
        <div class="vignette" />

        <!-- Title -->
        <div
          v-if="(opacities['title'] ?? 0) > 0"
          class="title-section"
          :style="sectionStyle('title')"
        >
          <p class="title-kicker">@multitrack presents</p>
          <h1 class="title-heading">Earth in Motion</h1>
          <p class="title-sub">A scroll-driven journey across the planet</p>
          <div class="scroll-hint">&darr; scroll to explore</div>
        </div>

        <!-- Text panels -->
        <div
          v-if="(opacities['text-tokyo'] ?? 0) > 0"
          class="text-panel text-panel--left"
          :style="panelStyle('text-tokyo')"
        >
          <p class="text-panel__label">{{ content.tokyo.label }}</p>
          <h2 class="text-panel__title">{{ content.tokyo.title }}</h2>
          <p class="text-panel__body">{{ content.tokyo.body }}</p>
        </div>

        <div
          v-if="(opacities['text-alps'] ?? 0) > 0"
          class="text-panel text-panel--right"
          :style="panelStyle('text-alps')"
        >
          <p class="text-panel__label">{{ content.alps.label }}</p>
          <h2 class="text-panel__title">{{ content.alps.title }}</h2>
          <p class="text-panel__body">{{ content.alps.body }}</p>
        </div>

        <div
          v-if="(opacities['text-sahara'] ?? 0) > 0"
          class="text-panel text-panel--left"
          :style="panelStyle('text-sahara')"
        >
          <p class="text-panel__label">{{ content.sahara.label }}</p>
          <h2 class="text-panel__title">{{ content.sahara.title }}</h2>
          <p class="text-panel__body">{{ content.sahara.body }}</p>
        </div>

        <div
          v-if="(opacities['text-nyc'] ?? 0) > 0"
          class="text-panel text-panel--right"
          :style="panelStyle('text-nyc')"
        >
          <p class="text-panel__label">{{ content.nyc.label }}</p>
          <h2 class="text-panel__title">{{ content.nyc.title }}</h2>
          <p class="text-panel__body">{{ content.nyc.body }}</p>
        </div>

        <div
          v-if="(opacities['text-amazon'] ?? 0) > 0"
          class="text-panel text-panel--left"
          :style="panelStyle('text-amazon')"
        >
          <p class="text-panel__label">{{ content.amazon.label }}</p>
          <h2 class="text-panel__title">{{ content.amazon.title }}</h2>
          <p class="text-panel__body">{{ content.amazon.body }}</p>
        </div>

        <!-- Outro -->
        <div
          v-if="(opacities['outro'] ?? 0) > 0"
          class="outro-section"
          :style="sectionStyle('outro')"
        >
          <h2 class="outro-heading">The world keeps moving.</h2>
          <p class="outro-sub">
            Built with @multitrack &mdash; scroll-driven animation engine
          </p>
        </div>

        <!-- Location dots -->
        <div v-if="activeLocationIndex >= 0" class="location-dots">
          <div
            v-for="(_, i) in LOCATIONS"
            :key="i"
            class="location-dot"
            :style="{
              background:
                i === activeLocationIndex
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(255,255,255,0.2)',
            }"
          />
        </div>

        <!-- Progress bar -->
        <div
          class="progress-bar"
          :style="{ width: scrollPercentage * 100 + '%' }"
        />
      </div>
    </div>
  </div>
</template>

