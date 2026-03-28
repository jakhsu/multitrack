<script lang="ts">
  import type { Snippet } from "svelte";
  import { getMultitrackContext } from "./context.svelte.js";

  interface Props {
    when: string;
    children: Snippet;
  }

  let { when, children }: Props = $props();

  const ctx = getMultitrackContext();
</script>

{#if (ctx.opacities[when] ?? 0) > 0}
  {@render children()}
{/if}
