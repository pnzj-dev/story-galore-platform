<script lang="ts">
  import MediaCard from '../domain/MediaCard.svelte';
  import RailScroller from './RailScroller.svelte';
  import type { MediaCardData } from '../types';

  let {
    title,
    items,
    seeAllHref,
    getHref,
    emptyHint,
  }: {
    title: string;
    items: MediaCardData[];
    seeAllHref?: string;
    getHref?: (item: MediaCardData) => string;
    emptyHint?: string;
  } = $props();

  const defaultHref = (item: MediaCardData) => {
    switch (item.type) {
      case 'VIDEO':
        return `/watch/${item.id}`;
      case 'AUDIO':
        return `/listen/${item.id}`;
      case 'POST':
        return `/posts/${item.id}`;
      default:
        return `/read/${item.id}`;
    }
  };
  const hrefFor = (item: MediaCardData) => (getHref ?? defaultHref)(item);
</script>

<section class="space-y-3">
  <div class="flex items-baseline justify-between px-1">
    <h2 class="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
    {#if seeAllHref}
      <a href={seeAllHref} class="text-sm text-foreground-muted transition hover:text-foreground">See all</a>
    {/if}
  </div>

  {#if items.length > 0}
    <RailScroller>
      {#each items as item (item.id)}
        <MediaCard publication={item} href={hrefFor(item)} />
      {/each}
    </RailScroller>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
