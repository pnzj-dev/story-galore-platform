<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  let scroller = $state<HTMLDivElement>();
  let canLeft = $state(false);
  let canRight = $state(false);

  function update() {
    const el = scroller;
    if (!el) return;
    canLeft = el.scrollLeft > 1;
    canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  }

  function nudge(direction: number) {
    const el = scroller;
    if (!el) return;
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  }

  $effect(() => {
    const el = scroller;
    if (!el) return;
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    update();
    return () => ro.disconnect();
  });
</script>

<div class="group relative">
  <button
    type="button"
    aria-label="Scroll left"
    onclick={() => nudge(-1)}
    disabled={!canLeft}
    class="absolute start-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/90 p-2 text-foreground shadow-lg backdrop-blur transition hover:bg-surface disabled:cursor-default disabled:opacity-40"
  >
    <ChevronLeft class="h-5 w-5" />
  </button>

  <div
    bind:this={scroller}
    onscroll={update}
    class="scroller flex snap-x gap-4 overflow-x-auto pb-2"
  >
    {@render children()}
  </div>

  <button
    type="button"
    aria-label="Scroll right"
    onclick={() => nudge(1)}
    disabled={!canRight}
    class="absolute end-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-background/90 p-2 text-foreground shadow-lg backdrop-blur transition hover:bg-surface disabled:cursor-default disabled:opacity-40"
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
