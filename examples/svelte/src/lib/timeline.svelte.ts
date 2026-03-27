import { Timeline, type StepConfig, type Opacities } from "@multitrack/core";

export function createTimeline(config: StepConfig[]) {
  let scrollPercentage = $state(0);
  let currentStep = $state(0);
  let opacities: Opacities = $state({});

  const timeline = new Timeline({ config, devtools: true });
  const totalSteps = timeline.totalSteps;
  opacities = timeline.getOpacities(0);

  timeline.on("scroll", (payload) => {
    scrollPercentage = payload.scrollPercentage;
    currentStep = payload.currentStep;
    opacities = timeline.getOpacities(payload.scrollPercentage);
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
