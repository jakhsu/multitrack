import { defineComponent, h } from "vue";
import { useScrollProgress, useStep } from "./composables.js";

/**
 * Creates the tall scrollable container that drives the timeline.
 * Height = totalSteps * 100vh.
 */
export const ScrollContainer = defineComponent({
  name: "ScrollContainer",
  setup(_, { slots, attrs }) {
    const { totalSteps } = useScrollProgress();

    return () =>
      h(
        "div",
        {
          style: {
            height: `${totalSteps.value * 100}vh`,
            position: "relative",
          },
          ...attrs,
        },
        slots.default?.(),
      );
  },
});

/**
 * Fixed viewport stage that stays in place while the user scrolls.
 * All animated content lives inside this.
 */
export const FixedStage = defineComponent({
  name: "FixedStage",
  setup(_, { slots, attrs }) {
    return () =>
      h(
        "div",
        {
          style: {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100vh",
            touchAction: "pan-y",
          },
          ...attrs,
        },
        slots.default?.(),
      );
  },
});

/**
 * Conditionally renders children based on a step's opacity.
 * Unmounts children when the step is inactive (opacity 0) for performance.
 */
export const Show = defineComponent({
  name: "Show",
  props: {
    when: { type: String, required: true },
  },
  setup(props, { slots }) {
    const { isActive } = useStep(props.when);

    return () => (isActive.value ? slots.default?.() : null);
  },
});
