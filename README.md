# @multitrack

[![npm @multitrack/core](https://img.shields.io/npm/v/@multitrack/core?label=%40multitrack%2Fcore)](https://www.npmjs.com/package/@multitrack/core)
[![npm @multitrack/react](https://img.shields.io/npm/v/@multitrack/react?label=%40multitrack%2Freact)](https://www.npmjs.com/package/@multitrack/react)
[![CI](https://github.com/jakhsu/multitrack/actions/workflows/ci.yml/badge.svg)](https://github.com/jakhsu/multitrack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jakhsu/multitrack)

A scroll-driven animation engine with a multi-track timeline architecture, inspired by video editing software.

Originally built for a [production data journalism project](https://campaign.theinitium.com/20241031-china-land-subsidence/index.html/) at Initium Media — an interactive piece visualizing land subsidence across 82+ Chinese cities. The engine was hand-crafted without animation libraries because no existing tool supported the multi-track timeline model needed for the project. This repo extracts and generalizes that engine into a proper SDK.

```
@multitrack/core        Pure TypeScript engine. Zero dependencies.
    ↓                   Config → resolved steps → opacity calculations
@multitrack/react       React bindings. Provider, hooks, components.
    ↓                   useStep(), useOpacities(), <Show>, <ScrollContainer>
@multitrack/devtools    Chrome DevTools extension. Timeline inspector panel.
                        Visualizes tracks, playhead, active steps, event log.
```

## Quick start

```typescript
import { MultitrackProvider, ScrollContainer, FixedStage, Show, useStep } from "@multitrack/react";
import type { StepConfig } from "@multitrack/core";

const config: StepConfig[] = [
  { name: "intro", duration: 3, track: "main", easing: "linear" },
  { name: "feature", duration: 5, track: "main" },
  { name: "outro", duration: 3, track: "main", easing: "linear" },

  // Independent text track — overlaps freely with main
  { name: "buffer", duration: 4, track: "text" },
  { name: "caption", duration: 3, track: "text" },
];

function App() {
  return (
    <MultitrackProvider config={config} devtools>
      <ScrollContainer>
        <FixedStage>
          <Show when="intro">
            <IntroSection />
          </Show>
          <Show when="feature">
            <FeatureSection />
          </Show>
          <Show when="caption">
            <Caption text="Tracks are independent." />
          </Show>
        </FixedStage>
      </ScrollContainer>
    </MultitrackProvider>
  );
}

function IntroSection() {
  const { opacity } = useStep("intro");
  return (
    <div style={{ opacity, transform: `translateY(${(1 - opacity) * 40}px)` }}>
      <h1>Welcome</h1>
    </div>
  );
}
```

The scroll position acts as a playhead across parallel tracks. Each step has a duration (in viewport-heights), and the engine calculates opacity values for every step at every scroll position.

## Features

### Multi-track timeline

Like a video editor (Premiere Pro, Final Cut), each track maintains its own independent cursor. Steps on different tracks overlap freely — adding or removing steps on one track doesn't affect others.

```
main track:  [intro:0-3][feature:3-8][outro:8-11]
text track:  [buffer:0-4][caption:4-7]
accent:      [buffer:0-5][highlight:5-11]
```

### Config-driven API

Animations are defined declaratively as data, not imperative code. The engine resolves durations into absolute positions, calculates opacity for each step based on scroll progress, and lets your framework handle rendering.

### Easing presets

Built-in presets: `snap` (default — binary 0/1), `linear`, `easeIn`, `easeOut`, `easeInOut`. Or pass a custom function.

```typescript
{ name: "fade-in", duration: 3, track: "main", easing: "linear" }
{ name: "appear", duration: 5, track: "main" }                        // snap (default)
{ name: "custom", duration: 4, track: "main", easing: (t) => t * t }  // custom
```

### Middleware

Intercept `step:enter` and `step:exit` events with `timeline.use()`. Call `next()` to pass through, or skip it to swallow the event.

```typescript
timeline.use((event, next) => {
  analytics.track(event.type, event.payload.name);
  next();
});
```

### Scope cleanup

Collect subscriptions into a scope and dispose them all at once — similar to GSAP's `gsap.context()`.

```typescript
const ctx = timeline.scope(() => {
  timeline.on("step:enter", handleEnter);
  timeline.on("scroll", handleScroll);
  timeline.use(loggingMiddleware);
});

// later: clean up everything at once
ctx.dispose();
```

### Responsive tracks

Include or exclude steps based on named breakpoints tied to CSS media queries. Steps without `when` are always included.

```typescript
const timeline = new Timeline({
  config: [
    { name: "mobile-hero", duration: 5, track: "main", when: "mobile" },
    { name: "desktop-hero", duration: 8, track: "main", when: "desktop" },
    { name: "shared-outro", duration: 3, track: "main" },
  ],
  breakpoints: {
    mobile: "(max-width: 767px)",
    desktop: "(min-width: 768px)",
  },
});
```

The timeline automatically reconfigures when breakpoints change, emitting a `timeline:reconfigure` event.

### Conditional steps

For runtime conditions beyond media queries, use the `condition` predicate:

```typescript
{ name: "mobile-hero", duration: 5, track: "main", condition: () => window.innerWidth < 768 }
```

### Dev-mode warnings

In development, the engine validates your config and warns about common mistakes:

- Zero or negative duration steps
- Using `snap` easing on long steps (likely unintended)
- Lone tracks that might be typos
- `when` references to undefined breakpoints

### Chrome DevTools extension

Load `packages/devtools/dist/` as an unpacked extension to get:

- Multi-track timeline visualization with color-coded step blocks
- Red playhead following current scroll position
- Active steps table with live opacity values
- Event log showing step:enter / step:exit events

### Framework agnostic

The core engine is pure TypeScript with zero dependencies. Use it standalone or with the provided React bindings. Vue, Svelte, and vanilla TypeScript examples are included in `examples/`.

## Packages

| Package | Description |
|---|---|
| [`@multitrack/core`](packages/core) | Framework-agnostic engine. `Timeline`, opacity calculations, scroll driver, easings, middleware, scopes. |
| [`@multitrack/react`](packages/react) | React bindings. `MultitrackProvider`, `ScrollContainer`, `FixedStage`, `Show`, `useStep`, `useOpacities`, `useScrollProgress`, `useTimeline`. |
| [`@multitrack/devtools`](packages/devtools) | Chrome DevTools extension. Timeline inspector panel. |

## How it differs from GSAP ScrollTrigger / Scrollama

| | @multitrack | GSAP ScrollTrigger | Scrollama |
|---|---|---|---|
| **Mental model** | Video editor timeline (multi-track) | Per-element triggers | Per-section observers |
| **Configuration** | Declarative step objects | Imperative API | Callback-based |
| **Tracks** | Independent parallel timelines | Single trigger per element | N/A |
| **Dependencies** | Zero (core) | GSAP required | IntersectionObserver polyfill |
| **Devtools** | Chrome extension with timeline panel | Browser plugin | None |
| **Framework** | Agnostic core + React bindings | Framework-agnostic | Framework-agnostic |

## Development

```bash
pnpm install
pnpm build          # build all packages
pnpm test           # run tests (67 tests across 8 suites)
pnpm dev            # start example app
```
