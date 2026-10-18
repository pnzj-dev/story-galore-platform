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
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {#each items as item (item.id)}
        <CreatorCard creator={item} href={`/creators/${item.id}`} />
      {/each}
    </div>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
