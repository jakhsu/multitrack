import type { EasingFunction, EasingPreset } from "./types.js";

/**
 * Binary snap: opacity is 1 when inside range, 0 outside.
 * This was the default behavior in the original engine (isLinear: false).
 */
export const snap: EasingFunction = () => 1;

/**
 * Linear interpolation from 0 to 1 over the step duration.
 * This was `isLinear: true` in the original engine.
 */
export const linear: EasingFunction = (t: number) => t;

/** Quadratic ease-in: slow start, fast end. */
export const easeIn: EasingFunction = (t: number) => t * t;

/** Quadratic ease-out: fast start, slow end. */
export const easeOut: EasingFunction = (t: number) => t * (2 - t);

/** Quadratic ease-in-out: slow start and end, fast middle. */
export const easeInOut: EasingFunction = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

/** Map of preset names to easing functions. */
export const easingPresets: Record<EasingPreset, EasingFunction> = {
  snap,
  linear,
  easeIn,
  easeOut,
  easeInOut,
};

/**
 * Resolve an easing value (preset name or custom function) to an EasingFunction.
 */
export function resolveEasing(
  easing: EasingPreset | EasingFunction | undefined,
): EasingFunction {
  if (easing === undefined) return snap;
  if (typeof easing === "function") return easing;
  return easingPresets[easing];
}
