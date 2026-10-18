<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  let scroller = $state<HTMLDivElement>();

  function nudge(direction: number) {
    const el = scroller;
    if (!el) return;
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  }
</script>

<div class="relative">
  <button
    type="button"
    aria-label="Scroll left"
    onclick={() => nudge(-1)}
    class="absolute -start-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background p-2 text-foreground shadow-md transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
  >
    <ChevronLeft class="h-5 w-5" />
  </button>

  <div bind:this={scroller} class="scroller flex snap-x gap-4 overflow-x-auto pb-2">
    {@render children()}
  </div>

  <button
    type="button"
    aria-label="Scroll right"
    onclick={() => nudge(1)}
    class="absolute -end-6 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background p-2 text-foreground shadow-md transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
  >
    <ChevronRight class="h-5 w-5" />
  </button>
</div>

<style>
  .scroller {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scroller::-webkit-scrollbar {
    display: none;
  }
</style>
