# @multitrack/vue

Vue 3 bindings for [`@multitrack/core`](https://github.com/jakhsu/multitrack/tree/main/packages/core) — a scroll-driven animation engine with a multi-track timeline architecture.

## Install

```bash
npm install @multitrack/core @multitrack/vue
```

## Quick start

```vue
<script setup lang="ts">
import { MultitrackProvider, ScrollContainer, FixedStage, Show, useStep } from "@multitrack/vue";
import type { StepConfig } from "@multitrack/core";

const config: StepConfig[] = [
  { name: "intro", duration: 3, track: "main", easing: "linear" },
  { name: "feature", duration: 5, track: "main" },
  { name: "outro", duration: 3, track: "main", easing: "linear" },
];
</script>

<template>
  <MultitrackProvider :config="config">
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
</template>
```

```vue
<!-- IntroSection.vue -->
<script setup lang="ts">
import { useStep } from "@multitrack/vue";

const { opacity } = useStep("intro");
</script>

<template>
  <div :style="{ opacity: opacity, transform: `translateY(${(1 - opacity) * 40}px)` }">
    <h1>Welcome</h1>
  </div>
</template>
```

## API

### `<MultitrackProvider>`

Wraps your app and creates the timeline instance. All composables and components must be used within this provider.

```vue
<MultitrackProvider :config="config" :breakpoints="breakpoints" devtools>
  <slot />
</MultitrackProvider>
```

### Composables

#### `useStep(name)`

Returns `{ opacity, isActive }` as Vue `computed` refs for a single step.

#### `useOpacities()`

Returns a `computed` ref containing an `Opacities` record (`{ [stepName]: number }`) for all steps.

#### `useScrollProgress()`

Returns `{ scrollPercentage, currentStep, totalSteps }` as `computed` refs.

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

```vue
<MultitrackProvider :config="config" devtools>
  <slot />
</MultitrackProvider>
```

This exposes timeline state to the [@multitrack/devtools](https://github.com/jakhsu/multitrack/tree/main/packages/devtools) Chrome extension, giving you a live timeline inspector with playhead visualization, active step opacities, and an event log.

## Full example with `useStep()`

For fine-grained control over individual steps, use the `useStep()` composable to get `{ opacity, isActive }` computed refs and drive animations directly:

```vue
<script setup lang="ts">
import { MultitrackProvider, ScrollContainer, FixedStage, Show } from "@multitrack/vue";
import type { StepConfig } from "@multitrack/core";
import IntroSection from "./IntroSection.vue";
import FeatureSection from "./FeatureSection.vue";
import Caption from "./Caption.vue";

const config: StepConfig[] = [
  { name: "intro", duration: 3, track: "main", easing: "linear" },
  { name: "feature", duration: 5, track: "main" },
  { name: "outro", duration: 3, track: "main", easing: "linear" },

  // Independent text track — overlaps freely with main
  { name: "buffer", duration: 4, track: "text" },
  { name: "caption", duration: 3, track: "text" },
];
</script>

<template>
  <MultitrackProvider :config="config" devtools>
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
</template>
```

```vue
<!-- IntroSection.vue -->
<script setup lang="ts">
import { useStep } from "@multitrack/vue";

const { opacity } = useStep("intro");
</script>

<template>
  <div :style="{ opacity: opacity, transform: `translateY(${(1 - opacity) * 40}px)` }">
    <h1>Welcome</h1>
  </div>
</template>
```

## License

MIT
