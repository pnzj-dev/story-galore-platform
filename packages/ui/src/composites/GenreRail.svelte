<script lang="ts">
  let {
    title,
    items,
    emptyHint,
  }: {
    title: string;
    items: { label: string; href: string }[];
    emptyHint?: string;
  } = $props();
</script>

<section class="space-y-3">
  <div class="flex items-baseline justify-between px-1">
    <h2 class="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
  </div>

  {#if items.length > 0}
    <div class="flex flex-wrap gap-2 px-1">
      {#each items as item (item.href)}
        <a
          href={item.href}
          class="rounded-full border border-border px-3 py-1 text-sm text-foreground-muted transition hover:border-foreground-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          {item.label}
        </a>
      {/each}
    </div>
  {:else if emptyHint}
    <p class="rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
      {emptyHint}
    </p>
  {/if}
</section>
