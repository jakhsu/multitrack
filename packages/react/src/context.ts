import { createContext } from "react";
import type { Timeline, Opacities, Step } from "@multitrack/core";

export interface MultitrackContextValue {
  timeline: Timeline;
  steps: Step[];
  totalSteps: number;
  scrollPercentage: number;
  currentStep: number;
  opacities: Opacities;
}

export const MultitrackContext = createContext<MultitrackContextValue | null>(
  null,
);
