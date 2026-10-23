<script lang="ts">
  let { label = 'Share', copiedLabel = 'Link copied' }: { label?: string; copiedLabel?: string } = $props();

  let copied = $state(false);

  async function share() {
    const url = window.location.href;
    // Prefer the native share sheet when available; otherwise copy the link.
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // User dismissed or share failed; fall back to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard unavailable (non-secure context); do nothing.
    }
  }
</script>

<button
  type="button"
  onclick={share}
  class="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-surface-raised px-5 py-3 text-[13px] font-semibold text-foreground transition hover:bg-surface"
>
  {#if copied}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
    {copiedLabel}
  {:else}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <path d="m8.6 10.8 6.8-4.6M8.6 13.2l6.8 4.6"></path>
    </svg>
    {label}
  {/if}
</button>
