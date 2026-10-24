<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, onclose, maxWidthClass = 'max-w-2xl', children }: { title: string; onclose: () => void; maxWidthClass?: string; children: Snippet } = $props();
</script>

<div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/60" onclick={onclose} role="presentation"></div>
  <div
    class="relative z-10 max-h-[85dvh] w-full {maxWidthClass} overflow-y-auto rounded-md border border-border bg-surface p-6 shadow-xl"
  >
    <div class="mb-4 flex items-center justify-between gap-4">
      <h2 class="font-serif text-xl font-bold">{title}</h2>
      <button
        type="button"
        aria-label="Close"
        onclick={onclose}
        class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-elevated"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    {@render children()}
  </div>
</div>
