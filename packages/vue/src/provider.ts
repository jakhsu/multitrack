import {
  defineComponent,
  h,
  shallowRef,
  provide,
  onMounted,
  onUnmounted,
  watch,
  type PropType,
} from "vue";
import { Timeline, type StepConfig, type Scope } from "@multitrack/core";
import { MULTITRACK_KEY, type MultitrackContextValue } from "./context.js";

export const MultitrackProvider = defineComponent({
  name: "MultitrackProvider",
  props: {
    config: {
      type: Array as PropType<StepConfig[]>,
      required: true,
    },
    devtools: {
      type: Boolean,
      default: false,
    },
    breakpoints: {
      type: Object as PropType<Record<string, string>>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    let timeline: Timeline | null = null;
    let scope: Scope | null = null;

    const state = shallowRef<MultitrackContextValue>(null!);

    function setupTimeline() {
      // Clean up previous instance
      scope?.dispose();
      timeline?.destroy();

      const t = new Timeline({
        config: props.config,
        devtools: props.devtools,
        breakpoints: props.breakpoints,
      });
      timeline = t;

      state.value = {
        timeline: t,
        steps: t.steps,
        totalSteps: t.totalSteps,
        scrollPercentage: 0,
        currentStep: 0,
        opacities: t.getOpacities(0),
      };

      scope = t.scope(() => {
        t.on("scroll", ({ scrollPercentage, currentStep }) => {
          state.value = {
            ...state.value,
            scrollPercentage,
            currentStep,
            opacities: t.getOpacities(scrollPercentage),
          };
        });

        t.on("timeline:reconfigure", () => {
          state.value = {
            ...state.value,
            steps: t.steps,
            totalSteps: t.totalSteps,
            scrollPercentage: t.scrollPercentage,
            currentStep: t.currentStep,
            opacities: t.getOpacities(),
          };
        });
      });

      t.start();
    }

    provide(MULTITRACK_KEY, state);

    onMounted(() => {
      setupTimeline();
    });

    // Recreate timeline when props change
    watch(
      () => [props.config, props.devtools, props.breakpoints],
      () => {
        if (timeline) {
          setupTimeline();
        }
      },
    );

    onUnmounted(() => {
      scope?.dispose();
      timeline?.destroy();
    });

    return () => slots.default?.();
  },
});
