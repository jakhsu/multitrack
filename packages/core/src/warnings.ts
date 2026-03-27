/**
 * Dev-mode warnings for common configuration mistakes.
 * Gated behind process.env.NODE_ENV !== 'production' for tree-shaking.
 */

// Minimal declaration so we don't need @types/node in this browser-first package.
declare const process: { env?: { NODE_ENV?: string } } | undefined;

export type WarningCode =
  | "ZERO_DURATION"
  | "LONE_TRACK"
  | "SNAP_LONG_STEP"
  | "UNKNOWN_BREAKPOINT";

const SNAP_LONG_THRESHOLD = 5;

/** Tracks which warnings have already been emitted (deduplicate per session). */
const emitted = new Set<string>();

/**
 * Emit a dev-mode warning. Each code+message combo fires at most once.
 */
function warn(code: WarningCode, message: string): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return;

  const key = `${code}:${message}`;
  if (emitted.has(key)) return;
  emitted.add(key);

  console.warn(`[@multitrack] ${code}: ${message}`);
}

/** Clear emitted warnings. Exposed for testing. */
export function resetWarnings(): void {
  emitted.clear();
}

/**
 * Validate step configs and emit warnings for common mistakes.
 * Called from resolveSteps() before resolution.
 */
export function validateStepConfigs(
  config: Array<{ name: string; duration: number; track: string; easing?: string | Function }>,
): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return;

  // Track name frequency (excluding buffers)
  const trackCounts = new Map<string, number>();

  for (const step of config) {
    // ZERO_DURATION: step with duration <= 0
    if (step.duration <= 0 && step.name !== "buffer") {
      warn(
        "ZERO_DURATION",
        `Step "${step.name}" has duration ${step.duration}. This is probably unintentional.`,
      );
    }

    // SNAP_LONG_STEP: snap easing on a long step
    const easing = step.easing ?? "snap";
    if (easing === "snap" && step.duration > SNAP_LONG_THRESHOLD && step.name !== "buffer") {
      warn(
        "SNAP_LONG_STEP",
        `Step "${step.name}" uses snap easing with duration ${step.duration}. Snap on long steps looks jarring — consider "linear" or "easeInOut".`,
      );
    }

    // Count track usage (exclude buffers)
    if (step.name !== "buffer") {
      trackCounts.set(step.track, (trackCounts.get(step.track) ?? 0) + 1);
    }
  }

  // LONE_TRACK: track name appears only once (likely a typo)
  // Only warn if there are multiple tracks total (single-track configs are fine)
  if (trackCounts.size > 1) {
    for (const [track, count] of trackCounts) {
      if (count === 1) {
        warn(
          "LONE_TRACK",
          `Track "${track}" has only one step. Is this a typo?`,
        );
      }
    }
  }
}

/**
 * Validate that all `when` values in step configs reference known breakpoint names.
 * Called once from Timeline constructor.
 */
export function validateBreakpointRefs(
  config: Array<{ name: string; when?: string }>,
  breakpointNames: string[],
): void {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return;

  const known = new Set(breakpointNames);
  for (const step of config) {
    if (step.when && !known.has(step.when)) {
      warn(
        "UNKNOWN_BREAKPOINT",
        `Step "${step.name}" references breakpoint "${step.when}" which is not defined. Known breakpoints: ${breakpointNames.join(", ") || "(none)"}`,
      );
    }
  }
}
