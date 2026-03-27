<script lang="ts">
  import type { StepConfig } from "@multitrack/core";
  import { createTimeline } from "./lib/timeline.svelte.ts";
  import { onDestroy } from "svelte";

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

  const tl = createTimeline(config);

  onDestroy(() => tl.destroy());

  function activeEntries() {
    return Object.entries(tl.opacities).filter(([, v]) => v > 0);
  }
</script>

<div style:height="{tl.totalSteps * 100}vh">
  <div
    style="position: fixed; inset: 0; touch-action: pan-y; overflow: hidden;"
  >
    <!-- Background -->
    <div
      style="position: absolute; inset: 0; transition: background 0.1s;"
      style:background="linear-gradient({tl.scrollPercentage * 360}deg, #0f172a, #1e293b, #334155)"
    ></div>

    <!-- Intro -->
    {#if (tl.opacities["intro"] ?? 0) > 0}
      <div
        class="section"
        style:opacity={tl.opacities["intro"] ?? 0}
        style:transform="translateY({(1 - (tl.opacities['intro'] ?? 0)) * 30}px)"
      >
        <h1
          style="font-size: 48px; font-weight: 700; color: white; letter-spacing: -1px;"
        >
          @multitrack
        </h1>
        <p
          style="font-size: 18px; color: rgba(255,255,255,0.6); margin-top: 12px;"
        >
          Scroll-driven animation engine
        </p>
        <div
          style="margin-top: 48px; color: rgba(255,255,255,0.3); font-size: 14px;"
        >
          &darr; scroll to explore
        </div>
      </div>
    {/if}

    <!-- Feature 1 -->
    {#if (tl.opacities["feature-1"] ?? 0) > 0}
      {@const o = tl.opacities["feature-1"] ?? 0}
      <div class="section">
        <div
          class="card"
          style:opacity={o}
          style:transform="translateY({(1 - o) * 30}px)"
          style:border-color="rgba(59,130,246,0.25)"
        >
          <div class="dot" style="background: #3b82f6;"></div>
          <h2>Multi-Track Timeline</h2>
          <p>
            Like a video editor: independent tracks for content, text, and
            effects &mdash; all driven by scroll position.
          </p>
        </div>
      </div>
    {/if}

    <!-- Feature 2 -->
    {#if (tl.opacities["feature-2"] ?? 0) > 0}
      {@const o = tl.opacities["feature-2"] ?? 0}
      <div class="section">
        <div
          class="card"
          style:opacity={o}
          style:transform="translateY({(1 - o) * 30}px)"
          style:border-color="rgba(139,92,246,0.25)"
        >
          <div class="dot" style="background: #8b5cf6;"></div>
          <h2>Config-Driven API</h2>
          <p>
            Define animations declaratively. No imperative code, no
            requestAnimationFrame loops.
          </p>
        </div>
      </div>
    {/if}

    <!-- Captions -->
    {#if (tl.opacities["caption-1"] ?? 0) > 0}
      <div class="caption" style:opacity={tl.opacities["caption-1"] ?? 0}>
        Each track maintains its own independent cursor.
      </div>
    {/if}
    {#if (tl.opacities["caption-2"] ?? 0) > 0}
      <div class="caption" style:opacity={tl.opacities["caption-2"] ?? 0}>
        Steps on different tracks can overlap freely.
      </div>
    {/if}
    {#if (tl.opacities["caption-3"] ?? 0) > 0}
      <div class="caption" style:opacity={tl.opacities["caption-3"] ?? 0}>
        The opacity engine handles everything.
      </div>
    {/if}

    <!-- Highlight ring -->
    {#if (tl.opacities["highlight"] ?? 0) > 0}
      {@const ho = tl.opacities["highlight"] ?? 0}
      <div
        style="
          position: absolute; top: 50%; left: 50%;
          width: 200px; height: 200px;
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 50%; z-index: 5; pointer-events: none;
        "
        style:opacity={ho * 0.5}
        style:transform="translate(-50%, -50%) scale({0.8 + ho * 0.4})"
      ></div>
    {/if}

    <!-- Outro -->
    {#if (tl.opacities["outro"] ?? 0) > 0}
      <div
        class="section"
        style:opacity={tl.opacities["outro"] ?? 0}
        style:transform="translateY({(1 - (tl.opacities['outro'] ?? 0)) * 30}px)"
      >
        <h2 style="font-size: 36px; font-weight: 600; color: white; margin: 0;">
          That's it.
        </h2>
        <p
          style="font-size: 16px; color: rgba(255,255,255,0.5); margin-top: 12px;"
        >
          Config-driven. Framework-agnostic core. Devtools included.
        </p>
      </div>
    {/if}

    <!-- Debug info -->
    <div class="debug">
      step {tl.currentStep.toFixed(1)} / {tl.totalSteps} &middot;
      {(tl.scrollPercentage * 100).toFixed(0)}%
    </div>

    <!-- Active steps -->
    <div class="active-steps">
      {#each activeEntries() as [name, value]}
        <div>{name}: {(value as number).toFixed(2)}</div>
      {/each}
    </div>
  </div>
</div>

<style>
  .section {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    color: white;
  }

  .card {
    max-width: 480px;
    padding: 40px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid;
  }

  .card h2 {
    font-size: 28px;
    font-weight: 600;
    color: white;
    margin: 0;
  }

  .card p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 12px;
    line-height: 1.6;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-bottom: 16px;
  }

  .caption {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-family: monospace;
    white-space: nowrap;
    z-index: 20;
  }

  .debug {
    position: absolute;
    bottom: 16px;
    left: 16px;
    font-family: monospace;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    z-index: 50;
  }

  .active-steps {
    position: absolute;
    top: 16px;
    right: 16px;
    font-family: monospace;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-align: right;
    z-index: 50;
  }
</style>
