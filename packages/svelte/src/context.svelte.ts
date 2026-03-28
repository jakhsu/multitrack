import { getContext, setContext } from "svelte";
import { Timeline, type StepConfig, type Opacities } from "@multitrack/core";
import { MULTITRACK_CTX_KEY, type MultitrackContextValue } from "./context.js";

export interface MultitrackContextOptions {
  config: StepConfig[];
  devtools?: boolean;
  breakpoints?: Record<string, string>;
}

interface MultitrackContextWithDispose extends MultitrackContextValue {
  _dispose(): void;
}

export function createMultitrackContext(
  options: MultitrackContextOptions,
): MultitrackContextWithDispose {
  const timeline = new Timeline({
    config: options.config,
    devtools: options.devtools ?? false,
    breakpoints: options.breakpoints,
  });

  let scrollPercentage = $state(0);
  let currentStep = $state(0);
  let opacities: Opacities = $state(timeline.getOpacities(0));
  let steps = $state(timeline.steps);
  let totalSteps = $state(timeline.totalSteps);

  const scope = timeline.scope(() => {
    timeline.on("scroll", (payload) => {
      scrollPercentage = payload.scrollPercentage;
      currentStep = payload.currentStep;
      opacities = timeline.getOpacities(payload.scrollPercentage);
    });

    timeline.on("timeline:reconfigure", () => {
      steps = timeline.steps;
      totalSteps = timeline.totalSteps;
      opacities = timeline.getOpacities(timeline.scrollPercentage);
    });
  });

  timeline.start();

  const value: MultitrackContextWithDispose = {
    get timeline() {
      return timeline;
    },
    get steps() {
      return steps;
    },
    get totalSteps() {
      return totalSteps;
    },
    get scrollPercentage() {
      return scrollPercentage;
    },
    get currentStep() {
      return currentStep;
    },
    get opacities() {
      return opacities;
    },
    _dispose() {
      scope.dispose();
      timeline.destroy();
    },
  };

  setContext(MULTITRACK_CTX_KEY, value);

  return value;
}

export function getMultitrackContext(): MultitrackContextValue {
  const ctx = getContext<MultitrackContextValue>(MULTITRACK_CTX_KEY);
  if (!ctx) {
    throw new Error(
      "[@multitrack/svelte] Composables must be used within a <MultitrackProvider>",
    );
  }
  return ctx;
}
