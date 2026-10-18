<script lang="ts">
  import MediaCard from '../domain/MediaCard.svelte';
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

<section class="space-y-4">
  <div class="flex items-baseline justify-between">
    <h3 class="text-lg font-bold tracking-tight">{title}</h3>
    {#if seeAllHref}
      <a
        href={seeAllHref}
        class="flex items-center gap-1 text-[12px] font-semibold text-foreground-muted transition hover:text-brand-400"
      >
        See all →
      </a>
    {/if}
  </div>

  {#if items.length > 0}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {#each items as item (item.id)}
        <MediaCard publication={item} href={hrefFor(item)} />
      {/each}
    </div>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
