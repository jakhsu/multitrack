import { inject, computed } from "vue";
import type { Timeline, Opacities } from "@multitrack/core";
import { MULTITRACK_KEY } from "./context.js";

function useMultitrackContext() {
  const state = inject(MULTITRACK_KEY);
  if (!state) {
    throw new Error(
      "[@multitrack/vue] Composables must be used within a <MultitrackProvider>",
    );
  }
  return state;
}

/**
 * Access the Timeline instance directly.
 */
export function useTimeline(): Timeline {
  return useMultitrackContext().value.timeline;
}

/**
 * Get current opacities for all steps.
 */
export function useOpacities<T extends string = string>() {
  const state = useMultitrackContext();
  return computed(() => state.value.opacities as Opacities<T>);
}

/**
 * Get opacity and active state for a single named step.
 */
export function useStep(name: string) {
  const state = useMultitrackContext();
  return {
    opacity: computed(() => state.value.opacities[name] ?? 0),
    isActive: computed(() => (state.value.opacities[name] ?? 0) > 0),
  };
}

/**
 * Get raw scroll progress and current step position.
 */
export function useScrollProgress() {
  const state = useMultitrackContext();
  return {
    scrollPercentage: computed(() => state.value.scrollPercentage),
    currentStep: computed(() => state.value.currentStep),
    totalSteps: computed(() => state.value.totalSteps),
  };
}
