<script lang="ts">
  import type { StepConfig, EasingFunction } from "@multitrack/core";
  import { createTimeline } from "./lib/timeline.svelte.ts";
  import { onDestroy, onMount } from "svelte";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";

  /* ---------------------------------------------------------------- */
  /*  Custom easings                                                   */
  /* ---------------------------------------------------------------- */

  const fadeOut: EasingFunction = (t) => (t > 0.7 ? (1 - t) / 0.3 : 1);

  const fadeInOut: EasingFunction = (t) => {
    if (t < 0.2) return t / 0.2;
    if (t > 0.8) return (1 - t) / 0.2;
    return 1;
  };

  const fadeIn: EasingFunction = (t) => Math.min(t / 0.3, 1);

  /* ---------------------------------------------------------------- */
  /*  Map view states                                                  */
  /* ---------------------------------------------------------------- */

  const views: Record<
    string,
    {
      center: [number, number];
      zoom: number;
      pitch: number;
      bearing: number;
    }
  > = {
    globe: { center: [20, 20], zoom: 1.8, pitch: 0, bearing: 0 },
    tokyo: { center: [139.75, 35.685], zoom: 12, pitch: 50, bearing: -17 },
    alps: { center: [10.5, 46.85], zoom: 9, pitch: 60, bearing: 30 },
    sahara: { center: [8, 23.5], zoom: 4, pitch: 0, bearing: 0 },
    nyc: { center: [-74.006, 40.713], zoom: 13, pitch: 55, bearing: -15 },
    amazon: { center: [-62, -3.5], zoom: 5, pitch: 20, bearing: 10 },
    "globe-out": { center: [0, 20], zoom: 1.8, pitch: 0, bearing: 0 },
  };

  /* ---------------------------------------------------------------- */
  /*  Text content                                                     */
  /* ---------------------------------------------------------------- */

  const content: Record<
    string,
    { label: string; title: string; body: string }
  > = {
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

  /* ---------------------------------------------------------------- */
  /*  Step configuration                                               */
  /* ---------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------- */
  /*  Timeline                                                         */
  /* ---------------------------------------------------------------- */

  const tl = createTimeline(config, {
    breakpoints: {
      mobile: "(max-width: 768px)",
      desktop: "(min-width: 769px)",
    },
  });
  onDestroy(() => tl.destroy());

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

  /* ---------------------------------------------------------------- */
  /*  Map                                                              */
  /* ---------------------------------------------------------------- */

  // oxlint-disable-next-line no-unassigned-vars -- assigned via Svelte bind:this
  let mapContainer: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let currentView = "globe";

  onMount(() => {
    map = new maplibregl.Map({
      container: mapContainer,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: views.globe.center,
      zoom: views.globe.zoom,
      pitch: views.globe.pitch,
      bearing: views.globe.bearing,
      interactive: false,
      attributionControl: false,
    });
  });

  onDestroy(() => {
    map?.remove();
    map = null;
  });

  // Reactive: fly to active map step
  $effect(() => {
    if (!map) return;
    const o = tl.opacities;
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

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                          */
  /* ---------------------------------------------------------------- */

  function activeLocationIndex() {
    return LOCATIONS.findIndex(
      (name) => (tl.opacities[`text-${name}`] ?? 0) > 0,
    );
  }
</script>

<div style:height="{tl.totalSteps * 100}vh">
  <div class="fixed-stage">
    <div class="scene">
      <!-- Map -->
      <div bind:this={mapContainer} class="map-container"></div>

      <!-- Vignette -->
      <div class="vignette"></div>

      <!-- Title -->
      {#if (tl.opacities["title"] ?? 0) > 0}
        {@const o = tl.opacities["title"] ?? 0}
        <div
          class="title-section"
          style:opacity={o}
          style:transform="translateY({(1 - o) * 20}px)"
        >
          <p class="title-kicker">@multitrack presents</p>
          <h1 class="title-heading">Earth in Motion</h1>
          <p class="title-sub">A scroll-driven journey across the planet</p>
          <div class="scroll-hint">&darr; scroll to explore</div>
        </div>
      {/if}

      <!-- Text panels -->
      {#each [
        { key: "text-tokyo", loc: "tokyo", pos: "left" },
        { key: "text-alps", loc: "alps", pos: "right" },
        { key: "text-sahara", loc: "sahara", pos: "left" },
        { key: "text-nyc", loc: "nyc", pos: "right" },
        { key: "text-amazon", loc: "amazon", pos: "left" },
      ] as { key, loc, pos }}
        {#if (tl.opacities[key] ?? 0) > 0}
          {@const o = tl.opacities[key] ?? 0}
          <div
            class="text-panel text-panel--{pos}"
            style:opacity={o}
            style:transform="translateY(calc(-50% + {(1 - o) * 30}px))"
          >
            <p class="text-panel__label">{content[loc].label}</p>
            <h2 class="text-panel__title">{content[loc].title}</h2>
            <p class="text-panel__body">{content[loc].body}</p>
          </div>
        {/if}
      {/each}

      <!-- Outro -->
      {#if (tl.opacities["outro"] ?? 0) > 0}
        {@const o = tl.opacities["outro"] ?? 0}
        <div
          class="outro-section"
          style:opacity={o}
          style:transform="translateY({(1 - o) * 20}px)"
        >
          <h2 class="outro-heading">The world keeps moving.</h2>
          <p class="outro-sub">
            Built with @multitrack &mdash; scroll-driven animation engine
          </p>
        </div>
      {/if}

      <!-- Location dots -->
      {#if activeLocationIndex() >= 0}
        <div class="location-dots">
          {#each LOCATIONS as _, i}
            <div
              class="location-dot"
              style:background={i === activeLocationIndex()
                ? "rgba(255,255,255,0.8)"
                : "rgba(255,255,255,0.2)"}
            ></div>
          {/each}
        </div>
      {/if}

      <!-- Progress bar -->
      <div
        class="progress-bar"
        style:width="{tl.scrollPercentage * 100}%"
      ></div>
    </div>
  </div>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html),
  :global(body) {
    width: 100%;
    overflow-x: hidden;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #0a0a0a;
    color: #fff;
  }

  :global(#app) {
    width: 100%;
  }

  .fixed-stage {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    touch-action: pan-y;
  }

  .scene {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .map-container {
    width: 100%;
    height: 100%;
    filter: invert(1) hue-rotate(180deg);
  }

  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 30%,
      rgba(0, 0, 0, 0.55) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  .title-section {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    text-align: center;
    padding: 0 24px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  .title-kicker {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
    margin-bottom: 16px;
  }

  .title-heading {
    font-size: clamp(36px, 7vw, 80px);
    font-weight: 300;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }

  .title-sub {
    font-size: 17px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 16px;
  }

  .scroll-hint {
    margin-top: 72px;
    font-size: 13px;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.2);
    animation: pulse 2.5s ease-in-out infinite;
  }

  .text-panel {
    position: absolute;
    top: 50%;
    max-width: 400px;
    padding: 32px 36px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    z-index: 10;
  }

  .text-panel--left {
    left: clamp(24px, 5vw, 80px);
  }

  .text-panel--right {
    right: clamp(24px, 5vw, 80px);
  }

  .text-panel__label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: rgba(255, 255, 255, 0.35);
    margin-bottom: 14px;
  }

  .text-panel__title {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 300;
    letter-spacing: -0.01em;
    line-height: 1.15;
  }

  .text-panel__body {
    font-size: 15px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.55);
    margin-top: 16px;
    line-height: 1.75;
  }

  .outro-section {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    text-align: center;
    padding: 0 24px;
  }

  .outro-heading {
    font-size: clamp(28px, 4.5vw, 52px);
    font-weight: 300;
    letter-spacing: -0.02em;
  }

  .outro-sub {
    font-size: 15px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.35);
    margin-top: 16px;
  }

  .location-dots {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 20;
  }

  .location-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    transition: background 0.4s ease;
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    z-index: 50;
    transition: width 0.1s linear;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.7;
    }
  }

  @media (max-width: 640px) {
    .text-panel {
      max-width: calc(100% - 32px);
      left: 16px !important;
      right: 16px !important;
      padding: 24px 28px;
    }

    .text-panel__body {
      font-size: 14px;
      line-height: 1.65;
    }
  }
</style>
