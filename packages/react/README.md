# @multitrack/react

React bindings for [`@multitrack/core`](https://github.com/jakhsu/multitrack/tree/main/packages/core) — a scroll-driven animation engine with a multi-track timeline architecture.

## Install

```bash
npm install @multitrack/core @multitrack/react
```

## Quick start

```tsx
import { MultitrackProvider, ScrollContainer, FixedStage, Show, useStep } from "@multitrack/react";
import type { StepConfig } from "@multitrack/core";

const config: StepConfig[] = [
  { name: "intro", duration: 3, track: "main", easing: "linear" },
  { name: "feature", duration: 5, track: "main" },
  { name: "outro", duration: 3, track: "main", easing: "linear" },
];

function App() {
  return (
    <MultitrackProvider config={config}>
      <ScrollContainer>
        <FixedStage>
          <Show when="intro">
            <IntroSection />
          </Show>
          <Show when="feature">
            <FeatureSection />
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

## API

### `<MultitrackProvider>`

Wraps your app and creates the timeline instance. All hooks and components must be used within this provider.

```tsx
<MultitrackProvider config={config} breakpoints={breakpoints} devtools>
  {children}
</MultitrackProvider>
```

### Hooks

#### `useStep(name)`

Returns `{ opacity, isActive }` for a single step. Re-renders only when the step's values change.

#### `useOpacities()`

Returns an `Opacities` record (`{ [stepName]: number }`) for all steps.

#### `useScrollProgress()`

Returns the current scroll progress (0–1).

#### `useTimeline()`

Returns the underlying `Timeline` instance for advanced use cases.

### Components

#### `<ScrollContainer>`

The scrollable container that drives the timeline. Renders a `<div>` with the correct scroll height.

#### `<FixedStage>`

A fixed-position overlay inside `ScrollContainer` for content that stays in the viewport while scrolling.

#### `<Show when="stepName">`

Conditionally renders children when the named step is active (opacity > 0).

## License

MIT
