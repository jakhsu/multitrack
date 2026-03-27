import { ref, onMounted, onUnmounted, type Ref } from "vue";
import { Timeline, type StepConfig, type Opacities } from "@multitrack/core";

export function useTimeline(config: StepConfig[]) {
  const scrollPercentage = ref(0);
  const currentStep = ref(0);
  const opacities: Ref<Opacities> = ref({});
  const totalSteps = ref(0);

  let timeline: Timeline | null = null;

  onMounted(() => {
    timeline = new Timeline({ config, devtools: true });
    totalSteps.value = timeline.totalSteps;
    opacities.value = timeline.getOpacities(0);

    timeline.on("scroll", (payload) => {
      scrollPercentage.value = payload.scrollPercentage;
      currentStep.value = payload.currentStep;
      opacities.value = timeline!.getOpacities(payload.scrollPercentage);
    });

    timeline.start();
  });

  onUnmounted(() => {
    timeline?.destroy();
  });

  return { scrollPercentage, currentStep, opacities, totalSteps };
}
