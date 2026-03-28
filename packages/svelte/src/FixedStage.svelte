<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children: Snippet;
  }

  let { class: className, children }: Props = $props();
</script>

<div
  class={className}
  style:position="fixed"
  style:top="0"
  style:left="0"
  style:width="100%"
  style:height="100vh"
  style:touch-action="pan-y"
>
  {@render children()}
</div>
