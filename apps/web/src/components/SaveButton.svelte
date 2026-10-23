<script lang="ts">
  import { actions } from 'astro:actions';

  let {
    publicationId,
    saved = false,
    saveLabel = 'Save to list',
    savedLabel = 'Saved',
  }: {
    publicationId: string;
    saved?: boolean;
    saveLabel?: string;
    savedLabel?: string;
  } = $props();

  let isSaved = $state(saved);
  let busy = $state(false);

  async function toggle() {
    if (busy) return;
    busy = true;
    try {
      if (isSaved) {
        const result = await actions.removeFromLibrary({ publicationId });
        if (!result.error) isSaved = false;
      } else {
        const result = await actions.saveToLibrary({ publicationId });
        if (!result.error) isSaved = true;
      }
    } finally {
      busy = false;
    }
  }
</script>

<button
  type="button"
  onclick={toggle}
  disabled={busy}
  aria-pressed={isSaved}
  class="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-surface-raised px-5 py-3 text-[13px] font-semibold text-foreground transition hover:bg-surface disabled:opacity-60"
>
  {#if isSaved}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4z"></path>
    </svg>
  {:else}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"></path>
    </svg>
  {/if}
  {isSaved ? savedLabel : saveLabel}
</button>
