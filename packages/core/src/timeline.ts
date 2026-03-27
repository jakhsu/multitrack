import type {
  DevtoolsState,
  Opacities,
  Step,
  StepConfig,
  TimelineEventHandler,
  TimelineEventType,
  TimelineOptions,
} from "./types.js";
import { resolveSteps, getTotalSteps } from "./resolve-steps.js";
import {
  calculateAllOpacities,
  calculateStepOpacity,
  getStepRange,
  getCurrentSteps,
} from "./opacity.js";
import { ScrollDriver } from "./scroll-driver.js";
import { Emitter } from "./emitter.js";
import { Scope } from "./scope.js";
import { MiddlewareChain, type MiddlewareFn } from "./middleware.js";
import { BreakpointManager } from "./breakpoints.js";
import { validateBreakpointRefs } from "./warnings.js";

/**
 * Timeline: the main facade that ties everything together.
 *
 * Usage:
 * ```ts
 * const timeline = new Timeline({
 *   config: [
 *     { name: "intro", duration: 3, track: "main", easing: "linear" },
 *     { name: "content", duration: 5, track: "main" },
 *     { name: "caption", duration: 2, track: "text" },
 *   ],
 * });
 *
 * timeline.start(); // begins listening to scroll
 * timeline.on("scroll", ({ scrollPercentage }) => {
 *   const opacities = timeline.getOpacities(scrollPercentage);
 * });
 * ```
 */
export class Timeline {
  private _steps: Step[];
  private _totalSteps: number;
  private config: StepConfig[];

  private scrollDriver: ScrollDriver;
  private emitter = new Emitter();
  private activeSteps = new Set<string>();
  private devtoolsEnabled: boolean;
  private scrollUnsubscribe: (() => void) | null = null;
  private _activeScope: Scope | null = null;
  private middleware = new MiddlewareChain();
  private breakpointManager: BreakpointManager | null = null;
  private breakpointUnsub: (() => void) | null = null;

  constructor(options: TimelineOptions) {
    this.config = options.config;
    this.devtoolsEnabled = options.devtools ?? false;

    // Set up breakpoint manager if breakpoints are provided
    if (options.breakpoints && Object.keys(options.breakpoints).length > 0) {
      this.breakpointManager = new BreakpointManager(options.breakpoints);
      validateBreakpointRefs(options.config, this.breakpointManager.names);
    }

    // Initial resolution (filtered by current breakpoint state)
    this._steps = this.resolveWithBreakpoints();
    this._totalSteps = getTotalSteps(this._steps);
    this.scrollDriver = new ScrollDriver();
  }

  /** Resolved steps (re-computed on breakpoint changes). */
  get steps(): Step[] {
    return this._steps;
  }

  /** Total steps across all tracks (re-computed on breakpoint changes). */
  get totalSteps(): number {
    return this._totalSteps;
  }

  /** Start listening to scroll events. */
  start(): void {
    // Clean up any prior subscription (safe for repeated start/destroy cycles)
    this.scrollUnsubscribe?.();

    // Subscribe to breakpoint changes for reactive re-resolution
    if (this.breakpointManager) {
      this.breakpointUnsub?.();
      this.breakpointUnsub = this.breakpointManager.onChange(() => {
        this.reconfigure();
      });
    }

    // Wire scroll driver to event emission
    this.scrollUnsubscribe = this.scrollDriver.onScroll((scrollPercentage) => {
      const currentStep = scrollPercentage * this._totalSteps;

      // Emit scroll event
      this.emitter.emit("scroll", { scrollPercentage, currentStep });

      // Track step enter/exit events
      const nowActive = new Set<string>();
      for (const step of this._steps) {
        if (currentStep >= step.start && currentStep < step.end) {
          nowActive.add(step.name);

          if (!this.activeSteps.has(step.name)) {
            const payload = {
              name: step.name,
              track: step.track,
              start: step.start,
              end: step.end,
            };
            this.middleware.run(
              { type: "step:enter", payload },
              () => this.emitter.emit("step:enter", payload),
            );
          }
        }
      }

      // Emit exit for steps that were active but no longer are
      for (const name of this.activeSteps) {
        if (!nowActive.has(name)) {
          const step = this._steps.find((s) => s.name === name);
          if (step) {
            const payload = {
              name: step.name,
              track: step.track,
              start: step.start,
              end: step.end,
            };
            this.middleware.run(
              { type: "step:exit", payload },
              () => this.emitter.emit("step:exit", payload),
            );
          }
        }
      }

      this.activeSteps = nowActive;

      // Update devtools state
      if (this.devtoolsEnabled && typeof window !== "undefined") {
        this.updateDevtools(scrollPercentage, currentStep);
      }
    });

    // Set initial devtools state before any scroll
    if (this.devtoolsEnabled && typeof window !== "undefined") {
      this.updateDevtools(0, 0);
    }
    this.scrollDriver.start();
  }

