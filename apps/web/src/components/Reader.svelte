<script lang="ts">
  import { actions } from 'astro:actions';

  interface ReaderPage {
    url?: string;
    position: number;
  }

  let {
    publicationId,
    pages,
    initialPosition = 0,
    canSync = false,
  }: {
    publicationId: string;
    pages: ReaderPage[];
    initialPosition?: number;
    canSync?: boolean;
  } = $props();

  let container = $state<HTMLDivElement | undefined>(undefined);
  let currentPosition = $state(initialPosition);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function saveProgress(position: number) {
    if (!canSync || pages.length === 0) return;
    const percentComplete = Math.round(((position + 1) / pages.length) * 100);
    clearTimeout(timer);
    timer = setTimeout(() => {
      actions.saveReadingProgress({ publicationId, position, percentComplete }).catch(() => {});
    }, 800);
  }

  function handleScroll() {
    if (!container) return;
    const els = container.querySelectorAll<HTMLElement>('[data-position]');
    const center = container.scrollTop + container.clientHeight / 2;
    let best = -1;
    let bestDist = Infinity;
    for (const el of els) {
      const dist = Math.abs(el.offsetTop - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = Number(el.dataset.position);
      }
    }
    if (best >= 0 && best !== currentPosition) {
      currentPosition = best;
      saveProgress(best);
    }
  }

  $effect(() => {
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  });
</script>

<div bind:this={container} class="relative mx-auto max-h-[80vh] max-w-2xl space-y-6 overflow-y-auto py-4">
  {#each pages as page (page.position)}
    <div data-position={page.position} class="flex justify-center">
      {#if page.url}
        <img
          src={page.url}
          alt={`Page ${page.position + 1}`}
          class="max-h-[70vh] w-auto rounded-lg border border-border"
          loading="lazy"
        />
      {:else}
        <div
          class="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted"
        >
          Page {page.position + 1}
        </div>
      {/if}
    </div>
  {/each}
</div>
