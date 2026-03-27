/**
 * Multitrack DevTools Panel
 *
 * Renders the timeline visualization inside Chrome DevTools.
 * Ported from sinking-china Debug.tsx (290 lines React) to vanilla JS.
 *
 * Original features preserved:
 * - Multi-track horizontal timeline
 * - Color-coded step blocks per track
 * - Red playhead indicator
 * - Hover tooltips
 * - Track metadata (step count)
 *
 * New features:
 * - Active steps table with live opacity values
 * - Event log (step:enter / step:exit)
 * - Scroll progress bar
 */

// --- Types (mirroring @multitrack/core DevtoolsState) ---
interface Step {
  name: string;
  start: number;
  end: number;
  track: string;
  easing: string | Function;
}

interface DevtoolsState {
  steps: Step[];
  currentStep: number;
  totalSteps: number;
  opacities: Record<string, number>;
  scrollPercentage: number;
}

// --- Color system (ported from Debug.tsx lines 6-19) ---
const TRACK_COLORS: Record<string, string> = {};
const HUE_STEP = 47; // Golden angle-ish for good distribution
let hueCounter = 0;

function getTrackColor(track: string): string {
  if (!TRACK_COLORS[track]) {
    TRACK_COLORS[track] = `hsl(${(hueCounter * HUE_STEP) % 360}, 65%, 70%)`;
    hueCounter++;
  }
  return TRACK_COLORS[track];
}

// --- DOM references ---
const statusEl = document.getElementById("status")!;
const progressFill = document.getElementById("progress-fill")!;
const statStep = document.getElementById("stat-step")!;
const statScroll = document.getElementById("stat-scroll")!;
const statTracks = document.getElementById("stat-tracks")!;
const timelineEl = document.getElementById("timeline")!;
const activeStepsBody = document.getElementById("active-steps-body")!;
const logEntries = document.getElementById("log-entries")!;
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

// --- State ---
let lastState: DevtoolsState | null = null;
let previousActiveSteps = new Set<string>();
const MAX_LOG_ENTRIES = 100;

// --- Poll page state via chrome.devtools.inspectedWindow.eval() ---
// This bypasses CSP restrictions and doesn't require a content script.
// Same approach used by React DevTools, Redux DevTools, etc.
function pollViaEval() {
  chrome.devtools.inspectedWindow.eval(
    "window.__MULTITRACK_DEVTOOLS__ ? JSON.stringify(window.__MULTITRACK_DEVTOOLS__) : null",
    (result: string | null, exceptionInfo: any) => {
      if (exceptionInfo) {
        console.warn("[multitrack-devtools] eval error:", exceptionInfo);
        return;
      }
      if (result) {
        try {
          handleStateUpdate(JSON.parse(result));
        } catch (e) {
          console.warn("[multitrack-devtools] parse error:", e);
        }
      }
    },
  );
}

setInterval(pollViaEval, 50);
pollViaEval(); // initial poll

// --- Core render ---
function handleStateUpdate(state: DevtoolsState) {
  // Update connection status
  statusEl.textContent = "connected";
  statusEl.className = "status connected";

  // Track enter/exit events
  const nowActive = new Set<string>();
  for (const step of state.steps) {
    if (
      state.currentStep >= step.start &&
      state.currentStep < step.end
    ) {
      nowActive.add(step.name);
      if (!previousActiveSteps.has(step.name)) {
        addLogEntry("enter", step.name, step.track);
      }
    }
  }
  for (const name of previousActiveSteps) {
    if (!nowActive.has(name)) {
      const step = state.steps.find((s) => s.name === name);
      if (step) addLogEntry("exit", step.name, step.track);
    }
  }
  previousActiveSteps = nowActive;

  // Update progress bar
  progressFill.style.width = `${state.scrollPercentage * 100}%`;

  // Update stats
  const tracks = [...new Set(state.steps.map((s) => s.track))];
  statStep.textContent = `step: ${state.currentStep.toFixed(1)} / ${state.totalSteps}`;
  statScroll.textContent = `scroll: ${(state.scrollPercentage * 100).toFixed(0)}%`;
  statTracks.textContent = `tracks: ${tracks.length}`;

  // Render timeline (only rebuild DOM structure if steps changed)
  if (!lastState || lastState.steps.length !== state.steps.length) {
    renderTimelineStructure(state);
  }
  updateTimelineState(state);

  // Update active steps table
  renderActiveSteps(state);

  lastState = state;
}

