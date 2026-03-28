# @multitrack/core

A scroll-driven animation engine with a multi-track timeline architecture, inspired by video editing software. Pure TypeScript, zero dependencies.

## Install

```bash
npm install @multitrack/core
```

## Usage

```typescript
import { Timeline, ScrollDriver } from "@multitrack/core";

const timeline = new Timeline({
  config: [
    { name: "intro", duration: 3, track: "main", easing: "linear" },
    { name: "feature", duration: 5, track: "main" },
    { name: "outro", duration: 3, track: "main", easing: "linear" },

    // Independent text track — overlaps freely with main
    { name: "buffer", duration: 4, track: "text" },
    { name: "caption", duration: 3, track: "text" },
  ],
});

// Connect to scroll position
const driver = new ScrollDriver(timeline, {
  container: document.querySelector("#scroll-container"),
});

// React to step changes
timeline.on("step:enter", ({ name }) => console.log("entered", name));
timeline.on("step:exit", ({ name }) => console.log("exited", name));

// Read opacity values at any scroll progress
const opacities = timeline.getOpacities();
// { intro: 0.8, feature: 0, outro: 0, buffer: 1, caption: 0 }
```

## API

### `Timeline`

The core engine. Resolves step configs into absolute positions and calculates opacity values at any scroll progress.

```typescript
const timeline = new Timeline({ config, breakpoints?, devtools? });

timeline.setProgress(0.5);           // Set playhead position (0–1)
timeline.getOpacities();             // Get all step opacities
timeline.getCurrentSteps();          // Get currently active steps
timeline.on("step:enter", handler);  // Listen to events
timeline.use(middleware);            // Add middleware
timeline.scope(() => { ... });       // Scoped subscriptions
timeline.dispose();                  // Clean up
```

### `ScrollDriver`

Connects a `Timeline` to a scrollable DOM element, translating scroll position into timeline progress.

### Easings

Built-in presets: `snap` (default — binary 0/1), `linear`, `easeIn`, `easeOut`, `easeInOut`. Or pass a custom function.

```typescript
{ name: "fade", duration: 3, track: "main", easing: "linear" }
{ name: "custom", duration: 4, track: "main", easing: (t) => t * t }
```

### Middleware

Intercept `step:enter` and `step:exit` events:

```typescript
timeline.use((event, next) => {
  analytics.track(event.type, event.payload.name);
  next();
});
```

### Responsive tracks

Include or exclude steps based on named breakpoints tied to CSS media queries:

```typescript
const timeline = new Timeline({
  config: [
    { name: "mobile-hero", duration: 5, track: "main", when: "mobile" },
    { name: "desktop-hero", duration: 8, track: "main", when: "desktop" },
  ],
  breakpoints: {
    mobile: "(max-width: 767px)",
    desktop: "(min-width: 768px)",
  },
});
```

## React bindings

See [`@multitrack/react`](https://github.com/jakhsu/multitrack/tree/main/packages/react) for React hooks and components.

## License

MIT
