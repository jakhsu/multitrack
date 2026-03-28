<script lang="ts">
  import type { Snippet } from "svelte";
  import { useScrollProgress } from "./composables.svelte.js";

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: className, children }: Props = $props();

  const { totalSteps } = useScrollProgress();
</script>

<div
  class={className}
  style:height="{totalSteps * 100}vh"
  style:position="relative"
>
  {@render children()}
</div>
