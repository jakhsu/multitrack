import type { MiddlewareFn, MiddlewareEvent } from "./middleware.js";

// --- Public types ---

/**
 * A single analytics event enriched with session metadata, ready for transport.
 */
export interface AnalyticsEvent {
  eventType: "step:enter" | "step:exit";
  stepName: string;
  track: string;
  timestamp: string;
  sessionId: string;
  url: string;
  stepStart: number;
  stepEnd: number;
}

/**
 * Transport function: receives a batch of events and sends them somewhere.
 * Override this to use fetch, XMLHttpRequest, image pixels, or logging.
 */
export type TransportFn = (events: AnalyticsEvent[]) => void;

export interface AnalyticsMiddlewareOptions {
  /** Endpoint URL for the default sendBeacon transport. Required if `transport` is not provided. */
  endpoint?: string;
  /** Custom transport function. Overrides the default sendBeacon transport. */
  transport?: TransportFn;
  /** Auto-flush when the batch reaches this size. Default: 10 */
  batchSize?: number;
  /** Milliseconds between periodic flushes. Default: 5000 */
  flushInterval?: number;
  /** Sampling rate from 0 to 1. 1 = send everything, 0.1 = send 10%. Default: 1 */
  sampleRate?: number;
  /** Override the auto-generated session ID. */
  sessionId?: string;
  /** Injectable clock for deterministic tests. Default: () => new Date().toISOString() */
  now?: () => string;
  /** Injectable random for deterministic sampling tests. Default: Math.random */
  random?: () => number;
}

export interface AnalyticsMiddlewareResult {
  /** The middleware function — pass to `timeline.use()`. */
  middleware: MiddlewareFn;
  /** Force-flush buffered events. Returns the flushed batch. */
  flush: () => AnalyticsEvent[];
  /** Flush remaining events, clear interval timer, remove pagehide listener. */
  destroy: () => void;
}

// --- Default transport ---

function createBeaconTransport(endpoint: string): TransportFn {
  return (events) => {
    const blob = new Blob([JSON.stringify(events)], {
      type: "application/json",
    });
    navigator.sendBeacon(endpoint, blob);
  };
}

// --- Factory ---

/**
 * Creates an analytics middleware that batches step:enter/step:exit events
 * and flushes them via `navigator.sendBeacon` (or a custom transport).
 *
 * Demonstrates production analytics SDK patterns:
 * - Event batching with configurable batch size
 * - Periodic flush on a timer
 * - `navigator.sendBeacon` for reliable delivery on page unload
 * - Probabilistic sampling
 * - Session enrichment (timestamp, sessionId, URL)
 * - Graceful shutdown via `destroy()`
 *
 * @example
 * ```ts
 * const analytics = createAnalyticsMiddleware({
 *   endpoint: "/api/events",
 *   batchSize: 20,
 *   flushInterval: 10_000,
 *   sampleRate: 0.5,
 * });
 *
 * const unsub = timeline.use(analytics.middleware);
 *
 * // Later: teardown
 * unsub();
 * analytics.destroy();
 * ```
 */
export function createAnalyticsMiddleware(
  options: AnalyticsMiddlewareOptions,
): AnalyticsMiddlewareResult {
  const {
    endpoint,
    batchSize = 10,
    flushInterval = 5000,
    sampleRate = 1,
    sessionId = crypto.randomUUID(),
    now = () => new Date().toISOString(),
    random = Math.random,
  } = options;

  const transport =
    options.transport ?? createBeaconTransport(endpoint as string);

  if (!options.transport && !endpoint) {
    throw new Error(
      "createAnalyticsMiddleware: provide either `endpoint` or a custom `transport`.",
    );
  }

  let buffer: AnalyticsEvent[] = [];
  let destroyed = false;

  // --- Enrich ---

  function enrich(event: MiddlewareEvent): AnalyticsEvent {
    return {
      eventType: event.type,
      stepName: event.payload.name,
      track: event.payload.track,
      timestamp: now(),
      sessionId,
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      stepStart: event.payload.start,
      stepEnd: event.payload.end,
    };
  }

  // --- Flush ---

  function flush(): AnalyticsEvent[] {
    if (buffer.length === 0) return [];
    const batch = buffer;
    buffer = [];
    transport(batch);
    return batch;
  }

  // --- Periodic flush timer ---

  const timer = setInterval(flush, flushInterval);

  // --- Page unload handler (SSR-safe) ---

  const handlePageHide = () => flush();

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", handlePageHide);
  }

  // --- Middleware ---

  const middleware: MiddlewareFn = (event, next) => {
    if (!destroyed && random() < sampleRate) {
      buffer.push(enrich(event));

      if (buffer.length >= batchSize) {
        flush();
      }
    }

    // Analytics middleware always passes through — it observes, never gates.
    next();
  };

  // --- Destroy ---

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    flush();
    clearInterval(timer);
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", handlePageHide);
    }
  }

  return { middleware, flush, destroy };
}
