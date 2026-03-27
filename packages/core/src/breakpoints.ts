/**
 * Manages named breakpoints backed by CSS media queries.
 * Listens for changes and notifies the Timeline to re-resolve steps.
 *
 * SSR-safe: no-op when `window` is not available.
 */
export class BreakpointManager {
  private queries: Map<string, MediaQueryList> = new Map();
  private listeners: Array<() => void> = [];

  constructor(breakpoints: Record<string, string>) {
    if (typeof globalThis.matchMedia !== "function") return;

    for (const [name, query] of Object.entries(breakpoints)) {
      this.queries.set(name, globalThis.matchMedia(query));
    }
  }

  /** Whether a named breakpoint currently matches. */
  isActive(name: string): boolean {
    return this.queries.get(name)?.matches ?? false;
  }

  /** All registered breakpoint names. */
  get names(): string[] {
    return [...this.queries.keys()];
  }

  /**
   * Subscribe to breakpoint changes. Returns unsubscribe function.
   * The callback fires whenever any breakpoint's match state changes.
   */
  onChange(callback: () => void): () => void {
    const handler = () => callback();
    this.listeners.push(handler);

    for (const mql of this.queries.values()) {
      mql.addEventListener("change", handler);
    }

    return () => {
      for (const mql of this.queries.values()) {
        mql.removeEventListener("change", handler);
      }
      const idx = this.listeners.indexOf(handler);
      if (idx !== -1) this.listeners.splice(idx, 1);
    };
  }

  /** Remove all change listeners. */
  destroy(): void {
    for (const handler of this.listeners) {
      for (const mql of this.queries.values()) {
        mql.removeEventListener("change", handler);
      }
    }
    this.listeners.length = 0;
  }
}
