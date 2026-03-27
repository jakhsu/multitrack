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
  children: ReactNode;
}

/**
 * Provides timeline state to all child components via React context.
 * Manages scroll listening and re-renders children when scroll position changes.
 */
export function MultitrackProvider({
  config,
  devtools = false,
  children,
}: MultitrackProviderProps) {
  const timelineRef = useRef<Timeline | null>(null);

  // Create timeline instance (stable across renders unless config changes)
  const timeline = useMemo(() => {
    timelineRef.current?.destroy();
    const t = new Timeline({ config, devtools });
    timelineRef.current = t;
    return t;
  }, [config, devtools]);

  const [state, setState] = useState({
    scrollPercentage: 0,
    currentStep: 0,
    opacities: timeline.getOpacities(0),
  });

  useEffect(() => {
    const unsubscribe = timeline.on("scroll", ({ scrollPercentage, currentStep }) => {
      setState({
        scrollPercentage,
        currentStep,
        opacities: timeline.getOpacities(scrollPercentage),
      });
    });

    timeline.start();

    return () => {
      unsubscribe();
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
