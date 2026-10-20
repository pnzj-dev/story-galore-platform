<script lang="ts">
  import { actions } from 'astro:actions';
  import { ImageViewer } from '@storygalore/ui';

  interface ReaderPage {
    url?: string;
    text?: string;
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

  function jump(delta: number) {
    if (!container) return;
    const next = Math.max(0, Math.min(pages.length - 1, currentPosition + delta));
    const target = container.querySelector<HTMLElement>(`[data-position="${next}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $effect(() => {
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  });

  let percent = $derived(
    pages.length ? Math.round(((currentPosition + 1) / pages.length) * 100) : 0,
  );
</script>

<div class="relative mx-auto max-w-2xl">
  <div bind:this={container} class="max-h-[70vh] space-y-6 overflow-y-auto py-4 pb-24">
    {#each pages as page (page.position)}
      {#if page.text}
        <div data-position={page.position} class="px-1">
          <p class="font-serif text-lg leading-loose text-foreground">
            <span
              class="float-left mr-2 mt-1 font-serif text-[44px] font-bold leading-[0.9] text-brand-400"
            >
              {page.text.charAt(0)}
            </span>
            {page.text.slice(1)}
          </p>
        </div>
      {:else}
        <div data-position={page.position} class="flex justify-center">
          {#if page.url}
            <ImageViewer
              src={page.url}
              alt={`Page ${page.position + 1}`}
              guarded
              class="max-h-[60vh] w-auto rounded-sm border border-border"
            />
          {:else}
            <div
              class="flex aspect-[3/4] w-full items-center justify-center rounded-sm border border-border bg-surface text-foreground-muted"
            >
              Page {page.position + 1}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  {#if pages.length > 0}
    <div
      class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur lg:left-1/2 lg:max-w-2xl lg:-translate-x-1/2 lg:rounded-t-xl lg:border lg:border-b-0"
    >
      <div class="flex items-center justify-between gap-3 px-5 py-3">
        <span class="text-[11px] text-foreground-muted">
          Page {currentPosition + 1} of {pages.length}
        </span>
        <div class="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous page"
            onclick={() => jump(-1)}
            disabled={currentPosition === 0}
            class="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-elevated disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next page"
            onclick={() => jump(1)}
            disabled={currentPosition === pages.length - 1}
            class="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-elevated disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="h-[3px] w-full bg-surface-elevated">
        <div class="h-full bg-brand-500 transition-all" style={`width:${percent}%`}></div>
      </div>
    </div>
  {/if}
</div>
