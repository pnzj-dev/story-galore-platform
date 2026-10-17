<script lang="ts">
  let {
    title,
    description,
    children,
  }: { title: string; description?: string; children?: import('svelte').Snippet } = $props();
</script>

<section class="rounded-lg border border-dashed border-border p-8 text-center" aria-live="polite">
  <h2 class="text-sm font-semibold text-foreground">{title}</h2>
  {#if description}<p class="mt-1 text-sm text-foreground-muted">{description}</p>{/if}
  {#if children}<div class="mt-4">{@render children()}</div>{/if}
</section>