  /** Stop listening and clean up all resources. */
  destroy(): void {
    this.scrollUnsubscribe?.();
    this.scrollUnsubscribe = null;
    this.breakpointUnsub?.();
    this.breakpointUnsub = null;
    this.breakpointManager?.destroy();
    this.scrollDriver.destroy();
    this.emitter.removeAllListeners();
    this.middleware.clear();
    this.activeSteps.clear();
    if (
      this.devtoolsEnabled &&
      typeof window !== "undefined" &&
      (window as any).__MULTITRACK_DEVTOOLS__
    ) {
      delete (window as any).__MULTITRACK_DEVTOOLS__;
    }
  }

  /**
   * Register middleware that intercepts step:enter/step:exit events.
   * Call `next()` to pass through, or skip it to swallow the event.
   *
   * ```ts
   * timeline.use((event, next) => {
   *   analytics.track(event.type, event.payload.name);
   *   next();
   * });
   * ```
   */
  use(fn: MiddlewareFn): () => void {
    const unsub = this.middleware.add(fn);
    this._activeScope?.add(unsub);
    return unsub;
  }

  /** Subscribe to timeline events. Returns an unsubscribe function. */
  on<T extends TimelineEventType>(
    event: T,
    handler: TimelineEventHandler<T>,
  ): () => void {
    const unsub = this.emitter.on(event, handler);
    this._activeScope?.add(unsub);
    return unsub;
  }

  /**
   * Collect all subscriptions created inside `fn` into a Scope.
   * Call `scope.dispose()` to clean them all up at once.
   *
   * ```ts
   * const ctx = timeline.scope(() => {
   *   timeline.on('step:enter', handleEnter);
   *   timeline.on('scroll', handleScroll);
   * });
   * // later: ctx.dispose() cleans up both listeners
   * ```
   */
  scope(fn: () => void): Scope {
    const scope = new Scope();
    const previousScope = this._activeScope;
    this._activeScope = scope;
    try {
      fn();
    } finally {
      this._activeScope = previousScope;
    }
    return scope;
  }

  /** Current scroll progress (0 to 1). */
  get scrollPercentage(): number {
    return this.scrollDriver.scrollPercentage;
  }

  /** Current step position (0 to totalSteps). */
  get currentStep(): number {
    return this.scrollDriver.scrollPercentage * this._totalSteps;
  }

  /** Calculate opacities for all steps at a given scroll position. */
  getOpacities<T extends string = string>(
    scrollPercentage?: number,
  ): Opacities<T> {
    return calculateAllOpacities<T>(
      scrollPercentage ?? this.scrollDriver.scrollPercentage,
      this._steps,
    );
  }

  /** Get the start/end range for a named step. */
  getStepRange(name: string): { start: number; end: number } {
    return getStepRange(name, this._steps);
  }

  /** Get all steps that are active at a given position. */
  getCurrentSteps(position?: number) {
    return getCurrentSteps(position ?? this.currentStep, this._steps);
  }

  /** Enable devtools integration (exposes state on window.__MULTITRACK_DEVTOOLS__). */
  enableDevtools(): void {
    this.devtoolsEnabled = true;
  }

  /**
   * Filter config by active breakpoints and resolve steps.
   * Steps without `when` are always included.
   * Steps with `when` are included only if that breakpoint currently matches.
   */
  private resolveWithBreakpoints(): Step[] {
    const filtered = this.breakpointManager
      ? this.config.filter(
          (step) => !step.when || this.breakpointManager!.isActive(step.when),
        )
      : this.config;

    return resolveSteps(filtered);
  }

  /**
   * Re-resolve steps after a breakpoint change.
   * Clears active steps and emits timeline:reconfigure.
   */
  private reconfigure(): void {
    this._steps = this.resolveWithBreakpoints();
    this._totalSteps = getTotalSteps(this._steps);
    this.activeSteps.clear();

    this.emitter.emit("timeline:reconfigure", {
      steps: this._steps,
      totalSteps: this._totalSteps,
    });

    // Update devtools with new step layout
    if (this.devtoolsEnabled && typeof window !== "undefined") {
      this.updateDevtools(this.scrollPercentage, this.currentStep);
    }
  }

  private updateDevtools(
    scrollPercentage: number,
    currentStep: number,
  ): void {
    // Serialize steps without function references so JSON.stringify works in devtools eval
    const serializableSteps: Step[] = this._steps.map((s) => ({
      name: s.name,
      start: s.start,
      end: s.end,
      track: s.track,
      easing: (typeof s.easing === "function" ? "custom" : s.easing) as Step["easing"],
    }));
    const state: DevtoolsState = {
      steps: serializableSteps,
      currentStep,
      totalSteps: this._totalSteps,
      opacities: this.getOpacities(scrollPercentage),
      scrollPercentage,
    };
    (window as any).__MULTITRACK_DEVTOOLS__ = state;
  }
}
