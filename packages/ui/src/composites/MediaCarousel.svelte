<script lang="ts">
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import MediaCard from '../domain/MediaCard.svelte';
  import ShortCard from '../domain/ShortCard.svelte';
  import { mediaHref } from '../lib/media-href';
  import type { MediaCardData } from '../types';

  let {
    title,
    items,
    seeAllHref,
    seeAllLabel = 'See all →',
    getHref,
    emptyHint,
    variant = 'media',
    wide = false,
  }: {
    title: string;
    items: MediaCardData[];
    seeAllHref?: string;
    seeAllLabel?: string;
    getHref?: (item: MediaCardData) => string;
    emptyHint?: string;
    variant?: 'media' | 'short';
    wide?: boolean;
  } = $props();

  let scroller: HTMLDivElement | undefined;
  let canPrev = $state(false);
  let canNext = $state(false);

  function trackScroll(node: HTMLDivElement) {
    scroller = node;
    const sync = () => {
      canPrev = node.scrollLeft > 4;
      canNext = node.scrollLeft + node.clientWidth < node.scrollWidth - 4;
    };
    sync();
    node.addEventListener('scroll', sync, { passive: true });
    return {
      destroy() {
        node.removeEventListener('scroll', sync);
      },
    };
  }

  function page(dir: 1 | -1) {
    const el = scroller;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
  }

  const hrefFor = (item: MediaCardData) => (getHref ?? mediaHref)(item);

  const cardWidthClass = $derived(
    variant === 'short'
      ? 'w-28 shrink-0 sm:w-36'
      : wide
        ? 'w-72 shrink-0 sm:w-96'
        : 'w-36 shrink-0 sm:w-44',
  );
</script>

<section class="space-y-4">
  <div class="flex items-baseline justify-between">
    <h3 class="text-lg font-bold tracking-tight">{title}</h3>
    {#if seeAllHref}
      <a
        href={seeAllHref}
        class="flex items-center gap-1 text-[12px] font-semibold text-foreground-muted transition hover:text-brand-400"
      >
        {seeAllLabel}
      </a>
    {/if}
  </div>

  {#if items.length > 0}
    <div class="relative">
      {#if canPrev}
        <button
          type="button"
          onclick={() => page(-1)}
          aria-label="Previous"
          class="absolute -left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-surface"
        >
          <ChevronLeft size={18} />
        </button>
      {/if}

      <div
        use:trackScroll
        class="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {#each items as item (item.id)}
          <div class={cardWidthClass}>
            {#if variant === 'short'}
              <ShortCard publication={item} href={hrefFor(item)} />
            {:else}
              <MediaCard publication={item} href={hrefFor(item)} />
            {/if}
          </div>
        {/each}
      </div>

      {#if canNext}
        <button
          type="button"
          onclick={() => page(1)}
          aria-label="Next"
          class="absolute -right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-surface"
        >
          <ChevronRight size={18} />
        </button>
      {/if}
    </div>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
