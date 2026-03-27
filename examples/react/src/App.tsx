import type { StepConfig } from "@multitrack/react";
import {
  MultitrackProvider,
  ScrollContainer,
  FixedStage,
  Show,
  useStep,
  useOpacities,
  useScrollProgress,
} from "@multitrack/react";

/**
 * Step configuration: 3 tracks, ~8 steps.
 * Demonstrates the multi-track timeline concept.
 */
const config: StepConfig[] = [
  // Main track: primary content phases
  { name: "intro", duration: 3, track: "main" },
  { name: "buffer", duration: 1, track: "main" },
  { name: "feature-1", duration: 4, track: "main" },
  { name: "feature-2", duration: 4, track: "main" },
  { name: "buffer", duration: 1, track: "main" },
  { name: "outro", duration: 3, track: "main" },

  // Text track: captions that overlay on main content
  { name: "buffer", duration: 4, track: "text" },
  { name: "caption-1", duration: 3, track: "text" },
  { name: "buffer", duration: 1, track: "text" },
  { name: "caption-2", duration: 3, track: "text" },
  { name: "buffer", duration: 1, track: "text" },
  { name: "caption-3", duration: 3, track: "text" },

  // Accent track: visual highlights
  { name: "buffer", duration: 5, track: "accent" },
  { name: "highlight", duration: 6, track: "accent" },
];

export default function App() {
  return (
    <MultitrackProvider config={config} devtools>
      <ScrollContainer>
        <FixedStage>
          <Scene />
        </FixedStage>
      </ScrollContainer>
    </MultitrackProvider>
  );
}

function Scene() {
  const { scrollPercentage, currentStep, totalSteps } = useScrollProgress();
  const opacities = useOpacities();

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Background gradient driven by scroll */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${scrollPercentage * 360}deg, #0f172a, #1e293b, #334155)`,
          transition: "background 0.1s",
        }}
      />

      {/* Intro */}
      <Show when="intro">
        <IntroSection />
      </Show>

      {/* Feature sections */}
      <Show when="feature-1">
        <FeatureCard
          step="feature-1"
          title="Multi-Track Timeline"
          description="Like a video editor: independent tracks for content, text, and effects — all driven by scroll position."
          color="#3b82f6"
        />
      </Show>

      <Show when="feature-2">
        <FeatureCard
          step="feature-2"
          title="Config-Driven API"
          description="Define animations declaratively. No imperative code, no requestAnimationFrame loops."
          color="#8b5cf6"
        />
      </Show>

      {/* Text captions on separate track */}
      <Show when="caption-1">
        <Caption text="Each track maintains its own independent cursor." />
      </Show>
      <Show when="caption-2">
        <Caption text="Steps on different tracks can overlap freely." />
      </Show>
      <Show when="caption-3">
        <Caption text="The opacity engine handles everything." />
      </Show>

      {/* Accent highlight */}
      <Show when="highlight">
        <HighlightRing />
      </Show>

      {/* Outro */}
      <Show when="outro">
        <OutroSection />
      </Show>

      {/* Debug info */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          fontFamily: "monospace",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          zIndex: 50,
        }}
      >
        step {currentStep.toFixed(1)} / {totalSteps} &middot;{" "}
        {(scrollPercentage * 100).toFixed(0)}%
      </div>

      {/* Active steps indicator */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          fontFamily: "monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          textAlign: "right",
          zIndex: 50,
        }}
      >
        {Object.entries(opacities)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => (
            <div key={name}>
              {name}: {(value as number).toFixed(2)}
            </div>
          ))}
      </div>
    </div>
  );
}

function IntroSection() {
  const { opacity } = useStep("intro");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        zIndex: 10,
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "white",
          margin: 0,
          letterSpacing: -1,
        }}
      >
        @multitrack
      </h1>
      <p
        style={{
          fontSize: 18,
          color: "rgba(255,255,255,0.6)",
          marginTop: 12,
        }}
      >
        Scroll-driven animation engine
      </p>
      <div
        style={{
          marginTop: 48,
          color: "rgba(255,255,255,0.3)",
          fontSize: 14,
        }}
      >
        ↓ scroll to explore
      </div>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
  color,
}: {
  step: string;
  title: string;
  description: string;
  color: string;
}) {
  const { opacity } = useStep(step);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          padding: 40,
          borderRadius: 16,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${color}40`,
          opacity,
          transform: `translateY(${(1 - opacity) * 30}px)`,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            marginBottom: 16,
          }}
        />
        <h2
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "white",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
            marginTop: 12,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "12px 24px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(10px)",
        borderRadius: 8,
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        fontFamily: "monospace",
        whiteSpace: "nowrap",
        zIndex: 20,
      }}
    >
      {text}
    </div>
  );
}

function HighlightRing() {
  const { opacity } = useStep("highlight");
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 200,
        height: 200,
        transform: `translate(-50%, -50%) scale(${0.8 + opacity * 0.4})`,
        border: "2px solid rgba(139, 92, 246, 0.3)",
        borderRadius: "50%",
        opacity: opacity * 0.5,
        zIndex: 5,
      }}
    />
  );
}

function OutroSection() {
  const { opacity } = useStep("outro");
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        zIndex: 10,
      }}
    >
      <h2
        style={{ fontSize: 36, fontWeight: 600, color: "white", margin: 0 }}
      >
        That's it.
      </h2>
      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.5)",
          marginTop: 12,
        }}
      >
        Config-driven. Framework-agnostic core. Devtools included.
      </p>
    </div>
  );
}
