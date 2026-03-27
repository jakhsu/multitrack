import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BreakpointManager } from "../src/breakpoints.js";
import { resolveSteps } from "../src/resolve-steps.js";
import { resetWarnings, validateBreakpointRefs } from "../src/warnings.js";

// Mock matchMedia
function createMockMatchMedia(initialMatches: Record<string, boolean>) {
  const listeners = new Map<string, Set<(e: MediaQueryListEvent) => void>>();

  const matchMedia = vi.fn((query: string) => {
    if (!listeners.has(query)) listeners.set(query, new Set());

    const mql = {
      matches: initialMatches[query] ?? false,
      media: query,
      addEventListener: vi.fn((event: string, handler: any) => {
        if (event === "change") listeners.get(query)!.add(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: any) => {
        if (event === "change") listeners.get(query)!.delete(handler);
      }),
    };
    return mql;
  });

  // Helper to simulate a breakpoint change
  function trigger(query: string, matches: boolean) {
    initialMatches[query] = matches;
    const handlers = listeners.get(query);
    if (handlers) {
      for (const handler of handlers) {
        handler({ matches, media: query } as MediaQueryListEvent);
      }
    }
  }

  return { matchMedia, trigger };
}

describe("BreakpointManager", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports active breakpoints based on matchMedia", () => {
    const { matchMedia } = createMockMatchMedia({
      "(max-width: 768px)": true,
      "(min-width: 769px)": false,
    });
    vi.stubGlobal("matchMedia", matchMedia);

    const mgr = new BreakpointManager({
      mobile: "(max-width: 768px)",
      desktop: "(min-width: 769px)",
    });

    expect(mgr.isActive("mobile")).toBe(true);
    expect(mgr.isActive("desktop")).toBe(false);
  });

  it("returns false for unknown breakpoint names", () => {
    const { matchMedia } = createMockMatchMedia({});
    vi.stubGlobal("matchMedia", matchMedia);

    const mgr = new BreakpointManager({ mobile: "(max-width: 768px)" });

    expect(mgr.isActive("nonexistent")).toBe(false);
  });

  it("fires onChange when a breakpoint changes", () => {
    const { matchMedia, trigger } = createMockMatchMedia({
      "(max-width: 768px)": false,
    });
    vi.stubGlobal("matchMedia", matchMedia);

    const mgr = new BreakpointManager({ mobile: "(max-width: 768px)" });
    const callback = vi.fn();

    mgr.onChange(callback);
    trigger("(max-width: 768px)", true);

    expect(callback).toHaveBeenCalledOnce();
  });

  it("unsubscribes onChange correctly", () => {
    const { matchMedia, trigger } = createMockMatchMedia({
      "(max-width: 768px)": false,
    });
    vi.stubGlobal("matchMedia", matchMedia);

    const mgr = new BreakpointManager({ mobile: "(max-width: 768px)" });
    const callback = vi.fn();

    const unsub = mgr.onChange(callback);
    unsub();
    trigger("(max-width: 768px)", true);

    expect(callback).not.toHaveBeenCalled();
  });

  it("exposes all breakpoint names", () => {
    const { matchMedia } = createMockMatchMedia({});
    vi.stubGlobal("matchMedia", matchMedia);

    const mgr = new BreakpointManager({
      mobile: "(max-width: 768px)",
      desktop: "(min-width: 769px)",
      reducedMotion: "(prefers-reduced-motion: reduce)",
    });

    expect(mgr.names).toEqual(["mobile", "desktop", "reducedMotion"]);
  });
});

describe("Responsive step filtering", () => {
  it("includes steps without 'when' regardless of breakpoints", () => {
    const config = [
      { name: "always", duration: 3, track: "main" },
      { name: "desktop-only", duration: 5, track: "main", when: "desktop" },
    ];

    // Simulate filtering (what Timeline.resolveWithBreakpoints does)
    const activeBreakpoints = new Set<string>(); // no breakpoints active
    const filtered = config.filter(
      (step) => !step.when || activeBreakpoints.has(step.when),
    );

    const steps = resolveSteps(filtered);
    expect(steps).toHaveLength(1);
    expect(steps[0].name).toBe("always");
  });

  it("includes steps whose breakpoint is active", () => {
    const config = [
      { name: "always", duration: 3, track: "main" },
      { name: "desktop-only", duration: 5, track: "main", when: "desktop" },
      { name: "mobile-only", duration: 2, track: "main", when: "mobile" },
    ];

    const activeBreakpoints = new Set(["desktop"]);
    const filtered = config.filter(
      (step) => !step.when || activeBreakpoints.has(step.when),
    );

    const steps = resolveSteps(filtered);
    expect(steps).toHaveLength(2);
    expect(steps.map((s) => s.name)).toEqual(["always", "desktop-only"]);
  });

  it("recalculates step positions after filtering", () => {
    const config = [
      { name: "intro", duration: 3, track: "main" },
      { name: "desktop-detail", duration: 5, track: "main", when: "desktop" },
      { name: "outro", duration: 2, track: "main" },
    ];

    // Desktop: all 3 steps, total = 10
    const desktopFiltered = config.filter(
      (s) => !s.when || s.when === "desktop",
    );
    const desktopSteps = resolveSteps(desktopFiltered);
    expect(desktopSteps).toHaveLength(3);
    expect(desktopSteps[2].end).toBe(10); // 3 + 5 + 2

    // Mobile: only intro and outro, total = 5
    const mobileFiltered = config.filter(
      (s) => !s.when || s.when === "mobile",
    );
    const mobileSteps = resolveSteps(mobileFiltered);
    expect(mobileSteps).toHaveLength(2);
    expect(mobileSteps[1].end).toBe(5); // 3 + 2
    expect(mobileSteps[1].start).toBe(3); // starts right after intro
  });
});

describe("validateBreakpointRefs", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetWarnings();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns when step references unknown breakpoint", () => {
    validateBreakpointRefs(
      [
        { name: "intro", when: "tablet" },
        { name: "content" },
      ],
      ["mobile", "desktop"],
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("UNKNOWN_BREAKPOINT"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"tablet"'),
    );
  });

  it("does not warn when all breakpoint refs are valid", () => {
    validateBreakpointRefs(
      [
        { name: "intro", when: "desktop" },
        { name: "content" },
      ],
      ["mobile", "desktop"],
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
