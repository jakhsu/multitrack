// Core
export { Timeline } from "./timeline.js";
export { ScrollDriver } from "./scroll-driver.js";

// Step resolution
export { resolveSteps, getTotalSteps } from "./resolve-steps.js";

// Opacity engine
export {
  calculateStepOpacity,
  calculateAllOpacities,
  getStepRange,
  getCurrentSteps,
} from "./opacity.js";

// Easings
export { snap, linear, easeIn, easeOut, easeInOut, resolveEasing } from "./easings.js";
export { easingPresets } from "./easings.js";

// Errors
export { MultitrackError } from "./errors.js";

// Emitter
export { Emitter } from "./emitter.js";

// Types
export type {
  StepConfig,
  Step,
  Opacities,
  EasingFunction,
  EasingPreset,
  TimelineEventMap,
  TimelineEventType,
  TimelineEventHandler,
  StepEventPayload,
  ScrollEventPayload,
  ScrollDriverOptions,
  TimelineOptions,
  DevtoolsState,
} from "./types.js";
