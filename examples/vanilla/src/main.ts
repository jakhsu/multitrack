import { Timeline } from "@multitrack/core";
import { config } from "./config.ts";
import "./style.css";

const timeline = new Timeline({ config, devtools: true });

// Cache DOM elements
const scrollContainer = document.getElementById("scroll-container")!;
const background = document.getElementById("background")!;
const intro = document.getElementById("intro")!;
const feature1 = document.getElementById("feature-1")!;
const feature2 = document.getElementById("feature-2")!;
const caption1 = document.getElementById("caption-1")!;
const caption2 = document.getElementById("caption-2")!;
const caption3 = document.getElementById("caption-3")!;
const highlight = document.getElementById("highlight")!;
const outro = document.getElementById("outro")!;
const debug = document.getElementById("debug")!;
const activeSteps = document.getElementById("active-steps")!;

// Set scroll height
scrollContainer.style.height = `${timeline.totalSteps * 100}vh`;

// Subscribe to scroll events
timeline.on("scroll", ({ scrollPercentage, currentStep }) => {
  const opacities = timeline.getOpacities(scrollPercentage);

  // Update background gradient
  background.style.background = `linear-gradient(${scrollPercentage * 360}deg, #0f172a, #1e293b, #334155)`;

  // Update sections
  updateSection(intro, opacities["intro"] ?? 0);
  updateSection(feature1, opacities["feature-1"] ?? 0);
  updateSection(feature2, opacities["feature-2"] ?? 0);
  updateSection(caption1, opacities["caption-1"] ?? 0);
  updateSection(caption2, opacities["caption-2"] ?? 0);
  updateSection(caption3, opacities["caption-3"] ?? 0);
  updateSection(outro, opacities["outro"] ?? 0);

  // Update highlight ring
  const highlightOpacity = opacities["highlight"] ?? 0;
  highlight.style.opacity = String(highlightOpacity * 0.5);
  highlight.style.transform = `translate(-50%, -50%) scale(${0.8 + highlightOpacity * 0.4})`;
  highlight.style.display = highlightOpacity > 0 ? "" : "none";

  // Update debug info
  debug.textContent = `step ${currentStep.toFixed(1)} / ${timeline.totalSteps} \u00b7 ${(scrollPercentage * 100).toFixed(0)}%`;

  // Update active steps indicator
  const active = Object.entries(opacities)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => `${name}: ${value.toFixed(2)}`)
    .join("\n");
  activeSteps.textContent = active;
});

timeline.start();

function updateSection(el: HTMLElement, opacity: number) {
  el.style.opacity = String(opacity);
  el.style.transform = `translateY(${(1 - opacity) * 30}px)`;
  el.style.display = opacity > 0 ? "" : "none";
}
