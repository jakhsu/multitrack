import { ref, onMounted, onUnmounted, type Ref } from "vue";
import { Timeline, type StepConfig, type Opacities } from "@multitrack/core";

export function useTimeline(
  config: StepConfig[],
  options?: { breakpoints?: Record<string, string> },
) {
  const scrollPercentage = ref(0);
  const currentStep = ref(0);
  const opacities: Ref<Opacities> = ref({});
  const totalSteps = ref(0);

  let timeline: Timeline | null = null;

  onMounted(() => {
    timeline = new Timeline({ config, devtools: true, breakpoints: options?.breakpoints });
    totalSteps.value = timeline.totalSteps;
    opacities.value = timeline.getOpacities(0);

    timeline.on("scroll", (payload) => {
      scrollPercentage.value = payload.scrollPercentage;
      currentStep.value = payload.currentStep;
      opacities.value = timeline!.getOpacities(payload.scrollPercentage);
    });

    // Update state when responsive tracks reconfigure
    timeline.on("timeline:reconfigure", () => {
      totalSteps.value = timeline!.totalSteps;
      opacities.value = timeline!.getOpacities(timeline!.scrollPercentage);
    });

    // Lifecycle middleware: log step transitions to console
    timeline.use((event, next) => {
      console.log(`[middleware] ${event.type}: ${event.payload.name}`);
      next();
    });

    timeline.start();
  });

  onUnmounted(() => {
    timeline?.destroy();
  });

  return { scrollPercentage, currentStep, opacities, totalSteps };
}
