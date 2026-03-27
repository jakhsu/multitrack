# @multitrack

A scroll-driven animation engine with a multi-track timeline architecture, inspired by video editing software.

Originally built for a [production data journalism project](https://theinitium.com/) at Initium Media — an interactive piece visualizing land subsidence across 82+ Chinese cities. The engine was hand-crafted without animation libraries because no existing tool supported the multi-track timeline model needed for the project. This repo extracts and generalizes that engine into a proper SDK.

## Architecture

```
@multitrack/core        Pure TypeScript engine. Zero dependencies.
    ↓                   Config → resolved steps → opacity calculations
@multitrack/react       React bindings. Provider, hooks, components.
    ↓                   useStep(), useOpacities(), <Show>, <ScrollContainer>
@multitrack/devtools    Chrome DevTools extension. Timeline inspector panel.
                        Visualizes tracks, playhead, active steps, event log.
```

## How it works

Define animations as data, not imperative code:

```typescript
import { MultitrackProvider, ScrollContainer, FixedStage, Show, useStep } from "@multitrack/react";
import type { StepConfig } from "@multitrack/core";

const config: StepConfig[] = [
  // Main content track
  { name: "intro", duration: 3, track: "main", easing: "linear" },
  { name: "feature", duration: 5, track: "main" },
  { name: "outro", duration: 3, track: "main", easing: "linear" },

  // Text overlay track (independent timeline)
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

## Core concepts

### Multi-track timeline

Like a video editor (Premiere Pro, Final Cut), each track maintains its own independent cursor:

```
main track:  [intro:0-3][feature:3-8][outro:8-11]
text track:  [buffer:0-4][caption:4-7]
accent:      [buffer:0-5][highlight:5-11]
```

Steps on different tracks can overlap freely. Adding or removing steps on one track doesn't affect the others.

### Config-driven API

Animations are defined declaratively using `StepConfig` objects. The engine resolves durations into absolute positions, calculates opacity for each step based on scroll progress, and lets React (or any framework) handle rendering.

### Easing presets

```typescript
{ name: "fade-in", duration: 3, track: "main", easing: "linear" }    // smooth 0→1
{ name: "appear", duration: 5, track: "main" }                        // snap (default): binary 0/1
{ name: "custom", duration: 4, track: "main", easing: (t) => t * t }  // custom function
```

Built-in presets: `snap`, `linear`, `easeIn`, `easeOut`, `easeInOut`.

### Conditional predicates

Replace the original `mobileOnly`/`desktopOnly` booleans with a generic condition:

```typescript
{ name: "mobile-hero", duration: 5, track: "main", condition: () => window.innerWidth < 768 }
```

## Packages

### @multitrack/core

Framework-agnostic engine. Use it standalone or build your own bindings.

```typescript
import { Timeline } from "@multitrack/core";

const timeline = new Timeline({ config });
timeline.start();
timeline.on("scroll", ({ scrollPercentage }) => {
  const opacities = timeline.getOpacities(scrollPercentage);
  // opacities.intro === 0.75, opacities.feature === 0, etc.
});
timeline.on("step:enter", ({ name, track }) => { /* analytics, etc. */ });
```

**Exports:** `Timeline`, `ScrollDriver`, `resolveSteps`, `calculateAllOpacities`, `calculateStepOpacity`, `getStepRange`, `getCurrentSteps`, easing functions, `MultitrackError`.

### @multitrack/react

React hooks and components.

| Export | Description |
|---|---|
| `<MultitrackProvider>` | Context provider. Takes `config` and optional `devtools` flag. |
| `<ScrollContainer>` | Tall scrollable div (`totalSteps × 100vh`). |
| `<FixedStage>` | Fixed viewport stage. All animated content lives here. |
| `<Show when="stepName">` | Conditional render — unmounts children when step opacity is 0. |
| `useStep(name)` | Returns `{ opacity, isActive }` for a single step. |
| `useOpacities()` | Returns all opacities as a typed record. |
| `useScrollProgress()` | Returns `{ scrollPercentage, currentStep, totalSteps }`. |
| `useTimeline()` | Direct access to the `Timeline` instance. |

### @multitrack/devtools

Chrome DevTools extension. Load the `packages/devtools/dist/` folder as an unpacked extension.

Features:
- Multi-track timeline visualization with color-coded step blocks
- Red playhead following current scroll position
- Active steps table with live opacity values
- Event log showing step:enter / step:exit events
- Hover tooltips with step name and range

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
pnpm test           # run tests (33 tests across 4 suites)
pnpm dev            # start example app
```

## Project structure

```
packages/
  core/             @multitrack/core — pure TS engine
    src/
      types.ts        Type definitions
      timeline.ts     Timeline facade class
      resolve-steps.ts Step config → resolved positions
      opacity.ts      Opacity calculation engine
      scroll-driver.ts Scroll event management
      easings.ts      Easing presets and resolver
      emitter.ts      Typed event emitter
      errors.ts       Structured error codes
    __tests__/        33 unit tests
  react/            @multitrack/react — React bindings
    src/
      provider.tsx    MultitrackProvider context
      hooks.ts        useTimeline, useStep, useOpacities, useScrollProgress
      components.tsx  ScrollContainer, FixedStage, Show
  devtools/         @multitrack/devtools — Chrome extension
    src/
      manifest.json   Chrome extension manifest v3
      panel/          DevTools panel UI (vanilla JS + CSS)
      content-script.ts Page ↔ extension bridge
      background.ts   Service worker message relay
examples/
  react/            React example (@multitrack/react bindings)
  vue/              Vue 3 example (Composition API + @multitrack/core)
  svelte/           Svelte 5 example (runes + @multitrack/core)
  vanilla/          Vanilla TS example (pure @multitrack/core)
```
