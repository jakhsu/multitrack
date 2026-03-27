/**
 * Collects disposer functions (unsubscribes) so they can be
 * cleaned up in a single `dispose()` call.
 *
 * Inspired by GSAP's gsap.context() — moves cleanup from a
 * discipline problem to an API guarantee.
 */
export class Scope {
  private disposers: Array<() => void> = [];

  /** Track a disposer function for later cleanup. */
  add(disposer: () => void): void {
    this.disposers.push(disposer);
  }

  /** Call all tracked disposers and clear the list. Idempotent. */
  dispose(): void {
    // Dispose in reverse order (LIFO)
    for (let i = this.disposers.length - 1; i >= 0; i--) {
      this.disposers[i]();
    }
    this.disposers.length = 0;
  }

  /** Number of tracked disposers. */
  get size(): number {
    return this.disposers.length;
  }
}
