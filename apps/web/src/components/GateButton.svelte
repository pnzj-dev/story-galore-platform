<script lang="ts">
  let {
    label,
    dialogId,
    icon = 'play',
  }: {
    label: string;
    dialogId: string;
    icon?: 'play' | 'book';
  } = $props();

  function open() {
    (document.getElementById(dialogId) as HTMLDialogElement | null)?.showModal();
  }
</script>

<button
  type="button"
  onclick={open}
  class="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
>
  {#if icon === 'book'}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  {:else}
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"></path>
    </svg>
  {/if}
  {label}
</button>
