import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StepConfig } from "@multitrack/react";
import {
  MultitrackProvider,
  ScrollContainer,
  FixedStage,
  Show,
  useStep,
  useOpacities,
  useScrollProgress,
} from "@multitrack/react";

/* ------------------------------------------------------------------ */
/*  Custom easings                                                     */
/* ------------------------------------------------------------------ */

/** Visible immediately, fades out over the last 30% of the step. */
const fadeOut = (t: number) => (t > 0.7 ? (1 - t) / 0.3 : 1);

/** Fades in over the first 20%, holds, fades out over the last 20%. */
const fadeInOut = (t: number) => {
  if (t < 0.2) return t / 0.2;
  if (t > 0.8) return (1 - t) / 0.2;
  return 1;
};

/** Fades in over the first 30%, then stays visible (good for last step). */
const fadeIn = (t: number) => Math.min(t / 0.3, 1);

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

const content: Record<
  string,
  { label: string; title: string; body: string }
> = {
  tokyo: {
    label: "URBAN DENSITY",
    title: "Tokyo",
    body: "37 million people inhabit the greater Tokyo area, making it the most populous metropolitan region on Earth. The city's rail network moves 40 million passengers daily\u2009\u2014\u2009more than many countries' entire population.",
  },
  alps: {
    label: "ELEVATION",
    title: "The Alps",
    body: "Stretching 1,200 kilometers across eight countries, the Alps are home to over 4,000 peaks above 2,000 meters. Glaciers here hold 40% of Europe's fresh water\u2009\u2014\u2009though they've lost half their volume since 1900.",
  },
  sahara: {
    label: "EXPANSE",
    title: "Sahara Desert",
    body: "At 9.2 million square kilometers, the Sahara is roughly the size of the United States. Beneath its surface lies the world's largest underground aquifer system\u2009\u2014\u2009ancient water sealed away for thousands of years.",
  },
  nyc: {
    label: "THE GRID",
    title: "New York City",
    body: "Manhattan's 1811 grid plan laid out 12 avenues and 155 cross-streets on what was then farmland and forest. Two centuries later, 1.6 million people live on this 23-square-mile island.",
  },
  amazon: {
    label: "BIODIVERSITY",
    title: "Amazon Basin",
    body: "The Amazon rainforest produces 20% of the world's oxygen and contains 10% of all species on Earth. Its river system carries one-fifth of all fresh water that flows into the world's oceans.",
  },
};

/* ------------------------------------------------------------------ */
/*  Step configuration  (2 tracks, 33 steps each)                      */
/* ------------------------------------------------------------------ */

const config: StepConfig[] = [
  // ── Map track: camera positions ──
  { name: "globe", duration: 4, track: "map" },
  { name: "tokyo", duration: 5, track: "map" },
  { name: "alps", duration: 5, track: "map" },
  { name: "sahara", duration: 5, track: "map" },
  { name: "nyc", duration: 5, track: "map" },
  { name: "amazon", duration: 5, track: "map" },
  { name: "globe-out", duration: 4, track: "map" },

  // ── Text track: narrative overlays ──
  { name: "title", duration: 4, track: "text", easing: fadeOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-tokyo", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-alps", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-sahara", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-nyc", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-amazon", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "outro", duration: 3, track: "text", easing: fadeIn },
];

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <MultitrackProvider config={config} devtools>
      <ScrollContainer>
        <FixedStage>
          <Scene />
        </FixedStage>
      </ScrollContainer>
    </MultitrackProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

const MAP_STEPS = ["globe", "tokyo", "alps", "sahara", "nyc", "amazon", "globe-out"] as const;
const LOCATIONS = ["tokyo", "alps", "sahara", "nyc", "amazon"] as const;

function Scene() {
  const { scrollPercentage } = useScrollProgress();
  const opacities = useOpacities();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const currentViewRef = useRef<string>("globe");

  // Initialise MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: views.globe.center,
      zoom: views.globe.zoom,
      pitch: views.globe.pitch,
      bearing: views.globe.bearing,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to active location when map step changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const active = MAP_STEPS.find((name) => opacities[name] > 0);
    if (active && active !== currentViewRef.current) {
      currentViewRef.current = active;
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
  }, [opacities]);

  return (
    <div className="scene">
      {/* Map background */}
      <div ref={mapContainer} className="map-container" />

      {/* Vignette for text readability */}
      <div className="vignette" />

      {/* Title */}
      <Show when="title">
        <TitleSection />
      </Show>

      {/* Location text panels — alternate left / right */}
      <Show when="text-tokyo">
        <TextPanel step="text-tokyo" position="left" {...content.tokyo} />
      </Show>
      <Show when="text-alps">
        <TextPanel step="text-alps" position="right" {...content.alps} />
      </Show>
      <Show when="text-sahara">
        <TextPanel step="text-sahara" position="left" {...content.sahara} />
      </Show>
      <Show when="text-nyc">
        <TextPanel step="text-nyc" position="right" {...content.nyc} />
      </Show>
      <Show when="text-amazon">
        <TextPanel step="text-amazon" position="left" {...content.amazon} />
      </Show>

      {/* Outro */}
      <Show when="outro">
        <OutroSection />
      </Show>

      {/* Location dots */}
      <LocationDots />

      {/* Progress bar */}
      <div
        className="progress-bar"
        style={{ width: `${scrollPercentage * 100}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Title                                                              */
/* ------------------------------------------------------------------ */

function TitleSection() {
  const { opacity } = useStep("title");
  return (
    <div
      className="title-section"
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 20}px)`,
      }}
    >
      <p className="title-kicker">@multitrack presents</p>
      <h1 className="title-heading">Earth in Motion</h1>
      <p className="title-sub">A scroll-driven journey across the planet</p>
      <div className="scroll-hint">&darr; scroll to explore</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Text panel                                                         */
/* ------------------------------------------------------------------ */

function TextPanel({
  step,
  label,
  title,
  body,
  position,
}: {
  step: string;
  label: string;
  title: string;
  body: string;
  position: "left" | "right";
}) {
  const { opacity } = useStep(step);
  return (
    <div
      className={`text-panel text-panel--${position}`}
      style={{
        opacity,
        transform: `translateY(calc(-50% + ${(1 - opacity) * 30}px))`,
      }}
    >
      <p className="text-panel__label">{label}</p>
      <h2 className="text-panel__title">{title}</h2>
      <p className="text-panel__body">{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outro                                                              */
/* ------------------------------------------------------------------ */

function OutroSection() {
  const { opacity } = useStep("outro");
  return (
    <div
      className="outro-section"
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 20}px)`,
      }}
    >
      <h2 className="outro-heading">The world keeps moving.</h2>
      <p className="outro-sub">
        Built with @multitrack &mdash; scroll-driven animation engine
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Location dots                                                      */
/* ------------------------------------------------------------------ */

function LocationDots() {
  const opacities = useOpacities();
  const activeIndex = LOCATIONS.findIndex(
    (name) => (opacities[`text-${name}`] ?? 0) > 0,
  );

  if (activeIndex === -1) return null;

  return (
    <div className="location-dots">
      {LOCATIONS.map((_, i) => (
        <div
          key={i}
          className="location-dot"
          style={{
            background:
              i === activeIndex
                ? "rgba(255,255,255,0.8)"
                : "rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
}
