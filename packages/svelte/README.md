# @multitrack/svelte

Svelte 5 bindings for [`@multitrack/core`](https://github.com/jakhsu/multitrack/tree/main/packages/core) — a scroll-driven animation engine with a multi-track timeline architecture.

## Install

```bash
npm install @multitrack/core @multitrack/svelte
```

## Quick start

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { MultitrackProvider, ScrollContainer, FixedStage, Show } from "@multitrack/svelte";
  import type { StepConfig } from "@multitrack/core";
  import IntroSection from "./IntroSection.svelte";
  import FeatureSection from "./FeatureSection.svelte";

  const config: StepConfig[] = [
    { name: "intro", duration: 3, track: "main", easing: "linear" },
    { name: "feature", duration: 5, track: "main" },
    { name: "outro", duration: 3, track: "main", easing: "linear" },
  ];
</script>

<MultitrackProvider {config}>
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
```

```svelte
<!-- IntroSection.svelte -->
<script lang="ts">
  import { useStep } from "@multitrack/svelte";

  const step = useStep("intro");
</script>

<div style:opacity={step.opacity} style:transform="translateY({(1 - step.opacity) * 40}px)">
  <h1>Welcome</h1>
</div>
```

## API

### `<MultitrackProvider>`

Wraps your app and creates the timeline instance. All composables and components must be used within this provider.

```svelte
<MultitrackProvider {config} {breakpoints} devtools>
  {@render children()}
</MultitrackProvider>
```

### Composables

#### `useStep(name)`

Returns a reactive object with `opacity` and `isActive` getters for a single step.

#### `useOpacities()`

Returns a reactive object with a `current` getter containing an `Opacities` record (`{ [stepName]: number }`) for all steps.

#### `useScrollProgress()`

Returns a reactive object with `scrollPercentage`, `currentStep`, and `totalSteps` getters.

#### `useTimeline()`

Returns the underlying `Timeline` instance for advanced use cases.

### Components

#### `<ScrollContainer>`

The scrollable container that drives the timeline. Renders a `<div>` with the correct scroll height.

#### `<FixedStage>`

A fixed-position overlay inside `ScrollContainer` for content that stays in the viewport while scrolling.

#### `<Show when="stepName">`

Conditionally renders children when the named step is active (opacity > 0).

### DevTools

Enable the Chrome DevTools integration by passing the `devtools` prop to the provider:

```svelte
<MultitrackProvider {config} devtools>
  {@render children()}
</MultitrackProvider>
```

This exposes timeline state to the [@multitrack/devtools](https://github.com/jakhsu/multitrack/tree/main/packages/devtools) Chrome extension, giving you a live timeline inspector with playhead visualization, active step opacities, and an event log.

## Full example with `useStep()`

For fine-grained control over individual steps, use the `useStep()` composable to get reactive `opacity` and `isActive` values and drive animations directly:

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { MultitrackProvider, ScrollContainer, FixedStage, Show } from "@multitrack/svelte";
  import type { StepConfig } from "@multitrack/core";
  import IntroSection from "./IntroSection.svelte";
  import FeatureSection from "./FeatureSection.svelte";
  import Caption from "./Caption.svelte";

  const config: StepConfig[] = [
    { name: "intro", duration: 3, track: "main", easing: "linear" },
    { name: "feature", duration: 5, track: "main" },
    { name: "outro", duration: 3, track: "main", easing: "linear" },

    // Independent text track — overlaps freely with main
    { name: "buffer", duration: 4, track: "text" },
    { name: "caption", duration: 3, track: "text" },
  ];
</script>

<MultitrackProvider {config} devtools>
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
```

```svelte
<!-- IntroSection.svelte -->
<script lang="ts">
  import { useStep } from "@multitrack/svelte";

  const step = useStep("intro");
</script>

<div style:opacity={step.opacity} style:transform="translateY({(1 - step.opacity) * 40}px)">
  <h1>Welcome</h1>
</div>
```

## License

MIT
