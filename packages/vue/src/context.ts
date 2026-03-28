import type { InjectionKey, ShallowRef } from "vue";
import type { Timeline, Opacities, Step } from "@multitrack/core";

export interface MultitrackContextValue {
  timeline: Timeline;
  steps: Step[];
  totalSteps: number;
  scrollPercentage: number;
  currentStep: number;
  opacities: Opacities;
}

export const MULTITRACK_KEY: InjectionKey<
  ShallowRef<MultitrackContextValue>
> = Symbol("multitrack");
