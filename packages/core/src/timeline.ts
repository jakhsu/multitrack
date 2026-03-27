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
  readonly steps: Step[];
  readonly totalSteps: number;

  private scrollDriver: ScrollDriver;
  private emitter = new Emitter();
  private activeSteps = new Set<string>();
  private devtoolsEnabled: boolean;

  constructor(options: TimelineOptions) {
    this.steps = resolveSteps(options.config);
    this.totalSteps = getTotalSteps(this.steps);
    this.scrollDriver = new ScrollDriver();
    this.devtoolsEnabled = options.devtools ?? false;

    // Wire scroll driver to event emission
    this.scrollDriver.onScroll((scrollPercentage) => {
      const currentStep = scrollPercentage * this.totalSteps;

      // Emit scroll event
      this.emitter.emit("scroll", { scrollPercentage, currentStep });

      // Track step enter/exit events
      const nowActive = new Set<string>();
      for (const step of this.steps) {
        if (currentStep >= step.start && currentStep < step.end) {
          nowActive.add(step.name);

          if (!this.activeSteps.has(step.name)) {
            this.emitter.emit("step:enter", {
              name: step.name,
              track: step.track,
              start: step.start,
              end: step.end,
            });
          }
        }
      }

      // Emit exit for steps that were active but no longer are
      for (const name of this.activeSteps) {
        if (!nowActive.has(name)) {
          const step = this.steps.find((s) => s.name === name);
          if (step) {
            this.emitter.emit("step:exit", {
              name: step.name,
              track: step.track,
              start: step.start,
              end: step.end,
            });
          }
        }
      }

      this.activeSteps = nowActive;

      // Update devtools state
      if (this.devtoolsEnabled && typeof window !== "undefined") {
        this.updateDevtools(scrollPercentage, currentStep);
      }
    });
  }

  /** Start listening to scroll events. */
  start(): void {
    // Set initial devtools state before any scroll
    if (this.devtoolsEnabled && typeof window !== "undefined") {
      this.updateDevtools(0, 0);
    }
    this.scrollDriver.start();
  }

  /** Stop listening and clean up all resources. */
  destroy(): void {
    this.scrollDriver.destroy();
    this.emitter.removeAllListeners();
    this.activeSteps.clear();
    if (
      this.devtoolsEnabled &&
      typeof window !== "undefined" &&
      (window as any).__MULTITRACK_DEVTOOLS__
    ) {
      delete (window as any).__MULTITRACK_DEVTOOLS__;
    }
  }

  /** Subscribe to timeline events. Returns an unsubscribe function. */
  on<T extends TimelineEventType>(
    event: T,
    handler: TimelineEventHandler<T>,
  ): () => void {
    return this.emitter.on(event, handler);
  }

  /** Current scroll progress (0 to 1). */
  get scrollPercentage(): number {
    return this.scrollDriver.scrollPercentage;
  }

  /** Current step position (0 to totalSteps). */
  get currentStep(): number {
    return this.scrollDriver.scrollPercentage * this.totalSteps;
  }

  /** Calculate opacities for all steps at a given scroll position. */
  getOpacities<T extends string = string>(
    scrollPercentage?: number,
  ): Opacities<T> {
    return calculateAllOpacities<T>(
      scrollPercentage ?? this.scrollDriver.scrollPercentage,
      this.steps,
    );
  }

  /** Get the start/end range for a named step. */
  getStepRange(name: string): { start: number; end: number } {
    return getStepRange(name, this.steps);
  }

  /** Get all steps that are active at a given position. */
  getCurrentSteps(position?: number) {
    return getCurrentSteps(position ?? this.currentStep, this.steps);
  }

  /** Enable devtools integration (exposes state on window.__MULTITRACK_DEVTOOLS__). */
  enableDevtools(): void {
    this.devtoolsEnabled = true;
  }

  private updateDevtools(
    scrollPercentage: number,
    currentStep: number,
  ): void {
    // Serialize steps without function references so JSON.stringify works in devtools eval
    const serializableSteps: Step[] = this.steps.map((s) => ({
      name: s.name,
      start: s.start,
      end: s.end,
      track: s.track,
      easing: (typeof s.easing === "function" ? "custom" : s.easing) as Step["easing"],
    }));
    const state: DevtoolsState = {
      steps: serializableSteps,
      currentStep,
      totalSteps: this.totalSteps,
      opacities: this.getOpacities(scrollPercentage),
      scrollPercentage,
    };
    (window as any).__MULTITRACK_DEVTOOLS__ = state;
  }
}
