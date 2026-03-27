import { useContext } from "react";
import type { Timeline, Opacities } from "@multitrack/core";
import { MultitrackContext } from "./context.js";

function useMultitrackContext() {
  const ctx = useContext(MultitrackContext);
  if (!ctx) {
    throw new Error(
      "[@multitrack/react] useTimeline must be used within a <MultitrackProvider>",
    );
  }
  return ctx;
}

/**
 * Access the Timeline instance directly.
 */
export function useTimeline(): Timeline {
  return useMultitrackContext().timeline;
}

/**
 * Get current opacities for all steps.
 */
export function useOpacities<T extends string = string>(): Opacities<T> {
  return useMultitrackContext().opacities as Opacities<T>;
}

/**
 * Get opacity and active state for a single named step.
 */
export function useStep(name: string): { opacity: number; isActive: boolean } {
  const { opacities } = useMultitrackContext();
  const opacity = opacities[name] ?? 0;
  return { opacity, isActive: opacity > 0 };
}

/**
 * Get raw scroll progress and current step position.
 */
export function useScrollProgress(): {
  scrollPercentage: number;
  currentStep: number;
  totalSteps: number;
} {
  const { scrollPercentage, currentStep, totalSteps } =
    useMultitrackContext();
  return { scrollPercentage, currentStep, totalSteps };
}
