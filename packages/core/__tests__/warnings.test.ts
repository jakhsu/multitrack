import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateStepConfigs, resetWarnings } from "../src/warnings.js";

describe("validateStepConfigs", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetWarnings();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns on zero-duration steps", () => {
    validateStepConfigs([
      { name: "intro", duration: 0, track: "main" },
      { name: "content", duration: 3, track: "main" },
    ]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("ZERO_DURATION"),
    );
  });

  it("warns on negative-duration steps", () => {
    validateStepConfigs([
      { name: "broken", duration: -1, track: "main" },
      { name: "content", duration: 3, track: "main" },
    ]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("ZERO_DURATION"),
    );
  });

  it("warns on snap easing with long duration", () => {
    validateStepConfigs([
      { name: "long-snap", duration: 8, track: "main" },
      { name: "content", duration: 3, track: "main" },
    ]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("SNAP_LONG_STEP"),
    );
  });

  it("does not warn on snap easing with short duration", () => {
    validateStepConfigs([
      { name: "short-snap", duration: 3, track: "main" },
      { name: "content", duration: 3, track: "main" },
    ]);

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("SNAP_LONG_STEP"),
    );
  });

  it("does not warn on long duration with non-snap easing", () => {
    validateStepConfigs([
      { name: "long-linear", duration: 8, track: "main", easing: "linear" },
      { name: "content", duration: 3, track: "main" },
    ]);

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("SNAP_LONG_STEP"),
    );
  });

  it("warns on lone track name (likely typo)", () => {
    validateStepConfigs([
      { name: "intro", duration: 3, track: "main" },
      { name: "content", duration: 3, track: "main" },
      { name: "typo", duration: 2, track: "mian" },
    ]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("LONE_TRACK"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"mian"'),
    );
  });

  it("does not warn on lone track in single-track configs", () => {
    validateStepConfigs([
      { name: "intro", duration: 3, track: "main" },
      { name: "content", duration: 3, track: "main" },
    ]);

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("LONE_TRACK"),
    );
  });

  it("deduplicates warnings with same code and message", () => {
    const config = [
      { name: "zero", duration: 0, track: "main" },
      { name: "other", duration: 3, track: "main" },
    ];

    validateStepConfigs(config);
    validateStepConfigs(config);

    const zeroDurationCalls = warnSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("ZERO_DURATION"),
    );
    expect(zeroDurationCalls).toHaveLength(1);
  });

  it("does not warn for buffer steps", () => {
    validateStepConfigs([
      { name: "buffer", duration: 0, track: "main" },
      { name: "intro", duration: 3, track: "main" },
    ]);

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("ZERO_DURATION"),
    );
  });

  it("emits no warnings for valid config", () => {
    validateStepConfigs([
      { name: "intro", duration: 3, track: "main", easing: "linear" },
      { name: "content", duration: 5, track: "main" },
      { name: "caption", duration: 2, track: "text" },
      { name: "caption2", duration: 3, track: "text" },
    ]);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
