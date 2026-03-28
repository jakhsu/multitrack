// Provider
export { default as MultitrackProvider } from "./MultitrackProvider.svelte";

// Composables
export {
  useTimeline,
  useOpacities,
  useStep,
  useScrollProgress,
} from "./composables.svelte.js";

// Components
export { default as ScrollContainer } from "./ScrollContainer.svelte";
export { default as FixedStage } from "./FixedStage.svelte";
export { default as Show } from "./Show.svelte";

// Context (advanced usage)
export {
  createMultitrackContext,
  getMultitrackContext,
} from "./context.svelte.js";

// Re-export core types consumers commonly need
export type { StepConfig, Opacities, EasingPreset } from "@multitrack/core";
