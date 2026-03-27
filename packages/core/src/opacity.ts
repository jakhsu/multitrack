import type { EasingFunction, EasingPreset, Opacities, Step } from "./types.js";
import { resolveEasing } from "./easings.js";
import { stepNotFound } from "./errors.js";

/**
 * Calculate the opacity for a single step at a given scroll position.
 *
 * The easing function controls how opacity transitions within the step range:
 * - "snap": binary 0 or 1 (instant appear/disappear)
 * - "linear": smooth 0→1 over the step duration
 * - Custom easing function: any (t: number) => number mapping
 *
 * Extracted and generalized from sinking-china utils.ts:calculateScrollBasedOpacity()
 */
export function calculateStepOpacity(
  step: Step,
  totalSteps: number,
  scrollPercentage: number,
): number {
  const normalizedScroll = scrollPercentage * totalSteps;

  // Outside the step range
  if (normalizedScroll < step.start || normalizedScroll > step.end) {
    return 0;
  }

  // Last step stays visible once entered
  const isLastStep = step.end === totalSteps;
  if (isLastStep && normalizedScroll >= step.start) {
    const easing = resolveEasing(step.easing);
    // For snap, return 1; for others, calculate progress but cap at 1
    if (step.easing === "snap" || step.easing === undefined) return 1;
    const duration = step.end - step.start;
    if (duration === 0) return 1;
    const progress = Math.min((normalizedScroll - step.start) / duration, 1);
    return easing(progress);
  }

  // Apply easing
  const easing = resolveEasing(step.easing);

  // Snap mode: instant opacity
  if (step.easing === "snap" || step.easing === undefined) {
    return 1;
  }

  // Calculate progress within the step (0 to 1)
  const duration = step.end - step.start;
  if (duration === 0) return 1;
  const progress = (normalizedScroll - step.start) / duration;

  return easing(Math.max(0, Math.min(1, progress)));
}

/**
 * Calculate opacities for all steps at a given scroll position.
 *
 * Returns a record mapping step names to their current opacity (0-1).
 *
 * Extracted from sinking-china utils.ts:calculateAllOpacities()
 */
export function calculateAllOpacities<T extends string = string>(
  scrollPercentage: number,
  steps: Step[],
): Opacities<T> {
  const totalSteps = Math.max(...steps.map((s) => s.end));

  return steps.reduce(
    (acc, step) => {
      (acc as Record<string, number>)[step.name] = calculateStepOpacity(
        step,
        totalSteps,
        scrollPercentage,
      );
      return acc;
    },
    {} as Opacities<T>,
  );
}

/**
 * Get the start/end range for a named step.
 *
 * Extracted from sinking-china utils.ts:getStepRange()
 */
export function getStepRange(
  stepName: string,
  steps: Step[],
): { start: number; end: number } {
  const step = steps.find((s) => s.name === stepName);
  if (!step) {
    throw stepNotFound(stepName);
  }
  return { start: step.start, end: step.end };
}

/**
 * Get info about all steps that are active at a given position.
 *
 * Extracted from sinking-china utils.ts:getCurrentStepInfo()
 */
export function getCurrentSteps(
  currentStep: number,
  steps: Step[],
): Array<{ name: string; track: string; start: number; end: number }> {
  const active = steps.filter(
    (s) => currentStep >= s.start && currentStep < s.end,
  );

  if (active.length > 0) {
    return active.map((s) => ({
      name: s.name,
      track: s.track,
      start: s.start,
      end: s.end,
    }));
  }

  return [];
}
