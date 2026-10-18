<script lang="ts">
  import type { MediaCardData } from '@storygalore/ui';

  let { shorts, initialId }: { shorts: MediaCardData[]; initialId: string } = $props();

  let container = $state<HTMLDivElement | undefined>(undefined);

  $effect(() => {
    const el = container;
    if (!el) return;
    const index = Math.max(0, shorts.findIndex((s) => s.id === initialId));
    el.scrollTo({ top: index * el.clientHeight, behavior: 'instant' });
  });
</script>

<div
  bind:this={container}
  class="h-[100dvh] snap-y snap-mandatory overflow-y-scroll"
>
  {#each shorts as short (short.id)}
    <section data-id={short.id} class="relative h-[100dvh] snap-start overflow-hidden bg-black">
      {#if short.coverUrl}
        <img src={short.coverUrl} alt={short.title} class="h-full w-full object-cover" />
      {/if}

      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

      <div class="absolute bottom-20 left-4 right-16 text-white">
        <div class="flex items-center gap-2">
          <span class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-xs font-bold">
            {(short.creatorName ?? '?').charAt(0)}
          </span>
          <span class="text-[13px] font-bold">{short.creatorName ?? '@creator'}</span>
          <a
            href="/auth/login"
            class="ml-1 rounded-full border border-white/60 px-3 py-1 text-[11px] font-bold text-white"
          >
            Follow
          </a>
        </div>
        <p class="mt-2 max-w-[280px] text-[12px] leading-5">{short.title}</p>
      </div>

      <div class="absolute bottom-20 right-3 flex flex-col items-center gap-5 text-white">
        <button type="button" aria-label="Like" class="flex flex-col items-center gap-0.5">
          <span class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12C19 16.4 12 21 12 21z"></path>
            </svg>
          </span>
          <span class="text-[10px] font-bold">1.2k</span>
        </button>
        <button type="button" aria-label="Comment" class="flex flex-col items-center gap-0.5">
          <span class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"></path>
            </svg>
          </span>
          <span class="text-[10px] font-bold">86</span>
        </button>
        <button type="button" aria-label="Share" class="flex flex-col items-center gap-0.5">
          <span class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path>
              <path d="M16 6l-4-4-4 4"></path>
              <path d="M12 2v14"></path>
            </svg>
          </span>
          <span class="text-[10px] font-bold">Share</span>
        </button>
      </div>

      <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-white/25">
        <div class="h-full w-1/3 bg-white"></div>
      </div>
    </section>
  {/each}
</div>
