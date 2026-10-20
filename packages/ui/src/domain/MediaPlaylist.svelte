<script lang="ts">
  import { onDestroy } from 'svelte';
  import { ListVideo, ChevronDown, ChevronUp } from '@lucide/svelte';
  import MediaPlayer from './MediaPlayer.svelte';
  import type { PlaylistItem } from '../types';

  const UP_NEXT_SECONDS = 5;

  let {
    items,
    guarded = false,
    kind = 'video',
    autoplayNext = true,
    initialIndex = 0,
    onitemchange,
    class: className = '',
  }: {
    items: PlaylistItem[];
    guarded?: boolean;
    kind?: 'video' | 'audio';
    autoplayNext?: boolean;
    initialIndex?: number;
    onitemchange?: (index: number, item: PlaylistItem) => void;
    class?: string;
  } = $props();

  let currentIndex = $state(initialIndex);
  let upNext = $state(false);
  let countdown = $state(UP_NEXT_SECONDS);
  let tracklistOpen = $state(false);
  let wantsPlay = $state(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const current = $derived(items[currentIndex]);
  const hasNext = $derived(currentIndex < items.length - 1);

  function advance(next: number) {
    clearInterval(timer);
    upNext = false;
    if (next < 0 || next >= items.length) return;
    currentIndex = next;
    wantsPlay = true;
    onitemchange?.(next, items[next]);
  }

  function onEnded() {
    if (!autoplayNext || !hasNext) return;
    upNext = true;
    countdown = UP_NEXT_SECONDS;
    clearInterval(timer);
    timer = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(timer);
        advance(currentIndex + 1);
      }
    }, 1000);
  }

  function cancelUpNext() {
    clearInterval(timer);
    upNext = false;
  }

  onDestroy(() => clearInterval(timer));
</script>

<div class={className}>
  <div class="relative">
    {#if current}
      {#key currentIndex}
        <MediaPlayer
          src={current.src}
          {kind}
          guarded={guarded}
          autoplay={wantsPlay}
          onended={onEnded}
          class="aspect-video w-full rounded-md"
        />
      {/key}
    {/if}

    {#if upNext && hasNext}
      <div
        class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-12 text-white"
      >
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-wide text-white/70">Up next</p>
          <p class="truncate text-sm font-semibold">{items[currentIndex + 1].label}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onclick={() => advance(currentIndex + 1)}
            class="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Play now
          </button>
          <button
            type="button"
            onclick={cancelUpNext}
            class="rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Cancel
          </button>
          <span class="text-xs tabular-nums text-white/80">{countdown}s</span>
        </div>
      </div>
    {/if}
  </div>

  {#if items.length > 1}
    <div class="mt-2 rounded-md border border-border bg-surface">
      <button
        type="button"
        onclick={() => (tracklistOpen = !tracklistOpen)}
        class="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-foreground"
      >
        <span class="flex items-center gap-2"><ListVideo size={16} /> Playlist ({items.length})</span>
        {#if tracklistOpen}
          <ChevronUp size={16} />
        {:else}
          <ChevronDown size={16} />
        {/if}
      </button>

      {#if tracklistOpen}
        <ul class="border-t border-border">
          {#each items as item, i (item.id ?? item.src)}
            <li>
              <button
                type="button"
                onclick={() => advance(i)}
                class:bg-surface-elevated={i === currentIndex}
                class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-surface-elevated"
              >
                <span class="w-5 shrink-0 text-center text-xs tabular-nums text-foreground-muted">
                  {i === currentIndex ? '▶' : i + 1}
                </span>
                <span class:font-semibold={i === currentIndex} class="truncate">{item.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
