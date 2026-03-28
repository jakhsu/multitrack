// Provider
export { MultitrackProvider } from "./provider.js";

// Composables
export { useTimeline, useOpacities, useStep, useScrollProgress } from "./composables.js";

// Components
export { ScrollContainer, FixedStage, Show } from "./components.js";

// Re-export core types consumers commonly need
export type { StepConfig, Opacities, EasingPreset } from "@multitrack/core";
