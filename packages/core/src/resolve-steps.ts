import type { Step, StepConfig } from "./types.js";
import { duplicateStepName, emptyConfig } from "./errors.js";
import { validateStepConfigs } from "./warnings.js";

/**
 * Resolve declarative step configs into absolute timeline positions.
 *
 * Each track maintains its own independent cursor. Steps are placed
 * sequentially within their track, producing parallel timelines that
 * can overlap across tracks.
 *
 * Extracted and generalized from sinking-china App.tsx:transformStepConfig()
 */
export function resolveSteps(config: StepConfig[]): Step[] {
  if (config.length === 0) {
    throw emptyConfig();
  }

  // Dev-mode warnings for common mistakes (tree-shaken in production)
  validateStepConfigs(config);

  // Filter by condition predicates
  const filtered = config.filter((step) => {
    if (step.condition) return step.condition();
    return true;
  });

  // Track cursors: each track maintains its own timeline position
  const trackCursors: Record<string, number> = {};
  let bufferIndex = 0;

  // Check for duplicate non-buffer names
  const seen = new Set<string>();

  const steps: Step[] = filtered.map((stepConfig) => {
    // Auto-rename buffers to avoid collisions
    const name =
      stepConfig.name === "buffer"
        ? `buffer_${++bufferIndex}`
        : stepConfig.name;

    // Validate uniqueness for non-buffer steps
    if (stepConfig.name !== "buffer") {
      if (seen.has(name)) {
        throw duplicateStepName(name);
      }
      seen.add(name);
    }

    const track = stepConfig.track;
    const start = trackCursors[track] ?? 0;
    const end = start + stepConfig.duration;
    trackCursors[track] = end;

    return {
      name,
      start,
      end,
      track,
      easing: stepConfig.easing ?? "snap",
    };
  });

  return steps;
}

/**
 * Get the total number of steps (the maximum end position across all tracks).
 */
export function getTotalSteps(steps: Step[]): number {
  return Math.max(...steps.map((s) => s.end));
}
