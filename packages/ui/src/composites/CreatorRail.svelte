<script lang="ts">
  import CreatorCard from '../domain/CreatorCard.svelte';
  import type { CreatorCardData } from '../types';

  let {
    title,
    items,
    emptyHint,
  }: { title: string; items: CreatorCardData[]; emptyHint?: string } = $props();
</script>

<section class="space-y-4">
  <div class="flex items-baseline justify-between">
    <h3 class="text-lg font-bold tracking-tight">{title}</h3>
  </div>

  {#if items.length > 0}
    <div class="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
      {#each items as item (item.id)}
        <div class="w-40 shrink-0 snap-start lg:w-auto">
          <CreatorCard creator={item} href={`/creators/${item.id}`} />
        </div>
      {/each}
    </div>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
