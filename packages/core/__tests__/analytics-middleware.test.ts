import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createAnalyticsMiddleware,
  type AnalyticsEvent,
  type TransportFn,
} from "../src/analytics.js";
import type { MiddlewareEvent } from "../src/middleware.js";

// --- Helpers ---

function makeEvent(
  type: "step:enter" | "step:exit" = "step:enter",
  name = "intro",
  track = "main",
): MiddlewareEvent {
  return { type, payload: { name, track, start: 0, end: 3 } };
}

const FIXED_TIME = "2026-01-15T12:00:00.000Z";
const FIXED_SESSION = "test-session-id";

function createTestMiddleware(overrides: Parameters<typeof createAnalyticsMiddleware>[0] = {}) {
  const transported: AnalyticsEvent[][] = [];
  const transport: TransportFn = (events) => transported.push([...events]);

  const result = createAnalyticsMiddleware({
    transport,
    now: () => FIXED_TIME,
    sessionId: FIXED_SESSION,
    random: () => 0, // always below any positive sampleRate → always collected
    ...overrides,
  });

  return { ...result, transported };
}

// --- Tests ---

describe("createAnalyticsMiddleware", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Validation ---

  describe("validation", () => {
    it("throws if neither endpoint nor transport is provided", () => {
      expect(() => createAnalyticsMiddleware({})).toThrow(
        "provide either `endpoint` or a custom `transport`",
      );
    });

    it("does not throw when endpoint is provided", () => {
      // Stub sendBeacon so the default transport doesn't fail
      vi.stubGlobal("navigator", { sendBeacon: vi.fn() });
      expect(() =>
        createAnalyticsMiddleware({ endpoint: "/api/events" }),
      ).not.toThrow();
      vi.unstubAllGlobals();
    });

    it("does not throw when custom transport is provided", () => {
      expect(() =>
        createAnalyticsMiddleware({ transport: vi.fn() }),
      ).not.toThrow();
    });
  });

  // --- Event enrichment ---

  describe("event enrichment", () => {
    it("enriches events with session metadata", () => {
      const { middleware, flush } = createTestMiddleware();
      const next = vi.fn();

      middleware(makeEvent("step:enter", "hero", "main"), next);

      const [batch] = [flush()];
      expect(batch).toHaveLength(1);
      expect(batch[0]).toEqual({
        eventType: "step:enter",
        stepName: "hero",
        track: "main",
        timestamp: FIXED_TIME,
        sessionId: FIXED_SESSION,
        url: expect.any(String),
        stepStart: 0,
        stepEnd: 3,
      });
    });

    it("maps step:exit events correctly", () => {
      const { middleware, flush } = createTestMiddleware();
      middleware(makeEvent("step:exit", "hero", "text"), vi.fn());
      const batch = flush();
      expect(batch[0].eventType).toBe("step:exit");
      expect(batch[0].track).toBe("text");
    });
  });

  // --- Batching ---

  describe("batching", () => {
    it("accumulates events until batchSize is reached", () => {
      const { middleware, transported } = createTestMiddleware({ batchSize: 3 });
      const next = vi.fn();

      middleware(makeEvent("step:enter", "a"), next);
      middleware(makeEvent("step:enter", "b"), next);
      expect(transported).toHaveLength(0); // not yet flushed

      middleware(makeEvent("step:enter", "c"), next);
      expect(transported).toHaveLength(1); // auto-flushed at batchSize
      expect(transported[0]).toHaveLength(3);
    });

    it("resets buffer after flush", () => {
      const { middleware, transported } = createTestMiddleware({ batchSize: 2 });
      const next = vi.fn();

      middleware(makeEvent("step:enter", "a"), next);
      middleware(makeEvent("step:enter", "b"), next); // flushes
      middleware(makeEvent("step:enter", "c"), next);
      middleware(makeEvent("step:enter", "d"), next); // flushes again

      expect(transported).toHaveLength(2);
      expect(transported[0].map((e) => e.stepName)).toEqual(["a", "b"]);
      expect(transported[1].map((e) => e.stepName)).toEqual(["c", "d"]);
    });
  });

  // --- Periodic flushing ---

  describe("periodic flushing", () => {
    it("flushes on interval timer", () => {
      const { middleware, transported } = createTestMiddleware({
        batchSize: 100, // high so auto-flush doesn't trigger
        flushInterval: 5000,
      });

      middleware(makeEvent("step:enter", "a"), vi.fn());
      middleware(makeEvent("step:enter", "b"), vi.fn());
      expect(transported).toHaveLength(0);

      vi.advanceTimersByTime(5000);
      expect(transported).toHaveLength(1);
      expect(transported[0]).toHaveLength(2);
    });

    it("does not flush when buffer is empty", () => {
      const { transported } = createTestMiddleware({ flushInterval: 1000 });

      vi.advanceTimersByTime(3000);
      expect(transported).toHaveLength(0);
    });
  });

  // --- Sampling ---

  describe("sampling", () => {
    it("collects event when random() < sampleRate", () => {
      const { middleware, flush } = createTestMiddleware({
        sampleRate: 0.5,
        random: () => 0.3, // 0.3 < 0.5 → collected
      });

      middleware(makeEvent(), vi.fn());
      expect(flush()).toHaveLength(1);
    });

    it("drops event when random() >= sampleRate", () => {
      const { middleware, flush } = createTestMiddleware({
        sampleRate: 0.5,
        random: () => 0.7, // 0.7 >= 0.5 → dropped
      });

      middleware(makeEvent(), vi.fn());
      expect(flush()).toHaveLength(0);
    });

    it("collects nothing when sampleRate is 0", () => {
      const { middleware, flush } = createTestMiddleware({
        sampleRate: 0,
        random: () => 0, // 0 is NOT < 0 → dropped
      });

      middleware(makeEvent(), vi.fn());
      expect(flush()).toHaveLength(0);
    });

    it("collects everything when sampleRate is 1", () => {
      const { middleware, flush } = createTestMiddleware({
        sampleRate: 1,
        random: () => 0.999, // 0.999 < 1 → collected
      });

      middleware(makeEvent(), vi.fn());
      expect(flush()).toHaveLength(1);
    });
  });

  // --- next() passthrough ---

  describe("next() passthrough", () => {
    it("always calls next() even when event is collected", () => {
      const { middleware } = createTestMiddleware();
      const next = vi.fn();

      middleware(makeEvent(), next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("always calls next() even when event is sampled out", () => {
      const { middleware } = createTestMiddleware({
        sampleRate: 0,
        random: () => 0.5,
      });
      const next = vi.fn();

      middleware(makeEvent(), next);
      expect(next).toHaveBeenCalledOnce();
    });
  });

  // --- Default beacon transport ---

  describe("default beacon transport", () => {
    it("sends events via navigator.sendBeacon with JSON blob", () => {
      const sendBeacon = vi.fn();
      vi.stubGlobal("navigator", { sendBeacon });

      const { middleware, flush } = createAnalyticsMiddleware({
        endpoint: "/api/events",
        now: () => FIXED_TIME,
        sessionId: FIXED_SESSION,
        random: () => 0,
      });

      middleware(makeEvent("step:enter", "hero"), vi.fn());
      flush();

      expect(sendBeacon).toHaveBeenCalledOnce();
      expect(sendBeacon).toHaveBeenCalledWith("/api/events", expect.any(Blob));

      const blob: Blob = sendBeacon.mock.calls[0][1];
      expect(blob.type).toBe("application/json");

      vi.unstubAllGlobals();
    });
  });

  // --- Page unload ---

  describe("page unload handling", () => {
    let listeners: Map<string, Function>;

    beforeEach(() => {
      listeners = new Map();
      vi.stubGlobal("window", {
        addEventListener: vi.fn((event: string, handler: Function) => {
          listeners.set(event, handler);
        }),
        removeEventListener: vi.fn((event: string) => {
          listeners.delete(event);
        }),
        location: { href: "https://example.com" },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("registers pagehide listener on creation", () => {
      const { destroy } = createTestMiddleware();
      expect(window.addEventListener).toHaveBeenCalledWith("pagehide", expect.any(Function));
      destroy();
    });

    it("flushes on pagehide event", () => {
      const { middleware, transported } = createTestMiddleware({ batchSize: 100 });
      middleware(makeEvent(), vi.fn());
      expect(transported).toHaveLength(0);

      const handler = listeners.get("pagehide");
      handler!();
      expect(transported).toHaveLength(1);
    });

    it("removes pagehide listener on destroy", () => {
      const { destroy } = createTestMiddleware();
      destroy();
      expect(window.removeEventListener).toHaveBeenCalledWith("pagehide", expect.any(Function));
    });
  });

  // --- Graceful shutdown ---

  describe("destroy", () => {
    it("flushes remaining events", () => {
      const { middleware, transported, destroy } = createTestMiddleware({ batchSize: 100 });
      middleware(makeEvent("step:enter", "a"), vi.fn());
      middleware(makeEvent("step:enter", "b"), vi.fn());

      destroy();
      expect(transported).toHaveLength(1);
      expect(transported[0]).toHaveLength(2);
    });

    it("clears the interval timer", () => {
      const { destroy, transported, middleware } = createTestMiddleware({
        batchSize: 100,
        flushInterval: 1000,
      });

      destroy();

      // Push an event after destroy — timer should no longer flush it
      middleware(makeEvent(), vi.fn());
      vi.advanceTimersByTime(5000);
      // Only the flush from destroy() itself (which was empty at that point…
      // but now we pushed after destroy, so the middleware ignores it)
      expect(transported).toHaveLength(0);
    });

    it("stops collecting events after destroy", () => {
      const { middleware, flush, destroy } = createTestMiddleware();
      destroy();

      middleware(makeEvent(), vi.fn());
      expect(flush()).toHaveLength(0);
    });

    it("is idempotent", () => {
      const { destroy, transported, middleware } = createTestMiddleware();
      middleware(makeEvent(), vi.fn());

      destroy();
      destroy(); // second call is a no-op
      expect(transported).toHaveLength(1);
    });
  });

  // --- flush() return value ---

  describe("flush()", () => {
    it("returns the flushed events", () => {
      const { middleware, flush } = createTestMiddleware();
      middleware(makeEvent("step:enter", "a"), vi.fn());
      middleware(makeEvent("step:exit", "b"), vi.fn());

      const result = flush();
      expect(result).toHaveLength(2);
      expect(result[0].stepName).toBe("a");
      expect(result[1].stepName).toBe("b");
    });

    it("returns empty array when buffer is empty", () => {
      const { flush } = createTestMiddleware();
      expect(flush()).toEqual([]);
    });
  });
});
