<script lang="ts">
  import { listCachedPublications, clearPublication } from '@/lib/reader-cache';
  import type { CachedPublication } from '@/lib/reader-cache';

  let {
    labels,
  }: {
    labels: {
      downloads: string;
      downloadsDesc: string;
      noDownloads: string;
      remove: string;
      pages: string;
    };
  } = $props();

  let rows = $state<CachedPublication[]>([]);
  let loaded = $state(false);

  async function refresh() {
    rows = await listCachedPublications();
    loaded = true;
  }

  async function remove(id: string) {
    await clearPublication(id);
    await refresh();
  }

  $effect(() => {
    void refresh();
  });
</script>

<section class="mt-12">
  <h2 class="text-xl font-semibold">{labels.downloads}</h2>
  <p class="mt-1 text-sm text-foreground-muted">{labels.downloadsDesc}</p>

  {#if loaded && rows.length === 0}
    <p class="mt-4 rounded-md border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {labels.noDownloads}
    </p>
  {:else if rows.length > 0}
    <ul class="mt-4 space-y-2">
      {#each rows as row (row.publicationId)}
        <li class="flex items-center justify-between rounded-md border border-border bg-surface p-4">
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{row.title || row.publicationId}</p>
            <p class="text-xs text-foreground-muted">
              {row.pageCount} {labels.pages}
            </p>
          </div>
          <button
            type="button"
            onclick={() => remove(row.publicationId)}
            class="ml-4 shrink-0 rounded-sm border border-danger px-3 py-1.5 text-xs text-danger transition hover:bg-danger/10"
          >
            {labels.remove}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
