<script lang="ts">
  let {
    columns = [],
    rows = [],
    rowKey = 'id',
    loading = false,
    emptyHint = 'No records',
    searchable = false,
  }: {
    columns?: Array<{ key: string; label: string; align?: 'left' | 'right'; href?: (row: Record<string, unknown>) => string }>;
    rows?: Array<Record<string, unknown>>;
    rowKey?: string;
    loading?: boolean;
    emptyHint?: string;
    searchable?: boolean;
  } = $props();

  let query = $state('');
  const filtered = $derived(
    query
      ? rows.filter((row) =>
          columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(query.toLowerCase())),
        )
      : rows,
  );
</script>

{#if searchable}
  <input
    type="search"
    bind:value={query}
    placeholder="Search…"
    class="mb-2 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
  />
{/if}

<div class="overflow-x-auto rounded-lg border border-border">
  <table class="w-full text-sm">
    <thead class="sticky top-0 bg-surface text-xs uppercase tracking-widest text-foreground-muted">
      <tr>
        {#each columns as c (c.key)}
          <th class={`border-b border-border px-3 py-2 font-medium ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
            {c.label}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr><td colspan={columns.length} class="px-3 py-6 text-center text-foreground-muted">Loading…</td></tr>
      {:else if filtered.length === 0}
        <tr><td colspan={columns.length} class="px-3 py-6 text-center text-foreground-muted">{emptyHint}</td></tr>
      {:else}
        {#each filtered as row (String(row[rowKey]))}
          <tr class="border-t border-border/60 transition hover:bg-surface-elevated">
            {#each columns as c (c.key)}
              <td class={`px-3 py-2 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                {#if c.href}
                  <a href={c.href(row)} class="text-link hover:underline">{String(row[c.key] ?? '')}</a>
                {:else}
                  {String(row[c.key] ?? '')}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
