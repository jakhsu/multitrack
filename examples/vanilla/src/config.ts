import type { StepConfig } from "@multitrack/core";

export const config: StepConfig[] = [
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
