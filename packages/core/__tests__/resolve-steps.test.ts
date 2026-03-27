import { describe, it, expect } from "vitest";
import { resolveSteps, getTotalSteps } from "../src/resolve-steps.js";
import type { StepConfig } from "../src/types.js";

describe("resolveSteps", () => {
  it("resolves basic steps with correct start/end positions", () => {
    const config: StepConfig[] = [
      { name: "intro", duration: 3, track: "main" },
      { name: "content", duration: 5, track: "main" },
      { name: "outro", duration: 2, track: "main" },
    ];

    const steps = resolveSteps(config);
    expect(steps).toEqual([
      { name: "intro", start: 0, end: 3, track: "main", easing: "snap" },
      { name: "content", start: 3, end: 8, track: "main", easing: "snap" },
      { name: "outro", start: 8, end: 10, track: "main", easing: "snap" },
    ]);
  });

  it("maintains independent track cursors", () => {
    const config: StepConfig[] = [
      { name: "main1", duration: 5, track: "main" },
      { name: "text1", duration: 3, track: "text" },
      { name: "main2", duration: 3, track: "main" },
      { name: "text2", duration: 2, track: "text" },
    ];

    const steps = resolveSteps(config);
    expect(steps).toEqual([
      { name: "main1", start: 0, end: 5, track: "main", easing: "snap" },
      { name: "text1", start: 0, end: 3, track: "text", easing: "snap" },
      { name: "main2", start: 5, end: 8, track: "main", easing: "snap" },
      { name: "text2", start: 3, end: 5, track: "text", easing: "snap" },
    ]);
  });

  it("auto-renames buffer steps", () => {
    const config: StepConfig[] = [
      { name: "intro", duration: 2, track: "main" },
      { name: "buffer", duration: 3, track: "main" },
      { name: "buffer", duration: 1, track: "main" },
      { name: "content", duration: 4, track: "main" },
    ];

    const steps = resolveSteps(config);
    expect(steps[1].name).toBe("buffer_1");
    expect(steps[2].name).toBe("buffer_2");
  });

  it("filters steps by condition predicate", () => {
    const isMobile = false;
    const config: StepConfig[] = [
      { name: "shared", duration: 3, track: "main" },
      {
        name: "mobile-only",
        duration: 2,
        track: "main",
        condition: () => isMobile,
      },
      {
        name: "desktop-only",
        duration: 4,
        track: "main",
        condition: () => !isMobile,
      },
    ];

    const steps = resolveSteps(config);
    expect(steps).toHaveLength(2);
    expect(steps[0].name).toBe("shared");
    expect(steps[1].name).toBe("desktop-only");
    expect(steps[1].start).toBe(3);
    expect(steps[1].end).toBe(7);
  });

  it("preserves easing from config", () => {
    const config: StepConfig[] = [
      { name: "fade", duration: 3, track: "main", easing: "linear" },
      { name: "snap", duration: 2, track: "main" },
      { name: "custom", duration: 2, track: "main", easing: (t) => t * t },
    ];

    const steps = resolveSteps(config);
    expect(steps[0].easing).toBe("linear");
    expect(steps[1].easing).toBe("snap");
    expect(typeof steps[2].easing).toBe("function");
  });

  it("throws on empty config", () => {
    expect(() => resolveSteps([])).toThrow("EMPTY_CONFIG");
  });

  it("throws on duplicate non-buffer step names", () => {
    const config: StepConfig[] = [
      { name: "intro", duration: 2, track: "main" },
      { name: "intro", duration: 3, track: "text" },
    ];

    expect(() => resolveSteps(config)).toThrow("DUPLICATE_STEP_NAME");
  });
});

describe("getTotalSteps", () => {
  it("returns the maximum end position across all tracks", () => {
    const config: StepConfig[] = [
      { name: "main1", duration: 10, track: "main" },
      { name: "text1", duration: 5, track: "text" },
    ];
    const steps = resolveSteps(config);
    expect(getTotalSteps(steps)).toBe(10);
  });
});
