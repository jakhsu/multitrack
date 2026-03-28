import { Timeline, type StepConfig, type Opacities } from "@multitrack/core";

export function createTimeline(
  config: StepConfig[],
  options?: { breakpoints?: Record<string, string> },
) {
  let scrollPercentage = $state(0);
  let currentStep = $state(0);
  let opacities: Opacities = $state({});
  let totalSteps = $state(0);

  const timeline = new Timeline({ config, devtools: true, breakpoints: options?.breakpoints });
  totalSteps = timeline.totalSteps;
  opacities = timeline.getOpacities(0);

  timeline.on("scroll", (payload) => {
    scrollPercentage = payload.scrollPercentage;
    currentStep = payload.currentStep;
    opacities = timeline.getOpacities(payload.scrollPercentage);
  });

  // Update state when responsive tracks reconfigure
  timeline.on("timeline:reconfigure", () => {
    totalSteps = timeline.totalSteps;
    opacities = timeline.getOpacities(timeline.scrollPercentage);
  });

  // Lifecycle middleware: log step transitions to console
  timeline.use((event, next) => {
    console.log(`[middleware] ${event.type}: ${event.payload.name}`);
    next();
  });

  timeline.start();

  return {
    get scrollPercentage() {
      return scrollPercentage;
    },
    get currentStep() {
      return currentStep;
    },
    get opacities() {
      return opacities;
    },
    get totalSteps() {
      return totalSteps;
    },
    destroy() {
      timeline.destroy();
    },
  };
}
