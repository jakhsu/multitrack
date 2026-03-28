import type { Timeline, Opacities } from "@multitrack/core";
import { getMultitrackContext } from "./context.svelte.js";

/**
 * Access the Timeline instance directly.
 */
export function useTimeline(): Timeline {
  return getMultitrackContext().timeline;
}

/**
 * Get current opacities for all steps.
 */
export function useOpacities<T extends string = string>(): {
  readonly current: Opacities<T>;
} {
  const ctx = getMultitrackContext();
  return {
    get current() {
      return ctx.opacities as Opacities<T>;
    },
  };
}

/**
 * Get opacity and active state for a single named step.
 */
export function useStep(name: string): {
  readonly opacity: number;
  readonly isActive: boolean;
} {
  const ctx = getMultitrackContext();
  return {
    get opacity() {
      return ctx.opacities[name] ?? 0;
    },
    get isActive() {
      return (ctx.opacities[name] ?? 0) > 0;
    },
  };
}

/**
 * Get raw scroll progress and current step position.
 */
export function useScrollProgress(): {
  readonly scrollPercentage: number;
  readonly currentStep: number;
  readonly totalSteps: number;
} {
  const ctx = getMultitrackContext();
  return {
    get scrollPercentage() {
      return ctx.scrollPercentage;
    },
    get currentStep() {
      return ctx.currentStep;
    },
    get totalSteps() {
      return ctx.totalSteps;
    },
  };
}
