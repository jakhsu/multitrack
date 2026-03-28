// --- Step Configuration (user-facing API) ---

/**
 * Easing function: takes a progress value (0-1) and returns an eased value (0-1).
 */
export type EasingFunction = (t: number) => number;

/**
 * Built-in easing preset names.
 */
export type EasingPreset =
  | "snap"
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut";

/**
 * User-provided step configuration. Declarative — consumers define animations
 * as data, not imperative code.
 *
 * Inspired by video editing: each step occupies a duration on a named track.
 */
export interface StepConfig {
  /** Unique identifier for this step. Use "buffer" for spacers (auto-renamed). */
  name: string;
  /** How many viewport-heights this step lasts. */
  duration: number;
  /** Which timeline track this step belongs to. */
  track: string;
  /** Easing for opacity transitions. Defaults to "snap" (binary 0 or 1). */
  easing?: EasingPreset | EasingFunction;
  /** Optional predicate — if provided, step is only included when this returns true. */
  condition?: () => boolean;
  /** Named breakpoint this step belongs to. Only included when that breakpoint matches. */
  when?: string;
}

// --- Resolved Step (internal, computed from StepConfig) ---

/**
 * A step with computed absolute positions on the timeline.
 * Produced by `resolveSteps()` from user-provided `StepConfig[]`.
 */
export interface Step {
  name: string;
  start: number;
  end: number;
  track: string;
  easing: EasingPreset | EasingFunction;
}

// --- Opacities ---

/**
 * Maps step names to their current opacity (0-1).
 * Generic so TypeScript can infer step names from user config.
 */
export type Opacities<T extends string = string> = Record<T, number>;

// --- Timeline Events ---

export interface StepEventPayload {
  name: string;
  track: string;
  start: number;
  end: number;
}

export interface ScrollEventPayload {
  scrollPercentage: number;
  currentStep: number;
}

export interface ReconfigureEventPayload {
  steps: Step[];
  totalSteps: number;
}

export interface TimelineEventMap {
  "step:enter": StepEventPayload;
  "step:exit": StepEventPayload;
  scroll: ScrollEventPayload;
  "timeline:reconfigure": ReconfigureEventPayload;
}

export type TimelineEventType = keyof TimelineEventMap;

export type TimelineEventHandler<T extends TimelineEventType> = (
  payload: TimelineEventMap[T],
) => void;

// --- Scroll Driver ---

export interface ScrollDriverOptions {
  /** Element to listen for scroll events on. Defaults to `window`. */
  target?: HTMLElement | Window;
}

// --- Timeline ---

// oxlint-disable-next-line no-unused-vars -- generic reserved for future type-safe step names
export interface TimelineOptions<T extends string = string> {
  config: StepConfig[];
  /** Enable devtools integration (exposes state on window.__MULTITRACK_DEVTOOLS__) */
  devtools?: boolean;
  /** Named breakpoints mapping to CSS media queries for responsive step inclusion. */
  breakpoints?: Record<string, string>;
}

// --- Devtools ---

export interface DevtoolsState {
  steps: Step[];
  currentStep: number;
  totalSteps: number;
  opacities: Opacities;
  scrollPercentage: number;
}