/**
 * Build the timeline DOM structure.
 * Ported from Debug.tsx renderTimeline() (lines 185-252).
 */
function renderTimelineStructure(state: DevtoolsState) {
  timelineEl.innerHTML = "";
  const tracks = [...new Set(state.steps.map((s) => s.track))];
  const scale = 100 / state.totalSteps;

  for (const track of tracks) {
    const trackSteps = state.steps.filter((s) => s.track === track);
    const trackLength = trackSteps.reduce(
      (sum, s) => sum + (s.end - s.start),
      0,
    );
    const color = getTrackColor(track);

    const trackDiv = document.createElement("div");
    trackDiv.className = "track";
    trackDiv.dataset.track = track;

    // Label
    const label = document.createElement("div");
    label.className = "track-label";
    label.innerHTML = `${track} <span class="meta">(${trackLength} steps)</span>`;
    trackDiv.appendChild(label);

    // Bar with steps
    const bar = document.createElement("div");
    bar.className = "track-bar";

    for (const step of trackSteps) {
      const block = document.createElement("div");
      block.className = "step-block";
      block.dataset.stepName = step.name;
      block.style.left = `${step.start * scale}%`;
      block.style.width = `${(step.end - step.start) * scale}%`;
      block.style.backgroundColor = color;
      block.textContent = step.name;

      // Tooltip on hover
      block.addEventListener("mouseenter", (e) => {
        tooltip.textContent = `${step.name} [${step.start}–${step.end}]`;
        tooltip.classList.add("visible");
        positionTooltip(e as MouseEvent);
      });
      block.addEventListener("mousemove", (e) => positionTooltip(e as MouseEvent));
      block.addEventListener("mouseleave", () => {
        tooltip.classList.remove("visible");
      });

      bar.appendChild(block);
    }

    // Playhead
    const playhead = document.createElement("div");
    playhead.className = "playhead";
    playhead.dataset.track = track;
    bar.appendChild(playhead);

    trackDiv.appendChild(bar);
    timelineEl.appendChild(trackDiv);
  }
}

/**
 * Update active/inactive state and playhead position without rebuilding DOM.
 */
function updateTimelineState(state: DevtoolsState) {
  const scale = 100 / state.totalSteps;

  // Update step blocks
  const blocks = timelineEl.querySelectorAll<HTMLElement>(".step-block");
  for (const block of blocks) {
    const name = block.dataset.stepName!;
    const opacity = state.opacities[name] ?? 0;
    block.className = `step-block ${opacity > 0 ? "active" : "inactive"}`;
  }

  // Update playheads
  const playheads = timelineEl.querySelectorAll<HTMLElement>(".playhead");
  for (const ph of playheads) {
    ph.style.left = `${state.currentStep * scale}%`;
  }
}

function renderActiveSteps(state: DevtoolsState) {
  const active = state.steps.filter(
    (s) =>
      state.currentStep >= s.start && state.currentStep < s.end,
  );

  activeStepsBody.innerHTML = active
    .map(
      (s) => `
      <tr>
        <td>${s.name}</td>
        <td>${s.track}</td>
        <td>${s.start}–${s.end}</td>
        <td class="opacity-cell">${(state.opacities[s.name] ?? 0).toFixed(3)}</td>
      </tr>
    `,
    )
    .join("");

  if (active.length === 0) {
    activeStepsBody.innerHTML =
      '<tr><td colspan="4" style="color:#666">No active steps</td></tr>';
  }
}

function addLogEntry(type: "enter" | "exit", name: string, track: string) {
  const entry = document.createElement("div");
  entry.className = "log-entry";

  const now = new Date();
  const time = `${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;

  entry.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-type ${type}">${type === "enter" ? "▶ enter" : "◼ exit"}</span>
    <span class="log-name">${name}</span>
    <span class="log-track">${track}</span>
  `;

  logEntries.insertBefore(entry, logEntries.firstChild);

  // Keep log bounded
  while (logEntries.children.length > MAX_LOG_ENTRIES) {
    logEntries.removeChild(logEntries.lastChild!);
  }
}

function positionTooltip(e: MouseEvent) {
  tooltip.style.left = `${e.clientX + 12}px`;
  tooltip.style.top = `${e.clientY - 30}px`;
}
