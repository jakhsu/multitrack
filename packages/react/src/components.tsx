import type { ReactNode, CSSProperties } from "react";
import { useScrollProgress, useStep } from "./hooks.js";

/**
 * Creates the tall scrollable container that drives the timeline.
 * Height = totalSteps * 100vh.
 *
 * Extracted from sinking-china MainMap.tsx line 193:
 * `<div style={{ height: `${totalSteps * 100}vh` }} className="relative">`
 */
export function ScrollContainer({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const { totalSteps } = useScrollProgress();

  return (
    <div
      style={{ height: `${totalSteps * 100}vh`, position: "relative", ...style }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Fixed viewport stage that stays in place while the user scrolls.
 * All animated content lives inside this.
 *
 * Extracted from sinking-china MainMap.tsx lines 200-207:
 * `<div style={{ position: "fixed", width: "100%", height: "100vh", touchAction: "pan-y" }}>`
 */
export function FixedStage({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        touchAction: "pan-y",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/**
 * Conditionally renders children based on a step's opacity.
 * Unmounts children when the step is inactive (opacity 0) for performance.
 *
 * Extracted from sinking-china ConditionalRender.tsx.
 */
export function Show({
  when,
  children,
}: {
  /** Step name to check. Children render when this step's opacity > 0. */
  when: string;
  children: ReactNode;
}) {
  const { isActive } = useStep(when);
  if (!isActive) return null;
  return <>{children}</>;
}
