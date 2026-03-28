# @multitrack

[![npm @multitrack/core](https://img.shields.io/npm/v/@multitrack/core?label=%40multitrack%2Fcore)](https://www.npmjs.com/package/@multitrack/core)
[![core minzip](https://badgen.net/bundlephobia/minzip/@multitrack/core)](https://bundlephobia.com/package/@multitrack/core)
[![npm @multitrack/react](https://img.shields.io/npm/v/@multitrack/react?label=%40multitrack%2Freact)](https://www.npmjs.com/package/@multitrack/react)
[![react minzip](https://badgen.net/bundlephobia/minzip/@multitrack/react)](https://bundlephobia.com/package/@multitrack/react)
[![tree-shaking](https://badgen.net/bundlephobia/tree-shaking/@multitrack/core)](https://bundlephobia.com/package/@multitrack/core)
[![CI](https://github.com/jakhsu/multitrack/actions/workflows/ci.yml/badge.svg)](https://github.com/jakhsu/multitrack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A scroll-driven animation engine with a multi-track timeline architecture, inspired by video editing software.

<!-- TODO: Replace with actual recording — see docs/assets/ -->
<!-- ![hero demo](docs/assets/hero-demo.gif) -->

## Why @multitrack?

Most scroll libraries trigger animations per-element. @multitrack thinks in **tracks** — like Premiere Pro. You define steps on parallel timelines, and the scroll position acts as a single playhead across all of them.

| | @multitrack | GSAP ScrollTrigger | Scrollama |
|---|---|---|---|
| **Mental model** | Video editor timeline (multi-track) | Per-element triggers | Per-section observers |
| **Configuration** | Declarative step objects | Imperative API | Callback-based |
| **Tracks** | Independent parallel timelines | Single trigger per element | N/A |
| **Dependencies** | Zero (core) | GSAP required | IntersectionObserver polyfill |
| **Devtools** | Chrome extension with timeline panel | Browser plugin | None |
| **Framework** | Agnostic core + React bindings | Framework-agnostic | Framework-agnostic |

## Get started

> **Try it now** — no install needed:
>
> [![React](https://img.shields.io/badge/React-StackBlitz-087ea4?logo=react&logoColor=white)](https://stackblitz.com/github/jakhsu/multitrack?startScript=dev:react)
> [![React + GSAP](https://img.shields.io/badge/React+GSAP-StackBlitz-88CE02?logo=react&logoColor=white)](https://stackblitz.com/github/jakhsu/multitrack?startScript=dev:react-gsap)
> [![Vue](https://img.shields.io/badge/Vue-StackBlitz-4FC08D?logo=vuedotjs&logoColor=white)](https://stackblitz.com/github/jakhsu/multitrack?startScript=dev:vue)
> [![Svelte](https://img.shields.io/badge/Svelte-StackBlitz-FF3E00?logo=svelte&logoColor=white)](https://stackblitz.com/github/jakhsu/multitrack?startScript=dev:svelte)
> [![Vanilla TS](https://img.shields.io/badge/Vanilla_TS-StackBlitz-3178C6?logo=typescript&logoColor=white)](https://stackblitz.com/github/jakhsu/multitrack?startScript=dev:vanilla)

### Core only (any framework)

```bash
npm install @multitrack/core
```

### React

```bash
npm install @multitrack/core @multitrack/react
```

## Quick start: Core

```typescript
import { Timeline, ScrollDriver } from "@multitrack/core";

const timeline = new Timeline({
  config: [
    { name: "intro",   duration: 3, track: "main", easing: "linear" },
    { name: "feature", duration: 5, track: "main" },
    { name: "outro",   duration: 3, track: "main" },
  ],
});

const driver = new ScrollDriver(timeline, {
  container: document.querySelector("#scroll-container"),
});

timeline.on("step:enter", ({ name }) => console.log("entered", name));
timeline.on("scroll", () => console.log(timeline.getOpacities()));
```

Each step has a duration in viewport-heights. The engine calculates opacity for every step at every scroll position. See the [core API docs](packages/core) for the full API.

## Quick start: React

```tsx
import { MultitrackProvider, ScrollContainer, FixedStage, Show } from "@multitrack/react";

const config = [
  { name: "intro",   duration: 3, track: "main", easing: "linear" },
  { name: "feature", duration: 5, track: "main" },
  { name: "outro",   duration: 3, track: "main" },
];

function App() {
  return (
    <MultitrackProvider config={config}>
      <ScrollContainer>
        <FixedStage>
          <Show when="intro"><h1>Welcome</h1></Show>
          <Show when="feature"><FeatureSection /></Show>
          <Show when="outro"><h1>Fin</h1></Show>
        </FixedStage>
      </ScrollContainer>
    </MultitrackProvider>
  );
}
```

Need fine-grained control? Use the [`useStep()` hook](packages/react#usestepname) to get `{ opacity, isActive }` for any step. See the [React package docs](packages/react) for the full API.

## DevTools

<!-- TODO: Replace with actual recording — see docs/assets/ -->
<!-- ![devtools panel](docs/assets/devtools-panel.gif) -->

A Chrome DevTools extension that gives you a live timeline inspector: color-coded track visualization, red playhead following scroll, active steps table with live opacity values, and a step:enter / step:exit event log.

### Setup

1. Build the extension:
   ```bash
   git clone https://github.com/jakhsu/multitrack.git
   cd multitrack && pnpm install && pnpm build
   ```
2. Open `chrome://extensions`, enable **Developer Mode**
3. Click **Load unpacked** and select `packages/devtools/dist/`
4. Open your app's DevTools — the **Multitrack** panel appears

### Enable in your app

```typescript
// Core
const timeline = new Timeline({ config, devtools: true });

// React
<MultitrackProvider config={config} devtools>
```

## Features

### Multi-track timeline

Like a video editor, each track maintains its own independent cursor. Steps on different tracks overlap freely — adding or removing steps on one track doesn't affect others.

```
main track:  [intro:0-3][feature:3-8][outro:8-11]
text track:  [buffer:0-4][caption:4-7]
accent:      [buffer:0-5][highlight:5-11]
```

### Config-driven API

Animations are defined declaratively as data, not imperative code. The engine resolves durations into absolute positions and calculates opacity for each step based on scroll progress.

<details>
<summary><strong>Easing presets</strong> — built-in <code>snap</code>, <code>linear</code>, <code>easeIn</code>, <code>easeOut</code>, <code>easeInOut</code>, or custom functions</summary>

```typescript
{ name: "fade-in", duration: 3, track: "main", easing: "linear" }
{ name: "appear", duration: 5, track: "main" }                        // snap (default)
{ name: "custom", duration: 4, track: "main", easing: (t) => t * t }  // custom
```
</details>

<details>
<summary><strong>Middleware</strong> — intercept step:enter and step:exit events</summary>

```typescript
timeline.use((event, next) => {
  analytics.track(event.type, event.payload.name);
  next();
});
```

See [core docs](packages/core#middleware) for details.
</details>

<details>
<summary><strong>Scope cleanup</strong> — collect subscriptions and dispose them all at once</summary>

```typescript
const ctx = timeline.scope(() => {
  timeline.on("step:enter", handleEnter);
  timeline.on("scroll", handleScroll);
  timeline.use(loggingMiddleware);
});
ctx.dispose();
```

See [core docs](packages/core#scope-cleanup) for details.
</details>

<details>
<summary><strong>Responsive tracks</strong> — include/exclude steps based on CSS media queries</summary>

```typescript
const timeline = new Timeline({
  config: [
    { name: "mobile-hero", duration: 5, track: "main", when: "mobile" },
    { name: "desktop-hero", duration: 8, track: "main", when: "desktop" },
  ],
  breakpoints: { mobile: "(max-width: 767px)", desktop: "(min-width: 768px)" },
});
```

See [core docs](packages/core#responsive-tracks) for details.
</details>

<details>
<summary><strong>Conditional steps</strong> — runtime predicates beyond media queries</summary>

```typescript
{ name: "mobile-hero", duration: 5, track: "main", condition: () => window.innerWidth < 768 }
```

See [core docs](packages/core#conditional-steps) for details.
</details>

<details>
<summary><strong>Dev-mode warnings</strong> — catches common config mistakes</summary>

Validates zero/negative durations, `snap` easing on long steps, lone tracks, and undefined breakpoint references.

See [core docs](packages/core#dev-mode-warnings) for details.
</details>

### Framework agnostic

The core engine is pure TypeScript with zero dependencies. Use it standalone or with the provided React bindings. Vue, Svelte, and vanilla TypeScript examples are included in [`examples/`](examples).

## Packages

```
@multitrack/core        Pure TypeScript engine. Zero dependencies.
    ↓                   Config → resolved steps → opacity calculations
@multitrack/react       React bindings. Provider, hooks, components.
    ↓                   useStep(), useOpacities(), <Show>, <ScrollContainer>
@multitrack/devtools    Chrome DevTools extension. Timeline inspector panel.
                        Visualizes tracks, playhead, active steps, event log.
```

| Package | Description |
|---|---|
| [`@multitrack/core`](packages/core) | Framework-agnostic engine. `Timeline`, opacity calculations, scroll driver, easings, middleware, scopes. |
| [`@multitrack/react`](packages/react) | React bindings. `MultitrackProvider`, `ScrollContainer`, `FixedStage`, `Show`, `useStep`, `useOpacities`, `useScrollProgress`, `useTimeline`. |
| [`@multitrack/devtools`](packages/devtools) | Chrome DevTools extension. Timeline inspector panel. |

## Examples

| Example | Framework | Run |
|---|---|---|
| [React](examples/react) | React + MapLibre | `pnpm dev:react` |
| [Vue](examples/vue) | Vue 3 + MapLibre | `pnpm dev:vue` |
| [Svelte](examples/svelte) | Svelte 5 + MapLibre | `pnpm dev:svelte` |
| [Vanilla](examples/vanilla) | Vanilla TS + MapLibre | `pnpm dev:vanilla` |
| [React + GSAP](examples/react-gsap) | React + GSAP | `pnpm dev:react-gsap` |

## Background

Built for a [production data journalism project](https://campaign.theinitium.com/20241031-china-land-subsidence/index.html/) at Initium Media — an interactive piece visualizing land subsidence across 82+ Chinese cities. The engine was hand-crafted because no existing tool supported the multi-track timeline model needed. This repo extracts and generalizes that engine into a reusable SDK.

## Development

```bash
pnpm install
pnpm build          # build all packages
pnpm test           # run tests (67 tests across 8 suites)
pnpm dev            # start example app
```
