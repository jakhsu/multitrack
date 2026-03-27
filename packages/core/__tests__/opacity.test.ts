import { describe, it, expect } from "vitest";
import {
  calculateStepOpacity,
  calculateAllOpacities,
  getStepRange,
  getCurrentSteps,
} from "../src/opacity.js";
import { resolveSteps } from "../src/resolve-steps.js";
import type { Step } from "../src/types.js";

// Helper to create a resolved step quickly
function makeStep(
  name: string,
  start: number,
  end: number,
  easing: Step["easing"] = "snap",
): Step {
  return { name, start, end, track: "main", easing };
}

describe("calculateStepOpacity", () => {
  it("returns 0 when scroll is before step range", () => {
    const step = makeStep("test", 5, 10);
    expect(calculateStepOpacity(step, 20, 0.1)).toBe(0); // position 2, before 5
  });

  it("returns 0 when scroll is after step range", () => {
    const step = makeStep("test", 5, 10);
    expect(calculateStepOpacity(step, 20, 0.75)).toBe(0); // position 15, after 10
  });

  it("returns 1 for snap easing when inside range", () => {
    const step = makeStep("test", 5, 10, "snap");
    expect(calculateStepOpacity(step, 20, 0.35)).toBe(1); // position 7, inside 5-10
  });

  it("returns linear progress for linear easing", () => {
    const step = makeStep("test", 0, 10, "linear");
    // At position 5 out of 10: progress = 5/10 = 0.5
    expect(calculateStepOpacity(step, 10, 0.5)).toBeCloseTo(0.5);
  });

  it("returns 0 at the start of a linear step", () => {
    const step = makeStep("test", 4, 8, "linear");
    // At position 4: progress = 0/4 = 0
    expect(calculateStepOpacity(step, 20, 0.2)).toBeCloseTo(0);
  });

  it("applies custom easing function", () => {
    const quadratic = (t: number) => t * t;
    const step = makeStep("test", 0, 10, quadratic);
    // At position 5: progress = 0.5, eased = 0.25
    expect(calculateStepOpacity(step, 10, 0.5)).toBeCloseTo(0.25);
  });

  it("handles last step (stays visible)", () => {
    const step = makeStep("test", 8, 10, "snap");
    // At position 10 (the end), last step should be 1
    expect(calculateStepOpacity(step, 10, 1.0)).toBe(1);
  });
});

describe("calculateAllOpacities", () => {
  it("returns opacity for every step", () => {
    const config = [
      { name: "a", duration: 5, track: "main" },
      { name: "b", duration: 5, track: "main" },
    ];
    const steps = resolveSteps(config);
    // At 25%: position = 2.5, inside "a" (0-5), outside "b" (5-10)
    const opacities = calculateAllOpacities(0.25, steps);
    expect(opacities["a"]).toBe(1);
    expect(opacities["b"]).toBe(0);
  });

  it("handles multi-track overlapping steps", () => {
    const config = [
      { name: "main1", duration: 10, track: "main" },
      { name: "text1", duration: 5, track: "text" },
    ];
    const steps = resolveSteps(config);
    // At 25%: position 2.5, inside both main1 (0-10) and text1 (0-5)
    const opacities = calculateAllOpacities(0.25, steps);
    expect(opacities["main1"]).toBe(1);
    expect(opacities["text1"]).toBe(1);
  });
});

describe("getStepRange", () => {
  it("returns correct range for a named step", () => {
    const steps = resolveSteps([
      { name: "intro", duration: 3, track: "main" },
      { name: "content", duration: 5, track: "main" },
    ]);
    expect(getStepRange("content", steps)).toEqual({ start: 3, end: 8 });
  });

  it("throws for unknown step name", () => {
    const steps = resolveSteps([
      { name: "intro", duration: 3, track: "main" },
    ]);
    expect(() => getStepRange("nonexistent", steps)).toThrow("STEP_NOT_FOUND");
  });
});

describe("getCurrentSteps", () => {
  it("returns all active steps at a given position", () => {
    const steps = resolveSteps([
      { name: "main1", duration: 10, track: "main" },
      { name: "text1", duration: 3, track: "text" },
      { name: "text2", duration: 3, track: "text" },
    ]);
    // At position 2: main1 (0-10) active, text1 (0-3) active, text2 (3-6) not yet
    const active = getCurrentSteps(2, steps);
    expect(active).toHaveLength(2);
    expect(active.map((s) => s.name)).toContain("main1");
    expect(active.map((s) => s.name)).toContain("text1");
  });

  it("returns empty array when no steps are active", () => {
    const steps = resolveSteps([
      { name: "intro", duration: 3, track: "main" },
    ]);
    // Position 5 is beyond intro (0-3)
    const active = getCurrentSteps(5, steps);
    expect(active).toHaveLength(0);
  });
});
