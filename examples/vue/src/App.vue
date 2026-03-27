<script setup lang="ts">
import type { StepConfig } from "@multitrack/core";
import { useTimeline } from "./composables/useTimeline.ts";
import { computed } from "vue";

const config: StepConfig[] = [
  // Main track
  { name: "intro", duration: 3, track: "main" },
  { name: "buffer", duration: 1, track: "main" },
  { name: "feature-1", duration: 4, track: "main" },
  { name: "feature-2", duration: 4, track: "main" },
  { name: "buffer", duration: 1, track: "main" },
  { name: "outro", duration: 3, track: "main" },

  // Text track
  { name: "buffer", duration: 4, track: "text" },
  { name: "caption-1", duration: 3, track: "text" },
  { name: "buffer", duration: 1, track: "text" },
  { name: "caption-2", duration: 3, track: "text" },
  { name: "buffer", duration: 1, track: "text" },
  { name: "caption-3", duration: 3, track: "text" },

  // Accent track
  { name: "buffer", duration: 5, track: "accent" },
  { name: "highlight", duration: 6, track: "accent" },
];

const { scrollPercentage, currentStep, opacities, totalSteps } =
  useTimeline(config);

const backgroundStyle = computed(() => ({
  position: "absolute" as const,
  inset: "0",
  background: `linear-gradient(${scrollPercentage.value * 360}deg, #0f172a, #1e293b, #334155)`,
  transition: "background 0.1s",
}));

const highlightOpacity = computed(() => opacities.value["highlight"] ?? 0);

const activeEntries = computed(() =>
  Object.entries(opacities.value).filter(([, v]) => v > 0)
);

function sectionStyle(name: string) {
  const o = opacities.value[name] ?? 0;
  return {
    opacity: o,
    transform: `translateY(${(1 - o) * 30}px)`,
    display: o > 0 ? undefined : "none",
  };
}
</script>

<template>
  <div :style="{ height: totalSteps * 100 + 'vh' }">
    <div
      style="
        position: fixed;
        inset: 0;
        touch-action: pan-y;
        overflow: hidden;
      "
    >
      <!-- Background -->
      <div :style="backgroundStyle" />

      <!-- Intro -->
      <div
        :style="{
          ...sectionStyle('intro'),
          position: 'absolute',
          inset: '0',
          display: (opacities['intro'] ?? 0) > 0 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }"
      >
        <h1
          style="
            font-size: 48px;
            font-weight: 700;
            color: white;
            letter-spacing: -1px;
          "
        >
          @multitrack
        </h1>
        <p style="font-size: 18px; color: rgba(255, 255, 255, 0.6); margin-top: 12px">
          Scroll-driven animation engine
        </p>
        <div style="margin-top: 48px; color: rgba(255, 255, 255, 0.3); font-size: 14px">
          &darr; scroll to explore
        </div>
      </div>

      <!-- Feature 1 -->
      <div
        v-if="(opacities['feature-1'] ?? 0) > 0"
        style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        "
      >
        <div
          :style="{
            maxWidth: '480px',
            padding: '40px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59,130,246,0.25)',
            opacity: opacities['feature-1'] ?? 0,
            transform: `translateY(${(1 - (opacities['feature-1'] ?? 0)) * 30}px)`,
          }"
        >
          <div
            style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #3b82f6;
              margin-bottom: 16px;
            "
          />
          <h2 style="font-size: 28px; font-weight: 600; color: white; margin: 0">
            Multi-Track Timeline
          </h2>
          <p
            style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.6);
              margin-top: 12px;
              line-height: 1.6;
            "
          >
            Like a video editor: independent tracks for content, text, and
            effects &mdash; all driven by scroll position.
          </p>
        </div>
      </div>

      <!-- Feature 2 -->
      <div
        v-if="(opacities['feature-2'] ?? 0) > 0"
        style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        "
      >
        <div
          :style="{
            maxWidth: '480px',
            padding: '40px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139,92,246,0.25)',
            opacity: opacities['feature-2'] ?? 0,
            transform: `translateY(${(1 - (opacities['feature-2'] ?? 0)) * 30}px)`,
          }"
        >
          <div
            style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #8b5cf6;
              margin-bottom: 16px;
            "
          />
          <h2 style="font-size: 28px; font-weight: 600; color: white; margin: 0">
            Config-Driven API
          </h2>
          <p
            style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.6);
              margin-top: 12px;
              line-height: 1.6;
            "
          >
            Define animations declaratively. No imperative code, no
            requestAnimationFrame loops.
          </p>
        </div>
      </div>

      <!-- Captions -->
      <div
        v-if="(opacities['caption-1'] ?? 0) > 0"
        :style="{ ...captionBase, opacity: opacities['caption-1'] ?? 0 }"
      >
        Each track maintains its own independent cursor.
      </div>
      <div
        v-if="(opacities['caption-2'] ?? 0) > 0"
        :style="{ ...captionBase, opacity: opacities['caption-2'] ?? 0 }"
      >
        Steps on different tracks can overlap freely.
      </div>
      <div
        v-if="(opacities['caption-3'] ?? 0) > 0"
        :style="{ ...captionBase, opacity: opacities['caption-3'] ?? 0 }"
      >
        The opacity engine handles everything.
      </div>

      <!-- Highlight ring -->
      <div
        v-if="highlightOpacity > 0"
        :style="{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200px',
          height: '200px',
          transform: `translate(-50%, -50%) scale(${0.8 + highlightOpacity * 0.4})`,
          border: '2px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '50%',
          opacity: highlightOpacity * 0.5,
          zIndex: 5,
          pointerEvents: 'none',
        }"
      />

      <!-- Outro -->
      <div
        :style="{
          ...sectionStyle('outro'),
          position: 'absolute',
          inset: '0',
          display: (opacities['outro'] ?? 0) > 0 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }"
      >
        <h2 style="font-size: 36px; font-weight: 600; color: white; margin: 0">
          That's it.
        </h2>
        <p
          style="
            font-size: 16px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 12px;
          "
        >
          Config-driven. Framework-agnostic core. Devtools included.
        </p>
      </div>

      <!-- Debug info -->
      <div
        style="
          position: absolute;
          bottom: 16px;
          left: 16px;
          font-family: monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          z-index: 50;
        "
      >
        step {{ currentStep.toFixed(1) }} / {{ totalSteps }} &middot;
        {{ (scrollPercentage * 100).toFixed(0) }}%
      </div>

      <!-- Active steps -->
      <div
        style="
          position: absolute;
          top: 16px;
          right: 16px;
          font-family: monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-align: right;
          z-index: 50;
        "
      >
        <div v-for="[name, value] in activeEntries" :key="name">
          {{ name }}: {{ (value as number).toFixed(2) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const captionBase = {
  position: "absolute" as const,
  bottom: "80px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(10px)",
  borderRadius: "8px",
  color: "rgba(255,255,255,0.8)",
  fontSize: "14px",
  fontFamily: "monospace",
  whiteSpace: "nowrap" as const,
  zIndex: 20,
};

export { captionBase };
</script>
