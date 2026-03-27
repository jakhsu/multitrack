import type { StepEventPayload } from "./types.js";

/**
 * Event passed to middleware functions during step transitions.
 */
export interface MiddlewareEvent {
  type: "step:enter" | "step:exit";
  payload: StepEventPayload;
}

/**
 * Middleware function signature.
 * Call `next()` to continue the chain; skip it to swallow the event.
 */
export type MiddlewareFn = (event: MiddlewareEvent, next: () => void) => void;

/**
 * Manages an ordered chain of middleware functions.
 * Each middleware can inspect/modify events and decide whether to pass through.
 */
export class MiddlewareChain {
  private fns: MiddlewareFn[] = [];

  /** Add middleware. Returns a function to remove it. */
  add(fn: MiddlewareFn): () => void {
    this.fns.push(fn);
    return () => {
      const idx = this.fns.indexOf(fn);
      if (idx !== -1) this.fns.splice(idx, 1);
    };
  }

  /**
   * Run the middleware chain. If all middleware call `next()`,
   * `finalAction` executes (emitting the event to listeners).
   * If any middleware skips `next()`, the event is swallowed.
   */
  run(event: MiddlewareEvent, finalAction: () => void): void {
    let index = 0;
    const fns = this.fns;

    const next = () => {
      if (index < fns.length) {
        fns[index++](event, next);
      } else {
        finalAction();
      }
    };

    next();
  }

  /** Remove all middleware. */
  clear(): void {
    this.fns.length = 0;
  }
}
