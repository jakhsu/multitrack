import type { StepConfig, EasingFunction } from "@multitrack/core";

/* Custom easings */

const fadeOut: EasingFunction = (t) => (t > 0.7 ? (1 - t) / 0.3 : 1);

const fadeInOut: EasingFunction = (t) => {
  if (t < 0.2) return t / 0.2;
  if (t > 0.8) return (1 - t) / 0.2;
  return 1;
};

const fadeIn: EasingFunction = (t) => Math.min(t / 0.3, 1);

/* Step configuration (2 tracks, 33 steps each) */

export const config: StepConfig[] = [
  // Map track
  { name: "globe", duration: 4, track: "map" },
  { name: "tokyo", duration: 5, track: "map" },
  { name: "alps", duration: 5, track: "map" },
  { name: "sahara", duration: 5, track: "map" },
  { name: "nyc", duration: 5, track: "map" },
  { name: "amazon", duration: 5, track: "map" },
  { name: "globe-out", duration: 4, track: "map" },

  // Text track
  { name: "title", duration: 4, track: "text", easing: fadeOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-tokyo", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-alps", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-sahara", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-nyc", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "text-amazon", duration: 4, track: "text", easing: fadeInOut },
  { name: "buffer", duration: 1, track: "text" },
  { name: "outro", duration: 3, track: "text", easing: fadeIn },
];

/* Map view states */

export const views: Record<
  string,
  { center: [number, number]; zoom: number; pitch: number; bearing: number }
> = {
  globe: { center: [20, 20], zoom: 1.8, pitch: 0, bearing: 0 },
  tokyo: { center: [139.75, 35.685], zoom: 12, pitch: 50, bearing: -17 },
  alps: { center: [10.5, 46.85], zoom: 9, pitch: 60, bearing: 30 },
  sahara: { center: [8, 23.5], zoom: 4, pitch: 0, bearing: 0 },
  nyc: { center: [-74.006, 40.713], zoom: 13, pitch: 55, bearing: -15 },
  amazon: { center: [-62, -3.5], zoom: 5, pitch: 20, bearing: 10 },
  "globe-out": { center: [0, 20], zoom: 1.8, pitch: 0, bearing: 0 },
};

export const MAP_STEPS = [
  "globe",
  "tokyo",
  "alps",
  "sahara",
  "nyc",
  "amazon",
  "globe-out",
] as const;

export const LOCATIONS = [
  "tokyo",
  "alps",
  "sahara",
  "nyc",
  "amazon",
] as const;
