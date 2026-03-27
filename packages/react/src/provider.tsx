import {
  useRef,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { Timeline, type StepConfig } from "@multitrack/core";
import { MultitrackContext, type MultitrackContextValue } from "./context.js";

export interface MultitrackProviderProps {
  /** Step configuration array. */
  config: StepConfig[];
  /** Enable devtools integration. */
  devtools?: boolean;
  /** Named breakpoints for responsive step inclusion. */
  breakpoints?: Record<string, string>;
  children: ReactNode;
}

/**
 * Provides timeline state to all child components via React context.
 * Manages scroll listening and re-renders children when scroll position changes.
 */
export function MultitrackProvider({
  config,
  devtools = false,
  breakpoints,
  children,
}: MultitrackProviderProps) {
  const timelineRef = useRef<Timeline | null>(null);

  // Create timeline instance (stable across renders unless config changes)
  const timeline = useMemo(() => {
    timelineRef.current?.destroy();
    const t = new Timeline({ config, devtools, breakpoints });
    timelineRef.current = t;
    return t;
  }, [config, devtools, breakpoints]);

  const [state, setState] = useState({
    scrollPercentage: 0,
    currentStep: 0,
    opacities: timeline.getOpacities(0),
  });

  useEffect(() => {
    const ctx = timeline.scope(() => {
      timeline.on("scroll", ({ scrollPercentage, currentStep }) => {
        setState({
          scrollPercentage,
          currentStep,
          opacities: timeline.getOpacities(scrollPercentage),
        });
      });

      // Re-render when breakpoints change and steps are reconfigured
      timeline.on("timeline:reconfigure", () => {
        setState({
          scrollPercentage: timeline.scrollPercentage,
          currentStep: timeline.currentStep,
          opacities: timeline.getOpacities(),
        });
      });
    });

    timeline.start();

    return () => {
      ctx.dispose();
      timeline.destroy();
    };
  }, [timeline]);

  const contextValue: MultitrackContextValue = {
    timeline,
    steps: timeline.steps,
    totalSteps: timeline.totalSteps,
    scrollPercentage: state.scrollPercentage,
    currentStep: state.currentStep,
    opacities: state.opacities,
  };

  return (
    <MultitrackContext.Provider value={contextValue}>
      {children}
    </MultitrackContext.Provider>
  );
}
