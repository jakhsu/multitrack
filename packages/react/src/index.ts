// Provider
export { MultitrackProvider, type MultitrackProviderProps } from "./provider.js";

// Hooks
export { useTimeline, useOpacities, useStep, useScrollProgress } from "./hooks.js";

// Components
export { ScrollContainer, FixedStage, Show } from "./components.js";

// Re-export core types consumers commonly need
export type { StepConfig, Opacities, EasingPreset } from "@multitrack/core";
