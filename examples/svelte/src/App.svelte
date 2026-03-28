<script lang="ts">
  import type { StepConfig, EasingFunction } from "@multitrack/core";
  import {
    MultitrackProvider,
    ScrollContainer,
    FixedStage,
  } from "@multitrack/svelte";
  import MapScene from "./MapScene.svelte";

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

  const breakpoints = {
    mobile: "(max-width: 768px)",
    desktop: "(min-width: 769px)",
  };
</script>

<MultitrackProvider {config} {breakpoints} devtools>
  <ScrollContainer>
    <FixedStage>
      <MapScene />
    </FixedStage>
  </ScrollContainer>
</MultitrackProvider>
