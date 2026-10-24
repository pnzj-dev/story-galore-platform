<script lang="ts">
  import { onMount } from 'svelte';
  import { actions } from 'astro:actions';
  import { MediaCarousel } from '@storygalore/ui';
  import type { MediaCardData } from '@storygalore/ui';
  import Modal from './Modal.svelte';

  type Collection = { $id: string; title?: string; description?: string; publicationIds?: string[] };

  let {
    title,
    onclose,
    continueLabel,
    savedLabel,
    collectionsLabel,
    emptyHint,
    noCollectionsLabel,
    titlesLabel,
  }: {
    title: string;
    onclose: () => void;
    continueLabel: string;
    savedLabel: string;
    collectionsLabel: string;
    emptyHint: string;
    noCollectionsLabel: string;
    titlesLabel: string;
  } = $props();

  let continueItems = $state<MediaCardData[]>([]);
  let savedTitles = $state<MediaCardData[]>([]);
  let collections = $state<Collection[]>([]);
  let loaded = $state(false);

  onMount(async () => {
    const r = await actions.libraryGet({});
    if (!r.error && r.data) {
      continueItems = r.data.continueItems ?? [];
      savedTitles = r.data.savedTitles ?? [];
      collections = r.data.collections ?? [];
    }
    loaded = true;
  });
</script>

<Modal title={title} {onclose}>
  {#if !loaded}
    <p class="text-sm text-foreground-muted">…</p>
  {:else}
    <MediaCarousel title={continueLabel} items={continueItems} emptyHint={emptyHint} />

    {#if savedTitles.length > 0}
      <div class="mt-8">
        <MediaCarousel title={savedLabel} items={savedTitles} />
      </div>
    {/if}

    <section class="mt-8">
      <h3 class="text-lg font-bold tracking-tight">{collectionsLabel}</h3>
      {#if collections.length > 0}
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          {#each collections as c (c.$id)}
            <a
              href={`/collections/${c.$id}`}
              class="rounded-md border border-border bg-surface p-3 transition hover:border-foreground-muted"
            >
              <p class="font-semibold">{c.title}</p>
              {#if c.description}
                <p class="mt-1 text-sm text-foreground-muted">{c.description}</p>
              {/if}
              <p class="mt-1 text-xs text-foreground-tertiary">{c.publicationIds?.length ?? 0} {titlesLabel}</p>
            </a>
          {/each}
        </div>
      {:else}
        <p class="mt-2 text-sm text-foreground-muted">{noCollectionsLabel}</p>
      {/if}
    </section>
  {/if}
</Modal>
