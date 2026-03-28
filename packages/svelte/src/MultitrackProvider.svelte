<script lang="ts">
  import type { StepConfig } from "@multitrack/core";
  import type { Snippet } from "svelte";
  import { onDestroy } from "svelte";
  import { createMultitrackContext } from "./context.svelte.js";

  interface Props {
    config: StepConfig[];
    devtools?: boolean;
    breakpoints?: Record<string, string>;
    children: Snippet;
  }

  const { config, devtools = false, breakpoints, children }: Props = $props();

  const ctx = createMultitrackContext({ config, devtools, breakpoints });

  onDestroy(() => {
    ctx._dispose();
  });
</script>

{@render children()}
