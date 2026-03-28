import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Custom easings                                                     */
/*  (identical to @multitrack version — these are the opacity          */
/*   envelope functions, NOT GSAP ease values)                         */
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
/*  (identical to @multitrack version)                                 */
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
/*  (identical to @multitrack version)                                 */
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
/*  Step configuration                                                 */
/*                                                                     */
/*  In @multitrack this is ALL you need:                               */
/*    const config: StepConfig[] = [ ... ];                            */
/*    <MultitrackProvider config={config} breakpoints={breakpoints}>   */
/*                                                                     */
/*  With GSAP we need to manually resolve step positions, compute      */
/*  pixel offsets, and wire up individual ScrollTriggers.              */
/* ------------------------------------------------------------------ */

interface StepDef {
  name: string;
  duration: number;
  track: string;
  easing?: (t: number) => number;
  when?: "desktop";
}

const ALL_STEPS: StepDef[] = [
  // ── Map track: camera positions ──
  { name: "globe", duration: 4, track: "map" },
  { name: "tokyo", duration: 5, track: "map" },
  { name: "alps", duration: 5, track: "map", when: "desktop" },
  { name: "sahara", duration: 5, track: "map" },
  { name: "nyc", duration: 5, track: "map", when: "desktop" },
  { name: "amazon", duration: 5, track: "map" },
  { name: "globe-out", duration: 4, track: "map" },

  // ── Text track: narrative overlays ──
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
/*  Manual step resolver                                               */
/*                                                                     */
/*  @multitrack does this automatically via resolveSteps().            */
/*  With GSAP we must reimplement the multi-track position math.       */
/* ------------------------------------------------------------------ */

interface ResolvedStep extends StepDef {
  start: number; // in vh units
  end: number;
}

function resolveStepsForBreakpoint(isDesktop: boolean): {
  steps: ResolvedStep[];
  totalVh: number;
} {
  const filtered = ALL_STEPS.filter(
    (s) => !s.when || (s.when === "desktop" && isDesktop),
  );

  const cursors: Record<string, number> = {};
  const steps: ResolvedStep[] = filtered.map((s) => {
    const start = cursors[s.track] ?? 0;
    const end = start + s.duration;
    cursors[s.track] = end;
    return { ...s, start, end };
  });

  const totalVh = Math.max(...Object.values(cursors));
  return { steps, totalVh };
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/*                                                                     */
/*  Compare with @multitrack version:                                  */
/*    <MultitrackProvider config={config} breakpoints={breakpoints}>   */
/*      <ScrollContainer>                                              */
/*        <FixedStage>                                                 */
/*          <Scene />                                                  */
/*          <MiddlewareLog />                                          */
/*        </FixedStage>                                                */
/*      </ScrollContainer>                                             */
/*    </MultitrackProvider>                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // ── Refs for every animated element ──
  // (@multitrack: not needed — useStep() handles this)
  const titleRef = useRef<HTMLDivElement>(null);
  const textTokyoRef = useRef<HTMLDivElement>(null);
  const textAlpsRef = useRef<HTMLDivElement>(null);
  const textSaharaRef = useRef<HTMLDivElement>(null);
  const textNycRef = useRef<HTMLDivElement>(null);
  const textAmazonRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);

  // ── Map for step name → DOM ref ──
  // (@multitrack: not needed)
  const textRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    title: titleRef,
    "text-tokyo": textTokyoRef,
    "text-alps": textAlpsRef,
    "text-sahara": textSaharaRef,
    "text-nyc": textNycRef,
    "text-amazon": textAmazonRef,
    outro: outroRef,
  };

  // ── React state for active steps ──
  // (@multitrack: <Show when="..."> handles this declaratively)
  const [activeSteps, setActiveSteps] = useState<Set<string>>(
    () => new Set(["title"]),
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [events, setEvents] = useState<
    Array<{ type: string; name: string }>
  >([]);

  // ── Map refs ──
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const currentViewRef = useRef<string>("globe");

  // Initialise MapLibre (identical to @multitrack version)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
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

  // ── Event logger ──
  // (@multitrack: timeline.use((event, next) => { ... next(); }))
  const logEvent = useCallback(
    (type: string, name: string) => {
      if (name.startsWith("buffer")) return;
      setEvents((prev) => [
        ...prev.slice(-4),
        { type, name },
      ]);
    },
    [],
  );

  // ── flyTo helper ──
  const flyTo = useCallback((name: string) => {
    const map = mapRef.current;
    if (!map || name === currentViewRef.current) return;
    currentViewRef.current = name;
    const view = views[name];
    if (!view) return;
    map.flyTo({
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      duration: 4000,
      essential: true,
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  GSAP ScrollTrigger setup                                         */
  /*                                                                   */
  /*  This is the core complexity. In @multitrack, ALL of this is      */
  /*  handled by <MultitrackProvider>, <ScrollContainer>, <FixedStage>,*/
  /*  <Show>, useStep(), and useOpacities().                           */
  /*                                                                   */
  /*  With GSAP we must:                                               */
  /*    1. Compute step positions for the current breakpoint           */
  /*    2. Set scroll container height manually                        */
  /*    3. Create a pinning ScrollTrigger                              */
  /*    4. Create individual ScrollTriggers per step with onUpdate     */
  /*    5. Apply custom easing functions manually in callbacks         */
  /*    6. Bridge GSAP state into React state for conditional render   */
  /*    7. Wire up map flyTo via onEnter/onEnterBack                   */
  /*    8. Wire up event logging per-trigger                           */
  /*    9. Duplicate all of the above for each responsive breakpoint   */
  /* ---------------------------------------------------------------- */

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      const setupForBreakpoint = (isDesktop: boolean) => {
        const { steps, totalVh } = resolveStepsForBreakpoint(isDesktop);
        const vh = window.innerHeight;
        const totalPx = totalVh * vh;

        // Set scroll container height
        // (@multitrack: <ScrollContainer> does this automatically)
        if (containerRef.current) {
          containerRef.current.style.height = `${totalPx + vh}px`;
        }

        // Pin the scene for the scroll duration
        // (@multitrack: <FixedStage> — just a wrapper component)
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: `+=${totalPx}`,
          pin: sceneRef.current!,
          pinSpacing: false,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          },
        });

        // Hide all text elements initially
        Object.values(textRefs).forEach((ref) => {
          if (ref.current) {
            gsap.set(ref.current, { opacity: 0 });
          }
        });

        // Reset active steps for this breakpoint
        const initialActive = new Set<string>();

        // ── Create ScrollTriggers for each text step ──
        // (@multitrack: useStep(name) — one hook call per component)
        const textSteps = steps.filter(
          (s) => s.track === "text" && s.easing && !s.name.startsWith("buffer"),
        );

        for (const step of textSteps) {
          const ref = textRefs[step.name];
          if (!ref) continue;

          const startPx = (step.start / totalVh) * totalPx;
          const endPx = (step.end / totalVh) * totalPx;

          ScrollTrigger.create({
            trigger: containerRef.current,
            start: `top+=${startPx} top`,
            end: `top+=${endPx} top`,

            // Apply custom easing manually on every scroll frame
            // (@multitrack: easing is declared in config, applied automatically)
            onUpdate: (self) => {
              const el = ref.current;
              if (!el) return;
              const easing = step.easing ?? ((t: number) => (t > 0 ? 1 : 0));
              const opacity = easing(self.progress);

              // Direct DOM manipulation — no React re-render
              el.style.opacity = String(opacity);

              // Apply transform based on step type
              if (step.name === "title" || step.name === "outro") {
                el.style.transform = `translateY(${(1 - opacity) * 20}px)`;
              } else {
                el.style.transform = `translateY(calc(-50% + ${(1 - opacity) * 30}px))`;
              }
            },

            // Track active state for conditional rendering
            // (@multitrack: <Show when="..."> — one line)
            onToggle: (self) => {
              setActiveSteps((prev) => {
                const next = new Set(prev);
                if (self.isActive) next.add(step.name);
                else next.delete(step.name);
                return next;
              });
            },

            // Event logging — must be added to EACH trigger individually
            // (@multitrack: timeline.use() — single middleware for all events)
            onEnter: () => logEvent("step:enter", step.name),
            onLeave: () => logEvent("step:exit", step.name),
            onEnterBack: () => logEvent("step:enter", step.name),
            onLeaveBack: () => logEvent("step:exit", step.name),
          });

          // Check if initially active
          if (startPx === 0) initialActive.add(step.name);
        }

        setActiveSteps(initialActive);

        // ── Create ScrollTriggers for each map step ──
        // (@multitrack: const active = MAP_STEPS.find(n => opacities[n] > 0))
        const mapSteps = steps.filter((s) => s.track === "map");

        for (const step of mapSteps) {
          const startPx = (step.start / totalVh) * totalPx;
          const endPx = (step.end / totalVh) * totalPx;

          ScrollTrigger.create({
            trigger: containerRef.current,
            start: `top+=${startPx} top`,
            end: `top+=${endPx} top`,

            // Need BOTH onEnter and onEnterBack for bidirectional scroll
            // (@multitrack: handled automatically by opacity reactivity)
            onEnter: () => flyTo(step.name),
            onEnterBack: () => flyTo(step.name),

            // Map step events
            onLeave: () => logEvent("step:exit", step.name),
            onLeaveBack: () => logEvent("step:exit", step.name),
          });
        }
      };

      // ── Responsive: duplicate setup for each breakpoint ──
      // (@multitrack: { when: "desktop" } on step config — that's it)
      mm.add("(min-width: 769px)", () => {
        setupForBreakpoint(true);
      });

      mm.add("(max-width: 768px)", () => {
        setupForBreakpoint(false);
      });
    },
    {
      scope: containerRef,
      dependencies: [],
    },
  );

  // ── Determine visible locations for dots ──
  // (@multitrack: just check `opacities[name]`)
  const { steps: currentSteps } = resolveStepsForBreakpoint(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 769px)").matches
      : true,
  );
  const visibleLocations = (
    ["tokyo", "alps", "sahara", "nyc", "amazon"] as const
  ).filter((name) =>
    currentSteps.some((s) => s.name === `text-${name}`),
  );
  const activeLocationIndex = visibleLocations.findIndex((name) =>
    activeSteps.has(`text-${name}`),
  );

  /* ---------------------------------------------------------------- */
  /*  JSX                                                              */
  /*                                                                   */
  /*  Compare with @multitrack:                                        */
  /*    <Show when="title"><TitleSection /></Show>                     */
  /*    <Show when="text-tokyo"><TextPanel .../></Show>                */
  /*                                                                   */
  /*  GSAP: manual conditional render + pass refs + no useStep()       */
  /* ---------------------------------------------------------------- */

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        ref={sceneRef}
        className="scene"
        style={{ width: "100%", height: "100vh", position: "relative" }}
      >
        {/* Map background */}
        <div ref={mapContainerRef} className="map-container" />

        {/* Vignette */}
        <div className="vignette" />

        {/* Title — always in DOM, opacity driven by GSAP */}
        {activeSteps.has("title") && (
          <div ref={titleRef} className="title-section" style={{ opacity: 0 }}>
            <p className="title-kicker">GSAP ScrollTrigger version</p>
            <h1 className="title-heading">Earth in Motion</h1>
            <p className="title-sub">
              A scroll-driven journey across the planet
            </p>
            <div className="scroll-hint">&darr; scroll to explore</div>
          </div>
        )}

        {/* Location text panels */}
        {activeSteps.has("text-tokyo") && (
          <div
            ref={textTokyoRef}
            className="text-panel text-panel--left"
            style={{ opacity: 0 }}
          >
            <p className="text-panel__label">{content.tokyo.label}</p>
            <h2 className="text-panel__title">{content.tokyo.title}</h2>
            <p className="text-panel__body">{content.tokyo.body}</p>
          </div>
        )}

        {activeSteps.has("text-alps") && (
          <div
            ref={textAlpsRef}
            className="text-panel text-panel--right"
            style={{ opacity: 0 }}
          >
            <p className="text-panel__label">{content.alps.label}</p>
            <h2 className="text-panel__title">{content.alps.title}</h2>
            <p className="text-panel__body">{content.alps.body}</p>
          </div>
        )}

        {activeSteps.has("text-sahara") && (
          <div
            ref={textSaharaRef}
            className="text-panel text-panel--left"
            style={{ opacity: 0 }}
          >
            <p className="text-panel__label">{content.sahara.label}</p>
            <h2 className="text-panel__title">{content.sahara.title}</h2>
            <p className="text-panel__body">{content.sahara.body}</p>
          </div>
        )}

        {activeSteps.has("text-nyc") && (
          <div
            ref={textNycRef}
            className="text-panel text-panel--right"
            style={{ opacity: 0 }}
          >
            <p className="text-panel__label">{content.nyc.label}</p>
            <h2 className="text-panel__title">{content.nyc.title}</h2>
            <p className="text-panel__body">{content.nyc.body}</p>
          </div>
        )}

        {activeSteps.has("text-amazon") && (
          <div
            ref={textAmazonRef}
            className="text-panel text-panel--left"
            style={{ opacity: 0 }}
          >
            <p className="text-panel__label">{content.amazon.label}</p>
            <h2 className="text-panel__title">{content.amazon.title}</h2>
            <p className="text-panel__body">{content.amazon.body}</p>
          </div>
        )}

        {/* Outro */}
        {activeSteps.has("outro") && (
          <div ref={outroRef} className="outro-section" style={{ opacity: 0 }}>
            <h2 className="outro-heading">The world keeps moving.</h2>
            <p className="outro-sub">
              Built with GSAP ScrollTrigger &mdash; for comparison
            </p>
          </div>
        )}

        {/* Location dots */}
        {activeLocationIndex !== -1 && (
          <div className="location-dots">
            {visibleLocations.map((_, i) => (
              <div
                key={i}
                className="location-dot"
                style={{
                  background:
                    i === activeLocationIndex
                      ? "rgba(255,255,255,0.8)"
                      : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div
          className="progress-bar"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Event log panel */}
      {events.length > 0 && (
        <div className="middleware-log" style={{ position: "fixed" }}>
          <div className="middleware-log__title">Event Log (GSAP)</div>
          {events.map((e, i) => (
            <div key={i} className="middleware-log__entry">
              <span className="middleware-log__type">
                {e.type === "step:enter" ? "enter" : "exit "}
              </span>{" "}
              {e.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
