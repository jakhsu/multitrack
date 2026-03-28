import type { Timeline, Opacities, Step } from "@multitrack/core";

export interface MultitrackContextValue {
  readonly timeline: Timeline;
  readonly steps: Step[];
  readonly totalSteps: number;
  readonly scrollPercentage: number;
  readonly currentStep: number;
  readonly opacities: Opacities;
}

export const MULTITRACK_CTX_KEY = Symbol("multitrack");
