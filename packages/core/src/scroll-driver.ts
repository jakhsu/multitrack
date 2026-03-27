import type { ScrollDriverOptions } from "./types.js";

export type ScrollCallback = (scrollPercentage: number) => void;

/**
 * Manages scroll event listening and converts scroll position to a 0-1 progress value.
 *
 * Extracted and generalized from sinking-china MainMap.tsx scroll handler.
 * The original was tightly coupled to window.scrollY and React state — this
 * version attaches to any scrollable element and uses a subscription API.
 */
export class ScrollDriver {
  private target: HTMLElement | Window;
  private callbacks = new Set<ScrollCallback>();
  private bound: (() => void) | null = null;
  private _scrollPercentage = 0;

  constructor(options: ScrollDriverOptions = {}) {
    this.target = options.target ?? window;
  }

  /** Current scroll progress (0 to 1). */
  get scrollPercentage(): number {
    return this._scrollPercentage;
  }

  /**
   * Subscribe to scroll updates. Returns an unsubscribe function.
   */
  onScroll(callback: ScrollCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Start listening for scroll events.
   */
  start(): void {
    if (this.bound) return;

    this.bound = () => {
      this._scrollPercentage = this.calculateProgress();
      this.callbacks.forEach((cb) => cb(this._scrollPercentage));
    };

    this.target.addEventListener("scroll", this.bound, { passive: true });

    // Fire initial value
    this.bound();
  }

  /**
   * Stop listening and clean up.
   */
  destroy(): void {
    if (this.bound) {
      this.target.removeEventListener("scroll", this.bound);
      this.bound = null;
    }
    this.callbacks.clear();
  }

  private calculateProgress(): number {
    if (this.target === window || this.target instanceof Window) {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return 0;
      return Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }

    // HTMLElement target
    const el = this.target as HTMLElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return 0;
    return Math.max(0, Math.min(1, el.scrollTop / maxScroll));
  }
}
