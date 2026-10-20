<script lang="ts">
  let {
    src,
    alt = '',
    guarded = true,
    zoomable = false,
    class: className = '',
  }: {
    src: string;
    alt?: string;
    /** Disable right-click, drag-to-save, and text selection for protected media. */
    guarded?: boolean;
    /** Allow click-to-zoom (opens a lightbox overlay). */
    zoomable?: boolean;
    class?: string;
  } = $props();

  let open = $state(false);

  function blockContextMenu(e: MouseEvent) {
    if (guarded) e.preventDefault();
  }
</script>

<img
  {src}
  {alt}
  loading="lazy"
  draggable={guarded ? 'false' : undefined}
  oncontextmenu={blockContextMenu}
  onclick={zoomable ? () => (open = true) : undefined}
  class:select-none={guarded}
  style={guarded ? '-webkit-user-drag: none;' : undefined}
  class={className}
/>

{#if zoomable && open}
  <div
    class="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-6"
    onclick={() => (open = false)}
    role="dialog"
    aria-label={alt || 'Image viewer'}
  >
    <img
      {src}
      {alt}
      draggable="false"
      oncontextmenu={blockContextMenu}
      class="max-h-full max-w-full select-none object-contain"
    />
  </div>
{/if}
