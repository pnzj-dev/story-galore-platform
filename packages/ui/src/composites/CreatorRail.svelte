<script lang="ts">
  import CreatorCard from '../domain/CreatorCard.svelte';
  import RailScroller from './RailScroller.svelte';
  import type { CreatorCardData } from '../types';

  let {
    title,
    items,
    emptyHint,
  }: { title: string; items: CreatorCardData[]; emptyHint?: string } = $props();
</script>

<section class="space-y-3">
  <div class="flex items-baseline justify-between px-1">
    <h2 class="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
  </div>

  {#if items.length > 0}
    <RailScroller>
      {#each items as item (item.id)}
        <CreatorCard creator={item} href={`/creators/${item.id}`} />
      {/each}
    </RailScroller>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
